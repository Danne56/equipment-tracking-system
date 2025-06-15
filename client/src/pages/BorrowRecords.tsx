import { useState, useEffect } from 'react'
import { FileText, Package, User, MapPin, Calendar, CheckCircle } from 'lucide-react'
import type { BorrowRecord, Tool, ReturnToolRequest } from 'shared'

type ExtendedBorrowRecord = BorrowRecord & { tool: Tool | null }

export default function BorrowRecords() {
  const [records, setRecords] = useState<ExtendedBorrowRecord[]>([])
  const [activeRecords, setActiveRecords] = useState<ExtendedBorrowRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'all' | 'active'>('active')

  const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3000"

  useEffect(() => {
    fetchRecords()
  }, [])

  const fetchRecords = async () => {
    try {
      const [allResponse, activeResponse] = await Promise.all([
        fetch(`${SERVER_URL}/api/borrow-records`),
        fetch(`${SERVER_URL}/api/borrow-records/active`)
      ])

      const allData = await allResponse.json()
      const activeData = await activeResponse.json()

      if (allData.success) {
        setRecords(allData.records)
      }

      if (activeData.success) {
        setActiveRecords(activeData.records)
      }

      setLoading(false)
    } catch (error) {
      console.error('Error fetching records:', error)
      setLoading(false)
    }
  }

  const handleReturnTool = async (borrowRecordId: string) => {
    try {
      const response = await fetch(`${SERVER_URL}/api/return`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ borrowRecordId } as ReturnToolRequest)
      })

      const data = await response.json()

      if (data.success) {
        // Refresh the records
        fetchRecords()
        alert('Tool returned successfully!')
      } else {
        alert(data.message)
      }
    } catch (error) {
      console.error('Error returning tool:', error)
      alert('Failed to return tool')
    }
  }

  const getStatusColor = (status: BorrowRecord['status']) => {
    switch (status) {
      case 'active':
        return 'bg-orange-100 text-orange-800'
      case 'returned':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const displayRecords = activeTab === 'active' ? activeRecords : records

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
        <h2 className="text-2xl font-bold text-gray-900">Borrow Records</h2>
        <p className="text-gray-600">Track tool borrowing and return activities</p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('active')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'active'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Active Borrows ({activeRecords.length})
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'all'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            All Records ({records.length})
          </button>
        </nav>
      </div>

      {/* Records List */}
      <div className="bg-white shadow-sm border rounded-lg overflow-hidden">
        {displayRecords.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No records found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {activeTab === 'active' ? 'No active borrowings at the moment.' : 'No borrowing records yet.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tool
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Borrower
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Purpose
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dates
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {displayRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Package className="h-8 w-8 text-gray-400 mr-3" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {record.tool?.name || 'Unknown Tool'}
                          </div>
                          {record.tool?.description && (
                            <div className="text-sm text-gray-500">
                              {record.tool.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="h-4 w-4 text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {record.borrowerName}
                          </div>
                          <div className="flex items-center text-sm text-gray-500">
                            <MapPin className="h-3 w-3 mr-1" />
                            {record.borrowerLocation}
                          </div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {record.purpose}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="space-y-1">
                        <div className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          Borrowed: {new Date(record.borrowedAt).toLocaleDateString()}
                        </div>
                        {record.returnedAt && (
                          <div className="flex items-center">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Returned: {new Date(record.returnedAt).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                        {record.status}
                      </span>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {record.status === 'active' && (
                        <button
                          onClick={() => handleReturnTool(record.id)}
                          className="text-green-600 hover:text-green-900"
                        >
                          Return Tool
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
