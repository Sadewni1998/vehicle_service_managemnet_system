import { useState, useEffect } from "react";
import { vehicleAPI } from "../utils/api";
import { useAuth } from "../context/AuthContext";

const VehicleSelectionTest = () => {
  const { user, isAuthenticated } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [logs, setLogs] = useState([]);

  const addLog = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [`[${timestamp}] ${message}`, ...prev.slice(0, 9)]);
    console.log(message);
  };

  const fetchVehicles = async () => {
    addLog("🚗 Starting vehicle fetch...");
    setLoading(true);
    setError(null);

    try {
      addLog(
        `📊 Auth state: ${
          isAuthenticated ? "Authenticated" : "Not authenticated"
        }`
      );
      addLog(`👤 User: ${user?.name || "None"}`);
      addLog(
        `🔑 Token: ${localStorage.getItem("token") ? "Present" : "Missing"}`
      );

      const response = await vehicleAPI.getUserVehicles();
      addLog(`📦 API Response received: ${JSON.stringify(response.data)}`);

      const vehiclesData = response.data?.data || response.data || [];
      addLog(`🚗 Vehicles processed: ${vehiclesData.length} vehicles`);

      setVehicles(Array.isArray(vehiclesData) ? vehiclesData : []);
      addLog("✅ Vehicles set successfully");
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message;
      addLog(`❌ Error: ${errorMsg}`);
      setError(errorMsg);
      setVehicles([]);
    } finally {
      setLoading(false);
      addLog("🏁 Vehicle fetch completed");
    }
  };

  useEffect(() => {
    addLog("🎯 Component mounted");
    if (isAuthenticated && user) {
      fetchVehicles();
    } else {
      addLog("⏳ Waiting for authentication...");
    }
  }, [isAuthenticated, user]);

  return (
    <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-75 z-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">
          🔧 Vehicle Selection Diagnostic
        </h2>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <h3 className="font-semibold mb-2">Current State:</h3>
            <div className="text-sm space-y-1">
              <div>Auth: {isAuthenticated ? "✅" : "❌"}</div>
              <div>User: {user?.name || "None"}</div>
              <div>Token: {localStorage.getItem("token") ? "✅" : "❌"}</div>
              <div>Loading: {loading ? "⏳" : "✅"}</div>
              <div>Vehicles: {vehicles.length}</div>
              <div>Error: {error ? "❌" : "✅"}</div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Test Vehicle Dropdown:</h3>
            <select className="w-full p-2 border rounded">
              <option value="">
                Select Vehicle ({vehicles.length} available)
              </option>
              {vehicles.map((vehicle) => (
                <option key={vehicle.vehicleId} value={vehicle.vehicleId}>
                  {vehicle.vehicleNumber} - {vehicle.brand} {vehicle.model}
                </option>
              ))}
            </select>

            <button
              onClick={fetchVehicles}
              disabled={loading}
              className="mt-2 px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
            >
              {loading ? "Refreshing..." : "Refresh Vehicles"}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <strong>Error:</strong> {error}
          </div>
        )}

        <div>
          <h3 className="font-semibold mb-2">Activity Log:</h3>
          <div className="bg-gray-100 p-3 rounded text-xs font-mono h-32 overflow-y-auto">
            {logs.map((log, index) => (
              <div key={index}>{log}</div>
            ))}
          </div>
        </div>

        <div className="mt-4 flex justify-between">
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-gray-500 text-white rounded"
          >
            Reload Page
          </button>
          <button
            onClick={() => {
              // Remove this component by setting display none
              document.querySelector(
                '[data-testid="vehicle-test"]'
              ).style.display = "none";
            }}
            className="px-4 py-2 bg-red-500 text-white rounded"
          >
            Close Test
          </button>
        </div>
      </div>
    </div>
  );
};

export default VehicleSelectionTest;
