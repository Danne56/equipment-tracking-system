import { useState, useEffect } from 'react'
import { Plus, Package, QrCode } from 'lucide-react'
import type { Tool, CreateToolRequest } from 'shared'

export default function ToolManagement() {
  const [tools, setTools] = useState<Tool[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showQrModal, setShowQrModal] = useState(false)
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null)
  const [formData, setFormData] = useState<CreateToolRequest>({
    name: '',
    description: ''
  })

  const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3000"

  useEffect(() => {
    fetchTools()
  }, [])

  const fetchTools = async () => {
    try {
      const response = await fetch(`${SERVER_URL}/api/tools`)
      const data = await response.json()
      
      if (data.success) {
        setTools(data.tools)
      }
      setLoading(false)
    } catch (error) {
      console.error('Error fetching tools:', error)
      setLoading(false)
    }
  }

  const handleCreateTool = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const response = await fetch(`${SERVER_URL}/api/tools`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })
      
      const data = await response.json()
      
      if (data.success) {
        setTools(prev => [data.tool, ...prev])
        setShowCreateModal(false)
        setFormData({ name: '', description: '' })
      } else {
        alert(data.message)
      }
    } catch (error) {
      console.error('Error creating tool:', error)
      alert('Failed to create tool')
    }
  }

  const showQrCode = (tool: Tool) => {
    setSelectedTool(tool)
    setShowQrModal(true)
  }

  const getStatusColor = (status: Tool['status']) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800'
      case 'borrowed':
        return 'bg-orange-100 text-orange-800'
      case 'maintenance':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
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
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Tool Management</h2>
          <p className="text-gray-600">Manage workshop tools and generate QR codes</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          <span>Add Tool</span>
        </button>
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tools.map((tool) => (
          <div key={tool.id} className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Package className="h-8 w-8 text-gray-400" />
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(tool.status)}`}>
                  {tool.status}
                </span>
              </div>
              
              <h3 className="text-lg font-medium text-gray-900 mb-2">{tool.name}</h3>
              
              {tool.description && (
                <p className="text-sm text-gray-600 mb-4">{tool.description}</p>
              )}
              
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>Created: {new Date(tool.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
            
            <div className="px-6 py-3 bg-gray-50 border-t flex justify-between">
              <button
                onClick={() => showQrCode(tool)}
                className="flex items-center space-x-1 text-blue-600 hover:text-blue-800"
              >
                <QrCode className="h-4 w-4" />
                <span>QR Code</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {tools.length === 0 && (
        <div className="text-center py-12">
          <Package className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No tools</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating a new tool.</p>
        </div>
      )}

      {/* Create Tool Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Tool</h3>
            
            <form onSubmit={handleCreateTool} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tool Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter tool name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter tool description"
                  rows={3}
                />
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Create Tool
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQrModal && selectedTool && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              QR Code for {selectedTool.name}
            </h3>
            
            <div className="mb-4">
              <img
                src={selectedTool.qrCode}
                alt={`QR Code for ${selectedTool.name}`}
                className="mx-auto w-48 h-48 border"
              />
            </div>
            
            <p className="text-sm text-gray-600 mb-4">
              Scan this QR code to quickly access this tool
            </p>
            
            <button
              onClick={() => setShowQrModal(false)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
