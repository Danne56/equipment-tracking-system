import { useState, useEffect } from 'react'
import { Plus, Package, QrCode, Edit, Trash2 } from 'lucide-react'
import Swal from 'sweetalert2'
import type { Tool, CreateToolRequest, UpdateToolRequest } from 'shared'
import { api } from '../lib/axios'

export default function ToolManagement() {
  const [tools, setTools] = useState<Tool[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showQrModal, setShowQrModal] = useState(false)
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null)
  const [formData, setFormData] = useState<CreateToolRequest>({
    name: '',
    description: ''
  })
  const [editFormData, setEditFormData] = useState<UpdateToolRequest>({
    name: '',
    description: '',
    status: 'available'  })

  useEffect(() => {
    fetchTools()
  }, [])

  const fetchTools = async () => {
    try {
      const data = await api.get('/tools')
      
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
      const data = await api.post('/tools', formData)
      
      if (data.success) {
        setTools(prev => [data.tool, ...prev])
        setShowCreateModal(false)
        setFormData({ name: '', description: '' })
        
        await Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: 'Tool created successfully',
          timer: 2000,
          showConfirmButton: false
        })
      } else {
        await Swal.fire({
          icon: 'error',
          title: 'Error',
          text: data.message
        })
      }
    } catch (error) {
      console.error('Error creating tool:', error)
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to create tool'
      })
    }
  }

  const showQrCode = (tool: Tool) => {
    setSelectedTool(tool)
    setShowQrModal(true)
  }

  const openEditModal = (tool: Tool) => {
    setSelectedTool(tool)
    setEditFormData({
      name: tool.name,
      description: tool.description || '',
      status: tool.status
    })
    setShowEditModal(true)
  }

  const handleEditTool = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedTool) return
    
    try {
      const data = await api.put(`/tools/${selectedTool.id}`, editFormData)
      
      if (data.success) {
        setTools(prev => prev.map(tool => 
          tool.id === selectedTool.id ? data.tool : tool
        ))
        setShowEditModal(false)
        setSelectedTool(null)
        setEditFormData({ name: '', description: '', status: 'available' })
        
        await Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: 'Tool updated successfully',
          timer: 2000,
          showConfirmButton: false
        })
      } else {
        await Swal.fire({
          icon: 'error',
          title: 'Error',
          text: data.message
        })
      }
    } catch (error) {
      console.error('Error updating tool:', error)
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to update tool'
      })
    }
  }

  const handleDeleteTool = async (tool: Tool) => {
    const result = await Swal.fire({
      title: 'Delete Tool?',
      text: `Are you sure you want to delete "${tool.name}"? This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    })

    if (!result.isConfirmed) return
    
    try {
      const data = await api.delete(`/tools/${tool.id}`)
      
      if (data.success) {
        setTools(prev => prev.filter(t => t.id !== tool.id))
        
        await Swal.fire({
          icon: 'success',
          title: 'Deleted!',
          text: `Tool "${tool.name}" has been deleted successfully.`,
          timer: 3000,
          showConfirmButton: false
        })
      } else {
        // If regular delete fails due to borrow history, offer force delete
        if (data.message.includes('borrow history')) {
          const forceResult = await Swal.fire({
            title: 'Tool Has History',
            text: `${data.message}\n\nWould you like to force delete this tool? This will permanently remove all associated data including borrow history.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Force Delete',
            cancelButtonText: 'Cancel',
            html: `
              <p>${data.message}</p>
              <br>
              <p><strong>Would you like to force delete this tool?</strong></p>
              <p class="text-sm text-gray-600">This will permanently remove all associated data including borrow history.</p>
            `
          })
          
          if (forceResult.isConfirmed) {
            await handleForceDeleteTool(tool)
          }
        } else {
          await Swal.fire({
            icon: 'error',
            title: 'Error',
            text: data.message
          })
        }
      }
    } catch (error) {
      console.error('Error deleting tool:', error)
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to delete tool'
      })
    }
  }

  const handleForceDeleteTool = async (tool: Tool) => {
    try {
      const data = await api.delete(`/tools/${tool.id}/force`)
      
      if (data.success) {
        setTools(prev => prev.filter(t => t.id !== tool.id))
        
        await Swal.fire({
          icon: 'success',
          title: 'Force Deleted!',
          text: `Tool "${tool.name}" and all related data have been permanently deleted.`,
          timer: 3000,
          showConfirmButton: false
        })
      } else {
        await Swal.fire({
          icon: 'error',
          title: 'Error',
          text: data.message
        })
      }
    } catch (error) {
      console.error('Error force deleting tool:', error)
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to force delete tool'
      })
    }
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
              
              <div className="flex space-x-2">
                <button
                  onClick={() => openEditModal(tool)}
                  className="flex items-center space-x-1 text-green-600 hover:text-green-800"
                >
                  <Edit className="h-4 w-4" />
                  <span>Edit</span>
                </button>
                
                <button
                  onClick={() => handleDeleteTool(tool)}
                  className={`flex items-center space-x-1 ${
                    tool.status === 'borrowed' 
                      ? 'text-gray-400 cursor-not-allowed' 
                      : 'text-red-600 hover:text-red-800'
                  }`}
                  disabled={tool.status === 'borrowed'}
                  title={tool.status === 'borrowed' ? 'Cannot delete borrowed tools' : 'Delete tool'}
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete</span>
                </button>
              </div>
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

      {/* Edit Tool Modal */}
      {showEditModal && selectedTool && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Tool: {selectedTool.name}</h3>
            
            <form onSubmit={handleEditTool} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tool Name *
                </label>
                <input
                  type="text"
                  required
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter tool name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter tool description"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={editFormData.status}
                  onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value as 'available' | 'borrowed' | 'maintenance' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="available">Available</option>
                  <option value="borrowed">Borrowed</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Update Tool
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
