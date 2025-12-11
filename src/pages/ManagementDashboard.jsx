import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import toast from "react-hot-toast";
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
  Plus,
  Package,
  Upload,
  Edit,
  Trash2,
  Search,
} from "lucide-react";
import {
  bookingsAPI,
  staffAPI,
  customerAPI,
  invoiceAPI,
  breakdownAPI,
  sparePartsAPI,
  servicesAPI,
} from "../utils/api";
import {
  fetchEshopItems,
  addEshopItem,
  updateEshopItem,
  deleteEshopItem,
} from "../utils/eshopApi";

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
  const [bookingSearchQuery, setBookingSearchQuery] = useState("");
  // Breakdown requests state
  const [breakdownRequests, setBreakdownRequests] = useState([]);
  const [loadingBreakdowns, setLoadingBreakdowns] = useState(false);
  const [selectedBreakdown, setSelectedBreakdown] = useState(null);
  const [showBreakdownDetails, setShowBreakdownDetails] = useState(false);
  const [lastUpdatedBreakdowns, setLastUpdatedBreakdowns] = useState(null);
  const [breakdownSearchQuery, setBreakdownSearchQuery] = useState("");

  // Staff management state
  const [staff, setStaff] = useState([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [showStaffForm, setShowStaffForm] = useState(false);
  const [staffForm, setStaffForm] = useState({
    name: "",
    email: "",
    role: "",
    mechanicDetails: {
      specialization: "",
      experienceYears: 0,
      certifications: "",
      hourlyRate: 0,
    },
  });
  const [roleAvailability, setRoleAvailability] = useState({});

  // E-shop management state
  const [eShopItems, setEShopItems] = useState([]);
  const [showEShopForm, setShowEShopForm] = useState(false);
  const [editingEShopItemId, setEditingEShopItemId] = useState(null);
  const [eShopForm, setEShopForm] = useState({
    name: "",
    description: "",
    itemCode: "",
    quantity: 0,
    price: 0,
    discount: 0,
    image: null,
    brand: "",
    type: "",
  });

  // Services management state
  const [services, setServices] = useState([]);
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState(null);
  const [serviceForm, setServiceForm] = useState({
    name: "",
    charge: 0,
    discount: 0,
  });

  // Spare parts management state
  const [spareParts, setSpareParts] = useState([]);
  const [showAddSparePartModal, setShowAddSparePartModal] = useState(false);
  const [editingSparePartId, setEditingSparePartId] = useState(null);
  const [sparePartForm, setSparePartForm] = useState({
    partName: "",
    partCode: "",
    description: "",
    price: "",
    quantity: "",
    brand: "Any",
    category: "Engine",
  });

  // Customer management state
  const [customers, setCustomers] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [customerSearchQuery, setCustomerSearchQuery] = useState("");

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

  // Load e-shop items when the tab is active
  useEffect(() => {
    const loadEShopItems = async () => {
      if (activeTab === "e-shop") {
        try {
          const response = await fetchEshopItems();
          setEShopItems(response || []);
        } catch (err) {
          console.error("Error loading e-shop items:", err);
          setError("Failed to load e-shop items");
        }
      }
    };

    loadEShopItems();
  }, [activeTab]);

  // Load spare parts when the tab is active
  useEffect(() => {
    const loadSpareParts = async () => {
      if (activeTab === "spare-parts") {
        try {
          const response = await sparePartsAPI.getAllSpareParts();
          // The API returns { success: true, data: [...] }
          setSpareParts(response.data.data || []);
        } catch (err) {
          console.error("Error loading spare parts:", err);
          setError("Failed to load spare parts");
        }
      }
    };

    loadSpareParts();
  }, [activeTab]);

  // Load services when the tab is active
  useEffect(() => {
    const loadServices = async () => {
      if (activeTab === "services") {
        try {
          const response = await servicesAPI.getAll();
          setServices(response.data || []);
        } catch (err) {
          console.error("Error loading services:", err);
          setError("Failed to load services");
        }
      }
    };

    loadServices();
  }, [activeTab]);

  // Load customers when the tab is active
  useEffect(() => {
    const loadCustomers = async () => {
      if (activeTab === "customers") {
        setLoadingCustomers(true);
        try {
          const response = await customerAPI.getAll();
          setCustomers(response.data || []);
        } catch (err) {
          console.error("Error loading customers:", err);
          setError("Failed to load customers");
        } finally {
          setLoadingCustomers(false);
        }
      }
    };

    loadCustomers();
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

  const generateBreakdownInvoice = async (request) => {
    try {
      // Load the existing PDF
      const existingPdfBytes = await fetch(
        "/references/invoice-breakdown_request.pdf"
      ).then((res) => res.arrayBuffer());

      // Load a PDFDocument from the existing PDF bytes
      const pdfDoc = await PDFDocument.load(existingPdfBytes);

      // Embed the Helvetica font
      const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

      // Get the first page of the document
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];

      // Define a helper to draw text
      // Note: PDF coordinates start from bottom-left.
      const drawText = (text, x, y, size = 10) => {
        firstPage.drawText(String(text || ""), {
          x,
          y,
          size,
          font: helveticaFont,
          color: rgb(0, 0, 0),
        });
      };

      // Coordinates configuration
      const leftColX = 150;
      const rightColX = 420;
      const topSectionY = 662;
      const topRowHeight = 25;
      const midSectionY = 508;
      const midRowHeight = 25;

      // --- Customer Details (Top Left) ---
      drawText(
        request.linkedCustomerName || request.contactName || "-",
        leftColX,
        topSectionY
      ); // Customer Name
      drawText(
        request.customerId ? String(request.customerId) : "NULL",
        leftColX,
        topSectionY - topRowHeight
      ); // Customer No.
      drawText(
        request.linkedCustomerPhone || request.contactPhone || "-",
        leftColX,
        topSectionY - topRowHeight * 2
      ); // Contact No.

      // --- Invoice Details (Top Right) ---
      drawText(`INV-${request.requestId}`, rightColX, topSectionY); // Invoice No.
      drawText(
        new Date().toLocaleDateString(),
        rightColX,
        topSectionY - topRowHeight
      ); // Date

      // --- Vehicle Details (Middle Left) ---
      drawText(
        request.linkedVehicleNumber || request.vehicleNumber || "-",
        leftColX,
        midSectionY
      ); // Vehicle No.
      drawText(
        request.linkedVehicleType || request.vehicleType || "-",
        leftColX,
        midSectionY - midRowHeight
      ); // Type
      drawText(
        `${request.latitude}, ${request.longitude}`,
        leftColX,
        midSectionY - midRowHeight * 2,
        8
      ); // Location (smaller font)

      // --- Breakdown Request Details (Middle Right) ---
      drawText(String(request.requestId), rightColX, midSectionY); // Request ID
      drawText(
        request.createdAt ? new Date(request.createdAt).toLocaleString() : "-",
        rightColX,
        midSectionY - midRowHeight,
        8
      ); // Date/Time (smaller font)
      drawText(
        request.emergencyType || "-",
        rightColX,
        midSectionY - midRowHeight * 2
      ); // Emergency
      // drawText("", rightColX, midSectionY - midRowHeight * 3); // Distance (km) - left blank

      // --- Service / Parts Used Table (Bottom) ---
      const tableRowY = 375; // Adjusted Y (moved down slightly)
      const col1X = 40; // Service/Parts Used
      const col2X = 280; // Unit Price (moved left)
      const col3X = 390; // QTY (moved left)
      const col4X = 490; // Gross Amount (moved left)

      // Use the price stored in the request
      let price = parseFloat(request.price);
      if (isNaN(price)) {
        price = 0;
      }

      const qty = 1;
      const grossAmount = price * qty;

      drawText("Breakdown Request", col1X, tableRowY);
      drawText(price.toFixed(2), col2X, tableRowY);
      drawText(String(qty), col3X, tableRowY);
      drawText(grossAmount.toFixed(2), col4X, tableRowY);

      // --- Total Invoice Value ---
      const totalY = 340; // Adjusted Y (moved down slightly)
      const totalX = 490; // Aligned with Gross Amount column
      drawText(grossAmount.toFixed(2), totalX, totalY);

      // Serialize the PDFDocument to bytes (a Uint8Array)
      const pdfBytes = await pdfDoc.save();

      // Trigger the browser to download the PDF document
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = `Invoice_Breakdown_${request.requestId}.pdf`;
      link.click();

      toast.success("Invoice generated successfully");
    } catch (error) {
      console.error("Error generating invoice:", error);
      toast.error(`Failed to generate invoice: ${error.message}`);
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
      setRoleAvailability((prev) => ({
        ...prev,
        [role]: response.data.isAvailable,
      }));
      return response.data.isAvailable;
    } catch (err) {
      console.error("Failed to check role availability:", err);
      return false;
    }
  };

  // Handle staff form input changes
  const handleStaffFormChange = async (field, value) => {
    setStaffForm((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Check role availability when role changes
    if (
      field === "role" &&
      (value === "receptionist" || value === "service_advisor")
    ) {
      await checkRoleAvailability(value);
    }
  };

  // Handle mechanic details changes
  const handleMechanicDetailsChange = (field, value) => {
    setStaffForm((prev) => ({
      ...prev,
      mechanicDetails: {
        ...prev.mechanicDetails,
        [field]: value,
      },
    }));
  };

  // Handle e-shop form input changes
  const handleEShopFormChange = (field, value) => {
    setEShopForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle image upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setEShopForm((prev) => ({
        ...prev,
        image: file,
      }));
    }
  };

  // Handle service form input changes
  const handleServiceFormChange = (field, value) => {
    setServiceForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Submit service
  const handleServiceSubmit = async (e) => {
    e.preventDefault();

    try {
      const serviceData = {
        name: serviceForm.name,
        charge: parseFloat(serviceForm.charge),
        discount: parseFloat(serviceForm.discount),
      };

      if (editingServiceId) {
        // Update existing service
        await servicesAPI.update(editingServiceId, serviceData);
        // Refresh list
        const response = await servicesAPI.getAll();
        setServices(response.data || []);
      } else {
        // Create new service
        await servicesAPI.create(serviceData);
        // Refresh list
        const response = await servicesAPI.getAll();
        setServices(response.data || []);
      }

      // Reset form
      setServiceForm({
        name: "",
        charge: 0,
        discount: 0,
      });

      // Reset editing state
      setEditingServiceId(null);

      // Close modal
      setShowServiceForm(false);
    } catch (err) {
      console.error("Error saving service:", err);
      setError("Failed to save service");
    }
  };

  // Handle edit service
  const handleEditService = (service) => {
    setServiceForm({
      name: service.name,
      charge: service.charge,
      discount: service.discount,
    });
    setShowServiceForm(true);
    // Store the service ID for editing
    setEditingServiceId(service.id);
  };

  // Handle delete service
  const handleDeleteService = async (serviceId) => {
    if (window.confirm("Are you sure you want to delete this service?")) {
      try {
        await servicesAPI.delete(serviceId);
        // Refresh list
        const response = await servicesAPI.getAll();
        setServices(response.data || []);
      } catch (err) {
        console.error("Error deleting service:", err);
        setError("Failed to delete service");
      }
    }
  };

  // Submit e-shop item
  const handleEShopSubmit = async (e) => {
    e.preventDefault();

    try {
      setError(null);
      const itemData = {
        itemCode: eShopForm.itemCode,
        itemName: eShopForm.name,
        description: eShopForm.description,
        price: parseFloat(eShopForm.price),
        quantity: parseInt(eShopForm.quantity),
        discountPercentage: parseFloat(eShopForm.discount) || 0,
        itemImage: eShopForm.image,
        itemBrand: eShopForm.brand,
        itemType: eShopForm.type,
      };

      if (editingEShopItemId) {
        // Update existing item
        await updateEshopItem(editingEShopItemId, itemData);
        // Refresh the list
        const response = await fetchEshopItems();
        setEShopItems(response || []);
      } else {
        // Create new item
        await addEshopItem(itemData);
        // Refresh the list
        const response = await fetchEshopItems();
        setEShopItems(response || []);
      }

      // Reset form
      setEShopForm({
        name: "",
        description: "",
        itemCode: "",
        quantity: 0,
        price: 0,
        discount: 0,
        image: null,
        brand: "",
        type: "",
      });

      // Reset editing state
      setEditingEShopItemId(null);

      // Close modal
      setShowEShopForm(false);
    } catch (err) {
      console.error("Error submitting e-shop item:", err);
      setError(err.response?.data?.message || "Failed to save e-shop item");
    }
  };

  // Handle image removal for e-shop
  const handleImageRemove = () => {
    setEShopForm((prev) => ({
      ...prev,
      image: null,
    }));
    // Reset the file input
    const fileInput = document.getElementById("item-image");
    if (fileInput) {
      fileInput.value = "";
    }
  };

  // Handle edit e-shop item
  const handleEditEShopItem = (item) => {
    setEShopForm({
      name: item.itemName,
      description: item.description,
      itemCode: item.itemCode || "",
      quantity: item.quantity,
      price: item.price,
      discount: item.discountPercentage,
      image: item.itemImage,
      brand: item.itemBrand,
      type: item.itemType,
    });
    setShowEShopForm(true);
    setEditingEShopItemId(item.itemId);
  };

  // Handle delete e-shop item
  const handleDeleteEShopItem = async (itemId) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      try {
        await deleteEshopItem(itemId);
        // Refresh the list
        const response = await fetchEshopItems();
        setEShopItems(response || []);
      } catch (err) {
        console.error("Error deleting e-shop item:", err);
        setError("Failed to delete e-shop item");
      }
    }
  };

  // Submit staff registration
  const handleStaffSubmit = async (e) => {
    e.preventDefault();

    try {
      setError(null);

      // Check role availability for restricted roles
      if (
        staffForm.role === "receptionist" ||
        staffForm.role === "service_advisor"
      ) {
        const isAvailable = await checkRoleAvailability(staffForm.role);
        if (!isAvailable) {
          setError(
            `${staffForm.role} role is already taken. Only one ${staffForm.role} is allowed.`
          );
          return;
        }
      }

      const staffData = {
        name: staffForm.name,
        email: staffForm.email,
        role: staffForm.role,
      };

      // Add mechanic details if role is mechanic
      if (staffForm.role === "mechanic") {
        staffData.mechanicDetails = staffForm.mechanicDetails;
      }

      const response = await staffAPI.register(staffData);

      // Show success message with auto-generated password
      alert(
        `Staff member created successfully!\n\nAuto-generated password: ${response.data.autoPassword}\n\nPlease save this password and share it with the staff member.`
      );

      // Reset form and close modal
      setStaffForm({
        name: "",
        email: "",
        role: "",
        mechanicDetails: {
          specialization: "",
          experienceYears: 0,
          certifications: "",
          hourlyRate: 0,
        },
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

  // Handle add/edit spare part
  const handleAddSparePart = async (e) => {
    e.preventDefault();

    try {
      setError(null);
      const sparePartData = {
        partCode: sparePartForm.partCode,
        partName: sparePartForm.partName,
        brand: sparePartForm.brand,
        description: sparePartForm.description,
        category: sparePartForm.category,
        unitPrice: parseFloat(sparePartForm.price),
        stockQuantity: parseInt(sparePartForm.quantity) || 0,
      };

      if (editingSparePartId) {
        // Update existing spare part
        await sparePartsAPI.updateSparePart(editingSparePartId, sparePartData);
      } else {
        // Create new spare part
        await sparePartsAPI.createSparePart(sparePartData);
      }

      // Refresh the spare parts list
      const response = await sparePartsAPI.getAllSpareParts();
      setSpareParts(response.data.data || []);

      // Reset form
      setSparePartForm({
        partName: "",
        partCode: "",
        description: "",
        price: "",
        quantity: "",
        brand: "Any",
        category: "Engine",
      });

      // Reset editing state
      setEditingSparePartId(null);

      // Close modal
      setShowAddSparePartModal(false);
    } catch (err) {
      console.error("Error saving spare part:", err);
      setError(err.response?.data?.message || "Failed to save spare part");
    }
  };

  // Handle edit spare part
  const handleEditSparePart = (part) => {
    setSparePartForm({
      partName: part.partName,
      partCode: part.partCode,
      description: part.description,
      price: part.unitPrice?.toString() || part.price?.toString() || "",
      quantity:
        part.stockQuantity?.toString() || part.quantity?.toString() || "",
      brand: part.brand || "Any",
      category: part.category,
    });
    setShowAddSparePartModal(true);
    setEditingSparePartId(part.partId || part.id);
  };

  // Handle delete spare part
  const handleDeleteSparePart = async (partId) => {
    if (window.confirm("Are you sure you want to delete this spare part?")) {
      try {
        await sparePartsAPI.deleteSparePart(partId);
        // Refresh the spare parts list
        const response = await sparePartsAPI.getAllSpareParts();
        setSpareParts(response.data.data || []);
      } catch (err) {
        console.error("Error deleting spare part:", err);
        setError("Failed to delete spare part");
      }
    }
  };

  // Generate invoice for booking
  const generateInvoice = async (booking) => {
    try {
      // Prevent generating invoice if booking is not verified
      if (booking?.status !== "verified") {
        setError(
          "Invoice can be generated only after jobcard approval (booking verified)."
        );
        return;
      }

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
    { id: "services", label: "Services" },
    { id: "spare-parts", label: "Spare Parts" },
    { id: "e-shop", label: "E-shop" },
  ];

  const normalizedBookingSearch = bookingSearchQuery.trim().toLowerCase();
  const hasBookingSearch = normalizedBookingSearch.length > 0;
  const noBookings = bookings.length === 0;
  const filteredBookings = bookings.filter((booking) => {
    if (!normalizedBookingSearch) return true;
    return (booking.vehicleNumber || "")
      .toLowerCase()
      .includes(normalizedBookingSearch);
  });

  const normalizedBreakdownSearch = breakdownSearchQuery.trim().toLowerCase();
  const noBreakdownRequests = breakdownRequests.length === 0;
  const filteredBreakdownRequests = breakdownRequests.filter((request) => {
    if (!normalizedBreakdownSearch) return true;
    return (request.vehicleNumber || "")
      .toLowerCase()
      .includes(normalizedBreakdownSearch);
  });

  const normalizedCustomerSearch = customerSearchQuery.trim().toLowerCase();
  const noCustomers = customers.length === 0;
  const filteredCustomers = customers.filter((customer) => {
    if (!normalizedCustomerSearch) return true;
    const searchFields = [
      customer.name || "",
      customer.email || "",
      customer.phone || "",
      customer.address || "",
    ];
    return searchFields.some((field) =>
      field.toLowerCase().includes(normalizedCustomerSearch)
    );
  });

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
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-6 overflow-hidden">
          <div className="flex border-b border-gray-200 overflow-x-auto">
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
                {/* Header */}
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      Customer Management
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      View and manage all registered customers
                    </p>
                  </div>
                  <div className="flex flex-col gap-3 w-full lg:w-auto">
                    <span className="text-sm text-gray-600">
                      Showing {filteredCustomers.length} of {customers.length}{" "}
                      customers
                    </span>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="relative w-full sm:w-64">
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          value={customerSearchQuery}
                          onChange={(e) =>
                            setCustomerSearchQuery(e.target.value)
                          }
                          placeholder="Search by name, email, phone, or address"
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
                          aria-label="Search customers"
                        />
                      </div>
                      {customerSearchQuery && (
                        <button
                          type="button"
                          onClick={() => setCustomerSearchQuery("")}
                          className="text-sm text-red-600 hover:text-red-700 font-medium"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {loadingCustomers && noCustomers ? (
                  <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                    <p className="text-gray-600 mt-4">Loading customers...</p>
                  </div>
                ) : noCustomers ? (
                  <div className="text-center py-12">
                    <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No customers found</p>
                  </div>
                ) : filteredCustomers.length === 0 ? (
                  <div className="text-center py-12">
                    <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">
                      No customers found for{" "}
                      <span className="font-semibold text-gray-900">
                        {customerSearchQuery}
                      </span>
                    </p>
                    <button
                      type="button"
                      onClick={() => setCustomerSearchQuery("")}
                      className="mt-4 inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded transition-colors"
                    >
                      Clear search
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border-collapse">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider border-b-2 border-gray-200">
                            CUSTOMER ID
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider border-b-2 border-gray-200">
                            NAME
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider border-b-2 border-gray-200">
                            EMAIL
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider border-b-2 border-gray-200">
                            PHONE
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider border-b-2 border-gray-200">
                            ADDRESS
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider border-b-2 border-gray-200">
                            VEHICLE NUMBER
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider border-b-2 border-gray-200">
                            REGISTERED DATE
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white">
                        {filteredCustomers.map((customer, index) => (
                          <tr
                            key={customer.customerId}
                            className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${
                              index % 2 === 0 ? "bg-white" : "bg-gray-50"
                            }`}
                          >
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              #{customer.customerId}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {customer.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {customer.email}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {customer.phone}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {customer.address || (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {customer.vehicleNumbers || (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {customer.createdAt
                                ? new Date(
                                    customer.createdAt
                                  ).toLocaleDateString("en-US", {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                  })
                                : "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
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
                                {member.role.replace("_", " ").toUpperCase()}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              {member.role === "mechanic" &&
                              member.mechanicId ? (
                                <div className="text-sm">
                                  <div className="font-medium text-gray-900">
                                    {member.mechanicCode} -{" "}
                                    {member.specialization}
                                  </div>
                                  <div className="text-gray-600">
                                    {member.experienceYears} years exp • Rs.{" "}
                                    {member.hourlyRate}/hr
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
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-6">
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
                  <div className="flex flex-col gap-3 w-full lg:w-auto">
                    <span className="text-sm text-gray-600">
                      Showing {filteredBookings.length} of {bookings.length}{" "}
                      bookings
                    </span>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="relative w-full sm:w-64">
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          value={bookingSearchQuery}
                          onChange={(e) =>
                            setBookingSearchQuery(e.target.value)
                          }
                          placeholder="Search by vehicle number"
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
                          aria-label="Search bookings by vehicle number"
                        />
                      </div>
                      {bookingSearchQuery && (
                        <button
                          type="button"
                          onClick={() => setBookingSearchQuery("")}
                          className="text-sm text-red-600 hover:text-red-700 font-medium"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {loadingBookings && noBookings ? (
                  <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                    <p className="text-gray-600 mt-4">Loading bookings...</p>
                  </div>
                ) : noBookings ? (
                  <div className="text-center py-12">
                    <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No bookings found</p>
                  </div>
                ) : filteredBookings.length === 0 ? (
                  <div className="text-center py-12">
                    <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">
                      No bookings found for vehicle number{" "}
                      <span className="font-semibold text-gray-900">
                        {bookingSearchQuery}
                      </span>
                    </p>
                    <button
                      type="button"
                      onClick={() => setBookingSearchQuery("")}
                      className="mt-4 inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded transition-colors"
                    >
                      Clear search
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border-collapse">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider border-b-2 border-gray-200">
                            DATE & TIME
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
                        {filteredBookings.map((booking, index) => (
                          <tr
                            key={booking.bookingId}
                            className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${
                              index % 2 === 0 ? "bg-white" : "bg-gray-50"
                            }`}
                          >
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <div className="flex flex-col">
                                <span className="font-medium text-gray-900">
                                  {new Date(
                                    booking.bookingDate
                                  ).toLocaleDateString("en-US", {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                  })}
                                </span>
                                <span className="text-gray-600 text-xs">
                                  {booking.timeSlot}
                                </span>
                              </div>
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
                                disabled={booking.status !== "verified"}
                                title={
                                  booking.status !== "verified"
                                    ? "Available after jobcard approval (verified)."
                                    : "Download invoice"
                                }
                                className={`px-4 py-2 text-white text-sm font-medium rounded transition-colors flex items-center gap-2 ${
                                  booking.status !== "verified"
                                    ? "bg-gray-400 cursor-not-allowed"
                                    : "bg-green-600 hover:bg-green-700"
                                }`}
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
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-6">
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
                  <div className="flex flex-col gap-3 w-full lg:w-auto">
                    <span className="text-sm text-gray-600">
                      Showing {filteredBreakdownRequests.length} of{" "}
                      {breakdownRequests.length} requests
                    </span>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="relative w-full sm:w-64">
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          value={breakdownSearchQuery}
                          onChange={(e) =>
                            setBreakdownSearchQuery(e.target.value)
                          }
                          placeholder="Search by vehicle number"
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
                          aria-label="Search breakdown requests by vehicle number"
                        />
                      </div>
                      {breakdownSearchQuery && (
                        <button
                          type="button"
                          onClick={() => setBreakdownSearchQuery("")}
                          className="text-sm text-red-600 hover:text-red-700 font-medium"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {loadingBreakdowns && noBreakdownRequests ? (
                  <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                    <p className="text-gray-600 mt-4">
                      Loading breakdown requests...
                    </p>
                  </div>
                ) : noBreakdownRequests ? (
                  <div className="text-center py-12">
                    <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No breakdown requests found</p>
                  </div>
                ) : filteredBreakdownRequests.length === 0 ? (
                  <div className="text-center py-12">
                    <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">
                      No breakdown requests found for vehicle number{" "}
                      <span className="font-semibold text-gray-900">
                        {breakdownSearchQuery}
                      </span>
                    </p>
                    <button
                      type="button"
                      onClick={() => setBreakdownSearchQuery("")}
                      className="mt-4 inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded transition-colors"
                    >
                      Clear search
                    </button>
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
                            PRICE (LKR)
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
                        {filteredBreakdownRequests.map((req, idx) => (
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
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                              {req.price
                                ? parseFloat(req.price).toLocaleString(
                                    "en-LK",
                                    {
                                      style: "currency",
                                      currency: "LKR",
                                    }
                                  )
                                : "5,000.00"}
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
                                {req.status === "Pending" && (
                                  <>
                                    <button
                                      onClick={() =>
                                        updateBreakdownStatus(
                                          req.requestId,
                                          "Approved"
                                        )
                                      }
                                      className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded"
                                    >
                                      Approve
                                    </button>
                                    <button
                                      onClick={() =>
                                        updateBreakdownStatus(
                                          req.requestId,
                                          "Cancelled"
                                        )
                                      }
                                      className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded"
                                    >
                                      Reject
                                    </button>
                                  </>
                                )}
                                {req.status === "Approved" && (
                                  <button
                                    onClick={() =>
                                      updateBreakdownStatus(
                                        req.requestId,
                                        "In Progress"
                                      )
                                    }
                                    className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium rounded"
                                  >
                                    Start Work
                                  </button>
                                )}
                                {req.status === "In Progress" && (
                                  <button
                                    onClick={() =>
                                      updateBreakdownStatus(
                                        req.requestId,
                                        "Completed"
                                      )
                                    }
                                    className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded"
                                  >
                                    Complete
                                  </button>
                                )}
                                {req.status === "Completed" && (
                                  <button
                                    onClick={() =>
                                      generateBreakdownInvoice(req)
                                    }
                                    className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded"
                                  >
                                    Invoice
                                  </button>
                                )}
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

            {activeTab === "services" && (
              <div>
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      Services Management
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Manage your service offerings and pricing
                    </p>
                  </div>
                  <button
                    onClick={() => setShowServiceForm(true)}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add New Service
                  </button>
                </div>

                {services.length === 0 ? (
                  <div className="text-center py-12">
                    <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No services added yet</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Click "Add New Service" to get started
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border-collapse">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider border-b-2 border-gray-200">
                            SERVICE NAME
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider border-b-2 border-gray-200">
                            SERVICE CHARGE
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider border-b-2 border-gray-200">
                            DISCOUNT
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider border-b-2 border-gray-200">
                            FINAL PRICE
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider border-b-2 border-gray-200">
                            ACTIONS
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white">
                        {services.map((service, index) => {
                          const finalPrice =
                            service.charge -
                            (service.charge * service.discount) / 100;
                          return (
                            <tr
                              key={service.id}
                              className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${
                                index % 2 === 0 ? "bg-white" : "bg-gray-50"
                              }`}
                            >
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {service.name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                Rs. {service.charge.toLocaleString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {service.discount > 0
                                  ? `${service.discount}%`
                                  : "-"}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                                Rs. {finalPrice.toLocaleString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => handleEditService(service)}
                                    className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                                    title="Edit service"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleDeleteService(service.id)
                                    }
                                    className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                                    title="Delete service"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === "spare-parts" && (
              <div>
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      Spare Parts Management
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Manage your spare parts inventory and pricing
                    </p>
                  </div>
                  <button
                    onClick={() => setShowAddSparePartModal(true)}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add New Spare Part
                  </button>
                </div>

                {spareParts.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No spare parts added yet</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Click "Add New Spare Part" to get started
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border-collapse">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider border-b-2 border-gray-200">
                            PART CODE
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider border-b-2 border-gray-200">
                            PART NAME
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider border-b-2 border-gray-200">
                            BRAND
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider border-b-2 border-gray-200">
                            CATEGORY
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider border-b-2 border-gray-200">
                            QUANTITY
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider border-b-2 border-gray-200">
                            PRICE
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider border-b-2 border-gray-200">
                            ACTIONS
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white">
                        {spareParts.map((part, index) => (
                          <tr
                            key={part.partId || index}
                            className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${
                              index % 2 === 0 ? "bg-white" : "bg-gray-50"
                            }`}
                          >
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {part.partCode}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {part.partName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {part.brand || "Any"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {part.category}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {part.stockQuantity || 0}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                              Rs.{" "}
                              {part.unitPrice?.toLocaleString() ||
                                part.price?.toLocaleString() ||
                                "0"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleEditSparePart(part)}
                                  className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                                  title="Edit spare part"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() =>
                                    handleDeleteSparePart(
                                      part.partId || part.id
                                    )
                                  }
                                  className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                                  title="Delete spare part"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
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
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      E-Shop Management
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Manage your online store inventory
                    </p>
                  </div>
                  <button
                    onClick={() => setShowEShopForm(true)}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add New Item
                  </button>
                </div>

                {eShopItems.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No items in your e-shop yet</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Click "Add New Item" to get started
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border-collapse">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider border-b-2 border-gray-200">
                            ITEM CODE
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider border-b-2 border-gray-200">
                            ITEM NAME
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider border-b-2 border-gray-200">
                            QUANTITY
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider border-b-2 border-gray-200">
                            PRICE
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider border-b-2 border-gray-200">
                            BRAND
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider border-b-2 border-gray-200">
                            TYPE
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider border-b-2 border-gray-200">
                            DISCOUNT
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider border-b-2 border-gray-200">
                            FINAL PRICE
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider border-b-2 border-gray-200">
                            ACTIONS
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white">
                        {eShopItems.map((item, index) => (
                          <tr
                            key={item.itemId}
                            className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${
                              index % 2 === 0 ? "bg-white" : "bg-gray-50"
                            }`}
                          >
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {item.itemCode || "-"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {item.itemName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {item.quantity}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              Rs. {item.price.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {item.itemBrand}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {item.itemType}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {item.discountPercentage > 0
                                ? `${item.discountPercentage}%`
                                : "-"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                              Rs.{" "}
                              {(
                                item.price -
                                (item.price * item.discountPercentage) / 100
                              ).toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleEditEShopItem(item)}
                                  className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                                  title="Edit item"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() =>
                                    handleDeleteEShopItem(item.itemId)
                                  }
                                  className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                                  title="Delete item"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
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
                    <div>
                      <label className="text-sm font-medium text-gray-600">
                        Odometer
                      </label>
                      <p className="text-gray-900">
                        {selectedBooking.kilometersRun + " km"}
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
                  <h4 className="text-lg font-semibold text-gray-900">
                    Basic Information
                  </h4>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={staffForm.name}
                      onChange={(e) =>
                        handleStaffFormChange("name", e.target.value)
                      }
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
                      onChange={(e) =>
                        handleStaffFormChange("email", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      placeholder="name@example.com"
                      title="Enter a valid email, e.g., name@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Role *
                    </label>
                    <select
                      required
                      value={staffForm.role}
                      onChange={(e) =>
                        handleStaffFormChange("role", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    >
                      <option value="">Select a role</option>
                      <option value="receptionist">Receptionist</option>
                      <option value="service_advisor">Service Advisor</option>
                      <option value="mechanic">Mechanic</option>
                    </select>
                    {staffForm.role &&
                      (staffForm.role === "receptionist" ||
                        staffForm.role === "service_advisor") && (
                        <div className="mt-2">
                          {roleAvailability[staffForm.role] === false ? (
                            <p className="text-red-600 text-sm">
                              ⚠️ {staffForm.role.replace("_", " ")} role is
                              already taken
                            </p>
                          ) : roleAvailability[staffForm.role] === true ? (
                            <p className="text-green-600 text-sm">
                              ✓ {staffForm.role.replace("_", " ")} role is
                              available
                            </p>
                          ) : (
                            <p className="text-gray-500 text-sm">
                              Checking availability...
                            </p>
                          )}
                        </div>
                      )}
                  </div>
                </div>

                {/* Mechanic Details */}
                {staffForm.role === "mechanic" && (
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-900">
                      Mechanic Details
                    </h4>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Specialization
                      </label>
                      <input
                        type="text"
                        value={staffForm.mechanicDetails.specialization}
                        onChange={(e) =>
                          handleMechanicDetailsChange(
                            "specialization",
                            e.target.value
                          )
                        }
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
                        onChange={(e) =>
                          handleMechanicDetailsChange(
                            "experienceYears",
                            parseInt(e.target.value) || 0
                          )
                        }
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
                        onChange={(e) =>
                          handleMechanicDetailsChange(
                            "certifications",
                            e.target.value
                          )
                        }
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
                        onChange={(e) =>
                          handleMechanicDetailsChange(
                            "hourlyRate",
                            parseFloat(e.target.value) || 0
                          )
                        }
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
                    <svg
                      className="h-5 w-5 text-blue-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">
                      Auto-Generated Password
                    </h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <p>
                        A secure password will be automatically generated for
                        the new staff member. Make sure to save and share it
                        with them.
                      </p>
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

      {/* Service Form Modal */}
      {showServiceForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-gray-900">
                  {editingServiceId ? "Edit Service" : "Add New Service"}
                </h3>
                <button
                  onClick={() => {
                    setShowServiceForm(false);
                    setEditingServiceId(null);
                    setServiceForm({ name: "", charge: 0, discount: 0 });
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>

            <form onSubmit={handleServiceSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Service Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={serviceForm.name}
                    onChange={(e) =>
                      handleServiceFormChange("name", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="Enter service name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Service Charge (Rs.) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={serviceForm.charge}
                    onChange={(e) =>
                      handleServiceFormChange(
                        "charge",
                        parseFloat(e.target.value) || 0
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Discount (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={serviceForm.discount}
                    onChange={(e) =>
                      handleServiceFormChange(
                        "discount",
                        parseInt(e.target.value) || 0
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="0"
                  />
                </div>

                {/* Price Preview */}
                {serviceForm.charge > 0 && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">
                        Original Price:
                      </span>
                      <span className="text-sm text-gray-900">
                        Rs. {serviceForm.charge.toLocaleString()}
                      </span>
                    </div>
                    {serviceForm.discount > 0 && (
                      <>
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-sm font-medium text-gray-600">
                            Discount ({serviceForm.discount}%):
                          </span>
                          <span className="text-sm text-red-600">
                            -Rs.{" "}
                            {(
                              (serviceForm.charge * serviceForm.discount) /
                              100
                            ).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-200">
                          <span className="font-medium text-gray-900">
                            Final Price:
                          </span>
                          <span className="font-bold text-green-600">
                            Rs.{" "}
                            {(
                              serviceForm.charge -
                              (serviceForm.charge * serviceForm.discount) / 100
                            ).toLocaleString()}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowServiceForm(false);
                    setEditingServiceId(null);
                    setServiceForm({ name: "", charge: 0, discount: 0 });
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  {editingServiceId ? "Update Service" : "Create Service"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* E-Shop Item Form Modal */}
      {showEShopForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-gray-900">
                  {editingEShopItemId ? "Edit Item" : "Add New Item"}
                </h3>
                <button
                  onClick={() => {
                    setShowEShopForm(false);
                    setEditingEShopItemId(null);
                    setEShopForm({
                      name: "",
                      description: "",
                      itemCode: "",
                      quantity: 0,
                      price: 0,
                      discount: 0,
                      image: null,
                      brand: "",
                      type: "",
                    });
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>

            <form onSubmit={handleEShopSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-900">
                    Basic Information
                  </h4>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Item Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={eShopForm.name}
                      onChange={(e) =>
                        handleEShopFormChange("name", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      placeholder="Enter item name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Item Code *
                    </label>
                    <input
                      type="text"
                      required
                      value={eShopForm.itemCode}
                      onChange={(e) =>
                        handleEShopFormChange("itemCode", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      placeholder="Enter item code"
                      onInvalid={(e) =>
                        e.target.setCustomValidity("Please fill out this field")
                      }
                      onInput={(e) => e.target.setCustomValidity("")}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description *
                    </label>
                    <textarea
                      required
                      value={eShopForm.description}
                      onChange={(e) =>
                        handleEShopFormChange("description", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      placeholder="Enter item description"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quantity *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={eShopForm.quantity}
                      onChange={(e) =>
                        handleEShopFormChange(
                          "quantity",
                          parseInt(e.target.value) || 0
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      placeholder="1"
                      onInvalid={(e) =>
                        e.target.setCustomValidity(
                          "Please enter a quantity greater than 0"
                        )
                      }
                      onInput={(e) => e.target.setCustomValidity("")}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price (Rs.) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0.01"
                      step="0.01"
                      value={eShopForm.price}
                      onChange={(e) =>
                        handleEShopFormChange(
                          "price",
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      placeholder="0.01"
                      onInvalid={(e) =>
                        e.target.setCustomValidity(
                          "Please enter a price greater than 0"
                        )
                      }
                      onInput={(e) => e.target.setCustomValidity("")}
                    />
                  </div>
                </div>

                {/* Additional Information */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-900">
                    Additional Information
                  </h4>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Discount (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={eShopForm.discount}
                      onChange={(e) =>
                        handleEShopFormChange(
                          "discount",
                          parseInt(e.target.value) || 0
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Item Image
                    </label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
                      <div className="space-y-1 text-center">
                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="flex text-sm text-gray-600">
                          <label
                            htmlFor="item-image"
                            className="relative cursor-pointer bg-white rounded-md font-medium text-red-600 hover:text-red-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-red-500"
                          >
                            <span>Upload a file</span>
                            <input
                              id="item-image"
                              name="item-image"
                              type="file"
                              className="sr-only"
                              accept="image/*"
                              onChange={handleImageUpload}
                            />
                          </label>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-gray-500">
                          PNG, JPG, GIF up to 10MB
                        </p>
                      </div>
                    </div>
                    {eShopForm.image && (
                      <div className="mt-2 flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-3">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <svg
                              className="h-5 w-5 text-green-400"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-green-800">
                              {eShopForm.image.name}
                            </p>
                            <p className="text-xs text-green-600">
                              {(eShopForm.image.size / 1024 / 1024).toFixed(2)}{" "}
                              MB
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleImageRemove}
                          className="ml-3 text-red-600 hover:text-red-800 transition-colors"
                          title="Remove image"
                        >
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Brand *
                    </label>
                    <select
                      defaultValue=""
                      required
                      value={eShopForm.brand}
                      onChange={(e) =>
                        handleEShopFormChange("brand", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      onInvalid={(e) =>
                        e.target.setCustomValidity("Please fill out this field")
                      }
                      onInput={(e) => e.target.setCustomValidity("")}
                    >
                      <option value="" disabled hidden>
                        Select Brand
                      </option>
                      <option value="Toyota">Toyota</option>
                      <option value="Honda">Honda</option>
                      <option value="Suzuki">Suzuki</option>
                      <option value="Ford">Ford</option>
                      <option value="Mazda">Mazda</option>
                      <option value="Isuzu">Isuzu</option>
                      <option value="Subaru">Subaru</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Item Type *
                    </label>
                    <select
                      defaultValue=""
                      required
                      value={eShopForm.type}
                      onChange={(e) =>
                        handleEShopFormChange("type", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      onInvalid={(e) =>
                        e.target.setCustomValidity("Please fill out this field")
                      }
                      onInput={(e) => e.target.setCustomValidity("")}
                    >
                      <option value="" disabled hidden>
                        Select Type
                      </option>
                      <option value="Engine Parts">Engine Parts</option>
                      <option value="Brake Parts">Brake Parts</option>
                      <option value="Suspension">Suspension</option>
                      <option value="Electrical">Electrical</option>
                      <option value="Body Parts">Body Parts</option>
                      <option value="Filters">Filters</option>
                      <option value="Fluids">Fluids</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowEShopForm(false);
                    setEditingEShopItemId(null);
                    setEShopForm({
                      name: "",
                      description: "",
                      itemCode: "",
                      quantity: 0,
                      price: 0,
                      discount: 0,
                      image: null,
                      brand: "",
                      type: "",
                    });
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  {editingEShopItemId ? "Update Item" : "Create Item"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Spare Part Modal */}
      {showAddSparePartModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  {editingSparePartId
                    ? "Edit Spare Part"
                    : "Add New Spare Part"}
                </h3>
                <button
                  onClick={() => {
                    setShowAddSparePartModal(false);
                    setEditingSparePartId(null);
                    setSparePartForm({
                      partName: "",
                      partCode: "",
                      description: "",
                      price: "",
                      quantity: "",
                      brand: "Any",
                      category: "Engine",
                    });
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleAddSparePart} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Part Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Spare Part Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={sparePartForm.partName}
                      onChange={(e) =>
                        setSparePartForm({
                          ...sparePartForm,
                          partName: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter part name"
                    />
                  </div>

                  {/* Part Code */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Spare Part Code *
                    </label>
                    <input
                      type="text"
                      required
                      value={sparePartForm.partCode}
                      onChange={(e) =>
                        setSparePartForm({
                          ...sparePartForm,
                          partCode: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter part code"
                    />
                  </div>

                  {/* Brand */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Brand *
                    </label>
                    <select
                      required
                      value={sparePartForm.brand}
                      onChange={(e) =>
                        setSparePartForm({
                          ...sparePartForm,
                          brand: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="Any">Any</option>
                      <option value="Toyota">Toyota</option>
                      <option value="Honda">Honda</option>
                      <option value="Suzuki">Suzuki</option>
                      <option value="Ford">Ford</option>
                      <option value="Mazda">Mazda</option>
                      <option value="Isuzu">Isuzu</option>
                      <option value="Subaru">Subaru</option>
                    </select>
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category *
                    </label>
                    <select
                      required
                      value={sparePartForm.category}
                      onChange={(e) =>
                        setSparePartForm({
                          ...sparePartForm,
                          category: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="Engine">Engine</option>
                      <option value="Brakes">Brakes</option>
                      <option value="Suspension">Suspension</option>
                      <option value="Electrical">Electrical</option>
                      <option value="Body">Body</option>
                      <option value="Cooling">Cooling</option>
                      <option value="Transmission">Transmission</option>
                      <option value="Interior">Interior</option>
                      <option value="Exterior">Exterior</option>
                      <option value="Accessories">Accessories</option>
                    </select>
                  </div>

                  {/* Price */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price (Rs.) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={sparePartForm.price}
                      onChange={(e) =>
                        setSparePartForm({
                          ...sparePartForm,
                          price: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter price"
                    />
                  </div>

                  {/* Quantity */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quantity *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={sparePartForm.quantity}
                      onChange={(e) =>
                        setSparePartForm({
                          ...sparePartForm,
                          quantity: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter stock quantity"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={sparePartForm.description}
                    onChange={(e) =>
                      setSparePartForm({
                        ...sparePartForm,
                        description: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter part description"
                  />
                </div>

                {/* Form Actions */}
                <div className="flex justify-end space-x-3 pt-6 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddSparePartModal(false);
                      setEditingSparePartId(null);
                      setSparePartForm({
                        partName: "",
                        partCode: "",
                        description: "",
                        price: "",
                        quantity: "",
                        brand: "Any",
                        category: "Engine",
                      });
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                  >
                    {editingSparePartId
                      ? "Update Spare Part"
                      : "Create Spare Part"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagementDashboard;
