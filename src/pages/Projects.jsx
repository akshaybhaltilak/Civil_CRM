import { useState, useEffect } from "react";
import { realtimeDb } from "../firebase/firebaseConfig";
import { ref, push, remove, update, onValue } from "firebase/database";
import { Link } from "react-router-dom";
import { Calendar, Clock, AlertCircle, Edit2, Trash2, PlusCircle, Star, Filter, Search } from "lucide-react";

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [newProject, setNewProject] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [priority, setPriority] = useState("medium");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPriority, setFilterPriority] = useState("all");
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const projectsRef = ref(realtimeDb, "projects");
    
    // Listen for real-time updates
    const unsubscribe = onValue(projectsRef, (snapshot) => {
      setIsLoading(true);
      const data = snapshot.val();
      if (data) {
        const projectList = Object.entries(data).map(([id, value]) => ({
          id,
          ...value,
        }));
        setProjects(projectList);
      } else {
        setProjects([]);
      }
      setIsLoading(false);
    });
    
    // Cleanup subscription
    return () => unsubscribe();
  }, []);

  const handleAddProject = async () => {
    if (newProject.trim()) {
      const projectsRef = ref(realtimeDb, "projects");
      const projectData = {
        name: newProject,
        description: description || "No description provided",
        deadline: deadline || null,
        priority: priority,
        createdAt: new Date().toISOString(),
        tasks: 0,
        completedTasks: 0,
      };
      
      if (editingProject) {
        // Update existing project
        const projectRef = ref(realtimeDb, `projects/${editingProject.id}`);
        await update(projectRef, projectData);
        setEditingProject(null);
      } else {
        // Add new project
        await push(projectsRef, projectData);
      }
      
      // Reset form
      setNewProject("");
      setDescription("");
      setDeadline("");
      setPriority("medium");
      setIsFormVisible(false);
    }
  };

  const handleDeleteProject = async (id) => {
    if (confirm("Are you sure you want to delete this project?")) {
      const projectRef = ref(realtimeDb, `projects/${id}`);
      await remove(projectRef);
    }
  };

  const handleEditProject = (project) => {
    setEditingProject(project);
    setNewProject(project.name);
    setDescription(project.description || "");
    setDeadline(project.deadline || "");
    setPriority(project.priority || "medium");
    setIsFormVisible(true);
  };

  const filteredProjects = projects
    .filter(project => 
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (project.description && project.description.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    .filter(project => 
      filterPriority === "all" || project.priority === filterPriority
    )
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  // Function to get priority badge color
  const getPriorityColor = (priority) => {
    switch(priority) {
      case "high": return "bg-red-100 text-red-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      case "low": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-lg p-6 mb-8">
        <h1 className="text-3xl font-bold text-white flex items-center">
          🏗️ Project Portfolio Dashboard
        </h1>
        <p className="text-indigo-100 mt-2">
          Organize, track, and deliver your projects with professional precision
        </p>
      </div>
      
      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects..."
            className="pl-10 w-full p-3 bg-white border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
          />
        </div>
        
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Filter size={18} className="text-gray-400" />
          </div>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="pl-10 p-3 bg-white border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none appearance-none pr-10"
          >
            <option value="all">All Priorities</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>
        </div>
        
        <button
          onClick={() => {
            setEditingProject(null);
            setNewProject("");
            setDescription("");
            setDeadline("");
            setPriority("medium");
            setIsFormVisible(!isFormVisible);
          }}
          className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200"
        >
          <PlusCircle size={18} />
          {isFormVisible ? "Cancel" : "New Project"}
        </button>
      </div>
      
      {/* Add/Edit Project Form */}
      {isFormVisible && (
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-100">
          <h2 className="text-xl font-semibold mb-4">
            {editingProject ? "Edit Project" : "Create New Project"}
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Project Name *</label>
              <input
                type="text"
                value={newProject}
                onChange={(e) => setNewProject(e.target.value)}
                placeholder="Enter project name"
                className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the project scope and objectives"
                rows={3}
                className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              ></textarea>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                >
                  <option value="high">High Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="low">Low Priority</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-end pt-2">
              <button
                onClick={handleAddProject}
                className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-6 rounded-lg transition-colors duration-200"
              >
                {editingProject ? "Update Project" : "Create Project"}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Projects Grid */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.length > 0 ? (
            filteredProjects.map((project) => (
              <div key={project.id} className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden border border-gray-100">
                <div className="p-5">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-semibold text-gray-800 line-clamp-1">{project.name}</h3>
                    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${getPriorityColor(project.priority)}`}>
                      {project.priority?.charAt(0).toUpperCase() + project.priority?.slice(1)}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {project.description || "No description provided"}
                  </p>
                  
                  <div className="flex items-center text-xs text-gray-500 space-x-4 mb-4">
                    {project.deadline && (
                      <div className="flex items-center">
                        <Calendar size={14} className="mr-1" />
                        <span>Due: {new Date(project.deadline).toLocaleDateString()}</span>
                      </div>
                    )}
                    <div className="flex items-center">
                      <Clock size={14} className="mr-1" />
                      <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                    <div 
                      className="bg-indigo-600 h-2.5 rounded-full" 
                      style={{ width: project.tasks > 0 ? `${(project.completedTasks / project.tasks) * 100}%` : '0%' }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500 mb-4">
                    {project.completedTasks || 0} of {project.tasks || 0} tasks completed
                  </div>
                </div>
                
                <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex justify-between">
                  <Link 
                    to={`/projects/${project.id}`}
                    className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                  >
                    View Details
                  </Link>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEditProject(project)}
                      className="text-gray-500 hover:text-indigo-600 transition-colors"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteProject(project.id)}
                      className="text-gray-500 hover:text-red-600 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-1 md:col-span-2 lg:col-span-3 bg-white rounded-xl shadow p-8 text-center">
              <div className="flex flex-col items-center">
                <AlertCircle size={48} className="text-gray-400 mb-4" />
                <h3 className="text-xl font-medium text-gray-700 mb-2">No projects found</h3>
                <p className="text-gray-500 mb-6">
                  {searchQuery || filterPriority !== "all"
                    ? "Try adjusting your search or filters"
                    : "Start by creating your first project to begin tracking your work"}
                </p>
                <button
                  onClick={() => setIsFormVisible(true)}
                  className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-6 rounded-lg transition-colors duration-200"
                >
                  <PlusCircle size={18} />
                  Create Your First Project
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Stats Footer */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 shadow-sm border border-indigo-100">
          <div className="text-indigo-800 text-lg font-semibold mb-2">Total Projects</div>
          <div className="text-3xl font-bold text-indigo-900">{projects.length}</div>
        </div>
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 shadow-sm border border-indigo-100">
          <div className="text-indigo-800 text-lg font-semibold mb-2">High Priority</div>
          <div className="text-3xl font-bold text-indigo-900">
            {projects.filter(p => p.priority === "high").length}
          </div>
        </div>
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 shadow-sm border border-indigo-100">
          <div className="text-indigo-800 text-lg font-semibold mb-2">Upcoming Deadlines</div>
          <div className="text-3xl font-bold text-indigo-900">
            {projects.filter(p => p.deadline && new Date(p.deadline) > new Date() && new Date(p.deadline) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)).length}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Projects;