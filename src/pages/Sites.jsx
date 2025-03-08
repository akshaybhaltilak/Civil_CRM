import { useState, useEffect } from "react";
import { realtimeDb } from "../firebase/firebaseConfig";
import { ref, push, onValue, remove, update } from "firebase/database";
import { FaUserPlus, FaTrash, FaMoneyCheckAlt, FaWhatsapp, FaEdit, FaCheck, FaFilter, FaFileExport, FaPrint } from "react-icons/fa";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";

const Clients = () => {
  const { id } = useParams();
  const [clients, setClients] = useState([]);
  const [clientData, setClientData] = useState({
    name: "",
    address: "",
    contact: "",
    budget: "",
    received: "",
    pending: "",
    paymentType: "Cash",
    joinDate: new Date().toISOString().split('T')[0],
  });
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: "name", direction: 'ascending' });
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    if (!id) return;

    const clientsRef = ref(realtimeDb, `projects/${id}/clients`);
    onValue(clientsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const clientList = Object.entries(data).map(([clientId, clientInfo]) => ({
          id: clientId,
          ...clientInfo,
        }));
        setClients(clientList);
      } else {
        setClients([]);
      }
      setLoading(false);
    });
  }, [id]);

  const validateClientData = () => {
    if (!clientData.name.trim()) return "Client name is required";
    if (!clientData.contact.trim()) return "Contact number is required";
    
    const budget = parseFloat(clientData.budget);
    const received = parseFloat(clientData.received);
    
    if (isNaN(budget) || budget <= 0) return "Valid budget amount is required";
    if (isNaN(received)) return "Valid received amount is required";
    if (received > budget) return "Received amount cannot be greater than budget";
    
    return null;
  };

  const handleAddClient = async () => {
    const validationError = validateClientData();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    const budget = parseFloat(clientData.budget);
    const received = parseFloat(clientData.received);
    const pending = budget - received;
    const status = pending <= 0 ? "paid" : "pending";

    try {
      const clientsRef = ref(realtimeDb, `projects/${id}/clients`);
      
      if (editMode && editId) {
        await update(ref(realtimeDb, `projects/${id}/clients/${editId}`), {
          ...clientData,
          budget,
          received,
          pending,
          status,
          lastUpdated: new Date().toISOString(),
        });
        toast.success("Client updated successfully!");
        setEditMode(false);
        setEditId(null);
      } else {
        await push(clientsRef, {
          ...clientData,
          budget,
          received,
          pending,
          status,
          joinDate: clientData.joinDate || new Date().toISOString().split('T')[0],
          createdAt: new Date().toISOString(),
        });
        toast.success("New client added successfully!");
      }

      resetForm();
    } catch (error) {
      toast.error("Error: " + error.message);
    }
  };

  const resetForm = () => {
    setClientData({
      name: "",
      address: "",
      contact: "",
      budget: "",
      received: "",
      pending: "",
      paymentType: "Cash",
      joinDate: new Date().toISOString().split('T')[0],
    });
    setEditMode(false);
    setEditId(null);
  };

  const handleEditClient = (client) => {
    setClientData({
      name: client.name,
      address: client.address || "",
      contact: client.contact,
      budget: client.budget,
      received: client.received,
      pending: client.pending,
      paymentType: client.paymentType || "Cash",
      joinDate: client.joinDate || new Date().toISOString().split('T')[0],
    });
    setEditMode(true);
    setEditId(client.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteClient = async (clientId, clientName) => {
    if (window.confirm(`Are you sure you want to delete ${clientName}?`)) {
      try {
        await remove(ref(realtimeDb, `projects/${id}/clients/${clientId}`));
        toast.success("Client deleted successfully");
      } catch (error) {
        toast.error("Error deleting client: " + error.message);
      }
    }
  };

  const sendWhatsAppReminder = (client) => {
    const message = `Hello ${client.name}, this is a payment reminder for your project. Your pending payment is ₹${client.pending}. Please clear it at your earliest convenience.`;
    const phoneNumber = client.contact.startsWith("+") ? client.contact.substring(1) : client.contact;
    window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`, "_blank");
  };

  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const exportToCSV = () => {
    const headers = ["Name", "Address", "Contact", "Budget", "Received", "Pending", "Payment Type", "Join Date"];
    const csvData = [headers.join(",")];
    
    filteredClients.forEach(client => {
      const row = [
        client.name,
        client.address || "",
        client.contact,
        client.budget,
        client.received,
        client.pending,
        client.paymentType || "Cash",
        client.joinDate || "",
      ].map(item => `"${item}"`).join(",");
      
      csvData.push(row);
    });
    
    const csvString = csvData.join("\n");
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `clients_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const printClientList = () => {
    const printContent = document.getElementById("client-table").outerHTML;
    const originalContent = document.body.innerHTML;
    const printWindow = window.open("", "_blank");
    
    printWindow.document.open();
    printWindow.document.write(`
      <html>
        <head>
          <title>Client List</title>
          <style>
            body { font-family: Arial, sans-serif; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          <h1>Client List - ${new Date().toLocaleDateString()}</h1>
          ${printContent}
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.print();
  };

  // Filter clients based on search term and payment status
  const filteredClients = clients.filter(client => {
    const matchesSearch = 
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.contact.includes(searchTerm);
    
    if (filterStatus === "all") return matchesSearch;
    if (filterStatus === "paid") return matchesSearch && parseFloat(client.pending) <= 0;
    if (filterStatus === "pending") return matchesSearch && parseFloat(client.pending) > 0;
    
    return matchesSearch;
  });

  // Sort filtered clients
  const sortedClients = [...filteredClients];
  if (sortConfig.key) {
    sortedClients.sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });
  }

  // Calculate totals
  const totalBudget = clients.reduce((sum, client) => sum + parseFloat(client.budget || 0), 0);
  const totalReceived = clients.reduce((sum, client) => sum + parseFloat(client.received || 0), 0);
  const totalPending = clients.reduce((sum, client) => sum + parseFloat(client.pending || 0), 0);
  const paymentProgress = totalBudget > 0 ? (totalReceived / totalBudget) * 100 : 0;

  return (
    <div className="p-6 max-w-7xl mx-auto bg-white shadow-xl rounded-xl text-black">
      <h2 className="text-3xl font-extrabold text-blue-800 mb-8 text-center flex items-center justify-center gap-3">
        <FaMoneyCheckAlt className="text-blue-600" /> 
        <span>Client Management</span>
      </h2>

      {/* Client Form */}
      <div className="bg-blue-50 p-6 rounded-lg shadow-md mb-8 border border-blue-100">
        <h3 className="text-xl font-bold mb-4 text-blue-700">
          {editMode ? "Edit Client" : "Add New Client"}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Client Name *</label>
            <input
              type="text"
              placeholder="Enter full name"
              value={clientData.name}
              onChange={(e) => setClientData({ ...clientData, name: e.target.value })}
              className="w-full p-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <input
              type="text"
              placeholder="Street, City, etc."
              value={clientData.address}
              onChange={(e) => setClientData({ ...clientData, address: e.target.value })}
              className="w-full p-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number *</label>
            <input
              type="text"
              placeholder="+91 or 10-digit number"
              value={clientData.contact}
              onChange={(e) => setClientData({ ...clientData, contact: e.target.value })}
              className="w-full p-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Type</label>
            <select
              value={clientData.paymentType}
              onChange={(e) => setClientData({ ...clientData, paymentType: e.target.value })}
              className="w-full p-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="Cash">Cash</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="UPI">UPI</option>
              <option value="Check">Check</option>
              <option value="Credit Card">Credit Card</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Total Budget (₹) *</label>
            <input
              type="number"
              placeholder="Enter amount"
              value={clientData.budget}
              onChange={(e) => setClientData({ ...clientData, budget: e.target.value })}
              className="w-full p-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Received Amount (₹)</label>
            <input
              type="number"
              placeholder="Enter amount"
              value={clientData.received}
              onChange={(e) => setClientData({ ...clientData, received: e.target.value || 0 })}
              className="w-full p-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Join Date</label>
            <input
              type="date"
              value={clientData.joinDate}
              onChange={(e) => setClientData({ ...clientData, joinDate: e.target.value })}
              className="w-full p-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>
        
        <div className="flex gap-4 mt-6">
          <button
            onClick={handleAddClient}
            className={`px-6 py-3 rounded-lg text-white font-medium transition flex items-center justify-center gap-2 ${
              editMode ? "bg-blue-600 hover:bg-blue-700" : "bg-blue-500 hover:bg-blue-600"
            }`}
          >
            {editMode ? (
              <>
                <FaCheck /> Update Client
              </>
            ) : (
              <>
                <FaUserPlus /> Add Client
              </>
            )}
          </button>
          
          {editMode && (
            <button
              onClick={resetForm}
              className="px-6 py-3 rounded-lg bg-gray-500 text-white font-medium transition hover:bg-gray-600"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-blue-50 p-4 rounded-lg shadow-md border-l-4 border-blue-500">
          <h3 className="text-sm uppercase font-bold text-blue-700">Total Budget</h3>
          <p className="text-2xl font-bold text-blue-800">₹{totalBudget.toLocaleString()}</p>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg shadow-md border-l-4 border-green-500">
          <h3 className="text-sm uppercase font-bold text-green-700">Total Received</h3>
          <p className="text-2xl font-bold text-green-800">₹{totalReceived.toLocaleString()}</p>
        </div>
        
        <div className="bg-amber-50 p-4 rounded-lg shadow-md border-l-4 border-amber-500">
          <h3 className="text-sm uppercase font-bold text-amber-700">Total Pending</h3>
          <p className="text-2xl font-bold text-amber-800">₹{totalPending.toLocaleString()}</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-8 bg-gray-100 p-4 rounded-lg shadow">
        <div className="flex justify-between mb-2">
          <span className="text-sm font-medium text-blue-700">Payment Progress</span>
          <span className="text-sm font-medium text-blue-700">{paymentProgress.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className="bg-blue-600 h-2.5 rounded-full" 
            style={{ width: `${paymentProgress}%` }}
          ></div>
        </div>
      </div>

      {/* Client Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
        <div className="p-4 bg-blue-50 flex flex-col sm:flex-row justify-between items-center gap-4">
          <h3 className="text-lg font-bold text-blue-700">
            Client List ({clients.length})
          </h3>
          
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative">
              <input
                type="text"
                placeholder="Search clients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 rounded-lg border outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="p-2 rounded-lg border outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Clients</option>
              <option value="paid">Fully Paid</option>
              <option value="pending">Payment Pending</option>
            </select>

            <button onClick={exportToCSV} className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg" title="Export to CSV">
              <FaFileExport />
            </button>

            <button onClick={printClientList} className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg" title="Print Client List">
              <FaPrint />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="overflow-x-auto" id="client-table">
            {sortedClients.length > 0 ? (
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100 text-left text-gray-700 text-sm">
                    <th className="p-4 cursor-pointer" onClick={() => handleSort('name')}>
                      <div className="flex items-center gap-1">
                        Name
                        {sortConfig.key === 'name' && (
                          <span>{sortConfig.direction === 'ascending' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </th>
                    <th className="p-4">Contact</th>
                    <th className="p-4 cursor-pointer" onClick={() => handleSort('budget')}>
                      <div className="flex items-center gap-1">
                        Budget (₹)
                        {sortConfig.key === 'budget' && (
                          <span>{sortConfig.direction === 'ascending' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </th>
                    <th className="p-4">Received (₹)</th>
                    <th className="p-4 cursor-pointer" onClick={() => handleSort('pending')}>
                      <div className="flex items-center gap-1">
                        Pending (₹)
                        {sortConfig.key === 'pending' && (
                          <span>{sortConfig.direction === 'ascending' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Payment</th>
                    <th className="p-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedClients.map((client) => (
                    <tr 
                      key={client.id} 
                      className="border-t border-gray-200 hover:bg-blue-50"
                    >
                      <td className="p-4 font-medium text-blue-800">{client.name}</td>
                      <td className="p-4 text-gray-600">{client.contact}</td>
                      <td className="p-4 font-medium">₹{parseFloat(client.budget).toLocaleString()}</td>
                      <td className="p-4 text-blue-600">₹{parseFloat(client.received).toLocaleString()}</td>
                      <td className={`p-4 font-medium ${parseFloat(client.pending) > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                        ₹{parseFloat(client.pending).toLocaleString()}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          parseFloat(client.pending) <= 0 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {parseFloat(client.pending) <= 0 ? 'Paid' : 'Pending'}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                          {client.paymentType || "Cash"}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex justify-center gap-3">
                          <button 
                            onClick={() => handleEditClient(client)} 
                            title="Edit Client"
                            className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-full"
                          >
                            <FaEdit />
                          </button>
                          
                          {parseFloat(client.pending) > 0 && (
                            <button 
                              onClick={() => sendWhatsAppReminder(client)} 
                              title="Send WhatsApp Payment Reminder"
                              className="p-2 text-green-500 hover:text-green-700 hover:bg-green-50 rounded-full"
                            >
                              <FaWhatsapp />
                            </button>
                          )}
                          
                          <button 
                            onClick={() => handleDeleteClient(client.id, client.name)} 
                            title="Delete Client"
                            className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full"
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
                <p>No clients found. Add your first client to get started.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Clients;