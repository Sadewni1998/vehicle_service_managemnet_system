import { useState, useEffect } from 'react'
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
  User
} from 'lucide-react'
import { serviceAdvisorAPI } from '../utils/api'

const ServiceAdvisorDashboard = () => {
  const [activeTab, setActiveTab] = useState('assign-jobs')
  const [loading, setLoading] = useState(true)
  const [arrivedBookings, setArrivedBookings] = useState([])
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [showBookingDetails, setShowBookingDetails] = useState(false)

  // Fetch arrived bookings when component mounts or when assign-jobs tab is active
  useEffect(() => {
    if (activeTab === 'assign-jobs') {
      fetchArrivedBookings()
    }
  }, [activeTab])

  const fetchArrivedBookings = async () => {
    try {
      setLoading(true)
      const response = await serviceAdvisorAPI.getArrivedBookings()
      setArrivedBookings(response.data)
    } catch (error) {
      console.error('Error fetching arrived bookings:', error)
      // Use mock data if API fails
      setArrivedBookings([
        {
          id: 1,
          timeSlot: '12:00-14:00',
          vehicleNumber: 'DEF-456',
          customer: 'Michael Chen',
          status: 'arrived',
          arrivedTime: '07:45',
          phone: '0775555555',
          vehicleType: 'Hatchback',
          vehicleBrand: 'Nissan',
          vehicleBrandModel: 'Micra',
          manufacturedYear: 2021,
          fuelType: 'Petrol',
          transmissionType: 'Manual',
          kilometersRun: 28000,
          serviceTypes: ['Regular Service', 'Battery Check'],
          specialRequests: 'Replace air filter'
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const viewBookingDetails = (booking) => {
    setSelectedBooking(booking)
    setShowBookingDetails(true)
  }

  const summaryCards = [
    {
      title: 'Available Mechanics',
      value: '8',
      icon: <UsersRound className="w-8 h-8 text-red-600" />,
      color: 'bg-white'
    },
    {
      title: 'Pending JobCard Reviews',
      value: '8',
      icon: <Clipboard className="w-8 h-8 text-red-600" />,
      color: 'bg-white'
    },
    {
      title: 'Assigned Jobs',
      value: '12',
      icon: <Wrench className="w-8 h-8 text-red-600" />,
      color: 'bg-white'
    },
    {
      title: 'Jobs Done Today',
      value: '12',
      icon: <ClipboardCheck className="w-8 h-8 text-red-600" />,
      color: 'bg-white'
    }
  ]

  const tabs = [
    { id: 'assign-jobs', label: 'Assign jobs' },
    { id: 'job-cards', label: 'Job cards' },
    { id: 'schedule', label: 'Schedule' },
    { id: 'all-mechanics', label: 'All mechanics' },
  ]

  const jobCards = [
    {
      id: 1,
      jobId: 'JC-001',
      vehicle: 'ABC1234',
      serviceType: 'Oil Change Service',
      mechanic: 'John Doe',
      reviewButton: 'Review',
      approveButton: 'Approve'
    },
    {
      id: 2,
      jobId: 'JC-002',
      vehicle: 'XYZ9876',
      serviceType: 'Brake Service',
      mechanic: 'Jane Smith',
      reviewButton: 'Review',
      approveButton: 'Approve'
    }
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading ServiceAdvisor Dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <div className="container-custom py-8">
        {/* Dashboard Title */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Service Advisor Dashboard</h1>
          <p className="text-gray-600 text-lg">Manage job assignments and review work orders</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {summaryCards.map((card, index) => (
            <div key={index} className={`${card.color} rounded-lg border border-gray-200 p-6 shadow-sm`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{card.value}</p>
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
                    ? 'bg-gray-100 text-gray-900 border-b-2 border-red-600'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'assign-jobs' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900">Assign Jobs</h3>
                </div>
                
                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading arrived bookings...</p>
                  </div>
                ) : arrivedBookings.length === 0 ? (
                  <div className="text-center py-12">
                    <Car className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No arrived bookings to assign</p>
                    <p className="text-gray-500 text-sm mt-2">Bookings will appear here when receptionist marks them as arrived</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {arrivedBookings.map((booking) => (
                      <div key={booking.id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="flex items-center gap-2">
                                <Car className="w-5 h-5 text-gray-500" />
                                <span className="font-bold text-gray-900">{booking.vehicleNumber}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-gray-500" />
                                <span className="text-gray-700">{booking.customer}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-gray-500" />
                                <span className="text-gray-700">Arrived: {booking.arrivedTime}</span>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                              <div>
                                <p className="text-sm text-gray-600">Time Slot</p>
                                <p className="font-medium">{booking.timeSlot}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600">Vehicle Type</p>
                                <p className="font-medium">{booking.vehicleType}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600">Services</p>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {booking.serviceTypes.map((service, index) => (
                                    <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                                      {service}
                                    </span>
                                  ))}
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
                                <p className="text-sm text-gray-600">Special Requests</p>
                                <p className="text-gray-700 bg-gray-50 p-2 rounded text-sm">{booking.specialRequests}</p>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex flex-col gap-2 ml-4">
                            <button
                              onClick={() => viewBookingDetails(booking)}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                            >
                              <Eye className="w-4 h-4" />
                              View Details
                            </button>
                            <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                              Assign Mechanics
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'job-cards' && (
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-6">Job Cards for Review</h3>
                
                <div className="space-y-4">
                  {jobCards.map((job) => (
                    <div key={job.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-900 mb-1">
                            Job #{job.jobId} - {job.vehicle}
                          </h4>
                          <p className="text-gray-600 mb-1">{job.serviceType}</p>
                          <p className="text-gray-600 text-sm">Mechanic: {job.mechanic}</p>
                        </div>
                        <div className="flex items-center space-x-3">
                          <button className="px-4 py-2 rounded-full text-xs font-medium bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors">
                            {job.reviewButton}
                          </button>
                          <button className="px-4 py-2 rounded-full text-xs font-medium bg-red-600 hover:bg-red-700 text-white transition-colors">
                            {job.approveButton}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'schedule' && (
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-6">Schedule</h3>
                <div className="text-center py-12">
                  <CheckCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Schedule management features coming soon</p>
                </div>
              </div>
            )}

            {activeTab === 'all-mechanics' && (
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-6">All Mechanics</h3>
                <div className="text-center py-12">
                  <Wrench className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">All mechanics features coming soon</p>
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
              <h3 className="text-xl font-bold text-gray-900">Booking Details</h3>
              <button
                onClick={() => setShowBookingDetails(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              {/* Customer Information */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Customer Information</h4>
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
                <h4 className="font-semibold text-gray-900 mb-3">Vehicle Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Vehicle Number</p>
                    <p className="font-medium">{selectedBooking.vehicleNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Vehicle Type</p>
                    <p className="font-medium">{selectedBooking.vehicleType}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Brand & Model</p>
                    <p className="font-medium">{selectedBooking.vehicleBrand} {selectedBooking.vehicleBrandModel}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Year</p>
                    <p className="font-medium">{selectedBooking.manufacturedYear}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Fuel Type</p>
                    <p className="font-medium">{selectedBooking.fuelType}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Transmission</p>
                    <p className="font-medium">{selectedBooking.transmissionType}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Kilometers Run</p>
                    <p className="font-medium">{selectedBooking.kilometersRun?.toLocaleString()} km</p>
                  </div>
                </div>
              </div>

              {/* Booking Information */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Booking Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Time Slot</p>
                    <p className="font-medium">{selectedBooking.timeSlot}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Arrived Time</p>
                    <p className="font-medium text-green-600">{selectedBooking.arrivedTime}</p>
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
                <h4 className="font-semibold text-gray-900 mb-3">Services Required</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedBooking.serviceTypes?.map((service, index) => (
                    <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                      {service}
                    </span>
                  ))}
                </div>
              </div>

              {/* Special Requests */}
              {selectedBooking.specialRequests && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Special Requests</h4>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded">{selectedBooking.specialRequests}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowBookingDetails(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors">
                Assign Mechanics
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ServiceAdvisorDashboard
