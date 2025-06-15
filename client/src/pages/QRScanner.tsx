import { useState, useRef, useEffect } from 'react'
import { QrCode, Package, User, MapPin, Target } from 'lucide-react'
import type { Tool, BorrowToolRequest } from 'shared'

// Simple QR scanner component using device camera
function QRScannerComponent({ onScan: _onScan, onError, onRetry }: { 
  onScan: (result: string) => void, 
  onError: (error: string) => void,
  onRetry?: () => void
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [cameraPermission, setCameraPermission] = useState<'granted' | 'denied' | 'prompt' | 'checking'>('checking')
  const [stream, setStream] = useState<MediaStream | null>(null)

  useEffect(() => {
    let animationId: number
    let mounted = true

    const startCamera = async () => {
      try {
        // Check camera permissions first
        if ('permissions' in navigator) {
          const permissionStatus = await navigator.permissions.query({ name: 'camera' as PermissionName })
          setCameraPermission(permissionStatus.state as 'granted' | 'denied' | 'prompt')
          
          if (permissionStatus.state === 'denied') {
            onError('Camera permission denied. Please enable camera access in your browser settings.')
            return
          }
        }

        const mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: 'environment',
            width: { ideal: 640 },
            height: { ideal: 480 }
          } 
        })
        
        if (!mounted) {
          // Component unmounted, clean up
          mediaStream.getTracks().forEach(track => track.stop())
          return
        }

        setStream(mediaStream)
        setCameraPermission('granted')
        
        if (videoRef.current) {
          const video = videoRef.current
          video.srcObject = mediaStream
          
          video.onloadedmetadata = () => {
            if (mounted) {
              video.play().then(() => {
                setIsScanning(true)
                startScanning()
              }).catch(err => {
                console.error('Video play error:', err)
                onError('Failed to start video playback.')
              })
            }
          }
        }

        const startScanning = () => {
          const scan = () => {
            if (!mounted || !isScanning) return
            
            if (videoRef.current && canvasRef.current) {
              const video = videoRef.current
              const canvas = canvasRef.current
              const context = canvas.getContext('2d')
              
              if (context && video.readyState === video.HAVE_ENOUGH_DATA) {
                canvas.width = video.videoWidth
                canvas.height = video.videoHeight
                context.drawImage(video, 0, 0, canvas.width, canvas.height)
                
                // Here you would typically use a QR code library like jsQR
                // For demo purposes, we'll simulate QR detection with manual input
                // In a real implementation, you would parse the canvas for QR codes
                // and call onScan(qrCodeResult) when found
              }
              
              if (mounted) {
                animationId = requestAnimationFrame(scan)
              }
            }
          }
          scan()
        }

      } catch (error: any) {
        console.error('Error accessing camera:', error)
        setCameraPermission('denied')
        
        if (error.name === 'NotAllowedError') {
          onError('Camera permission denied. Please allow camera access and try again.')
        } else if (error.name === 'NotFoundError') {
          onError('No camera found on this device.')
        } else if (error.name === 'NotReadableError') {
          onError('Camera is already in use by another application.')
        } else if (error.name === 'AbortError') {
          onError('Camera access was aborted. Please try again.')
        } else {
          onError('Failed to access camera. Please check your browser settings and try again.')
        }
      }
    }

    startCamera()

    return () => {
      mounted = false
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
      setIsScanning(false)
    }
  }, [onError]) // Remove isScanning from dependency to prevent infinite loops

  const renderCameraView = () => {
    if (cameraPermission === 'checking') {
      return (
        <div className="w-full h-64 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Checking camera permissions...</p>
          </div>
        </div>
      )
    }

    if (cameraPermission === 'denied') {
      return (
        <div className="w-full h-64 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
          <div className="text-center">
            <QrCode className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600 mb-2">Camera access denied</p>
            <p className="text-xs text-gray-500 mb-4">Please enable camera in browser settings</p>
            {onRetry && (
              <button
                onClick={onRetry}
                className="bg-blue-600 text-white px-3 py-2 rounded-md text-sm hover:bg-blue-700"
              >
                Try Again
              </button>
            )}
          </div>
        </div>
      )
    }

    return (
      <div className="relative w-full max-w-md mx-auto">
        <video
          ref={videoRef}
          className="w-full h-64 object-cover rounded-lg border-2 border-dashed border-gray-300"
          playsInline
          muted
          autoPlay
        />
        <canvas ref={canvasRef} className="hidden" />
        
        {/* Scanning overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-48 h-48 border-2 border-blue-500 border-dashed rounded-lg flex items-center justify-center">
            <QrCode className="h-12 w-12 text-blue-500" />
          </div>
        </div>
        
        {/* Status indicator */}
        <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
          {isScanning ? '🔴 Scanning...' : '⏸ Paused'}
        </div>
      </div>
    )
  }

  return renderCameraView()
}

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
        alert('Tool borrowed successfully!')
        setShowBorrowForm(false)
        setScannedTool(null)
        setBorrowForm({
          toolId: '',
          borrowerName: '',
          borrowerLocation: '',
          purpose: ''
        })
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
    // Force component re-mount by changing key
    window.location.reload()
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
                className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter tool ID from QR code"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? 'Searching...' : 'Find Tool'}
                  </button>
                </form>
              </div>
            )}

            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Scan QR Code</h3>
              <QRScannerComponent onScan={handleQrScan} onError={handleError} onRetry={handleRetryCamera} />
              <p className="text-sm text-gray-500 mt-4">
                Position the QR code within the frame to scan
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="What will you use this tool for?"
                    rows={3}
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowBorrowForm(false)
                      setScannedTool(null)
                    }}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
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
                  onClick={() => {
                    setShowBorrowForm(false)
                    setScannedTool(null)
                  }}
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