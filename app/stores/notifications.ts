import { defineStore } from 'pinia'

export interface NotificationItem {
  id: string
  type: 'BLOOD_UNIT_AVAILABLE' | 'DONOR_AVAILABLE' | 'NEARBY_BLOOD_REQUEST' | 'VET_REQUEST' | 'GENERAL'
  title: string
  body: string
  createdAt: string
  expiresAt: string
  isRead: boolean
  isDismissed: boolean
  extra?: Record<string, unknown>
}

interface NotificationsState {
  notifications: NotificationItem[]
}

const STORAGE_KEY = 'aaron_notifications'
const EXPIRY_DAYS = 7

export const useNotificationsStore = defineStore('notifications', {
  state: (): NotificationsState => ({
    notifications: []
  }),

  getters: {
    // Get all active (not dismissed, not expired) notifications
    activeNotifications: (state): NotificationItem[] => {
      const now = new Date()
      return state.notifications
        .filter(n => !n.isDismissed && new Date(n.expiresAt) > now)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    },

    // Get unread count
    unreadCount: (state): number => {
      const now = new Date()
      return state.notifications.filter(
        n => !n.isDismissed && !n.isRead && new Date(n.expiresAt) > now
      ).length
    },

    // Check if there are any notifications
    hasNotifications(): boolean {
      return this.activeNotifications.length > 0
    }
  },

  actions: {
    // Initialize store from localStorage
    init() {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
          try {
            const data = JSON.parse(stored)
            this.notifications = data.notifications || []
            // Clean up expired notifications
            this.cleanExpired()
          } catch (e) {
            console.error('Failed to parse notifications from storage:', e)
            this.notifications = []
          }
        }
      }
    },

    // Save to localStorage
    persist() {
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          notifications: this.notifications
        }))
      }
    },

    // Add a new notification
    addNotification(notification: Omit<NotificationItem, 'id' | 'createdAt' | 'expiresAt' | 'isRead' | 'isDismissed'>) {
      const now = new Date()
      const expiresAt = new Date(now.getTime() + EXPIRY_DAYS * 24 * 60 * 60 * 1000)

      const newNotification: NotificationItem = {
        ...notification,
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
        isRead: false,
        isDismissed: false
      }

      this.notifications.unshift(newNotification)
      this.persist()

      return newNotification
    },

    // Mark notification as read
    markAsRead(id: string) {
      const notification = this.notifications.find(n => n.id === id)
      if (notification) {
        notification.isRead = true
        this.persist()
      }
    },

    // Mark all as read
    markAllAsRead() {
      this.notifications.forEach(n => {
        if (!n.isDismissed) {
          n.isRead = true
        }
      })
      this.persist()
    },

    // Dismiss a notification
    dismiss(id: string) {
      const notification = this.notifications.find(n => n.id === id)
      if (notification) {
        notification.isDismissed = true
        this.persist()
      }
    },

    // Clean up expired notifications
    cleanExpired() {
      const now = new Date()
      this.notifications = this.notifications.filter(
        n => new Date(n.expiresAt) > now
      )
      this.persist()
    },

    // Clear all notifications
    clearAll() {
      this.notifications = []
      this.persist()
    }
  }
})
