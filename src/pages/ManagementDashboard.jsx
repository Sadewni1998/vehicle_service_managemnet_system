import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  Users, 
  DollarSign, 
  User, 
  Calendar,
  TrendingUp,
  AlertCircle,
  CheckCircle
} from 'lucide-react'

const ManagementDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview')
  const [dashboardData, setDashboardData] = useState({
    totalCustomers: 1234,
    todayRevenue: 125000,
    staffMembers: 25,
    activeBookings: 48,
    dailyBookingLimit: 35,
    maxDailyBookings: 50,
    pendingBreakdowns: 3,
    inProgressBreakdowns: 5
  })
  const [loading, setLoading] = useState(true)

  // Load dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true)
      try {
        // Try to fetch from API first (when database is available)
        // For now, use mock data
        setDashboardData({
          totalCustomers: 1234,
          todayRevenue: 125000,
          staffMembers: 25,
          activeBookings: 48,
          dailyBookingLimit: 35,
          maxDailyBookings: 50,
          pendingBreakdowns: 3,
          inProgressBreakdowns: 5
        })
      } catch (error) {
        console.warn('Using mock data for management dashboard:', error.message)
        // Keep the default mock data
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [])

  const kpiCards = [
    {
      title: 'Total Customers',
      value: dashboardData.totalCustomers.toLocaleString(),
      icon: <Users className="w-8 h-8 text-red-600" />,
      color: 'bg-white'
    },
    {
      title: "Today's Revenue",
      value: `LKR ${dashboardData.todayRevenue.toLocaleString()}`,
      icon: <DollarSign className="w-8 h-8 text-red-600" />,
      color: 'bg-white'
    },
    {
      title: 'Staff Members',
      value: dashboardData.staffMembers.toString(),
      icon: <User className="w-8 h-8 text-red-600" />,
      color: 'bg-white'
    },
    {
      title: 'Active Bookings',
      value: dashboardData.activeBookings.toString(),
      icon: <Calendar className="w-8 h-8 text-red-600" />,
      color: 'bg-white'
    }
  ]

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'customers', label: 'Customers' },
    { id: 'staff', label: 'Staff' },
    { id: 'bookings', label: 'Bookings' },
    { id: 'e-shop', label: 'E-shop' }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <div className="container-custom py-8">
        {/* Dashboard Title */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Management Dashboard</h1>
          <p className="text-gray-600 text-lg">Oversee operations, staff, and business performance</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {kpiCards.map((card, index) => (
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
                    ? 'bg-white text-gray-900 border-b-2 border-red-600 rounded-t-lg'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'overview' && (
              <div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Daily Booking Limit */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                    <h3 className="text-sm font-medium text-gray-600 mb-2">Daily booking limit</h3>
                    <div className="mb-4">
                      <p className="text-2xl font-bold text-gray-900">
                        {dashboardData.dailyBookingLimit}/{dashboardData.maxDailyBookings}
                      </p>
                      <p className="text-sm text-gray-600">bookings today</p>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-red-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(dashboardData.dailyBookingLimit / dashboardData.maxDailyBookings) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Breakdown Requests */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                    <h3 className="text-sm font-medium text-gray-600 mb-4">Breakdown Requests</h3>
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <AlertCircle className="w-4 h-4 text-yellow-500" />
                          <span className="text-sm text-gray-600">Pending Approvals</span>
                        </div>
                        <span className="text-sm font-medium text-gray-900">{dashboardData.pendingBreakdowns}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-sm text-gray-600">In Progress</span>
                        </div>
                        <span className="text-sm font-medium text-gray-900">{dashboardData.inProgressBreakdowns}</span>
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

            {activeTab === 'customers' && (
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-6">Customer Management</h3>
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Customer management features coming soon</p>
                </div>
              </div>
            )}

            {activeTab === 'staff' && (
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-6">Staff Management</h3>
                <div className="text-center py-12">
                  <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Staff management features coming soon</p>
                </div>
              </div>
            )}

            {activeTab === 'bookings' && (
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-6">Booking Management</h3>
                <div className="text-center py-12">
                  <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Booking management features coming soon</p>
                </div>
              </div>
            )}

            {activeTab === 'e-shop' && (
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-6">E-Shop Management</h3>
                <div className="text-center py-12">
                  <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">E-Shop management features coming soon</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ManagementDashboard
