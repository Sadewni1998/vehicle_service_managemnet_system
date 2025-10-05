import { useState, useEffect } from 'react'
import { 
  Car, 
  Clock, 
  CheckCircle, 
  XCircle,
  Search,
  AlertCircle
} from 'lucide-react'
import { receptionistAPI } from '../utils/api'

const ReceptionistDashboard = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Get current date
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  // Fetch today's bookings on component mount
  useEffect(() => {
    const fetchTodayBookings = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await receptionistAPI.getTodayBookings()
        setVehicles(response.data)
      } catch (err) {
        console.error('Error fetching today\'s bookings:', err)
        setError('Failed to load today\'s bookings. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchTodayBookings()
  }, [])

  // Calculate summary statistics
  const totalScheduled = vehicles.length
  const pendingCount = vehicles.filter(v => v.status === 'pending').length
  const arrivedCount = vehicles.filter(v => v.status === 'arrived').length
  const cancelledCount = vehicles.filter(v => v.status === 'cancelled').length

  // Filter vehicles based on search term and status filter
  const filteredVehicles = vehicles.filter(vehicle => {
    const matchesSearch = vehicle.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterStatus === 'all' || vehicle.status === filterStatus
    return matchesSearch && matchesFilter
  })

  // Mark vehicle as arrived
  const markAsArrived = async (vehicleId) => {
    try {
      const currentTime = new Date().toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: false
      })
      
      // Update status in backend
      await receptionistAPI.updateBookingStatus(vehicleId, 'arrived')
      
      // Update local state
      setVehicles(prevVehicles =>
        prevVehicles.map(vehicle =>
          vehicle.id === vehicleId
            ? { ...vehicle, status: 'arrived', arrivedTime: currentTime }
            : vehicle
        )
      )
    } catch (err) {
      console.error('Error updating booking status:', err)
      setError('Failed to update booking status. Please try again.')
    }
  }

  // Get status badge styling
  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'arrived':
        return 'bg-green-100 text-green-800'
      case 'confirmed':
        return 'bg-blue-100 text-blue-800'
      case 'in_progress':
        return 'bg-purple-100 text-purple-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // Get action button
  const getActionButton = (vehicle) => {
    if (vehicle.status === 'pending') {
      return (
        <button
          onClick={() => markAsArrived(vehicle.id)}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          Mark Arrived
        </button>
      )
    } else if (vehicle.status === 'arrived') {
      return (
        <button
          disabled
          className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium opacity-75 cursor-not-allowed"
        >
          Checked In
        </button>
      )
    } else if (vehicle.status === 'cancelled') {
      return (
        <button
          disabled
          className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium opacity-75 cursor-not-allowed"
        >
          Cancelled
        </button>
      )
    } else if (vehicle.status === 'completed') {
      return (
        <button
          disabled
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium opacity-75 cursor-not-allowed"
        >
          Completed
        </button>
      )
    } else if (vehicle.status === 'in_progress') {
      return (
        <button
          disabled
          className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium opacity-75 cursor-not-allowed"
        >
          In Progress
        </button>
      )
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <div className="container-custom py-8">
        {/* Dashboard Title */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Receptionist Dashboard</h1>
          <p className="text-gray-600 text-lg">{currentDate}</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Scheduled</p>
                <p className="text-2xl font-bold text-gray-900">{totalScheduled}</p>
              </div>
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center">
                  <Car className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{pendingCount}</p>
              </div>
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center">
                  <Clock className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Arrived</p>
                <p className="text-2xl font-bold text-gray-900">{arrivedCount}</p>
              </div>
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Cancelled</p>
                <p className="text-2xl font-bold text-gray-900">{cancelledCount}</p>
              </div>
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search Bar */}
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search by vehicle number"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-4 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent"
              />
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>

            {/* Filter Buttons */}
            <div className="flex space-x-2">
              {[
                { id: 'all', label: 'All' },
                { id: 'pending', label: 'Pending' },
                { id: 'arrived', label: 'Arrived' },
                { id: 'cancelled', label: 'Cancelled' }
              ].map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setFilterStatus(filter.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    filterStatus === filter.id
                      ? 'bg-gray-900 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
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

        {/* Scheduled Vehicles Table */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-xl font-bold text-gray-900">Scheduled Vehicles</h3>
          </div>
          
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading today's bookings...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Time Slot
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vehicle Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Arrived Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredVehicles.map((vehicle) => (
                    <tr key={vehicle.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {vehicle.timeSlot}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {vehicle.vehicleNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {vehicle.customer}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(vehicle.status)}`}>
                          {vehicle.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {vehicle.arrivedTime || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {getActionButton(vehicle)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && filteredVehicles.length === 0 && (
            <div className="text-center py-12">
              <Car className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No vehicles found matching your criteria</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ReceptionistDashboard
