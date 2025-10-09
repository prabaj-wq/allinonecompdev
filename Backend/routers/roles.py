from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import ProgrammingError
from typing import List, Optional
from database import get_db, User
# Note: Role, Permission, RolePermission, UserRole models moved to company-specific databases
from datetime import datetime
from pydantic import BaseModel
import os
import json

def is_first_install() -> bool:
    """Check if this is the first installation"""
    flag_file = "config/first_install.json"
    if os.path.exists(flag_file):
        try:
            with open(flag_file, 'r') as f:
                data = json.load(f)
                return data.get("first_install", True)
        except:
            return True
    return True

router = APIRouter(prefix="/roles", tags=["Role Management"])

class RoleCreate(BaseModel):
    role_code: str
    name: str
    description: Optional[str] = None
    is_system_role: bool = False

class RoleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None

class PermissionCreate(BaseModel):
    permission_code: str
    name: str
    description: Optional[str] = None
    module: Optional[str] = None
    action: Optional[str] = None
    resource: Optional[str] = None

class RolePermissionAssign(BaseModel):
    permission_ids: List[int]

class UserRoleAssign(BaseModel):
    user_id: int
    role_id: int

# Move the permissions routes before the role-specific routes to avoid conflicts
@router.get("/permissions")
def list_permissions(db: Session = Depends(get_db)):
    """List all permissions"""
    # If this is a first install, return empty list
    if is_first_install():
        return []
    
    try:
        permissions = db.query(Permission).all()
        return permissions
    except ProgrammingError:
        # Database tables don't exist yet
        return []

@router.post("/permissions", status_code=status.HTTP_201_CREATED)
def create_permission(permission: PermissionCreate, db: Session = Depends(get_db)):
    """Create a new permission"""
    # If this is a first install, return error
    if is_first_install():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot create permissions during first install"
        )
    
    try:
        # Check if permission with same code already exists
        existing_permission = db.query(Permission).filter(Permission.permission_code == permission.permission_code).first()
        if existing_permission:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Permission with this code already exists"
            )
        
        db_permission = Permission(
            permission_code=permission.permission_code,
            name=permission.name,
            description=permission.description,
            module=permission.module,
            action=permission.action,
            resource=permission.resource
        )
        db.add(db_permission)
        db.commit()
        db.refresh(db_permission)
        return db_permission
    except ProgrammingError:
        # Database tables don't exist yet
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot create permissions during first install"
        )

@router.get("/")
def list_roles(db: Session = Depends(get_db)):
    """List all roles"""
    # If this is a first install, return empty list
    if is_first_install():
        return []
    
    try:
        roles = db.query(Role).all()
        return roles
    except ProgrammingError:
        # Database tables don't exist yet
        return []

@router.post("/", status_code=status.HTTP_201_CREATED)
def create_role(role: RoleCreate, db: Session = Depends(get_db)):
    """Create a new role"""
    # If this is a first install, return error
    if is_first_install():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot create roles during first install"
        )
    
    try:
        # Check if role with same code already exists
        existing_role = db.query(Role).filter(Role.role_code == role.role_code).first()
        if existing_role:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Role with this code already exists"
            )
        
        db_role = Role(
            role_code=role.role_code,
            name=role.name,
            description=role.description,
            is_system_role=role.is_system_role
        )
        db.add(db_role)
        db.commit()
        db.refresh(db_role)
        return db_role
    except ProgrammingError:
        # Database tables don't exist yet
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot create roles during first install"
        )

@router.get("/{role_id}")
def get_role(role_id: int, db: Session = Depends(get_db)):
    """Get a specific role by ID"""
    # If this is a first install, return 404
    if is_first_install():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found"
        )
    
    try:
        role = db.query(Role).filter(Role.id == role_id).first()
        if not role:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Role not found"
            )
        return role
    except ProgrammingError:
        # Database tables don't exist yet
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found"
        )

@router.put("/{role_id}")
def update_role(role_id: int, role_update: RoleUpdate, db: Session = Depends(get_db)):
    """Update a role"""
    # If this is a first install, return 404
    if is_first_install():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found"
        )
    
    try:
        db_role = db.query(Role).filter(Role.id == role_id).first()
        if not db_role:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Role not found"
            )
        
        if role_update.name is not None:
            db_role.name = role_update.name
        if role_update.description is not None:
            db_role.description = role_update.description
        if role_update.is_active is not None:
            db_role.is_active = role_update.is_active
        db_role.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(db_role)
        return db_role
    except ProgrammingError:
        # Database tables don't exist yet
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found"
        )

@router.delete("/{role_id}")
def delete_role(role_id: int, db: Session = Depends(get_db)):
    """Delete a role"""
    # If this is a first install, return 404
    if is_first_install():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found"
        )
    
    try:
        db_role = db.query(Role).filter(Role.id == role_id).first()
        if not db_role:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Role not found"
            )
        
        # Check if role is assigned to any users
        user_roles = db.query(UserRole).filter(UserRole.role_id == role_id).all()
        if user_roles:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete role that is assigned to users"
            )
        
        db.delete(db_role)
        db.commit()
        return {"message": "Role deleted successfully"}
    except ProgrammingError:
        # Database tables don't exist yet
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found"
        )

@router.get("/{role_id}/permissions")
def get_role_permissions(role_id: int, db: Session = Depends(get_db)):
    """Get all permissions for a role"""
    # If this is a first install, return empty list
    if is_first_install():
        return []
    
    try:
        role = db.query(Role).filter(Role.id == role_id).first()
        if not role:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Role not found"
            )
        
        role_permissions = db.query(RolePermission).filter(RolePermission.role_id == role_id).all()
        permission_ids = [rp.permission_id for rp in role_permissions]
        permissions = db.query(Permission).filter(Permission.id.in_(permission_ids)).all()
        return permissions
    except ProgrammingError:
        # Database tables don't exist yet
        return []

@router.post("/{role_id}/permissions")
def assign_permissions_to_role(role_id: int, permission_assign: RolePermissionAssign, db: Session = Depends(get_db)):
    """Assign permissions to a role"""
    # If this is a first install, return error
    if is_first_install():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot assign permissions during first install"
        )
    
    try:
        # Check if role exists
        role = db.query(Role).filter(Role.id == role_id).first()
        if not role:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Role not found"
            )
        
        # Assign permissions
        for permission_id in permission_assign.permission_ids:
            # Check if permission exists
            permission = db.query(Permission).filter(Permission.id == permission_id).first()
            if not permission:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Permission with ID {permission_id} not found"
                )
            
            # Check if assignment already exists
            existing_assignment = db.query(RolePermission).filter(
                RolePermission.role_id == role_id,
                RolePermission.permission_id == permission_id
            ).first()
            
            if not existing_assignment:
                role_permission = RolePermission(
                    role_id=role_id,
                    permission_id=permission_id,
                    granted=True
                )
                db.add(role_permission)
        
        db.commit()
        return {"message": "Permissions assigned to role successfully"}
    except ProgrammingError:
        # Database tables don't exist yet
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot assign permissions during first install"
        )

@router.delete("/{role_id}/permissions/{permission_id}")
def remove_permission_from_role(role_id: int, permission_id: int, db: Session = Depends(get_db)):
    """Remove a permission from a role"""
    # If this is a first install, return 404
    if is_first_install():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role-permission assignment not found"
        )
    
    try:
        role_permission = db.query(RolePermission).filter(
            RolePermission.role_id == role_id,
            RolePermission.permission_id == permission_id
        ).first()
        
        if not role_permission:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Role-permission assignment not found"
            )
        
        db.delete(role_permission)
        db.commit()
        return {"message": "Permission removed from role successfully"}
    except ProgrammingError:
        # Database tables don't exist yet
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role-permission assignment not found"
        )

@router.post("/user-roles")
def assign_role_to_user(user_role_assign: UserRoleAssign, db: Session = Depends(get_db)):
    """Assign a role to a user"""
    # If this is a first install, return error
    if is_first_install():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot assign roles during first install"
        )
    
    try:
        # Check if user exists
        user = db.query(User).filter(User.id == user_role_assign.user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Check if role exists
        role = db.query(Role).filter(Role.id == user_role_assign.role_id).first()
        if not role:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Role not found"
            )
        
        # Check if assignment already exists
        existing_assignment = db.query(UserRole).filter(
            UserRole.user_id == user_role_assign.user_id,
            UserRole.role_id == user_role_assign.role_id
        ).first()
        
        if existing_assignment:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User already has this role"
            )
        
        user_role = UserRole(
            user_id=user_role_assign.user_id,
            role_id=user_role_assign.role_id,
            assigned_by="system"  # This should be the current user in a real implementation
        )
        db.add(user_role)
        db.commit()
        db.refresh(user_role)
        return user_role
    except ProgrammingError:
        # Database tables don't exist yet
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot assign roles during first install"
        )

@router.delete("/user-roles/{user_role_id}")
def remove_role_from_user(user_role_id: int, db: Session = Depends(get_db)):
    """Remove a role from a user"""
    # If this is a first install, return 404
    if is_first_install():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User-role assignment not found"
        )
    
    try:
        user_role = db.query(UserRole).filter(UserRole.id == user_role_id).first()
        if not user_role:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User-role assignment not found"
            )
        
        db.delete(user_role)
        db.commit()
        return {"message": "Role removed from user successfully"}
    except ProgrammingError:
        # Database tables don't exist yet
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User-role assignment not found"
        )