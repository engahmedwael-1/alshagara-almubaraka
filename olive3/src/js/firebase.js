/**
 * Firebase Initialization Module
 * Initializes Firebase App, Auth, Firestore with config from environment
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, connectFirestoreEmulator } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getAuth, connectAuthEmulator } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getAnalytics, isSupported } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-analytics.js";
import CONFIG from './config.js';

// Initialize Firebase App
const app = initializeApp(CONFIG.firebase);

// Initialize services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new (await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js")).GoogleAuthProvider();

// Initialize Analytics (only in production)
let analytics = null;
if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
  isSupported().then(supported => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

export { analytics };

// Export config for reference
export const SUPER_ADMINS = CONFIG.security.superAdmins;
export const PIN_HASH = CONFIG.security.pinHash;
export const NATIONAL_ID_HASH = CONFIG.security.nationalIdHash;

// Helper to check if user is super admin
export function isSuperAdmin(user) {
  if (!user) return false;
  const email = (user.email || '').toLowerCase();
  const phone = user.phoneNumber || '';
  return SUPER_ADMINS.includes(email) || SUPER_ADMINS.includes(phone);
}

// Helper to check if user is admin (super admin or dynamic admin)
export async function isAdmin(user) {
  if (!user) return false;
  if (isSuperAdmin(user)) return true;

  // Check dynamic admins from Firestore
  try {
    const { getDocs, collection, query, where } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");
    const adminsSnap = await getDocs(query(collection(db, 'admins'), where('email', '==', (user.email || '').toLowerCase())));
    return !adminsSnap.empty;
  } catch (e) {
    console.error('Error checking admin status:', e);
    return false;
  }
}

// Connect to emulators in development
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
  // Uncomment to use emulators
  // connectFirestoreEmulator(db, 'localhost', 8080);
  // connectAuthEmulator(auth, 'http://localhost:9099');
  console.log('🔥 Firebase initialized in development mode');
}

export default app;