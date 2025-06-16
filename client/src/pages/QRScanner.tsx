import { useState } from 'react'
import { QrCode, Package, User, MapPin, Target } from 'lucide-react'
import Swal from 'sweetalert2'
import type { Tool, BorrowToolRequest } from 'shared'
import QrReader from '../components/QrReader'

export default function QRScanner() {
  const [scannedTool, setScannedTool] = useState<Tool | null>(null)
  const [showBorrowForm, setShowBorrowForm] = useState(false)
  const [borrowForm, setBorrowForm] = useState<BorrowToolRequest>({
    toolId: '',
    borrowerName: '',
    borrowerLocation: '',
    purpose: ''
  })
  const [manualQrInput, setManualQrInput] = useState('')
  const [showManualInput, setShowManualInput] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [qrReaderKey, setQrReaderKey] = useState(0) // Add key for QrReader remount

  const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3000"

  const handleQrScan = async (qrId: string) => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch(`${SERVER_URL}/api/tools/qr/${qrId}`)
      const data = await response.json()

      if (data.success) {
        setScannedTool(data.tool)
        setBorrowForm((prev: any) => ({ ...prev, toolId: data.tool.id }))
        setShowBorrowForm(true)
      } else {
        setError('Tool not found with this QR code')
      }
    } catch (error) {
      console.error('Error fetching tool:', error)
      setError('Failed to fetch tool information. Please check your connection.')
    }
    setLoading(false)
  }

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (manualQrInput.trim()) {
      handleQrScan(manualQrInput.trim())
      setManualQrInput('')
      setShowManualInput(false)
    }
  }

  const handleBorrowSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`${SERVER_URL}/api/borrow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(borrowForm)
      })

      const data = await response.json()

      if (data.success) {
        setError('')
        await Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: 'Tool borrowed successfully!',
          timer: 2000,
          showConfirmButton: false
        })
        // Reset all states and remount QrReader
        setShowBorrowForm(false)
        setScannedTool(null)
        setBorrowForm({
          toolId: '',
          borrowerName: '',
          borrowerLocation: '',
          purpose: ''
        })
        setQrReaderKey(prev => prev + 1) // Force QrReader remount
      } else {
        setError(data.message)
      }
    } catch (error) {
      console.error('Error borrowing tool:', error)
      setError('Failed to borrow tool. Please check your connection.')
    }
    setLoading(false)
  }

  const handleError = (errorMessage: string) => {
    setError(errorMessage)
  }

  const clearError = () => {
    setError('')
  }

  const handleRetryCamera = () => {
    setError('')
    setQrReaderKey(prev => prev + 1) // Remount QrReader instead of full page reload
  }

  // Reset QrReader when canceling borrow form
  const handleCancelBorrow = () => {
    setShowBorrowForm(false)
    setScannedTool(null)
    setQrReaderKey(prev => prev + 1) // Remount QrReader to reset its state
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">QR Code Scanner</h2>
        <p className="text-gray-600">Scan QR codes to quickly borrow or return tools</p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
              <div className="mt-4">
                <div className="-mx-2 -my-1.5 flex">
                  <button
                    type="button"
                    onClick={clearError}
                    className="bg-red-50 px-2 py-1.5 rounded-md text-sm font-medium text-red-800 hover:bg-red-100"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {!showBorrowForm ? (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="text-center space-y-6">
            <div className="flex items-center justify-center space-x-4">
              <button
                onClick={() => setShowManualInput(!showManualInput)}
                className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
              >
                <QrCode className="h-4 w-4" />
                <span>Manual Input</span>
              </button>
            </div>

            {showManualInput && (
              <div className="max-w-md mx-auto">
                <form onSubmit={handleManualSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Enter QR Code / Tool ID
                    </label>
                    <input
                      type="text"
                      value={manualQrInput}
                      onChange={(e) => setManualQrInput(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter tool ID from QR code"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {loading ? 'Searching...' : 'Find Tool'}
                  </button>
                </form>
              </div>
            )}

            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Scan QR Code</h3>
              <QrReader 
                key={qrReaderKey} 
                onScan={handleQrScan} 
                onError={handleError} 
                onRetry={handleRetryCamera} 
              />
              <p className="text-sm text-gray-500 mt-4">
                Position the QR code within the blue frame to scan
              </p>
            </div>
          </div>
        </div>
      ) : (
        scannedTool && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Tool Information</h3>
              <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                <Package className="h-12 w-12 text-gray-400" />
                <div>
                  <h4 className="text-lg font-medium text-gray-900">{scannedTool.name}</h4>
                  {scannedTool.description && (
                    <p className="text-sm text-gray-600">{scannedTool.description}</p>
                  )}
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    scannedTool.status === 'available' 
                      ? 'bg-green-100 text-green-800'
                      : scannedTool.status === 'borrowed'
                      ? 'bg-orange-100 text-orange-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {scannedTool.status}
                  </span>
                </div>
              </div>
            </div>

            {scannedTool.status === 'available' ? (
              <form onSubmit={handleBorrowSubmit} className="space-y-4">
                <h4 className="text-lg font-medium text-gray-900">Borrow Tool</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <User className="inline h-4 w-4 mr-1" />
                      Your Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={borrowForm.borrowerName}
                      onChange={(e) => setBorrowForm({ ...borrowForm, borrowerName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter your name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <MapPin className="inline h-4 w-4 mr-1" />
                      Location *
                    </label>
                    <input
                      type="text"
                      required
                      value={borrowForm.borrowerLocation}
                      onChange={(e) => setBorrowForm({ ...borrowForm, borrowerLocation: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Workshop section/area"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Target className="inline h-4 w-4 mr-1" />
                    Purpose *
                  </label>
                  <textarea
                    required
                    value={borrowForm.purpose}
                    onChange={(e) => setBorrowForm({ ...borrowForm, purpose: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="What will you use this tool for?"
                    rows={3}
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCancelBorrow}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {loading ? 'Borrowing...' : 'Borrow Tool'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-center py-6">
                <p className="text-red-600 font-medium">
                  This tool is currently {scannedTool.status} and cannot be borrowed.
                </p>
                <button
                  onClick={handleCancelBorrow}
                  className="mt-4 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                >
                  Scan Another Tool
                </button>
              </div>
            )}
          </div>
        )
      )}
    </div>
  )
}