function togglePaymentInfo(...args) { if (typeof window !== 'undefined' && typeof window['togglePaymentInfo'] === 'function' && window['togglePaymentInfo'] !== togglePaymentInfo) return window['togglePaymentInfo'](...args); }
function initLocationButton(...args) { if (typeof window !== 'undefined' && typeof window['initLocationButton'] === 'function' && window['initLocationButton'] !== initLocationButton) return window['initLocationButton'](...args); }
function toggleCompareProduct(...args) { if (typeof window !== 'undefined' && typeof window['toggleCompareProduct'] === 'function' && window['toggleCompareProduct'] !== toggleCompareProduct) return window['toggleCompareProduct'](...args); }
function openQuickOrderModal(...args) { if (typeof window !== 'undefined' && typeof window['openQuickOrderModal'] === 'function' && window['openQuickOrderModal'] !== openQuickOrderModal) return window['openQuickOrderModal'](...args); }
function requestBackInStock(...args) { if (typeof window !== 'undefined' && typeof window['requestBackInStock'] === 'function' && window['requestBackInStock'] !== requestBackInStock) return window['requestBackInStock'](...args); }
/**
 * UI Module
 * Handles UI interactions, modals, panels, language, theme, sidebar
 */

import { state } from '../state.js';
import { showToast, escapeHTML, formatNumber } from '../utils.js';

/**
 * Show panel
 * @param {string} panelId - Panel ID to show
 */
export async function showPanel(panelId) {
  Object.values(state.panels || {}).forEach(p => {
    if (p) { p.classList.remove('active'); p.style.display = ''; }
  });
  document.querySelectorAll('.nav-btn, .bottom-nav-btn').forEach(btn => btn.classList.remove('active'));

  if (state.panels && state.panels[panelId]) state.panels[panelId].classList.add('active');

  document.querySelectorAll(`.nav-btn[onclick="window.showPanel('${panelId}')"], .bottom-nav-btn[onclick="window.showPanel('${panelId}')"]`).forEach(btn => btn.classList.add('active'));

  const hSection = document.getElementById('hero-section');
  if (hSection) hSection.style.display = panelId === 'home' ? 'block' : 'none';

  if (panelId === 'wishlist') { if (window.renderWishlist) window.renderWishlist(); }
  if (panelId === 'checkout') { initCheckoutMap(); }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Initialize checkout map
 */
let checkoutMap = null;
let userMarker = null;

function initCheckoutMap() {
  setTimeout(() => {
    if (!checkoutMap) {
      const mEl = document.getElementById('map');
      if (mEl && typeof L !== 'undefined') {
        checkoutMap = L.map('map').setView([30.0444, 31.2357], 6);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(checkoutMap);
        checkoutMap.on('click', async function(e) {
          if (userMarker) checkoutMap.removeLayer(userMarker);
          userMarker = L.marker(e.latlng).addTo(checkoutMap);
          document.getElementById('order-lat').value = e.latlng.lat;
          document.getElementById('order-lng').value = e.latlng.lng;
          document.getElementById('map-warning').style.display = 'none';
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${e.latlng.lat}&lon=${e.latlng.lng}&accept-language=ar`, { headers: { 'User-Agent': 'ZaitStoreApp/1.0' } });
            const data = await res.json();
            if (data && data.display_name) {
              document.getElementById('order-map-address').value = data.display_name;
              const govSelect = document.getElementById('order-gov');
              if (data.address && data.address.state) {
                const stateName = data.address.state.replace('محافظة ', '').trim();
                for (let i = 0; i < govSelect.options.length; i++) {
                  if (stateName.includes(govSelect.options[i].value) || govSelect.options[i].value.includes(stateName)) {
                    govSelect.selectedIndex = i;
                    govSelect.dispatchEvent(new Event('change'));
                    break;
                  }
                }
              }
            }
          } catch (err) {}
        });
      }
    }
    if (checkoutMap) checkoutMap.invalidateSize();
  }, 300);
}

/**
 * Toggle payment info
 * @param {string} method - Payment methoexport async function togglePaymentInfo(method) {hod) {
  const wi = document.getElementById('wallet-info');
  if (wi) wi.style.display = method === "محفظة إلكترونية" ? 'block' : 'none';
}

/**
 * Initialize locationexport async function initLocationButton() {onButton() {
  const locBtn = document.getElementById('btn-locate-me');
  if (locBtn) {
    locBtn.addEventListener('click', () => {
      if (navigator.geolocation) {
        showToast('جاري تحديد موقعك...', 'info');
        navigator.geolocation.getCurrentPosition(async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          if (userMarker) checkoutMap.removeLayer(userMarker);
          userMarker = L.marker([lat, lng]).addTo(checkoutMap);
          checkoutMap.flyTo([lat, lng], 16);
          document.getElementById('order-lat').value = lat;
          document.getElementById('order-lng').value = lng;
          document.getElementById('map-warning').style.display = 'none';
          showToast('تم تحديد الموقع بنجاح', 'success');
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=ar`, { headers: { 'User-Agent': 'ZaitStoreApp/1.0' } });
            const data = await res.json();
            if (data && data.display_name) {
              document.getElementById('order-map-address').value = data.display_name;
            }
          } catch (err) {}
        }, (error) => {
          showToast('يرجى تفعيل الـ GPS في هاتفك وإعطاء الصلاحية', 'error');
        });
      } else {
        showToast('متصفحك لا يدعم هذه الميزة', 'error');
      }
    });
  }
}

/**
 * Toggle dark mode
 */
export function toggleDarkMode() {
  document.body.classList.toggle('dark-mode');
  const isDark = document.body.classList.contains('dark-mode');
  localStorage.setItem('zait_theme', isDark ? 'dark' : 'light');
  if (window.closeSidebar) window.closeSidebar();
}

/**
 * Toggle language
 */
export function toggleLanguage() {
  state.currentLang = state.currentLang === 'ar' ? 'en' : 'ar';
  document.documentElement.dir = state.currentLang === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.lang = state.currentLang;
  localStorage.setItem('zait_lang', state.currentLang);

  const langBtn = document.getElementById('lang-btn');
  if (langBtn) langBtn.innerText = state.currentLang === 'ar' ? '🌐 EN' : '🌐 ع';

  const transElements = document.querySelectorAll('.translatable');
  const enDict = {
    "الخدمات والأقسام": "Services & Categories", "الرئيسية": "Home", "آراء العملاء": "Reviews",
    "👤 حسابي:": "👤 My Account:", "سلة المشتريات": "Shopping Cart", "طلباتي": "My Orders",
    "المفضلة": "Wishlist", "سجل المشاهدات": "Recently Viewed", "تصفح الأقسام:": "Browse Categories:",
    "🔄 تبديل الحسابات:": "🔄 Switch Accounts:", "إضافة حساب آخر": "Add Another Account",
    "تسجيل الخروج": "Logout", "الرئيسية 🏠": "Home 🏠", "السلة 🛒": "Cart 🛒",
    "المفضلة ❤️": "Wishlist ❤️", "طلباتي 📦": "Orders 📦", "الدعم 💬": "Support 💬",
    "تسجيل الدخول": "Login", "رصيد نقاط الولاء": "Loyalty Points", "نقطة": "Point",
    "🛒 منتجاتك في انتظارك!": "🛒 Your products are waiting!",
    "لإتمام طلبك الآن نهديك كود خصم خاص!": "Complete your order now and get a special discount!",
    "إكمال الطلب الآن 🚀": "Complete Order Now 🚀", "🔄 طلب استرجاع منتج": "🔄 Return Product",
    "سبب الاسترجاع:": "Return Reason:", "ملاحظات تفصيلية:": "Detailed Notes:",
    "📸 إرفاق صورة توضح المشكلة (مهم جداً):": "📸 Attach an image (Important):",
    "إرسال طلب الاسترجاع 🚀": "Submit Return 🚀", "زيت الشجرة المباركة": "Blessed Tree Oil",
    "زيتون سيناوي بكر ممتاز لذيذ أول طعم بارد بدون أي إضافات، أصلي من قلب الطبيعة.": "Premium Sinai Extra Virgin Olive Oil, cold pressed, 100% natural.",
    "🔥 عرض خاص لفترة محدودة!": "🔥 Special Limited Time Offer!", "الفلاتر والترتيب:": "Filters & Sorting:",
    "جاري تحميل المنتجات... ⏳": "Loading Products... ⏳", "جاري تحميل المزيد من المنتجات... ⏳": "Loading More... ⏳",
    "👀 سجل المشاهدات": "👀 Recently Viewed", "📅 ابحث عن المنتجات التي شاهدتها في يوم محدد:": "📅 Search by date:",
    "تصفية": "Filter", "الكل": "All", "🛒 سلة مشترياتك": "🛒 Shopping Cart",
    "الإجمالي:": "Total:", "المتابعة للدفع والتوصيل": "Proceed to Checkout",
    "❤️ منتجاتي المفضلة": "❤️ Favorite Products", "لم تقم بإضافة منتجات للمفضلة بعد.": "Your wishlist is empty.",
    "⭐️ آراء وتقييمات عملائنا": "⭐️ Customer Reviews", "هل جربت الشراء منا؟": "Have you purchased from us?",
    "نشر التقييم": "Post Review", "📍 بيانات التوصيل والدفع": "📍 Delivery & Payment",
    "هل لديك كود خصم؟ 🎁": "Have a promo code? 🎁", "تفعيل": "Apply",
    "حدد موقعك على الخريطة لتسهيل التوصيل تلقائياً.": "Pin your location on the map for delivery.",
    "📍 حدد موقعي الحالي": "📍 Pin My Location", "يرجى لمس الخريطة لتحديد موقعك بدقة!": "Please tap on the map to accurately pin your location!",
    "💳 طريقة الدفع:": "💳 Payment Method:", "المنتجات:": "Products:", "الخصم:": "Discount:",
    "الشحن:": "Shipping:", "الإجمالي النهائي:": "Final Total:", "تأكيد عبر الموقع 🌐": "Confirm via Website 🌐",
    "تأكيد عبر واتساب 💬": "Confirm via WhatsApp 💬", "العودة للسلة": "Back to Cart",
    "👤 طلباتي وحالة الشحن": "👤 My Orders & Shipping", "جاري تحميل طلباتك...": "Loading orders...",
    "💬 خدمة العملاء": "💬 Customer Support", "إنهاء 🛑": "End 🛑", "حذف 🗑️": "Delete 🗑️",
    "يرجى تسجيل الدخول أولاً.": "Please log in first.", "إرسال 🚀": "Send 🚀",
    "حساب جديد": "New Account", "دخول": "Login", "تسجيل": "Register",
    "ليس لديك حساب؟ أنشئ حساباً جديداً": "Don't have an account? Sign up",
    "لديك حساب؟ سجل الدخول": "Have an account? Log in", "نسيت كلمة المرور؟": "Forgot Password?",
    "أو": "OR", "🌐 المتابعة بحساب جوجل": "🌐 Continue with Google", "🔗 مشاركة": "🔗 Share",
    "يشاهده الآن": "Viewed now by", "شخص": "person", "اختر الحجم / النوع:": "Select Size / Type:",
    "طبيعي 100%": "100% Natural", "شحن سريع": "Fast Shipping", "دفع آمن": "Secure Payment",
    "استرجاع مضمون": "Guaranteed Return", "🛍️ منتجات قد تعجبك:": "🛍️ Products you may like:",
    "تقييمات العملاء ⭐️": "Customer Reviews ⭐️", "أضف تقييمك:": "Add your review:",
    "📸 إرفاق صورة للمنتج (اختياري):": "📸 Attach Product Image (Optional):",
    "⏳ جاري الرفع...": "⏳ Uploading...", "إرسال التقييم": "Submit Review",
    "سجل الدخول لإضافة تقييم.": "Log in to review.", "اشترى": "Bought", "منذ دقيقتين": "2 mins ago",
    "الوضع الليلي / النهاري": "Dark / Light Mode", "الإجمالي (للعناصر المحددة):": "Total (selected):",
    "حفظ لوقت لاحق": "Save for later", "📦 محفوظة لوقت لاحق": "📦 Saved for later",
    "نقل إلى السلة": "Move to Cart", "تفعيل البيع المتقاطع (المنتجات المقترحة للعميل) 🛍️": "Enable Cross-Selling 🛍️",
    "العملاء 👥": "Customers 👥", "👥 قائمة العملاء المسجلين": "👥 Registered Customers",
    "نقاط الولاء 🎁": "Loyalty Points 🎁", "مرحباً بك في برنامج الولاء الخاص بنا!": "Welcome to our loyalty program!",
    "إجمالي نقاطك الحالية": "Total Points", "استبدل النقاط بخصم الآن!": "Redeem points for discount!",
    "كيف يعمل البرنامج؟ 🤔": "How it works? 🤔", "تكسب": "Earn", "مقابل كل": "for every",
    "جنيه تنفقها في المتجر.": "EGP spent.", "تتم إضافة النقاط إلى حسابك تلقائياً بمجرد استلامك للطلب.": "Points are added automatically upon delivery.",
    "يمكنك استبدال كل": "You can redeem", "بخصم فوري قيمته": "for a direct discount of",
    "جنيه على طلبك القادم.": "EGP on your next order.", "أضف منتجات بقيمة": "Add products worth",
    "لتحصل على شحن مجاني! 🚚": "to get free shipping! 🚚", "🎉 مبروك! لقد حصلت على شحن مجاني": "🎉 Congrats! Free shipping unlocked",
    "استبدال بخصم": "Redeem", "🚀 اشتري الآن (دفع سريع)": "🚀 Buy Now"
  };
  const arDict = {}; for (let key in enDict) { arDict[enDict[key]] = key; }
  transElements.forEach(el => {
    let txt = el.innerText.trim();
    if (state.currentLang === 'en' && enDict[txt]) el.innerText = enDict[txt];
    if (state.currentLang === 'ar' && arDict[txt]) el.innerText = arDict[txt];
  });

  const searchInp = document.getElementById('search-input');
  if (searchInp) searchInp.placeholder = state.currentLang === 'ar' ? 'ابحث عن منتج...' : 'Search for a product...';
  const authEmail = document.getElementById('auth-email');
  if (authEmail) authEmail.placeholder = state.currentLang === 'ar' ? 'البريد الإلكتروني' : 'Email Address';
  const authPass = document.getElementById('auth-password');
  if (authPass) authPass.placeholder = state.currentLang === 'ar' ? 'كلمة المرور (6 أحرف على الأقل)' : 'Password (at least 6 chars)';
  const promoInp = document.getElementById('promo-code-input');
  if (promoInp) promoInp.placeholder = state.currentLang === 'ar' ? 'أدخل الكود' : 'Enter Code';

  if (window.renderProducts) window.renderProducts(false);
  if (window.renderVisualBar) window.renderVisualBar();
  if (window.updateCartUI) window.updateCartUI();
}

/**
 * Sidebar functions
 */
export function openSidebar() {
  document.getElementById('sidebar').classList.add('open');
  document.getElementById('sidebar-overlay').classList.add('show');
}

export function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebar-overlay').classList.remove('show');
}

/**
 * Toggle sidebar reorder mode
 */
export function toggleSidebarReorderMode() {
  const hint = document.getElementById('sidebar-reorder-hint-lbl');
  const btn = document.getElementById('btn-sidebar-reorder-toggle');
  if (hint && btn) {
    const isActive = btn.classList.toggle('active');
    hint.style.display = isActive ? 'block' : 'none';
    document.querySelectorAll('.sidebar-sortable-item').forEach(item => {
      item.draggable = isActive;
    });
  }
}

/**
 * Initialize governorate/city selects for checkout
 */
export function initCheckoutSelects() {
  const govSelect = document.getElementById('order-gov');
  const citySelect = document.getElementById('order-city');
  if (govSelect && citySelect) {
    govSelect.innerHTML = '<option value="" disabled selected>اختر المحافظة...</option>';
    for (let gov in state.deliveryData) {
      let option = document.createElement('option');
      option.value = gov;
      option.textContent = gov;
      govSelect.appendChild(option);
    }
    govSelect.addEventListener('change', function() {
      const data = state.deliveryData[this.value];
      let citiesHtml = '<option value="" disabled selected>اختر المركز/المدينة...</option>';
      data.cities.forEach(city => { citiesHtml += `<option value="${city}">${city}</option>`; });
      citiesHtml += `<option value="مدينة أخرى">أخرى (تُكتب بالعنوان التفصيلي)</option>`;
      citySelect.innerHTML = citiesHtml;
      citySelect.disabled = false;
      state.currentShippingCost = data.shippingCost;
      if (window.updateInvoiceUI) window.updateInvoiceUI();
    });
  }
}

/**
 * Initialize profile governorate/city selects
 */
export function initProfileSelects() {
  const profGovSelect = document.getElementById('prof-gov');
  const profCitySelect = document.getElementById('prof-city');
  if (profGovSelect && profCitySelect) {
    profGovSelect.innerHTML = '<option value="" disabled selected>اختر المحافظة...</option>';
    for (let gov in state.deliveryData) {
      let option = document.createElement('option');
      option.value = gov;
      option.textContent = gov;
      profGovSelect.appendChild(option);
    }
    profGovSelect.addEventListener('change', function() {
      const data = state.deliveryData[this.value];
      let citiesHtml = '<option value="" disabled selected>اختر المركز/المدينة...</option>';
      data.cities.forEach(city => { citiesHtml += `<option value="${city}">${city}</option>`; });
      citiesHtml += `<option value="مدينة أخرى">أخرى (تُكتب بالعنوان التفصيلي)</option>`;
      profCitySelect.innerHTML = citiesHtml;
      profCitySelect.disabled = false;
    });
  }
}

/**
 * Initialize magnifier for product images
 */
export function initMagnifier() {
  const container = document.getElementById('magnifier-container');
  const img = document.getElementById('modal-img-main');
  if (!container || !img) return;
  container.addEventListener('mousemove', function(e) {
    const { left, top, width, height } = container.getBoundingClientRect();
    const x = (e.clientX - left) / width * 100;
    const y = (e.clientY - top) / height * 100;
    img.style.transformOrigin = `${x}% ${y}%`;
    img.style.transform = 'scale(2)';
  });
  container.addEventListener('mouseleave', function() {
    img.style.transformOrigin = 'center center';
    img.style.transform = 'scale(1)';
  });
}

/**
 * Scroll handler for smart nav and infinite scroll
 */
export function initScrollHandler() {
  let lastScrollY = window.scrollY;
  window.addEventListener('scroll', () => {
    const nav = document.getElementById('smart-nav');
    if (nav) {
      if (window.scrollY > lastScrollY + 4 && window.scrollY > 70) nav.classList.add('hidden');
      else if (window.scrollY < lastScrollY - 3 || window.scrollY <= 70) nav.classList.remove('hidden');
    }
    lastScrollY = window.scrollY;

    const homePanel = document.getElementById('home-panel');
    if (homePanel && homePanel.classList.contains('active')) {
      if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 500) {
        if (window.getFilteredProductsCount) {
          const totalFiltered = window.getFilteredProductsCount();
          if (state.currentRenderedProducts < totalFiltered) {
            const indicator = document.getElementById('loading-more-indicator');
            if (indicator) indicator.style.display = 'block';
            setTimeout(() => {
              state.currentRenderedProducts += state.productsPerPage;
              if (window.renderProducts) window.renderProducts(false);
              if (window.renderVisualBar) window.renderVisualBar();
              if (indicator) indicator.style.display = 'none';
            }, 500);
          }
        }
      }
    }
  });
}

/**
 * Update offer timer
 */
export function updateOfferTimer() {
  let endTime = localStorage.getItem('offer_end_time');
  let now = new Date().getTime();
  if (!endTime || now > endTime) {
    endTime = now + (72 * 60 * 60 * 1000);
    localStorage.setItem('offer_end_time', endTime);
  }
  setInterval(() => {
    now = new Date().getTime();
    let distance = endTime - now;
    if (distance < 0) {
      endTime = now + (72 * 60 * 60 * 1000);
      localStorage.setItem('offer_end_time', endTime);
      distance = endTime - now;
    }
    let hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    let minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    let seconds = Math.floor((distance % (1000 * 60)) / 1000);
    let tStr = (hours < 10 ? "0" + hours : hours) + ":" + (minutes < 10 ? "0" + minutes : minutes) + ":" + (seconds < 10 ? "0" + seconds : seconds);
    const timerEl = document.getElementById('offer-timer');
    if (timerEl) timerEl.innerText = tStr;
  }, 1000);
}

/**
 * Check abandoned cart
 */
export function checkAbandonedCart() {
  if (state.cart.length > 0) {
    let lastTime = localStorage.getItem('cart_last_updated');
    let now = new Date().getTime();
    if (lastTime && (now - lastTime > 1800000)) { // 30 minutes
      setTimeout(() => {
        const modal = document.getElementById('abandoned-cart-modal');
        if (modal) modal.style.display = 'flex';
        localStorage.setItem('cart_last_updated', new Date().getTime());
      }, 3000);
    }
  }
}

/**
 * Render recently viewed full
 * @param {string|null} filterDate - Date filter
 */
export function renderRecentlyViewedFull(filterDate = null) {
  const recent = JSON.parse(localStorage.getItem('zait_recently_viewed_history')) || [];
  const container = document.getElementById('recently-viewed-full-list');
  if (!container) return;

  let filtered = recent;
  if (filterDate) {
    filtered = recent.filter(r => r.viewDate === filterDate);
  }

  if (filtered.length > 0) {
    let html = '';
    filtered.forEach(r => {
      const d = new Date(r.viewDate).toLocaleDateString('ar-EG');
      const viewTxt = state.currentLang === 'ar' ? 'عرض مجدداً' : 'View Again';
      html += `<div class="product-card" onclick="window.openProductModal('${r.id}')"><span class="category-badge" style="background:var(--secondary);">${d}</span><img loading="lazy" src="${r.image}" onerror="this.src='https://via.placeholder.com/300x250?text=صورة'"><div style="padding: 0 10px;"><h3>${escapeHTML(r.name)}</h3><div class="price">${r.price} ج</div><button type="button" class="btn btn-full" style="padding: 8px; font-size:1rem;">${viewTxt}</button></div></div>`;
    });
    container.innerHTML = html;
  } else {
    const msg = state.currentLang === 'ar' ? `لم يتم العثور على مشاهدات ${filterDate ? 'في هذا اليوم' : 'بعد'}.` : `No views found ${filterDate ? 'on this day' : 'yet'}.`;
    container.innerHTML = `<h3 style="text-align: center; grid-column: 1 / -1; color: var(--text-muted);">${msg}</h3>`;
  }
}

/**
 * Filter recently viewed
 */
export function filterRecentlyViewed() {
  const filterDate = document.getElementById('recent-date-filter').value;
  renderRecentlyViewedFull(filterDate);
}

/**
 * Clear recent filter
 */
export function clearRecentFilter() {
  const input = document.getElementById('recent-date-filter');
  if (input) input.value = '';
  renderRecentlyViewedFull();
}

/**
 * Add recently viewed
 * @param {Object} product - Product object
 */
export function addRecentlyViewed(product) {
  const recent = JSON.parse(localStorage.getItem('zait_recently_viewed_history')) || [];
  const today = new Date().toISOString().split('T')[0];
  const filtered = recent.filter(r => r.id !== product.id);
  filtered.unshift({
    id: product.id,
    name: product.name,
    price: product.price,
    image: (product.images && product.images.length > 0) ? product.images[0] : (product.imageUrl || ''),
    viewDate: today
  });
  if (filtered.length > 30) filtered.pop();
  localStorage.setItem('zait_recently_viewed_history', JSON.stringify(filtered));
  renderRecentlyViewedFull();
}

/**
 * Show random social proof
 */
export function showRandomSocialProof() {
  if (!state.isProductsLoaded || state.products.length === 0) return;
  const p = state.products[Math.floor(Math.random() * state.products.length)];
  const n = ["محمد من القاهرة", "أحمد من الإسكندرية", "محمود من الجيزة", "كريم من المنصورة", "مصطفى من طنطا", "Mohamed from Cairo", "Ahmed from Alex"][Math.floor(Math.random() * 7)];
  const img = (p.images && p.images.length > 0) ? p.images[0] : (p.imageUrl || '1000392409.jpeg');
  const imgEl = document.getElementById('sp-img');
  const nameEl = document.getElementById('sp-name');
  const prodEl = document.getElementById('sp-product');
  if (imgEl) imgEl.src = img;
  if (nameEl) nameEl.innerText = n;
  if (prodEl) prodEl.innerText = p.name.substring(0, 20) + '..';
  const toast = document.getElementById('social-proof-toast');
  if (toast) {
    toast.classList.add('show');
    setTimeout(() => { toast.classList.remove('show'); }, 4000);
  }
}

/**
 * Share product
 */
export function shareProduct() {
  if (!state.activeProductForReview) return;
  const product = state.products.find(p => p.id === state.activeProductForReview);
  if (navigator.share) {
    navigator.share({
      title: product.name,
      text: `اكتشف هذا المنتج الرائع: ${product.name} بـ ${product.price} ج فقط!`,
      url: window.location.href
    }).catch(e => console.log('Share error:', e));
  } else {
    showToast('ميزة المشاركة غير مدعومة في متصفحك', 'error');
  }
}

/**
 * Ask product on WhatsApp
 * @param {string} id - Product ID
 */
export function askProductWa(id) {
  const p = state.products.find(x => x.id === id);
  if (!p) return;
  let waBtnInfo = state.storeSettings.floatingButtons ? state.storeSettings.floatingButtons.find(b => b.icon === '📱' || b.link.includes('wa.me')) : null;
  let pureWa = waBtnInfo ? waBtnInfo.link.split('/').pop() : "201018631768";
  if (pureWa && !pureWa.startsWith('20') && pureWa.length === 10) pureWa = '20' + pureWa;
  const msg = state.currentLang === 'ar'
    ? `مرحباً، أستفسر عن المنتج: *${p.name}*` + (p.price ? `\nوالذي سعره: ${p.price} ج` : '')
    : `Hello, I'm inquiring about: *${p.name}*` + (p.price ? `\nPrice: ${p.price} EGP` : '');
  window.open(`https://wa.me/${pureWa}?text=${encodeURIComponent(msg)}`, '_blank');
}

/**
 * Toggle wishlist
 * @param {Event} event - Click event
 * @param {string} id - Product ID
 */
export function toggleWishlist(event, id) {
  event.stopPropagation();
  const index = state.wishlist.indexOf(id);
  if (index > -1) {
    state.wishlist.splice(index, 1);
    showToast('تم الحذف من المفضلة');
  } else {
    state.wishlist.push(id);
    showToast('تمت الإضافة للمفضلة ❤️', 'success');
  }
  localStorage.setItem('wishlist', JSON.stringify(state.wishlist));
  if (window.renderProducts) window.renderProducts(false);
  if (window.renderVisualBar) window.renderVisualBar();
  if (document.getElementById('wishlist-panel') && document.getElementById('wishlist-panel').classList.contains('active')) {
    if (window.renderWishlist) window.renderWishlist();
  }
}

/**
 * Toggle compare product
 * @param {Event} event - Click event
 * @param {string} idexport async function toggleCompareProduct(event, id) {oduct(event, id) {
  event.stopPropagation();
  if (!state.compareProductIds) state.compareProductIds = [];
  const index = state.compareProductIds.indexOf(id);
  if (index > -1) {
    state.compareProductIds.splice(index, 1);
    showToast('تمت الإزالة من المقارنة');
  } else if (state.compareProductIds.length < 4) {
    state.compareProductIds.push(id);
    showToast('تمت الإضافة للمقارنة ⚖️', 'success');
  } else {
    showToast('يمكنك مقارنة 4 منتجات كحد أقصى', 'error');
  }
  if (window.renderProducts) window.renderProducts(false);
}

/**
 * Open quick order modal
 * @param {Event} event - Click event
 * @param {striexport async function openQuickOrderModal(event, id) {kOrderModal(event, id) {
  event.stopPropagation();
  // Quick order implementation
  if (window.executeAddToCart) window.executeAddToCart(event, id, state.products.find(p => p.id === id)?.name || '');
  if (window.showPanel) window.showPanel('checkout');
}

/**
 * Request back in stock notification
 * @param {Event} event - Click event
 * @param {string} id - Product ID
 * @param {stexport async function requestBackInStock(event, id, name) {BackInStock(event, id, name) {
  event.stopPropagation();
  // Implementation for back in stock notification
  showToast('سنبلغك عند توفر المنتج', 'success');
}

/**
 * Delete review
 * @param {string} productId - Product ID
 * @param {number} reviewIndex - Review index
 */
export async function deleteReview(productId, reviewIndex) {
  if (!confirm('هل أنت متأكد من حذف هذا التقييم؟')) return;
  const product = state.products.find(p => p.id === productId);
  if (product && product.reviews) {
    product.reviews.splice(reviewIndex, 1);
    try {
      const { db } = await import('../firebase.js');
      const { doc, updateDoc } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");
      await updateDoc(doc(db, 'products', productId), { reviews: product.reviews });
      showToast('تم حذف التقييم', 'success');
      if (window.openProductModal) window.openProductModal(productId);
    } catch (e) { showToast('حدث خطأ', 'error'); }
  }
}

/**
 * Submit review
 */
export async function submitReview() {
  if (!state.currentUser) { showToast(state.currentLang === 'ar' ? 'سجل الدخول لتقييم المنتج' : 'Login to review', "error"); return; }
  if (!state.activeProductForReview) return;

  const rating = parseInt(document.getElementById('review-stars').value);
  const comment = document.getElementById('review-text').value.trim();
  const fileInput = document.getElementById('review-image-file');
  const submitBtn = document.getElementById('btn-submit-review');
  const statusLabel = document.getElementById('review-upload-status');

  if (!comment) { showToast(state.currentLang === 'ar' ? 'اكتب تعليقاً' : 'Write a comment', "error"); return; }
  submitBtn.disabled = true;
  let reviewImageUrl = null;

  if (fileInput.files.length > 0) {
    statusLabel.style.display = 'block';
    try {
      const formData = new FormData();
      formData.append('image', fileInput.files[0]);
      const res = await fetch(`https://api.cloudinary.com/v1_1/${state.storeSettings.cloudinaryCloudName || 'demo'}/image/upload`, { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success) { reviewImageUrl = data.secure_url; }
    } catch (e) { showToast('فشل رفع الصورة، سيتم إرسال التقييم بدون صورة', 'error'); }
    statusLabel.style.display = 'none';
  }

  const product = state.products.find(p => p.id === state.activeProductForReview);
  let currentReviews = product.reviews || [];
  const rName = state.currentUser.displayName || (state.currentUser.email ? state.currentUser.email.split('@')[0] : state.currentUser.phoneNumber);

  let reviewObj = { userName: rName, rating: rating, comment: comment, date: new Date().toISOString() };
  if (reviewImageUrl) reviewObj.imageUrl = reviewImageUrl;
  currentReviews.push(reviewObj);

  try {
    const { db } = await import('../firebase.js');
    const { doc, updateDoc } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");
    await updateDoc(doc(db, 'products', state.activeProductForReview), { reviews: currentReviews });
    showToast(state.currentLang === 'ar' ? 'شكراً لتقييمك!' : 'Thank you!', "success");
    document.getElementById('review-text').value = '';
    document.getElementById('review-image-file').value = '';
    if (window.closeProductModal) window.closeProductModal();
  } catch (e) { showToast("خطأ", "error"); }
  submitBtn.disabled = false;
}

/**
 * Generate fake reviews for new products
 * @param {string} productName - Product name
 * @param {number} count - Number of reviews
 * @returns {Array} Fake reviews
 */
export function generateFakeReviews(productName, count) {
  if (count <= 0) return [];
  const names = ["أحمد محمود", "كريم سعيد", "محمود علي", "فاطمة حسن", "منى جمال", "طارق يوسف", "محمد عمر", "مصطفى كمال", "هبة عبد الرحمن", "سمر فوزي", "خالد عبدالله"];
  const comments = [
    `منتج ممتاز جداً، بنصح الكل يشتريه (${productName})`,
    `جودة عالية وسعر مناسب، شكراً ليكم!`,
    `أفضل ${productName} جربته، طعم وريحة خيال.`,
    `تغليف ممتاز وتوصيل سريع، برافو متجر زيت الشجرة المباركة 👏`,
    `بصراحة شيء يفتح النفس، أكيد هطلب تاني.`,
    `من أفضل المتاجر اللي اتعاملت معاها، والمنتج جودته وهمية!`,
    `تسلم إيديكم بجد، الطعم أصلي 100% 😍`,
    `تجربة شراء ممتازة، والمنتج مطابق للوصف بالظبط.`,
    `سعر ممتاز مقارنة بالجودة العالية دي، هعتمدكم دايماً.`,
    `وصل في ميعاده ومغلف كويس جداً، شكراً لاهتمامكم بالتفاصيل.`
  ];
  let reviews = [];
  for (let i = 0; i < count; i++) {
    let rDate = new Date();
    rDate.setDate(rDate.getDate() - Math.floor(Math.random() * 30));
    reviews.push({
      userName: names[Math.floor(Math.random() * names.length)],
      rating: 5,
      comment: comments[Math.floor(Math.random() * comments.length)],
      date: rDate.toISOString()
    });
  }
  return reviews;
}

// Make functions available globally
if (typeof window !== 'undefined') {
  window.showPanel = showPanel;
  window.togglePaymentInfo = togglePaymentInfo;
  window.initLocationButton = initLocationButton;
  window.toggleDarkMode = toggleDarkMode;
  window.toggleLanguage = toggleLanguage;
  window.openSidebar = openSidebar;
  window.closeSidebar = closeSidebar;
  window.toggleSidebarReorderMode = toggleSidebarReorderMode;
  window.initCheckoutSelects = initCheckoutSelects;
  window.initProfileSelects = initProfileSelects;
  window.initMagnifier = initMagnifier;
  window.initScrollHandler = initScrollHandler;
  window.updateOfferTimer = updateOfferTimer;
  window.checkAbandonedCart = checkAbandonedCart;
  window.renderRecentlyViewedFull = renderRecentlyViewedFull;
  window.filterRecentlyViewed = filterRecentlyViewed;
  window.clearRecentFilter = clearRecentFilter;
  window.addRecentlyViewed = addRecentlyViewed;
  window.showRandomSocialProof = showRandomSocialProof;
  window.shareProduct = shareProduct;
  window.askProductWa = askProductWa;
  window.toggleWishlist = toggleWishlist;
  window.toggleCompareProduct = toggleCompareProduct;
  window.openQuickOrderModal = openQuickOrderModal;
  window.requestBackInStock = requestBackInStock;
  window.deleteReview = deleteReview;
  window.submitReview = submitReview;
  window.generateFakeReviews = generateFakeReviews;
}

export default {
  showPanel,
  togglePaymentInfo,
  initLocationButton,
  toggleDarkMode,
  toggleLanguage,
  openSidebar,
  closeSidebar,
  toggleSidebarReorderMode,
  initCheckoutSelects,
  initProfileSelects,
  initMagnifier,
  initScrollHandler,
  updateOfferTimer,
  checkAbandonedCart,
  renderRecentlyViewedFull,
  filterRecentlyViewed,
  clearRecentFilter,
  addRecentlyViewed,
  showRandomSocialProof,
  shareProduct,
  askProductWa,
  toggleWishlist,
  toggleCompareProduct,
  openQuickOrderModal,
  requestBackInStock,
  deleteReview,
  submitReview,
  generateFakeReviews
};