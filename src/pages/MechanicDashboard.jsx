import { useState, useEffect } from 'react'
import { 
  Wrench, 
  ClipboardCheck, 
  Bell,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react'

const MechanicDashboard = () => {
  const [activeTab, setActiveTab] = useState('my-jobs')
  const [assignedJobs, setAssignedJobs] = useState([])
  const [loading, setLoading] = useState(true)

  // Mock data for when API is not available
  const mockJobs = [
    {
      id: 1,
      service: 'Oil Change',
      vehicle: 'ABC1234',
      vehicleModel: 'Toyota Prius 2020',
      customer: 'John Doe',
      scheduledTime: '10:00 AM',
      status: 'In Progress',
      statusColor: 'bg-yellow-500 text-white',
      actionButton: 'Update Status',
      actionButtonColor: 'bg-red-600 hover:bg-red-700 text-white'
    },
    {
      id: 2,
      service: 'Brake Service',
      vehicle: 'XYZ9876',
      vehicleModel: 'Honda Civic 2019',
      customer: 'Jane Smith',
      scheduledTime: '2:00 PM',
      status: 'Scheduled',
      statusColor: 'bg-blue-100 text-blue-800',
      actionButton: 'View Details',
      actionButtonColor: 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-300'
    },
    {
      id: 3,
      service: 'Engine Diagnostic',
      vehicle: 'DEF5555',
      vehicleModel: 'Nissan Altima 2021',
      customer: 'Bob Johnson',
      scheduledTime: '3:30 PM',
      status: 'Completed',
      statusColor: 'bg-green-100 text-green-800',
      actionButton: 'View Report',
      actionButtonColor: 'bg-green-600 hover:bg-green-700 text-white'
    }
  ]

  // Load jobs data
  useEffect(() => {
    const loadJobs = async () => {
      setLoading(true)
      try {
        // Try to fetch from API first (when database is available)
        // For now, use mock data
        setAssignedJobs(mockJobs)
      } catch (error) {
        console.warn('Using mock data for mechanic jobs:', error.message)
        setAssignedJobs(mockJobs)
      } finally {
        setLoading(false)
      }
    }

    loadJobs()
  }, [])

  const summaryCards = [
    {
      title: 'Assigned Jobs',
      value: assignedJobs.length.toString(),
      icon: <Wrench className="w-8 h-8 text-red-600" />,
      color: 'bg-white'
    },
    {
      title: 'Completed Today',
      value: assignedJobs.filter(job => job.status === 'Completed').length.toString(),
      icon: <ClipboardCheck className="w-8 h-8 text-red-600" />,
      color: 'bg-white'
    },
    {
      title: 'In Progress',
      value: assignedJobs.filter(job => job.status === 'In Progress').length.toString(),
      icon: <Bell className="w-8 h-8 text-red-600" />,
      color: 'bg-white'
    }
  ]

  const tabs = [
    { id: 'my-jobs', label: 'My Jobs' },
    { id: 'job-cards', label: 'Job Cards' },
    { id: 'schedule', label: "Today's Schedule" }
  ]


  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <div className="container-custom py-8">
        {/* Dashboard Title */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Mechanic Dashboard</h1>
          <p className="text-gray-600 text-lg">Manage your assigned jobs and track your progress</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
            {activeTab === 'my-jobs' && (
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-6">Assigned Jobs</h3>
                
                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading assigned jobs...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {assignedJobs.map((job) => (
                      <div key={job.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
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
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${job.statusColor}`}>
                              {job.status}
                            </span>
                            <button className={`px-4 py-2 rounded-full text-xs font-medium transition-colors ${job.actionButtonColor}`}>
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

            {activeTab === 'job-cards' && (
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-6">Job Cards</h3>
                <div className="text-center py-12">
                  <ClipboardCheck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No job cards available</p>
                </div>
              </div>
            )}

            {activeTab === 'schedule' && (
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-6">Today's Schedule</h3>
                <div className="text-center py-12">
                  <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No schedule available for today</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default MechanicDashboard
