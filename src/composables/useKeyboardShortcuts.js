import { onMounted, onUnmounted } from 'vue'

/**
 * Composable for keyboard shortcuts
 */
export function useKeyboardShortcuts(shortcuts = {}) {
  const handleKeydown = (event) => {
    // Build modifier key string
    const modifiers = []
    if (event.ctrlKey || event.metaKey) {modifiers.push('ctrl')}
    if (event.altKey) {modifiers.push('alt')}
    if (event.shiftKey) {modifiers.push('shift')}
    
    // Build key combination string
    const key = event.key.toLowerCase()
    const combination = [...modifiers, key].join('+')
    
    // Find matching shortcut
    const handler = shortcuts[combination]
    if (handler && typeof handler === 'function') {
      event.preventDefault()
      handler(event)
    }
  }
  
  onMounted(() => {
    document.addEventListener('keydown', handleKeydown)
  })
  
  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeydown)
  })
  
  return {
    handleKeydown
  }
}

// Common shortcuts for the trading journal
export const defaultShortcuts = {
  'ctrl+n': () => console.log('New trade'),
  'ctrl+s': () => console.log('Save trade'),
  'ctrl+e': () => console.log('Export data'),
  'ctrl+f': () => console.log('Search trades'),
  'ctrl+d': () => console.log('Go to dashboard'),
  'ctrl+h': () => console.log('Go to history'),
  'escape': () => console.log('Close modal/dialog')
}