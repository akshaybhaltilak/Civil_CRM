import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { realtimeDb } from "../firebase/firebaseConfig";
import { ref, onValue } from "firebase/database";
import {
  Users,
  Package,
  UserCheck,
  CreditCard,
  Calendar,
  BarChart2,
  Clock,
  Flag,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  AlertCircle,
  FileText,
  Edit3,
  Share2,
  User
} from "lucide-react";

const ProjectDashboard = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState({
    completionPercentage: 0,
    daysRemaining: 0,
    client: { name: "", email: "", phone: "" }
  });

  useEffect(() => {
    const projectRef = ref(realtimeDb, `projects/${id}`);
    const unsubscribe = onValue(projectRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setProject(data);
        
        // Calculate days remaining if deadline exists
        let daysRemaining = 0;
        if (data.deadline) {
          const deadline = new Date(data.deadline);
          const today = new Date();
          daysRemaining = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
        }

        // Calculate completion percentage from actual data
        const completionPercentage = data.tasks > 0 
          ? Math.round((data.completedTasks || 0) / data.tasks * 100)
          : 0;

        setStats({
          completionPercentage: completionPercentage,
          daysRemaining: daysRemaining,
          client: { 
            name: data.client?.name || "Not assigned",
            email: data.client?.email || "",
            phone: data.client?.phone || ""
          }
        });
      } else {
        navigate("/projects", { replace: true });
      }
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, [id, navigate]);

  // Get priority color class
  const getPriorityColor = (priority) => {
    switch(priority) {
      case "high": return "bg-red-100 text-red-800 border-red-200";
      case "medium": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low": return "bg-green-100 text-green-800 border-green-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // Status based on completion percentage
  const getStatusInfo = () => {
    if (stats.completionPercentage >= 100) {
      return {
        label: "Completed",
        color: "text-green-600",
        icon: <CheckCircle className="h-5 w-5" />
      };
    } else if (stats.daysRemaining < 0) {
      return {
        label: "Overdue",
        color: "text-red-600",
        icon: <AlertTriangle className="h-5 w-5" />
      };
    } else if (stats.completionPercentage < 25) {
      return {
        label: "Just Started",
        color: "text-blue-600",
        icon: <Clock className="h-5 w-5" />
      };
    } else {
      return {
        label: "In Progress",
        color: "text-indigo-600",
        icon: <AlertCircle className="h-5 w-5" />
      };
    }
  };

  const statusInfo = getStatusInfo();

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Navigation items with icons
  const navItems = [
    { key: "overview", label: "Overview", icon: <BarChart2 size={20} /> },
    { key: "workers", label: "Workers", icon: <Users size={20} /> },
    { key: "materials", label: "Materials", icon: <Package size={20} /> },
    { key: "clients", label: "Clients", icon: <UserCheck size={20} /> },
    { key: "payments", label: "Payments", icon: <CreditCard size={20} /> },
    { key: "documents", label: "Documents", icon: <FileText size={20} /> },
  ];
  
  return (
    <div className="max-w-7xl mx-auto px-4 py-6 md:px-6 lg:px-8 bg-gray-50">
      {/* Project header with more prominence */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6 border border-gray-100">
        <div className="md:flex">
          <div className="p-6 md:p-8 md:flex-1">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-4">
              <div>
                <div className="flex items-center">
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{project.name}</h1>
                  <div className="ml-4 flex space-x-2">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${getPriorityColor(project.priority)}`}>
                      {project.priority?.charAt(0).toUpperCase() + project.priority?.slice(1)}
                    </span>
                    <span className={`inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 ${statusInfo.color}`}>
                      {statusInfo.icon}
                      <span className="ml-1">{statusInfo.label}</span>
                    </span>
                  </div>
                </div>
                <p className="mt-2 text-gray-600">
                  {project.description || "No description provided for this project."}
                </p>
              </div>
              
              <div className="mt-4 md:mt-0 flex space-x-2">
                <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors">
                  <Edit3 size={16} className="mr-2" />
                  Edit
                </button>
                <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors">
                  <Share2 size={16} className="mr-2" />
                  Share
                </button>
              </div>
            </div>
            
            {/* Project metadata */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6">
              <div className="flex items-start">
                <Calendar size={18} className="mr-2 text-indigo-500 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">Created</p>
                  <p className="text-sm font-medium">
                    {project.createdAt ? new Date(project.createdAt).toLocaleDateString() : "Not specified"}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <Clock size={18} className="mr-2 text-indigo-500 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">Deadline</p>
                  <p className="text-sm font-medium">
                    {project.deadline 
                      ? new Date(project.deadline).toLocaleDateString() 
                      : "Not specified"}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <Flag size={18} className="mr-2 text-indigo-500 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">Status</p>
                  <p className={`text-sm font-medium ${statusInfo.color}`}>
                    {statusInfo.label}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <BarChart2 size={18} className="mr-2 text-indigo-500 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">Completion</p>
                  <p className="text-sm font-medium">
                    {stats.completionPercentage}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main content area with tabs */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
        {/* Tab navigation */}
        <div className="border-b border-gray-200">
          <div className="px-6 overflow-x-auto">
            <nav className="-mb-px flex space-x-6">
              {navItems.map(item => (
                <button
                  key={item.key}
                  onClick={() => setActiveTab(item.key)}
                  className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center transition-colors ${
                    activeTab === item.key
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {item.icon}
                  <span className="ml-2">{item.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>
        
        {/* Tab content */}
        <div className="p-6">
          {activeTab === "overview" ? (
            <div>
              {/* Progress summary */}
              <div className="mb-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Project Progress</h3>
                <div className="bg-gray-100 rounded-full h-4 mb-2 overflow-hidden">
                  <div 
                    className="bg-indigo-600 h-4 rounded-full transition-all duration-500"
                    style={{ width: `${stats.completionPercentage}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600">
                  {stats.completionPercentage}% complete 
                  {stats.daysRemaining > 0 ? ` - ${stats.daysRemaining} days remaining` : ''}
                </p>
              </div>
              
              {/* Stats grid with client section instead of budget */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-indigo-800 font-medium">Team Members</h4>
                    <Users size={20} className="text-indigo-600" />
                  </div>
                  <Link to={`/projects/${id}/workers`} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium inline-flex items-center">
                    View team <ChevronRight size={16} className="ml-1" />
                  </Link>
                </div>
                
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-indigo-800 font-medium">Materials</h4>
                    <Package size={20} className="text-indigo-600" />
                  </div>
                  <Link to={`/projects/${id}/materials`} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium inline-flex items-center">
                    View materials <ChevronRight size={16} className="ml-1" />
                  </Link>
                </div>
                
                {/* Client section replacing Budget */}
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-indigo-800 font-medium">Client</h4>
                    <User size={20} className="text-indigo-600" />
                  </div>
                  <div className="mb-2">
                    <p className="text-sm font-medium truncate">{stats.client.name}</p>
                  </div>
                  <Link to={`/projects/${id}/clients`} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium inline-flex items-center">
                    Client details <ChevronRight size={16} className="ml-1" />
                  </Link>
                </div>
                
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-indigo-800 font-medium">Tasks</h4>
                    <CheckCircle size={20} className="text-indigo-600" />
                  </div>
                  <div className="mt-1 mb-2 bg-white/50 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${stats.completionPercentage}%` }}
                    ></div>
                  </div>
                  <button className="text-sm text-indigo-600 hover:text-indigo-800 font-medium inline-flex items-center">
                    View tasks <ChevronRight size={16} className="ml-1" />
                  </button>
                </div>
              </div>
              
              {/* Recent activity */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
                  <button className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">View all</button>
                </div>
                <div className="space-y-4">
                  {project.activities ? (
                    project.activities.slice(0, 3).map((activity, i) => (
                      <div key={i} className="flex items-start p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                          <span className="text-indigo-600 font-medium">{activity.userInitials || 'User'}</span>
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                          <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <p className="text-gray-500">No recent activity to show</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : activeTab === "clients" ? (
            // Client tab content
            <div className="bg-white rounded-lg">
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Client Information</h3>
                
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100">
                  <div className="flex items-center mb-4">
                    <div className="h-12 w-12 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-lg">
                      {stats.client.name.charAt(0)}
                    </div>
                    <div className="ml-4">
                      <h4 className="text-lg font-medium">{stats.client.name}</h4>
                      <p className="text-sm text-gray-600">Primary Project Client</p>
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4 mt-4">
                    <div className="p-4 bg-white rounded-lg border border-gray-100">
                      <p className="text-xs text-gray-500 mb-1">Email</p>
                      <p className="text-sm font-medium">{stats.client.email || "Not provided"}</p>
                    </div>
                    <div className="p-4 bg-white rounded-lg border border-gray-100">
                      <p className="text-xs text-gray-500 mb-1">Phone</p>
                      <p className="text-sm font-medium">{stats.client.phone || "Not provided"}</p>
                    </div>
                    <div className="p-4 bg-white rounded-lg border border-gray-100">
                      <p className="text-xs text-gray-500 mb-1">Address</p>
                      <p className="text-sm font-medium">{project.client?.address || "Not provided"}</p>
                    </div>
                    <div className="p-4 bg-white rounded-lg border border-gray-100">
                      <p className="text-xs text-gray-500 mb-1">Company</p>
                      <p className="text-sm font-medium">{project.client?.company || "Not provided"}</p>
                    </div>
                  </div>
                  
                  <div className="mt-6 flex space-x-4">
                    <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                      <Edit3 size={16} className="mr-2" /> 
                      Edit Client
                    </button>
                    <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                      <CreditCard size={16} className="mr-2" />
                      Payment History
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Other tabs content
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <div className="inline-flex items-center justify-center p-4 bg-indigo-100 rounded-full mb-4">
                {navItems.find(item => item.key === activeTab)?.icon}
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {navItems.find(item => item.key === activeTab)?.label} Section
              </h3>
              <p className="text-gray-600 mb-6">
                This section would display {activeTab} related information and management tools.
              </p>
              <Link
                to={`/projects/${id}/${activeTab}`}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
              >
                Manage {navItems.find(item => item.key === activeTab)?.label}
                <ChevronRight size={16} className="ml-1" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectDashboard;