import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  DollarSign,
  User,
  Calendar,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
  FileText,
} from "lucide-react";
import {
  bookingsAPI,
  staffAPI,
  customerAPI,
  invoiceAPI,
  breakdownAPI,
} from "../utils/api";

const ManagementDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [dashboardData, setDashboardData] = useState({
    totalCustomers: 1234,
    todayRevenue: 125000,
    staffMembers: 0,
    activeBookings: 0,
    dailyBookingLimit: 0,
    maxDailyBookings: 8,
    todayBookings: 0,
    totalBookings: 0,
    pendingBookings: 0,
    completedBookings: 0,
    pendingBreakdowns: 3,
    inProgressBreakdowns: 5,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showBookingDetails, setShowBookingDetails] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  // Breakdown requests state
  const [breakdownRequests, setBreakdownRequests] = useState([]);
  const [loadingBreakdowns, setLoadingBreakdowns] = useState(false);
  const [selectedBreakdown, setSelectedBreakdown] = useState(null);
  const [showBreakdownDetails, setShowBreakdownDetails] = useState(false);
  const [lastUpdatedBreakdowns, setLastUpdatedBreakdowns] = useState(null);
  
  // Staff management state
  const [staff, setStaff] = useState([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [showStaffForm, setShowStaffForm] = useState(false);
  const [staffForm, setStaffForm] = useState({
    name: '',
    email: '',
    role: '',
    mechanicDetails: {
      specialization: '',
      experienceYears: 0,
      certifications: '',
      hourlyRate: 0
    }
  });
  const [roleAvailability, setRoleAvailability] = useState({});

  // Load dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch booking stats from API
        const bookingResponse = await bookingsAPI.getStats();
        const bookingStats = bookingResponse.data;

        console.log("Booking stats loaded:", bookingStats);

        // Fetch staff stats from API
        const staffResponse = await staffAPI.getStats();
        const staffStats = staffResponse.data;

        console.log("Staff stats loaded:", staffStats);

        // Fetch customer stats from API
        const customerResponse = await customerAPI.getStats();
        const customerStats = customerResponse.data;

        console.log("Customer stats loaded:", customerStats);

        setDashboardData((prevData) => ({
          ...prevData,
          activeBookings: bookingStats.activeBookings || 0,
          dailyBookingLimit: bookingStats.todayBookings || 0,
          maxDailyBookings: bookingStats.dailyBookingLimit || 8,
          todayBookings: bookingStats.todayBookings || 0,
          totalBookings: bookingStats.total || 0,
          pendingBookings: bookingStats.pending || 0,
          completedBookings: bookingStats.completed || 0,
          staffMembers: staffStats.totalStaff || 0,
          // Support both { totalCustomers } and { success, data: { totalCustomers } }
          totalCustomers:
            (customerStats &&
              (customerStats.totalCustomers ??
                customerStats.data?.totalCustomers)) ||
            0,
        }));
      } catch (error) {
        console.error("Error loading dashboard stats:", error);
        setError("Failed to load dashboard statistics");
        // Keep the default mock data for other fields
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  // Load bookings when bookings tab is active
  useEffect(() => {
    const loadBookings = async () => {
      if (activeTab === "bookings") {
        setLoadingBookings(true);
        try {
          const response = await bookingsAPI.getAll();
          setBookings(response.data);
          setLastUpdated(new Date());
        } catch (error) {
          console.error("Error loading bookings:", error);
          setError("Failed to load bookings");
        } finally {
          setLoadingBookings(false);
        }
      }
    };

    loadBookings();

    // Set up auto-refresh every 10 seconds when on bookings tab
    let refreshInterval;
    if (activeTab === "bookings") {
      refreshInterval = setInterval(async () => {
        try {
          const response = await bookingsAPI.getAll();
          setBookings(response.data);
          setLastUpdated(new Date());
        } catch (error) {
          console.error("Error refreshing bookings:", error);
        }
      }, 10000); // Refresh every 10 seconds
    }

    // Cleanup interval on tab change or unmount
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [activeTab]);

  // Load breakdown requests when the tab is active
  useEffect(() => {
    const loadBreakdowns = async () => {
      if (activeTab === "breakdown-requests") {
        setLoadingBreakdowns(true);
        try {
          const response = await breakdownAPI.getAll();
          setBreakdownRequests(response.data || []);
          setLastUpdatedBreakdowns(new Date());
        } catch (err) {
          console.error("Error loading breakdown requests:", err);
          setError("Failed to load breakdown requests");
        } finally {
          setLoadingBreakdowns(false);
        }
      }
    };

    loadBreakdowns();
  }, [activeTab]);

  // Load staff when the tab is active
  useEffect(() => {
    const loadStaff = async () => {
      if (activeTab === "staff") {
        setLoadingStaff(true);
        try {
          const response = await staffAPI.getAll();
          setStaff(response.data || []);
        } catch (err) {
          console.error("Error loading staff:", err);
          setError("Failed to load staff");
        } finally {
          setLoadingStaff(false);
        }
      }
    };

    loadStaff();
  }, [activeTab]);

  // Manual refresh function for bookings
  const refreshBookings = async () => {
    setLoadingBookings(true);
    try {
      const response = await bookingsAPI.getAll();
      setBookings(response.data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error refreshing bookings:", error);
      setError("Failed to refresh bookings");
    } finally {
      setLoadingBookings(false);
    }
  };

  // Update breakdown request status
  const updateBreakdownStatus = async (requestId, status) => {
    try {
      await breakdownAPI.updateStatus(requestId, status);
      // Optimistically update local state
      setBreakdownRequests((prev) =>
        prev.map((r) => (r.requestId === requestId ? { ...r, status } : r))
      );
    } catch (err) {
      console.error("Failed to update breakdown status:", err);
      setError("Failed to update breakdown status");
    }
  };

  // Check role availability
  const checkRoleAvailability = async (role) => {
    try {
      const response = await staffAPI.checkRoleAvailability(role);
      setRoleAvailability(prev => ({
        ...prev,
        [role]: response.data.isAvailable
      }));
      return response.data.isAvailable;
    } catch (err) {
      console.error("Failed to check role availability:", err);
      return false;
    }
  };

  // Handle staff form input changes
  const handleStaffFormChange = async (field, value) => {
    setStaffForm(prev => ({
      ...prev,
      [field]: value
    }));

    // Check role availability when role changes
    if (field === 'role' && (value === 'receptionist' || value === 'service_advisor')) {
      await checkRoleAvailability(value);
    }
  };

  // Handle mechanic details changes
  const handleMechanicDetailsChange = (field, value) => {
    setStaffForm(prev => ({
      ...prev,
      mechanicDetails: {
        ...prev.mechanicDetails,
        [field]: value
      }
    }));
  };

  // Submit staff registration
  const handleStaffSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setError(null);
      
      // Check role availability for restricted roles
      if (staffForm.role === 'receptionist' || staffForm.role === 'service_advisor') {
        const isAvailable = await checkRoleAvailability(staffForm.role);
        if (!isAvailable) {
          setError(`${staffForm.role} role is already taken. Only one ${staffForm.role} is allowed.`);
          return;
        }
      }

      const staffData = {
        name: staffForm.name,
        email: staffForm.email,
        role: staffForm.role
      };

      // Add mechanic details if role is mechanic
      if (staffForm.role === 'mechanic') {
        staffData.mechanicDetails = staffForm.mechanicDetails;
      }

      const response = await staffAPI.register(staffData);
      
      // Show success message with auto-generated password
      alert(`Staff member created successfully!\n\nAuto-generated password: ${response.data.autoPassword}\n\nPlease save this password and share it with the staff member.`);
      
      // Reset form and close modal
      setStaffForm({
        name: '',
        email: '',
        role: '',
        mechanicDetails: {
          specialization: '',
          experienceYears: 0,
          certifications: '',
          hourlyRate: 0
        }
      });
      setShowStaffForm(false);
      
      // Refresh staff list
      const staffResponse = await staffAPI.getAll();
      setStaff(staffResponse.data || []);
      
    } catch (err) {
      console.error("Failed to create staff member:", err);
      setError(err.response?.data?.message || "Failed to create staff member");
    }
  };

  // Generate invoice for booking
  const generateInvoice = async (booking) => {
    try {
      console.log("Generating invoice for booking:", booking);
      console.log("Booking ID:", booking.bookingId);

      // Show loading state
      setError(null);

      // Call the invoice API
      console.log("Calling invoice API...");
      const response = await invoiceAPI.generateInvoice(booking.bookingId);
      console.log("API Response received");

      // Check if response is valid
      if (!response.data) {
        throw new Error("No data received from server");
      }

      // Create blob from response data
      const blob = new Blob([response.data], { type: "application/pdf" });
      console.log("Created blob, size:", blob.size);

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `invoice-${booking.bookingId}.pdf`;
      link.style.display = "none";

      // Trigger download
      document.body.appendChild(link);
      console.log("Triggering download...");
      link.click();

      // Cleanup
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);

      console.log("Invoice downloaded successfully");
    } catch (error) {
      console.error("Error generating invoice:", error);
      console.error("Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText,
      });
      setError(`Failed to generate invoice: ${error.message}`);
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

  const kpiCards = [
    {
      title: "Total Bookings",
      value: loading ? "..." : dashboardData.totalBookings.toLocaleString(),
      icon: <Calendar className="w-8 h-8 text-red-600" />,
      color: "bg-white",
    },
    {
      title: "Active Bookings",
      value: loading ? "..." : dashboardData.activeBookings.toString(),
      icon: <CheckCircle className="w-8 h-8 text-green-600" />,
      color: "bg-white",
    },
    {
      title: "Total Customers",
      value: loading ? "..." : dashboardData.totalCustomers.toLocaleString(),
      icon: <Users className="w-8 h-8 text-red-600" />,
      color: "bg-white",
    },
    {
      title: "Staff Members",
      value: loading ? "..." : dashboardData.staffMembers.toString(),
      icon: <User className="w-8 h-8 text-red-600" />,
      color: "bg-white",
    },
  ];

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "customers", label: "Customers" },
    { id: "staff", label: "Staff" },
    { id: "bookings", label: "Bookings" },
    { id: "breakdown-requests", label: "Breakdown Requests" },
    { id: "e-shop", label: "E-shop" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <div className="container-custom py-8">
        {/* Dashboard Title */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Management Dashboard
          </h1>
          <p className="text-gray-600 text-lg">
            Oversee operations, staff, and business performance
          </p>
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

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {kpiCards.map((card, index) => (
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
                    ? "bg-white text-gray-900 border-b-2 border-red-600 rounded-t-lg"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === "overview" && (
              <div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Daily Booking Limit */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                    <h3 className="text-sm font-medium text-gray-600 mb-2">
                      Today's Booking Status
                    </h3>
                    <div className="mb-4">
                      <p className="text-2xl font-bold text-gray-900">
                        {loading
                          ? "..."
                          : `${dashboardData.todayBookings}/${dashboardData.maxDailyBookings}`}
                      </p>
                      <p className="text-sm text-gray-600">bookings today</p>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          dashboardData.todayBookings >=
                          dashboardData.maxDailyBookings
                            ? "bg-red-600"
                            : dashboardData.todayBookings >=
                              dashboardData.maxDailyBookings * 0.8
                            ? "bg-yellow-500"
                            : "bg-green-600"
                        }`}
                        style={{
                          width: `${Math.min(
                            100,
                            (dashboardData.todayBookings /
                              dashboardData.maxDailyBookings) *
                              100
                          )}%`,
                        }}
                      ></div>
                    </div>
                    {dashboardData.todayBookings >=
                      dashboardData.maxDailyBookings && (
                      <p className="text-xs text-red-600 mt-2 font-medium">
                        Daily limit reached
                      </p>
                    )}
                  </div>

                  {/* Breakdown Requests */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                    <h3 className="text-sm font-medium text-gray-600 mb-4">
                      Breakdown Requests
                    </h3>
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <AlertCircle className="w-4 h-4 text-yellow-500" />
                          <span className="text-sm text-gray-600">
                            Pending Approvals
                          </span>
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {dashboardData.pendingBreakdowns}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-sm text-gray-600">
                            In Progress
                          </span>
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {dashboardData.inProgressBreakdowns}
                        </span>
                      </div>
                    </div>
                    <Link
                      to="/request"
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors inline-block"
                    >
                      View All Request
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "customers" && (
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-6">
                  Customer Management
                </h3>
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">
                    Customer management features coming soon
                  </p>
                </div>
              </div>
            )}

            {activeTab === "staff" && (
              <div>
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      Staff Management
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Manage staff members and their roles
                    </p>
                  </div>
                  <button
                    onClick={() => setShowStaffForm(true)}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                  >
                    <User className="w-4 h-4" />
                    Add New Staff
                  </button>
                </div>

                {loadingStaff ? (
                  <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                    <p className="text-gray-600 mt-4">Loading staff...</p>
                  </div>
                ) : staff.length === 0 ? (
                  <div className="text-center py-12">
                    <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No staff members found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border-collapse">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider border-b-2 border-gray-200">
                            NAME
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider border-b-2 border-gray-200">
                            EMAIL
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider border-b-2 border-gray-200">
                            ROLE
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider border-b-2 border-gray-200">
                            MECHANIC DETAILS
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider border-b-2 border-gray-200">
                            CREATED
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white">
                        {staff.map((member, index) => (
                          <tr
                            key={member.staffId}
                            className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${
                              index % 2 === 0 ? "bg-white" : "bg-gray-50"
                            }`}
                          >
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {member.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {member.email}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded ${
                                  member.role === "manager"
                                    ? "bg-purple-100 text-purple-800"
                                    : member.role === "receptionist"
                                    ? "bg-blue-100 text-blue-800"
                                    : member.role === "service_advisor"
                                    ? "bg-green-100 text-green-800"
                                    : member.role === "mechanic"
                                    ? "bg-orange-100 text-orange-800"
                                    : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {member.role.replace('_', ' ').toUpperCase()}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              {member.role === "mechanic" && member.mechanicId ? (
                                <div className="text-sm">
                                  <div className="font-medium text-gray-900">
                                    {member.mechanicCode} - {member.specialization}
                                  </div>
                                  <div className="text-gray-600">
                                    {member.experienceYears} years exp • Rs. {member.hourlyRate}/hr
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    Status: {member.availability}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-gray-500 text-sm">-</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {new Date(member.createdAt).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === "bookings" && (
              <div>
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      All Bookings
                    </h3>
                    {lastUpdated && (
                      <p className="text-sm text-gray-500 mt-1">
                        Last updated: {lastUpdated.toLocaleTimeString()}
                      </p>
                    )}
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">
                      Total: {bookings.length} bookings
                    </span>
                  </div>
                </div>

                {loadingBookings && bookings.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                    <p className="text-gray-600 mt-4">Loading bookings...</p>
                  </div>
                ) : bookings.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No bookings found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border-collapse">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider border-b-2 border-gray-200">
                            TIME SLOT
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider border-b-2 border-gray-200">
                            VEHICLE NUMBER
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider border-b-2 border-gray-200">
                            CUSTOMER
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider border-b-2 border-gray-200">
                            STATUS
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider border-b-2 border-gray-200">
                            ASSIGNED MECHANICS
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider border-b-2 border-gray-200">
                            ASSIGNED PARTS
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider border-b-2 border-gray-200">
                            DETAILS
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider border-b-2 border-gray-200">
                            GENERATE SERVICE CHARGE
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white">
                        {bookings.map((booking, index) => (
                          <tr
                            key={booking.bookingId}
                            className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${
                              index % 2 === 0 ? "bg-white" : "bg-gray-50"
                            }`}
                          >
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {booking.timeSlot}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {booking.vehicleNumber}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {booking.name || booking.phone}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded ${
                                  booking.status === "arrived"
                                    ? "bg-green-100 text-green-800"
                                    : booking.status === "cancelled"
                                    ? "bg-red-100 text-red-800"
                                    : booking.status === "confirmed"
                                    ? "bg-blue-100 text-blue-800"
                                    : booking.status === "completed"
                                    ? "bg-green-100 text-green-800"
                                    : booking.status === "in_progress"
                                    ? "bg-purple-100 text-purple-800"
                                    : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {booking.status}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              {booking.assignedMechanicsDetails &&
                              booking.assignedMechanicsDetails.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {booking.assignedMechanicsDetails.map(
                                    (mechanic, index) => (
                                      <span
                                        key={mechanic.mechanicId}
                                        className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium"
                                        title={`${mechanic.mechanicName} (${mechanic.specialization})`}
                                      >
                                        {mechanic.mechanicCode}
                                      </span>
                                    )
                                  )}
                                </div>
                              ) : (
                                <span className="text-gray-500 text-sm">
                                  Not assigned
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              {booking.assignedSparePartsDetails &&
                              booking.assignedSparePartsDetails.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {booking.assignedSparePartsDetails.map(
                                    (part, index) => (
                                      <span
                                        key={part.partId}
                                        className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium"
                                        title={`${part.partName} (Qty: ${part.assignedQuantity})`}
                                      >
                                        {part.partCode}
                                      </span>
                                    )
                                  )}
                                </div>
                              ) : (
                                <span className="text-gray-500 text-sm">
                                  Not assigned
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <button
                                onClick={() =>
                                  viewBookingDetails(booking.bookingId)
                                }
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded transition-colors flex items-center gap-2"
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                  />
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                  />
                                </svg>
                                View Details
                              </button>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <button
                                onClick={() => generateInvoice(booking)}
                                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded transition-colors flex items-center gap-2"
                              >
                                <FileText className="w-4 h-4" />
                                Generate Invoice
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === "breakdown-requests" && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      Breakdown Requests
                    </h3>
                    {lastUpdatedBreakdowns && (
                      <p className="text-sm text-gray-500 mt-1">
                        Last updated:{" "}
                        {lastUpdatedBreakdowns.toLocaleTimeString()}
                      </p>
                    )}
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">
                      Total: {breakdownRequests.length}
                    </span>
                  </div>
                </div>

                {loadingBreakdowns && breakdownRequests.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                    <p className="text-gray-600 mt-4">
                      Loading breakdown requests...
                    </p>
                  </div>
                ) : breakdownRequests.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No breakdown requests found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border-collapse">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider border-b-2 border-gray-200">
                            REQUESTED AT
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider border-b-2 border-gray-200">
                            CONTACT
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider border-b-2 border-gray-200">
                            VEHICLE
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider border-b-2 border-gray-200">
                            EMERGENCY
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider border-b-2 border-gray-200">
                            LOCATION
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider border-b-2 border-gray-200">
                            STATUS
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider border-b-2 border-gray-200">
                            ACTIONS
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white">
                        {breakdownRequests.map((req, idx) => (
                          <tr
                            key={req.requestId}
                            className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${
                              idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                            }`}
                          >
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {req.createdAt
                                ? new Date(req.createdAt).toLocaleString()
                                : "-"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <div className="flex flex-col">
                                <span className="font-medium">
                                  {req.contactName}
                                </span>
                                <span className="text-gray-600">
                                  {req.contactPhone}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <div className="flex flex-col">
                                <span className="font-mono">
                                  {req.vehicleNumber}
                                </span>
                                <span className="text-gray-600">
                                  {req.vehicleType || "-"}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {req.emergencyType}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {req.latitude}, {req.longitude}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded ${
                                  req.status === "Completed"
                                    ? "bg-green-100 text-green-800"
                                    : req.status === "In Progress"
                                    ? "bg-purple-100 text-purple-800"
                                    : req.status === "Approved"
                                    ? "bg-blue-100 text-blue-800"
                                    : req.status === "Cancelled"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-yellow-100 text-yellow-800"
                                }`}
                              >
                                {req.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    setSelectedBreakdown(req);
                                    setShowBreakdownDetails(true);
                                  }}
                                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded"
                                >
                                  View
                                </button>
                                <select
                                  className="text-sm border border-gray-300 rounded px-2 py-1 bg-white"
                                  value={req.status}
                                  onChange={(e) =>
                                    updateBreakdownStatus(
                                      req.requestId,
                                      e.target.value
                                    )
                                  }
                                >
                                  {[
                                    "Pending",
                                    "Approved",
                                    "In Progress",
                                    "Completed",
                                    "Cancelled",
                                  ].map((s) => (
                                    <option key={s} value={s}>
                                      {s}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === "e-shop" && (
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-6">
                  E-Shop Management
                </h3>
                <div className="text-center py-12">
                  <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">
                    E-Shop management features coming soon
                  </p>
                </div>
              </div>
            )}
          </div>
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

      {/* Breakdown Details Modal */}
      {showBreakdownDetails && selectedBreakdown && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-gray-900">
                  Breakdown Request
                </h3>
                <button
                  onClick={() => setShowBreakdownDetails(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="text-lg font-semibold">Contact</h4>
                  <div>
                    <div className="text-sm text-gray-600">Name</div>
                    <div className="font-medium">
                      {selectedBreakdown.contactName}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Phone</div>
                    <div className="font-medium">
                      {selectedBreakdown.contactPhone}
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <h4 className="text-lg font-semibold">Vehicle</h4>
                  <div>
                    <div className="text-sm text-gray-600">Vehicle Number</div>
                    <div className="font-mono">
                      {selectedBreakdown.vehicleNumber}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Vehicle Type</div>
                    <div className="font-medium">
                      {selectedBreakdown.vehicleType || "-"}
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <h4 className="text-lg font-semibold">Emergency</h4>
                  <div>
                    <div className="text-sm text-gray-600">Type</div>
                    <div className="font-medium">
                      {selectedBreakdown.emergencyType}
                    </div>
                  </div>
                  {selectedBreakdown.problemDescription && (
                    <div>
                      <div className="text-sm text-gray-600">Problem</div>
                      <div className="font-medium">
                        {selectedBreakdown.problemDescription}
                      </div>
                    </div>
                  )}
                  {selectedBreakdown.additionalInfo && (
                    <div>
                      <div className="text-sm text-gray-600">
                        Additional Info
                      </div>
                      <div className="font-medium">
                        {selectedBreakdown.additionalInfo}
                      </div>
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  <h4 className="text-lg font-semibold">Location</h4>
                  <div>
                    <div className="text-sm text-gray-600">Coordinates</div>
                    <div className="font-medium">
                      {selectedBreakdown.latitude},{" "}
                      {selectedBreakdown.longitude}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Requested At</div>
                    <div className="font-medium">
                      {selectedBreakdown.createdAt
                        ? new Date(selectedBreakdown.createdAt).toLocaleString()
                        : "-"}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Status</div>
                    <div className="font-medium">
                      {selectedBreakdown.status}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setShowBreakdownDetails(false)}
                className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Staff Registration Modal */}
      {showStaffForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-gray-900">
                  Add New Staff Member
                </h3>
                <button
                  onClick={() => setShowStaffForm(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>

            <form onSubmit={handleStaffSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-900">Basic Information</h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={staffForm.name}
                      onChange={(e) => handleStaffFormChange('name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      placeholder="Enter full name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={staffForm.email}
                      onChange={(e) => handleStaffFormChange('email', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      placeholder="Enter email address"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Role *
                    </label>
                    <select
                      required
                      value={staffForm.role}
                      onChange={(e) => handleStaffFormChange('role', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    >
                      <option value="">Select a role</option>
                      <option value="receptionist">Receptionist</option>
                      <option value="service_advisor">Service Advisor</option>
                      <option value="mechanic">Mechanic</option>
                    </select>
                    {staffForm.role && (staffForm.role === 'receptionist' || staffForm.role === 'service_advisor') && (
                      <div className="mt-2">
                        {roleAvailability[staffForm.role] === false ? (
                          <p className="text-red-600 text-sm">
                            ⚠️ {staffForm.role.replace('_', ' ')} role is already taken
                          </p>
                        ) : roleAvailability[staffForm.role] === true ? (
                          <p className="text-green-600 text-sm">
                            ✓ {staffForm.role.replace('_', ' ')} role is available
                          </p>
                        ) : (
                          <p className="text-gray-500 text-sm">Checking availability...</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Mechanic Details */}
                {staffForm.role === 'mechanic' && (
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-900">Mechanic Details</h4>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Specialization
                      </label>
                      <input
                        type="text"
                        value={staffForm.mechanicDetails.specialization}
                        onChange={(e) => handleMechanicDetailsChange('specialization', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        placeholder="e.g., Engine Specialist, Electrical Systems"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Experience (Years)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={staffForm.mechanicDetails.experienceYears}
                        onChange={(e) => handleMechanicDetailsChange('experienceYears', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Certifications
                      </label>
                      <input
                        type="text"
                        value={staffForm.mechanicDetails.certifications}
                        onChange={(e) => handleMechanicDetailsChange('certifications', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        placeholder="e.g., ASE Certified, Auto Electrician"
                      />
                    </div>


                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Hourly Rate (Rs.)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={staffForm.mechanicDetails.hourlyRate}
                        onChange={(e) => handleMechanicDetailsChange('hourlyRate', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">
                      Auto-Generated Password
                    </h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <p>A secure password will be automatically generated for the new staff member. Make sure to save and share it with them.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowStaffForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                >
                  Create Staff Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagementDashboard;
