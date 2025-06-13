import { useEffect } from 'react'
import { Bell, Package, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import { useNotifications } from '../context/NotificationContext'

export default function Notifications() {
  const { notifications, fetchNotifications, markAsRead } = useNotifications()

  useEffect(() => {
    fetchNotifications()
  }, [])

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'borrow':
        return <Package className="h-5 w-5 text-blue-600" />
      case 'return':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'overdue':
        return <AlertCircle className="h-5 w-5 text-red-600" />
      default:
        return <Bell className="h-5 w-5 text-gray-600" />
    }
  }

  const getNotificationBg = (read: boolean) => {
    return read ? 'bg-white' : 'bg-blue-50'
  }

  const handleMarkAsRead = async (id: string, read: boolean) => {
    if (!read) {
      await markAsRead(id)
    }
  }

  const formatDate = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - new Date(date).getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 60) {
      return `${diffMins} minutes ago`
    } else if (diffHours < 24) {
      return `${diffHours} hours ago`
    } else {
      return `${diffDays} days ago`
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Notifications</h2>
        <p className="text-gray-600">Stay updated with tool borrowing and return activities</p>
      </div>

      <div className="bg-white shadow-sm border rounded-lg overflow-hidden">
        {notifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No notifications</h3>
            <p className="mt-1 text-sm text-gray-500">
              You'll see notifications for tool activities here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-6 hover:bg-gray-50 cursor-pointer transition-colors ${getNotificationBg(notification.read)}`}
                onClick={() => handleMarkAsRead(notification.id, notification.read)}
              >
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className={`text-sm ${notification.read ? 'text-gray-900' : 'text-gray-900 font-medium'}`}>
                        {notification.message}
                      </p>
                      {!notification.read && (
                        <div className="flex-shrink-0">
                          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-2 flex items-center text-sm text-gray-500">
                      <Clock className="h-4 w-4 mr-1" />
                      <span>{formatDate(notification.createdAt)}</span>
                      
                      {notification.tool && (
                        <>
                          <span className="mx-2">•</span>
                          <Package className="h-4 w-4 mr-1" />
                          <span>{notification.tool.name}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {notifications.some(n => !n.read) && (
        <div className="text-center">
          <button
            onClick={async () => {
              // Mark all as read
              for (const notification of notifications.filter(n => !n.read)) {
                await markAsRead(notification.id)
              }
            }}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Mark all as read
          </button>
        </div>
      )}
    </div>
  )
}
