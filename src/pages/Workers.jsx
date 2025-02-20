import { useState, useEffect } from "react";
import { realtimeDb } from "../firebase/firebaseConfig";
import { ref, push, onValue, remove, update } from "firebase/database";
import { useParams } from "react-router-dom";
import { FaUserPlus, FaTrash, FaUsers, FaEdit, FaCheck, FaPhone, FaWhatsapp } from "react-icons/fa";
import { toast } from "react-toastify";

const Workers = () => {
  const { id } = useParams();
  const [workers, setWorkers] = useState([]);
  const [workerData, setWorkerData] = useState({
    name: "",
    type: "",
    wage: "",
    contact: "",
    joiningDate: "",
    address: "",
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

  useEffect(() => {
    if (!id) return;

    const workersRef = ref(realtimeDb, `projects/${id}/workers`);

    onValue(workersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const workerList = Object.entries(data).map(([workerId, workerData]) => ({
          id: workerId,
          ...workerData,
        }));
        
        // Extract unique worker types to add to dropdown
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
  }, [id]);

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
      
      // Set today's date if joining date is empty
      const joiningDate = workerData.joiningDate || new Date().toISOString().split('T')[0];
      
      if (editMode && editId) {
        await update(ref(realtimeDb, `projects/${id}/workers/${editId}`), {
          ...workerData,
          joiningDate,
          wage: parseFloat(workerData.wage)
        });
        toast.success("Worker updated successfully!");
        setEditMode(false);
        setEditId(null);
      } else {
        await push(workersRef, {
          ...workerData,
          joiningDate,
          wage: parseFloat(workerData.wage)
        });
        toast.success("New worker added successfully!");
      }

      // Add custom type to the dropdown list if it's new
      if (workerData.type && !workerTypes.includes(workerData.type)) {
        setWorkerTypes(prev => [...prev, workerData.type]);
      }

      // Reset form
      setWorkerData({
        name: "",
        type: "",
        wage: "",
        contact: "",
        joiningDate: "",
        address: ""
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
      address: worker.address || ""
    });
    setEditMode(true);
    setEditId(worker.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    setWorkerData({
      name: "",
      type: "",
      wage: "",
      contact: "",
      joiningDate: "",
      address: ""
    });
    setEditMode(false);
    setEditId(null);
    setCustomType("");
  };

  const handleDeleteWorker = async (workerId, workerName) => {
    if (window.confirm(`Are you sure you want to remove ${workerName} from the workers list?`)) {
      try {
        await remove(ref(realtimeDb, `projects/${id}/workers/${workerId}`));
        toast.success("Worker removed successfully");
      } catch (error) {
        toast.error("Error removing worker: " + error.message);
      }
    }
  };

  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const makePhoneCall = (contact) => {
    window.location.href = `tel:${contact}`;
  };

  const sendWhatsApp = (worker) => {
    const phoneNumber = worker.contact.startsWith("+") ? worker.contact.substring(1) : worker.contact;
    const message = `Hello ${worker.name}, `;
    window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`, "_blank");
  };

  const handleTypeSelection = (type) => {
    setWorkerData({...workerData, type});
    setShowTypeDropdown(false);
  };

  const handleCustomTypeSubmit = () => {
    if (customType.trim()) {
      setWorkerData({...workerData, type: customType.trim()});
      setShowTypeDropdown(false);
      setCustomType("");
    }
  };

  // Filter and sort workers
  const filteredWorkers = [...workers].filter(worker => 
    worker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    worker.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    worker.contact.includes(searchTerm)
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
  const averageWage = workers.length > 0 
    ? workers.reduce((sum, worker) => sum + parseFloat(worker.wage || 0), 0) / workers.length
    : 0;
  const workerTypeCount = workers.reduce((acc, worker) => {
    acc[worker.type] = (acc[worker.type] || 0) + 1;
    return acc;
  }, {});
  const topWorkerType = Object.entries(workerTypeCount).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";

  return (
    <div className="p-6 max-w-6xl mx-auto bg-white dark:bg-gray-900 shadow-xl rounded-xl">
      <h2 className="text-3xl font-extrabold text-indigo-700 dark:text-indigo-400 mb-8 text-center flex items-center justify-center gap-3">
        <FaUsers className="text-indigo-600 dark:text-indigo-300" />
        <span>Workforce Management</span>
      </h2>

      {/* Worker Form */}
      <div className="bg-indigo-50 dark:bg-indigo-900/20 p-6 rounded-lg shadow-md mb-8">
        <h3 className="text-xl font-bold mb-4 text-indigo-700 dark:text-indigo-300">
          {editMode ? "Edit Worker Details" : "Add New Worker"}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name *</label>
            <input
              type="text"
              placeholder="Enter worker's name"
              value={workerData.name}
              onChange={(e) => setWorkerData({ ...workerData, name: e.target.value })}
              className="w-full p-3 border rounded-lg shadow-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Worker Type *</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Select or type worker role"
                value={workerData.type}
                onChange={(e) => setWorkerData({ ...workerData, type: e.target.value })}
                onClick={() => setShowTypeDropdown(true)}
                className="w-full p-3 border rounded-lg shadow-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
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
              <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 shadow-lg rounded-md max-h-60 overflow-y-auto border border-gray-200 dark:border-gray-700">
                <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex">
                    <input
                      type="text"
                      placeholder="Add custom type"
                      value={customType}
                      onChange={(e) => setCustomType(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 p-2 border rounded-l-md dark:bg-gray-700 dark:text-white outline-none"
                    />
                    <button
                      onClick={handleCustomTypeSubmit}
                      className="bg-indigo-500 text-white px-3 rounded-r-md hover:bg-indigo-600"
                    >
                      Add
                    </button>
                  </div>
                </div>
                <ul>
                  {workerTypes.map((type, index) => (
                    <li 
                      key={index}
                      onClick={() => handleTypeSelection(type)}
                      className="px-4 py-2 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 cursor-pointer"
                    >
                      {type}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Daily Wage (₹) *</label>
            <input
              type="number"
              placeholder="Enter daily wage amount"
              value={workerData.wage}
              onChange={(e) => setWorkerData({ ...workerData, wage: e.target.value })}
              className="w-full p-3 border rounded-lg shadow-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contact Number *</label>
            <input
              type="text"
              placeholder="+91 or 10-digit number"
              value={workerData.contact}
              onChange={(e) => setWorkerData({ ...workerData, contact: e.target.value })}
              className="w-full p-3 border rounded-lg shadow-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Joining Date</label>
            <input
              type="date"
              value={workerData.joiningDate}
              onChange={(e) => setWorkerData({ ...workerData, joiningDate: e.target.value })}
              className="w-full p-3 border rounded-lg shadow-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address</label>
            <input
              type="text"
              placeholder="Worker's address"
              value={workerData.address}
              onChange={(e) => setWorkerData({ ...workerData, address: e.target.value })}
              className="w-full p-3 border rounded-lg shadow-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
        </div>
        
        <div className="flex gap-4 mt-6">
          <button
            onClick={handleAddWorker}
            className={`px-6 py-3 rounded-lg text-white font-medium transition flex items-center justify-center gap-2 ${
              editMode ? "bg-blue-600 hover:bg-blue-700" : "bg-indigo-600 hover:bg-indigo-700"
            }`}
          >
            {editMode ? (
              <>
                <FaCheck /> Update Worker
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
              className="px-6 py-3 rounded-lg bg-gray-500 text-white font-medium transition hover:bg-gray-600"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg shadow-md border-l-4 border-indigo-500">
          <h3 className="text-sm uppercase font-bold text-indigo-700 dark:text-indigo-400">Total Workers</h3>
          <p className="text-2xl font-bold text-indigo-800 dark:text-indigo-300">{totalWorkers}</p>
        </div>
        
        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg shadow-md border-l-4 border-purple-500">
          <h3 className="text-sm uppercase font-bold text-purple-700 dark:text-purple-400">Average Daily Wage</h3>
          <p className="text-2xl font-bold text-purple-800 dark:text-purple-300">₹{averageWage.toFixed(2)}</p>
        </div>
        
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg shadow-md border-l-4 border-blue-500">
          <h3 className="text-sm uppercase font-bold text-blue-700 dark:text-blue-400">Most Common Role</h3>
          <p className="text-2xl font-bold text-blue-800 dark:text-blue-300">{topWorkerType}</p>
        </div>
      </div>

      {/* Workers Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 flex flex-col sm:flex-row justify-between items-center gap-4">
          <h3 className="text-lg font-bold text-indigo-700 dark:text-indigo-300">
            Workforce List ({workers.length})
          </h3>
          
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Search workers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border dark:bg-gray-700 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            {workers.length > 0 ? (
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-indigo-100 dark:bg-indigo-900/40 text-left text-gray-700 dark:text-gray-300 text-sm">
                    <th className="p-4 cursor-pointer" onClick={() => handleSort('name')}>
                      <div className="flex items-center gap-1">
                        Name
                        {sortConfig.key === 'name' && (
                          <span>{sortConfig.direction === 'ascending' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </th>
                    <th className="p-4 cursor-pointer" onClick={() => handleSort('type')}>
                      <div className="flex items-center gap-1">
                        Role
                        {sortConfig.key === 'type' && (
                          <span>{sortConfig.direction === 'ascending' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </th>
                    <th className="p-4 cursor-pointer" onClick={() => handleSort('wage')}>
                      <div className="flex items-center gap-1">
                        Daily Wage
                        {sortConfig.key === 'wage' && (
                          <span>{sortConfig.direction === 'ascending' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </th>
                    <th className="p-4">Contact</th>
                    <th className="p-4">Joining Date</th>
                    <th className="p-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredWorkers.map((worker) => (
                    <tr 
                      key={worker.id}
                      className="border-t border-gray-200 dark:border-gray-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/10"
                    >
                      <td className="p-4 font-medium text-gray-800 dark:text-gray-200">{worker.name}</td>
                      <td className="p-4">
                        <span className="px-3 py-1 text-xs font-medium rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300">
                          {worker.type}
                        </span>
                      </td>
                      <td className="p-4 font-medium text-green-600 dark:text-green-400">₹{parseFloat(worker.wage).toLocaleString()}</td>
                      <td className="p-4 text-gray-600 dark:text-gray-400">{worker.contact}</td>
                      <td className="p-4 text-gray-600 dark:text-gray-400">
                        {worker.joiningDate ? new Date(worker.joiningDate).toLocaleDateString() : "—"}
                      </td>
                      <td className="p-4">
                        <div className="flex justify-center gap-2">
                          <button 
                            onClick={() => handleEditWorker(worker)}
                            title="Edit Worker"
                            className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full"
                          >
                            <FaEdit />
                          </button>
                          
                          <button 
                            onClick={() => makePhoneCall(worker.contact)}
                            title="Call Worker"
                            className="p-2 text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-full"
                          >
                            <FaPhone />
                          </button>
                          
                          <button 
                            onClick={() => sendWhatsApp(worker)}
                            title="Send WhatsApp Message"
                            className="p-2 text-green-500 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-full"
                          >
                            <FaWhatsapp />
                          </button>
                          
                          <button 
                            onClick={() => handleDeleteWorker(worker.id, worker.name)}
                            title="Remove Worker"
                            className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full"
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
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                <div className="flex flex-col items-center">
                  <FaUsers className="text-4xl text-gray-300 dark:text-gray-600 mb-3" />
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