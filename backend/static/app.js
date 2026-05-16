const API_URL = '/api';

// State
let state = {
    token: localStorage.getItem('token'),
    user: null, // {id, name, email, role}
    projects: [],
    tasks: [],
    currentView: 'dashboard' // 'dashboard' or 'projects'
};

// --- API Calls ---
async function apiCall(endpoint, method = 'GET', body = null) {
    const headers = { 'Content-Type': 'application/json' };
    if (state.token) headers['Authorization'] = `Bearer ${state.token}`;

    const config = { method, headers };
    if (body) {
        // If the body is FormData (used for login OAuth2PasswordRequestForm), don't stringify
        if (body instanceof URLSearchParams) {
            config.headers['Content-Type'] = 'application/x-www-form-urlencoded';
            config.body = body;
        } else {
            config.body = JSON.stringify(body);
        }
    }

    const res = await fetch(`${API_URL}${endpoint}`, config);
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || 'API Error');
    }
    return res.json();
}

// --- App Initialization & Routing ---
async function init() {
    if (state.token) {
        try {
            // Fetch users to find current user details using our token
            // In a real app, you'd have a /api/users/me endpoint. Let's just decode JWT or fetch users.
            const users = await apiCall('/users');
            // Decode simple token manually (not recommended for prod but okay for this simple demo)
            const payload = JSON.parse(atob(state.token.split('.')[1]));
            state.user = users.find(u => u.email === payload.sub);
            
            if(!state.user) throw new Error("User not found");
            
            renderApp();
        } catch (e) {
            console.error("Session invalid:", e);
            logout();
        }
    } else {
        renderAuth();
    }
}

// --- Renderers ---
const appDiv = document.getElementById('app');

function renderAuth(isLogin = true) {
    appDiv.innerHTML = `
        <div class="auth-container">
            <div class="auth-card glass-panel">
                <h1>${isLogin ? 'Welcome Back' : 'Create Account'}</h1>
                <p>${isLogin ? 'Login to manage your tasks' : 'Sign up to get started'}</p>
                
                <form id="auth-form">
                    ${!isLogin ? `
                        <div class="form-group">
                            <label>Full Name</label>
                            <input type="text" id="name" class="form-control" required>
                        </div>
                    ` : ''}
                    <div class="form-group">
                        <label>Email</label>
                        <input type="email" id="email" class="form-control" required>
                    </div>
                    <div class="form-group">
                        <label>Password</label>
                        <input type="password" id="password" class="form-control" required>
                    </div>
                    ${!isLogin ? `
                        <div class="form-group">
                            <label>Role</label>
                            <select id="role" class="form-control">
                                <option value="Member">Member</option>
                                <option value="Admin">Admin</option>
                            </select>
                        </div>
                    ` : ''}
                    <button type="submit" class="btn btn-primary">${isLogin ? 'Login' : 'Sign Up'}</button>
                </form>
                
                <div class="auth-switch">
                    ${isLogin ? 
                        `Don't have an account? <a href="#" onclick="renderAuth(false)">Sign Up</a>` : 
                        `Already have an account? <a href="#" onclick="renderAuth(true)">Login</a>`
                    }
                </div>
            </div>
        </div>
    `;

    document.getElementById('auth-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            if (isLogin) {
                const params = new URLSearchParams();
                params.append('username', email);
                params.append('password', password);
                
                const data = await apiCall('/auth/login', 'POST', params);
                state.token = data.access_token;
                localStorage.setItem('token', state.token);
                init();
            } else {
                const name = document.getElementById('name').value;
                const role = document.getElementById('role').value;
                await apiCall('/auth/register', 'POST', { name, email, password, role });
                alert('Registration successful! Please login.');
                renderAuth(true);
            }
        } catch (err) {
            alert(err.message);
        }
    });
}

async function renderApp() {
    // Fetch initial data
    state.projects = await apiCall('/projects');
    state.tasks = await apiCall('/tasks');

    appDiv.innerHTML = `
        <div class="app-container">
            <aside class="sidebar">
                <div class="sidebar-header">TaskFlow</div>
                <ul class="nav-links">
                    <li class="nav-item ${state.currentView === 'dashboard' ? 'active' : ''}" onclick="switchView('dashboard')">Dashboard</li>
                    <li class="nav-item ${state.currentView === 'projects' ? 'active' : ''}" onclick="switchView('projects')">Projects</li>
                </ul>
            </aside>
            <main class="main-content">
                <div class="topbar">
                    <h2>${state.currentView === 'dashboard' ? 'Overview' : 'Projects'}</h2>
                    <div class="user-info">
                        <span class="role-badge">${state.user.role}</span>
                        <span>${state.user.name}</span>
                        <button class="btn btn-secondary" onclick="logout()" style="padding: 0.5rem">Logout</button>
                    </div>
                </div>
                
                <div id="content-area"></div>
            </main>
        </div>
        
        <!-- Modal Container -->
        <div id="modal" class="modal-overlay">
            <div class="modal-content glass-panel" id="modal-content"></div>
        </div>
    `;

    renderContent();
}

function switchView(view) {
    state.currentView = view;
    renderApp();
}

function renderContent() {
    const contentArea = document.getElementById('content-area');
    const isAdmin = state.user.role === 'Admin';

    if (state.currentView === 'dashboard') {
        const myTasks = state.tasks.filter(t => t.assigned_to_id === state.user.id);
        const todo = myTasks.filter(t => t.status === 'To Do').length;
        const inProgress = myTasks.filter(t => t.status === 'In Progress').length;
        const done = myTasks.filter(t => t.status === 'Done').length;

        contentArea.innerHTML = `
            <div class="grid" style="margin-bottom: 2rem;">
                <div class="card glass-panel">
                    <div class="card-title">My Tasks</div>
                    <h1 style="font-size: 2.5rem; color: var(--accent-primary)">${myTasks.length}</h1>
                </div>
                <div class="card glass-panel">
                    <div class="card-title">In Progress</div>
                    <h1 style="font-size: 2.5rem; color: var(--warning)">${inProgress}</h1>
                </div>
                <div class="card glass-panel">
                    <div class="card-title">Completed</div>
                    <h1 style="font-size: 2.5rem; color: var(--success)">${done}</h1>
                </div>
            </div>
            
            <div class="header-actions" style="margin-bottom: 1rem; justify-content: space-between;">
                <h3>My Recent Tasks</h3>
            </div>
            
            <div class="grid">
                ${myTasks.map(t => createTaskCard(t)).join('') || '<p style="color:var(--text-secondary)">No tasks assigned.</p>'}
            </div>
        `;
    } else if (state.currentView === 'projects') {
        contentArea.innerHTML = `
            <div class="header-actions" style="margin-bottom: 2rem; justify-content: flex-end;">
                ${isAdmin ? `<button class="btn btn-primary" onclick="openProjectModal()" style="width: auto; padding: 0.5rem 1rem;">+ New Project</button>` : ''}
            </div>
            <div class="grid">
                ${state.projects.map(p => `
                    <div class="card glass-panel">
                        <div class="card-title">${p.name}</div>
                        <div class="card-desc">${p.description || 'No description'}</div>
                        <div class="header-actions" style="justify-content: space-between; align-items: center">
                            <span class="status-badge status-todo">${state.tasks.filter(t => t.project_id === p.id).length} Tasks</span>
                            ${isAdmin ? `<button class="btn btn-secondary" onclick="openTaskModal(${p.id})">+ Add Task</button>` : ''}
                        </div>
                        
                        <div style="margin-top: 1rem; border-top: 1px solid var(--border-color); padding-top: 1rem;">
                            ${state.tasks.filter(t => t.project_id === p.id).map(t => createTaskCard(t)).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }
}

function createTaskCard(task) {
    const statusClass = task.status === 'To Do' ? 'status-todo' : task.status === 'In Progress' ? 'status-progress' : 'status-done';
    const isAssignee = task.assigned_to_id === state.user.id;
    const canEdit = isAssignee || state.user.role === 'Admin';
    
    return `
        <div style="background: rgba(0,0,0,0.2); padding: 1rem; border-radius: 8px; margin-bottom: 0.5rem;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                <strong>${task.title}</strong>
                <span class="status-badge ${statusClass}">${task.status}</span>
            </div>
            <p style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 0.5rem;">${task.description || ''}</p>
            ${canEdit ? `
                <select onchange="updateTaskStatus(${task.id}, this.value)" style="background: transparent; color: var(--text-primary); border: 1px solid var(--border-color); border-radius: 4px; padding: 0.2rem;">
                    <option value="To Do" ${task.status === 'To Do' ? 'selected' : ''}>To Do</option>
                    <option value="In Progress" ${task.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                    <option value="Done" ${task.status === 'Done' ? 'selected' : ''}>Done</option>
                </select>
            ` : ''}
        </div>
    `;
}

// --- Actions ---
async function updateTaskStatus(taskId, status) {
    try {
        await apiCall(`/tasks/${taskId}/status`, 'PUT', { status });
        renderApp(); // re-fetch and render
    } catch (e) {
        alert(e.message);
    }
}

function logout() {
    state.token = null;
    state.user = null;
    localStorage.removeItem('token');
    renderAuth();
}

// --- Modals ---
function openModal(content) {
    const modal = document.getElementById('modal');
    document.getElementById('modal-content').innerHTML = `
        <div class="modal-header">
            <h3>${content.title}</h3>
            <button class="close-btn" onclick="closeModal()">&times;</button>
        </div>
        ${content.body}
    `;
    modal.classList.add('active');
}

function closeModal() {
    document.getElementById('modal').classList.remove('active');
}

function openProjectModal() {
    openModal({
        title: 'Create New Project',
        body: `
            <form id="project-form">
                <div class="form-group">
                    <label>Project Name</label>
                    <input type="text" id="proj-name" class="form-control" required>
                </div>
                <div class="form-group">
                    <label>Description</label>
                    <textarea id="proj-desc" class="form-control" rows="3"></textarea>
                </div>
                <button type="submit" class="btn btn-primary">Create Project</button>
            </form>
        `
    });

    document.getElementById('project-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('proj-name').value;
        const description = document.getElementById('proj-desc').value;
        try {
            await apiCall('/projects', 'POST', { name, description });
            closeModal();
            renderApp();
        } catch (err) { alert(err.message); }
    });
}

async function openTaskModal(projectId) {
    // Fetch users to populate assignee dropdown
    const users = await apiCall('/users');
    
    openModal({
        title: 'Add New Task',
        body: `
            <form id="task-form">
                <div class="form-group">
                    <label>Task Title</label>
                    <input type="text" id="task-title" class="form-control" required>
                </div>
                <div class="form-group">
                    <label>Description</label>
                    <textarea id="task-desc" class="form-control" rows="2"></textarea>
                </div>
                <div class="form-group">
                    <label>Assign To</label>
                    <select id="task-assignee" class="form-control">
                        <option value="">Unassigned</option>
                        ${users.map(u => `<option value="${u.id}">${u.name} (${u.role})</option>`).join('')}
                    </select>
                </div>
                <button type="submit" class="btn btn-primary">Create Task</button>
            </form>
        `
    });

    document.getElementById('task-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = document.getElementById('task-title').value;
        const description = document.getElementById('task-desc').value;
        const assigned_to_id = document.getElementById('task-assignee').value;
        
        try {
            const body = { project_id: projectId, title, description };
            if(assigned_to_id) body.assigned_to_id = parseInt(assigned_to_id);
            
            await apiCall('/tasks', 'POST', body);
            closeModal();
            renderApp();
        } catch (err) { alert(err.message); }
    });
}

// Start
init();
