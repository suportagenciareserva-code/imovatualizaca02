from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List
from datetime import datetime
from enum import Enum

# Enums
class UserType(str, Enum):
    particular = "particular"  # Só pode anunciar Aluguel e Aluguel por Temporada
    corretor = "corretor"      # Pode anunciar todos os tipos (Venda, Aluguel, etc.)
    admin = "admin"

class UserStatus(str, Enum):
    active = "active"
    pending = "pending"
    paused = "paused"
    deleted = "deleted"

class PlanType(str, Enum):
    free = "free"           # Plano gratuito (limitado)
    monthly = "monthly"     # Plano mensal
    lifetime = "lifetime"   # Acesso vitalício

class PropertyPurpose(str, Enum):
    venda = "VENDA"
    aluguel = "ALUGUEL"
    aluguel_temporada = "ALUGUEL_TEMPORADA"

class PropertyType(str, Enum):
    apartamento = "Apartamento"
    casa_terrea = "Casa-Térrea"
    casa_terrea_condominio = "Casa-Térrea-Condomínio"
    casa_vila = "Casa de Vila"
    sobrado = "Sobrado"
    sobrado_condominio = "Sobrado-Condomínio"
    kitnet = "Kitnet"
    studio = "Studio"
    flat = "Apart Hotel / Flat / Loft"
    cobertura = "Apto. Cobertura / Duplex"
    terreno = "Terreno"
    terreno_condominio = "Terreno-Condomínio"
    comercial = "Imóvel Comercial"
    sala_loja = "Sala / Salão / Loja"
    galpao = "Galpão / Depósito"
    sitio = "Sítio / Fazenda / Chácara"

# User Models
class UserBase(BaseModel):
    name: str
    email: EmailStr
    phone: str
    cpf: str
    city: str
    state: str
    user_type: UserType
    creci: Optional[str] = None
    company: Optional[str] = None
    status: Optional[UserStatus] = UserStatus.active
    plan_type: Optional[PlanType] = PlanType.free
    plan_expires_at: Optional[datetime] = None  # None para plano vitalício
    profile_photo: Optional[str] = None
    bio: Optional[str] = None  # Descrição do profissional (máx 750 caracteres)

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(UserBase):
    id: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class UserInDB(User):
    hashed_password: str

# Property Models
class PropertyBase(BaseModel):
    title: str
    description: str
    property_type: PropertyType
    purpose: PropertyPurpose
    price: float
    neighborhood: str
    city: str
    state: str
    bedrooms: Optional[int] = None
    bathrooms: Optional[int] = None
    area: Optional[float] = None
    garage: Optional[int] = None
    year_built: Optional[int] = None
    condominio: Optional[float] = None
    iptu: Optional[float] = None
    features: Optional[List[str]] = []
    images: Optional[List[str]] = []
    is_launch: bool = False

class PropertyCreate(PropertyBase):
    pass

class PropertyUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    property_type: Optional[PropertyType] = None
    purpose: Optional[PropertyPurpose] = None
    price: Optional[float] = None
    neighborhood: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    bedrooms: Optional[int] = None
    bathrooms: Optional[int] = None
    area: Optional[float] = None
    garage: Optional[int] = None
    year_built: Optional[int] = None
    condominio: Optional[float] = None
    iptu: Optional[float] = None
    features: Optional[List[str]] = None
    images: Optional[List[str]] = None
    is_launch: Optional[bool] = None

class Property(PropertyBase):
    id: str
    owner_id: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class PropertyWithOwner(PropertyBase):
    """Property model with owner information for public listing"""
    id: str
    owner_id: str
    owner_name: Optional[str] = None
    owner_phone: Optional[str] = None
    owner_photo: Optional[str] = None
    owner_bio: Optional[str] = None
    owner_creci: Optional[str] = None
    owner_company: Optional[str] = None
    owner_user_type: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Token Models
class Token(BaseModel):
    access_token: str
    token_type: str
    user: User

class TokenData(BaseModel):
    email: Optional[str] = None



# ==========================================
# AGENDAMENTO DE VISITAS
# ==========================================

class VisitStatus(str, Enum):
    pending = "pending"       # Aguardando confirmação
    confirmed = "confirmed"   # Confirmada
    completed = "completed"   # Realizada
    cancelled = "cancelled"   # Cancelada

class VisitScheduleCreate(BaseModel):
    """Dados para criar um agendamento de visita"""
    property_id: str
    visitor_name: str = Field(..., min_length=2, max_length=100)
    visitor_phone: str = Field(..., min_length=10, max_length=20)
    visitor_email: Optional[EmailStr] = None
    visit_date: str  # Data no formato YYYY-MM-DD
    visit_time: str  # Hora no formato HH:MM
    message: Optional[str] = Field(None, max_length=500)

class VisitSchedule(BaseModel):
    """Modelo completo de agendamento"""
    id: str
    property_id: str
    property_title: str
    property_address: str
    owner_id: str
    owner_name: str
    owner_email: str
    visitor_name: str
    visitor_phone: str
    visitor_email: Optional[str] = None
    visit_date: str
    visit_time: str
    message: Optional[str] = None
    status: VisitStatus = VisitStatus.pending
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# ==========================================
# SISTEMA DE NOTIFICAÇÕES
# ==========================================

class NotificationType(str, Enum):
    visit_scheduled = "visit_scheduled"     # Nova visita agendada
    visit_confirmed = "visit_confirmed"     # Visita confirmada
    visit_cancelled = "visit_cancelled"     # Visita cancelada
    new_message = "new_message"             # Nova mensagem
    system = "system"                       # Notificação do sistema

class NotificationCreate(BaseModel):
    """Dados para criar uma notificação"""
    user_id: str
    type: NotificationType
    title: str
    message: str
    data: Optional[dict] = None  # Dados adicionais (ex: ID do agendamento)

class Notification(BaseModel):
    """Modelo completo de notificação"""
    id: str
    user_id: str
    type: NotificationType
    title: str
    message: str
    data: Optional[dict] = None
    read: bool = False
    created_at: datetime

    class Config:
        from_attributes = True
