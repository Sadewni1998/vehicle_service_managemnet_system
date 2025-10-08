import { useState, useEffect } from "react";

const SimpleVehicleTest = () => {
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Mock vehicle data for testing
  const mockVehicles = [
    { id: 1, make: "Toyota", model: "Camry", licenseNumber: "ABC-1234" },
    { id: 2, make: "Honda", model: "Civic", licenseNumber: "XYZ-5678" },
    { id: 3, make: "Nissan", model: "Altima", licenseNumber: "DEF-9012" },
  ];

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setVehicles(mockVehicles);
      setLoading(false);
    }, 1000);
  }, []);

  const handleSelection = (event) => {
    const value = event.target.value;
    console.log("🔥 Simple dropdown selection:", value);
    setSelectedVehicle(value);
  };

  const handleTestClick = () => {
    console.log("🔥 Test button clicked");
    alert(`Selected vehicle: ${selectedVehicle || "None"}`);
  };

  return (
    <div className="p-6 bg-white border border-gray-300 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">
        Simple Vehicle Dropdown Test
      </h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Select Vehicle:
          </label>
          <select
            value={selectedVehicle}
            onChange={handleSelection}
            disabled={loading}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">-- Select a Vehicle --</option>
            {vehicles.map((vehicle) => (
              <option key={vehicle.id} value={vehicle.id}>
                {vehicle.make} {vehicle.model} ({vehicle.licenseNumber})
              </option>
            ))}
          </select>
        </div>

        <div className="text-sm text-gray-600">
          <p>Loading: {loading ? "Yes" : "No"}</p>
          <p>Vehicles Count: {vehicles.length}</p>
          <p>Selected Value: {selectedVehicle || "None"}</p>
          <p>Error: {error || "None"}</p>
        </div>

        <button
          onClick={handleTestClick}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Test Selection
        </button>

        <div className="mt-4">
          <h4 className="font-medium mb-2">Available Vehicles:</h4>
          <ul className="list-disc list-inside text-sm">
            {vehicles.map((vehicle) => (
              <li key={vehicle.id}>
                ID: {vehicle.id} - {vehicle.make} {vehicle.model} (
                {vehicle.licenseNumber})
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SimpleVehicleTest;
