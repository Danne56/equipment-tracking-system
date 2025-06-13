import { Link, useLocation } from 'react-router-dom'
import { Home, Package, FileText, QrCode, Bell } from 'lucide-react'
import { useNotifications } from '../context/NotificationContext'

export default function Navbar() {
  const location = useLocation()
  const { unreadCount } = useNotifications()

  const navItems = [
    { path: '/', label: 'Dashboard', icon: Home },
    { path: '/tools', label: 'Tools', icon: Package },
    { path: '/records', label: 'Records', icon: FileText },
    { path: '/scanner', label: 'QR Scanner', icon: QrCode },
    { path: '/notifications', label: 'Notifications', icon: Bell },
  ]

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-2">
            <Package className="h-8 w-8 text-blue-600" />
            <h1 className="text-xl font-bold text-gray-900">Workshop Tracker</h1>
          </div>
          
          <div className="flex space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors relative ${
                    isActive
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:block">{item.label}</span>
                  {item.label === 'Notifications' && unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </nav>
  )
}
