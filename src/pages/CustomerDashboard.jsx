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
  Users,
  FileText,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  bookingsAPI,
  vehicleAPI,
  breakdownAPI,
  invoiceAPI,
} from "../utils/api";
import { checkoutOrder } from "../utils/eshopApi";
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

  // E-Shop cart state and helpers (stored in localStorage)
  const [eshopCart, setEshopCart] = useState([]);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("visa"); // 'paypal', 'visa', 'mastercard'
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentFormData, setPaymentFormData] = useState({
    email: "",
    password: "",
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    cardholderName: "",
    streetAddress: "",
    city: "",
    postalCode: "",
  });
  const [isPayingBill, setIsPayingBill] = useState(false);
  const [billPaymentTotal, setBillPaymentTotal] = useState(0);

  const loadEshopCart = () => {
    try {
      const stored = localStorage.getItem("eshopCart") || "[]";
      const parsed = JSON.parse(stored);
      setEshopCart(Array.isArray(parsed) ? parsed : []);
    } catch (err) {
      console.error("Failed to load eshop cart", err);
      setEshopCart([]);
    }
  };

  useEffect(() => {
    if (activeTab === "e-shop") {
      loadEshopCart();
      // Reset selected items when switching to e-shop tab
      setSelectedItems(new Set());
    }
    const handler = () => loadEshopCart();
    window.addEventListener("eshopCartUpdated", handler);
    return () => window.removeEventListener("eshopCartUpdated", handler);
  }, [activeTab]);

  const persistCart = (cart) => {
    try {
      localStorage.setItem("eshopCart", JSON.stringify(cart));
      setEshopCart(cart);
      try {
        window.dispatchEvent(new CustomEvent("eshopCartUpdated"));
      } catch (e) {}
    } catch (err) {
      console.error("Failed to persist eshop cart", err);
    }
  };

  const removeFromCart = (id) => {
    const updated = eshopCart.filter((i) => i.id !== id);
    persistCart(updated);
    // Remove from selected items if it was selected
    setSelectedItems((prev) => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
    toast.success("Removed from cart");
  };

  const updateQuantity = (id, qty) => {
    if (qty < 1) return;
    const updated = eshopCart.map((i) =>
      i.id === id ? { ...i, quantity: qty } : i
    );
    persistCart(updated);
  };

  // Checkbox selection handlers
  const toggleItemSelection = (id) => {
    setSelectedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedItems.size === eshopCart.length) {
      // Deselect all
      setSelectedItems(new Set());
    } else {
      // Select all
      setSelectedItems(new Set(eshopCart.map((item) => item.id)));
    }
  };

  // Get selected items for checkout
  const getSelectedItems = () => {
    return eshopCart.filter((item) => selectedItems.has(item.id));
  };

  // Calculate total for selected items only
  const getSelectedTotal = () => {
    return getSelectedItems().reduce(
      (total, item) => total + item.price * (item.quantity || 1),
      0
    );
  };

  // Handle checkout
  const handleCheckout = () => {
    if (selectedItems.size === 0) {
      toast.error("Please select at least one item to checkout");
      return;
    }
    setShowPaymentModal(true);
  };

  // Process payment
  const processPayment = async () => {
    setIsProcessingPayment(true);
    try {
      // Validate payment form based on method
      if (paymentMethod === "paypal") {
        if (!paymentFormData.email || !paymentFormData.password) {
          toast.error("Please fill in all PayPal fields");
          setIsProcessingPayment(false);
          return;
        }
      } else {
        if (
          !paymentFormData.cardNumber ||
          !paymentFormData.expiryDate ||
          !paymentFormData.cvv ||
          !paymentFormData.cardholderName
        ) {
          toast.error("Please fill in all card details");
          setIsProcessingPayment(false);
          return;
        }
      }

      // Prepare billing address
      const billingAddress = {
        streetAddress: paymentFormData.streetAddress,
        city: paymentFormData.city,
        postalCode: paymentFormData.postalCode,
      };

      if (isPayingBill && selectedBookingForInvoice) {
        // Process bill payment
        const total = billPaymentTotal;
        
        // Prepare bill payment data
        const billPaymentData = {
          bookingId: selectedBookingForInvoice.bookingId,
          paymentMethod: paymentMethod,
          totalAmount: total,
          billingAddress: billingAddress,
          serviceDetails: selectedBookingForInvoice.serviceDetails || [],
          partsDetails: selectedBookingForInvoice.assignedSparePartsDetails || [],
        };

        // For now, simulate payment success (you can add actual API call later)
        // In a real scenario, you would call an API endpoint like:
        // const response = await invoiceAPI.payInvoice(billPaymentData);
        
        // Simulate API call delay
        await new Promise((resolve) => setTimeout(resolve, 1500));

        // Close modals and reset
        setShowPaymentModal(false);
        setShowInvoiceMenu(false);
        setSelectedBookingForInvoice(null);
        setIsPayingBill(false);
        setBillPaymentTotal(0);
        
        // Reset form
        setPaymentFormData({
          email: "",
          password: "",
          cardNumber: "",
          expiryDate: "",
          cvv: "",
          cardholderName: "",
          streetAddress: "",
          city: "",
          postalCode: "",
        });

        toast.success(
          `Payment successful! Bill for Booking #${selectedBookingForInvoice.bookingId} has been paid.`
        );

        // Refresh bookings to update status
        try {
          const response = await bookingsAPI.getUserBookings();
          setBookings(response.data || []);
        } catch (refreshError) {
          console.warn("Could not refresh bookings list:", refreshError);
        }
      } else {
        // Process E-Shop checkout
        const selected = getSelectedItems();
        const total = getSelectedTotal();

        // Prepare checkout data
        const checkoutData = {
          items: selected.map((item) => ({
            id: item.id || item.itemId,
            itemId: item.id || item.itemId,
            name: item.name || item.itemName,
            quantity: item.quantity || 1,
            price: item.price,
          })),
          paymentMethod: paymentMethod,
          totalAmount: total,
          billingAddress: billingAddress,
        };

        // Call checkout API
        const response = await checkoutOrder(checkoutData);

        if (response.success) {
          // Remove selected items from cart after successful payment
          const remainingItems = eshopCart.filter(
            (item) => !selectedItems.has(item.id)
          );
          persistCart(remainingItems);
          setSelectedItems(new Set());
          setShowPaymentModal(false);
          // Reset form
          setPaymentFormData({
            email: "",
            password: "",
            cardNumber: "",
            expiryDate: "",
            cvv: "",
            cardholderName: "",
            streetAddress: "",
            city: "",
            postalCode: "",
          });

          toast.success(
            `Payment successful! Order #${response.data.orderNumber} placed for ${
              selected.length
            } item${selected.length !== 1 ? "s" : ""}`
          );
        } else {
          throw new Error(response.message || "Payment failed");
        }
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Payment failed. Please try again."
      );
    } finally {
      setIsProcessingPayment(false);
    }
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
      // Always fetch fresh booking data to ensure we have all details including mechanics and parts
      const response = await bookingsAPI.getBookingById(bookingId);
      setSelectedBooking(response.data);
      setShowBookingDetails(true);
    } catch (err) {
      console.error("Error viewing booking details:", err);
      // Fallback to local data if API fails
      const booking = bookings.find((b) => b.bookingId === bookingId);
      if (booking) {
        setSelectedBooking(booking);
        setShowBookingDetails(true);
      } else {
        setError("Failed to load booking details. Please try again.");
        toast.error("Failed to load booking details");
      }
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
                ) : bookings.filter((booking) => {
                    const status = booking.status?.toLowerCase();
                    return (
                      status === "pending" ||
                      status === "confirmed" ||
                      status === "approved" ||
                      status === "in progress"
                    );
                  }).length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">
                      No active bookings. All caught up!
                    </p>
                    <Link
                      to="/booking"
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors inline-block"
                    >
                      Book a New Service
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {bookings
                      .filter((booking) => {
                        const status = booking.status?.toLowerCase();
                        return (
                          status === "pending" ||
                          status === "confirmed" ||
                          status === "approved" ||
                          status === "in progress"
                        );
                      })
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
                              {booking.status?.toLowerCase() === "pending" && (
                                <button
                                  onClick={() =>
                                    cancelBooking(booking.bookingId)
                                  }
                                  className="text-red-600 hover:text-red-700 px-3 py-1 rounded-lg text-xs font-medium hover:bg-red-50 transition-colors flex items-center space-x-1"
                                  title="Cancel Booking"
                                >
                                  <Trash2 className="w-4 h-4" />
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

                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${getBreakdownStatusColor(
                                customerStatus
                              )}`}
                            >
                              {customerStatus}
                            </span>
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
                bookings.filter((b) => {
                  const status = b?.status?.toLowerCase();
                  return (
                    status === "verified" ||
                    status === "completed" ||
                    status === "cancelled" ||
                    status === "rejected"
                  );
                }).length > 0 ? (
                  <div className="space-y-4">
                    {bookings
                      .filter((b) => {
                        const status = b?.status?.toLowerCase();
                        return (
                          status === "verified" ||
                          status === "completed" ||
                          status === "cancelled" ||
                          status === "rejected"
                        );
                      })
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

            {activeTab === "e-shop" && (
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-6">Cart</h3>
                {Array.isArray(eshopCart) && eshopCart.length > 0 ? (
                  <div>
                    {/* Select All Checkbox */}
                    <div className="mb-4 flex items-center">
                      <input
                        type="checkbox"
                        id="select-all"
                        checked={
                          selectedItems.size === eshopCart.length &&
                          eshopCart.length > 0
                        }
                        onChange={toggleSelectAll}
                        className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                      />
                      <label
                        htmlFor="select-all"
                        className="ml-2 text-sm font-medium text-gray-700"
                      >
                        Select All ({selectedItems.size} of {eshopCart.length}{" "}
                        selected)
                      </label>
                    </div>

                    <div className="space-y-4">
                      {eshopCart.map((item) => (
                        <div
                          key={item.id}
                          className={`bg-white border rounded-lg p-4 flex items-center ${
                            selectedItems.has(item.id)
                              ? "border-red-500 shadow-md"
                              : "border-gray-200"
                          }`}
                        >
                          {/* Checkbox */}
                          <input
                            type="checkbox"
                            id={`item-${item.id}`}
                            checked={selectedItems.has(item.id)}
                            onChange={() => toggleItemSelection(item.id)}
                            className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500 mr-4"
                          />
                          <img
                            src={item.image || "/img/service-1.jpg"}
                            alt={item.name}
                            className="w-24 h-24 object-cover rounded"
                          />
                          <div className="ml-4 flex-1">
                            <h4 className="font-semibold text-gray-900">
                              {item.name}
                            </h4>
                            <p className="text-sm text-gray-500">
                              {item.brand}
                            </p>
                            <p className="text-sm text-gray-600 mt-2">
                              {item.description}
                            </p>
                          </div>
                          <div className="text-right ml-4">
                            <div className="font-bold text-red-600">
                              Rs.{" "}
                              {(
                                item.price * (item.quantity || 1)
                              ).toLocaleString()}
                            </div>
                            <div className="mt-2 flex items-center justify-end">
                              <input
                                type="number"
                                min="1"
                                value={item.quantity || 1}
                                onChange={(e) =>
                                  updateQuantity(
                                    item.id,
                                    Number(e.target.value)
                                  )
                                }
                                className="w-20 px-2 py-1 border rounded text-sm"
                              />
                              <button
                                onClick={() => removeFromCart(item.id)}
                                className="ml-3 text-red-600 hover:underline text-sm"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 flex justify-between items-center">
                      <div>
                        <span className="font-medium">
                          {selectedItems.size > 0
                            ? `Selected Items Total:`
                            : `Total:`}
                        </span>
                        <span className="font-bold ml-2 text-lg text-red-600">
                          Rs.{" "}
                          {selectedItems.size > 0
                            ? getSelectedTotal().toLocaleString()
                            : eshopCart
                                .reduce(
                                  (t, i) => t + i.price * (i.quantity || 1),
                                  0
                                )
                                .toLocaleString()}
                        </span>
                        {selectedItems.size > 0 && (
                          <span className="text-sm text-gray-500 ml-2">
                            ({selectedItems.size} item
                            {selectedItems.size !== 1 ? "s" : ""} selected)
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <Link
                          to="/parts"
                          className="px-4 py-2 border border-gray-300 rounded text-sm"
                        >
                          Continue Shopping
                        </Link>
                        <button
                          onClick={handleCheckout}
                          disabled={selectedItems.size === 0}
                          className={`px-4 py-2 rounded text-sm ${
                            selectedItems.size === 0
                              ? "bg-gray-400 cursor-not-allowed text-white"
                              : "bg-red-600 hover:bg-red-700 text-white"
                          }`}
                        >
                          Checkout{" "}
                          {selectedItems.size > 0 && `(${selectedItems.size})`}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">
                      Add your first item to the cart
                    </p>
                    <Link
                      to="/parts"
                      className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors inline-block"
                    >
                      Browse Parts
                    </Link>
                  </div>
                )}
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
                      {selectedInvoice.invoiceData?.pricing?.servicesCost >
                        0 && (
                        <div className="flex justify-between">
                          <span>Service Charge:</span>
                          <span>
                            Rs.{" "}
                            {selectedInvoice.invoiceData.pricing.servicesCost.toLocaleString()}
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
            <div className="p-6 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <h3 className="text-2xl font-bold text-gray-900">
                    Booking Details
                  </h3>
                  <span
                    className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(
                      selectedBooking.status
                    )}`}
                  >
                    {selectedBooking.status}
                  </span>
                </div>
                <button
                  onClick={() => setShowBookingDetails(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-200 rounded-full"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              <div className="mt-2 text-sm text-gray-500 flex gap-4">
                <span>ID: #{selectedBooking.bookingId}</span>
                <span>•</span>
                <span>Created: {formatDate(selectedBooking.createdAt)}</span>
              </div>
            </div>

            <div className="p-6 space-y-8">
              {/* Top Section: Vehicle & Booking Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Vehicle Card */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center gap-2">
                    <Car className="w-5 h-5 text-red-600" />
                    <h4 className="font-semibold text-gray-900">
                      Vehicle Information
                    </h4>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="flex justify-between border-b border-gray-100 pb-2">
                      <span className="text-gray-500 text-sm">
                        Vehicle Number
                      </span>
                      <span className="font-mono font-medium text-gray-900">
                        {selectedBooking.vehicleNumber}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-gray-100 pb-2">
                      <span className="text-gray-500 text-sm">
                        Make & Model
                      </span>
                      <span className="font-medium text-gray-900">
                        {selectedBooking.vehicleBrand}{" "}
                        {selectedBooking.vehicleBrandModel}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-gray-100 pb-2">
                      <span className="text-gray-500 text-sm">Year</span>
                      <span className="font-medium text-gray-900">
                        {selectedBooking.manufacturedYear}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-gray-100 pb-2">
                      <span className="text-gray-500 text-sm">Type</span>
                      <span className="font-medium text-gray-900 capitalize">
                        {selectedBooking.vehicleType}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-gray-100 pb-2">
                      <span className="text-gray-500 text-sm">Fuel</span>
                      <span className="font-medium text-gray-900 capitalize">
                        {selectedBooking.fuelType}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 text-sm">
                        Transmission
                      </span>
                      <span className="font-medium text-gray-900 capitalize">
                        {selectedBooking.transmissionType}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Booking Info Card */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-red-600" />
                    <h4 className="font-semibold text-gray-900">
                      Appointment Details
                    </h4>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="flex justify-between border-b border-gray-100 pb-2">
                      <span className="text-gray-500 text-sm">Date</span>
                      <span className="font-medium text-gray-900">
                        {formatDate(selectedBooking.bookingDate)}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-gray-100 pb-2">
                      <span className="text-gray-500 text-sm">Time Slot</span>
                      <span className="font-medium text-gray-900">
                        {selectedBooking.timeSlot}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-gray-100 pb-2">
                      <span className="text-gray-500 text-sm">
                        Customer Name
                      </span>
                      <span className="font-medium text-gray-900">
                        {selectedBooking.name}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-gray-100 pb-2">
                      <span className="text-gray-500 text-sm">Contact</span>
                      <span className="font-medium text-gray-900">
                        {selectedBooking.phone}
                      </span>
                    </div>
                    {selectedBooking.arrivedTime && (
                      <div className="flex justify-between border-b border-gray-100 pb-2">
                        <span className="text-gray-500 text-sm">
                          Arrived At
                        </span>
                        <span className="font-medium text-gray-900">
                          {selectedBooking.arrivedTime}
                        </span>
                      </div>
                    )}
                    {selectedBooking.kilometersRun && (
                      <div className="flex justify-between">
                        <span className="text-gray-500 text-sm">Odometer</span>
                        <span className="font-medium text-gray-900">
                          {Number(
                            selectedBooking.kilometersRun
                          ).toLocaleString()}{" "}
                          km
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Services Section */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <h4 className="font-semibold text-gray-900">
                    Service Information
                  </h4>
                </div>
                <div className="p-4">
                  <div className="mb-4">
                    <h5 className="text-sm font-medium text-gray-500 mb-2">
                      Requested Services
                    </h5>
                    <div className="flex flex-wrap gap-2">
                      {selectedBooking.serviceTypes ? (
                        (Array.isArray(selectedBooking.serviceTypes)
                          ? selectedBooking.serviceTypes
                          : selectedBooking.serviceTypes.split(",")
                        ).map((service, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-red-50 text-red-700 rounded-full text-sm font-medium border border-red-100"
                          >
                            {typeof service === "string"
                              ? service.trim()
                              : service}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-400 italic">
                          No specific services listed
                        </span>
                      )}
                    </div>
                  </div>
                  {selectedBooking.specialRequests && (
                    <div>
                      <h5 className="text-sm font-medium text-gray-500 mb-2">
                        Special Requests
                      </h5>
                      <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-3 text-gray-800 text-sm">
                        {selectedBooking.specialRequests}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Mechanics & Parts (Only if available) */}
              {(selectedBooking.assignedMechanicsDetails?.length > 0 ||
                selectedBooking.assignedSparePartsDetails?.length > 0) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Mechanics */}
                  {selectedBooking.assignedMechanicsDetails?.length > 0 && (
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center gap-2">
                        <Users className="w-5 h-5 text-red-600" />
                        <h4 className="font-semibold text-gray-900">
                          Assigned Mechanics
                        </h4>
                      </div>
                      <div className="p-4 space-y-3">
                        {selectedBooking.assignedMechanicsDetails.map(
                          (mechanic) => (
                            <div
                              key={mechanic.mechanicId}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100"
                            >
                              <div>
                                <p className="font-medium text-gray-900">
                                  {mechanic.mechanicName}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {mechanic.specialization}
                                </p>
                              </div>
                              <span className="text-xs bg-white border border-gray-200 px-2 py-1 rounded text-gray-600">
                                {mechanic.mechanicCode}
                              </span>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}

                  {/* Parts */}
                  {selectedBooking.assignedSparePartsDetails?.length > 0 && (
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-red-600" />
                        <h4 className="font-semibold text-gray-900">
                          Spare Parts Used
                        </h4>
                      </div>
                      <div className="p-4 space-y-3">
                        {selectedBooking.assignedSparePartsDetails.map(
                          (part) => (
                            <div
                              key={part.partId}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100"
                            >
                              <div>
                                <p className="font-medium text-gray-900">
                                  {part.partName}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {part.partCode} • Qty: {part.assignedQuantity}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-medium text-gray-900">
                                  Rs. {part.totalPrice?.toLocaleString()}
                                </p>
                              </div>
                            </div>
                          )
                        )}
                        <div className="pt-2 border-t border-gray-100 flex justify-between items-center">
                          <span className="font-medium text-gray-700">
                            Total Parts Cost
                          </span>
                          <span className="font-bold text-red-600">
                            Rs.{" "}
                            {selectedBooking.assignedSparePartsDetails
                              .reduce(
                                (sum, part) => sum + (part.totalPrice || 0),
                                0
                              )
                              .toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
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
              {/* Service Charge Section */}
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
                  Service Charge
                </h4>
                {selectedBookingForInvoice.serviceDetails &&
                selectedBookingForInvoice.serviceDetails.length > 0 ? (
                  <div className="space-y-3">
                    {selectedBookingForInvoice.serviceDetails.map(
                      (service, index) => (
                        <div
                          key={index}
                          className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border border-blue-200"
                        >
                          <div>
                            <div className="font-medium text-gray-900">
                              {service.serviceName}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-blue-600">
                              Rs. {parseFloat(service.price).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      )
                    )}
                    <div className="border-t border-blue-200 pt-3 mt-4">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-gray-900">
                          Total Service Charge:
                        </span>
                        <span className="font-bold text-lg text-blue-600">
                          Rs.{" "}
                          {selectedBookingForInvoice.serviceDetails
                            ?.reduce(
                              (total, service) =>
                                total + (parseFloat(service.price) || 0),
                              0
                            )
                            .toLocaleString() || "0"}
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
                    <p>No services assigned to this booking</p>
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
              {(selectedBookingForInvoice.serviceDetails?.length > 0 ||
                selectedBookingForInvoice.assignedSparePartsDetails?.length >
                  0) && (
                <div className="border-t border-gray-200 pt-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-3">
                      Cost Summary
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Service Charge:</span>
                        <span className="font-medium">
                          Rs.{" "}
                          {selectedBookingForInvoice.serviceDetails
                            ?.reduce(
                              (total, service) =>
                                total + (parseFloat(service.price) || 0),
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
                            (selectedBookingForInvoice.serviceDetails?.reduce(
                              (total, service) =>
                                total + (parseFloat(service.price) || 0),
                              0
                            ) || 0) +
                            (selectedBookingForInvoice.assignedSparePartsDetails?.reduce(
                              (total, part) =>
                                total + (parseFloat(part.totalPrice) || 0),
                              0
                            ) || 0)
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
                <button
                  onClick={() => {
                    // Calculate total amount
                    const serviceTotal =
                      selectedBookingForInvoice.serviceDetails?.reduce(
                        (total, service) =>
                          total + (parseFloat(service.price) || 0),
                        0
                      ) || 0;
                    const partsTotal =
                      selectedBookingForInvoice.assignedSparePartsDetails?.reduce(
                        (total, part) =>
                          total + (parseFloat(part.totalPrice) || 0),
                        0
                      ) || 0;
                    const total = serviceTotal + partsTotal;

                    if (total <= 0) {
                      toast.error("No amount to pay for this bill");
                      return;
                    }

                    setBillPaymentTotal(total);
                    setIsPayingBill(true);
                    setShowPaymentModal(true);
                  }}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  Pay Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-gray-900">
                  {isPayingBill ? "Pay Bill" : "Payment"}
                </h3>
                <button
                  onClick={() => {
                    setShowPaymentModal(false);
                    setIsPayingBill(false);
                    setBillPaymentTotal(0);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Order Summary */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">
                  {isPayingBill ? "Bill Summary" : "Order Summary"}
                </h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  {isPayingBill && selectedBookingForInvoice ? (
                    <>
                      {selectedBookingForInvoice.serviceDetails?.length > 0 && (
                        <>
                          <div className="text-xs font-medium text-blue-800 mb-2">
                            Service Charges:
                          </div>
                          {selectedBookingForInvoice.serviceDetails.map(
                            (service, index) => (
                              <div
                                key={index}
                                className="flex justify-between items-center text-sm"
                              >
                                <span className="text-gray-700">
                                  {service.serviceName}
                                </span>
                                <span className="font-medium text-gray-900">
                                  Rs. {parseFloat(service.price).toLocaleString()}
                                </span>
                              </div>
                            )
                          )}
                        </>
                      )}
                      {selectedBookingForInvoice.assignedSparePartsDetails
                        ?.length > 0 && (
                        <>
                          <div className="text-xs font-medium text-blue-800 mb-2 mt-2">
                            Parts Charges:
                          </div>
                          {selectedBookingForInvoice.assignedSparePartsDetails.map(
                            (part, index) => (
                              <div
                                key={index}
                                className="flex justify-between items-center text-sm"
                              >
                                <span className="text-gray-700">
                                  {part.partName} (Qty: {part.assignedQuantity})
                                </span>
                                <span className="font-medium text-gray-900">
                                  Rs.{" "}
                                  {parseFloat(part.totalPrice).toLocaleString()}
                                </span>
                              </div>
                            )
                          )}
                        </>
                      )}
                      <div className="border-t border-gray-300 pt-2 mt-2 flex justify-between font-bold text-lg">
                        <span>Total:</span>
                        <span className="text-red-600">
                          Rs. {billPaymentTotal.toLocaleString()}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Booking ID: {selectedBookingForInvoice.bookingId}
                      </div>
                    </>
                  ) : (
                    <>
                      {getSelectedItems().map((item) => (
                        <div
                          key={item.id}
                          className="flex justify-between items-center text-sm"
                        >
                          <span className="text-gray-700">
                            {item.name} × {item.quantity || 1}
                          </span>
                          <span className="font-medium text-gray-900">
                            Rs.{" "}
                            {(item.price * (item.quantity || 1)).toLocaleString()}
                          </span>
                        </div>
                      ))}
                      <div className="border-t border-gray-300 pt-2 mt-2 flex justify-between font-bold text-lg">
                        <span>Total:</span>
                        <span className="text-red-600">
                          Rs. {getSelectedTotal().toLocaleString()}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Payment Method Selection */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">
                  Select Payment Method
                </h4>
                <div className="grid grid-cols-3 gap-4">
                  {/* PayPal */}
                  <button
                    onClick={() => setPaymentMethod("paypal")}
                    className={`p-2 border-2 rounded-lg transition-all ${
                      paymentMethod === "paypal"
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="text-center">
                      <img
                        src="./public/img/paypal.png"
                        alt="PayPal"
                        className="w-15 h-10 mx-auto"
                      />
                    </div>
                  </button>

                  {/* Visa */}
                  <button
                    onClick={() => setPaymentMethod("visa")}
                    className={`p-4 border-2 rounded-lg transition-all ${
                      paymentMethod === "visa"
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="text-center">
                      <img
                        src="./public/img/visa.png"
                        alt="Visa"
                        className="w-20 h-13 mx-auto"
                      />
                    </div>
                  </button>

                  {/* Mastercard */}
                  <button
                    onClick={() => setPaymentMethod("mastercard")}
                    className={`p-4 border-2 rounded-lg transition-all ${
                      paymentMethod === "mastercard"
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="text-center">
                      <img
                        src="./public/img/mastercard.png"
                        alt="MasterCard"
                        className="w-20 h-13 mx-auto"
                      />
                    </div>
                  </button>
                </div>
              </div>

              {/* Payment Form */}
              <div className="mb-6">
                {paymentMethod === "paypal" ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        PayPal Email
                      </label>
                      <input
                        type="email"
                        placeholder="your.email@example.com"
                        value={paymentFormData.email}
                        onChange={(e) =>
                          setPaymentFormData({
                            ...paymentFormData,
                            email: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Password
                      </label>
                      <input
                        type="password"
                        placeholder="Enter your PayPal password"
                        value={paymentFormData.password}
                        onChange={(e) =>
                          setPaymentFormData({
                            ...paymentFormData,
                            password: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Card Number
                      </label>
                      <input
                        type="text"
                        placeholder="1234 5678 9012 3456"
                        maxLength="19"
                        value={paymentFormData.cardNumber}
                        onChange={(e) =>
                          setPaymentFormData({
                            ...paymentFormData,
                            cardNumber: e.target.value
                              .replace(/\s/g, "")
                              .replace(/(.{4})/g, "$1 ")
                              .trim(),
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Expiry Date
                        </label>
                        <input
                          type="text"
                          placeholder="MM/YY"
                          maxLength="5"
                          value={paymentFormData.expiryDate}
                          onChange={(e) => {
                            let value = e.target.value.replace(/\D/g, "");
                            if (value.length >= 2) {
                              value =
                                value.slice(0, 2) + "/" + value.slice(2, 4);
                            }
                            setPaymentFormData({
                              ...paymentFormData,
                              expiryDate: value,
                            });
                          }}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          CVV
                        </label>
                        <input
                          type="text"
                          placeholder="123"
                          maxLength="4"
                          value={paymentFormData.cvv}
                          onChange={(e) =>
                            setPaymentFormData({
                              ...paymentFormData,
                              cvv: e.target.value.replace(/\D/g, ""),
                            })
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Cardholder Name
                      </label>
                      <input
                        type="text"
                        placeholder="John Doe"
                        value={paymentFormData.cardholderName}
                        onChange={(e) =>
                          setPaymentFormData({
                            ...paymentFormData,
                            cardholderName: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Billing Address (Optional) */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">
                  Billing Address
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Street Address
                    </label>
                    <input
                      type="text"
                      placeholder="123 Main Street"
                      value={paymentFormData.streetAddress}
                      onChange={(e) =>
                        setPaymentFormData({
                          ...paymentFormData,
                          streetAddress: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        City
                      </label>
                      <input
                        type="text"
                        placeholder="Colombo"
                        value={paymentFormData.city}
                        onChange={(e) =>
                          setPaymentFormData({
                            ...paymentFormData,
                            city: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Postal Code
                      </label>
                      <input
                        type="text"
                        placeholder="00000"
                        value={paymentFormData.postalCode}
                        onChange={(e) =>
                          setPaymentFormData({
                            ...paymentFormData,
                            postalCode: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowPaymentModal(false);
                    setIsPayingBill(false);
                    setBillPaymentTotal(0);
                  }}
                  disabled={isProcessingPayment}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={processPayment}
                  disabled={isProcessingPayment}
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isProcessingPayment ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    `Pay Rs. ${
                      isPayingBill
                        ? billPaymentTotal.toLocaleString()
                        : getSelectedTotal().toLocaleString()
                    }`
                  )}
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
