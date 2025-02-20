import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { realtimeDb } from "../firebase/firebaseConfig";
import { ref, onValue } from "firebase/database";
import {
  Users,
  Package,
  UserCheck,
  CreditCard,
  ArrowLeft,
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
  Share2
} from "lucide-react";

const ProjectDashboard = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState({
    workersCount: 0,
    materialsCount: 0,
    clientsCount: 0,
    paymentsCount: 0,
    completionPercentage: 0,
    daysRemaining: 0,
    budget: { total: 0, spent: 0 }
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

        // Simulate fetching related stats
        // In a real app, you'd fetch these from Firebase
        setStats({
          workersCount: Math.floor(Math.random() * 10) + 2,
          materialsCount: Math.floor(Math.random() * 15) + 5,
          clientsCount: Math.floor(Math.random() * 3) + 1,
          paymentsCount: Math.floor(Math.random() * 8) + 2,
          completionPercentage: data.tasks > 0 
            ? Math.round((data.completedTasks || 0) / data.tasks * 100)
            : Math.floor(Math.random() * 100),
          daysRemaining: daysRemaining,
          budget: { 
            total: 20000 + Math.floor(Math.random() * 30000),
            spent: 10000 + Math.floor(Math.random() * 15000)
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
    <div className="max-w-7xl mx-auto px-4 py-6 md:px-6 lg:px-8">
      {/* Back navigation */}
      <div className="mb-6">
        <Link 
          to="/projects" 
          className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-800"
        >
          <ArrowLeft size={16} className="mr-1" />
          Back to Projects
        </Link>
      </div>
      
      {/* Project header */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
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
                <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                  <Edit3 size={16} className="mr-2" />
                  Edit Project
                </button>
                <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                  <Share2 size={16} className="mr-2" />
                  Share
                </button>
              </div>
            </div>
            
            {/* Project metadata */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6">
              <div className="flex items-start">
                <Calendar size={18} className="mr-2 text-gray-500 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">Created On</p>
                  <p className="text-sm font-medium">
                    {project.createdAt ? new Date(project.createdAt).toLocaleDateString() : "Not specified"}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <Clock size={18} className="mr-2 text-gray-500 mt-0.5" />
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
                <Flag size={18} className="mr-2 text-gray-500 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">Status</p>
                  <p className={`text-sm font-medium ${statusInfo.color}`}>
                    {statusInfo.label}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <BarChart2 size={18} className="mr-2 text-gray-500 mt-0.5" />
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
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {/* Tab navigation */}
        <div className="border-b border-gray-200">
          <div className="px-6 overflow-x-auto">
            <nav className="-mb-px flex space-x-6">
              {navItems.map(item => (
                <button
                  key={item.key}
                  onClick={() => setActiveTab(item.key)}
                  className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
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
                <div className="bg-gray-100 rounded-full h-4 mb-2">
                  <div 
                    className="bg-indigo-600 h-4 rounded-full"
                    style={{ width: `${stats.completionPercentage}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600">
                  {stats.completionPercentage}% complete 
                  {stats.daysRemaining > 0 ? ` - ${stats.daysRemaining} days remaining` : ''}
                </p>
              </div>
              
              {/* Stats grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-indigo-800 font-medium">Workers</h4>
                    <Users size={20} className="text-indigo-600" />
                  </div>
                  <p className="text-3xl font-bold text-indigo-900">{stats.workersCount}</p>
                  <p className="text-sm text-indigo-700 mt-1">Assigned to project</p>
                </div>
                
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-indigo-800 font-medium">Materials</h4>
                    <Package size={20} className="text-indigo-600" />
                  </div>
                  <p className="text-3xl font-bold text-indigo-900">{stats.materialsCount}</p>
                  <p className="text-sm text-indigo-700 mt-1">Items being used</p>
                </div>
                
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-indigo-800 font-medium">Budget</h4>
                    <CreditCard size={20} className="text-indigo-600" />
                  </div>
                  <p className="text-3xl font-bold text-indigo-900">${stats.budget.spent.toLocaleString()}</p>
                  <p className="text-sm text-indigo-700 mt-1">
                    of ${stats.budget.total.toLocaleString()} allocated
                  </p>
                  <div className="mt-2 bg-white/50 rounded-full h-2">
                    <div 
                      className="bg-indigo-600 h-2 rounded-full"
                      style={{ width: `${(stats.budget.spent / stats.budget.total) * 100}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-indigo-800 font-medium">Tasks</h4>
                    <CheckCircle size={20} className="text-indigo-600" />
                  </div>
                  <p className="text-3xl font-bold text-indigo-900">
                    {project.completedTasks || 0}/{project.tasks || 0}
                  </p>
                  <p className="text-sm text-indigo-700 mt-1">Tasks completed</p>
                </div>
              </div>
              
              {/* Recent activity placeholder */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-start p-4 bg-gray-50 rounded-lg">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                        <span className="text-indigo-600 font-medium">
                          {['JD', 'MS', 'RK'][i-1]}
                        </span>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-900">
                          {['Site inspection completed', 'Added 3 new materials', 'Updated project timeline'][i-1]}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {['3 hours ago', 'Yesterday', '2 days ago'][i-1]}
                        </p>
                      </div>
                    </div>
                  ))}
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
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
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