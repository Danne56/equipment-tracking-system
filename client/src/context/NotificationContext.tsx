import React, { createContext, useContext, useState, useEffect } from 'react'
import type { Notification } from 'shared'

interface NotificationContextType {
  notifications: (Notification & { tool: any })[]
  unreadCount: number
  fetchNotifications: () => Promise<void>
  markAsRead: (id: string) => Promise<void>
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<(Notification & { tool: any })[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3000"

  const fetchNotifications = async () => {
    try {
      const response = await fetch(`${SERVER_URL}/api/notifications`)
      const data = await response.json()
      
      if (data.success) {
        setNotifications(data.notifications)
        setUnreadCount(data.notifications.filter((n: Notification) => !n.read).length)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    }
  }

  const markAsRead = async (id: string) => {
    try {
      const response = await fetch(`${SERVER_URL}/api/notifications/${id}/read`, {
        method: 'PATCH'
      })
      
      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => n.id === id ? { ...n, read: true } : n)
        )
        setUnreadCount(prev => prev - 1)
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  useEffect(() => {
    fetchNotifications()
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      fetchNotifications,
      markAsRead
    }}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}
