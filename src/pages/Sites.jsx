import { useState, useEffect } from "react";
import { realtimeDb } from "../firebase/firebaseConfig";
import { ref, push, onValue, remove, update } from "firebase/database";
import { FaMoneyBill, FaTrash, FaEdit, FaCheck, FaFileExport, FaPrint, FaPlus, FaWhatsapp, FaPhone, FaUser } from "react-icons/fa";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";

const Clients = () => {
  const { id } = useParams();
  const [payments, setPayments] = useState([]);
  const [clientInfo, setClientInfo] = useState({
    name: "",
    address: "",
    contact: "",
    totalBudget: "",
    email: "", // Added email field
  });
  const [paymentData, setPaymentData] = useState({
    amount: "",
    date: new Date().toISOString().split('T')[0],
    description: "",
    paymentMethod: "Cash",
  });
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: "date", direction: 'descending' });

  // Load client data and payment history
  useEffect(() => {
    if (!id) return;

    // Load client info
    const clientRef = ref(realtimeDb, `projects/${id}/clientInfo`);
    onValue(clientRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setClientInfo(data);
      } else {
        // Set default values if no client exists yet
        setClientInfo({
          name: "Client",
          address: "",
          contact: "",
          totalBudget: "0",
          email: "",
        });
      }
    });

    // Load payment history
    const paymentsRef = ref(realtimeDb, `projects/${id}/payments`);
    onValue(paymentsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const paymentList = Object.entries(data).map(([paymentId, paymentInfo]) => ({
          id: paymentId,
          ...paymentInfo,
        }));
        setPayments(paymentList);
      } else {
        setPayments([]);
      }
      setLoading(false);
    });
  }, [id]);

  // Save or update client information
  const saveClientInfo = async () => {
    if (!clientInfo.name.trim()) {
      toast.error("Client name is required");
      return;
    }

    try {
      await update(ref(realtimeDb, `projects/${id}/clientInfo`), clientInfo);
      toast.success("Client information updated");
    } catch (error) {
      toast.error("Error: " + error.message);
    }
  };

  // Validate payment data
  const validatePaymentData = () => {
    const amount = parseFloat(paymentData.amount);
    if (isNaN(amount) || amount <= 0) return "Valid payment amount is required";
    if (!paymentData.date) return "Payment date is required";
    if (!paymentData.description.trim()) return "Payment description is required";
    return null;
  };

  // Add or update payment
  const handleAddPayment = async () => {
    const validationError = validatePaymentData();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    try {
      const paymentsRef = ref(realtimeDb, `projects/${id}/payments`);
      const amount = parseFloat(paymentData.amount);
      
      if (editMode && editId) {
        await update(ref(realtimeDb, `projects/${id}/payments/${editId}`), {
          ...paymentData,
          amount,
          lastUpdated: new Date().toISOString(),
        });
        toast.success("Payment updated successfully!");
        setEditMode(false);
        setEditId(null);
      } else {
        await push(paymentsRef, {
          ...paymentData,
          amount,
          createdAt: new Date().toISOString(),
        });
        toast.success("Payment added successfully!");
      }

      resetPaymentForm();
    } catch (error) {
      toast.error("Error: " + error.message);
    }
  };

  // Reset payment form
  const resetPaymentForm = () => {
    setPaymentData({
      amount: "",
      date: new Date().toISOString().split('T')[0],
      description: "",
      paymentMethod: "Cash",
    });
    setEditMode(false);
    setEditId(null);
  };

  // Edit payment
  const handleEditPayment = (payment) => {
    setPaymentData({
      amount: payment.amount,
      date: payment.date,
      description: payment.description || "",
      paymentMethod: payment.paymentMethod || "Cash",
    });
    setEditMode(true);
    setEditId(payment.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Delete payment
  const handleDeletePayment = async (paymentId, description) => {
    if (window.confirm(`Are you sure you want to delete payment: ${description}?`)) {
      try {
        await remove(ref(realtimeDb, `projects/${id}/payments/${paymentId}`));
        toast.success("Payment deleted successfully");
      } catch (error) {
        toast.error("Error deleting payment: " + error.message);
      }
    }
  };

  // Handle sorting
  const handleSort = (key) => {
    let direction = 'descending';
    if (sortConfig.key === key && sortConfig.direction === 'descending') {
      direction = 'ascending';
    }
    setSortConfig({ key, direction });
  };

  // Call client directly
  const handleCallClient = () => {
    if (!clientInfo.contact) {
      toast.error("No contact number available");
      return;
    }
    window.location.href = `tel:${clientInfo.contact}`;
  };

  // Send WhatsApp message to client
  const handleWhatsAppMessage = (paymentId = null) => {
    if (!clientInfo.contact) {
      toast.error("No contact number available");
      return;
    }
    
    let message = "";
    
    if (paymentId) {
      // Find the specific payment
      const payment = payments.find(p => p.id === paymentId);
      if (payment) {
        message = encodeURIComponent(
          `Hello ${clientInfo.name},\n\n` +
          `We've recorded your payment of ₹${payment.amount} on ${payment.date} for "${payment.description}".\n\n` +
          `Payment method: ${payment.paymentMethod}\n` +
          `Thank you for your business!`
        );
      }
    } else {
      // General message about payment status
      message = encodeURIComponent(
        `Hello ${clientInfo.name},\n\n` +
        `Your current payment status:\n` +
        `Total Budget: ₹${totalBudget.toLocaleString()}\n` +
        `Total Received: ₹${totalReceived.toLocaleString()}\n` +
        `Total Pending: ₹${totalPending.toLocaleString()}\n\n` +
        `Thank you for your business!`
      );
    }
    
    window.open(`https://wa.me/${clientInfo.contact.replace(/[^0-9]/g, '')}?text=${message}`, '_blank');
  };

  // Export payments to CSV
  const exportToCSV = () => {
    const headers = ["Date", "Description", "Amount", "Payment Method"];
    const csvData = [headers.join(",")];
    
    filteredPayments.forEach(payment => {
      const row = [
        payment.date,
        payment.description || "",
        payment.amount,
        payment.paymentMethod || "Cash",
      ].map(item => `"${item}"`).join(",");
      
      csvData.push(row);
    });
    
    const csvString = csvData.join("\n");
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `payments_${clientInfo.name}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print payment list
  const printPaymentList = () => {
    const printContent = document.getElementById("payment-table").outerHTML;
    const printWindow = window.open("", "_blank");
    
    printWindow.document.open();
    printWindow.document.write(`
      <html>
        <head>
          <title>Payment History - ${clientInfo.name}</title>
          <style>
            body { font-family: Arial, sans-serif; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          <h1>Payment History - ${clientInfo.name} - ${new Date().toLocaleDateString()}</h1>
          ${printContent}
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.print();
  };

  // Filter payments based on search term
  const filteredPayments = payments.filter(payment => 
    payment.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.paymentMethod.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort filtered payments
  const sortedPayments = [...filteredPayments];
  if (sortConfig.key) {
    sortedPayments.sort((a, b) => {
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
  const totalBudget = parseFloat(clientInfo.totalBudget) || 0;
  const totalReceived = payments.reduce((sum, payment) => sum + parseFloat(payment.amount || 0), 0);
  const totalPending = totalBudget - totalReceived;
  const paymentProgress = totalBudget > 0 ? (totalReceived / totalBudget) * 100 : 0;

  return (
    <div className="p-6 max-w-7xl mx-auto bg-white shadow-xl rounded-xl text-black">
      {/* Client Dashboard Header */}
      <div className="bg-blue-600 text-white p-6 rounded-lg shadow-md mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-white rounded-full p-3 text-blue-600">
            <FaUser size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold">{clientInfo.name || "Client"}</h2>
            <p className="opacity-75">{clientInfo.address}</p>
          </div>
        </div>
        
        <div className="flex gap-3 items-center">
          {clientInfo.contact && (
            <>
              <button 
                onClick={handleCallClient}
                className="px-4 py-2 bg-green-500 rounded-lg flex items-center gap-2 hover:bg-green-600 transition"
                title="Call Client"
              >
                <FaPhone /> Call
              </button>
              
              <button 
                onClick={() => handleWhatsAppMessage()}
                className="px-4 py-2 bg-green-400 rounded-lg flex items-center gap-2 hover:bg-green-500 transition"
                title="WhatsApp Client"
              >
                <FaWhatsapp /> WhatsApp
              </button>
            </>
          )}
        </div>
      </div>

      <h2 className="text-3xl font-extrabold text-blue-800 mb-8 text-center flex items-center justify-center gap-3">
        <FaMoneyBill className="text-blue-600" /> 
        <span>Client Payment Management</span>
      </h2>

      {/* Client Information */}
      <div className="bg-blue-50 p-6 rounded-lg shadow-md mb-8 border border-blue-100">
        <h3 className="text-xl font-bold mb-4 text-blue-700">Client Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Client Name *</label>
            <input
              type="text"
              value={clientInfo.name}
              onChange={(e) => setClientInfo({ ...clientInfo, name: e.target.value })}
              className="w-full p-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={clientInfo.email || ""}
              onChange={(e) => setClientInfo({ ...clientInfo, email: e.target.value })}
              className="w-full p-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
            <input
              type="text"
              value={clientInfo.contact}
              onChange={(e) => setClientInfo({ ...clientInfo, contact: e.target.value })}
              className="w-full p-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Include country code for WhatsApp"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <input
              type="text"
              value={clientInfo.address}
              onChange={(e) => setClientInfo({ ...clientInfo, address: e.target.value })}
              className="w-full p-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Total Budget (₹)</label>
            <input
              type="number"
              value={clientInfo.totalBudget}
              onChange={(e) => setClientInfo({ ...clientInfo, totalBudget: e.target.value })}
              className="w-full p-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>
        
        <button
          onClick={saveClientInfo}
          className="mt-4 px-6 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition flex items-center gap-2"
        >
          <FaCheck /> Save Client Information
        </button>
      </div>

      {/* Add Payment Form */}
      <div className="bg-green-50 p-6 rounded-lg shadow-md mb-8 border border-green-100">
        <h3 className="text-xl font-bold mb-4 text-green-700">
          {editMode ? "Edit Payment" : "Add New Payment"}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹) *</label>
            <input
              type="number"
              value={paymentData.amount}
              onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
              className="w-full p-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 outline-none"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
            <input
              type="date"
              value={paymentData.date}
              onChange={(e) => setPaymentData({ ...paymentData, date: e.target.value })}
              className="w-full p-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 outline-none"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
            <select
              value={paymentData.paymentMethod}
              onChange={(e) => setPaymentData({ ...paymentData, paymentMethod: e.target.value })}
              className="w-full p-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 outline-none"
            >
              <option value="Cash">Cash</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="UPI">UPI</option>
              <option value="Check">Check</option>
              <option value="Credit Card">Credit Card</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
            <input
              type="text"
              placeholder="e.g. First installment, Advance payment, etc."
              value={paymentData.description}
              onChange={(e) => setPaymentData({ ...paymentData, description: e.target.value })}
              className="w-full p-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 outline-none"
            />
          </div>
        </div>
        
        <div className="flex gap-4 mt-6">
          <button
            onClick={handleAddPayment}
            className={`px-6 py-3 rounded-lg text-white font-medium transition flex items-center justify-center gap-2 ${
              editMode ? "bg-blue-600 hover:bg-blue-700" : "bg-green-500 hover:bg-green-600"
            }`}
          >
            {editMode ? (
              <>
                <FaCheck /> Update Payment
              </>
            ) : (
              <>
                <FaPlus /> Add Payment
              </>
            )}
          </button>
          
          {editMode && (
            <button
              onClick={resetPaymentForm}
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
            style={{ width: `${Math.min(paymentProgress, 100)}%` }}
          ></div>
        </div>
      </div>

      {/* Payments History Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
        <div className="p-4 bg-blue-50 flex flex-col sm:flex-row justify-between items-center gap-4">
          <h3 className="text-lg font-bold text-blue-700">
            Payment History ({payments.length})
          </h3>
          
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative">
              <input
                type="text"
                placeholder="Search payments..."
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

            <button onClick={exportToCSV} className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg" title="Export to CSV">
              <FaFileExport />
            </button>

            <button onClick={printPaymentList} className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg" title="Print Payment History">
              <FaPrint />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="overflow-x-auto" id="payment-table">
            {sortedPayments.length > 0 ? (
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100 text-left text-gray-700 text-sm">
                    <th className="p-4 cursor-pointer" onClick={() => handleSort('date')}>
                      <div className="flex items-center gap-1">
                        Date
                        {sortConfig.key === 'date' && (
                          <span>{sortConfig.direction === 'ascending' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </th>
                    <th className="p-4">Description</th>
                    <th className="p-4 cursor-pointer" onClick={() => handleSort('amount')}>
                      <div className="flex items-center gap-1">
                        Amount (₹)
                        {sortConfig.key === 'amount' && (
                          <span>{sortConfig.direction === 'ascending' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </th>
                    <th className="p-4">Payment Method</th>
                    <th className="p-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedPayments.map((payment) => (
                    <tr 
                      key={payment.id} 
                      className="border-t border-gray-200 hover:bg-blue-50"
                    >
                      <td className="p-4 font-medium text-blue-800">{payment.date}</td>
                      <td className="p-4 text-gray-600">{payment.description}</td>
                      <td className="p-4 font-medium text-green-600">₹{parseFloat(payment.amount).toLocaleString()}</td>
                      <td className="p-4">
                        <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                          {payment.paymentMethod || "Cash"}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex justify-center gap-2">
                          {clientInfo.contact && (
                            <button 
                              onClick={() => handleWhatsAppMessage(payment.id)} 
                              title="Send Receipt via WhatsApp"
                              className="p-2 text-green-500 hover:text-green-700 hover:bg-green-50 rounded-full"
                            >
                              <FaWhatsapp />
                            </button>
                          )}
                          <button 
                            onClick={() => handleEditPayment(payment)} 
                            title="Edit Payment"
                            className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-full"
                          >
                            <FaEdit />
                          </button>
                          <button 
                            onClick={() => handleDeletePayment(payment.id, payment.description)} 
                            title="Delete Payment"
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
                <p>No payment records found. Add your first payment to get started.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Clients;