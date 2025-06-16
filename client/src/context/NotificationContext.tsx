import React, { createContext, useContext, useState, useEffect } from 'react'
import type { Notification } from 'shared'

interface NotificationContextType {
  notifications: (Notification & { tool: any })[]
  unreadCount: number
  fetchNotifications: () => Promise<void>
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
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
        // Convert read field from string to boolean
        const processedNotifications = data.notifications.map((n: any) => ({
          ...n,
          read: n.read === 'true'
        }))
        setNotifications(processedNotifications)
        setUnreadCount(processedNotifications.filter((n: Notification) => !n.read).length)
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
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.read)
      
      // Mark all unread notifications as read
      const promises = unreadNotifications.map(n => 
        fetch(`${SERVER_URL}/api/notifications/${n.id}/read`, { method: 'PATCH' })
      )
      
      await Promise.all(promises)
      
      // Update local state
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }

  useEffect(() => {
    fetchNotifications()
    
    // Poll for new notifications every 15 seconds for better responsiveness
    const interval = setInterval(fetchNotifications, 15000)
    return () => clearInterval(interval)
  }, [])

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      fetchNotifications,
      markAsRead,
      markAllAsRead
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
