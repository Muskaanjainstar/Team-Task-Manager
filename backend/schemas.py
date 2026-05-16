from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

# --- Token Schemas ---
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None

# --- User Schemas ---
class UserBase(BaseModel):
    name: str
    email: EmailStr

class UserCreate(UserBase):
    password: str
    # When creating a user, we can optionally pass the role, 
    # but normally we might restrict this. For the assignment, we'll allow it.
    role: str = "Member"

class UserResponse(UserBase):
    id: int
    role: str

    class Config:
        from_attributes = True

# --- Task Schemas ---
class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    status: str = "To Do"
    due_date: Optional[datetime] = None
    assigned_to_id: Optional[int] = None

class TaskCreate(TaskBase):
    project_id: int

class TaskUpdateStatus(BaseModel):
    status: str

class TaskResponse(TaskBase):
    id: int
    project_id: int
    
    class Config:
        from_attributes = True

# --- Project Schemas ---
class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None

class ProjectCreate(ProjectBase):
    pass

class ProjectResponse(ProjectBase):
    id: int
    owner_id: int
    tasks: List[TaskResponse] = []

    class Config:
        from_attributes = True
