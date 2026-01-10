from fastapi import HTTPException, status, Depends
from auth import get_current_user_email
from database import db

async def verify_admin(email: str = Depends(get_current_user_email)):
    """Middleware to verify if user is admin or admin_senior"""
    user = await db.users.find_one({"email": email})
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Allow both admin and admin_senior
    if user.get('user_type') not in ['admin', 'admin_senior']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Admin privileges required."
        )
    
    if user.get('status') != 'active':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin account is not active"
        )
    
    return user

async def verify_master_admin(email: str = Depends(get_current_user_email)):
    """Middleware to verify if user is MASTER admin only"""
    user = await db.users.find_one({"email": email})
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Only master admin
    if user.get('user_type') != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Master Admin privileges required."
        )
    
    if user.get('status') != 'active':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin account is not active"
        )
    
    return user

async def get_current_admin(email: str = Depends(get_current_user_email)):
    """Get current admin user (admin or admin_senior)"""
    return await verify_admin(email)
