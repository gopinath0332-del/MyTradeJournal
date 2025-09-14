import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

// Your web app's Firebase configuration
// Replace these with your Firebase project configuration
const firebaseConfig = {
    apiKey: "AIzaSyDE4Gf_sQrWxsdG-1jXAbW7DeaaPd3HCdg",
    authDomain: "tradingjournal-5d147.firebaseapp.com",
    projectId: "tradingjournal-5d147",
    storageBucket: "tradingjournal-5d147.firebasestorage.app",
    messagingSenderId: "331785829639",
    appId: "1:331785829639:web:4871e28378b0f70e1499a2",
    measurementId: "G-7PQ8XJSRX1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firestore
const db = getFirestore(app)

export { db }
