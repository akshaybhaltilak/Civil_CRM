import { useState, useEffect } from "react";
import { realtimeDb } from "../firebase/firebaseConfig";
import { ref, push, onValue, remove, update } from "firebase/database";
import { useParams } from "react-router-dom";
import { 
  FaBox, 
  FaPlusCircle, 
  FaTrash, 
  FaRupeeSign, 
  FaEdit, 
  FaSearch,
  FaFileExport,
  FaSort,
  FaFilter
} from "react-icons/fa";

const Materials = () => {
  const { id } = useParams();
  const [materials, setMaterials] = useState([]);
  const [materialData, setMaterialData] = useState({
    name: "",
    quantity: "",
    unit: "",
    price: "",
    supplier: "",
    date: new Date().toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("name");
  const [sortDirection, setSortDirection] = useState("asc");
  const [editMode, setEditMode] = useState(false);
  const [currentMaterialId, setCurrentMaterialId] = useState(null);
  const [showLowStock, setShowLowStock] = useState(false);
  const [lowStockThreshold, setLowStockThreshold] = useState(10);

  useEffect(() => {
    if (!id) return;

    const materialsRef = ref(realtimeDb, `projects/${id}/materials`);

    onValue(materialsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const materialList = Object.entries(data).map(([materialId, materialData]) => ({
          id: materialId,
          ...materialData,
        }));
        setMaterials(materialList);
      } else {
        setMaterials([]);
      }
      setLoading(false);
    });
  }, [id]);

  const handleAddMaterial = async () => {
    if (materialData.name.trim() && materialData.quantity.trim() && materialData.unit.trim() && materialData.price.trim()) {
      if (editMode && currentMaterialId) {
        // Update existing material
        const materialRef = ref(realtimeDb, `projects/${id}/materials/${currentMaterialId}`);
        update(materialRef, materialData);
        setEditMode(false);
        setCurrentMaterialId(null);
      } else {
        // Add new material
        const materialsRef = ref(realtimeDb, `projects/${id}/materials`);
        push(materialsRef, materialData);
      }
      
      // Reset form
      setMaterialData({ 
        name: "", 
        quantity: "", 
        unit: "", 
        price: "", 
        supplier: "",
        date: new Date().toISOString().split('T')[0]
      });
    }
  };

  const handleEditMaterial = (material) => {
    setMaterialData({
      name: material.name,
      quantity: material.quantity,
      unit: material.unit,
      price: material.price,
      supplier: material.supplier || "",
      date: material.date || new Date().toISOString().split('T')[0]
    });
    setEditMode(true);
    setCurrentMaterialId(material.id);
    // Scroll to form
    document.getElementById('materialForm').scrollIntoView({ behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setMaterialData({ 
      name: "", 
      quantity: "", 
      unit: "", 
      price: "", 
      supplier: "",
      date: new Date().toISOString().split('T')[0]
    });
    setEditMode(false);
    setCurrentMaterialId(null);
  };

  const handleDeleteMaterial = async (materialId) => {
    if (window.confirm("Are you sure you want to delete this material?")) {
      remove(ref(realtimeDb, `projects/${id}/materials/${materialId}`));
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const sortedMaterials = [...materials]
    .filter(material => 
      material.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (!showLowStock || parseFloat(material.quantity) < lowStockThreshold)
    )
    .sort((a, b) => {
      if (sortField === "name") {
        return sortDirection === "asc" 
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      } else if (sortField === "quantity") {
        return sortDirection === "asc"
          ? parseFloat(a.quantity) - parseFloat(b.quantity)
          : parseFloat(b.quantity) - parseFloat(a.quantity);
      } else if (sortField === "price") {
        return sortDirection === "asc"
          ? parseFloat(a.price) - parseFloat(b.price)
          : parseFloat(b.price) - parseFloat(a.price);
      } else if (sortField === "total") {
        const totalA = parseFloat(a.price) * parseFloat(a.quantity);
        const totalB = parseFloat(b.price) * parseFloat(b.quantity);
        return sortDirection === "asc" ? totalA - totalB : totalB - totalA;
      }
      return 0;
    });

  const calculateTotal = () => {
    return materials.reduce((sum, material) => {
      return sum + (parseFloat(material.price) * parseFloat(material.quantity) || 0);
    }, 0).toFixed(2);
  };

  const exportToCSV = () => {
    const headers = ["Name", "Quantity", "Unit", "Price (₹)", "Supplier", "Date", "Total"];
    const csvData = materials.map(material => [
      material.name,
      material.quantity,
      material.unit,
      material.price,
      material.supplier || "N/A",
      material.date || "N/A",
      (parseFloat(material.price) * parseFloat(material.quantity)).toFixed(2)
    ]);
    
    const csvContent = [
      headers.join(","),
      ...csvData.map(row => row.join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `material_inventory_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto bg-white shadow-xl rounded-xl border border-gray-100">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold text-gray-800 flex items-center justify-center gap-3">
          <FaBox className="text-blue-600" /> 
          <span className="bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent">
            Material Inventory Management
          </span>
        </h2>
        <p className="text-gray-600 mt-2">Efficiently track, manage and optimize your project materials</p>
      </div>

      {/* Add/Edit Material Form */}
      <div id="materialForm" className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 mb-8 transition-all hover:shadow-xl">
        <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
          {editMode ? (
            <><FaEdit className="mr-2 text-blue-500" /> Edit Material</>
          ) : (
            <><FaPlusCircle className="mr-2 text-blue-500" /> Add New Material</>
          )}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Material Name*</label>
            <input
              type="text"
              placeholder="e.g., Cement, Bricks"
              value={materialData.name}
              onChange={(e) => setMaterialData({ ...materialData, name: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quantity*</label>
            <input
              type="text"
              placeholder="e.g., 10, 25.5"
              value={materialData.quantity}
              onChange={(e) => setMaterialData({ ...materialData, quantity: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Unit*</label>
            <input
              type="text"
              placeholder="e.g., kg, meters, pieces"
              value={materialData.unit}
              onChange={(e) => setMaterialData({ ...materialData, unit: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)*</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaRupeeSign className="text-gray-500" />
              </div>
              <input
                type="text"
                placeholder="e.g., 450, 1200.50"
                value={materialData.price}
                onChange={(e) => setMaterialData({ ...materialData, price: e.target.value })}
                className="w-full p-3 pl-8 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
            <input
              type="text"
              placeholder="e.g., ABC Suppliers"
              value={materialData.supplier}
              onChange={(e) => setMaterialData({ ...materialData, supplier: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Date</label>
            <input
              type="date"
              value={materialData.date}
              onChange={(e) => setMaterialData({ ...materialData, date: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            />
          </div>
        </div>
        
        <div className="flex gap-3 mt-5">
          <button
            onClick={handleAddMaterial}
            className={`flex-1 py-3 rounded-lg text-white font-semibold transition flex items-center justify-center gap-2 ${
              materialData.name.trim() && materialData.quantity.trim() && materialData.unit.trim() && materialData.price.trim()
                ? "bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600 shadow-lg hover:shadow-blue-100"
                : "bg-gray-400 cursor-not-allowed"
            }`}
            disabled={!materialData.name.trim() || !materialData.quantity.trim() || !materialData.unit.trim() || !materialData.price.trim()}
          >
            {editMode ? (
              <><FaEdit /> Update Material</>
            ) : (
              <><FaPlusCircle /> Add Material</>
            )}
          </button>
          
          {editMode && (
            <button
              onClick={handleCancelEdit}
              className="flex-1 py-3 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold transition flex items-center justify-center gap-2"
            >
              Cancel Edit
            </button>
          )}
        </div>
      </div>

      {/* Loader */}
      {loading && (
        <div className="flex justify-center my-8">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
      )}

      {/* Search and Filters */}
      {!loading && materials.length > 0 && (
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search materials..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
          
          <div className="flex gap-3">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="lowStockFilter"
                checked={showLowStock}
                onChange={(e) => setShowLowStock(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 rounded"
              />
              <label htmlFor="lowStockFilter" className="text-gray-700">Low Stock</label>
              <input
                type="number"
                min="1"
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(e.target.value)}
                className="w-16 p-1 border border-gray-300 rounded text-center"
                disabled={!showLowStock}
              />
            </div>
            
            <button
              onClick={exportToCSV}
              className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg flex items-center gap-1 transition-colors"
              title="Export to CSV"
            >
              <FaFileExport /> Export
            </button>
          </div>
        </div>
      )}

      {/* Materials Table */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 transition-all hover:shadow-xl">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Material Inventory</h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-700">
                <th 
                  className="p-4 text-left rounded-tl-lg cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("name")}
                >
                  <div className="flex items-center gap-1">
                    Name
                    <FaSort className={`text-xs ${sortField === "name" ? "text-blue-500" : "text-gray-400"}`} />
                  </div>
                </th>
                <th 
                  className="p-4 text-center cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("quantity")}
                >
                  <div className="flex items-center justify-center gap-1">
                    Quantity
                    <FaSort className={`text-xs ${sortField === "quantity" ? "text-blue-500" : "text-gray-400"}`} />
                  </div>
                </th>
                <th className="p-4 text-center">Unit</th>
                <th 
                  className="p-4 text-center cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("price")}
                >
                  <div className="flex items-center justify-center gap-1">
                    Price (₹)
                    <FaSort className={`text-xs ${sortField === "price" ? "text-blue-500" : "text-gray-400"}`} />
                  </div>
                </th>
                <th 
                  className="p-4 text-center cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("total")}
                >
                  <div className="flex items-center justify-center gap-1">
                    Total
                    <FaSort className={`text-xs ${sortField === "total" ? "text-blue-500" : "text-gray-400"}`} />
                  </div>
                </th>
                <th className="p-4 text-center">Supplier</th>
                <th className="p-4 text-center rounded-tr-lg">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedMaterials.length > 0 ? (
                sortedMaterials.map((material, index) => {
                  const isLowStock = parseFloat(material.quantity) < lowStockThreshold;
                  return (
                    <tr 
                      key={material.id} 
                      className={`transition-colors ${
                        index % 2 === 0 
                          ? "bg-white" 
                          : "bg-gray-50"
                      } hover:bg-blue-50`}
                    >
                      <td className="p-4 border-b border-gray-200 font-medium text-gray-800">
                        {material.name}
                        {isLowStock && (
                          <span className="ml-2 bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                            Low Stock
                          </span>
                        )}
                      </td>
                      <td className={`p-4 border-b border-gray-200 text-center ${isLowStock ? "text-red-600 font-medium" : ""}`}>
                        {material.quantity}
                      </td>
                      <td className="p-4 border-b border-gray-200 text-center text-gray-600">
                        {material.unit}
                      </td>
                      <td className="p-4 border-b border-gray-200 text-center">
                        <span className="flex items-center justify-center gap-1">
                          <FaRupeeSign className="text-gray-500" />
                          {material.price}
                        </span>
                      </td>
                      <td className="p-4 border-b border-gray-200 text-center font-medium">
                        <span className="flex items-center justify-center gap-1 text-green-600">
                          <FaRupeeSign />
                          {(parseFloat(material.price) * parseFloat(material.quantity)).toFixed(2)}
                        </span>
                      </td>
                      <td className="p-4 border-b border-gray-200 text-center text-gray-600">
                        {material.supplier || "—"}
                      </td>
                      <td className="p-4 border-b border-gray-200 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEditMaterial(material)}
                            className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-100 rounded-full transition-all"
                            title="Edit material"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => handleDeleteMaterial(material.id)}
                            className="p-2 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-full transition-all"
                            title="Delete material"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="p-8">
                    <div className="flex flex-col items-center justify-center text-center">
                      <div className="bg-gray-100 p-4 rounded-full mb-4">
                        <FaBox className="text-4xl text-gray-400" />
                      </div>
                      {materials.length === 0 ? (
                        <>
                          <p className="text-gray-500 text-lg">No materials added yet</p>
                          <p className="text-gray-400 mt-1">Start by adding your first material above</p>
                        </>
                      ) : (
                        <p className="text-gray-500 text-lg">No materials match your search criteria</p>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
            {materials.length > 0 && (
              <tfoot>
                <tr className="bg-gray-50 font-bold">
                  <td colSpan="4" className="p-4 text-right text-gray-800">
                    Total Inventory Cost:
                  </td>
                  <td className="p-4 text-center text-green-700">
                    <span className="flex items-center justify-center gap-1">
                      <FaRupeeSign />
                      {calculateTotal()}
                    </span>
                  </td>
                  <td colSpan="2" className="p-4"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
      
      {/* Summary Cards */}
      {!loading && materials.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 transition-all hover:shadow-lg">
            <h4 className="text-lg font-semibold text-gray-800 mb-2">Total Materials</h4>
            <p className="text-3xl font-bold text-blue-600">{materials.length}</p>
            <p className="text-gray-500 mt-2">Items in inventory</p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 transition-all hover:shadow-lg">
            <h4 className="text-lg font-semibold text-gray-800 mb-2">Total Investment</h4>
            <p className="text-3xl font-bold text-green-600 flex items-center">
              <FaRupeeSign className="text-2xl" />
              {calculateTotal()}
            </p>
            <p className="text-gray-500 mt-2">Current inventory value</p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 transition-all hover:shadow-lg">
            <h4 className="text-lg font-semibold text-gray-800 mb-2">Low Stock Alert</h4>
            <p className="text-3xl font-bold text-red-600">
              {materials.filter(m => parseFloat(m.quantity) < lowStockThreshold).length}
            </p>
            <p className="text-gray-500 mt-2">Items below threshold ({lowStockThreshold})</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Materials;