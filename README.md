# Team Task Manager

A Full-Stack Team Task Manager application built with Python (FastAPI) and Vanilla JavaScript. Features Role-Based Access Control, project tracking, and task management.

## Features
- **Authentication**: Secure JWT-based Login and Registration.
- **Role-Based Access Control (RBAC)**: Admin and Member roles.
- **Project Management**: Create projects, track assigned tasks.
- **Task Management**: Create tasks, assign them to users, update status.
- **Dashboard**: Real-time overview of tasks.
- **Premium UI**: Modern dark-mode interface with glassmorphism effects.

## Tech Stack
- **Backend**: Python 3, FastAPI, SQLAlchemy
- **Database**: SQLite (Local), PostgreSQL (Production/Railway)
- **Frontend**: Vanilla HTML5, CSS3, JavaScript (Single Page Application)

## Local Setup

1. **Open the project folder**.
2. **Activate the virtual environment**:
   ```bash
   # Windows
   .\venv\Scripts\activate
   
   # Mac/Linux
   source venv/bin/activate
   ```
3. **Start the FastAPI server**:
   ```bash
   cd backend
   uvicorn main:app --reload
   ```
4. **Open your browser** and navigate to: [http://localhost:8000](http://localhost:8000)

## Railway Deployment Instructions

1. **Upload to GitHub**:
   - Create a new repository on GitHub.
   - Upload all these files to the repository (if you have Git Desktop or similar, use that since Git CLI might not be installed).
2. **Connect to Railway**:
   - Go to [Railway.app](https://railway.app) and login with GitHub.
   - Click `New Project` > `Deploy from GitHub repo`.
   - Select your repository.
3. **Add Database**:
   - In your Railway project, click `New` > `Database` > `Add PostgreSQL`.
   - Once provisioned, click on the Postgres service, go to `Connect`, and copy the `Database URL`.
4. **Configure Environment**:
   - Go to your Web Service > `Variables`.
   - Add `DATABASE_URL` and paste the connection string.
   - Add `SECRET_KEY` and put a random secure string.
5. Railway will automatically use the `requirements.txt` and `Procfile` to deploy!

## Submission Links
- **Live URL**: https://web-production-7a332.up.railway.app/
- **GitHub Repo**: https://github.com/Muskaanjainstar/team-task-manager
