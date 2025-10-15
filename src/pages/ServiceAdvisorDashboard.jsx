import { useState, useEffect } from "react";
import {
  ClipboardCheck,
  UsersRound,
  Wrench,
  Eye,
  CheckCircle,
  Clipboard,
  Car,
  Phone,
  Clock,
  User,
  Package,
} from "lucide-react";
import { serviceAdvisorAPI, mechanicsAPI, sparePartsAPI } from "../utils/api";

const ServiceAdvisorDashboard = () => {
  const [activeTab, setActiveTab] = useState("assign-jobs");
  const [loading, setLoading] = useState(true);
  const [arrivedBookings, setArrivedBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showBookingDetails, setShowBookingDetails] = useState(false);
  const [showAssignMechanics, setShowAssignMechanics] = useState(false);
  const [showAssignSpareParts, setShowAssignSpareParts] = useState(false);
  const [availableMechanics, setAvailableMechanics] = useState([]);
  const [availableSpareParts, setAvailableSpareParts] = useState([]);
  const [selectedMechanics, setSelectedMechanics] = useState([]);
  const [selectedSpareParts, setSelectedSpareParts] = useState([]);
  const [submittedBookings, setSubmittedBookings] = useState([]);
  const [mechanicSearchTerm, setMechanicSearchTerm] = useState("");
  const [mechanicSpecializationFilter, setMechanicSpecializationFilter] =
    useState("");
  // Ready-for-review jobcards state
  const [readyJobcards, setReadyJobcards] = useState([]);
  const [loadingReady, setLoadingReady] = useState(false);
  const [showJobcardReview, setShowJobcardReview] = useState(false);
  const [selectedJobcard, setSelectedJobcard] = useState(null);

  // All assigned jobs state
  const [assignedJobs, setAssignedJobs] = useState(() => {
    // Load from localStorage on component mount
    const savedJobs = localStorage.getItem("assignedJobs");
    return savedJobs ? JSON.parse(savedJobs) : [];
  });
  const [showJobDetails, setShowJobDetails] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [jobStatusFilter, setJobStatusFilter] = useState("all");
  // Dashboard stats
  const [stats, setStats] = useState({
    availableMechanics: 0,
    pendingJobcardReviews: 0,
    assignedJobs: 0,
    jobsDoneToday: 0,
  });
  const [loadingStats, setLoadingStats] = useState(false);

  // Fetch arrived bookings when component mounts or when assign-jobs tab is active
  useEffect(() => {
    if (activeTab === "assign-jobs") {
      fetchArrivedBookings();
    }
    if (activeTab === "job-cards") {
      fetchReadyJobcards();
    }
  }, [activeTab]);

  // Load dashboard stats on mount and when tab changes (lightweight)
  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoadingStats(true);
        const res = await serviceAdvisorAPI.getDashboardStats();
        const d = res?.data?.data || {};
        setStats({
          availableMechanics: d.availableMechanics || 0,
          pendingJobcardReviews: d.pendingJobcardReviews || 0,
          assignedJobs: d.assignedJobs || 0,
          jobsDoneToday: d.jobsDoneToday || 0,
        });
      } catch (e) {
        console.error("Error loading dashboard stats:", e);
      } finally {
        setLoadingStats(false);
      }
    };
    loadStats();
  }, [activeTab]);

  // Save assigned jobs to localStorage whenever the state changes
  useEffect(() => {
    localStorage.setItem("assignedJobs", JSON.stringify(assignedJobs));
  }, [assignedJobs]);

  const fetchArrivedBookings = async () => {
    try {
      setLoading(true);
      const response = await serviceAdvisorAPI.getArrivedBookings();
      const newBookings = response.data;

      // Preserve locally assigned bookings that might not be returned by API
      // (e.g., bookings that have been assigned mechanics but not yet submitted)
      setArrivedBookings((prevBookings) => {
        const newBookingIds = new Set(newBookings.map((b) => b.id));
        const locallyAssignedBookings = prevBookings.filter(
          (booking) =>
            !newBookingIds.has(booking.id) &&
            (booking.assignedMechanics || booking.assignedSpareParts) &&
            !submittedBookings.includes(booking.id)
        );

        return [...newBookings, ...locallyAssignedBookings];
      });
    } catch (error) {
      console.error("Error fetching arrived bookings:", error);
      // Use mock data if API fails
      setArrivedBookings([
        {
          id: 1,
          timeSlot: "12:00-14:00",
          vehicleNumber: "DEF-456",
          customer: "Michael Chen",
          status: "arrived",
          arrivedTime: "07:45",
          phone: "0775555555",
          vehicleType: "Hatchback",
          vehicleBrand: "Nissan",
          vehicleBrandModel: "Micra",
          manufacturedYear: 2021,
          fuelType: "Petrol",
          transmissionType: "Manual",
          kilometersRun: 28000,
          serviceTypes: ["Regular Service", "Battery Check"],
          specialRequests: "Replace air filter",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchReadyJobcards = async () => {
    try {
      setLoadingReady(true);
      const response = await serviceAdvisorAPI.getJobcardsReadyForReview();
      // Backend returns { success, count, data }
      const list = response?.data?.data || [];
      setReadyJobcards(list);

      // Update job statuses in All Jobs tab for jobs that are ready for review
      list.forEach((jobcard) => {
        updateJobStatus(jobcard.bookingId, "ready_for_review", {
          readyForReviewAt: new Date().toISOString(),
        });
      });
    } catch (error) {
      console.error("Error fetching ready-for-review jobcards:", error);
      setReadyJobcards([]);
    } finally {
      setLoadingReady(false);
    }
  };

  const viewBookingDetails = (booking) => {
    setSelectedBooking(booking);
    setShowBookingDetails(true);
  };

  const openAssignMechanics = async (booking) => {
    setSelectedBooking(booking);
    try {
      const response = await mechanicsAPI.getAvailableMechanics();
      setAvailableMechanics(response.data.data || []);
      // Preselect already assigned mechanics (if any) so user can add/remove
      if (Array.isArray(booking.assignedMechanics)) {
        setSelectedMechanics(booking.assignedMechanics);
      } else {
        setSelectedMechanics([]);
      }
      setMechanicSearchTerm("");
      setMechanicSpecializationFilter("");
      setShowAssignMechanics(true);
    } catch (error) {
      console.error("Error fetching mechanics:", error);
      // Use mock data if API fails
      setAvailableMechanics([
        {
          mechanicId: 1,
          staffId: 4,
          mechanicCode: "MEC001",
          mechanicName: "Sarah",
          staffName: "Sarah Johnson",
          email: "sarah.johnson@vehicleservice.com",
          specialization: "Engine and Transmission",
          experience: 5,
          certifications: ["ASE Certified", "Engine Specialist"],
          availability: "Available",
          hourlyRate: 2500.0,
          isActive: true,
        },
        {
          mechanicId: 2,
          staffId: 5,
          mechanicCode: "MEC002",
          mechanicName: "John",
          staffName: "John Smith",
          email: "john.smith@vehicleservice.com",
          specialization: "Electrical Systems",
          experience: 3,
          certifications: ["Auto Electrician", "Hybrid Systems"],
          availability: "Available",
          hourlyRate: 2200.0,
          isActive: true,
        },
        {
          mechanicId: 3,
          staffId: 6,
          mechanicCode: "MEC003",
          mechanicName: "Mike",
          staffName: "Mike Wilson",
          email: "mike.wilson@vehicleservice.com",
          specialization: "Brake Systems",
          experience: 4,
          certifications: ["Brake Specialist", "Safety Certified"],
          availability: "Available",
          hourlyRate: 2300.0,
          isActive: true,
        },
        {
          mechanicId: 4,
          staffId: 7,
          mechanicCode: "MEC004",
          mechanicName: "Lisa",
          staffName: "Lisa Brown",
          email: "lisa.brown@vehicleservice.com",
          specialization: "Air Conditioning",
          experience: 2,
          certifications: ["AC Technician"],
          availability: "Busy",
          hourlyRate: 2000.0,
          isActive: true,
        },
      ]);
      if (Array.isArray(booking.assignedMechanics)) {
        setSelectedMechanics(booking.assignedMechanics);
      } else {
        setSelectedMechanics([]);
      }
      setMechanicSearchTerm("");
      setMechanicSpecializationFilter("");
      setShowAssignMechanics(true);
    }
  };

  const openAssignSpareParts = async (booking) => {
    setSelectedBooking(booking);
    try {
      const response = await sparePartsAPI.getAllSpareParts();
      setAvailableSpareParts(response.data.data || []);
      // Preselect already assigned spare parts (if any) so user can add/remove
      if (Array.isArray(booking.assignedSpareParts)) {
        setSelectedSpareParts(booking.assignedSpareParts);
      } else {
        setSelectedSpareParts([]);
      }
      setShowAssignSpareParts(true);
    } catch (error) {
      console.error("Error fetching spare parts:", error);
      setAvailableSpareParts([]);
      if (Array.isArray(booking.assignedSpareParts)) {
        setSelectedSpareParts(booking.assignedSpareParts);
      } else {
        setSelectedSpareParts([]);
      }
      setShowAssignSpareParts(true);
    }
  };

  const handleAssignMechanics = async () => {
    // If none selected, clear current assignment
    if (selectedMechanics.length === 0) {
      setArrivedBookings((prev) =>
        prev.map((booking) =>
          booking.id === selectedBooking.id
            ? { ...booking, assignedMechanics: [] }
            : booking
        )
      );
      alert("Cleared mechanic assignments for this booking.");
      setShowAssignMechanics(false);
      return;
    }

    // Only update local state - don't call backend until "Submit Job" is clicked
    setArrivedBookings((prev) =>
      prev.map((booking) =>
        booking.id === selectedBooking.id
          ? { ...booking, assignedMechanics: selectedMechanics }
          : booking
      )
    );

    alert(
      "Mechanics assigned locally! Click 'Submit Job' to finalize the assignment."
    );
    setShowAssignMechanics(false);
  };

  const handleAssignSpareParts = async () => {
    // If none selected, clear current assignment
    if (selectedSpareParts.length === 0) {
      setArrivedBookings((prev) =>
        prev.map((booking) =>
          booking.id === selectedBooking.id
            ? { ...booking, assignedSpareParts: [] }
            : booking
        )
      );
      alert("Cleared spare parts for this booking.");
      setShowAssignSpareParts(false);
      return;
    }

    // Only update local state - don't call backend until "Submit Job" is clicked
    setArrivedBookings((prev) =>
      prev.map((booking) =>
        booking.id === selectedBooking.id
          ? { ...booking, assignedSpareParts: selectedSpareParts }
          : booking
      )
    );

    alert(
      "Spare parts assigned locally! Click 'Submit Job' to finalize the assignment."
    );
    setShowAssignSpareParts(false);
  };

  const handleSubmitJob = async (booking) => {
    try {
      // Check if mechanics are assigned (required)
      if (
        !booking.assignedMechanics ||
        booking.assignedMechanics.length === 0
      ) {
        alert("Please assign mechanics before submitting the job");
        return;
      }

      // First, assign mechanics to the booking (this creates jobcard and makes it visible to mechanics)
      const mechanicIds = booking.assignedMechanics.map((m) => m.mechanicId);
      await serviceAdvisorAPI.assignMechanicsToBooking(booking.id, mechanicIds);

      // Then, assign spare parts to the booking (optional)
      if (booking.assignedSpareParts && booking.assignedSpareParts.length > 0) {
        const spareParts = booking.assignedSpareParts.map((sp) => ({
          partId: sp.partId,
          quantity: sp.quantity || 1,
        }));
        await serviceAdvisorAPI.assignSparePartsToBooking(
          booking.id,
          spareParts
        );
      }

      // Finally, submit the jobcard
      await serviceAdvisorAPI.submitJobcard(booking.id);

      // Add to submitted bookings list
      setSubmittedBookings((prev) => [...prev, booking.id]);

      // Remove from arrived bookings list since it's now submitted
      setArrivedBookings((prev) => prev.filter((b) => b.id !== booking.id));

      // Add to assigned jobs list for All Jobs tab
      const jobData = {
        id: booking.id,
        vehicleNumber: booking.vehicleNumber,
        customer: booking.customer,
        serviceTypes: booking.serviceTypes,
        status: "in_progress",
        assignedMechanics: booking.assignedMechanics,
        assignedSpareParts: booking.assignedSpareParts,
        timeSlot: booking.timeSlot,
        phone: booking.phone,
        vehicleType: booking.vehicleType,
        vehicleBrand: booking.vehicleBrand,
        vehicleBrandModel: booking.vehicleBrandModel,
        manufacturedYear: booking.manufacturedYear,
        fuelType: booking.fuelType,
        transmissionType: booking.transmissionType,
        kilometersRun: booking.kilometersRun,
        specialRequests: booking.specialRequests,
        submittedAt: new Date().toISOString(),
      };

      setAssignedJobs((prev) => [jobData, ...prev]);

      alert("Job submitted successfully! Mechanics can now start work.");
    } catch (error) {
      console.error("Error submitting job:", error);
      alert(
        "Failed to submit job: " +
          (error.response?.data?.message || error.message)
      );
    }
  };

  const summaryCards = [
    {
      title: "Available Mechanics",
      value: String(stats.availableMechanics),
      icon: <UsersRound className="w-8 h-8 text-red-600" />,
      color: "bg-white",
    },
    {
      title: "Pending JobCard Reviews",
      value: String(stats.pendingJobcardReviews),
      icon: <Clipboard className="w-8 h-8 text-red-600" />,
      color: "bg-white",
    },
    {
      title: "Assigned Jobs",
      value: String(stats.assignedJobs),
      icon: <Wrench className="w-8 h-8 text-red-600" />,
      color: "bg-white",
    },
    {
      title: "Jobs Done Today",
      value: String(stats.jobsDoneToday),
      icon: <ClipboardCheck className="w-8 h-8 text-red-600" />,
      color: "bg-white",
    },
  ];

  const tabs = [
    { id: "assign-jobs", label: "Assign jobs" },
    { id: "job-cards", label: "Job cards" },
    { id: "all-jobs", label: "All Jobs" },
    { id: "all-mechanics", label: "All mechanics" },
  ];

  const reviewJobcard = (jobcard) => {
    setSelectedJobcard(jobcard);
    setShowJobcardReview(true);
  };

  const viewJobDetails = (job) => {
    setSelectedJob(job);
    setShowJobDetails(true);
  };

  const updateJobStatus = (bookingId, newStatus, additionalData = {}) => {
    setAssignedJobs((prev) =>
      prev.map((job) => {
        if (job.id === bookingId) {
          return {
            ...job,
            status: newStatus,
            ...additionalData,
          };
        }
        return job;
      })
    );
  };

  const approveJobcard = async (jobcardId) => {
    try {
      await serviceAdvisorAPI.approveJobcard(jobcardId);

      // Remove from ready jobcards list after approval
      setReadyJobcards((prev) =>
        prev.filter((jc) => jc.jobcardId !== jobcardId)
      );

      // Update the corresponding job in All Jobs tab to show completed status
      if (selectedJobcard) {
        updateJobStatus(selectedJobcard.bookingId, "completed", {
          completedAt: new Date().toISOString(),
        });
      }

      // Close review modal if open
      setShowJobcardReview(false);
      setSelectedJobcard(null);
      alert(
        "Jobcard approved successfully! Mechanics have been set to Available."
      );
    } catch (error) {
      console.error("Error approving jobcard:", error);
      alert(
        "Failed to approve jobcard: " +
          (error.response?.data?.message || error.message)
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading ServiceAdvisor Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <div className="container-custom py-8">
        {/* Dashboard Title */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Service Advisor Dashboard
          </h1>
          <p className="text-gray-600 text-lg">
            Manage job assignments and review work orders
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
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
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center">
                    {card.icon}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Main Content Area */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          {/* Tabbed Navigation */}
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
            {activeTab === "assign-jobs" && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900">
                    Assign Jobs
                  </h3>
                </div>

                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading arrived bookings...</p>
                  </div>
                ) : arrivedBookings.length === 0 ? (
                  <div className="text-center py-12">
                    <Car className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">
                      No arrived bookings to assign
                    </p>
                    <p className="text-gray-500 text-sm mt-2">
                      Bookings will appear here when receptionist marks them as
                      arrived
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {arrivedBookings.map((booking) => {
                      const isSubmitted = submittedBookings.includes(
                        booking.id
                      );
                      return (
                        <div
                          key={booking.id}
                          className={`bg-white border rounded-lg p-6 shadow-sm ${
                            isSubmitted
                              ? "border-green-200 bg-green-50"
                              : "border-gray-200"
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-3">
                                <div className="flex items-center gap-2">
                                  <Car className="w-5 h-5 text-gray-500" />
                                  <span className="font-bold text-gray-900">
                                    {booking.vehicleNumber}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <User className="w-4 h-4 text-gray-500" />
                                  <span className="text-gray-700">
                                    {booking.customer}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Clock className="w-4 h-4 text-gray-500" />
                                  <span className="text-gray-700">
                                    Arrived: {booking.arrivedTime}
                                  </span>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                  <p className="text-sm text-gray-600">
                                    Time Slot
                                  </p>
                                  <p className="font-medium">
                                    {booking.timeSlot}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600">
                                    Vehicle Type
                                  </p>
                                  <p className="font-medium">
                                    {booking.vehicleType}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600">
                                    Services
                                  </p>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {booking.serviceTypes.map(
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
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600">Phone</p>
                                  <p className="font-medium flex items-center gap-1">
                                    <Phone className="w-4 h-4" />
                                    {booking.phone}
                                  </p>
                                </div>
                              </div>

                              {booking.specialRequests && (
                                <div className="mb-4">
                                  <p className="text-sm text-gray-600">
                                    Special Requests
                                  </p>
                                  <p className="text-gray-700 bg-gray-50 p-2 rounded text-sm">
                                    {booking.specialRequests}
                                  </p>
                                </div>
                              )}

                              {/* Assignment Status */}
                              <div className="mb-4">
                                <div className="flex flex-wrap gap-4">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-600">
                                      Mechanics:
                                    </span>
                                    {booking.assignedMechanics &&
                                    booking.assignedMechanics.length > 0 ? (
                                      <div className="flex flex-wrap gap-1">
                                        {booking.assignedMechanics.map(
                                          (mechanic, index) => (
                                            <span
                                              key={mechanic.mechanicId || index}
                                              className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs"
                                            >
                                              {mechanic.mechanicName ||
                                                mechanic.name ||
                                                `Mechanic ${
                                                  mechanic.mechanicId ||
                                                  index + 1
                                                }`}{" "}
                                              ({mechanic.mechanicCode || "N/A"})
                                            </span>
                                          )
                                        )}
                                      </div>
                                    ) : (
                                      <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs">
                                        Not assigned
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-600">
                                      Spare Parts:
                                    </span>
                                    {booking.assignedSpareParts &&
                                    booking.assignedSpareParts.length > 0 ? (
                                      <div className="flex flex-wrap gap-1">
                                        {booking.assignedSpareParts.map(
                                          (part, index) => (
                                            <span
                                              key={part.partId || index}
                                              className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs"
                                            >
                                              {part.partName ||
                                                part.name ||
                                                `Part ${
                                                  part.partId || index + 1
                                                }`}{" "}
                                              ({part.partCode || "N/A"})
                                            </span>
                                          )
                                        )}
                                      </div>
                                    ) : (
                                      <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                                        Optional
                                      </span>
                                    )}
                                  </div>
                                  {isSubmitted && (
                                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                                      Job Submitted
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-col gap-2 ml-4">
                              <button
                                onClick={() => viewBookingDetails(booking)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                              >
                                <Eye className="w-4 h-4" />
                                View Details
                              </button>
                              <button
                                onClick={() => openAssignMechanics(booking)}
                                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                              >
                                Assign Mechanics
                              </button>
                              <button
                                onClick={() => openAssignSpareParts(booking)}
                                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                              >
                                Assign Spare-parts
                              </button>
                              {!isSubmitted && (
                                <button
                                  onClick={() => handleSubmitJob(booking)}
                                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                                >
                                  Submit Job
                                </button>
                              )}
                              {isSubmitted && (
                                <button
                                  disabled
                                  className="bg-gray-400 text-white px-4 py-2 rounded-lg text-sm font-medium cursor-not-allowed"
                                >
                                  Job Submitted
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === "job-cards" && (
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-6">
                  Job Cards for Review
                </h3>
                {loadingReady ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">
                      Loading jobcards ready for review...
                    </p>
                  </div>
                ) : readyJobcards.length === 0 ? (
                  <div className="text-center py-12">
                    <Clipboard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">
                      No jobcards are ready for review
                    </p>
                    <p className="text-gray-500 text-sm mt-2">
                      They will appear here when mechanics finish and mark them
                      complete
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {readyJobcards.map((jc) => (
                      <div
                        key={jc.jobcardId}
                        className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-bold text-gray-900 mb-1">
                              Jobcard #{jc.jobcardId} • {jc.vehicleNumber}
                            </h4>
                            <div className="text-gray-600 mb-1 text-sm">
                              {Array.isArray(jc.serviceTypes) &&
                              jc.serviceTypes.length > 0
                                ? jc.serviceTypes.join(", ")
                                : "Service"}
                            </div>
                            {Array.isArray(jc.assignedMechanics) &&
                              jc.assignedMechanics.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {jc.assignedMechanics.map((m) => (
                                    <span
                                      key={m.mechanicId}
                                      className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs"
                                    >
                                      {m.mechanicName || "Mechanic"} (
                                      {m.mechanicCode || m.mechanicId})
                                    </span>
                                  ))}
                                </div>
                              )}
                          </div>
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => reviewJobcard(jc)}
                              className="px-4 py-2 rounded-full text-xs font-medium bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              Review
                            </button>
                            <button
                              onClick={() => approveJobcard(jc.jobcardId)}
                              className="px-4 py-2 rounded-full text-xs font-medium bg-red-600 hover:bg-red-700 text-white transition-colors"
                            >
                              Approve
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "all-jobs" && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900">
                    All Assigned Jobs
                  </h3>
                  <div className="flex items-center gap-4">
                    <select
                      value={jobStatusFilter}
                      onChange={(e) => setJobStatusFilter(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    >
                      <option value="all">All Jobs</option>
                      <option value="in_progress">In Progress</option>
                      <option value="ready_for_review">Ready for Review</option>
                      <option value="completed">Completed</option>
                    </select>
                    <button
                      onClick={() => {
                        if (
                          confirm(
                            "Are you sure you want to clear all completed jobs?"
                          )
                        ) {
                          setAssignedJobs((prev) =>
                            prev.filter((job) => job.status !== "completed")
                          );
                        }
                      }}
                      className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                    >
                      Clear Completed
                    </button>
                  </div>
                </div>

                {(() => {
                  const filteredJobs = assignedJobs.filter(
                    (job) =>
                      jobStatusFilter === "all" ||
                      job.status === jobStatusFilter
                  );

                  return filteredJobs.length === 0 ? (
                    <div className="text-center py-12">
                      <CheckCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">
                        {assignedJobs.length === 0
                          ? "No assigned jobs found"
                          : `No ${jobStatusFilter.replace(
                              "_",
                              " "
                            )} jobs found`}
                      </p>
                      <p className="text-gray-500 text-sm mt-2">
                        {assignedJobs.length === 0
                          ? "Jobs will appear here when you assign mechanics to bookings and submit them"
                          : "Try selecting a different status filter"}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredJobs.map((job) => (
                        <div
                          key={job.id}
                          className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-3">
                                <div className="flex items-center gap-2">
                                  <Car className="w-5 h-5 text-gray-500" />
                                  <span className="font-bold text-gray-900">
                                    {job.vehicleNumber}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <User className="w-4 h-4 text-gray-500" />
                                  <span className="text-gray-700">
                                    {job.customer}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Clock className="w-4 h-4 text-gray-500" />
                                  <span className="text-gray-700">
                                    {job.timeSlot}
                                  </span>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                  <p className="text-sm text-gray-600">
                                    Services
                                  </p>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {Array.isArray(job.serviceTypes) &&
                                    job.serviceTypes.length > 0 ? (
                                      job.serviceTypes.map((service, index) => (
                                        <span
                                          key={index}
                                          className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs"
                                        >
                                          {service}
                                        </span>
                                      ))
                                    ) : (
                                      <span className="text-gray-500 text-sm">
                                        No services specified
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600">
                                    Job Status
                                  </p>
                                  <span
                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                      job.status === "completed"
                                        ? "bg-green-100 text-green-800"
                                        : job.status === "ready_for_review"
                                        ? "bg-orange-100 text-orange-800"
                                        : job.status === "in_progress"
                                        ? "bg-blue-100 text-blue-800"
                                        : "bg-gray-100 text-gray-800"
                                    }`}
                                  >
                                    {job.status.replace("_", " ")}
                                  </span>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600">
                                    Assigned Mechanics
                                  </p>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {job.assignedMechanics &&
                                    job.assignedMechanics.length > 0 ? (
                                      job.assignedMechanics.map(
                                        (mechanic, index) => (
                                          <span
                                            key={mechanic.mechanicId || index}
                                            className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs"
                                          >
                                            {mechanic.mechanicName ||
                                              mechanic.name ||
                                              `Mechanic ${
                                                mechanic.mechanicId || index + 1
                                              }`}{" "}
                                            ({mechanic.mechanicCode || "N/A"})
                                          </span>
                                        )
                                      )
                                    ) : (
                                      <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs">
                                        No mechanics assigned
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600">
                                    Assigned Spare Parts
                                  </p>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {job.assignedSpareParts &&
                                    job.assignedSpareParts.length > 0 ? (
                                      job.assignedSpareParts.map(
                                        (part, index) => (
                                          <span
                                            key={part.partId || index}
                                            className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs"
                                          >
                                            {part.partName ||
                                              part.name ||
                                              `Part ${
                                                part.partId || index + 1
                                              }`}{" "}
                                            ({part.partCode || "N/A"})
                                          </span>
                                        )
                                      )
                                    ) : (
                                      <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                                        Optional - No parts assigned
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="text-sm text-gray-500">
                                {job.submittedAt && (
                                  <div>
                                    Submitted:{" "}
                                    {new Date(job.submittedAt).toLocaleString()}
                                  </div>
                                )}
                                {job.readyForReviewAt && (
                                  <div className="text-orange-600 font-medium">
                                    Ready for Review:{" "}
                                    {new Date(
                                      job.readyForReviewAt
                                    ).toLocaleString()}
                                  </div>
                                )}
                                {job.completedAt && (
                                  <div className="text-green-600 font-medium">
                                    Completed:{" "}
                                    {new Date(job.completedAt).toLocaleString()}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-col gap-2 ml-4">
                              <button
                                onClick={() => viewJobDetails(job)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                              >
                                <Eye className="w-4 h-4" />
                                View Details
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            )}

            {activeTab === "all-mechanics" && (
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-6">
                  All Mechanics
                </h3>
                <div className="text-center py-12">
                  <Wrench className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">
                    All mechanics features coming soon
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Booking Details Modal */}
      {showBookingDetails && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                Booking Details
              </h3>
              <button
                onClick={() => setShowBookingDetails(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg
                  className="w-6 h-6"
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

            <div className="space-y-6">
              {/* Customer Information */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">
                  Customer Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Name</p>
                    <p className="font-medium">{selectedBooking.customer}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="font-medium">{selectedBooking.phone}</p>
                  </div>
                </div>
              </div>

              {/* Vehicle Information */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">
                  Vehicle Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Vehicle Number</p>
                    <p className="font-medium">
                      {selectedBooking.vehicleNumber}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Vehicle Type</p>
                    <p className="font-medium">{selectedBooking.vehicleType}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Brand & Model</p>
                    <p className="font-medium">
                      {selectedBooking.vehicleBrand}{" "}
                      {selectedBooking.vehicleBrandModel}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Year</p>
                    <p className="font-medium">
                      {selectedBooking.manufacturedYear}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Fuel Type</p>
                    <p className="font-medium">{selectedBooking.fuelType}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Transmission</p>
                    <p className="font-medium">
                      {selectedBooking.transmissionType}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Kilometers Run</p>
                    <p className="font-medium">
                      {selectedBooking.kilometersRun?.toLocaleString()} km
                    </p>
                  </div>
                </div>
              </div>

              {/* Booking Information */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">
                  Booking Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Time Slot</p>
                    <p className="font-medium">{selectedBooking.timeSlot}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Arrived Time</p>
                    <p className="font-medium text-green-600">
                      {selectedBooking.arrivedTime}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {selectedBooking.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Services */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">
                  Services Required
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedBooking.serviceTypes?.map((service, index) => (
                    <span
                      key={index}
                      className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                    >
                      {service}
                    </span>
                  ))}
                </div>
              </div>

              {/* Special Requests */}
              {selectedBooking.specialRequests && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">
                    Special Requests
                  </h4>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded">
                    {selectedBooking.specialRequests}
                  </p>
                </div>
              )}

              {/* Assignment Status */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">
                  Assignment Status
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-2">
                      Mechanics Assigned
                    </p>
                    {selectedBooking.assignedMechanics &&
                    selectedBooking.assignedMechanics.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {selectedBooking.assignedMechanics.map(
                          (mechanic, index) => (
                            <span
                              key={mechanic.mechanicId || index}
                              className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm"
                            >
                              {mechanic.mechanicName ||
                                mechanic.name ||
                                `Mechanic ${
                                  mechanic.mechanicId || index + 1
                                }`}{" "}
                              ({mechanic.mechanicCode || "N/A"})
                            </span>
                          )
                        )}
                      </div>
                    ) : (
                      <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm">
                        No mechanics assigned
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-2">
                      Spare Parts Assigned
                    </p>
                    {selectedBooking.assignedSpareParts &&
                    selectedBooking.assignedSpareParts.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {selectedBooking.assignedSpareParts.map(
                          (part, index) => (
                            <span
                              key={part.partId || index}
                              className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm"
                            >
                              {part.partName ||
                                part.name ||
                                `Part ${part.partId || index + 1}`}{" "}
                              ({part.partCode || "N/A"})
                            </span>
                          )
                        )}
                      </div>
                    ) : (
                      <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm">
                        Optional - No spare parts assigned
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowBookingDetails(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowBookingDetails(false);
                  openAssignMechanics(selectedBooking);
                }}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                Assign Mechanics
              </button>
              <button
                onClick={() => {
                  setShowBookingDetails(false);
                  openAssignSpareParts(selectedBooking);
                }}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                Assign Spare-parts
              </button>
              <button
                onClick={() => {
                  setShowBookingDetails(false);
                  handleSubmitJob(selectedBooking);
                }}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
              >
                Submit Job
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Mechanics Modal */}
      {showAssignMechanics && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                Assign Mechanics to {selectedBooking.vehicleNumber}
              </h3>
              <button
                onClick={() => setShowAssignMechanics(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg
                  className="w-6 h-6"
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

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-gray-600">
                  Select mechanics to assign to this booking:
                </p>
                {selectedMechanics.length > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                    <span className="text-sm font-medium text-green-800">
                      {selectedMechanics.length} mechanic
                      {selectedMechanics.length !== 1 ? "s" : ""} selected
                    </span>
                  </div>
                )}
              </div>

              {selectedMechanics.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-blue-900">
                      Selected Mechanics:
                    </h4>
                    <button
                      onClick={() => setSelectedMechanics([])}
                      className="text-xs text-blue-700 hover:text-blue-900"
                    >
                      Clear all
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedMechanics.map((mechanic) => (
                      <span
                        key={mechanic.mechanicId}
                        className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1"
                      >
                        <span>
                          {mechanic.mechanicName || mechanic.name} (
                          {mechanic.mechanicCode})
                        </span>
                        <button
                          aria-label="Remove mechanic"
                          onClick={() =>
                            setSelectedMechanics((prev) =>
                              prev.filter(
                                (m) => m.mechanicId !== mechanic.mechanicId
                              )
                            )
                          }
                          className="ml-1 text-blue-800 hover:text-blue-900"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Search and Filter Controls */}
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Search mechanics by name or code..."
                    value={mechanicSearchTerm}
                    onChange={(e) => setMechanicSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div className="md:w-48">
                  <select
                    value={mechanicSpecializationFilter}
                    onChange={(e) =>
                      setMechanicSpecializationFilter(e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="">All Specializations</option>
                    {[
                      ...new Set(
                        availableMechanics.map((m) => m.specialization)
                      ),
                    ].map((spec) => (
                      <option key={spec} value={spec}>
                        {spec}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                {availableMechanics
                  .filter((mechanic) => {
                    const matchesSearch =
                      mechanicSearchTerm === "" ||
                      (mechanic.mechanicName &&
                        mechanic.mechanicName
                          .toLowerCase()
                          .includes(mechanicSearchTerm.toLowerCase())) ||
                      (mechanic.name &&
                        mechanic.name
                          .toLowerCase()
                          .includes(mechanicSearchTerm.toLowerCase())) ||
                      mechanic.mechanicCode
                        .toLowerCase()
                        .includes(mechanicSearchTerm.toLowerCase());
                    const matchesSpecialization =
                      mechanicSpecializationFilter === "" ||
                      mechanic.specialization === mechanicSpecializationFilter;
                    return matchesSearch && matchesSpecialization;
                  })
                  .map((mechanic) => (
                    <div
                      key={mechanic.mechanicId}
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <label className="flex items-start space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedMechanics.some(
                            (m) => m.mechanicId === mechanic.mechanicId
                          )}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedMechanics((prev) => {
                                if (
                                  prev.some(
                                    (m) => m.mechanicId === mechanic.mechanicId
                                  )
                                )
                                  return prev; // avoid duplicates
                                return [...prev, mechanic];
                              });
                            } else {
                              setSelectedMechanics(
                                selectedMechanics.filter(
                                  (m) => m.mechanicId !== mechanic.mechanicId
                                )
                              );
                            }
                          }}
                          className="mt-1 w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <div className="font-semibold text-gray-900 text-lg">
                              {mechanic.mechanicName || mechanic.name}
                            </div>
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-full ${
                                mechanic.availability === "Available"
                                  ? "bg-green-100 text-green-800"
                                  : mechanic.availability === "Busy"
                                  ? "bg-red-100 text-red-800"
                                  : mechanic.availability === "On Break"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {mechanic.availability}
                            </span>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-600">
                                Code:
                              </span>
                              <span className="text-sm text-gray-900 font-mono bg-gray-100 px-2 py-1 rounded">
                                {mechanic.mechanicCode}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-600">
                                Specialization:
                              </span>
                              <span className="text-sm text-blue-600 font-medium">
                                {mechanic.specialization}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-600">
                                Experience:
                              </span>
                              <span className="text-sm text-gray-900">
                                {mechanic.experience} years
                              </span>
                            </div>

                            {mechanic.hourlyRate && (
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-600">
                                  Hourly Rate:
                                </span>
                                <span className="text-sm text-green-600 font-medium">
                                  Rs. {mechanic.hourlyRate.toLocaleString()}
                                </span>
                              </div>
                            )}

                            {mechanic.certifications && (
                              <div className="mt-2">
                                <span className="text-sm font-medium text-gray-600">
                                  Certifications:
                                </span>
                                <div className="mt-1">
                                  {typeof mechanic.certifications ===
                                  "string" ? (
                                    <span className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded">
                                      {mechanic.certifications}
                                    </span>
                                  ) : (
                                    <div className="flex flex-wrap gap-1">
                                      {mechanic.certifications.map(
                                        (cert, index) => (
                                          <span
                                            key={index}
                                            className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded"
                                          >
                                            {cert}
                                          </span>
                                        )
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </label>
                    </div>
                  ))}
              </div>

              {availableMechanics.filter((mechanic) => {
                const matchesSearch =
                  mechanicSearchTerm === "" ||
                  (mechanic.mechanicName &&
                    mechanic.mechanicName
                      .toLowerCase()
                      .includes(mechanicSearchTerm.toLowerCase())) ||
                  (mechanic.name &&
                    mechanic.name
                      .toLowerCase()
                      .includes(mechanicSearchTerm.toLowerCase())) ||
                  mechanic.mechanicCode
                    .toLowerCase()
                    .includes(mechanicSearchTerm.toLowerCase());
                const matchesSpecialization =
                  mechanicSpecializationFilter === "" ||
                  mechanic.specialization === mechanicSpecializationFilter;
                return matchesSearch && matchesSpecialization;
              }).length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  {availableMechanics.length === 0
                    ? "No available mechanics found"
                    : "No mechanics match your search criteria"}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowAssignMechanics(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignMechanics}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                Assign Selected Mechanics
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Spare Parts Modal */}
      {showAssignSpareParts && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                Assign Spare Parts to {selectedBooking.vehicleNumber}
              </h3>
              <button
                onClick={() => setShowAssignSpareParts(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg
                  className="w-6 h-6"
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

            <div className="space-y-4">
              <p className="text-gray-600">
                Select spare parts to assign to this booking:
              </p>

              {selectedSpareParts.length > 0 && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-purple-900">
                      Selected Parts:
                    </h4>
                    <button
                      onClick={() => setSelectedSpareParts([])}
                      className="text-xs text-purple-700 hover:text-purple-900"
                    >
                      Clear all
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedSpareParts.map((part) => (
                      <span
                        key={part.partId}
                        className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1"
                      >
                        <span>
                          {part.partName || part.name} ({part.partCode || ""})
                        </span>
                        <button
                          aria-label="Remove part"
                          onClick={() =>
                            setSelectedSpareParts((prev) =>
                              prev.filter((sp) => sp.partId !== part.partId)
                            )
                          }
                          className="ml-1 text-purple-800 hover:text-purple-900"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                {availableSpareParts.map((part) => (
                  <div key={part.partId} className="border rounded-lg p-4">
                    <label className="flex items-start space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedSpareParts.some(
                          (sp) => sp.partId === part.partId
                        )}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedSpareParts((prev) => {
                              if (prev.some((sp) => sp.partId === part.partId))
                                return prev; // avoid duplicates
                              return [...prev, { ...part, quantity: 1 }];
                            });
                          } else {
                            setSelectedSpareParts(
                              selectedSpareParts.filter(
                                (sp) => sp.partId !== part.partId
                              )
                            );
                          }
                        }}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {part.partName}
                        </div>
                        <div className="text-sm text-gray-600">
                          Code: {part.partCode}
                        </div>
                        <div className="text-sm text-gray-600">
                          Category: {part.category}
                        </div>
                        <div className="text-sm text-gray-600">
                          Price: ${part.unitPrice}
                        </div>
                        <div className="text-sm text-gray-600">
                          Stock: {part.stockQuantity}
                        </div>

                        {selectedSpareParts.some(
                          (sp) => sp.partId === part.partId
                        ) && (
                          <div className="mt-2">
                            <label className="text-sm text-gray-600">
                              Quantity:
                            </label>
                            <input
                              type="number"
                              min="1"
                              max={part.stockQuantity}
                              value={
                                selectedSpareParts.find(
                                  (sp) => sp.partId === part.partId
                                )?.quantity || 1
                              }
                              onChange={(e) => {
                                let quantity = parseInt(e.target.value) || 1;
                                if (quantity < 1) quantity = 1;
                                if (part.stockQuantity)
                                  quantity = Math.min(
                                    quantity,
                                    Number(part.stockQuantity)
                                  );
                                setSelectedSpareParts((prev) =>
                                  prev.map((sp) =>
                                    sp.partId === part.partId
                                      ? { ...sp, quantity }
                                      : sp
                                  )
                                );
                              }}
                              className="ml-2 w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                          </div>
                        )}
                      </div>
                    </label>
                  </div>
                ))}
              </div>

              {availableSpareParts.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No spare parts found
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowAssignSpareParts(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignSpareParts}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Assign Selected Parts
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Job Card Review Modal */}
      {showJobcardReview && selectedJobcard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                Job Card Review - #{selectedJobcard.jobcardId}
              </h3>
              <button
                onClick={() => setShowJobcardReview(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg
                  className="w-6 h-6"
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

            <div className="space-y-6">
              {/* Job Card Header */}
              <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-lg p-4 border border-gray-200">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-lg font-bold text-gray-900">
                      Job Card #{selectedJobcard.jobcardId}
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Booking #{selectedJobcard.bookingId} •{" "}
                      {selectedJobcard.vehicleNumber}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                      READY FOR REVIEW
                    </span>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(
                        selectedJobcard.completedAt
                      ).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Vehicle & Customer Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h5 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Car className="w-5 h-5 text-red-600" />
                    Vehicle Information
                  </h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Vehicle Number:</span>
                      <span className="font-medium">
                        {selectedJobcard.vehicleNumber}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Brand & Model:</span>
                      <span className="font-medium">
                        {selectedJobcard.vehicleBrand}{" "}
                        {selectedJobcard.vehicleBrandModel}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Type:</span>
                      <span className="font-medium">
                        {selectedJobcard.vehicleType}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Time Slot:</span>
                      <span className="font-medium">
                        {selectedJobcard.timeSlot}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h5 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <User className="w-5 h-5 text-red-600" />
                    Customer Information
                  </h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Name:</span>
                      <span className="font-medium">
                        {selectedJobcard.customerName}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Phone:</span>
                      <span className="font-medium">
                        {selectedJobcard.customerPhone}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Services */}
              {selectedJobcard.serviceTypes &&
                Array.isArray(selectedJobcard.serviceTypes) && (
                  <div>
                    <h5 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Wrench className="w-5 h-5 text-red-600" />
                      Services Performed
                    </h5>
                    <div className="flex flex-wrap gap-2">
                      {selectedJobcard.serviceTypes.map((service, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium"
                        >
                          <Wrench className="w-3 h-3 mr-1" />
                          {service}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

              {/* Assigned Mechanics & Their Notes */}
              {selectedJobcard.assignedMechanics &&
                selectedJobcard.assignedMechanics.length > 0 && (
                  <div>
                    <h5 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <UsersRound className="w-5 h-5 text-red-600" />
                      Mechanics & Their Notes
                    </h5>
                    <div className="space-y-4">
                      {selectedJobcard.assignedMechanics.map((mechanic) => (
                        <div
                          key={mechanic.mechanicId}
                          className="bg-gray-50 rounded-lg p-4"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h6 className="font-medium text-gray-900">
                                {mechanic.mechanicName} ({mechanic.mechanicCode}
                                )
                              </h6>
                              <p className="text-sm text-gray-600">
                                {mechanic.specialization}
                              </p>
                            </div>
                            <div className="text-right">
                              <span
                                className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                                  mechanic.completedAt
                                    ? "bg-green-100 text-green-800"
                                    : "bg-yellow-100 text-yellow-800"
                                }`}
                              >
                                {mechanic.completedAt
                                  ? "Completed"
                                  : "In Progress"}
                              </span>
                              {mechanic.completedAt && (
                                <p className="text-xs text-gray-500 mt-1">
                                  {new Date(
                                    mechanic.completedAt
                                  ).toLocaleString()}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="mt-3">
                            <h7 className="text-sm font-medium text-gray-700 mb-2 block">
                              Mechanic Notes:
                            </h7>
                            <div className="bg-white rounded-lg p-3 border border-gray-200 min-h-[60px]">
                              {mechanic.notes ? (
                                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                  {mechanic.notes}
                                </p>
                              ) : (
                                <p className="text-sm text-gray-500 italic">
                                  No notes provided by this mechanic
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Assigned Spare Parts */}
              {selectedJobcard.assignedSpareParts &&
                selectedJobcard.assignedSpareParts.length > 0 && (
                  <div>
                    <h5 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Package className="w-5 h-5 text-red-600" />
                      Spare Parts Used
                    </h5>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="space-y-3">
                        {selectedJobcard.assignedSpareParts.map((part) => (
                          <div
                            key={part.partId}
                            className="flex justify-between items-center text-sm"
                          >
                            <div className="flex items-center gap-2">
                              <Package className="w-4 h-4 text-gray-600" />
                              <span className="font-medium">
                                {part.partName}
                              </span>
                              <span className="text-gray-500">
                                ({part.partCode})
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-gray-700">
                                Qty: {part.quantity}
                              </span>
                              <span className="text-gray-700 ml-4">
                                Rs. {parseFloat(part.totalPrice).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="border-t border-gray-200 mt-3 pt-3">
                        <div className="flex justify-between items-center font-semibold text-sm">
                          <span>Total Parts Cost:</span>
                          <span className="text-red-600">
                            Rs.{" "}
                            {parseFloat(selectedJobcard.totalPartsCost).toFixed(
                              2
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowJobcardReview(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => approveJobcard(selectedJobcard.jobcardId)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Approve Job Card
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Job Details Modal */}
      {showJobDetails && selectedJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                Job Details - {selectedJob.vehicleNumber}
              </h3>
              <button
                onClick={() => setShowJobDetails(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg
                  className="w-6 h-6"
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

            <div className="space-y-6">
              {/* Job Header */}
              <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-lg p-4 border border-gray-200">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-lg font-bold text-gray-900">
                      {selectedJob.vehicleNumber}
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Customer: {selectedJob.customer} • {selectedJob.timeSlot}
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                        selectedJob.status === "completed"
                          ? "bg-green-100 text-green-800"
                          : selectedJob.status === "ready_for_review"
                          ? "bg-orange-100 text-orange-800"
                          : selectedJob.status === "in_progress"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {selectedJob.status.replace("_", " ").toUpperCase()}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">
                      {selectedJob.submittedAt &&
                        new Date(selectedJob.submittedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Vehicle & Customer Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h5 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Car className="w-5 h-5 text-red-600" />
                    Vehicle Information
                  </h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Vehicle Number:</span>
                      <span className="font-medium">
                        {selectedJob.vehicleNumber}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Brand & Model:</span>
                      <span className="font-medium">
                        {selectedJob.vehicleBrand}{" "}
                        {selectedJob.vehicleBrandModel}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Type:</span>
                      <span className="font-medium">
                        {selectedJob.vehicleType}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Year:</span>
                      <span className="font-medium">
                        {selectedJob.manufacturedYear}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Fuel Type:</span>
                      <span className="font-medium">
                        {selectedJob.fuelType}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Transmission:</span>
                      <span className="font-medium">
                        {selectedJob.transmissionType}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Kilometers:</span>
                      <span className="font-medium">
                        {selectedJob.kilometersRun?.toLocaleString()} km
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h5 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <User className="w-5 h-5 text-red-600" />
                    Customer Information
                  </h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Name:</span>
                      <span className="font-medium">
                        {selectedJob.customer}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Phone:</span>
                      <span className="font-medium">{selectedJob.phone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Time Slot:</span>
                      <span className="font-medium">
                        {selectedJob.timeSlot}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Submitted:</span>
                      <span className="font-medium">
                        {selectedJob.submittedAt &&
                          new Date(selectedJob.submittedAt).toLocaleString()}
                      </span>
                    </div>
                    {selectedJob.readyForReviewAt && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Ready for Review:</span>
                        <span className="font-medium text-orange-600">
                          {new Date(
                            selectedJob.readyForReviewAt
                          ).toLocaleString()}
                        </span>
                      </div>
                    )}
                    {selectedJob.completedAt && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Completed:</span>
                        <span className="font-medium text-green-600">
                          {new Date(selectedJob.completedAt).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Services */}
              {selectedJob.serviceTypes &&
                Array.isArray(selectedJob.serviceTypes) &&
                selectedJob.serviceTypes.length > 0 && (
                  <div>
                    <h5 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Wrench className="w-5 h-5 text-red-600" />
                      Services
                    </h5>
                    <div className="flex flex-wrap gap-2">
                      {selectedJob.serviceTypes.map((service, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium"
                        >
                          <Wrench className="w-3 h-3 mr-1" />
                          {service}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

              {/* Special Requests */}
              {selectedJob.specialRequests && (
                <div>
                  <h5 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Clipboard className="w-5 h-5 text-red-600" />
                    Special Requests
                  </h5>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700">
                      {selectedJob.specialRequests}
                    </p>
                  </div>
                </div>
              )}

              {/* Assigned Mechanics */}
              {selectedJob.assignedMechanics &&
                selectedJob.assignedMechanics.length > 0 && (
                  <div>
                    <h5 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <UsersRound className="w-5 h-5 text-red-600" />
                      Assigned Mechanics
                    </h5>
                    <div className="space-y-3">
                      {selectedJob.assignedMechanics.map((mechanic, index) => (
                        <div
                          key={mechanic.mechanicId || index}
                          className="bg-gray-50 rounded-lg p-4"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h6 className="font-medium text-gray-900">
                                {mechanic.mechanicName ||
                                  mechanic.name ||
                                  `Mechanic ${
                                    mechanic.mechanicId || index + 1
                                  }`}
                              </h6>
                              <p className="text-sm text-gray-600">
                                Code: {mechanic.mechanicCode || "N/A"}
                              </p>
                              {mechanic.specialization && (
                                <p className="text-sm text-gray-600">
                                  Specialization: {mechanic.specialization}
                                </p>
                              )}
                            </div>
                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                              Assigned
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Assigned Spare Parts */}
              <div>
                <h5 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Package className="w-5 h-5 text-red-600" />
                  Assigned Spare Parts
                </h5>
                {selectedJob.assignedSpareParts &&
                selectedJob.assignedSpareParts.length > 0 ? (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="space-y-3">
                      {selectedJob.assignedSpareParts.map((part, index) => (
                        <div
                          key={part.partId || index}
                          className="flex justify-between items-center text-sm"
                        >
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4 text-gray-600" />
                            <span className="font-medium">
                              {part.partName ||
                                part.name ||
                                `Part ${part.partId || index + 1}`}
                            </span>
                            <span className="text-gray-500">
                              ({part.partCode || "N/A"})
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-gray-700">
                              Qty: {part.quantity || 1}
                            </span>
                            {part.unitPrice && (
                              <span className="text-gray-700 ml-4">
                                Rs. {parseFloat(part.unitPrice).toFixed(2)}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-600 text-sm">
                      Optional - No spare parts assigned for this job
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowJobDetails(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceAdvisorDashboard;
