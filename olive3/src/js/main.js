/**
 * Main Entry Point
 * Initializes the application and imports all modules
 */

import './config.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// Import all modules
import { initState, state } from './state.js';
import { loadProducts } from './modules/products.js';
import { initAuth } from './modules/auth.js';
import { initCheckoutSelects, initProfileSelects, initMagnifier, initScrollHandler, updateOfferTimer, checkAbandonedCart, showRandomSocialProof } from './modules/ui.js';
import { loadAdminOrders } from './modules/orders.js';
import { loadAdminUsers, onSnapshot, collection } from './modules/admin.js';
import { loadUserNotifications } from './modules/notifications.js';
import { syncCartToCloud, updateCartUI } from './modules/cart.js';

// Import firebase initialized
import { db, auth, SUPER_ADMINS } from './firebase.js';

// Import utils
import { injectPixels } from './modules/admin.js';

// Initialize panels object for UI module
state.panels = {
  'home': document.getElementById('home-panel'),
  'cart': document.getElementById('cart-panel'),
  'checkout': document.getElementById('checkout-panel'),
  'auth': document.getElementById('auth-panel'),
  'admin': document.getElementById('admin-panel'),
  'support': document.getElementById('support-panel'),
  'admin-messages': document.getElementById('admin-messages-panel'),
  'admin-orders': document.getElementById('admin-orders-panel'),
  'admin-returns': document.getElementById('admin-returns-panel'),
  'customer-orders': document.getElementById('customer-orders-panel'),
  'admin-dashboard': document.getElementById('admin-dashboard-panel'),
  'wishlist': document.getElementById('wishlist-panel'),
  'reviews': document.getElementById('reviews-panel'),
  'recently-viewed-panel': document.getElementById('recently-viewed-panel'),
  'global-notifications-panel': document.getElementById('global-notifications-panel'),
  'admin-users': document.getElementById('admin-users-panel'),
  'loyalty': document.getElementById('loyalty-panel'),
  'profile': document.getElementById('profile-panel'),
  'admin-work': document.getElementById('admin-work-panel'),
  'admin-add-product': document.getElementById('admin-add-product-panel'),
  'recipes': document.getElementById('recipes-panel'),
  'admin-staff-ratings': document.getElementById('admin-staff-ratings-panel'),
  'admin-broadcast': document.getElementById('admin-broadcast-panel')
};

// Global variables for backward compatibility
window.loyaltyEarnRateActual = 20;
window.loyaltyRedeemValueActual = 10;
window.loyaltyDiscountFixed = 0;
window.loyaltyPointsUsedTemp = 0;
window.currentSubtotal = 0;
window.currentShippingCost = 0;
window.currentDiscountPercent = 0;
window.appliedPromoCode = "";
window.promoCodesList = [];
window.totalGlobalRevenue = 0;
window.totalGlobalOrders = 0;
window.adminOrdersArray = [];
window.adminReturnsArray = [];
window.customerOrdersArray = [];
window.compareProductIds = [];
window.visualScrollInterval = null;
window.checkoutMap = null;
window.userMarker = null;
window.unsubscribeUserChat = null;
window.activeAdminChatId = null;
window.unsubscribeActiveAdminChat = null;
window.adminOrdersUnsubscribe = null;
window.adminReturnsUnsubscribe = null;
window.adminUsersUnsubscribe = null;
window.currentCategoryFilter = 'الكل';
window.searchQuery = '';
window.activeProductForReview = null;
window.activeVariantForCart = null;
window.currentAdminOrderFilter = 'الكل';
window.isLoginMode = true;
window.isProductsLoaded = false;
window.isCurrentUserAdmin = false;
window.currentUser = null;
window.dynamicAdmins = [];
window.dynamicAdminsList = [];
window.savedAccounts = [];
window.currentRenderedProducts = 8;
window.productsPerPage = 8;
window.products = [];
window.cart = [];
window.savedForLater = [];
window.wishlist = [];
window.storeSettings = {};
window.deliveryData = {};
window.currentLang = 'ar';

// Initialize application
async function initApp() {
  console.log('🚀 Initializing Zait Store...');

  // Initialize state from localStorage
  initState();

  // Initialize authentication
  initAuth();

  // Initialize UI components
  initCheckoutSelects();
  initProfileSelects();
  initMagnifier();
  initScrollHandler();
  updateOfferTimer();

  // Initialize location button
  if (window.initLocationButton) window.initLocationButton();

  // Load products
  loadProducts();

  // Check abandoned cart
  checkAbandonedCart();

  // Show random social proof periodically
  setInterval(showRandomSocialProof, 25000);

  // Inject tracking pixels
  if (window.injectPixels) window.injectPixels();

  // Listen for dynamic admins
  onSnapshot(collection(db, 'admins'), (snapshot) => {
    state.dynamicAdmins = [];
    state.dynamicAdminsList = [];
    snapshot.forEach(doc => {
      state.dynamicAdmins.push(doc.data().email.toLowerCase());
      state.dynamicAdminsList.push({ id: doc.id, email: doc.data().email.toLowerCase() });
    });
    if (window.updateAdminUI) window.updateAdminUI();
    if (window.renderAdminsList) window.renderAdminsList();
  });

  // Handle URL params for product modal
  setTimeout(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id') || urlParams.get('product');
    if (productId && state.isProductsLoaded && window.openProductModal) {
      window.openProductModal(productId);
    }
  }, 1000);

  // Handle browser back/forward
  window.addEventListener('popstate', (event) => {
    if (event.state && event.state.productId && window.openProductModal) {
      window.openProductModal(event.state.productId);
    } else {
      const pm = document.getElementById('product-modal');
      if (pm) pm.style.display = 'none';
    }
  });

  // Click outside dropdowns
  document.addEventListener('click', (e) => {
    const resContainer = document.getElementById('live-search-results');
    if (resContainer && !e.target.closest('#search-input') && !e.target.closest('#live-search-results')) {
      resContainer.style.display = 'none';
    }
    const nd = document.getElementById('notifications-dropdown');
    if (nd && !e.target.closest('.notification-bell') && !e.target.closest('.notifications-dropdown')) {
      nd.classList.remove('show');
    }
    const pd = document.getElementById('profile-dropdown');
    if (pd && !e.target.closest('.profile-menu-btn') && !e.target.closest('#profile-dropdown')) {
      pd.classList.remove('show');
    }
  });

  // Initialize theme
  if (localStorage.getItem('zait_theme') === 'dark') {
    document.body.classList.add('dark-mode');
  }

  // Initialize language
  document.documentElement.dir = state.currentLang === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.lang = state.currentLang;

  console.log('✅ Zait Store initialized successfully!');
}

// Run initialization when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

// Export for debugging
if (typeof window !== 'undefined') {
  window.__ZAIT_STORE__ = {
    state,
    db,
    auth
  };
}

export { initApp, state };