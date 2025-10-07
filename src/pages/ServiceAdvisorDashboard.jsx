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
import { serviceAdvisorAPI, mechanicsAPI, sparePartsAPI } from '../utils/api'

const ServiceAdvisorDashboard = () => {
  const [activeTab, setActiveTab] = useState('assign-jobs')
  const [loading, setLoading] = useState(true)
  const [arrivedBookings, setArrivedBookings] = useState([])
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [showBookingDetails, setShowBookingDetails] = useState(false)
  const [showAssignMechanics, setShowAssignMechanics] = useState(false)
  const [showAssignSpareParts, setShowAssignSpareParts] = useState(false)
  const [availableMechanics, setAvailableMechanics] = useState([])
  const [availableSpareParts, setAvailableSpareParts] = useState([])
  const [selectedMechanics, setSelectedMechanics] = useState([])
  const [selectedSpareParts, setSelectedSpareParts] = useState([])
  const [submittedBookings, setSubmittedBookings] = useState([])
  const [mechanicSearchTerm, setMechanicSearchTerm] = useState('')
  const [mechanicSpecializationFilter, setMechanicSpecializationFilter] = useState('')

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

  const openAssignMechanics = async (booking) => {
    setSelectedBooking(booking)
    try {
      const response = await mechanicsAPI.getAvailableMechanics()
      setAvailableMechanics(response.data.data || [])
      setSelectedMechanics([])
      setMechanicSearchTerm('')
      setMechanicSpecializationFilter('')
      setShowAssignMechanics(true)
    } catch (error) {
      console.error('Error fetching mechanics:', error)
      // Use mock data if API fails
      setAvailableMechanics([
        {
          mechanicId: 1,
          staffId: 4,
          mechanicCode: 'MEC001',
          mechanicName: 'Sarah',
          staffName: 'Sarah Johnson',
          email: 'sarah.johnson@vehicleservice.com',
          specialization: 'Engine and Transmission',
          experience: 5,
          certifications: ['ASE Certified', 'Engine Specialist'],
          availability: 'Available',
          hourlyRate: 2500.00,
          isActive: true
        },
        {
          mechanicId: 2,
          staffId: 5,
          mechanicCode: 'MEC002',
          mechanicName: 'John',
          staffName: 'John Smith',
          email: 'john.smith@vehicleservice.com',
          specialization: 'Electrical Systems',
          experience: 3,
          certifications: ['Auto Electrician', 'Hybrid Systems'],
          availability: 'Available',
          hourlyRate: 2200.00,
          isActive: true
        },
        {
          mechanicId: 3,
          staffId: 6,
          mechanicCode: 'MEC003',
          mechanicName: 'Mike',
          staffName: 'Mike Wilson',
          email: 'mike.wilson@vehicleservice.com',
          specialization: 'Brake Systems',
          experience: 4,
          certifications: ['Brake Specialist', 'Safety Certified'],
          availability: 'Available',
          hourlyRate: 2300.00,
          isActive: true
        },
        {
          mechanicId: 4,
          staffId: 7,
          mechanicCode: 'MEC004',
          mechanicName: 'Lisa',
          staffName: 'Lisa Brown',
          email: 'lisa.brown@vehicleservice.com',
          specialization: 'Air Conditioning',
          experience: 2,
          certifications: ['AC Technician'],
          availability: 'Busy',
          hourlyRate: 2000.00,
          isActive: true
        }
      ])
      setSelectedMechanics([])
      setMechanicSearchTerm('')
      setMechanicSpecializationFilter('')
      setShowAssignMechanics(true)
    }
  }

  const openAssignSpareParts = async (booking) => {
    setSelectedBooking(booking)
    try {
      const response = await sparePartsAPI.getAllSpareParts()
      setAvailableSpareParts(response.data.data || [])
      setSelectedSpareParts([])
      setShowAssignSpareParts(true)
    } catch (error) {
      console.error('Error fetching spare parts:', error)
      setAvailableSpareParts([])
      setShowAssignSpareParts(true)
    }
  }

  const handleAssignMechanics = async () => {
    if (selectedMechanics.length === 0) {
      alert('Please select at least one mechanic')
      return
    }

    try {
      const mechanicIds = selectedMechanics.map(m => m.mechanicId)
      await serviceAdvisorAPI.assignMechanicsToBooking(selectedBooking.id, mechanicIds)
      
      // Update local state to show assigned mechanics
      setArrivedBookings(prev => prev.map(booking => 
        booking.id === selectedBooking.id 
          ? { ...booking, assignedMechanics: mechanicIds }
          : booking
      ))
      
      alert('Mechanics assigned successfully!')
      setShowAssignMechanics(false)
    } catch (error) {
      console.error('Error assigning mechanics:', error)
      alert('Failed to assign mechanics: ' + (error.response?.data?.message || error.message))
    }
  }

  const handleAssignSpareParts = async () => {
    if (selectedSpareParts.length === 0) {
      alert('Please select at least one spare part')
      return
    }

    try {
      const spareParts = selectedSpareParts.map(sp => ({
        partId: sp.partId,
        quantity: sp.quantity || 1
      }))
      await serviceAdvisorAPI.assignSparePartsToBooking(selectedBooking.id, spareParts)
      
      // Update local state to show assigned spare parts
      setArrivedBookings(prev => prev.map(booking => 
        booking.id === selectedBooking.id 
          ? { ...booking, assignedSpareParts: spareParts }
          : booking
      ))
      
      alert('Spare parts assigned successfully!')
      setShowAssignSpareParts(false)
    } catch (error) {
      console.error('Error assigning spare parts:', error)
      alert('Failed to assign spare parts: ' + (error.response?.data?.message || error.message))
    }
  }

  const handleSubmitJob = async (booking) => {
    try {
      // Check if mechanics and spare parts are assigned
      if (!booking.assignedMechanics || booking.assignedMechanics.length === 0) {
        alert('Please assign mechanics before submitting the job')
        return
      }

      if (!booking.assignedSpareParts || booking.assignedSpareParts.length === 0) {
        alert('Please assign spare parts before submitting the job')
        return
      }

      // Update jobcard status to 'in_progress' in the database
      await serviceAdvisorAPI.updateBookingStatus(booking.id, 'in_progress')
      
      // Add to submitted bookings list
      setSubmittedBookings(prev => [...prev, booking.id])
      
      alert('Job submitted successfully! The jobcard has been updated in the database.')
      
    } catch (error) {
      console.error('Error submitting job:', error)
      alert('Failed to submit job: ' + (error.response?.data?.message || error.message))
    }
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
                    {arrivedBookings.map((booking) => {
                      const isSubmitted = submittedBookings.includes(booking.id)
                      return (
                      <div key={booking.id} className={`bg-white border rounded-lg p-6 shadow-sm ${isSubmitted ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
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
                            
                            {/* Assignment Status */}
                            <div className="mb-4">
                              <div className="flex flex-wrap gap-4">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-gray-600">Mechanics:</span>
                                  {booking.assignedMechanics && booking.assignedMechanics.length > 0 ? (
                                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                                      {booking.assignedMechanics.length} assigned
                                    </span>
                                  ) : (
                                    <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs">
                                      Not assigned
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-gray-600">Spare Parts:</span>
                                  {booking.assignedSpareParts && booking.assignedSpareParts.length > 0 ? (
                                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                                      {booking.assignedSpareParts.length} assigned
                                    </span>
                                  ) : (
                                    <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs">
                                      Not assigned
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
                      )
                    })}
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

              {/* Assignment Status */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Assignment Status</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Mechanics Assigned</p>
                    {selectedBooking.assignedMechanics && selectedBooking.assignedMechanics.length > 0 ? (
                      <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                        {selectedBooking.assignedMechanics.length} mechanics assigned
                      </span>
                    ) : (
                      <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm">
                        No mechanics assigned
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Spare Parts Assigned</p>
                    {selectedBooking.assignedSpareParts && selectedBooking.assignedSpareParts.length > 0 ? (
                      <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                        {selectedBooking.assignedSpareParts.length} parts assigned
                      </span>
                    ) : (
                      <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm">
                        No spare parts assigned
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
                  setShowBookingDetails(false)
                  openAssignMechanics(selectedBooking)
                }}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                Assign Mechanics
              </button>
              <button 
                onClick={() => {
                  setShowBookingDetails(false)
                  openAssignSpareParts(selectedBooking)
                }}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                Assign Spare-parts
              </button>
              <button 
                onClick={() => {
                  setShowBookingDetails(false)
                  handleSubmitJob(selectedBooking)
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
              <h3 className="text-xl font-bold text-gray-900">Assign Mechanics to {selectedBooking.vehicleNumber}</h3>
              <button
                onClick={() => setShowAssignMechanics(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-gray-600">Select mechanics to assign to this booking:</p>
                {selectedMechanics.length > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                    <span className="text-sm font-medium text-green-800">
                      {selectedMechanics.length} mechanic{selectedMechanics.length !== 1 ? 's' : ''} selected
                    </span>
                  </div>
                )}
              </div>
              
              {selectedMechanics.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">Selected Mechanics:</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedMechanics.map((mechanic) => (
                      <span key={mechanic.mechanicId} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                        {mechanic.mechanicName || mechanic.name} ({mechanic.mechanicCode})
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
                    onChange={(e) => setMechanicSpecializationFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="">All Specializations</option>
                    {[...new Set(availableMechanics.map(m => m.specialization))].map(spec => (
                      <option key={spec} value={spec}>{spec}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                {availableMechanics
                  .filter(mechanic => {
                    const matchesSearch = mechanicSearchTerm === '' || 
                      (mechanic.mechanicName && mechanic.mechanicName.toLowerCase().includes(mechanicSearchTerm.toLowerCase())) ||
                      (mechanic.name && mechanic.name.toLowerCase().includes(mechanicSearchTerm.toLowerCase())) ||
                      mechanic.mechanicCode.toLowerCase().includes(mechanicSearchTerm.toLowerCase())
                    const matchesSpecialization = mechanicSpecializationFilter === '' || 
                      mechanic.specialization === mechanicSpecializationFilter
                    return matchesSearch && matchesSpecialization
                  })
                  .map((mechanic) => (
                  <div key={mechanic.mechanicId} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <label className="flex items-start space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedMechanics.some(m => m.mechanicId === mechanic.mechanicId)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedMechanics([...selectedMechanics, mechanic])
                          } else {
                            setSelectedMechanics(selectedMechanics.filter(m => m.mechanicId !== mechanic.mechanicId))
                          }
                        }}
                        className="mt-1 w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-semibold text-gray-900 text-lg">{mechanic.mechanicName || mechanic.name}</div>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            mechanic.availability === 'Available' 
                              ? 'bg-green-100 text-green-800' 
                              : mechanic.availability === 'Busy'
                              ? 'bg-red-100 text-red-800'
                              : mechanic.availability === 'On Break'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {mechanic.availability}
                          </span>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-600">Code:</span>
                            <span className="text-sm text-gray-900 font-mono bg-gray-100 px-2 py-1 rounded">{mechanic.mechanicCode}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-600">Specialization:</span>
                            <span className="text-sm text-blue-600 font-medium">{mechanic.specialization}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-600">Experience:</span>
                            <span className="text-sm text-gray-900">{mechanic.experience} years</span>
                          </div>
                          
                          {mechanic.hourlyRate && (
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-600">Hourly Rate:</span>
                              <span className="text-sm text-green-600 font-medium">Rs. {mechanic.hourlyRate.toLocaleString()}</span>
                            </div>
                          )}
                          
                          {mechanic.certifications && (
                            <div className="mt-2">
                              <span className="text-sm font-medium text-gray-600">Certifications:</span>
                              <div className="mt-1">
                                {typeof mechanic.certifications === 'string' ? (
                                  <span className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded">
                                    {mechanic.certifications}
                                  </span>
                                ) : (
                                  <div className="flex flex-wrap gap-1">
                                    {mechanic.certifications.map((cert, index) => (
                                      <span key={index} className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded">
                                        {cert}
                                      </span>
                                    ))}
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

              {availableMechanics.filter(mechanic => {
                const matchesSearch = mechanicSearchTerm === '' || 
                  (mechanic.mechanicName && mechanic.mechanicName.toLowerCase().includes(mechanicSearchTerm.toLowerCase())) ||
                  (mechanic.name && mechanic.name.toLowerCase().includes(mechanicSearchTerm.toLowerCase())) ||
                  mechanic.mechanicCode.toLowerCase().includes(mechanicSearchTerm.toLowerCase())
                const matchesSpecialization = mechanicSpecializationFilter === '' || 
                  mechanic.specialization === mechanicSpecializationFilter
                return matchesSearch && matchesSpecialization
              }).length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  {availableMechanics.length === 0 
                    ? 'No available mechanics found' 
                    : 'No mechanics match your search criteria'
                  }
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
              <h3 className="text-xl font-bold text-gray-900">Assign Spare Parts to {selectedBooking.vehicleNumber}</h3>
              <button
                onClick={() => setShowAssignSpareParts(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-gray-600">Select spare parts to assign to this booking:</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                {availableSpareParts.map((part) => (
                  <div key={part.partId} className="border rounded-lg p-4">
                    <label className="flex items-start space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedSpareParts.some(sp => sp.partId === part.partId)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedSpareParts([...selectedSpareParts, { ...part, quantity: 1 }])
                          } else {
                            setSelectedSpareParts(selectedSpareParts.filter(sp => sp.partId !== part.partId))
                          }
                        }}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{part.partName}</div>
                        <div className="text-sm text-gray-600">Code: {part.partCode}</div>
                        <div className="text-sm text-gray-600">Category: {part.category}</div>
                        <div className="text-sm text-gray-600">Price: ${part.unitPrice}</div>
                        <div className="text-sm text-gray-600">Stock: {part.stockQuantity}</div>
                        
                        {selectedSpareParts.some(sp => sp.partId === part.partId) && (
                          <div className="mt-2">
                            <label className="text-sm text-gray-600">Quantity:</label>
                            <input
                              type="number"
                              min="1"
                              max={part.stockQuantity}
                              value={selectedSpareParts.find(sp => sp.partId === part.partId)?.quantity || 1}
                              onChange={(e) => {
                                const quantity = parseInt(e.target.value) || 1
                                setSelectedSpareParts(selectedSpareParts.map(sp => 
                                  sp.partId === part.partId ? { ...sp, quantity } : sp
                                ))
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
    </div>
  )
}

export default ServiceAdvisorDashboard
