import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  Calendar, 
  Car, 
  DollarSign, 
  ShoppingCart, 
  Plus,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { bookingsAPI } from '../utils/api'
import toast from 'react-hot-toast'

const CustomerDashboard = () => {
  const [activeTab, setActiveTab] = useState('appointments')
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { user } = useAuth()

  // Fetch user bookings on component mount
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true)
        const response = await bookingsAPI.getUserBookings()
        setBookings(response.data || [])
        setError(null)
      } catch (err) {
        console.error('Error fetching bookings:', err)
        setError('Failed to load bookings')
        toast.error('Failed to load your bookings')
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchBookings()
    }
  }, [user])

  // Calculate summary statistics
  const activeBookings = bookings.filter(booking => 
    ['Pending', 'Confirmed', 'In Progress'].includes(booking.status)
  ).length

  const summaryCards = [
    {
      title: 'Active Bookings',
      value: activeBookings.toString(),
      icon: <Calendar className="w-8 h-8 text-red-600" />,
      color: 'bg-white'
    },
    {
      title: 'Total Bookings',
      value: bookings.length.toString(),
      icon: <Car className="w-8 h-8 text-red-600" />,
      color: 'bg-white'
    },
    {
      title: 'Completed',
      value: bookings.filter(b => b.status === 'Completed').length.toString(),
      icon: <CheckCircle className="w-8 h-8 text-red-600" />,
      color: 'bg-white'
    },
    {
      title: 'Pending',
      value: bookings.filter(b => b.status === 'Pending').length.toString(),
      icon: <Clock className="w-8 h-8 text-red-600" />,
      color: 'bg-white'
    }
  ]

  const tabs = [
    { id: 'appointments', label: 'Appointments' },
    { id: 'vehicles', label: 'Vehicles' },
    { id: 'service-history', label: 'Service History' },
    { id: 'bills', label: 'Bills' },
    { id: 'e-shop', label: 'E-Shop' }
  ]

  // Helper function to get status color
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'confirmed':
        return 'bg-blue-100 text-blue-800'
      case 'in progress':
        return 'bg-purple-100 text-purple-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // Helper function to format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Date not set'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // Helper function to parse service types
  const parseServiceTypes = (serviceTypes) => {
    if (!serviceTypes) return 'No services specified'
    try {
      const services = typeof serviceTypes === 'string' ? JSON.parse(serviceTypes) : serviceTypes
      return Array.isArray(services) ? services.join(', ') : 'No services specified'
    } catch {
      return 'No services specified'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <div className="container-custom py-8">
        {/* Dashboard Title */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Customer Dashboard</h1>
          <p className="text-gray-600 text-lg">Manage your appointments, vehicles, and service history</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {summaryCards.map((card, index) => (
            <div key={index} className={`${card.color} rounded-lg border border-gray-200 p-6 shadow-sm`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                </div>
                <div className="flex-shrink-0">
                  {card.icon}
                </div>
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
            {activeTab === 'appointments' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900">My Bookings</h3>
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
                    <span className="ml-2 text-gray-600">Loading your bookings...</span>
                  </div>
                ) : error ? (
                  <div className="text-center py-12">
                    <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button 
                      onClick={() => window.location.reload()} 
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
                      <div key={booking.bookingId} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <h4 className="font-bold text-gray-900 mb-2">
                              {parseServiceTypes(booking.serviceTypes)} - {booking.vehicleNumber}
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                              <div>
                                <p><span className="font-medium">Date:</span> {formatDate(booking.bookingDate)}</p>
                                <p><span className="font-medium">Time:</span> {booking.timeSlot || 'Not specified'}</p>
                                <p><span className="font-medium">Vehicle:</span> {booking.vehicleBrand} {booking.vehicleBrandModel}</p>
                              </div>
                              <div>
                                <p><span className="font-medium">Contact:</span> {booking.phone}</p>
                                <p><span className="font-medium">Year:</span> {booking.manufacturedYear || 'Not specified'}</p>
                                <p><span className="font-medium">Fuel Type:</span> {booking.fuelType || 'Not specified'}</p>
                              </div>
                            </div>
                            {booking.specialRequests && (
                              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                <p className="text-sm"><span className="font-medium">Special Requests:</span> {booking.specialRequests}</p>
                              </div>
                            )}
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                            {booking.status}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          Booking ID: {booking.bookingId} • Created: {formatDate(booking.createdAt)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'vehicles' && (
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-6">My Vehicles</h3>
                <div className="text-center py-12">
                  <Car className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No vehicles registered yet</p>
                  <button className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                    Add Vehicle
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'service-history' && (
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-6">Service History</h3>
                <div className="text-center py-12">
                  <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No service history available</p>
                </div>
              </div>
            )}

            {activeTab === 'bills' && (
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-6">Bills & Invoices</h3>
                <div className="text-center py-12">
                  <DollarSign className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No bills available</p>
                </div>
              </div>
            )}

            {activeTab === 'e-shop' && (
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
  )
}

export default CustomerDashboard
