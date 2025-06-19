import { useState, useEffect } from 'react'
import { Package, Users, Clock } from 'lucide-react'
import type { Tool, BorrowRecord } from 'shared'
import { api } from '../lib/axios'

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalTools: 0,
    availableTools: 0,
    borrowedTools: 0,
    activeRecords: 0
  })
  const [recentActivities, setRecentActivities] = useState<(BorrowRecord & { tool: Tool | null })[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const [toolsData, recordsData] = await Promise.all([
        api.get('/tools'),
        api.get('/borrow-records/active')
      ])

      if (toolsData.success) {
        const tools = toolsData.tools
        setStats({
          totalTools: tools.length,
          availableTools: tools.filter((t: Tool) => t.status === 'available').length,
          borrowedTools: tools.filter((t: Tool) => t.status === 'borrowed').length,
          activeRecords: recordsData.success ? recordsData.records.length : 0
        })
      }

      if (recordsData.success) {
        setRecentActivities(recordsData.records.slice(0, 5))
      }

      setLoading(false)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-gray-600">Overview of workshop tool tracking system</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <div className="flex items-center">
            <Package className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Tools</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalTools}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <div className="flex items-center">
            <Package className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Available</p>
              <p className="text-2xl font-bold text-gray-900">{stats.availableTools}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Borrowed</p>
              <p className="text-2xl font-bold text-gray-900">{stats.borrowedTools}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-red-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Records</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeRecords}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-medium text-gray-900">Recent Activities</h3>
        </div>
        <div className="p-6">
          {recentActivities.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No recent activities</p>
          ) : (
            <div className="space-y-4">
              {recentActivities.map((record) => (
                <div key={record.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <Package className="h-8 w-8 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {record.tool?.name || 'Unknown Tool'}
                      </p>
                      <p className="text-sm text-gray-500">
                        Borrowed by {record.borrowerName} from {record.borrowerLocation}
                      </p>
                      <p className="text-xs text-gray-400">
                        Purpose: {record.purpose}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">
                      {new Date(record.borrowedAt).toLocaleDateString()}
                    </p>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                      Active
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
