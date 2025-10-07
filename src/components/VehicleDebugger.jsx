import { useState, useEffect } from "react";
import { vehicleAPI } from "../utils/api";
import { useAuth } from "../context/AuthContext";

const VehicleDebugger = () => {
  const { user, isAuthenticated } = useAuth();
  const [debugInfo, setDebugInfo] = useState({
    authState: null,
    vehicles: [],
    loading: false,
    error: null,
  });

  useEffect(() => {
    setDebugInfo((prev) => ({
      ...prev,
      authState: { isAuthenticated, user },
    }));
  }, [isAuthenticated, user]);

  const testVehicleAPI = async () => {
    setDebugInfo((prev) => ({ ...prev, loading: true, error: null }));

    try {
      console.log("🔍 Testing vehicle API...");
      const response = await vehicleAPI.getUserVehicles();
      console.log("✅ Vehicle API Response:", response);

      setDebugInfo((prev) => ({
        ...prev,
        vehicles: response.data?.data || response.data || [],
        loading: false,
      }));
    } catch (error) {
      console.error("❌ Vehicle API Error:", error);
      setDebugInfo((prev) => ({
        ...prev,
        error: error.response?.data || error.message,
        loading: false,
      }));
    }
  };

  return (
    <div className="fixed top-4 right-4 bg-white p-4 rounded-lg shadow-lg z-50 max-w-md">
      <h3 className="font-bold text-lg mb-2">🔧 Vehicle Debug Info</h3>

      <div className="mb-2">
        <strong>Auth Status:</strong>{" "}
        {isAuthenticated ? "✅ Authenticated" : "❌ Not Authenticated"}
      </div>

      <div className="mb-2">
        <strong>User:</strong> {user ? `${user.name} (${user.email})` : "None"}
      </div>

      <div className="mb-2">
        <strong>Token:</strong>{" "}
        {localStorage.getItem("token") ? "✅ Present" : "❌ Missing"}
      </div>

      <button
        onClick={testVehicleAPI}
        disabled={debugInfo.loading}
        className="bg-blue-500 text-white px-3 py-1 rounded text-sm mb-2"
      >
        {debugInfo.loading ? "Testing..." : "Test Vehicle API"}
      </button>

      {debugInfo.error && (
        <div className="text-red-600 text-sm mb-2">
          <strong>Error:</strong> {JSON.stringify(debugInfo.error)}
        </div>
      )}

      <div className="mb-2">
        <strong>Vehicles Found:</strong> {debugInfo.vehicles.length}
        {debugInfo.vehicles.map((vehicle, index) => (
          <div key={index} className="text-xs mt-1 pl-2">
            • {vehicle.vehicleNumber} - {vehicle.brand} {vehicle.model}
          </div>
        ))}
      </div>
    </div>
  );
};

export default VehicleDebugger;
