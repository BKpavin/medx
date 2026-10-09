/**
 * MEDX Healthcare System - Firebase Configuration & Initialization Module
 * 
 * Official Firebase SDK connection file for project: MEDX (medx-e7f17)
 */

// Firebase Configuration Object (Supports environment overrides via window.ENV_FIREBASE_*)
const firebaseConfig = {
  apiKey: (typeof window !== 'undefined' && window.ENV_FIREBASE_API_KEY) || "AIzaSyD2ECpKw45L_mucUpgs1mxWmfrEKjj02qQ",
  authDomain: (typeof window !== 'undefined' && window.ENV_FIREBASE_AUTH_DOMAIN) || "medx-e7f17.firebaseapp.com",
  projectId: (typeof window !== 'undefined' && window.ENV_FIREBASE_PROJECT_ID) || "medx-e7f17",
  storageBucket: (typeof window !== 'undefined' && window.ENV_FIREBASE_STORAGE_BUCKET) || "medx-e7f17.firebasestorage.app",
  messagingSenderId: (typeof window !== 'undefined' && window.ENV_FIREBASE_MESSAGING_SENDER_ID) || "240049651660",
  appId: (typeof window !== 'undefined' && window.ENV_FIREBASE_APP_ID) || "1:240049651660:web:374e65b1ffd36116d26769",
  measurementId: (typeof window !== 'undefined' && window.ENV_FIREBASE_MEASUREMENT_ID) || "G-C8J3NWQTK9"
};

// Global Firebase & Firestore Initialization
(function initializeFirebaseApp() {
  try {
    if (typeof firebase !== 'undefined') {
      if (!firebase.apps || !firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
        console.log('🔥 Firebase App initialized successfully (Project: medx-e7f17)');
      } else {
        console.log('🔥 Firebase App already initialized');
      }

      if (firebase.auth) {
        window.auth = firebase.auth();
        console.log('🔒 Firebase Auth initialized successfully');
      }

      if (firebase.firestore) {
        window.db = firebase.firestore();
        window.firebaseInitialized = true;
        console.log('⚡ Cloud Firestore initialized successfully');
      } else {
        console.warn('⚠️ Firebase App initialized, but Firestore SDK is unavailable');
      }
    } else {
      console.error('❌ Firebase SDK not detected. Ensure Firebase scripts are loaded before firebase-config.js');
    }
  } catch (error) {
    console.error('❌ Error initializing Firebase or Cloud Firestore:', error);
  }
})();
