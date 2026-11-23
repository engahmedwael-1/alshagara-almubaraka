/// <reference types="vite/client" />

// Global interface extensions for Zait Store
interface Window {
  // App config
  APP_CONFIG: import('../config').default;

  // State
  loyaltyEarnRateActual: number;
  loyaltyRedeemValueActual: number;
  loyaltyDiscountFixed: number;
  loyaltyPointsUsedTemp: number;
  currentSubtotal: number;
  currentShippingCost: number;
  currentDiscountPercent: number;
  appliedPromoCode: string;
  promoCodesList: PromoCode[];
  totalGlobalRevenue: number;
  totalGlobalOrders: number;
  adminOrdersArray: Order[];
  adminReturnsArray: ReturnRequest[];
  customerOrdersArray: Order[];
  compareProductIds: string[];
  visualScrollInterval: NodeJS.Timeout | null;
  checkoutMap: L.Map | null;
  userMarker: L.Marker | null;
  unsubscribeUserChat: (() => void) | null;
  activeAdminChatId: string | null;
  unsubscribeActiveAdminChat: (() => void) | null;
  adminOrdersUnsubscribe: (() => void) | null;
  adminReturnsUnsubscribe: (() => void) | null;
  adminUsersUnsubscribe: (() => void) | null;
  currentCategoryFilter: string;
  searchQuery: string;
  activeProductForReview: string | null;
  activeVariantForCart: ProductVariant | null;
  currentAdminOrderFilter: string;
  isLoginMode: boolean;
  isProductsLoaded: boolean;
  isCurrentUserAdmin: boolean;
  currentUser: FirebaseUser | null;
  dynamicAdmins: string[];
  dynamicAdminsList: AdminUser[];
  savedAccounts: SavedAccount[];
  currentRenderedProducts: number;
  productsPerPage: number;
  products: Product[];
  cart: CartItem[];
  savedForLater: CartItem[];
  wishlist: string[];
  storeSettings: StoreSettings;
  deliveryData: DeliveryData;
  currentLang: 'ar' | 'en';
  panels: Record<string, HTMLElement>;

  // Utility functions
  hashString: (str: string) => Promise<string>;
  escapeHTML: (str: string) => string;
  toEngDigits: (str: string) => string;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  fuzzyMatch: (str: string, query: string) => boolean;
  formatNumber: (num: number) => string;
  formatCurrency: (amount: number) => string;
  formatDate: (date: Date | string, options?: Intl.DateTimeFormatOptions) => string;
  formatDateTime: (date: Date | string) => string;
  generateId: () => string;
  debounce: <T extends (...args: any[]) => any>(func: T, wait: number) => T;
  throttle: <T extends (...args: any[]) => any>(func: T, limit: number) => T;
  deepClone: <T>(obj: T) => T;
  isEmpty: (obj: object) => boolean;
  getNested: (obj: object, path: string, defaultValue?: any) => any;
  setNested: (obj: object, path: string, value: any) => void;
  sleep: (ms: number) => Promise<void>;
  retry: <T>(fn: () => Promise<T>, retries?: number, delay?: number) => Promise<T>;
  parseVariants: (vStr: string) => ProductVariant[];
  isValidEmail: (email: string) => boolean;
  isValidEgyptPhone: (phone: string) => boolean;
  normalizeEgyptPhone: (phone: string) => string;
  getQueryParam: (name: string) => string | null;
  setQueryParam: (name: string, value: string) => void;
  copyToClipboard: (text: string) => Promise<boolean>;
  randomColor: () => string;
  isInViewport: (el: Element) => boolean;

  // Product functions
  loadProducts: () => void;
  getFilteredProductsCount: () => number;
  renderProducts: (scrollToTop?: boolean) => void;
  filterProducts: (category: string) => void;
  renderWishlist: () => void;
  togglePinProduct: (productId: string, currentPinned: boolean) => Promise<void>;
  toggleHideProduct: (productId: string, currentHidden: boolean) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
  updateProductPriceAdmin: (productId: string, element: HTMLElement) => Promise<void>;
  openProductModal: (id: string) => void;
  closeProductModal: () => void;
  changeMainImg: (url: string, el: HTMLElement) => void;
  updateModalVariantPrice: () => void;
  executeAddToCart: (event: Event, id: string, name: string) => void;
  addToCart: (id: string, name: string, price: number, imageUrl: string, variantSuffix?: string) => void;
  updateQuantity: (cartItemId: string, change: number) => void;
  updateCartUI: () => void;
  updateInvoiceUI: () => void;
  toggleCartItemSelection: (cartItemId: string, isChecked: boolean) => void;
  saveForLater: (cartItemId: string) => void;
  moveToCart: (cartItemId: string) => void;
  updateCartItemCustomNote: (cartItemId: string, note: string) => void;
  syncCartToCloud: () => Promise<void>;
  removeDiscount: () => Promise<void>;
  goToCheckout: () => void;
  processOrder: (method: string) => Promise<void>;
  executeBuyNow: () => void;

  // Auth functions
  saveAccountLocally: (email: string, password: string) => void;
  renderSavedAccounts: () => void;
  switchFastAccount: (email: string, encodedPass: string) => Promise<void>;
  logoutUser: () => Promise<void>;
  saveProfileData: () => Promise<void>;
  initProfileSelects: () => void;
  showProfilePanel: () => void;
  togglePassword: () => void;

  // Order functions
  loadAdminOrders: () => void;
  renderAdminOrdersUI: () => void;
  filterAdminOrders: (status: string) => void;
  openAdminOrderModal: (id: string) => void;
  updateOrderStatus: (orderId: string, newStatus: string) => Promise<void>;
  deleteAdminOrder: (orderId: string) => Promise<void>;
  printOrder: (id: string) => void;
  loadCustomerOrders: () => void;
  getStepIndex: (status: string) => number;
  openCustomerOrderModal: (orderId: string) => void;
  cancelOrder: (orderId: string) => Promise<void>;
  openReturnModal: (orderId: string) => void;
  submitReturnRequest: () => Promise<void>;
  loadAdminReturns: () => void;
  approveReturn: (returnId: string, orderId: string) => Promise<void>;
  buyAgainOrder: (orderId: string) => void;

  // Chat functions
  loadCustomerChat: () => void;
  sendSupportMessage: () => Promise<void>;
  endChat: () => Promise<void>;
  deleteChat: () => Promise<void>;
  loadAdminChats: () => void;
  openAdminChat: (id: string, name: string) => void;
  closeAdminChat: () => void;
  sendAdminMessage: () => Promise<void>;
  endAdminChat: () => Promise<void>;
  deleteAdminChat: () => Promise<void>;

  // Admin functions
  updateAdminUI: () => Promise<void>;
  loadAdminUsers: () => void;
  showUserHistory: (userId: string, userName: string) => void;
  renderAdminsList: () => void;
  addAdmin: () => Promise<void>;
  removeAdmin: (id: string) => Promise<void>;
  applySettingsToUI: () => void;
  saveSettings: () => Promise<void>;
  addCategory: () => Promise<void>;
  removeCategory: (index: number) => Promise<void>;
  addPromoCode: () => Promise<void>;
  removePromo: (id: string) => Promise<void>;
  sendGlobalNotification: () => Promise<void>;
  deleteGlobalNotification: (docId: string) => Promise<void>;
  exportOrdersCSV: () => void;
  bulkUpdateOrderStatus: () => Promise<void>;
  selectAllOrders: () => void;

  // UI functions
  showPanel: (panelId: string) => void;
  togglePaymentInfo: (method: string) => void;
  initLocationButton: () => void;
  toggleDarkMode: () => void;
  toggleLanguage: () => void;
  openSidebar: () => void;
  closeSidebar: () => void;
  toggleSidebarReorderMode: () => void;
  initCheckoutSelects: () => void;
  initMagnifier: () => void;
  initScrollHandler: () => void;
  updateOfferTimer: () => void;
  checkAbandonedCart: () => void;
  renderRecentlyViewedFull: (filterDate?: string | null) => void;
  filterRecentlyViewed: () => void;
  clearRecentFilter: () => void;
  addRecentlyViewed: (product: Product) => void;
  showRandomSocialProof: () => void;
  shareProduct: () => void;
  askProductWa: (id: string) => void;
  toggleWishlist: (event: Event, id: string) => void;
  toggleCompareProduct: (event: Event, id: string) => void;
  openQuickOrderModal: (event: Event, id: string) => void;
  requestBackInStock: (event: Event, id: string, name: string) => void;
  deleteReview: (productId: string, reviewIndex: number) => Promise<void>;
  submitReview: () => Promise<void>;
  generateFakeReviews: (productName: string, count: number) => Review[];

  // Notification functions
  toggleNotifications: (e: Event) => void;
  loadUserNotifications: () => void;
  loadGlobalNotificationsPanel: () => void;
  redeemLoyaltyPoints: () => Promise<void>;
  loadAllReviews: () => void;
  submitGeneralReview: () => Promise<void>;

  // Admin reset functions
  resetAdminRevenue: () => Promise<void>;
  resetAdminOrdersCount: () => Promise<void>;

  // Firebase
  __ZAIT_STORE__: {
    state: any;
    db: any;
    auth: any;
  };
}

// Type definitions
interface Product {
  id: string;
  name: string;
  price: number;
  oldPrice?: number;
  costPrice?: number;
  category: string;
  stock?: number | string;
  description?: string;
  imageUrl?: string;
  images?: string[];
  variantsData?: ProductVariant[];
  createdAt?: string;
  sortOrder?: number;
  discountEndsAt?: string;
  specialBadge?: string;
  customSpecs?: string;
  videoUrl?: string;
  isPinned?: boolean;
  isHidden?: boolean;
  featured?: boolean;
  reviews?: Review[];
  questionsList?: Question[];
  viewCount?: number;
}

interface ProductVariant {
  name: string;
  price: number;
  stock?: number;
}

interface CartItem {
  id: string;
  cartItemId: string;
  name: string;
  price: number;
  imageUrl: string;
  quantity: number;
  variant?: string;
  selected?: boolean;
  customNote?: string;
}

interface Order {
  id: string;
  userId: string;
  customerEmail: string;
  customerName: string;
  phones: { primary: string; secondary: string };
  location: {
    governorate: string;
    city: string;
    mapAddress: string;
    details: string;
    lat: number;
    lng: number;
    mapLink: string;
  };
  items: CartItem[];
  subtotal: number;
  discount: number;
  promoCode: string;
  shippingCost: number;
  totalAmount: number;
  orderMethod: string;
  trafficSource: string;
  freeGiftUnlocked: string;
  deliveryTimeSlot: string;
  giftWrapInfo: string;
  paymentMethod: string;
  receiptUrl: string;
  status: string;
  orderDate: string;
  updatedAt?: string;
  canceledAt?: string;
  pointsAdded?: boolean;
  usedLoyaltyPoints?: number;
}

interface ReturnRequest {
  id: string;
  orderId: string;
  customerEmail: string;
  reason: string;
  notes: string;
  imageUrl: string;
  status: string;
  date: string;
}

interface Review {
  userName: string;
  userId?: string;
  rating: number;
  comment: string;
  date: string;
  imageUrl?: string;
}

interface Question {
  userName: string;
  question: string;
  date: string;
  answer?: string;
  answeredAt?: string;
}

interface PromoCode {
  id: string;
  code: string;
  discount: number;
  singleUse?: boolean;
  used?: boolean;
  usageCount?: number;
  usedBy?: string[];
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  applicableCategories?: string[];
  applicableProducts?: string[];
  validFrom?: string;
  validUntil?: string;
}

interface AdminUser {
  id: string;
  email: string;
}

interface SavedAccount {
  email: string;
  password: string; // base64 encoded
}

interface StoreSettings {
  walletNumber: string;
  fbPixelId: string;
  ttPixelId: string;
  categories: string[];
  autoReplyMessage: string;
  floatingButtons: FloatingButton[];
  revenueResetDate: string;
  ordersResetDate: string;
  enableCrossSell: boolean;
  visualBarMode: 'categories' | 'products' | 'none';
  loyaltyEarnRate?: number;
  loyaltyRedeemValue?: number;
  freeShippingThreshold?: number;
  enableAutoReply?: boolean;
  enableFreeShipping?: boolean;
  enableBackInStock?: boolean;
  enableQuickOrder?: boolean;
  enableProductCompare?: boolean;
  enableProductBadges?: boolean;
  enablePinHideProducts?: boolean;
  enableVariantStock?: boolean;
  enableDeliverySlot?: boolean;
  enableGiftWrap?: boolean;
  enableBuyAgain?: boolean;
  cloudinaryCloudName?: string;
  cloudinaryUploadPreset?: string;
  appendHoursToAutoReply?: boolean;
  workingHoursText?: string;
}

interface FloatingButton {
  id: string;
  icon: string;
  link: string;
  color: string;
  isSystem: boolean;
  title: string;
}

interface DeliveryData {
  [governorate: string]: {
    shippingCost: number;
    cities: string[];
  };
}

interface FirebaseUser {
  uid: string;
  email?: string | null;
  displayName?: string | null;
  phoneNumber?: string | null;
  photoURL?: string | null;
}

interface L {
  Map: any;
  Marker: any;
  tileLayer: any;
  map: any;
  marker: any;
}

// Module declarations for external libraries
declare module 'leaflet' {
  export * from 'leaflet';
}

declare module 'firebase/app' {
  export * from 'firebase/app';
}

declare module 'firebase/auth' {
  export * from 'firebase/auth';
}

declare module 'firebase/firestore' {
  export * from 'firebase/firestore';
}

declare module 'firebase/analytics' {
  export * from 'firebase/analytics';
}