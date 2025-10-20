<template>
  <div class="login-page">
    <div class="login-container">
      <!-- Logo/Header -->
      <div class="login-header">
        <h1>📈 Trading Journal</h1>
        <p class="tagline">Track, Analyze, and Improve Your Trading</p>
      </div>

      <!-- Error Message -->
      <div v-if="error" class="error-message">
        <span class="error-icon">⚠️</span>
        <p>{{ error }}</p>
        <button class="close-error" @click="clearError">×</button>
      </div>

      <!-- Login Card -->
      <div class="login-card">
        <div class="card-content">
          <h2>Welcome Back!</h2>
          <p class="subtitle">Sign in to access your trading journal</p>

          <!-- Google Sign-In Button -->
          <button
            class="google-btn"
            :disabled="loading"
            @click="handleGoogleSignIn"
          >
            <span v-if="loading" class="loading-spinner" />
            <template v-else>
              <svg class="google-icon" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span>Sign in with Google</span>
            </template>
          </button>

          <!-- Features List -->
          <div class="features">
            <h3>Why use our Trading Journal?</h3>
            <ul>
              <li>
                <span class="feature-icon">📊</span>
                Track all your trades in one place
              </li>
              <li>
                <span class="feature-icon">📈</span>
                Analyze performance with detailed statistics
              </li>
              <li>
                <span class="feature-icon">🎯</span>
                Learn from your wins and losses
              </li>
              <li>
                <span class="feature-icon">🔐</span>
                Secure and private - your data stays yours
              </li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="login-footer">
        <p>By signing in, you agree to our Terms of Service and Privacy Policy</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useAuth } from '@/composables/useAuth'
import { useRouter } from 'vue-router'

const router = useRouter()
const { loading, error, signInWithGoogle, clearError } = useAuth()

const handleGoogleSignIn = async() => {
  try {
    await signInWithGoogle()
    // Router will handle redirect via AuthGuard
  } catch (err) {
    // Error is already set in the composable
    console.error('Sign-in failed:', err)
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem;
}

.login-container {
  max-width: 480px;
  width: 100%;
}

.login-header {
  text-align: center;
  margin-bottom: 2rem;
  color: white;
}

.login-header h1 {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.tagline {
  font-size: 1.125rem;
  opacity: 0.95;
}

.error-message {
  background: #fee2e2;
  border: 1px solid #fca5a5;
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  position: relative;
}

.error-icon {
  font-size: 1.5rem;
}

.error-message p {
  flex: 1;
  color: #991b1b;
  margin: 0;
}

.close-error {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #991b1b;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: background 0.3s;
}

.close-error:hover {
  background: rgba(0, 0, 0, 0.05);
}

.login-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  overflow: hidden;
}

.card-content {
  padding: 3rem 2rem;
}

.card-content h2 {
  font-size: 1.875rem;
  color: #1e293b;
  margin-bottom: 0.5rem;
  text-align: center;
}

.subtitle {
  color: #64748b;
  text-align: center;
  margin-bottom: 2rem;
}

.google-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 0.875rem 1.5rem;
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.google-btn:hover:not(:disabled) {
  background: #f9fafb;
  border-color: #d1d5db;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
}

.google-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.google-icon {
  width: 24px;
  height: 24px;
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 3px solid #e5e7eb;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.features {
  margin-top: 3rem;
  padding-top: 2rem;
  border-top: 1px solid #e5e7eb;
}

.features h3 {
  font-size: 1.125rem;
  color: #1e293b;
  margin-bottom: 1rem;
}

.features ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.features li {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 0;
  color: #475569;
}

.feature-icon {
  font-size: 1.5rem;
}

.login-footer {
  text-align: center;
  margin-top: 2rem;
  color: white;
  opacity: 0.9;
}

.login-footer p {
  font-size: 0.875rem;
}

@media (max-width: 640px) {
  .login-page {
    padding: 1rem;
  }

  .login-header h1 {
    font-size: 2rem;
  }

  .card-content {
    padding: 2rem 1.5rem;
  }

  .features {
    margin-top: 2rem;
  }
}
</style>
