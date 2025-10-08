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
} from "lucide-react";
import { jobcardAPI } from "../utils/api";
import { useAuth } from "../context/AuthContext";

const MechanicDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("my-jobs");
  const [assignedJobs, setAssignedJobs] = useState([]);
  const [jobcards, setJobcards] = useState([]);
  const [loading, setLoading] = useState(true);

  // Mock data for when API is not available
  const mockJobs = [
    {
      id: 1,
      service: "Oil Change",
      vehicle: "ABC1234",
      vehicleModel: "Toyota Prius 2020",
      customer: "John Doe",
      scheduledTime: "10:00 AM",
      status: "In Progress",
      statusColor: "bg-yellow-500 text-white",
      actionButton: "Update Status",
      actionButtonColor: "bg-red-600 hover:bg-red-700 text-white",
    },
    {
      id: 2,
      service: "Brake Service",
      vehicle: "XYZ9876",
      vehicleModel: "Honda Civic 2019",
      customer: "Jane Smith",
      scheduledTime: "2:00 PM",
      status: "Scheduled",
      statusColor: "bg-blue-100 text-blue-800",
      actionButton: "View Details",
      actionButtonColor:
        "bg-white hover:bg-gray-50 text-gray-700 border border-gray-300",
    },
    {
      id: 3,
      service: "Engine Diagnostic",
      vehicle: "DEF5555",
      vehicleModel: "Nissan Altima 2021",
      customer: "Bob Johnson",
      scheduledTime: "3:30 PM",
      status: "Completed",
      statusColor: "bg-green-100 text-green-800",
      actionButton: "View Report",
      actionButtonColor: "bg-green-600 hover:bg-green-700 text-white",
    },
  ];

  // Load jobs data and jobcards
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // For now, use mock data for assigned jobs
        setAssignedJobs(mockJobs);

        // Fetch real jobcards from API if user is logged in
        if (user && user.mechanicId) {
          console.log("Fetching jobcards for mechanic:", user.mechanicId);
          const response = await jobcardAPI.getMechanicJobcards(
            user.mechanicId
          );
          console.log("Jobcards response:", response.data);
          setJobcards(response.data.data || []);
        } else {
          console.warn("No mechanic ID found in user object");
          setJobcards([]);
        }
      } catch (error) {
        console.error("Error loading jobcards:", error);
        console.warn("Using empty jobcards array");
        setJobcards([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  // Handle jobcard status update
  const handleUpdateStatus = async (jobcardId, newStatus) => {
    try {
      await jobcardAPI.updateJobcardStatus(jobcardId, newStatus);

      // Update local state
      setJobcards((prev) =>
        prev.map((jc) =>
          jc.jobcardId === jobcardId
            ? {
                ...jc,
                status: newStatus,
                completedAt:
                  newStatus === "completed" ? new Date() : jc.completedAt,
              }
            : jc
        )
      );

      alert(`Job card status updated to ${newStatus.replace("_", " ")}!`);
    } catch (error) {
      console.error("Error updating jobcard status:", error);
      alert(
        "Failed to update jobcard status: " +
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
                        className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-bold text-gray-900 mb-1">
                              {job.service} - {job.vehicle}
                            </h4>
                            <div className="space-y-1 text-sm text-gray-600">
                              <p>{job.vehicleModel}</p>
                              <p>Customer: {job.customer}</p>
                              <p>Scheduled: {job.scheduledTime}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${job.statusColor}`}
                            >
                              {job.status}
                            </span>
                            <button
                              className={`px-4 py-2 rounded-full text-xs font-medium transition-colors ${job.actionButtonColor}`}
                            >
                              {job.actionButton}
                            </button>
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

                          {/* Action Buttons */}
                          <div className="flex gap-3 mt-4 pt-4 border-t border-gray-200">
                            <button
                              onClick={() =>
                                handleUpdateStatus(
                                  jobcard.jobcardId,
                                  "in_progress"
                                )
                              }
                              disabled={jobcard.status === "completed"}
                              className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                jobcard.status === "completed"
                                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                  : "bg-yellow-600 text-white hover:bg-yellow-700"
                              }`}
                            >
                              Mark In Progress
                            </button>
                            <button
                              onClick={() =>
                                handleUpdateStatus(
                                  jobcard.jobcardId,
                                  "completed"
                                )
                              }
                              disabled={jobcard.status === "completed"}
                              className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                jobcard.status === "completed"
                                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                  : "bg-green-600 text-white hover:bg-green-700"
                              }`}
                            >
                              {jobcard.status === "completed"
                                ? "Completed ✓"
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
