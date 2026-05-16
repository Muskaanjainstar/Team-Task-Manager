from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from typing import List
from datetime import timedelta
import models, schemas, database, auth
import os

# Create database tables
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="Team Task Manager API")

# --- Auth Endpoints ---

@app.post("/api/auth/register", response_model=schemas.UserResponse)
def register(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = auth.get_password_hash(user.password)
    new_user = models.User(
        name=user.name,
        email=user.email,
        password_hash=hashed_password,
        role=user.role
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.post("/api/auth/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.email, "role": user.role}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

# --- Users Endpoint ---
@app.get("/api/users", response_model=List[schemas.UserResponse])
def get_users(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    return db.query(models.User).all()

# --- Project Endpoints ---

@app.post("/api/projects", response_model=schemas.ProjectResponse)
def create_project(project: schemas.ProjectCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_admin)):
    new_project = models.Project(**project.model_dump(), owner_id=current_user.id)
    db.add(new_project)
    db.commit()
    db.refresh(new_project)
    return new_project

@app.get("/api/projects", response_model=List[schemas.ProjectResponse])
def get_projects(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    return db.query(models.Project).all()

# --- Task Endpoints ---

@app.post("/api/tasks", response_model=schemas.TaskResponse)
def create_task(task: schemas.TaskCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_admin)):
    project = db.query(models.Project).filter(models.Project.id == task.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    new_task = models.Task(**task.model_dump())
    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    return new_task

@app.get("/api/tasks", response_model=List[schemas.TaskResponse])
def get_tasks(project_id: int = None, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    query = db.query(models.Task)
    
    if project_id:
        query = query.filter(models.Task.project_id == project_id)
        
    if current_user.role == "Member":
        query = query.filter(models.Task.assigned_to_id == current_user.id)
        
    return query.all()

@app.put("/api/tasks/{task_id}/status", response_model=schemas.TaskResponse)
def update_task_status(task_id: int, status_update: schemas.TaskUpdateStatus, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    if current_user.role == "Member" and task.assigned_to_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this task")
        
    task.status = status_update.status
    db.commit()
    db.refresh(task)
    return task

# Ensure the static directory exists for serving frontend files
os.makedirs("static", exist_ok=True)
app.mount("/", StaticFiles(directory="static", html=True), name="static")
