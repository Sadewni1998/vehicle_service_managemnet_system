import { useState, useEffect } from 'react'
import { 
  ClipboardCheck, 
  Wrench,
  Eye,
  CheckCircle
} from 'lucide-react'

const ServiceAdvisorDashboard = () => {
  const [activeTab, setActiveTab] = useState('job-cards')
  const [loading, setLoading] = useState(true)

  // Add loading effect to ensure component mounts properly
  useEffect(() => {
    console.log('ServiceAdvisor Dashboard loaded successfully')
    setLoading(false)
  }, [])

  const summaryCards = [
    {
      title: 'Pending Reviews',
      value: '8',
      icon: <ClipboardCheck className="w-8 h-8 text-red-600" />,
      color: 'bg-white'
    },
    {
      title: 'Assigned Jobs',
      value: '12',
      icon: <Wrench className="w-8 h-8 text-red-600" />,
      color: 'bg-white'
    }
  ]

  const tabs = [
    { id: 'job-cards', label: 'Job cards' },
    { id: 'assign-jobs', label: 'Assign jobs' },
    { id: 'schedule', label: 'Schedule' }
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

            {activeTab === 'assign-jobs' && (
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-6">Assign Jobs</h3>
                <div className="text-center py-12">
                  <Wrench className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Job assignment features coming soon</p>
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
          </div>
        </div>
      </div>
    </div>
  )
}

export default ServiceAdvisorDashboard
