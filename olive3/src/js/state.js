/**
 * Global State Management Module
 * Centralized state for the application
 */

import { showToast } from './utils.js';

// Application State
export const state = {
  // User & Auth
  currentUser: null,
  isLoginMode: true,
  isCurrentUserAdmin: false,
  dynamicAdmins: [],
  dynamicAdminsList: [],

  // Products
  products: [],
  isProductsLoaded: false,
  currentCategoryFilter: 'الكل',
  searchQuery: '',
  currentRenderedProducts: 8,
  productsPerPage: 8,

  // Cart & Checkout
  cart: [],
  savedForLater: [],
  wishlist: [],
  currentSubtotal: 0,
  currentShippingCost: 0,
  currentDiscountPercent: 0,
  appliedPromoCode: "",
  promoCodesList: [],
  loyaltyDiscountFixed: 0,
  loyaltyPointsUsedTemp: 0,
  activeProductForReview: null,
  activeVariantForCart: null,

  // Admin
  adminOrdersArray: [],
  adminReturnsArray: [],
  currentAdminOrderFilter: 'الكل',
  totalGlobalRevenue: 0,
  totalGlobalOrders: 0,

  // Chat & Notifications
  unsubscribeUserChat: null,
  activeAdminChatId: null,
  unsubscribeActiveAdminChat: null,
  adminOrdersUnsubscribe: null,
  adminReturnsUnsubscribe: null,
  adminUsersUnsubscribe: null,

  // Settings
  storeSettings: {
    walletNumber: "01018631768",
    fbPixelId: "",
    ttPixelId: "",
    categories: ["زيت زيتون"],
    autoReplyMessage: "أهلًا بيك❤️\nاكتب استفسارك وبمجرد ما يتوفر أدمن هيتم التواصل معاكم في أسرع وقت.",
    floatingButtons: [
      { id: 'btn_support', icon: '💬', link: '#support', color: '#007bff', isSystem: true, title: 'خدمة العملاء' },
      { id: 'btn_wa', icon: '📱', link: 'https://wa.me/201018631768', color: '#25D366', isSystem: false, title: 'واتساب' }
    ],
    revenueResetDate: "2000-01-01T00:00:00.000Z",
    ordersResetDate: "2000-01-01T00:00:00.000Z",
    enableCrossSell: true,
    visualBarMode: 'categories'
  },

  // Language
  currentLang: 'ar',

  // Delivery Data
  deliveryData: {
    "القاهرة": { shippingCost: 90, cities: ["مدينة نصر", "المعادي", "مصر الجديدة", "شبرا", "التجمع الخامس", "عين شمس", "حلوان", "المطرية", "المرج", "وسط البلد", "الزمالك", "الرحاب", "الشروق", "مدينتي", "العباسية", "دار السلام"] },
    "الجيزة": { shippingCost: 90, cities: ["الدقي", "المهندسين", "الهرم", "فيصل", "6 أكتوبر", "الشيخ زايد", "العجوزة", "البدرشين", "الصف", "الحوامدية", "العياط", "أوسيم", "كرداسة", "الوراق", "إمبابة"] },
    "الشرقية": { shippingCost: 90, cities: ["الزقازيق", "فاقوس", "بلبيس", "منيا القمح", "أبو حماد", "العاشر من رمضان", "ههيا", "أبو كبير", "ديرب نجم", "الحسينية", "مشتول السوق", "أولاد صقر", "الإبراهيمية", "القرين", "القنايات"] },
    "الإسكندرية": { shippingCost: 90, cities: ["سيدي جابر", "سموحة", "محرم بك", "العجمي", "المنتزه", "ميامي", "العامرية", "برج العرب", "سيدي بشر", "المندرة", "كليوباترا", "لوران", "كامب شيزار"] },
    "القليوبية": { shippingCost: 90, cities: ["بنها", "شبرا الخيمة", "قليوب", "طوخ", "الخانكة", "القناطر الخيرية", "شبين القناطر", "العبور", "الخصوص", "قها"] },
    "المنوفية": { shippingCost: 90, cities: ["شبين الكوم", "منوف", "أشمون", "قويسنا", "بركة السبع", "تلا", "الشهداء", "السادات", "سرس الليان"] },
    "كفر الشيخ": { shippingCost: 90, cities: ["كفر الشيخ", "دسوق", "فوه", "مطوبس", "بيلا", "الحامول", "سيدي سالم", "بلطيم", "قلين", "الرياض", "سيدي غازي", "مسير"] },
    "البحر الأحمر": { shippingCost: 100, cities: ["الغردقة", "سفاجا", "القصير", "مرسى علم", "رأس غارب", "حلايب", "شلاتين"] },
    "الوادي الجديد": { shippingCost: 100, cities: ["الخارجة", "الداخلة", "الفرافرة", "باريس", "بلاط"] },
    "مطروح": { shippingCost: 100, cities: ["مرسى مطروح", "العلمين", "الحمام", "الضبعة", "سيوة", "النجيلة", "براني", "السلوم"] }
    // ... rest of governorates
  },

  // Saved Accounts
  savedAccounts: [],

  // Visual Scroll
  visualScrollInterval: null,

  // Checkout Map
  checkoutMap: null,
  userMarker: null,

  // Compare Products
  compareProductIds: []
};

// Initialize state from localStorage
export async function initState() {
  try {
    state.cart = JSON.parse(localStorage.getItem('cart')) || [];
    state.savedForLater = JSON.parse(localStorage.getItem('savedForLater')) || [];
    state.wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
    state.savedAccounts = JSON.parse(localStorage.getItem('zait_saved_accounts')) || [];
    state.currentLang = localStorage.getItem('zait_lang') || 'ar';

    // Apply theme
    if (localStorage.getItem('zait_theme') === 'dark') {
      document.body.classList.add('dark-mode');
    }

    // Apply language
    document.documentElement.dir = state.currentLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = state.currentLang;
  } catch (e) {
    console.error('Error initializing state:', e);
  }
}

  // Persist cart to localStorage
export async function persistCart() {
  localStorage.setItem('cart', JSON.stringify(state.cart));
  localStorage.setItem('savedForLater', JSON.stringify(state.savedForLater));
  localStorage.setItem('wishlist', JSON.stringify(state.wishlist));
}

// Persist saved accounts to localStorage
export async function persistSavedAccounts() {
  localStorage.setItem('zait_saved_accounts', JSON.stringify(state.savedAccounts));
}

// Update admin status
export async function updateAdminStatus(user) {
  if (!user) {
    state.isCurrentUserAdmin = false;
    return;
  }

  const { SUPER_ADMINS } = await import('./firebase.js');
  const email = (user.email || '').toLowerCase();
  const phone = user.phoneNumber || '';

  state.isCurrentUserAdmin = SUPER_ADMINS.includes(email) ||
    SUPER_ADMINS.includes(phone) ||
    state.dynamicAdmins.includes(email);

  // Update UI visibility
  document.querySelectorAll('.admin-tab').forEach(tab => {
    tab.style.display = state.isCurrentUserAdmin ? 'inline-block' : 'none';
  });
}

// Reset state on logout
export function resetState() {
  state.currentUser = null;
  state.isCurrentUserAdmin = false;
  state.cart = [];
  state.savedForLater = [];
  state.wishlist = [];
  state.currentSubtotal = 0;
  state.currentShippingCost = 0;
  state.currentDiscountPercent = 0;
  state.appliedPromoCode = "";
  state.loyaltyDiscountFixed = 0;
  state.loyaltyPointsUsedTemp = 0;

  // Cleanup listeners
  if (state.unsubscribeUserChat) { state.unsubscribeUserChat(); state.unsubscribeUserChat = null; }
  if (state.unsubscribeActiveAdminChat) { state.unsubscribeActiveAdminChat(); state.unsubscribeActiveAdminChat = null; }
  if (state.adminOrdersUnsubscribe) { state.adminOrdersUnsubscribe(); state.adminOrdersUnsubscribe = null; }
  if (state.adminReturnsUnsubscribe) { state.adminReturnsUnsubscribe(); state.adminReturnsUnsubscribe = null; }
  if (state.adminUsersUnsubscribe) { state.adminUsersUnsubscribe(); state.adminUsersUnsubscribe = null; }

  persistCart();
}

// Export state getters/setters for backward compatibility
export function getState() { return state; }
export function setState(key, value) { state[key] = value; }

export default state;