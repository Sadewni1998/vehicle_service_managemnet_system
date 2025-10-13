import { useState, useEffect } from "react";
import {
  Wrench,
  ClipboardCheck,
  Bell,
  Clock,
  CheckCircle,
  AlertCircle,
  Package,
  User,
  Calendar,
  Car,
  Edit3,
  Save,
  X,
} from "lucide-react";
import { jobcardAPI, mechanicsAPI } from "../utils/api";
import { useAuth } from "../context/AuthContext";

const MechanicDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("my-jobs");
  const [assignedJobs, setAssignedJobs] = useState([]);
  const [jobcards, setJobcards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mechanicId, setMechanicId] = useState(null);
  const [editingNotes, setEditingNotes] = useState({});
  const [notes, setNotes] = useState({});

  // Mock data for when API is not available
  const mockJobs = [
    {
      id: 1,
      vehicleNumber: "ABC1234",
      vehicleDetails: "Toyota Prius 2020",
      vehicleType: "Sedan",
      services: ["Oil Change"],
      customer: "John Doe",
      customerPhone: "123-456-7890",
      scheduledTimeSlot: "10:00 AM",
      status: "In Progress",
      statusColor: "bg-yellow-100 text-yellow-800",
    },
    {
      id: 2,
      vehicleNumber: "XYZ9876",
      vehicleDetails: "Honda Civic 2019",
      vehicleType: "Sedan",
      services: ["Brake Service"],
      customer: "Jane Smith",
      customerPhone: "234-567-8901",
      scheduledTimeSlot: "2:00 PM",
      status: "Scheduled",
      statusColor: "bg-blue-100 text-blue-800",
    },
    {
      id: 3,
      vehicleNumber: "DEF5555",
      vehicleDetails: "Nissan Altima 2021",
      vehicleType: "Sedan",
      services: ["Engine Diagnostic"],
      customer: "Bob Johnson",
      customerPhone: "345-678-9012",
      scheduledTimeSlot: "3:30 PM",
      status: "Completed",
      statusColor: "bg-green-100 text-green-800",
    },
  ];

  // Load jobs data and jobcards
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        let resolvedMechanicId = user?.mechanicId;

        // If user is staff and we don't have mechanicId, resolve via staffId
        if (!resolvedMechanicId && user && user.staffId) {
          try {
            const mechRes = await mechanicsAPI.getByStaffId(user.staffId);
            resolvedMechanicId = mechRes.data?.data?.mechanicId;
          } catch (e) {
            console.warn("Unable to resolve mechanic by staffId", e);
          }
        }

        if (resolvedMechanicId) {
          setMechanicId(resolvedMechanicId);
          const response = await jobcardAPI.getMechanicJobcards(
            resolvedMechanicId
          );
          const list = response.data?.data || [];
          setJobcards(list);

          // Map jobcards to Assigned Jobs tab items
          const mapped = list.map((jc) => ({
            id: jc.jobcardId,
            vehicleNumber: jc.vehicleNumber,
            vehicleDetails: `${jc.vehicleBrand || ""} ${
              jc.vehicleBrandModel || ""
            }`.trim(),
            vehicleType: jc.vehicleType,
            services: Array.isArray(jc.serviceTypes) && jc.serviceTypes.length > 0
              ? jc.serviceTypes
              : ["Service"],
            customer: jc.customerName,
            customerPhone: jc.customerPhone,
            scheduledTimeSlot: jc.timeSlot || "",
            status:
              jc.status === "completed"
                ? "Completed"
                : jc.status === "in_progress"
                ? "In Progress"
                : jc.status === "ready_for_review"
                ? "Ready for Review"
                : "Open",
            statusColor:
              jc.status === "completed"
                ? "bg-green-100 text-green-800"
                : jc.status === "in_progress"
                ? "bg-yellow-100 text-yellow-800"
                : jc.status === "ready_for_review"
                ? "bg-blue-100 text-blue-800"
                : "bg-gray-100 text-gray-800",
          }));
          setAssignedJobs(mapped);
        } else {
          console.warn("Mechanic ID not available; showing empty lists");
          setJobcards([]);
          setAssignedJobs([]);
        }
      } catch (error) {
        console.error("Error loading jobcards:", error);
        console.warn("Using empty jobcards array");
        setJobcards([]);
        setAssignedJobs([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  // Handle notes editing
  const handleEditNotes = (jobcardId) => {
    setEditingNotes(prev => ({ ...prev, [jobcardId]: true }));
    // Initialize notes with existing value if available
    const jobcard = jobcards.find(jc => jc.jobcardId === jobcardId);
    if (jobcard && jobcard.mechanicNotes) {
      setNotes(prev => ({ ...prev, [jobcardId]: jobcard.mechanicNotes }));
    }
  };

  const handleCancelEdit = (jobcardId) => {
    setEditingNotes(prev => ({ ...prev, [jobcardId]: false }));
    setNotes(prev => ({ ...prev, [jobcardId]: "" }));
  };

  const handleSaveNotes = async (jobcardId) => {
    try {
      if (!mechanicId) {
        alert("Mechanic ID not resolved. Please re-login or try again.");
        return;
      }

      const notesText = notes[jobcardId] || "";
      await jobcardAPI.updateMechanicNotes(jobcardId, mechanicId, notesText);

      // Update local state
      setJobcards((prev) =>
        prev.map((jc) =>
          jc.jobcardId === jobcardId
            ? { ...jc, mechanicNotes: notesText }
            : jc
        )
      );

      setEditingNotes(prev => ({ ...prev, [jobcardId]: false }));
      alert("Notes saved successfully!");
    } catch (error) {
      console.error("Error saving notes:", error);
      alert("Failed to save notes: " + (error.response?.data?.message || error.message));
    }
  };

  // Mechanics should mark only their assignment as completed
  const handleMarkComplete = async (jobcardId) => {
    try {
      if (!mechanicId) {
        alert("Mechanic ID not resolved. Please re-login or try again.");
        return;
      }

      const notesText = notes[jobcardId] || "";
      const resp = await jobcardAPI.markMechanicCompleted(
        jobcardId,
        mechanicId,
        notesText
      );
      const ready = resp?.data?.jobcardReadyForReview;
      const message = resp?.data?.message || "Marked complete";

      // Update local state: if last mechanic, move card to ready_for_review
      setJobcards((prev) =>
        prev.map((jc) =>
          jc.jobcardId === jobcardId
            ? {
                ...jc,
                status: ready ? "ready_for_review" : jc.status,
                completedAt: ready ? new Date() : jc.completedAt,
                mechanicNotes: notesText,
                mechanicCompletedAt: new Date(),
              }
            : jc
        )
      );

      // Clear editing state
      setEditingNotes(prev => ({ ...prev, [jobcardId]: false }));
      setNotes(prev => ({ ...prev, [jobcardId]: "" }));

      alert(message);
    } catch (error) {
      console.error("Error marking mechanic complete:", error);
      alert(
        "Failed to mark complete: " +
          (error.response?.data?.message || error.message)
      );
    }
  };

  const summaryCards = [
    {
      title: "Assigned Jobs",
      value: assignedJobs.length.toString(),
      icon: <Wrench className="w-8 h-8 text-red-600" />,
      color: "bg-white",
    },
    {
      title: "Completed Today",
      value: assignedJobs
        .filter((job) => job.status === "Completed")
        .length.toString(),
      icon: <ClipboardCheck className="w-8 h-8 text-red-600" />,
      color: "bg-white",
    },
    {
      title: "In Progress",
      value: assignedJobs
        .filter((job) => job.status === "In Progress")
        .length.toString(),
      icon: <Bell className="w-8 h-8 text-red-600" />,
      color: "bg-white",
    },
  ];

  const tabs = [
    { id: "my-jobs", label: "My Jobs" },
    { id: "job-cards", label: "Job Cards" },
    { id: "schedule", label: "Today's Schedule" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <div className="container-custom py-8">
        {/* Dashboard Title */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Mechanic Dashboard
          </h1>
          <p className="text-gray-600 text-lg">
            Manage your assigned jobs and track your progress
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
            {activeTab === "my-jobs" && (
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-6">
                  Assigned Jobs
                </h3>

                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading assigned jobs...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {assignedJobs.map((job) => (
                      <div
                        key={job.id}
                        className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          {/* Left Column - Vehicle and Customer Info */}
                          <div className="space-y-4">
                            <div>
                              <h4 className="font-bold text-lg text-gray-900 mb-2">
                                Vehicle: {job.vehicleNumber}
                              </h4>
                              <div className="space-y-2 text-sm text-gray-600">
                                <p><span className="font-medium">Vehicle Details:</span> {job.vehicleDetails}</p>
                                <p><span className="font-medium">Vehicle Type:</span> {job.vehicleType}</p>
                                <p><span className="font-medium">Customer:</span> {job.customer}</p>
                                <p><span className="font-medium">Phone:</span> {job.customerPhone}</p>
                                <p><span className="font-medium">Scheduled Time Slot:</span> {job.scheduledTimeSlot}</p>
                              </div>
                            </div>
                          </div>

                          {/* Right Column - Services */}
                          <div className="space-y-4">
                            <div>
                              <h5 className="font-semibold text-gray-900 mb-2">Services Required:</h5>
                              <div className="flex flex-wrap gap-2">
                                {job.services.map((service, idx) => (
                                  <span
                                    key={idx}
                                    className="inline-flex items-center px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium"
                                  >
                                    <Wrench className="w-3 h-3 mr-1" />
                                    {service}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Status */}
                          <div className="flex flex-col justify-between">
                            <div className="text-right">
                              <span
                                className={`inline-flex px-3 py-1 rounded-full text-xs font-medium w-fit ${job.statusColor}`}
                              >
                                {job.status}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "job-cards" && (
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-6">
                  Job Cards
                </h3>
                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
                    <p className="text-gray-600 mt-4">Loading job cards...</p>
                  </div>
                ) : jobcards.length === 0 ? (
                  <div className="text-center py-12">
                    <ClipboardCheck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No job cards available</p>
                    <p className="text-gray-500 text-sm mt-2">
                      Job cards will appear here when assigned by Service
                      Advisor
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-6">
                    {jobcards.map((jobcard) => (
                      <div
                        key={jobcard.jobcardId}
                        className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
                      >
                        {/* Jobcard Header */}
                        <div className="bg-gradient-to-r from-red-50 to-orange-50 px-6 py-4 border-b border-gray-200">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="text-lg font-bold text-gray-900">
                                Job Card #{jobcard.jobcardId}
                              </h4>
                              <p className="text-sm text-gray-600 mt-1">
                                Booking #{jobcard.bookingId} •{" "}
                                {jobcard.vehicleNumber}
                              </p>
                            </div>
                            <div className="text-right">
                              <span
                                className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                                  jobcard.status === "completed"
                                    ? "bg-green-100 text-green-800"
                                    : jobcard.status === "in_progress"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : jobcard.status === "ready_for_review"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {jobcard.status.replace("_", " ").toUpperCase()}
                              </span>
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(
                                  jobcard.assignedAt
                                ).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Jobcard Body */}
                        <div className="px-6 py-4">
                          {/* Vehicle & Customer Info */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div className="flex items-start space-x-3">
                              <Car className="w-5 h-5 text-red-600 mt-1 flex-shrink-0" />
                              <div>
                                <p className="text-sm font-semibold text-gray-700">
                                  Vehicle
                                </p>
                                <p className="text-sm text-gray-900">
                                  {jobcard.vehicleBrand}{" "}
                                  {jobcard.vehicleBrandModel}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {jobcard.vehicleType}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-start space-x-3">
                              <User className="w-5 h-5 text-red-600 mt-1 flex-shrink-0" />
                              <div>
                                <p className="text-sm font-semibold text-gray-700">
                                  Customer
                                </p>
                                <p className="text-sm text-gray-900">
                                  {jobcard.customerName}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {jobcard.customerPhone}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Services */}
                          {jobcard.serviceTypes &&
                            Array.isArray(jobcard.serviceTypes) && (
                              <div className="mb-4">
                                <p className="text-sm font-semibold text-gray-700 mb-2">
                                  Services Required:
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {jobcard.serviceTypes.map((service, idx) => (
                                    <span
                                      key={idx}
                                      className="inline-flex items-center px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium"
                                    >
                                      <Wrench className="w-3 h-3 mr-1" />
                                      {service}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                          {/* Assigned Mechanics */}
                          {jobcard.assignedMechanics &&
                            jobcard.assignedMechanics.length > 0 && (
                              <div className="mb-4">
                                <p className="text-sm font-semibold text-gray-700 mb-2">
                                  Assigned Mechanics:
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {jobcard.assignedMechanics.map((mechanic) => (
                                    <span
                                      key={mechanic.mechanicId}
                                      className="inline-flex items-center px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-medium"
                                    >
                                      <User className="w-3 h-3 mr-1" />
                                      {mechanic.mechanicName} (
                                      {mechanic.mechanicCode})
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                          {/* Assigned Spare Parts */}
                          {jobcard.assignedSpareParts &&
                            jobcard.assignedSpareParts.length > 0 && (
                              <div className="mb-4">
                                <p className="text-sm font-semibold text-gray-700 mb-2">
                                  Spare Parts:
                                </p>
                                <div className="bg-gray-50 rounded-lg p-3">
                                  <div className="space-y-2">
                                    {jobcard.assignedSpareParts.map((part) => (
                                      <div
                                        key={part.partId}
                                        className="flex justify-between items-center text-xs"
                                      >
                                        <span className="flex items-center">
                                          <Package className="w-3 h-3 mr-2 text-gray-600" />
                                          <span className="font-medium">
                                            {part.partName}
                                          </span>
                                          <span className="text-gray-500 ml-2">
                                            ({part.partCode})
                                          </span>
                                        </span>
                                        <span className="text-gray-700">
                                          Qty: {part.quantity} • Rs.{" "}
                                          {parseFloat(part.totalPrice).toFixed(
                                            2
                                          )}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                  <div className="border-t border-gray-200 mt-3 pt-2">
                                    <div className="flex justify-between items-center font-semibold text-sm">
                                      <span>Total Parts Cost:</span>
                                      <span className="text-red-600">
                                        Rs.{" "}
                                        {parseFloat(
                                          jobcard.totalPartsCost
                                        ).toFixed(2)}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                          {/* Mechanic Notes Section */}
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <div className="flex items-center justify-between mb-3">
                              <h5 className="text-sm font-semibold text-gray-700">
                                My Notes:
                              </h5>
                              {!editingNotes[jobcard.jobcardId] && 
                               jobcard.status !== "completed" && 
                               jobcard.status !== "ready_for_review" && (
                                <button
                                  onClick={() => handleEditNotes(jobcard.jobcardId)}
                                  className="flex items-center gap-1 px-2 py-1 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                                >
                                  <Edit3 className="w-3 h-3" />
                                  {jobcard.mechanicNotes ? "Edit" : "Add Notes"}
                                </button>
                              )}
                            </div>

                            {editingNotes[jobcard.jobcardId] ? (
                              <div className="space-y-3">
                                <textarea
                                  value={notes[jobcard.jobcardId] || ""}
                                  onChange={(e) =>
                                    setNotes(prev => ({
                                      ...prev,
                                      [jobcard.jobcardId]: e.target.value
                                    }))
                                  }
                                  placeholder="Add your notes about this job..."
                                  className="w-full p-3 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                  rows={3}
                                />
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleSaveNotes(jobcard.jobcardId)}
                                    className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                                  >
                                    <Save className="w-3 h-3" />
                                    Save Notes
                                  </button>
                                  <button
                                    onClick={() => handleCancelEdit(jobcard.jobcardId)}
                                    className="flex items-center gap-1 px-3 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600"
                                  >
                                    <X className="w-3 h-3" />
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="bg-gray-50 rounded-lg p-3 min-h-[60px]">
                                {jobcard.mechanicNotes ? (
                                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                    {jobcard.mechanicNotes}
                                  </p>
                                ) : (
                                  <p className="text-sm text-gray-500 italic">
                                    No notes added yet
                                  </p>
                                )}
                                {jobcard.mechanicCompletedAt && (
                                  <p className="text-xs text-gray-500 mt-2">
                                    Completed: {new Date(jobcard.mechanicCompletedAt).toLocaleString()}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-3 mt-4 pt-4 border-t border-gray-200">
                            {/* Mechanics cannot update generic status; show only Mark Complete */}
                            <button
                              onClick={() =>
                                handleMarkComplete(jobcard.jobcardId)
                              }
                              disabled={
                                jobcard.status === "completed" ||
                                jobcard.status === "ready_for_review"
                              }
                              className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                jobcard.status === "completed" ||
                                jobcard.status === "ready_for_review"
                                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                  : "bg-green-600 text-white hover:bg-green-700"
                              }`}
                            >
                              {jobcard.status === "completed"
                                ? "Completed ✓"
                                : jobcard.status === "ready_for_review"
                                ? "Awaiting Review"
                                : "Mark Complete"}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "schedule" && (
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-6">
                  Today's Schedule
                </h3>
                <div className="text-center py-12">
                  <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">
                    No schedule available for today
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MechanicDashboard;
