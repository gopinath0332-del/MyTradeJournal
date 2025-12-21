import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Trade } from '@/types'

interface Toast {
  id: number
  type: 'success' | 'error' | 'info' | 'warning'
  title: string
  message: string
}

export const useUIStore = defineStore('ui', () => {
  // State
  const toasts = ref<Toast[]>([])
  const isMobileMenuOpen = ref<boolean>(false)
  const showUserMenu = ref<boolean>(false)
  const isSidebarCollapsed = ref<boolean>(false)
  const editingTrade = ref<Trade | null>(null)

  let toastId = 0

  // Actions
  function showToast(
    type: Toast['type'],
    title: string,
    message: string,
    duration = 3000
  ): void {
    const id = toastId++
    toasts.value.push({ id, type, title, message })

    // Automatically remove the toast after duration
    setTimeout(() => {
      removeToast(id)
    }, duration)
  }

  function removeToast(id: number): void {
    const index = toasts.value.findIndex(t => t.id === id)
    if (index !== -1) {
      toasts.value.splice(index, 1)
    }
  }

  function toggleMobileMenu(): void {
    isMobileMenuOpen.value = !isMobileMenuOpen.value
  }

  function closeMobileMenu(): void {
    isMobileMenuOpen.value = false
  }

  function toggleSidebar(): void {
    isSidebarCollapsed.value = !isSidebarCollapsed.value
  }

  function toggleUserMenu(): void {
    showUserMenu.value = !showUserMenu.value
  }

  function closeUserMenu(): void {
    showUserMenu.value = false
  }

  function setEditingTrade(trade: Trade | null): void {
    editingTrade.value = trade
  }

  return {
    // State
    toasts,
    isMobileMenuOpen,
    showUserMenu,
    isSidebarCollapsed,
    editingTrade,

    // Actions
    showToast,
    removeToast,
    toggleMobileMenu,
    closeMobileMenu,
    toggleSidebar,
    toggleUserMenu,
    closeUserMenu,
    setEditingTrade
  }
})
