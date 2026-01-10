from fastapi import APIRouter, HTTPException, status, Depends
from typing import List, Optional
from pydantic import BaseModel, EmailStr
from middlewares.admin_middleware import get_current_admin
from database import db
from datetime import datetime, timedelta
from passlib.context import CryptContext
import uuid

router = APIRouter(prefix="/admin", tags=["admin"])

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Dashboard Stats Model
class DashboardStats(BaseModel):
    total_properties: int
    total_users: int
    total_services: int
    pending_users: int
    active_users: int
    paused_users: int
    properties_by_purpose: dict
    recent_registrations: List[dict]
    properties_by_city: dict

# User Management Models
class UserCreate(BaseModel):
    """Model for admin to create new users"""
    name: str
    email: EmailStr
    password: str
    phone: str
    cpf: str
    city: str
    state: str
    user_type: str  # 'particular' or 'corretor'
    creci: Optional[str] = None
    company: Optional[str] = None

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    cpf: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    status: Optional[str] = None
    user_type: Optional[str] = None
    creci: Optional[str] = None
    company: Optional[str] = None
    cnpj: Optional[str] = None
    razao_social: Optional[str] = None
    plan_type: Optional[str] = None
    bio: Optional[str] = None

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    phone: str
    city: str
    state: str
    user_type: str
    status: str
    created_at: datetime
    properties_count: int = 0

@router.get("/dashboard", response_model=DashboardStats)
async def get_dashboard_stats(admin = Depends(get_current_admin)):
    """Get dashboard statistics (Admin only)"""
    
    # Total counts
    total_properties = await db.properties.count_documents({})
    total_users = await db.users.count_documents({"user_type": {"$ne": "admin"}})
    total_services = await db.service_providers.count_documents({})
    pending_users = await db.users.count_documents({"status": "pending"})
    active_users = await db.users.count_documents({"status": "active", "user_type": {"$ne": "admin"}})
    paused_users = await db.users.count_documents({"status": "paused"})
    
    # Properties by purpose
    properties_venda = await db.properties.count_documents({"purpose": "VENDA"})
    properties_aluguel = await db.properties.count_documents({"purpose": "ALUGUEL"})
    properties_temporada = await db.properties.count_documents({"purpose": "ALUGUEL_TEMPORADA"})
    
    properties_by_purpose = {
        "VENDA": properties_venda,
        "ALUGUEL": properties_aluguel,
        "ALUGUEL_TEMPORADA": properties_temporada
    }
    
    # Recent registrations (last 7 days)
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    recent_users = await db.users.find(
        {"created_at": {"$gte": seven_days_ago}, "user_type": {"$ne": "admin"}}
    ).sort("created_at", -1).limit(5).to_list(5)
    
    recent_registrations = [
        {
            "name": user['name'],
            "email": user['email'],
            "type": user['user_type'],
            "date": user['created_at'].strftime("%d/%m/%Y")
        }
        for user in recent_users
    ]
    
    # Properties by city (top 5)
    pipeline = [
        {"$group": {"_id": "$city", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 5}
    ]
    cities = await db.properties.aggregate(pipeline).to_list(5)
    properties_by_city = {city['_id']: city['count'] for city in cities}
    
    return DashboardStats(
        total_properties=total_properties,
        total_users=total_users,
        total_services=total_services,
        pending_users=pending_users,
        active_users=active_users,
        paused_users=paused_users,
        properties_by_purpose=properties_by_purpose,
        recent_registrations=recent_registrations,
        properties_by_city=properties_by_city
    )

# =============================================
# USER MANAGEMENT ROUTES
# =============================================

@router.post("/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(user_data: UserCreate, admin = Depends(get_current_admin)):
    """Create a new user (Admin only)"""
    
    # Check if email already exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email já cadastrado"
        )
    
    # Validate user_type
    valid_types = ['particular', 'corretor', 'imobiliaria', 'admin_senior']
    if user_data.user_type not in valid_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Tipo de usuário inválido. Use: {', '.join(valid_types)}"
        )
    
    # Create user document
    user_id = str(uuid.uuid4())
    new_user = {
        'id': user_id,
        'name': user_data.name,
        'email': user_data.email,
        'phone': user_data.phone,
        'cpf': user_data.cpf,
        'city': user_data.city,
        'state': user_data.state,
        'user_type': user_data.user_type,
        'creci': user_data.creci,
        'company': user_data.company,
        'status': 'active',  # New users created by admin are active by default
        'hashed_password': pwd_context.hash(user_data.password),
        'created_at': datetime.utcnow()
    }
    
    await db.users.insert_one(new_user)
    
    return UserResponse(
        id=user_id,
        name=new_user['name'],
        email=new_user['email'],
        phone=new_user['phone'],
        city=new_user['city'],
        state=new_user['state'],
        user_type=new_user['user_type'],
        status=new_user['status'],
        created_at=new_user['created_at'],
        properties_count=0
    )

@router.get("/users", response_model=List[UserResponse])
async def get_all_users(
    status: Optional[str] = None,
    user_type: Optional[str] = None,
    limit: int = 100,
    skip: int = 0,
    admin = Depends(get_current_admin)
):
    """Get all users (Admin only) with pagination"""
    match_query = {"user_type": {"$ne": "admin"}}
    
    if status:
        match_query["status"] = status
    if user_type:
        match_query["user_type"] = user_type
    
    # Use aggregation pipeline to avoid N+1 queries
    pipeline = [
        {"$match": match_query},
        {"$sort": {"created_at": -1}},
        {"$skip": skip},
        {"$limit": limit},
        {
            "$lookup": {
                "from": "properties",
                "localField": "id",
                "foreignField": "owner_id",
                "as": "properties"
            }
        },
        {
            "$addFields": {
                "properties_count": {"$size": "$properties"}
            }
        },
        {
            "$project": {
                "properties": 0,
                "hashed_password": 0,
                "_id": 0
            }
        }
    ]
    
    users = await db.users.aggregate(pipeline).to_list(limit)
    
    users_response = [
        UserResponse(
            id=user['id'],
            name=user['name'],
            email=user['email'],
            phone=user['phone'],
            city=user['city'],
            state=user['state'],
            user_type=user['user_type'],
            status=user.get('status', 'active'),
            created_at=user['created_at'],
            properties_count=user.get('properties_count', 0)
        )
        for user in users
    ]
    
    return users_response

@router.put("/users/{user_id}")
async def update_user(
    user_id: str,
    user_update: UserUpdate,
    admin = Depends(get_current_admin)
):
    """Update user (Admin only) - Full edit capability"""
    user = await db.users.find_one({"id": user_id})
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado"
        )
    
    if user.get('user_type') == 'admin' and admin.get('id') != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Não é permitido modificar outros administradores"
        )
    
    # Build update data from non-None fields
    update_data = {}
    update_dict = user_update.dict(exclude_unset=True)
    
    for key, value in update_dict.items():
        if value is not None:
            update_data[key] = value
    
    # Validate email uniqueness if changing email
    if 'email' in update_data and update_data['email'] != user.get('email'):
        existing = await db.users.find_one({"email": update_data['email']})
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email já está em uso por outro usuário"
            )
    
    # Validate user_type
    if 'user_type' in update_data:
        valid_types = ['particular', 'corretor', 'imobiliaria', 'admin', 'admin_senior']
        if update_data['user_type'] not in valid_types:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Tipo de usuário inválido. Use: {', '.join(valid_types)}"
            )
    
    # Validate status
    if 'status' in update_data:
        valid_statuses = ['active', 'pending', 'paused', 'deleted']
        if update_data['status'] not in valid_statuses:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Status inválido. Use: {', '.join(valid_statuses)}"
            )
    
    # Validate plan_type
    if 'plan_type' in update_data:
        valid_plans = ['free', 'trimestral', 'anual', 'lifetime']
        if update_data['plan_type'] not in valid_plans:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Plano inválido. Use: {', '.join(valid_plans)}"
            )
    
    if update_data:
        update_data['updated_at'] = datetime.utcnow()
        await db.users.update_one({"id": user_id}, {"$set": update_data})
    
    # Get updated user
    updated_user = await db.users.find_one({"id": user_id})
    
    return {
        "message": "Usuário atualizado com sucesso",
        "user_id": user_id,
        "updated_fields": list(update_data.keys())
    }


@router.get("/users/{user_id}")
async def get_user_details(
    user_id: str,
    admin = Depends(get_current_admin)
):
    """Get detailed user info (Admin only)"""
    user = await db.users.find_one({"id": user_id})
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado"
        )
    
    # Count properties
    properties_count = await db.properties.count_documents({"owner_id": user_id})
    
    # Remove sensitive data
    user.pop('hashed_password', None)
    user.pop('_id', None)
    user['properties_count'] = properties_count
    
    return user

@router.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    admin = Depends(get_current_admin)
):
    """Delete user and all their data (Admin only)"""
    user = await db.users.find_one({"id": user_id})
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if user.get('user_type') == 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot delete admin users"
        )
    
    # Delete user's properties
    await db.properties.delete_many({"owner_id": user_id})
    
    # Delete user's service providers
    await db.service_providers.delete_many({"owner_id": user_id})
    
    # Delete user
    await db.users.delete_one({"id": user_id})
    
    return {"message": "User and all associated data deleted successfully", "user_id": user_id}

@router.get("/properties")
async def get_all_properties(
    limit: int = 100,
    skip: int = 0,
    admin = Depends(get_current_admin)
):
    """Get all properties with owner info (Admin only) using aggregation"""
    pipeline = [
        {"$sort": {"created_at": -1}},
        {"$skip": skip},
        {"$limit": limit},
        {
            "$lookup": {
                "from": "users",
                "localField": "owner_id",
                "foreignField": "id",
                "as": "owner"
            }
        },
        {
            "$addFields": {
                "owner_name": {"$ifNull": [{"$arrayElemAt": ["$owner.name", 0]}, "Unknown"]},
                "owner_email": {"$ifNull": [{"$arrayElemAt": ["$owner.email", 0]}, "Unknown"]}
            }
        },
        {
            "$project": {
                "owner": 0,
                "_id": 0
            }
        }
    ]
    
    properties = await db.properties.aggregate(pipeline).to_list(limit)
    return properties

@router.delete("/properties/{property_id}")
async def delete_property_admin(
    property_id: str,
    admin = Depends(get_current_admin)
):
    """Delete any property (Admin only)"""
    result = await db.properties.delete_one({"id": property_id})
    
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Property not found"
        )
    
    return {"message": "Property deleted successfully", "property_id": property_id}

@router.delete("/services/{service_id}")
async def delete_service_admin(
    service_id: str,
    admin = Depends(get_current_admin)
):
    """Delete any service provider (Admin only)"""
    result = await db.service_providers.delete_one({"id": service_id})
    
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service provider not found"
        )
    
    return {"message": "Service provider deleted successfully", "service_id": service_id}



# ==========================================
# MURAL DE OPORTUNIDADES - Admin Stats
# ==========================================

@router.get("/mural-oportunidades/stats")
async def get_mural_stats(admin = Depends(get_current_admin)):
    """
    Estatísticas do Mural de Oportunidades para Admin
    Mostra dados sobre demandas e parcerias realizadas
    """
    
    # Total de demandas
    total_demands = await db.demands.count_documents({})
    active_demands = await db.demands.count_documents({"status": "active"})
    negotiating_demands = await db.demands.count_documents({"status": "negotiating"})
    closed_demands = await db.demands.count_documents({"status": "closed"})
    
    # Total de propostas
    total_proposals = await db.proposals.count_documents({})
    pending_proposals = await db.proposals.count_documents({"status": "pending"})
    accepted_proposals = await db.proposals.count_documents({"status": "accepted"})
    rejected_proposals = await db.proposals.count_documents({"status": "rejected"})
    
    # Demandas por tipo de imóvel
    demands_by_type = await db.demands.aggregate([
        {"$group": {"_id": "$tipo_imovel", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]).to_list(20)
    
    # Taxa de conversão (propostas aceitas / total de propostas)
    conversion_rate = (accepted_proposals / total_proposals * 100) if total_proposals > 0 else 0
    
    # Top corretores com mais demandas
    top_demandantes = await db.demands.aggregate([
        {"$group": {"_id": "$corretor_id", "name": {"$first": "$corretor_name"}, "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 10}
    ]).to_list(10)
    
    # Top corretores com mais propostas aceitas
    top_ofertantes = await db.proposals.aggregate([
        {"$match": {"status": "accepted"}},
        {"$group": {"_id": "$ofertante_id", "name": {"$first": "$ofertante_name"}, "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 10}
    ]).to_list(10)
    
    # Demandas recentes (últimos 7 dias)
    from datetime import timedelta
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    recent_demands = await db.demands.count_documents({"created_at": {"$gte": seven_days_ago}})
    
    # Todas as demandas com detalhes
    all_demands = await db.demands.aggregate([
        {"$sort": {"created_at": -1}},
        {"$limit": 50},
        {
            "$lookup": {
                "from": "proposals",
                "localField": "id",
                "foreignField": "demand_id",
                "as": "proposals"
            }
        },
        {
            "$addFields": {
                "proposals_count": {"$size": "$proposals"},
                "accepted_count": {
                    "$size": {
                        "$filter": {
                            "input": "$proposals",
                            "as": "p",
                            "cond": {"$eq": ["$$p.status", "accepted"]}
                        }
                    }
                }
            }
        },
        {"$project": {"proposals": 0, "_id": 0}}
    ]).to_list(50)
    
    return {
        "summary": {
            "total_demands": total_demands,
            "active_demands": active_demands,
            "negotiating_demands": negotiating_demands,
            "closed_demands": closed_demands,
            "total_proposals": total_proposals,
            "pending_proposals": pending_proposals,
            "accepted_proposals": accepted_proposals,
            "rejected_proposals": rejected_proposals,
            "conversion_rate": round(conversion_rate, 2),
            "recent_demands_7d": recent_demands
        },
        "demands_by_type": {d["_id"]: d["count"] for d in demands_by_type},
        "top_demandantes": top_demandantes,
        "top_ofertantes": top_ofertantes,
        "recent_demands": all_demands
    }


@router.get("/mural-oportunidades/demands")
async def get_all_demands_admin(
    status: str = None,
    limit: int = 100,
    skip: int = 0,
    admin = Depends(get_current_admin)
):
    """Lista todas as demandas do mural (Admin only)"""
    
    query = {}
    if status:
        query["status"] = status
    
    demands = await db.demands.aggregate([
        {"$match": query},
        {"$sort": {"created_at": -1}},
        {"$skip": skip},
        {"$limit": limit},
        {
            "$lookup": {
                "from": "proposals",
                "localField": "id",
                "foreignField": "demand_id",
                "as": "proposals_list"
            }
        },
        {
            "$addFields": {
                "total_proposals": {"$size": "$proposals_list"},
                "accepted_proposals": {
                    "$size": {
                        "$filter": {
                            "input": "$proposals_list",
                            "as": "p",
                            "cond": {"$eq": ["$$p.status", "accepted"]}
                        }
                    }
                }
            }
        },
        {"$project": {"proposals_list": 0, "_id": 0}}
    ]).to_list(limit)
    
    return demands
