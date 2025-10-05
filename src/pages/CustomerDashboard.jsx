import { useState } from 'react'
import { Link } from 'react-router-dom'
import { 
  Calendar, 
  Car, 
  DollarSign, 
  ShoppingCart, 
  Plus,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react'

const CustomerDashboard = () => {
  const [activeTab, setActiveTab] = useState('appointments')

  const summaryCards = [
    {
      title: 'Active Bookings',
      value: '3',
      icon: <Calendar className="w-8 h-8 text-red-600" />,
      color: 'bg-white'
    },
    {
      title: 'Vehicles',
      value: '2',
      icon: <Car className="w-8 h-8 text-red-600" />,
      color: 'bg-white'
    },
    {
      title: 'Total Spent',
      value: 'Rs. 28,000',
      icon: <DollarSign className="w-8 h-8 text-red-600" />,
      color: 'bg-white'
    },
    {
      title: 'Cart Items',
      value: '5',
      icon: <ShoppingCart className="w-8 h-8 text-red-600" />,
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

  const appointments = [
    {
      id: 1,
      service: 'Car Wash',
      vehicle: 'ABC1234',
      date: 'Dec 15, 2024 at 10:00 AM',
      status: 'Pending',
      statusColor: 'bg-yellow-100 text-yellow-800'
    },
    {
      id: 2,
      service: 'Oil Change',
      vehicle: 'XYZ9876',
      date: 'Dec 20, 2024 at 2:00 PM',
      status: 'Confirmed',
      statusColor: 'bg-green-100 text-green-800'
    }
  ]

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
                  <h3 className="text-xl font-bold text-gray-900">My Appointments</h3>
                  <Link
                    to="/booking"
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>New Booking</span>
                  </Link>
                </div>

                <div className="space-y-4">
                  {appointments.map((appointment) => (
                    <div key={appointment.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-gray-900 mb-1">
                            {appointment.service} - {appointment.vehicle}
                          </h4>
                          <p className="text-gray-600 text-sm">{appointment.date}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${appointment.statusColor}`}>
                          {appointment.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
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
