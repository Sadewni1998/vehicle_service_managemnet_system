import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
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
  XCircle,
  Eye,
  User,
  FileText,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  bookingsAPI,
  vehicleAPI,
  breakdownAPI,
  invoiceAPI,
} from "../utils/api";
import toast from "react-hot-toast";

// Vehicle brand and model data structure
const vehicleData = {
  toyota: {
    name: "Toyota",
    models: [
      "Camry",
      "Prius",
      "Corolla",
      "GR Supra",
      "Highlander",
      "Land Cruiser",
    ],
  },
  honda: {
    name: "Honda",
    models: ["Civic", "Accord", "HR-V", "CR-V", "Ridgeline"],
  },
  suzuki: {
    name: "Suzuki",
    models: [
      "Jimny",
      "Carry",
      "XL6",
      "Ciaz",
      "Grand Vitara",
      "BALENO",
      "Celerio",
    ],
  },
  ford: {
    name: "Ford",
    models: ["Bronco", "EcoSport", "Mustang", "Explorer", "Escape", "Kuga"],
  },
  mazda: {
    name: "Mazda",
    models: ["Mazda2", "Mazda3", "Mazda6", "CX-3", "CX-30", "CX-5", "CX-50"],
  },
  isuzu: {
    name: "Isuzu",
    models: ["D-max", "Bellel", "Bellett", "Elf", "Gemini", "Panther"],
  },
  subaru: {
    name: "Subaru",
    models: ["Ascent", "BRZ", "Crosstrek", "Outback", "Legacy", "Impreza"],
  },
};

const CustomerDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  // Initialize tab from query param if present
  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(location.search);
    return params.get("tab") || "appointments";
  });
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [showAddVehicleForm, setShowAddVehicleForm] = useState(false);
  const [isSubmittingVehicle, setIsSubmittingVehicle] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [selectedBrand, setSelectedBrand] = useState("");
  const [breakdownRequests, setBreakdownRequests] = useState([]);
  const [loadingBreakdowns, setLoadingBreakdowns] = useState(false);
  const [selectedBreakdown, setSelectedBreakdown] = useState(null);
  const [showBreakdownDetails, setShowBreakdownDetails] = useState(false);
  const [invoices, setInvoices] = useState([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showInvoiceDetails, setShowInvoiceDetails] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showBookingDetails, setShowBookingDetails] = useState(false);
  const [showInvoiceMenu, setShowInvoiceMenu] = useState(false);
  const [selectedBookingForInvoice, setSelectedBookingForInvoice] =
    useState(null);
  const { user } = useAuth();
  // Keep URL in sync when tab changes (so refresh/deep-link works)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (activeTab !== (params.get("tab") || "appointments")) {
      params.set("tab", activeTab);
      navigate(
        { pathname: location.pathname, search: params.toString() },
        { replace: true }
      );
    }
  }, [activeTab]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
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

  // Fetch breakdown requests when tab is active
  useEffect(() => {
    const fetchBreakdownRequests = async () => {
      if (activeTab === "breakdown-requests" && user) {
        setLoadingBreakdowns(true);
        try {
          const response = await breakdownAPI.getMyRequests();
          setBreakdownRequests(response.data?.data || response.data || []);
          setError(null);
        } catch (err) {
          console.error("Error fetching breakdown requests:", err);
          setError("Failed to load breakdown requests");
          toast.error("Failed to load your breakdown requests");
        } finally {
          setLoadingBreakdowns(false);
        }
      }
    };

    fetchBreakdownRequests();
  }, [activeTab, user]);

  // Fetch invoices when tab is active
  useEffect(() => {
    const fetchInvoices = async () => {
      if (activeTab === "bills" && user) {
        setLoadingInvoices(true);
        try {
          const response = await invoiceAPI.getCustomerInvoices();
          setInvoices(response.data?.data || response.data || []);
          setError(null);
        } catch (err) {
          console.error("Error fetching invoices:", err);
          setError("Failed to load bills");
          toast.error("Failed to load your bills");
        } finally {
          setLoadingInvoices(false);
        }
      }
    };

    fetchInvoices();
  }, [activeTab, user]);

  // Retry function for failed API calls
  const retryFetchBookings = () => {
    setRetryCount((prev) => prev + 1);
  };

  // Handle brand selection and reset model
  const handleBrandChange = (brand) => {
    setSelectedBrand(brand);
    setValue("model", "");
  };

  // Get available models for selected brand
  const getAvailableModels = (brand) => {
    return brand && vehicleData[brand] ? vehicleData[brand].models : [];
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
        kilometersRun: data.kilometersRun
          ? Number(data.kilometersRun)
          : undefined,
      };

      const response = await vehicleAPI.addVehicle(vehicleData);
      // Backend returns { success, message, data: { ...vehicle } }
      const newVehicle = response?.data?.data || response?.data;

      // Update local state
      const updatedVehicles = Array.isArray(vehicles)
        ? [...vehicles, newVehicle]
        : [newVehicle];
      saveVehicles(updatedVehicles);

      setShowAddVehicleForm(false);
      setSelectedBrand("");
      reset();
      toast.success("Vehicle added successfully!");

      // Refresh vehicles from API
      const vehiclesResponse = await vehicleAPI.getUserVehicles();
      const vehiclesData =
        vehiclesResponse?.data?.data || vehiclesResponse?.data || [];
      setVehicles(Array.isArray(vehiclesData) ? vehiclesData : []);
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

  // Cancel booking
  const cancelBooking = async (bookingId) => {
    if (window.confirm("Are you sure you want to cancel this booking?")) {
      try {
        await bookingsAPI.cancel(bookingId);

        // Update local state immediately
        const updatedBookings = bookings.map((booking) =>
          booking.bookingId === bookingId
            ? { ...booking, status: "cancelled" }
            : booking
        );
        setBookings(updatedBookings);

        toast.success("Booking cancelled successfully!");

        // Refresh bookings from API to ensure consistency
        try {
          const response = await bookingsAPI.getUserBookings();
          setBookings(response.data || []);
        } catch (refreshError) {
          console.warn("Could not refresh bookings list:", refreshError);
        }
      } catch (error) {
        console.error("Error cancelling booking:", error);
        const errorMessage =
          error.response?.data?.message || "Failed to cancel booking";
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
    { id: "breakdown-requests", label: "Breakdown Requests" },
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
      case "verified":
        return "bg-emerald-100 text-emerald-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Helper function to map manager status to customer-friendly status
  const getCustomerFriendlyStatus = (managerStatus) => {
    switch (managerStatus?.toLowerCase()) {
      case "pending":
        return "Pending";
      case "approved":
        return "Approved";
      case "in progress":
        return "On the Way";
      case "completed":
        return "Completed";
      case "cancelled":
        return "Rejected";
      default:
        return managerStatus || "Unknown";
    }
  };

  // Helper function to get breakdown status color
  const getBreakdownStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "approved":
        return "bg-green-100 text-green-800";
      case "on the way":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "rejected":
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

  // View booking details
  const viewBookingDetails = async (bookingId) => {
    try {
      const booking = bookings.find((b) => b.bookingId === bookingId);
      if (booking) {
        setSelectedBooking(booking);
        setShowBookingDetails(true);
      } else {
        // Fallback to API call
        try {
          const response = await bookingsAPI.getBookingById(bookingId);
          setSelectedBooking(response.data);
          setShowBookingDetails(true);
        } catch (apiError) {
          console.error("Failed to fetch booking details:", apiError);
          setError("Failed to load booking details. Please try again.");
        }
      }
    } catch (err) {
      console.error("Error viewing booking details:", err);
      setError("Failed to load booking details. Please try again.");
    }
  };

  // Handle invoice click - fetch fresh booking data and open invoice modal
  const handleInvoiceClick = async (booking) => {
    try {
      // Fetch fresh booking data with detailed mechanic and parts information
      const response = await bookingsAPI.getBookingById(booking.bookingId);
      setSelectedBookingForInvoice(response.data);
      setShowInvoiceMenu(true);
    } catch (error) {
      console.error("Error fetching booking details for invoice:", error);
      toast.error("Failed to load bill details. Please try again.");
    }
  };

  // Download invoice
  const downloadInvoice = async (bookingId) => {
    try {
      const response = await invoiceAPI.downloadCustomerInvoice(bookingId);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `invoice_${bookingId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Invoice downloaded successfully");
    } catch (error) {
      console.error("Error downloading invoice:", error);
      toast.error("Failed to download invoice");
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
                    {bookings
                      .filter(
                        (booking) => booking.status?.toLowerCase() === "pending"
                      )
                      .map((booking) => (
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
                                    <span className="font-medium">
                                      Vehicle:
                                    </span>{" "}
                                    {booking.vehicleBrand}{" "}
                                    {booking.vehicleBrandModel}
                                  </p>
                                </div>
                                <div>
                                  <p>
                                    <span className="font-medium">
                                      Contact:
                                    </span>{" "}
                                    {booking.phone}
                                  </p>
                                  <p>
                                    <span className="font-medium">Year:</span>{" "}
                                    {booking.manufacturedYear ||
                                      "Not specified"}
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
                            <div className="flex flex-col items-end space-y-2 ml-4">
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                  booking.status
                                )}`}
                              >
                                {booking.status}
                              </span>
                              {booking.status?.toLowerCase() === "pending" && (
                                <button
                                  onClick={() =>
                                    cancelBooking(booking.bookingId)
                                  }
                                  className="text-red-600 hover:text-red-700 px-3 py-1 rounded-lg text-xs font-medium hover:bg-red-50 transition-colors flex items-center space-x-1"
                                  title="Cancel Booking"
                                >
                                  <XCircle className="w-4 h-4" />
                                  <span>Cancel</span>
                                </button>
                              )}
                            </div>
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
                                {typeof vehicle.kilometersRun !== "undefined" &&
                                  vehicle.kilometersRun !== null && (
                                    <p>
                                      <span className="font-medium">
                                        Odometer:
                                      </span>{" "}
                                      {Number(
                                        vehicle.kilometersRun
                                      ).toLocaleString()}{" "}
                                      km
                                    </p>
                                  )}
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
                            setSelectedBrand("");
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
                              onChange={(e) =>
                                handleBrandChange(e.target.value)
                              }
                            >
                              <option value="" disabled hidden>
                                Select Brand
                              </option>
                              {Object.entries(vehicleData).map(
                                ([key, brand]) => (
                                  <option key={key} value={key}>
                                    {brand.name}
                                  </option>
                                )
                              )}
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
                            <select
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent"
                              defaultValue=""
                              disabled={!selectedBrand}
                              {...register("model", {
                                required: "Model is required",
                              })}
                            >
                              <option value="" disabled hidden>
                                {selectedBrand
                                  ? "Select Model"
                                  : "Select Brand First"}
                              </option>
                              {getAvailableModels(selectedBrand).map(
                                (model) => (
                                  <option key={model} value={model}>
                                    {model}
                                  </option>
                                )
                              )}
                            </select>
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
                              Current Odometer (km)
                            </label>
                            <input
                              type="number"
                              min="0"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent"
                              {...register("kilometersRun")}
                            />
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
                              setSelectedBrand("");
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

            {activeTab === "breakdown-requests" && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      My Breakdown Requests
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Track the status of your emergency breakdown requests
                    </p>
                  </div>
                  <Link
                    to="/request"
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    New Request
                  </Link>
                </div>

                {loadingBreakdowns ? (
                  <div className="text-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-red-600 mx-auto mb-4" />
                    <p className="text-gray-600">
                      Loading breakdown requests...
                    </p>
                  </div>
                ) : breakdownRequests.length === 0 ? (
                  <div className="text-center py-12">
                    <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No breakdown requests found
                    </h3>
                    <p className="text-gray-600 mb-6">
                      You haven't submitted any breakdown requests yet.
                    </p>
                    <Link
                      to="/request"
                      className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors inline-flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Submit New Request
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {breakdownRequests.map((request) => {
                      const customerStatus = getCustomerFriendlyStatus(
                        request.status
                      );
                      return (
                        <div
                          key={request.requestId}
                          className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-4 mb-4">
                                <div>
                                  <h4 className="text-lg font-semibold text-gray-900">
                                    {request.emergencyType}
                                  </h4>
                                  <p className="text-sm text-gray-600">
                                    Vehicle: {request.vehicleNumber} (
                                    {request.vehicleType || "Unknown Type"})
                                  </p>
                                </div>
                                <span
                                  className={`px-3 py-1 rounded-full text-xs font-medium ${getBreakdownStatusColor(
                                    customerStatus
                                  )}`}
                                >
                                  {customerStatus}
                                </span>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                  <p className="text-sm text-gray-600">
                                    <span className="font-medium">
                                      Requested:
                                    </span>{" "}
                                    {request.createdAt
                                      ? new Date(
                                          request.createdAt
                                        ).toLocaleString()
                                      : "Unknown"}
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    <span className="font-medium">
                                      Location:
                                    </span>{" "}
                                    {request.latitude}, {request.longitude}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600">
                                    <span className="font-medium">
                                      Contact:
                                    </span>{" "}
                                    {request.contactName} -{" "}
                                    {request.contactPhone}
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    <span className="font-medium">
                                      Request ID:
                                    </span>{" "}
                                    #{request.requestId}
                                  </p>
                                </div>
                              </div>

                              {request.problemDescription && (
                                <div className="mb-4">
                                  <p className="text-sm text-gray-600">
                                    <span className="font-medium">
                                      Problem Description:
                                    </span>
                                  </p>
                                  <p className="text-sm text-gray-800 bg-gray-50 p-3 rounded-lg mt-1">
                                    {request.problemDescription}
                                  </p>
                                </div>
                              )}

                              {request.additionalInfo && (
                                <div className="mb-4">
                                  <p className="text-sm text-gray-600">
                                    <span className="font-medium">
                                      Additional Information:
                                    </span>
                                  </p>
                                  <p className="text-sm text-gray-800 bg-gray-50 p-3 rounded-lg mt-1">
                                    {request.additionalInfo}
                                  </p>
                                </div>
                              )}
                            </div>

                            <button
                              onClick={() => {
                                setSelectedBreakdown(request);
                                setShowBreakdownDetails(true);
                              }}
                              className="ml-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded transition-colors"
                            >
                              View Details
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === "service-history" && (
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-6">
                  Service History
                </h3>
                {Array.isArray(bookings) &&
                bookings.filter((b) => b?.status?.toLowerCase() !== "pending")
                  .length > 0 ? (
                  <div className="space-y-4">
                    {bookings
                      .filter((b) => b?.status?.toLowerCase() !== "pending")
                      .map((booking) => (
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
                                    <span className="font-medium">
                                      Vehicle:
                                    </span>{" "}
                                    {booking.vehicleBrand}{" "}
                                    {booking.vehicleBrandModel}
                                  </p>
                                </div>
                                <div>
                                  <p>
                                    <span className="font-medium">
                                      Contact:
                                    </span>{" "}
                                    {booking.phone}
                                  </p>
                                  <p>
                                    <span className="font-medium">Year:</span>{" "}
                                    {booking.manufacturedYear ||
                                      "Not specified"}
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
                            <div className="flex space-x-2 ml-4">
                              <button
                                onClick={() =>
                                  viewBookingDetails(booking.bookingId)
                                }
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded transition-colors flex items-center gap-2"
                              >
                                <Eye className="w-4 h-4" />
                                View Details
                              </button>
                              <button
                                onClick={() => handleInvoiceClick(booking)}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded transition-colors flex items-center gap-2"
                              >
                                <DollarSign className="w-4 h-4" />
                                Bill
                              </button>
                            </div>
                          </div>
                          <div className="text-xs text-gray-500">
                            Booking ID: {booking.bookingId} • Created:{" "}
                            {formatDate(booking.createdAt)}
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">
                      No service history available
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "bills" && (
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-6">Bills</h3>

                {loadingInvoices ? (
                  <div className="flex justify-center items-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-red-600" />
                    <span className="ml-2 text-gray-600">
                      Loading your bills...
                    </span>
                  </div>
                ) : invoices.length === 0 ? (
                  <div className="text-center py-12">
                    <DollarSign className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No bills available</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {invoices.map((invoice) => (
                      <div
                        key={invoice.invoiceId}
                        className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-bold text-gray-900">
                                Bill #{invoice.invoiceNumber}
                              </h4>
                              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                                Finalized
                              </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                              <div>
                                <p>
                                  <span className="font-medium">Vehicle:</span>{" "}
                                  {invoice.vehicleNumber} -{" "}
                                  {invoice.vehicleBrand} {invoice.vehicleModel}
                                </p>
                                <p>
                                  <span className="font-medium">
                                    Service Date:
                                  </span>{" "}
                                  {formatDate(invoice.serviceDate)}
                                </p>
                                <p>
                                  <span className="font-medium">Services:</span>{" "}
                                  {parseServiceTypes(invoice.serviceTypes)}
                                </p>
                              </div>
                              <div>
                                <p>
                                  <span className="font-medium">
                                    Total Amount:
                                  </span>{" "}
                                  <span className="text-lg font-bold text-red-600">
                                    Rs.{" "}
                                    {invoice.totalAmount?.toLocaleString() ||
                                      "N/A"}
                                  </span>
                                </p>
                                <p>
                                  <span className="font-medium">
                                    Bill Date:
                                  </span>{" "}
                                  {formatDate(invoice.createdAt)}
                                </p>
                                <p>
                                  <span className="font-medium">
                                    Booking ID:
                                  </span>{" "}
                                  {invoice.bookingId}
                                </p>
                              </div>
                            </div>

                            {/* Cost Breakdown */}
                            {invoice.invoiceData && (
                              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                                <h5 className="font-medium text-gray-900 mb-2">
                                  Cost Breakdown
                                </h5>
                                <div className="space-y-1 text-sm">
                                  {invoice.invoiceData?.pricing?.laborCost && (
                                    <div className="flex justify-between">
                                      <span>Labor Cost:</span>
                                      <span>
                                        Rs.{" "}
                                        {invoice.invoiceData.pricing.laborCost.toLocaleString()}
                                      </span>
                                    </div>
                                  )}
                                  {invoice.invoiceData?.pricing?.partsCost && (
                                    <div className="flex justify-between">
                                      <span>Parts Cost:</span>
                                      <span>
                                        Rs.{" "}
                                        {invoice.invoiceData.pricing.partsCost.toLocaleString()}
                                      </span>
                                    </div>
                                  )}
                                  {invoice.invoiceData?.pricing?.subtotal && (
                                    <div className="flex justify-between">
                                      <span>Subtotal:</span>
                                      <span>
                                        Rs.{" "}
                                        {invoice.invoiceData.pricing.subtotal.toLocaleString()}
                                      </span>
                                    </div>
                                  )}
                                  {invoice.invoiceData?.pricing?.tax > 0 && (
                                    <div className="flex justify-between">
                                      <span>Tax:</span>
                                      <span>
                                        Rs.{" "}
                                        {invoice.invoiceData.pricing.tax.toLocaleString()}
                                      </span>
                                    </div>
                                  )}
                                  <div className="border-t pt-1 flex justify-between font-medium">
                                    <span>Total:</span>
                                    <span>
                                      Rs.{" "}
                                      {invoice.totalAmount?.toLocaleString() ||
                                        "N/A"}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col space-y-2 ml-4">
                            <button
                              onClick={() => {
                                setSelectedInvoice(invoice);
                                setShowInvoiceDetails(true);
                              }}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
                            >
                              <Eye className="w-4 h-4" />
                              <span>View</span>
                            </button>
                            <button
                              onClick={() => downloadInvoice(invoice.bookingId)}
                              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
                            >
                              <DollarSign className="w-4 h-4" />
                              <span>View Bill</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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

      {/* Invoice Details Modal */}
      {showInvoiceDetails && selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-gray-900">
                  Bill Details - #{selectedInvoice.invoiceNumber}
                </h3>
                <button
                  onClick={() => setShowInvoiceDetails(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-900">
                    Bill Information
                  </h4>
                  <div>
                    <div className="text-sm text-gray-600">Bill Number</div>
                    <div className="font-mono font-medium">
                      #{selectedInvoice.invoiceNumber}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Booking ID</div>
                    <div className="font-medium">
                      {selectedInvoice.bookingId}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Bill Date</div>
                    <div className="font-medium">
                      {formatDate(selectedInvoice.createdAt)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Status</div>
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                      Finalized
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-900">
                    Vehicle Information
                  </h4>
                  <div>
                    <div className="text-sm text-gray-600">Vehicle Number</div>
                    <div className="font-mono font-medium">
                      {selectedInvoice.vehicleNumber}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Vehicle</div>
                    <div className="font-medium">
                      {selectedInvoice.vehicleBrand}{" "}
                      {selectedInvoice.vehicleModel}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Service Date</div>
                    <div className="font-medium">
                      {formatDate(selectedInvoice.serviceDate)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Services</div>
                    <div className="font-medium">
                      {parseServiceTypes(selectedInvoice.serviceTypes)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Cost Breakdown */}
              {selectedInvoice.invoiceData && (
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">
                    Cost Breakdown
                  </h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="space-y-2 text-sm">
                      {selectedInvoice.invoiceData?.pricing?.laborCost && (
                        <div className="flex justify-between">
                          <span>Labor Cost:</span>
                          <span>
                            Rs.{" "}
                            {selectedInvoice.invoiceData.pricing.laborCost.toLocaleString()}
                          </span>
                        </div>
                      )}
                      {selectedInvoice.invoiceData?.pricing?.partsCost && (
                        <div className="flex justify-between">
                          <span>Parts Cost:</span>
                          <span>
                            Rs.{" "}
                            {selectedInvoice.invoiceData.pricing.partsCost.toLocaleString()}
                          </span>
                        </div>
                      )}
                      {selectedInvoice.invoiceData?.pricing?.subtotal && (
                        <div className="flex justify-between">
                          <span>Subtotal:</span>
                          <span>
                            Rs.{" "}
                            {selectedInvoice.invoiceData.pricing.subtotal.toLocaleString()}
                          </span>
                        </div>
                      )}
                      {selectedInvoice.invoiceData?.pricing?.tax > 0 && (
                        <div className="flex justify-between">
                          <span>Tax:</span>
                          <span>
                            Rs.{" "}
                            {selectedInvoice.invoiceData.pricing.tax.toLocaleString()}
                          </span>
                        </div>
                      )}
                      <div className="border-t pt-2 flex justify-between font-bold text-lg">
                        <span>Total Amount:</span>
                        <span className="text-red-600">
                          Rs.{" "}
                          {selectedInvoice.totalAmount?.toLocaleString() ||
                            "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setShowInvoiceDetails(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    downloadInvoice(selectedInvoice.bookingId);
                    setShowInvoiceDetails(false);
                  }}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
                >
                  <DollarSign className="w-4 h-4" />
                  <span>Download PDF</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
                    <User className="w-5 h-5" />
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
                      <label className="text-sm font-medium text-gray-600">
                        Phone
                      </label>
                      <p className="text-gray-900">{selectedBooking.phone}</p>
                    </div>
                  </div>
                </div>

                {/* Vehicle Information */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
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
                        className={`inline-flex px-3 py-1 text-xs font-semibold rounded ${
                          selectedBooking.status === "arrived"
                            ? "bg-green-100 text-green-800"
                            : selectedBooking.status === "cancelled"
                            ? "bg-red-100 text-red-800"
                            : selectedBooking.status === "confirmed"
                            ? "bg-blue-100 text-blue-800"
                            : selectedBooking.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : selectedBooking.status === "in_progress"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
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
                    <AlertCircle className="w-5 h-5" />
                    Service Information
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-600">
                        Service Types
                      </label>
                      <div className="mt-1">
                        {selectedBooking.serviceTypes ? (
                          <div className="flex flex-wrap gap-2">
                            {Array.isArray(selectedBooking.serviceTypes)
                              ? selectedBooking.serviceTypes.map(
                                  (service, index) => (
                                    <span
                                      key={index}
                                      className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs"
                                    >
                                      {service}
                                    </span>
                                  )
                                )
                              : selectedBooking.serviceTypes
                                  .split(",")
                                  .map((service, index) => (
                                    <span
                                      key={index}
                                      className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs"
                                    >
                                      {service.trim()}
                                    </span>
                                  ))}
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

                {/* Assigned Mechanics */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Assigned Mechanics
                  </h4>
                  <div className="space-y-3">
                    {selectedBooking.assignedMechanicsDetails &&
                    selectedBooking.assignedMechanicsDetails.length > 0 ? (
                      <div className="space-y-3">
                        {selectedBooking.assignedMechanicsDetails.map(
                          (mechanic) => (
                            <div
                              key={mechanic.mechanicId}
                              className="bg-gray-50 p-4 rounded-lg"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <h5 className="font-medium text-gray-900">
                                  {mechanic.mechanicName}
                                </h5>
                                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                                  {mechanic.mechanicCode}
                                </span>
                              </div>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="text-gray-600">
                                    Specialization:
                                  </span>
                                  <p className="font-medium">
                                    {mechanic.specialization}
                                  </p>
                                </div>
                                <div>
                                  <span className="text-gray-600">
                                    Experience:
                                  </span>
                                  <p className="font-medium">
                                    {mechanic.experienceYears} years
                                  </p>
                                </div>
                                <div>
                                  <span className="text-gray-600">
                                    Hourly Rate:
                                  </span>
                                  <p className="font-medium">
                                    Rs. {mechanic.hourlyRate?.toLocaleString()}
                                  </p>
                                </div>
                                <div>
                                  <span className="text-gray-600">Status:</span>
                                  <span
                                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      mechanic.availability === "Available"
                                        ? "bg-green-100 text-green-800"
                                        : mechanic.availability === "Busy"
                                        ? "bg-red-100 text-red-800"
                                        : "bg-yellow-100 text-yellow-800"
                                    }`}
                                  >
                                    {mechanic.availability}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm bg-gray-50 p-3 rounded-lg">
                        No mechanics assigned to this booking
                      </p>
                    )}
                  </div>
                </div>

                {/* Assigned Spare Parts */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Assigned Spare Parts
                  </h4>
                  <div className="space-y-3">
                    {selectedBooking.assignedSparePartsDetails &&
                    selectedBooking.assignedSparePartsDetails.length > 0 ? (
                      <div className="space-y-3">
                        {selectedBooking.assignedSparePartsDetails.map(
                          (part) => (
                            <div
                              key={part.partId}
                              className="bg-gray-50 p-4 rounded-lg"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <h5 className="font-medium text-gray-900">
                                  {part.partName}
                                </h5>
                                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                                  {part.partCode}
                                </span>
                              </div>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="text-gray-600">
                                    Category:
                                  </span>
                                  <p className="font-medium">{part.category}</p>
                                </div>
                                <div>
                                  <span className="text-gray-600">
                                    Quantity:
                                  </span>
                                  <p className="font-medium">
                                    {part.assignedQuantity}
                                  </p>
                                </div>
                                <div>
                                  <span className="text-gray-600">
                                    Unit Price:
                                  </span>
                                  <p className="font-medium">
                                    Rs. {part.unitPrice?.toLocaleString()}
                                  </p>
                                </div>
                                <div>
                                  <span className="text-gray-600">
                                    Total Price:
                                  </span>
                                  <p className="font-medium text-green-600">
                                    Rs. {part.totalPrice?.toLocaleString()}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )
                        )}
                        <div className="bg-green-50 p-3 rounded-lg">
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-gray-900">
                              Total Parts Cost:
                            </span>
                            <span className="font-bold text-green-600 text-lg">
                              Rs.{" "}
                              {selectedBooking.assignedSparePartsDetails
                                .reduce(
                                  (total, part) =>
                                    total + (part.totalPrice || 0),
                                  0
                                )
                                .toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm bg-gray-50 p-3 rounded-lg">
                        No spare parts assigned to this booking
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setShowBookingDetails(false)}
                className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Menu Modal */}
      {showInvoiceMenu && selectedBookingForInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">
                  Bill Details
                </h3>
                <button
                  onClick={() => {
                    setShowInvoiceMenu(false);
                    setSelectedBookingForInvoice(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="mt-2 text-sm text-gray-600">
                Booking ID: {selectedBookingForInvoice.bookingId} •{" "}
                {selectedBookingForInvoice.vehicleNumber}
              </div>
            </div>

            <div className="p-6">
              {/* Labor Charges Section */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  Labor Charges
                </h4>
                {selectedBookingForInvoice.assignedMechanics &&
                selectedBookingForInvoice.assignedMechanics.length > 0 ? (
                  <div className="space-y-3">
                    {JSON.parse(
                      selectedBookingForInvoice.assignedMechanics
                    ).map((mechanicId, index) => {
                      // Find mechanic details from the assignedMechanicsDetails if available
                      const mechanicDetails =
                        selectedBookingForInvoice.assignedMechanicsDetails?.find(
                          (m) => m.mechanicId === mechanicId
                        );
                      return (
                        <div
                          key={mechanicId}
                          className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border border-blue-200"
                        >
                          <div>
                            <div className="font-medium text-gray-900">
                              {mechanicDetails
                                ? mechanicDetails.mechanicName
                                : `Mechanic ${index + 1}`}
                            </div>
                            <div className="text-sm text-gray-600">
                              {mechanicDetails
                                ? mechanicDetails.specialization
                                : "Specialization not available"}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-blue-600">
                              Rs.{" "}
                              {mechanicDetails
                                ? mechanicDetails.hourlyRate?.toLocaleString()
                                : "N/A"}
                            </div>
                            <div className="text-xs text-gray-500">
                              per hour
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div className="border-t border-blue-200 pt-3 mt-4">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-gray-900">
                          Total Labor Cost:
                        </span>
                        <span className="font-bold text-lg text-blue-600">
                          Rs.{" "}
                          {selectedBookingForInvoice.assignedMechanicsDetails
                            ?.reduce(
                              (total, mechanic) =>
                                total + (parseFloat(mechanic.hourlyRate) || 0),
                              0
                            )
                            .toLocaleString() || "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <svg
                      className="w-12 h-12 mx-auto mb-3 text-gray-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <p>No mechanics assigned to this booking</p>
                  </div>
                )}
              </div>

              {/* Spare Parts Charges Section */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  Spare Parts Charges
                </h4>
                {selectedBookingForInvoice.assignedSpareParts &&
                selectedBookingForInvoice.assignedSpareParts.length > 0 ? (
                  <div className="space-y-3">
                    {JSON.parse(
                      selectedBookingForInvoice.assignedSpareParts
                    ).map((part, index) => {
                      // Find part details from the assignedSparePartsDetails if available
                      const partDetails =
                        selectedBookingForInvoice.assignedSparePartsDetails?.find(
                          (p) => p.partId === part.partId
                        );
                      return (
                        <div
                          key={part.partId || index}
                          className="p-3 bg-green-50 rounded-lg border border-green-200"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">
                                {partDetails
                                  ? partDetails.partName
                                  : `Part ${index + 1}`}
                              </div>
                              <div className="text-sm text-gray-600">
                                {partDetails
                                  ? `${partDetails.category} • ${partDetails.partCode}`
                                  : "Details not available"}
                              </div>
                            </div>
                            <div className="text-right ml-4">
                              <div className="font-bold text-green-600">
                                Rs.{" "}
                                {partDetails
                                  ? partDetails.totalPrice?.toLocaleString()
                                  : "N/A"}
                              </div>
                              <div className="text-xs text-gray-500">
                                Qty: {parseInt(part.quantity) || 1}
                              </div>
                            </div>
                          </div>
                          {partDetails && (
                            <div className="text-xs text-gray-500 mt-2">
                              Unit Price: Rs.{" "}
                              {parseFloat(
                                partDetails.unitPrice
                              )?.toLocaleString()}{" "}
                              × {parseInt(part.quantity) || 1} = Rs.{" "}
                              {parseFloat(
                                partDetails.totalPrice
                              )?.toLocaleString()}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    <div className="border-t border-green-200 pt-3 mt-4">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-gray-900">
                          Total Parts Cost:
                        </span>
                        <span className="font-bold text-lg text-green-600">
                          Rs.{" "}
                          {selectedBookingForInvoice.assignedSparePartsDetails
                            ?.reduce(
                              (total, part) =>
                                total + (parseFloat(part.totalPrice) || 0),
                              0
                            )
                            .toLocaleString() || "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <svg
                      className="w-12 h-12 mx-auto mb-3 text-gray-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <p>No spare parts assigned to this booking</p>
                  </div>
                )}
              </div>

              {/* Total Cost Summary */}
              {(selectedBookingForInvoice.assignedMechanicsDetails?.length >
                0 ||
                selectedBookingForInvoice.assignedSparePartsDetails?.length >
                  0) && (
                <div className="border-t border-gray-200 pt-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-3">
                      Cost Summary
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Labor Cost:</span>
                        <span className="font-medium">
                          Rs.{" "}
                          {selectedBookingForInvoice.assignedMechanicsDetails
                            ?.reduce(
                              (total, mechanic) =>
                                total + (parseFloat(mechanic.hourlyRate) || 0),
                              0
                            )
                            .toLocaleString() || "0"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Parts Cost:</span>
                        <span className="font-medium">
                          Rs.{" "}
                          {selectedBookingForInvoice.assignedSparePartsDetails
                            ?.reduce(
                              (total, part) =>
                                total + (parseFloat(part.totalPrice) || 0),
                              0
                            )
                            .toLocaleString() || "0"}
                        </span>
                      </div>
                      <div className="border-t border-gray-300 pt-2 flex justify-between font-bold text-lg">
                        <span>Total Amount:</span>
                        <span className="text-red-600">
                          Rs.{" "}
                          {(
                            selectedBookingForInvoice.assignedMechanicsDetails?.reduce(
                              (total, mechanic) =>
                                total + (parseFloat(mechanic.hourlyRate) || 0),
                              0
                            ) +
                              selectedBookingForInvoice.assignedSparePartsDetails?.reduce(
                                (total, part) =>
                                  total + (parseFloat(part.totalPrice) || 0),
                                0
                              ) || 0
                          ).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowInvoiceMenu(false);
                    setSelectedBookingForInvoice(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
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

export default CustomerDashboard;
