// ═══════════════════════════════════════
// FIREBASE CONFIG — Firestore initialization
// Reads credentials from .env.js (git-ignored)
// ═══════════════════════════════════════
if (typeof ENV === "undefined") {
  console.error("⚠️ Missing .env.js — copy .env.js.example to .env.js and fill in your Firebase credentials.");
}

const firebaseConfig = {
  apiKey:            ENV.FIREBASE_API_KEY,
  authDomain:        ENV.FIREBASE_AUTH_DOMAIN,
  projectId:         ENV.FIREBASE_PROJECT_ID,
  storageBucket:     ENV.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: ENV.FIREBASE_MESSAGING_SENDER_ID,
  appId:             ENV.FIREBASE_APP_ID
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
