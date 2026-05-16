// src/components/Projects.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function Projects() {
  const [projects, setProjects] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', description: '' });
  const [showMembers, setShowMembers] = useState(null);
  const [addMemberEmail, setAddMemberEmail] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await axios.get(`${API_URL}/projects`);
      setProjects(response.data);
    } catch (error) {
      toast.error('Failed to fetch projects');
    }
  };

  const createProject = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/projects`, newProject);
      toast.success('Project created successfully');
      setShowModal(false);
      setNewProject({ name: '', description: '' });
      fetchProjects();
    } catch (error) {
      toast.error('Failed to create project');
    }
  };

  const fetchMembers = async (projectId) => {
    try {
      const response = await axios.get(`${API_URL}/projects/${projectId}/members`);
      setShowMembers(response.data);
    } catch (error) {
      toast.error('Failed to fetch members');
    }
  };

  const addMember = async (projectId) => {
    if (!addMemberEmail) {
      toast.error('Please enter an email');
      return;
    }
    try {
      await axios.post(`${API_URL}/projects/${projectId}/members`, { email: addMemberEmail });
      toast.success('Member added successfully');
      setAddMemberEmail('');
      fetchMembers(projectId);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add member');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            + New Project
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map(project => (
            <div key={project.id} className="bg-white rounded-lg shadow">
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{project.name}</h3>
                <p className="text-gray-600 mb-4">{project.description || 'No description'}</p>
                <div className="flex justify-between items-center">
                  <button
                    onClick={() => fetchMembers(project.id)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    View Members
                  </button>
                  <span className="text-sm text-gray-500">
                    Owner: {project.owner_name}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Members Modal */}
        {showMembers && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h2 className="text-xl font-semibold mb-4">Project Members</h2>
              <div className="space-y-2 mb-4">
                {showMembers.map(member => (
                  <div key={member.id} className="flex justify-between items-center py-2 border-b">
                    <div>
                      <p className="font-medium">{member.name}</p>
                      <p className="text-sm text-gray-500">{member.email}</p>
                    </div>
                    <span className="text-sm bg-gray-100 px-2 py-1 rounded">{member.role}</span>
                  </div>
                ))}
              </div>
              {user?.role === 'admin' && (
                <div className="mt-4">
                  <input
                    type="email"
                    placeholder="Member email"
                    value={addMemberEmail}
                    onChange={(e) => setAddMemberEmail(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg mb-2"
                  />
                  <button
                    onClick={() => addMember(showMembers[0]?.project_id)}
                    className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                  >
                    Add Member
                  </button>
                </div>
              )}
              <button
                onClick={() => setShowMembers(null)}
                className="mt-4 w-full bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Create Project Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h2 className="text-xl font-semibold mb-4">Create New Project</h2>
              <form onSubmit={createProject}>
                <input
                  type="text"
                  placeholder="Project Name"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg mb-3"
                  required
                />
                <textarea
                  placeholder="Description"
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg mb-3"
                  rows="3"
                />
                <div className="flex gap-2">
                  <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
                    Create
                  </button>
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Projects;