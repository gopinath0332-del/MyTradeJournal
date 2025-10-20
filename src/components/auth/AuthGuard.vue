<template>
  <div class="auth-guard">
    <!-- Loading state while checking authentication -->
    <div v-if="!isAuthReady" class="auth-loading">
      <div class="loading-spinner" />
      <p>Loading...</p>
    </div>

    <!-- Show login page if not authenticated -->
    <LoginPage v-else-if="!isAuthenticated" />

    <!-- Show app content if authenticated -->
    <slot v-else />
  </div>
</template>

<script setup>
import { watch } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { useRouter } from 'vue-router'
import LoginPage from './LoginPage.vue'

const router = useRouter()
const { isAuthenticated, isAuthReady } = useAuth()

// Watch for authentication changes
watch(isAuthenticated, (authenticated) => {
  if (authenticated) {
    // User just signed in, navigate to home if on login route
    if (router.currentRoute.value.path === '/login') {
      router.push('/')
    }
  }
})
</script>

<style scoped>
.auth-guard {
  min-height: 100vh;
}

.auth-loading {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.loading-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.auth-loading p {
  font-size: 1.125rem;
  opacity: 0.9;
}
</style>
