<template>
  <div class="firebase-debug">
    <h3>🔧 Firebase Connection Debug</h3>
    <div class="debug-section">
      <h4>Configuration Status</h4>
      <div class="status-item">
        <span class="label">Firebase Initialized:</span>
        <span :class="status.initialized ? 'success' : 'error'">
          {{ status.initialized ? '✅ Yes' : '❌ No' }}
        </span>
      </div>
      <div class="status-item">
        <span class="label">Firestore Connected:</span>
        <span :class="status.firestoreConnected ? 'success' : 'error'">
          {{ status.firestoreConnected ? '✅ Yes' : '❌ No' }}
        </span>
      </div>
      <div class="status-item">
        <span class="label">Project ID:</span>
        <span class="value">{{ config.projectId || 'Not configured' }}</span>
      </div>
    </div>

    <div class="debug-section">
      <h4>Trade Service Test</h4>
      <button :disabled="testingTrades" class="test-btn" @click="testTradeService">
        {{ testingTrades ? 'Testing...' : 'Test Trade Service' }}
      </button>
      <div v-if="tradeTestResult" class="test-result" :class="tradeTestResult.success ? 'success' : 'error'">
        <strong>{{ tradeTestResult.success ? '✅ Success' : '❌ Error' }}</strong>
        <pre>{{ tradeTestResult.message }}</pre>
      </div>
    </div>

    <div class="debug-section">
      <h4>Connection Test</h4>
      <button :disabled="testing" class="test-btn" @click="testConnection">
        {{ testing ? 'Testing...' : 'Test Firestore Connection' }}
      </button>
      <div v-if="testResult" class="test-result" :class="testResult.success ? 'success' : 'error'">
        <strong>{{ testResult.success ? '✅ Success' : '❌ Error' }}</strong>
        <pre>{{ testResult.message }}</pre>
      </div>
    </div>

    <div class="debug-section">
      <h4>Environment Variables</h4>
      <div class="env-vars">
        <div v-for="(value, key) in envVars" :key="key" class="env-item">
          <span class="env-key">{{ key }}:</span>
          <span class="env-value">{{ value ? '✅ Set' : '❌ Missing' }}</span>
        </div>
      </div>
    </div>

    <div v-if="error" class="error-details">
      <h4>Error Details</h4>
      <pre>{{ error }}</pre>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { db } from '@/firebase/config'
import { collection, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore'
import { tradeService } from '@/firebase/tradeService'

const status = ref({
  initialized: false,
  firestoreConnected: false
})

const config = ref({
  projectId: '',
  authDomain: '',
  apiKey: ''
})

const envVars = ref({})
const testing = ref(false)
const testResult = ref(null)
const testingTrades = ref(false)
const tradeTestResult = ref(null)
const error = ref('')

onMounted(async() => {
  try {
    // Check environment variables
    envVars.value = {
      'VITE_FIREBASE_API_KEY': !!import.meta.env.VITE_FIREBASE_API_KEY,
      'VITE_FIREBASE_AUTH_DOMAIN': !!import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      'VITE_FIREBASE_PROJECT_ID': !!import.meta.env.VITE_FIREBASE_PROJECT_ID,
      'VITE_FIREBASE_STORAGE_BUCKET': !!import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      'VITE_FIREBASE_MESSAGING_SENDER_ID': !!import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      'VITE_FIREBASE_APP_ID': !!import.meta.env.VITE_FIREBASE_APP_ID
    }

    // Check configuration
    config.value = {
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      apiKey: `${import.meta.env.VITE_FIREBASE_API_KEY?.substring(0, 10)}...`
    }

    // Check if Firebase is initialized
    if (db) {
      status.value.initialized = true
      console.log('Firebase DB instance:', db)
    }

    // Initial connection test
    await testConnection()
  } catch (err) {
    error.value = err.message || 'Unknown error during initialization'
    console.error('Firebase debug initialization error:', err)
  }
})

const testConnection = async() => {
  testing.value = true
  testResult.value = null

  try {
    console.log('Testing Firestore connection...')

    // Test 1: Try to read from a collection
    console.log('Test 1: Reading from trades collection...')
    const tradesRef = collection(db, 'trades')
    const snapshot = await getDocs(tradesRef)
    console.log('Trades collection snapshot:', snapshot)
    console.log('Number of documents:', snapshot.size)

    // Test 2: Try to write a test document
    console.log('Test 2: Writing test document...')
    const testDoc = {
      testField: 'test-value',
      timestamp: new Date().toISOString(),
      type: 'connection-test'
    }
    const docRef = await addDoc(collection(db, 'test-connection'), testDoc)
    console.log('Test document written with ID:', docRef.id)

    // Test 3: Clean up test document
    console.log('Test 3: Cleaning up test document...')
    await deleteDoc(doc(db, 'test-connection', docRef.id))
    console.log('Test document deleted')

    status.value.firestoreConnected = true
    testResult.value = {
      success: true,
      message: `Connection successful!\n- Read access: ✅\n- Write access: ✅\n- Delete access: ✅\n- Documents in trades: ${snapshot.size}`
    }
  } catch (err) {
    console.error('Firestore connection test failed:', err)
    status.value.firestoreConnected = false

    let errorMessage = err.message
    if (err.code) {
      errorMessage = `${err.code}: ${err.message}`
    }

    testResult.value = {
      success: false,
      message: `Connection failed: ${errorMessage}\n\nCommon causes:\n- Firestore rules deny access\n- Network connectivity issues\n- Invalid project configuration\n- Firestore not enabled in Firebase console`
    }
  } finally {
    testing.value = false
  }
}

const testTradeService = async() => {
  testingTrades.value = true
  tradeTestResult.value = null

  try {
    console.log('Testing Trade Service...')

    // Test simple getAllTrades first (no ordering)
    console.log('Test 1: Getting all trades (simple)...')
    let trades = []
    try {
      trades = await tradeService.getAllTradesSimple()
      console.log('Simple trades retrieved:', trades.length)
    } catch (simpleError) {
      console.log('Simple getAllTrades failed:', simpleError.message)

      // Test ordered getAllTrades
      console.log('Test 2: Getting all trades (with ordering)...')
      trades = await tradeService.getAllTrades()
      console.log('Ordered trades retrieved:', trades.length)
    }

    tradeTestResult.value = {
      success: true,
      message: `Trade Service working!\n- Retrieved ${trades.length} trades\n- Service methods available: ${Object.keys(tradeService).join(', ')}\n\nIf you see 0 trades, that's normal for a new database.`
    }
  } catch (err) {
    console.error('Trade Service test failed:', err)

    let errorMessage = err.message
    if (err.code) {
      errorMessage = `${err.code}: ${err.message}`
    }

    tradeTestResult.value = {
      success: false,
      message: `Trade Service failed: ${errorMessage}\n\nThis is likely the 400 error you're seeing!\n\nQuick fixes:\n1. Check Firestore security rules (see FIRESTORE_SETUP.md)\n2. Ensure Firestore database is created\n3. Create required indexes if needed`
    }
  } finally {
    testingTrades.value = false
  }
}
</script>

<style scoped>
.firebase-debug {
  max-width: 800px;
  margin: 20px auto;
  padding: 20px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  background: #f9fafb;
  font-family: 'Courier New', monospace;
}

.debug-section {
  margin-bottom: 20px;
  padding: 15px;
  background: white;
  border-radius: 6px;
  border: 1px solid #d1d5db;
}

.debug-section h4 {
  margin: 0 0 10px 0;
  color: #374151;
  font-size: 1.1rem;
}

.status-item, .env-item {
  display: flex;
  justify-content: space-between;
  margin: 8px 0;
  padding: 5px 0;
}

.label, .env-key {
  font-weight: bold;
  color: #4b5563;
}

.success {
  color: #059669;
  font-weight: bold;
}

.error {
  color: #dc2626;
  font-weight: bold;
}

.value, .env-value {
  color: #6b7280;
}

.test-btn {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
}

.test-btn:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

.test-btn:hover:not(:disabled) {
  background: #2563eb;
}

.test-result {
  margin-top: 15px;
  padding: 15px;
  border-radius: 6px;
  border: 1px solid;
}

.test-result.success {
  background: #ecfdf5;
  border-color: #10b981;
  color: #064e3b;
}

.test-result.error {
  background: #fef2f2;
  border-color: #ef4444;
  color: #7f1d1d;
}

.test-result pre {
  margin: 10px 0 0 0;
  white-space: pre-wrap;
  font-family: inherit;
}

.error-details {
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 6px;
  padding: 15px;
  color: #7f1d1d;
}

.error-details pre {
  margin: 10px 0 0 0;
  white-space: pre-wrap;
}

.env-vars {
  background: #f3f4f6;
  padding: 10px;
  border-radius: 4px;
}
</style>
