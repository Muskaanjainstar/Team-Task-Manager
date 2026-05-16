// src/components/Dashboard.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function Dashboard() {
  const [stats, setStats] = useState({ pending: 0, in_progress: 0, completed: 0, overdue: 0 });
  const [recentTasks, setRecentTasks] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    fetchStats();
    fetchRecentTasks();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/tasks/dashboard/stats`);
      setStats(response.data);
    } catch (error) {
      toast.error('Failed to fetch stats');
    }
  };

  const fetchRecentTasks = async () => {
    try {
      const response = await axios.get(`${API_URL}/tasks`);
      setRecentTasks(response.data.slice(0, 5));
    } catch (error) {
      toast.error('Failed to fetch tasks');
    }
  };

  const updateTaskStatus = async (taskId, status) => {
    try {
      await axios.patch(`${API_URL}/tasks/${taskId}/status`, { status });
      toast.success('Task updated');
      fetchStats();
      fetchRecentTasks();
    } catch (error) {
      toast.error('Failed to update task');
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Welcome back, {user?.name}!
        </h1>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-blue-600">{stats.pending}</div>
            <div className="text-gray-600">Pending Tasks</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-yellow-600">{stats.in_progress}</div>
            <div className="text-gray-600">In Progress</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <div className="text-gray-600">Completed</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
            <div className="text-gray-600">Overdue</div>
          </div>
        </div>

        {/* Recent Tasks */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-semibold">Recent Tasks</h2>
          </div>
          <div className="divide-y">
            {recentTasks.map(task => (
              <div key={task.id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">{task.title}</h3>
                  <p className="text-sm text-gray-500">Project: {task.project_name}</p>
                  {task.due_date && (
                    <p className="text-sm text-gray-500">Due: {new Date(task.due_date).toLocaleDateString()}</p>
                  )}
                </div>
                <select
                  value={task.status}
                  onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                  className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(task.status)} border-0 focus:ring-2 focus:ring-blue-500`}
                >
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            ))}
            {recentTasks.length === 0 && (
              <div className="px-6 py-8 text-center text-gray-500">
                No tasks yet. Create your first task!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;