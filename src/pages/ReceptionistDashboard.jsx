import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Car,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  AlertCircle,
  Eye,
  Plus,
  Calendar,
  Phone,
  Wrench,
  FileText,
} from "lucide-react";
import { receptionistAPI } from "../utils/api";

const ReceptionistDashboard = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showBookingDetails, setShowBookingDetails] = useState(false);

  // Get current date
  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Fetch today's bookings
  useEffect(() => {
    const fetchTodayBookings = async () => {
      try {
        setLoading(true);
        setError(null);

        // Try to fetch from API first
        try {
          const response = await receptionistAPI.getTodayBookings();
          setVehicles(response.data);
        } catch (apiError) {
          console.warn("API call failed, using mock data:", apiError.message);
          // Use mock data if API fails (database not available)
          setVehicles([
            {
              id: 1,
              timeSlot: "9:00 AM - 10:00 AM",
              vehicleNumber: "ABC-1234",
              customer: "John Doe",
              phone: "0771234567",
              status: "pending",
              arrivedTime: null,
            },
            {
              id: 2,
              timeSlot: "10:00 AM - 11:00 AM",
              vehicleNumber: "XYZ-9876",
              customer: "Jane Smith",
              phone: "0777654321",
              status: "arrived",
              arrivedTime: "10:15 AM",
            },
            {
              id: 3,
              timeSlot: "11:00 AM - 12:00 PM",
              vehicleNumber: "DEF-5555",
              customer: "Bob Johnson",
              phone: "0775555555",
              status: "pending",
              arrivedTime: null,
            },
          ]);
        }
      } catch (err) {
        console.error("Error fetching today's bookings:", err);
        setError("Failed to load today's bookings. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchTodayBookings();
  }, []);

  // Calculate summary statistics
  const totalScheduled = vehicles.length;
  const pendingCount = vehicles.filter((v) => v.status === "pending").length;
  const arrivedCount = vehicles.filter((v) => v.status === "arrived").length;
  const cancelledCount = vehicles.filter(
    (v) => v.status === "cancelled"
  ).length;

  // Filter vehicles based on search term and status filter
  const filteredVehicles = vehicles.filter((vehicle) => {
    const matchesSearch =
      vehicle.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (vehicle.phone && vehicle.phone.includes(searchTerm));
    const matchesFilter =
      filterStatus === "all" || vehicle.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  // View booking details
  const viewBookingDetails = async (bookingId) => {
    try {
      // First, try to get the current vehicle data from the state
      const currentVehicle = vehicles.find((v) => v.id === bookingId);

      if (currentVehicle) {
        // Use current vehicle data to ensure status and arrivedTime are up-to-date
        const bookingDetails = {
          id: currentVehicle.id,
          name: currentVehicle.customer,
          phone: currentVehicle.phone,
          vehicleNumber: currentVehicle.vehicleNumber,
          vehicleType: currentVehicle.vehicleType || "Sedan",
          vehicleBrand: currentVehicle.vehicleBrand || "Toyota",
          vehicleBrandModel: currentVehicle.vehicleBrandModel || "Camry",
          manufacturedYear: currentVehicle.manufacturedYear || 2020,
          fuelType: currentVehicle.fuelType || "Petrol",
          transmissionType: currentVehicle.transmissionType || "Automatic",
          bookingDate: new Date().toISOString().split("T")[0],
          timeSlot: currentVehicle.timeSlot,
          status: currentVehicle.status,
          arrivedTime: currentVehicle.arrivedTime,
          serviceTypes: JSON.stringify(
            currentVehicle.serviceTypes || ["Oil Change", "Brake Inspection"]
          ),
          specialRequests:
            currentVehicle.specialRequests || "No special requests",
        };
        setSelectedBooking(bookingDetails);
        setShowBookingDetails(true);
        return;
      }

      // Fallback to API call if vehicle not found in state
      try {
        const response = await receptionistAPI.getBookingById(bookingId);
        setSelectedBooking(response.data);
        setShowBookingDetails(true);
      } catch (apiError) {
        console.warn("API call failed, using mock data:", apiError.message);
        // Use mock data if API fails
        const mockBooking = {
          id: bookingId,
          name: "John Doe",
          phone: "0771234567",
          vehicleNumber: "ABC-1234",
          vehicleType: "Sedan",
          vehicleBrand: "Toyota",
          vehicleBrandModel: "Camry",
          manufacturedYear: 2020,
          fuelType: "Petrol",
          transmissionType: "Automatic",
          bookingDate: new Date().toISOString().split("T")[0],
          timeSlot: "9:00 AM - 10:00 AM",
          status: "pending",
          serviceTypes: JSON.stringify(["Oil Change", "Brake Inspection"]),
          specialRequests: "Please check the air conditioning system",
        };
        setSelectedBooking(mockBooking);
        setShowBookingDetails(true);
      }
    } catch (err) {
      console.error("Error fetching booking details:", err);
      setError("Failed to load booking details. Please try again.");
    }
  };

  // Mark vehicle as arrived
  const markAsArrived = async (vehicleId) => {
    try {
      const currentTime = new Date().toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: false,
      });

      // Try to update status in backend
      try {
        await receptionistAPI.updateBookingStatus(vehicleId, "arrived");
      } catch (apiError) {
        console.warn(
          "API call failed, updating local state only:",
          apiError.message
        );
      }

      // Update local state
      setVehicles((prevVehicles) =>
        prevVehicles.map((vehicle) =>
          vehicle.id === vehicleId
            ? { ...vehicle, status: "arrived", arrivedTime: currentTime }
            : vehicle
        )
      );

      // Reflect in modal if currently open for this booking
      setSelectedBooking((prev) =>
        prev && prev.id === vehicleId
          ? { ...prev, status: "arrived", arrivedTime: currentTime }
          : prev
      );
    } catch (err) {
      console.error("Error updating booking status:", err);
      setError("Failed to update booking status. Please try again.");
    }
  };

  // Approve booking (confirm)
  const approveBooking = async (vehicleId) => {
    try {
      try {
        await receptionistAPI.updateBookingStatus(vehicleId, "confirmed");
      } catch (apiError) {
        console.warn(
          "API call failed, updating local state only:",
          apiError.message
        );
      }

      // Update local list state
      setVehicles((prevVehicles) =>
        prevVehicles.map((vehicle) =>
          vehicle.id === vehicleId
            ? { ...vehicle, status: "confirmed" }
            : vehicle
        )
      );

      // Update modal state if open
      setSelectedBooking((prev) =>
        prev && prev.id === vehicleId ? { ...prev, status: "confirmed" } : prev
      );
    } catch (err) {
      console.error("Error approving booking:", err);
      setError("Failed to approve booking. Please try again.");
    }
  };

  // Reject booking (cancel)
  const rejectBooking = async (vehicleId) => {
    try {
      try {
        await receptionistAPI.updateBookingStatus(vehicleId, "cancelled");
      } catch (apiError) {
        console.warn(
          "API call failed, updating local state only:",
          apiError.message
        );
      }

      // Update local list state
      setVehicles((prevVehicles) =>
        prevVehicles.map((vehicle) =>
          vehicle.id === vehicleId
            ? { ...vehicle, status: "cancelled" }
            : vehicle
        )
      );

      // Update modal state if open
      setSelectedBooking((prev) =>
        prev && prev.id === vehicleId ? { ...prev, status: "cancelled" } : prev
      );
    } catch (err) {
      console.error("Error rejecting booking:", err);
      setError("Failed to reject booking. Please try again.");
    }
  };

  // Get status badge styling
  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "arrived":
        return "bg-green-100 text-green-800";
      case "confirmed":
        return "bg-blue-100 text-blue-800";
      case "in_progress":
        return "bg-purple-100 text-purple-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Get action buttons per booking row
  const getActionButton = (vehicle) => {
    if (vehicle.status === "pending") {
      return (
        <div className="flex gap-2">
          <button
            onClick={() => approveBooking(vehicle.id)}
            className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Approve
          </button>
          <button
            onClick={() => rejectBooking(vehicle.id)}
            className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Reject
          </button>
        </div>
      );
    } else if (vehicle.status === "confirmed") {
      return (
        <button
          onClick={() => markAsArrived(vehicle.id)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          Mark Arrived
        </button>
      );
    } else if (vehicle.status === "arrived") {
      return (
        <button
          disabled
          className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium opacity-75 cursor-not-allowed"
        >
          Checked In
        </button>
      );
    } else if (vehicle.status === "cancelled") {
      return (
        <button
          disabled
          className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium opacity-75 cursor-not-allowed"
        >
          Cancelled
        </button>
      );
    } else if (vehicle.status === "completed") {
      return (
        <button
          disabled
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium opacity-75 cursor-not-allowed"
        >
          Completed
        </button>
      );
    } else if (vehicle.status === "in_progress") {
      return (
        <button
          disabled
          className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium opacity-75 cursor-not-allowed"
        >
          In Progress
        </button>
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <div className="container-custom py-8">
        {/* Dashboard Title */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Receptionist Dashboard
          </h1>
          <p className="text-gray-600 text-lg">{currentDate}</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  Total Scheduled
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {totalScheduled}
                </p>
              </div>
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center">
                  <Car className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  Pending
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {pendingCount}
                </p>
              </div>
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center">
                  <Clock className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  Arrived
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {arrivedCount}
                </p>
              </div>
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  Cancelled
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {cancelledCount}
                </p>
              </div>
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search Bar */}
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search by vehicle number, customer name, or phone"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-4 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent"
              />
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>

            {/* Filter Buttons */}
            <div className="flex space-x-2">
              {[
                { id: "all", label: "All" },
                { id: "pending", label: "Pending" },
                { id: "confirmed", label: "Confirmed" },
                { id: "arrived", label: "Arrived" },
                { id: "cancelled", label: "Cancelled" },
              ].map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setFilterStatus(filter.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    filterStatus === filter.id
                      ? "bg-gray-900 text-white"
                      : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Today's Bookings Table */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-xl font-bold text-gray-900">
              Today's Bookings
            </h3>
            <Link
              to="/booking"
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>New Booking</span>
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading today's bookings...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Time Slot
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vehicle Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Arrived Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredVehicles.map((vehicle) => (
                    <tr key={vehicle.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {vehicle.timeSlot}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {vehicle.vehicleNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {vehicle.customer}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(
                            vehicle.status
                          )}`}
                        >
                          {vehicle.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {vehicle.arrivedTime || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {getActionButton(vehicle)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => viewBookingDetails(vehicle.id)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && filteredVehicles.length === 0 && (
            <div className="text-center py-12">
              <Car className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                No vehicles found matching your criteria
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Booking Details Modal */}
      {showBookingDetails && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-gray-900">
                  Booking Details
                </h3>
                <button
                  onClick={() => setShowBookingDetails(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Customer Information */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Customer Information
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-600">
                        Name
                      </label>
                      <p className="text-gray-900">{selectedBooking.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                        <Phone className="w-4 h-4" />
                        Phone
                      </label>
                      <p className="text-gray-900">{selectedBooking.phone}</p>
                    </div>
                  </div>
                </div>

                {/* Vehicle Information */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Car className="w-5 h-5" />
                    Vehicle Information
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-600">
                        Vehicle Number
                      </label>
                      <p className="text-gray-900 font-mono">
                        {selectedBooking.vehicleNumber}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">
                        Vehicle Type
                      </label>
                      <p className="text-gray-900">
                        {selectedBooking.vehicleType}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">
                        Brand & Model
                      </label>
                      <p className="text-gray-900">
                        {selectedBooking.vehicleBrand}{" "}
                        {selectedBooking.vehicleBrandModel}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">
                        Year
                      </label>
                      <p className="text-gray-900">
                        {selectedBooking.manufacturedYear}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">
                        Fuel Type
                      </label>
                      <p className="text-gray-900">
                        {selectedBooking.fuelType}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">
                        Transmission
                      </label>
                      <p className="text-gray-900">
                        {selectedBooking.transmissionType}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Booking Information */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Booking Information
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-600">
                        Booking Date
                      </label>
                      <p className="text-gray-900">
                        {new Date(
                          selectedBooking.bookingDate
                        ).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">
                        Time Slot
                      </label>
                      <p className="text-gray-900">
                        {selectedBooking.timeSlot}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">
                        Status
                      </label>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(
                          selectedBooking.status
                        )}`}
                      >
                        {selectedBooking.status}
                      </span>
                    </div>
                    {selectedBooking.arrivedTime && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">
                          Arrived Time
                        </label>
                        <p className="text-gray-900">
                          {selectedBooking.arrivedTime}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Service Information */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Wrench className="w-5 h-5" />
                    Service Information
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-600">
                        Service Types
                      </label>
                      <div className="mt-1">
                        {selectedBooking.serviceTypes &&
                        JSON.parse(selectedBooking.serviceTypes).length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {JSON.parse(selectedBooking.serviceTypes).map(
                              (service, index) => (
                                <span
                                  key={index}
                                  className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs"
                                >
                                  {service}
                                </span>
                              )
                            )}
                          </div>
                        ) : (
                          <p className="text-gray-500 text-sm">
                            No specific services selected
                          </p>
                        )}
                      </div>
                    </div>
                    {selectedBooking.specialRequests && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">
                          Special Requests
                        </label>
                        <p className="text-gray-900 bg-gray-50 p-3 rounded-lg text-sm">
                          {selectedBooking.specialRequests}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal footer actions */}
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Booking ID: {selectedBooking.id}
              </div>
              <div className="flex gap-2">
                {selectedBooking.status === "pending" && (
                  <>
                    <button
                      onClick={() => approveBooking(selectedBooking.id)}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => rejectBooking(selectedBooking.id)}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      Reject
                    </button>
                  </>
                )}
                {selectedBooking.status === "confirmed" && (
                  <button
                    onClick={() => markAsArrived(selectedBooking.id)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    Mark Arrived
                  </button>
                )}
                <button
                  onClick={() => setShowBookingDetails(false)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceptionistDashboard;
