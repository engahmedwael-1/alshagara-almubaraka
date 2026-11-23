/**
 * Configuration Module
 * Centralized configuration management with environment variable support
 */

// Default configuration (fallback values)
const DEFAULT_CONFIG = {
  firebase: {
    apiKey: "AIzaSyBJFZRij_8cprlkj4qV98WSZVRWdYLQY-I",
    authDomain: "olive-oile-store.firebaseapp.com",
    projectId: "olive-oile-store",
    storageBucket: "olive-oile-store.appspot.com",
    messagingSenderId: "991769684700",
    appId: "1:991769684700:web:adfd4958d6aba1c7902219",
    measurementId: ""
  },
  cloudinary: {
    cloudName: "",
    uploadPreset: ""
  },
  paymob: {
    apiKey: "",
    integrationId: "",
    iframeId: "",
    hmacSecret: ""
  },
  app: {
    url: "https://alshagara-almubaraka.vercel.app",
    name: "زيت الشجرة المباركة"
  },
  security: {
    superAdmins: ["aw734622@gmail.com", "mhmwdaltahrahmdwayl@gmail.com"],
    pinHash: "7a2ec40ff8a1247c532309355f798a779e00acff579c63eec3636ffb2902c1ac",
    nationalIdHash: "2d622f2c91074a475800b09968b837412b3a12f26519ca815feb9b0b1ad9a715"
  }
};

// Load from environment variables (Vite injects these at build time)
function loadFromEnv() {
  const config = { ...DEFAULT_CONFIG };

  // Firebase config
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    const env = import.meta.env;

    if (env.VITE_FIREBASE_API_KEY) config.firebase.apiKey = env.VITE_FIREBASE_API_KEY;
    if (env.VITE_FIREBASE_AUTH_DOMAIN) config.firebase.authDomain = env.VITE_FIREBASE_AUTH_DOMAIN;
    if (env.VITE_FIREBASE_PROJECT_ID) config.firebase.projectId = env.VITE_FIREBASE_PROJECT_ID;
    if (env.VITE_FIREBASE_STORAGE_BUCKET) config.firebase.storageBucket = env.VITE_FIREBASE_STORAGE_BUCKET;
    if (env.VITE_FIREBASE_MESSAGING_SENDER_ID) config.firebase.messagingSenderId = env.VITE_FIREBASE_MESSAGING_SENDER_ID;
    if (env.VITE_FIREBASE_APP_ID) config.firebase.appId = env.VITE_FIREBASE_APP_ID;
    if (env.VITE_FIREBASE_MEASUREMENT_ID) config.firebase.measurementId = env.VITE_FIREBASE_MEASUREMENT_ID;

    // Cloudinary
    if (env.VITE_CLOUDINARY_CLOUD_NAME) config.cloudinary.cloudName = env.VITE_CLOUDINARY_CLOUD_NAME;
    if (env.VITE_CLOUDINARY_UPLOAD_PRESET) config.cloudinary.uploadPreset = env.VITE_CLOUDINARY_UPLOAD_PRESET;

    // Paymob
    if (env.VITE_PAYMOB_API_KEY) config.paymob.apiKey = env.VITE_PAYMOB_API_KEY;
    if (env.VITE_PAYMOB_INTEGRATION_ID) config.paymob.integrationId = env.VITE_PAYMOB_INTEGRATION_ID;
    if (env.VITE_PAYMOB_IFRAME_ID) config.paymob.iframeId = env.VITE_PAYMOB_IFRAME_ID;
    if (env.VITE_PAYMOB_HMAC_SECRET) config.paymob.hmacSecret = env.VITE_PAYMOB_HMAC_SECRET;

    // App
    if (env.VITE_APP_URL) config.app.url = env.VITE_APP_URL;
    if (env.VITE_APP_NAME) config.app.name = env.VITE_APP_NAME;
  }

  return config;
}

// Export singleton config
const CONFIG = loadFromEnv();

// Make available globally for non-module scripts
if (typeof window !== 'undefined') {
  window.APP_CONFIG = CONFIG;
}

export default CONFIG;
export { DEFAULT_CONFIG };