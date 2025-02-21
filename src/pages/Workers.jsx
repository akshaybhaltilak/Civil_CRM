import { useState, useEffect } from "react";
import { realtimeDb } from "../firebase/firebaseConfig";
import { ref, push, onValue, remove, update, set, get } from "firebase/database";
import { useParams } from "react-router-dom";
import { FaUserPlus, FaTrash, FaUsers, FaEdit, FaCheck, FaPhone, FaWhatsapp, FaFilter, FaSortAmountDown, FaCalendarCheck, FaCalendarAlt, FaUserClock } from "react-icons/fa";
import { toast } from "react-toastify";

const Workers = () => {
  const { id } = useParams();
  const [workers, setWorkers] = useState([]);
  const [workerData, setWorkerData] = useState({
    name: "", type: "", wage: "", contact: "", joiningDate: "", address: "", isRegular: false
  });
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
  const [workerTypes, setWorkerTypes] = useState([
    "Mason", "Laborer", "Carpenter", "Plumber", "Electrician", 
    "Painter", "Welder", "Machine Operator", "Supervisor", "Helper"
  ]);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [customType, setCustomType] = useState("");
  const [filterByType, setFilterByType] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showAttendancePanel, setShowAttendancePanel] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendance, setAttendance] = useState({});
  const [attendanceStats, setAttendanceStats] = useState({
    totalPresent: 0,
    totalAmount: 0
  });

  useEffect(() => {
    if (!id) return;
    const workersRef = ref(realtimeDb, `projects/${id}/workers`);

    onValue(workersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const workerList = Object.entries(data).map(([workerId, workerData]) => ({
          id: workerId, ...workerData
        }));
        
        // Extract unique worker types
        const types = workerList.map(worker => worker.type);
        const uniqueTypes = [...new Set(types)].filter(type => 
          type && !workerTypes.includes(type)
        );
        
        if (uniqueTypes.length > 0) {
          setWorkerTypes(prev => [...prev, ...uniqueTypes]);
        }
        
        setWorkers(workerList);
      } else {
        setWorkers([]);
      }
      setLoading(false);
    });
  }, [id, workerTypes]);

  // Load attendance data for selected date
  useEffect(() => {
    if (!id || !selectedDate) return;
    
    const attendanceRef = ref(realtimeDb, `projects/${id}/attendance/${selectedDate.replace(/-/g, '')}`);
    get(attendanceRef).then((snapshot) => {
      const data = snapshot.val() || {};
      setAttendance(data);
      
      // Calculate stats
      calculateAttendanceStats(data);
    });
  }, [id, selectedDate]);

  const calculateAttendanceStats = (attendanceData) => {
    const presentWorkers = Object.values(attendanceData).filter(a => a.present).length;
    
    let totalAmount = 0;
    Object.entries(attendanceData).forEach(([workerId, data]) => {
      if (data.present) {
        const worker = workers.find(w => w.id === workerId);
        if (worker) {
          totalAmount += parseFloat(worker.wage || 0);
        }
      }
    });
    
    setAttendanceStats({
      totalPresent: presentWorkers,
      totalAmount: totalAmount
    });
  };

  const validateWorkerData = () => {
    if (!workerData.name.trim()) return "Worker name is required";
    if (!workerData.type.trim()) return "Worker type is required";
    
    const wage = parseFloat(workerData.wage);
    if (isNaN(wage) || wage <= 0) return "Valid wage amount is required";
    
    if (!workerData.contact.trim()) return "Contact number is required";
    
    return null;
  };

  const handleAddWorker = async () => {
    const validationError = validateWorkerData();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    try {
      const workersRef = ref(realtimeDb, `projects/${id}/workers`);
      const joiningDate = workerData.joiningDate || new Date().toISOString().split('T')[0];
      
      if (editMode && editId) {
        await update(ref(realtimeDb, `projects/${id}/workers/${editId}`), {
          ...workerData, joiningDate, wage: parseFloat(workerData.wage)
        });
        toast.success("Worker updated successfully!");
        setEditMode(false);
        setEditId(null);
      } else {
        await push(workersRef, {
          ...workerData, joiningDate, wage: parseFloat(workerData.wage)
        });
        toast.success("New worker added!");
      }

      // Add custom type if it's new
      if (workerData.type && !workerTypes.includes(workerData.type)) {
        setWorkerTypes(prev => [...prev, workerData.type]);
      }

      // Reset form
      setWorkerData({
        name: "", type: "", wage: "", contact: "", joiningDate: "", address: "", isRegular: false
      });
      setCustomType("");
    } catch (error) {
      toast.error("Error: " + error.message);
    }
  };

  const handleEditWorker = (worker) => {
    setWorkerData({
      name: worker.name,
      type: worker.type || "",
      wage: worker.wage,
      contact: worker.contact,
      joiningDate: worker.joiningDate || "",
      address: worker.address || "",
      isRegular: worker.isRegular || false
    });
    setEditMode(true);
    setEditId(worker.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    setWorkerData({
      name: "", type: "", wage: "", contact: "", joiningDate: "", address: "", isRegular: false
    });
    setEditMode(false);
    setEditId(null);
    setCustomType("");
  };

  const handleDeleteWorker = async (workerId, workerName) => {
    if (window.confirm(`Remove ${workerName} from the workers list?`)) {
      try {
        await remove(ref(realtimeDb, `projects/${id}/workers/${workerId}`));
        toast.success("Worker removed");
      } catch (error) {
        toast.error("Error: " + error.message);
      }
    }
  };

  const handleToggleAttendance = async (workerId, isPresent) => {
    try {
      const attendancePath = `projects/${id}/attendance/${selectedDate.replace(/-/g, '')}/${workerId}`;
      
      // Get current worker data
      const worker = workers.find(w => w.id === workerId);
      
      // Update attendance in firebase
      await set(ref(realtimeDb, attendancePath), {
        present: isPresent,
        time: new Date().toISOString(),
        wage: parseFloat(worker?.wage || 0)
      });

      // Update local state
      setAttendance(prev => ({
        ...prev,
        [workerId]: {
          present: isPresent,
          time: new Date().toISOString(),
          wage: parseFloat(worker?.wage || 0)
        }
      }));

      // Recalculate stats
      const updatedAttendance = {
        ...attendance,
        [workerId]: {
          present: isPresent,
          time: new Date().toISOString(),
          wage: parseFloat(worker?.wage || 0)
        }
      };
      calculateAttendanceStats(updatedAttendance);

      toast.success(isPresent ? "Marked present" : "Marked absent");
    } catch (error) {
      toast.error("Error updating attendance: " + error.message);
    }
  };

  const markAllRegularWorkersPresent = async () => {
    try {
      const regularWorkers = workers.filter(worker => worker.isRegular);
      const attendanceDate = selectedDate.replace(/-/g, '');
      const updates = {};
      
      regularWorkers.forEach(worker => {
        updates[`projects/${id}/attendance/${attendanceDate}/${worker.id}`] = {
          present: true,
          time: new Date().toISOString(),
          wage: parseFloat(worker.wage || 0)
        };
      });
      
      await update(ref(realtimeDb), updates);
      
      // Update local state
      const newAttendance = { ...attendance };
      regularWorkers.forEach(worker => {
        newAttendance[worker.id] = {
          present: true,
          time: new Date().toISOString(),
          wage: parseFloat(worker.wage || 0)
        };
      });
      
      setAttendance(newAttendance);
      calculateAttendanceStats(newAttendance);
      
      toast.success(`Marked ${regularWorkers.length} regular workers present`);
    } catch (error) {
      toast.error("Error marking attendance: " + error.message);
    }
  };

  const handleSort = (key) => {
    if (sortConfig.key === key) {
      setSortConfig({
        key,
        direction: sortConfig.direction === 'ascending' ? 'descending' : 'ascending'
      });
    } else {
      setSortConfig({ key, direction: 'ascending' });
    }
  };

  // Filter and sort workers
  const filteredWorkers = [...workers].filter(worker => 
    (worker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     worker.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
     worker.contact.includes(searchTerm)) &&
    (filterByType ? worker.type === filterByType : true)
  );

  if (sortConfig.key) {
    filteredWorkers.sort((a, b) => {
      if (sortConfig.key === 'wage') {
        return sortConfig.direction === 'ascending' 
          ? parseFloat(a.wage) - parseFloat(b.wage)
          : parseFloat(b.wage) - parseFloat(a.wage);
      }
      
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });
  }

  // Calculate statistics
  const totalWorkers = workers.length;
  const regularWorkers = workers.filter(w => w.isRegular).length;
  const averageWage = workers.length > 0 
    ? workers.reduce((sum, worker) => sum + parseFloat(worker.wage || 0), 0) / workers.length
    : 0;
  const workerTypeCount = workers.reduce((acc, worker) => {
    acc[worker.type] = (acc[worker.type] || 0) + 1;
    return acc;
  }, {});
  const topWorkerType = Object.entries(workerTypeCount).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";
  const totalDailyWage = workers.reduce((sum, worker) => sum + parseFloat(worker.wage || 0), 0);

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto bg-white shadow-xl rounded-xl">
      <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6 text-center flex items-center justify-center gap-2">
        <FaUsers className="text-blue-600" />
        <span>Workforce Hub</span>
      </h2>

      {/* Worker Form */}
      <div className="bg-gray-50 p-4 sm:p-6 rounded-lg shadow-md mb-6 border border-gray-200">
        <h3 className="text-lg sm:text-xl font-bold mb-3 text-gray-700">
          {editMode ? "Edit Worker Details" : "Add New Worker"}
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input
              type="text"
              placeholder="Worker's name"
              value={workerData.name}
              onChange={(e) => setWorkerData({ ...workerData, name: e.target.value })}
              className="w-full p-2 sm:p-3 border rounded-lg bg-white text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Select role"
                value={workerData.type}
                onChange={(e) => setWorkerData({ ...workerData, type: e.target.value })}
                onClick={() => setShowTypeDropdown(true)}
                className="w-full p-2 sm:p-3 border rounded-lg bg-white text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <button 
                onClick={() => setShowTypeDropdown(!showTypeDropdown)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
            
            {showTypeDropdown && (
              <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md max-h-60 overflow-y-auto border">
                <div className="p-2 border-b">
                  <div className="flex">
                    <input
                      type="text"
                      placeholder="Add custom type"
                      value={customType}
                      onChange={(e) => setCustomType(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 p-2 border rounded-l-md outline-none"
                    />
                    <button
                      onClick={() => {
                        if (customType.trim()) {
                          setWorkerData({...workerData, type: customType.trim()});
                          setShowTypeDropdown(false);
                          setCustomType("");
                        }
                      }}
                      className="bg-blue-500 text-white px-3 rounded-r-md hover:bg-blue-600"
                    >
                      Add
                    </button>
                  </div>
                </div>
                <ul>
                  {workerTypes.map((type, index) => (
                    <li 
                      key={index}
                      onClick={() => {
                        setWorkerData({...workerData, type});
                        setShowTypeDropdown(false);
                      }}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                    >
                      {type}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Daily Wage (₹) *</label>
              <input
                type="number"
                placeholder="Amount"
                value={workerData.wage}
                onChange={(e) => setWorkerData({ ...workerData, wage: e.target.value })}
                className="w-full p-2 sm:p-3 border rounded-lg bg-white text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact *</label>
              <input
                type="text"
                placeholder="Phone"
                value={workerData.contact}
                onChange={(e) => setWorkerData({ ...workerData, contact: e.target.value })}
                className="w-full p-2 sm:p-3 border rounded-lg bg-white text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
          
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Join Date</label>
              <input
                type="date"
                value={workerData.joiningDate}
                onChange={(e) => setWorkerData({ ...workerData, joiningDate: e.target.value })}
                className="w-full p-2 sm:p-3 border rounded-lg bg-white text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input
                type="text"
                placeholder="Address"
                value={workerData.address}
                onChange={(e) => setWorkerData({ ...workerData, address: e.target.value })}
                className="w-full p-2 sm:p-3 border rounded-lg bg-white text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="flex items-center mt-2">
            <input
              type="checkbox"
              id="isRegular"
              checked={workerData.isRegular}
              onChange={(e) => setWorkerData({ ...workerData, isRegular: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="isRegular" className="ml-2 text-sm font-medium text-gray-700">
              Regular Worker (comes daily)
            </label>
          </div>
        </div>
        
        <div className="flex gap-3 mt-5">
          <button
            onClick={handleAddWorker}
            className={`px-4 py-2 sm:px-6 sm:py-3 rounded-lg text-white font-medium transition flex items-center justify-center gap-2 ${
              editMode 
                ? "bg-blue-600 hover:bg-blue-700" 
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {editMode ? (
              <>
                <FaCheck /> Update
              </>
            ) : (
              <>
                <FaUserPlus /> Add Worker
              </>
            )}
          </button>
          
          {editMode && (
            <button
              onClick={handleCancelEdit}
              className="px-4 py-2 sm:px-6 sm:py-3 rounded-lg bg-gray-500 text-white font-medium transition hover:bg-gray-600"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Attendance Panel */}
      <div className="mb-6">
        <button
          onClick={() => setShowAttendancePanel(!showAttendancePanel)}
          className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold py-3 px-4 rounded-lg border border-blue-200 flex items-center justify-center gap-2 transition-colors"
        >
          <FaCalendarCheck /> 
          <span>{showAttendancePanel ? "Hide Attendance Panel" : "Show Attendance Panel"}</span>
        </button>
        
        {showAttendancePanel && (
          <div className="mt-4 bg-white border border-gray-200 rounded-lg shadow-md p-4">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <FaCalendarAlt className="text-blue-600" /> Mark Daily Attendance
              </h3>
              
              <div className="flex flex-col sm:flex-row gap-3 items-center">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700">Date:</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="p-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                
                <button
                  onClick={markAllRegularWorkersPresent}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2"
                >
                  <FaUserClock /> Mark All Regular Workers
                </button>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg mb-4 flex flex-wrap gap-4">
              <div className="bg-white p-3 rounded-md shadow border border-gray-200 min-w-32">
                <div className="text-xs text-gray-500 uppercase font-bold">Workers Present</div>
                <div className="text-2xl font-bold text-blue-600">{attendanceStats.totalPresent}/{workers.length}</div>
              </div>
              
              <div className="bg-white p-3 rounded-md shadow border border-gray-200 min-w-32">
                <div className="text-xs text-gray-500 uppercase font-bold">Today's Wages</div>
                <div className="text-2xl font-bold text-green-600">₹{attendanceStats.totalAmount.toFixed(0)}</div>
              </div>
            </div>
            
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Wage</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {workers.map((worker) => {
                    const isPresent = attendance[worker.id]?.present || false;
                    return (
                      <tr key={worker.id} className={`${worker.isRegular ? 'bg-blue-50' : ''}`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {worker.isRegular && <FaUserClock className="text-blue-500 mr-2" title="Regular Worker" />}
                            <div className="text-sm font-medium text-gray-900">{worker.name}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{worker.type}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">₹{parseFloat(worker.wage).toFixed(0)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            isPresent 
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {isPresent ? 'Present' : 'Absent'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleToggleAttendance(worker.id, !isPresent)}
                            className={`px-3 py-1 rounded-md text-white ${
                              isPresent 
                                ? 'bg-red-500 hover:bg-red-600'
                                : 'bg-green-500 hover:bg-green-600'
                            }`}
                          >
                            {isPresent ? 'Mark Absent' : 'Mark Present'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <div className="bg-white p-3 sm:p-4 rounded-lg shadow-md border-l-4 border-blue-500">
          <h3 className="text-xs uppercase font-bold text-gray-500">Total Workers</h3>
          <p className="text-xl sm:text-2xl font-bold text-gray-800">{totalWorkers}</p>
        </div>
        
        <div className="bg-white p-3 sm:p-4 rounded-lg shadow-md border-l-4 border-purple-500">
          <h3 className="text-xs uppercase font-bold text-gray-500">Regular Workers</h3>
          <p className="text-xl sm:text-2xl font-bold text-gray-800">{regularWorkers}</p>
        </div>
        
        <div className="bg-white p-3 sm:p-4 rounded-lg shadow-md border-l-4 border-green-500">
          <h3 className="text-xs uppercase font-bold text-gray-500">Avg Daily Wage</h3>
          <p className="text-xl sm:text-2xl font-bold text-gray-800">₹{averageWage.toFixed(0)}</p>
        </div>
        
        <div className="bg-white p-3 sm:p-4 rounded-lg shadow-md border-l-4 border-blue-500">
          <h3 className="text-xs uppercase font-bold text-gray-500">Total Daily Cost</h3>
          <p className="text-xl sm:text-2xl font-bold text-gray-800">₹{totalDailyWage.toFixed(0)}</p>
        </div>
      </div>

{/* Workers Table */}
<div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-3 sm:p-4 bg-gray-50 flex flex-col sm:flex-row justify-between items-center gap-3">
          <h3 className="text-lg font-bold text-gray-700 flex items-center gap-2">
            <FaUsers className="text-gray-600" /> Workers ({filteredWorkers.length})
          </h3>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border outline-none focus:ring-2 focus:ring-gray-300"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className="p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-1"
              >
                <FaFilter /> Filters
              </button>
              <button 
                onClick={() => setSortConfig({ key: 'wage', direction: sortConfig.direction === 'ascending' ? 'descending' : 'ascending' })}
                className="p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-1"
              >
                <FaSortAmountDown /> Sort
              </button>
            </div>
          </div>
        </div>
        
        {showFilters && (
          <div className="p-3 bg-gray-50 border-b border-gray-200">
            <div className="flex flex-wrap gap-2">
              <select
                value={filterByType}
                onChange={(e) => setFilterByType(e.target.value)}
                className="p-2 border rounded-md outline-none"
              >
                <option value="">All Types</option>
                {workerTypes.map((type, index) => (
                  <option key={index} value={type}>{type}</option>
                ))}
              </select>
              
              {filterByType && (
                <button
                  onClick={() => setFilterByType("")}
                  className="p-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                >
                  Clear Filter
                </button>
              )}
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-500"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            {filteredWorkers.length > 0 ? (
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100 text-left text-gray-700 text-sm">
                    <th className="p-3 cursor-pointer" onClick={() => handleSort('name')}>
                      <div className="flex items-center gap-1">
                        Name
                        {sortConfig.key === 'name' && (
                          <span>{sortConfig.direction === 'ascending' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </th>
                    <th className="p-3 cursor-pointer" onClick={() => handleSort('type')}>
                      <div className="flex items-center gap-1">
                        Role
                        {sortConfig.key === 'type' && (
                          <span>{sortConfig.direction === 'ascending' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </th>
                    <th className="p-3 cursor-pointer" onClick={() => handleSort('wage')}>
                      <div className="flex items-center gap-1">
                        Wage
                        {sortConfig.key === 'wage' && (
                          <span>{sortConfig.direction === 'ascending' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </th>
                    <th className="p-3 hidden sm:table-cell">Contact</th>
                    <th className="p-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredWorkers.map((worker) => (
                    <tr 
                      key={worker.id}
                      className="border-t border-gray-200 hover:bg-gray-50"
                    >
                      <td className="p-3 font-medium text-gray-800">{worker.name}</td>
                      <td className="p-3">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                          {worker.type}
                        </span>
                      </td>
                      <td className="p-3 font-medium text-gray-600">₹{parseFloat(worker.wage).toLocaleString()}</td>
                      <td className="p-3 text-gray-600 hidden sm:table-cell">{worker.contact}</td>
                      <td className="p-3">
                        <div className="flex justify-center gap-1">
                          <button 
                            onClick={() => handleEditWorker(worker)}
                            title="Edit"
                            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full"
                          >
                            <FaEdit />
                          </button>
                          
                          <button 
                            onClick={() => window.location.href = `tel:${worker.contact}`}
                            title="Call"
                            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full"
                          >
                            <FaPhone />
                          </button>
                          
                          <button 
                            onClick={() => {
                              const phoneNumber = worker.contact.startsWith("+") ? worker.contact.substring(1) : worker.contact;
                              window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(`Hello ${worker.name}, `)}`, "_blank");
                            }}
                            title="WhatsApp"
                            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full"
                          >
                            <FaWhatsapp />
                          </button>
                          
                          <button 
                            onClick={() => handleDeleteWorker(worker.id, worker.name)}
                            title="Remove"
                            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-8 text-center text-gray-500">
                <div className="flex flex-col items-center">
                  <FaUsers className="text-4xl text-gray-300 mb-3" />
                  <p>No workers added yet. Add your first worker to get started.</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Workers;