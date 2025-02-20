import { useState, useEffect } from "react";
import { realtimeDb } from "../firebase/firebaseConfig";
import { ref, push, onValue, remove } from "firebase/database";
import { useParams } from "react-router-dom";
import { FaBox, FaPlusCircle, FaTrash, FaRupeeSign } from "react-icons/fa";

const Materials = () => {
  const { id } = useParams();
  const [materials, setMaterials] = useState([]);
  const [materialData, setMaterialData] = useState({
    name: "",
    quantity: "",
    unit: "",
    price: "",
  });
  const [loading, setLoading] = useState(true);

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
      const materialsRef = ref(realtimeDb, `projects/${id}/materials`);
      push(materialsRef, materialData);

      setMaterialData({ name: "", quantity: "", unit: "", price: "" });
    }
  };

  const handleDeleteMaterial = async (materialId) => {
    remove(ref(realtimeDb, `projects/${id}/materials/${materialId}`));
  };

  const calculateTotal = () => {
    return materials.reduce((sum, material) => {
      return sum + (parseFloat(material.price) * parseFloat(material.quantity) || 0);
    }, 0).toFixed(2);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto bg-gradient-to-b from-indigo-50 to-white dark:from-gray-900 dark:to-gray-800 shadow-2xl rounded-xl border border-indigo-100 dark:border-indigo-900">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold text-indigo-800 dark:text-indigo-300 flex items-center justify-center gap-3">
          <FaBox className="text-indigo-600 dark:text-indigo-400" /> 
          <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent dark:from-indigo-300 dark:to-purple-300">
            Material Inventory
          </span>
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Track and manage your project materials</p>
      </div>

      {/* Add Material Form */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-indigo-100 dark:border-indigo-900 mb-8">
        <h3 className="text-xl font-semibold text-indigo-700 dark:text-indigo-300 mb-4">Add New Material</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Material Name</label>
            <input
              type="text"
              placeholder="e.g., Cement, Bricks"
              value={materialData.name}
              onChange={(e) => setMaterialData({ ...materialData, name: e.target.value })}
              className="w-full p-3 border border-indigo-200 rounded-lg shadow-sm dark:bg-gray-700 dark:border-indigo-800 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Quantity</label>
            <input
              type="text"
              placeholder="e.g., 10, 25.5"
              value={materialData.quantity}
              onChange={(e) => setMaterialData({ ...materialData, quantity: e.target.value })}
              className="w-full p-3 border border-indigo-200 rounded-lg shadow-sm dark:bg-gray-700 dark:border-indigo-800 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Unit</label>
            <input
              type="text"
              placeholder="e.g., kg, meters, pieces"
              value={materialData.unit}
              onChange={(e) => setMaterialData({ ...materialData, unit: e.target.value })}
              className="w-full p-3 border border-indigo-200 rounded-lg shadow-sm dark:bg-gray-700 dark:border-indigo-800 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Price (₹)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaRupeeSign className="text-gray-500 dark:text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="e.g., 450, 1200.50"
                value={materialData.price}
                onChange={(e) => setMaterialData({ ...materialData, price: e.target.value })}
                className="w-full p-3 pl-8 border border-indigo-200 rounded-lg shadow-sm dark:bg-gray-700 dark:border-indigo-800 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              />
            </div>
          </div>
        </div>
        
        <button
          onClick={handleAddMaterial}
          className={`w-full mt-5 py-3 rounded-lg text-white font-semibold transition flex items-center justify-center gap-2 ${
            materialData.name.trim() && materialData.quantity.trim() && materialData.unit.trim() && materialData.price.trim()
              ? "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-indigo-200 dark:hover:shadow-indigo-900"
              : "bg-gray-400 cursor-not-allowed"
          }`}
          disabled={!materialData.name.trim() || !materialData.quantity.trim() || !materialData.unit.trim() || !materialData.price.trim()}
        >
          <FaPlusCircle className="text-white" /> Add Material
        </button>
      </div>

      {/* Loader */}
      {loading && (
        <div className="flex justify-center my-8">
          <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        </div>
      )}

      {/* Materials Table */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-indigo-100 dark:border-indigo-900">
        <h3 className="text-xl font-semibold text-indigo-700 dark:text-indigo-300 mb-4">Material Inventory</h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900 dark:to-purple-900 text-gray-800 dark:text-gray-200">
                <th className="p-4 text-left rounded-tl-lg">Name</th>
                <th className="p-4 text-center">Quantity</th>
                <th className="p-4 text-center">Unit</th>
                <th className="p-4 text-center">Price (₹)</th>
                <th className="p-4 text-center">Total</th>
                <th className="p-4 text-center rounded-tr-lg">Action</th>
              </tr>
            </thead>
            <tbody>
              {materials.length > 0 ? (
                materials.map((material, index) => (
                  <tr 
                    key={material.id} 
                    className={`transition-colors ${
                      index % 2 === 0 
                        ? "bg-white dark:bg-gray-800" 
                        : "bg-indigo-50 dark:bg-gray-750"
                    } hover:bg-indigo-100 dark:hover:bg-indigo-900`}
                  >
                    <td className="p-4 border-b border-indigo-100 dark:border-indigo-800 font-medium text-indigo-800 dark:text-indigo-300">
                      {material.name}
                    </td>
                    <td className="p-4 border-b border-indigo-100 dark:border-indigo-800 text-center">
                      {material.quantity}
                    </td>
                    <td className="p-4 border-b border-indigo-100 dark:border-indigo-800 text-center text-gray-600 dark:text-gray-400">
                      {material.unit}
                    </td>
                    <td className="p-4 border-b border-indigo-100 dark:border-indigo-800 text-center">
                      <span className="flex items-center justify-center gap-1">
                        <FaRupeeSign className="text-gray-500" />
                        {material.price}
                      </span>
                    </td>
                    <td className="p-4 border-b border-indigo-100 dark:border-indigo-800 text-center font-medium">
                      <span className="flex items-center justify-center gap-1 text-green-600 dark:text-green-400">
                        <FaRupeeSign />
                        {(parseFloat(material.price) * parseFloat(material.quantity)).toFixed(2)}
                      </span>
                    </td>
                    <td className="p-4 border-b border-indigo-100 dark:border-indigo-800 text-center">
                      <button
                        onClick={() => handleDeleteMaterial(material.id)}
                        className="p-2 text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900 rounded-full transition-all"
                        title="Delete material"
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="p-8">
                    <div className="flex flex-col items-center justify-center text-center">
                      <div className="bg-indigo-50 dark:bg-indigo-900 p-4 rounded-full mb-4">
                        <FaBox className="text-4xl text-indigo-400 dark:text-indigo-300" />
                      </div>
                      <p className="text-gray-500 dark:text-gray-400 text-lg">No materials added yet</p>
                      <p className="text-gray-400 dark:text-gray-500 mt-1">Start by adding your first material above</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
            {materials.length > 0 && (
              <tfoot>
                <tr className="bg-indigo-50 dark:bg-indigo-900 font-bold">
                  <td colSpan="4" className="p-4 text-right text-indigo-800 dark:text-indigo-200">
                    Total Cost:
                  </td>
                  <td className="p-4 text-center text-green-700 dark:text-green-300">
                    <span className="flex items-center justify-center gap-1">
                      <FaRupeeSign />
                      {calculateTotal()}
                    </span>
                  </td>
                  <td className="p-4"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};

export default Materials;