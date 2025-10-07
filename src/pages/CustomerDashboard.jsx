import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import {
  Calendar,
  Car,
  DollarSign,
  ShoppingCart,
  Plus,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  X,
  Edit,
  Trash2,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { bookingsAPI, vehicleAPI } from "../utils/api";
import toast from "react-hot-toast";

const CustomerDashboard = () => {
  const [activeTab, setActiveTab] = useState("appointments");
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [showAddVehicleForm, setShowAddVehicleForm] = useState(false);
  const [isSubmittingVehicle, setIsSubmittingVehicle] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const { user } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm();

  // Early return if user is not authenticated
  if (!user && !loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Authentication Required
          </h1>
          <p className="text-gray-600 mb-4">
            Please log in to access your dashboard.
          </p>
          <Link
            to="/login"
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  // Fetch user bookings on component mount
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        const response = await bookingsAPI.getUserBookings();
        setBookings(response.data || []);
        setError(null);
      } catch (err) {
        console.error("Error fetching bookings:", err);

        // Handle different types of errors
        if (err.response?.status === 401) {
          // Auth error - don't show error message as user will be redirected
          setError("Authentication required");
        } else if (err.response?.status >= 500) {
          // Server error
          setError("Server error. Please try again later.");
          toast.error("Server error. Please try again later.");
        } else if (err.code === "NETWORK_ERROR" || !err.response) {
          // Network error - allow retry
          setError("Network error. Please check your connection.");
          toast.error("Network error. Please check your connection.");
        } else {
          // Other errors
          setError("Failed to load bookings");
          toast.error("Failed to load your bookings");
        }
      } finally {
        setLoading(false);
      }
    };

    const fetchVehicles = async () => {
      try {
        // Try to fetch from API first
        const response = await vehicleAPI.getUserVehicles();
        // The API returns { success: true, data: [...vehicles] }
        const vehiclesData =
          response.data?.data || response.data || response || [];
        // Ensure we always have an array
        setVehicles(Array.isArray(vehiclesData) ? vehiclesData : []);
      } catch (err) {
        console.error("Error fetching vehicles:", err);

        // Don't show error toast for 404/route not found errors
        if (err.response?.status !== 401 && err.response?.status !== 404) {
          console.warn(
            "Vehicle API not available, using localStorage fallback"
          );
        }

        // Fallback to localStorage if API fails
        const savedVehicles = localStorage.getItem("userVehicles");
        if (savedVehicles) {
          try {
            const parsedVehicles = JSON.parse(savedVehicles);
            setVehicles(Array.isArray(parsedVehicles) ? parsedVehicles : []);
          } catch (error) {
            console.error("Error parsing saved vehicles:", error);
            setVehicles([]); // Set empty array as fallback
          }
        } else {
          setVehicles([]); // Set empty array if no saved vehicles
        }
      }
    };

    if (user) {
      fetchBookings();
      fetchVehicles();
    }
  }, [user, retryCount]);

  // Retry function for failed API calls
  const retryFetchBookings = () => {
    setRetryCount((prev) => prev + 1);
  };

  // Save vehicles to localStorage (backup)
  const saveVehicles = (vehiclesList) => {
    localStorage.setItem("userVehicles", JSON.stringify(vehiclesList));
    setVehicles(vehiclesList);
  };

  // Add new vehicle
  const onAddVehicle = async (data) => {
    setIsSubmittingVehicle(true);
    try {
      const vehicleData = {
        vehicleNumber: data.vehicleNumber,
        brand: data.brand,
        model: data.model,
        type: data.type,
        manufactureYear: data.manufactureYear,
        fuelType: data.fuelType,
        transmission: data.transmission,
      };

      const response = await vehicleAPI.addVehicle(vehicleData);
      const newVehicle = response.data;

      // Update local state
      const updatedVehicles = [...vehicles, newVehicle];
      saveVehicles(updatedVehicles);

      setShowAddVehicleForm(false);
      reset();
      toast.success("Vehicle added successfully!");

      // Refresh vehicles from API
      const vehiclesResponse = await vehicleAPI.getUserVehicles();
      setVehicles(vehiclesResponse.data || []);
    } catch (error) {
      console.error("Error adding vehicle:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to add vehicle";
      toast.error(errorMessage);
    } finally {
      setIsSubmittingVehicle(false);
    }
  };

  // Delete vehicle
  const deleteVehicle = async (vehicleId) => {
    if (window.confirm("Are you sure you want to delete this vehicle?")) {
      try {
        await vehicleAPI.deleteVehicle(vehicleId);

        // Update local state immediately
        const updatedVehicles = vehicles.filter(
          (v) => (v.vehicleId || v.id) !== vehicleId
        );
        setVehicles(updatedVehicles);

        toast.success("Vehicle deleted successfully!");

        // Optionally refresh vehicles from API to ensure consistency
        try {
          const vehiclesResponse = await vehicleAPI.getUserVehicles();
          const vehiclesData =
            vehiclesResponse.data?.data || vehiclesResponse.data || [];
          setVehicles(Array.isArray(vehiclesData) ? vehiclesData : []);
        } catch (refreshError) {
          console.warn("Could not refresh vehicles list:", refreshError);
        }
      } catch (error) {
        console.error("Error deleting vehicle:", error);
        const errorMessage =
          error.response?.data?.message || "Failed to delete vehicle";
        toast.error(errorMessage);
      }
    }
  };

  // Calculate summary statistics with safe fallbacks
  const activeBookings = Array.isArray(bookings)
    ? bookings.filter((booking) =>
        [
          "Pending",
          "Confirmed",
          "In Progress",
          "pending",
          "confirmed",
          "in_progress",
        ].includes(booking?.status)
      ).length
    : 0;

  const summaryCards = [
    {
      title: "Active Bookings",
      value: activeBookings.toString(),
      icon: <Calendar className="w-8 h-8 text-red-600" />,
      color: "bg-white",
    },
    {
      title: "Vehicles",
      value: Array.isArray(vehicles) ? vehicles.length.toString() : "0",
      icon: <Car className="w-8 h-8 text-red-600" />,
      color: "bg-white",
    },
    {
      title: "Total Bookings",
      value: Array.isArray(bookings) ? bookings.length.toString() : "0",
      icon: <CheckCircle className="w-8 h-8 text-red-600" />,
      color: "bg-white",
    },
    {
      title: "Pending",
      value: Array.isArray(bookings)
        ? bookings
            .filter((b) => b?.status?.toLowerCase() === "pending")
            .length.toString()
        : "0",
      icon: <Clock className="w-8 h-8 text-red-600" />,
      color: "bg-white",
    },
  ];

  const tabs = [
    { id: "appointments", label: "Appointments" },
    { id: "vehicles", label: "Vehicles" },
    { id: "service-history", label: "Service History" },
    { id: "bills", label: "Bills" },
    { id: "e-shop", label: "E-Shop" },
  ];

  // Helper function to get status color
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "confirmed":
        return "bg-blue-100 text-blue-800";
      case "in progress":
        return "bg-purple-100 text-purple-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Helper function to format date
  const formatDate = (dateString) => {
    if (!dateString) return "Date not set";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Helper function to parse service types
  const parseServiceTypes = (serviceTypes) => {
    if (!serviceTypes) return "No services specified";
    try {
      const services =
        typeof serviceTypes === "string"
          ? JSON.parse(serviceTypes)
          : serviceTypes;
      return Array.isArray(services)
        ? services.join(", ")
        : "No services specified";
    } catch {
      return "No services specified";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <div className="container-custom py-8">
        {/* Dashboard Title */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Customer Dashboard
          </h1>
          <p className="text-gray-600 text-lg">
            Manage your appointments, vehicles, and service history
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {summaryCards.map((card, index) => (
            <div
              key={index}
              className={`${card.color} rounded-lg border border-gray-200 p-6 shadow-sm`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    {card.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {card.value}
                  </p>
                </div>
                <div className="flex-shrink-0">{card.icon}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Tabbed Navigation */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-6">
          <div className="flex border-b border-gray-200">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "bg-gray-100 text-gray-900 border-b-2 border-red-600"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === "appointments" && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900">
                    My Bookings
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
                  <div className="flex justify-center items-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-red-600" />
                    <span className="ml-2 text-gray-600">
                      Loading your bookings...
                    </span>
                  </div>
                ) : error ? (
                  <div className="text-center py-12">
                    <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button
                      onClick={retryFetchBookings}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      Try Again
                    </button>
                  </div>
                ) : bookings.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">No bookings found</p>
                    <Link
                      to="/booking"
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors inline-block"
                    >
                      Make Your First Booking
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {bookings.map((booking) => (
                      <div
                        key={booking.bookingId}
                        className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <h4 className="font-bold text-gray-900 mb-2">
                              {parseServiceTypes(booking.serviceTypes)} -{" "}
                              {booking.vehicleNumber}
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                              <div>
                                <p>
                                  <span className="font-medium">Date:</span>{" "}
                                  {formatDate(booking.bookingDate)}
                                </p>
                                <p>
                                  <span className="font-medium">Time:</span>{" "}
                                  {booking.timeSlot || "Not specified"}
                                </p>
                                <p>
                                  <span className="font-medium">Vehicle:</span>{" "}
                                  {booking.vehicleBrand}{" "}
                                  {booking.vehicleBrandModel}
                                </p>
                              </div>
                              <div>
                                <p>
                                  <span className="font-medium">Contact:</span>{" "}
                                  {booking.phone}
                                </p>
                                <p>
                                  <span className="font-medium">Year:</span>{" "}
                                  {booking.manufacturedYear || "Not specified"}
                                </p>
                                <p>
                                  <span className="font-medium">
                                    Fuel Type:
                                  </span>{" "}
                                  {booking.fuelType || "Not specified"}
                                </p>
                              </div>
                            </div>
                            {booking.specialRequests && (
                              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                <p className="text-sm">
                                  <span className="font-medium">
                                    Special Requests:
                                  </span>{" "}
                                  {booking.specialRequests}
                                </p>
                              </div>
                            )}
                          </div>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                              booking.status
                            )}`}
                          >
                            {booking.status}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          Booking ID: {booking.bookingId} • Created:{" "}
                          {formatDate(booking.createdAt)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "vehicles" && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900">
                    My Vehicles
                  </h3>
                  <button
                    onClick={() => setShowAddVehicleForm(true)}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Vehicle</span>
                  </button>
                </div>

                {!Array.isArray(vehicles) ? (
                  <div className="text-center py-12">
                    <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                    <p className="text-red-600 mb-4">
                      Error loading vehicles data
                    </p>
                    <button
                      onClick={() => window.location.reload()}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      Reload Page
                    </button>
                  </div>
                ) : vehicles.length === 0 ? (
                  <div className="text-center py-12">
                    <Car className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">
                      No vehicles registered yet
                    </p>
                    <button
                      onClick={() => setShowAddVehicleForm(true)}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      Add Your First Vehicle
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {vehicles.map((vehicle) => (
                      <div
                        key={vehicle.vehicleId || vehicle.id}
                        className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-bold text-gray-900 mb-2">
                              {vehicle.brand} {vehicle.model} -{" "}
                              {vehicle.vehicleNumber}
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-gray-600">
                              <div>
                                <p>
                                  <span className="font-medium">
                                    Vehicle Number:
                                  </span>{" "}
                                  {vehicle.vehicleNumber}
                                </p>
                                <p>
                                  <span className="font-medium">Brand:</span>{" "}
                                  {vehicle.brand}
                                </p>
                                <p>
                                  <span className="font-medium">Model:</span>{" "}
                                  {vehicle.model}
                                </p>
                              </div>
                              <div>
                                <p>
                                  <span className="font-medium">Type:</span>{" "}
                                  {vehicle.type}
                                </p>
                                <p>
                                  <span className="font-medium">Year:</span>{" "}
                                  {vehicle.manufactureYear}
                                </p>
                                <p>
                                  <span className="font-medium">
                                    Fuel Type:
                                  </span>{" "}
                                  {vehicle.fuelType}
                                </p>
                              </div>
                              <div>
                                <p>
                                  <span className="font-medium">
                                    Transmission:
                                  </span>{" "}
                                  {vehicle.transmission}
                                </p>
                                <p>
                                  <span className="font-medium">Added:</span>{" "}
                                  {new Date(
                                    vehicle.createdAt || vehicle.addedDate
                                  ).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="flex space-x-2 ml-4">
                            <button
                              onClick={() =>
                                deleteVehicle(vehicle.vehicleId || vehicle.id)
                              }
                              className="text-red-600 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors"
                              title="Delete Vehicle"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Vehicle Form Modal */}
                {showAddVehicleForm && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                      <div className="flex justify-between items-center p-6 border-b border-gray-200">
                        <h3 className="text-xl font-bold text-gray-900">
                          Add New Vehicle
                        </h3>
                        <button
                          onClick={() => {
                            setShowAddVehicleForm(false);
                            reset();
                          }}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <X className="w-6 h-6" />
                        </button>
                      </div>

                      <form
                        onSubmit={handleSubmit(onAddVehicle)}
                        className="p-6"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="col-span-full">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Vehicle Number
                            </label>
                            <input
                              type="text"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent"
                              style={{ textTransform: "uppercase" }}
                              {...register("vehicleNumber", {
                                required: "Vehicle number is required",
                              })}
                              onInput={(e) => {
                                e.target.value = e.target.value.toUpperCase();
                              }}
                            />
                            {errors.vehicleNumber && (
                              <p className="mt-1 text-sm text-red-600">
                                {errors.vehicleNumber.message}
                              </p>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Brand
                            </label>
                            <select
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent"
                              defaultValue=""
                              {...register("brand", {
                                required: "Brand is required",
                              })}
                            >
                              <option value="" disabled hidden>
                                Select Brand
                              </option>
                              <option value="toyota">Toyota</option>
                              <option value="honda">Honda</option>
                              <option value="suzuki">Suzuki</option>
                              <option value="ford">Ford</option>
                              <option value="mazda">Mazda</option>
                              <option value="isuzu">Isuzu</option>
                              <option value="subaru">Subaru</option>
                            </select>
                            {errors.brand && (
                              <p className="mt-1 text-sm text-red-600">
                                {errors.brand.message}
                              </p>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Model
                            </label>
                            <input
                              type="text"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent"
                              {...register("model", {
                                required: "Model is required",
                              })}
                            />
                            {errors.model && (
                              <p className="mt-1 text-sm text-red-600">
                                {errors.model.message}
                              </p>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Vehicle Type
                            </label>
                            <select
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent"
                              defaultValue=""
                              {...register("type", {
                                required: "Vehicle type is required",
                              })}
                            >
                              <option value="" disabled hidden>
                                Select Type
                              </option>
                              <option value="wagon">Wagon</option>
                              <option value="sedan">Sedan</option>
                              <option value="suv">SUV</option>
                              <option value="hatchback">Hatchback</option>
                              <option value="doublecab">
                                Pickup/ Double Cab
                              </option>
                              <option value="jeep">Jeep/ Crossover</option>
                              <option value="minicar">Mini Car/ Kei Car</option>
                              <option value="van">Van</option>
                            </select>
                            {errors.type && (
                              <p className="mt-1 text-sm text-red-600">
                                {errors.type.message}
                              </p>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Manufacture Year
                            </label>
                            <input
                              type="number"
                              min="1990"
                              max="2024"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent"
                              {...register("manufactureYear", {
                                required: "Manufacture year is required",
                                min: {
                                  value: 1990,
                                  message: "Year must be 1990 or later",
                                },
                                max: {
                                  value: 2024,
                                  message: "Year must be 2024 or earlier",
                                },
                              })}
                            />
                            {errors.manufactureYear && (
                              <p className="mt-1 text-sm text-red-600">
                                {errors.manufactureYear.message}
                              </p>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Fuel Type
                            </label>
                            <select
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent"
                              defaultValue=""
                              {...register("fuelType", {
                                required: "Fuel type is required",
                              })}
                            >
                              <option value="" disabled hidden>
                                Select Fuel Type
                              </option>
                              <option value="petrol">Petrol</option>
                              <option value="diesel">Diesel</option>
                              <option value="electric">Electric</option>
                              <option value="hybrid">Hybrid</option>
                            </select>
                            {errors.fuelType && (
                              <p className="mt-1 text-sm text-red-600">
                                {errors.fuelType.message}
                              </p>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Transmission
                            </label>
                            <select
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent"
                              defaultValue=""
                              {...register("transmission", {
                                required: "Transmission is required",
                              })}
                            >
                              <option value="" disabled hidden>
                                Select Transmission
                              </option>
                              <option value="auto">Automatic</option>
                              <option value="manual">Manual</option>
                            </select>
                            {errors.transmission && (
                              <p className="mt-1 text-sm text-red-600">
                                {errors.transmission.message}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex justify-end space-x-4 mt-6">
                          <button
                            type="button"
                            onClick={() => {
                              setShowAddVehicleForm(false);
                              reset();
                            }}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={isSubmittingVehicle}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isSubmittingVehicle ? "Adding..." : "Add Vehicle"}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "service-history" && (
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-6">
                  Service History
                </h3>
                <div className="text-center py-12">
                  <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No service history available</p>
                </div>
              </div>
            )}

            {activeTab === "bills" && (
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-6">
                  Bills & Invoices
                </h3>
                <div className="text-center py-12">
                  <DollarSign className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No bills available</p>
                </div>
              </div>
            )}

            {activeTab === "e-shop" && (
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-6">E-Shop</h3>
                <div className="text-center py-12">
                  <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">E-Shop coming soon</p>
                  <Link
                    to="/parts"
                    className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors inline-block"
                  >
                    Browse Parts
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboard;
