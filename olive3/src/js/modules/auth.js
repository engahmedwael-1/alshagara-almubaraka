/**
 * Authentication Module
 * Handles user authentication, login, registration, password reset
 */

import { auth, googleProvider } from '../firebase.js';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  signInWithPopup,
  sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { db } from '../firebase.js';
import { doc, getDoc, setDoc, updateDoc, increment, arrayUnion } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { state } from '../state.js';
import { showToast, escapeHTML, toEngDigits, hashString } from '../utils.js';

/**
 * Initialize authentication listeners
 */
export async function initAuth() {
  // Auth form handler
  const auForm = document.getElementById('auth-form');
  if (auForm) {
    auForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('auth-email').value;
      const password = document.getElementById('auth-password').value;

      if (state.isLoginMode) {
        try {
          await signInWithEmailAndPassword(auth, email, password);
          saveAccountLocally(email, password);
          document.getElementById('auth-form').reset();
          showToast('تم الدخول بنجاح', 'success');
          if (window.showPanel) window.showPanel('home');
        } catch (error) {
          showToast("بيانات الدخول غير صحيحة", 'error');
        }
      } else {
        try {
          await createUserWithEmailAndPassword(auth, email, password);
          saveAccountLocally(email, password);
          showToast("تم إنشاء الحساب بنجاح!", 'success');
          document.getElementById('auth-form').reset();
          if (window.showPanel) window.showPanel('home');
        } catch (error) {
          showToast("حدث خطأ في التسجيل", 'error');
        }
      }
    });
  }

  // Toggle login/register mode
  const atMode = document.getElementById('auth-toggle-mode');
  if (atMode) {
    atMode.addEventListener('click', () => {
      state.isLoginMode = !state.isLoginMode;
      const at = document.getElementById('auth-title');
      if (at) at.textContent = state.isLoginMode ? "تسجيل الدخول" : "حساب جديد";
      const asb = document.getElementById('auth-submit-btn');
      if (asb) asb.textContent = state.isLoginMode ? "دخول" : "تسجيل";
      const atm = document.getElementById('auth-toggle-mode');
      if (atm) atm.textContent = state.isLoginMode ? "ليس لديك حساب؟ أنشئ حساباً" : "لديك حساب؟ سجل الدخول";
      const afp = document.getElementById('auth-forgot-password');
      if (afp) afp.style.display = state.isLoginMode ? "block" : "none";
    });
  }

  // Forgot password
  const afp = document.getElementById('auth-forgot-password');
  if (afp) {
    afp.addEventListener('click', async () => {
      const email = document.getElementById('auth-email').value;
      if (!email) {
        showToast('أدخل بريدك الإلكتروني أولاً', 'error');
        return;
      }
      try {
        await sendPasswordResetEmail(auth, email);
        showToast('تم إرسال رابط إعادة تعيين كلمة المرور', 'success');
      } catch (e) {
        showToast('حدث خطأ', 'error');
      }
    });
  }

  // Google sign in
  const btnGoogle = document.getElementById('btn-google-signin');
  if (btnGoogle) {
    btnGoogle.addEventListener('click', async () => {
      showToast(state.currentLang === 'ar' ? 'جاري الاتصال بجوجل...' : 'Connecting to Google...', 'info');
      try {
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;
        showToast(state.currentLang === 'ar' ? `أهلاً بك يا ${user.displayName}` : `Welcome ${user.displayName}`, 'success');
        if (window.showPanel) window.showPanel('home');
      } catch (error) {
        console.error(error);
        showToast(state.currentLang === 'ar' ? 'حدث خطأ أثناء تسجيل الدخول بجوجل' : 'Error signing in with Google', 'error');
      }
    });
  }

  // Toggle password visibility
  window.togglePassword = function() {
    const x = document.getElementById("auth-password");
    if (x && x.type === "password") { x.type = "text"; } else if (x) { x.type = "password"; }
  };

  // Auth state observer
  onAuthStateChanged(auth, async (user) => {
    state.currentUser = user;
    if (user) {
      const displayTxt = user.displayName || (user.email ? user.email.split('@')[0] : user.phoneNumber);
      const ud = document.getElementById('user-email-display');
      if (ud) ud.textContent = displayTxt;
      const um = document.getElementById('user-menu-container');
      if (um) um.style.display = 'block';
      const bs = document.getElementById('btn-show-auth');
      if (bs) bs.style.display = 'none';
      const sa = document.getElementById('sidebar-account-section');
      if (sa) sa.style.display = 'block';
      const ssw = document.getElementById('sidebar-switch-accounts-section');
      if (ssw) ssw.style.display = 'block';
      const co = document.getElementById('nav-customer-orders');
      if (co) co.style.display = 'inline-block';
      const sp = document.getElementById('nav-support');
      if (sp) sp.style.display = 'inline-block';

      // Hide login prompts
      const sm = document.getElementById('support-auth-msg');
      if (sm) sm.style.display = 'none';
      const sc = document.getElementById('support-content');
      if (sc) sc.style.display = 'block';
      const lm = document.getElementById('login-to-review-msg');
      if (lm) lm.style.display = 'none';
      const ar = document.getElementById('add-review-section');
      if (ar) ar.style.display = 'block';

      // Update admin UI
      if (window.updateAdminUI) window.updateAdminUI();
      if (window.loadCustomerOrders) window.loadCustomerOrders();
      if (window.loadCustomerChat) window.loadCustomerChat();
      if (window.loadUserNotifications) window.loadUserNotifications();

      // Load admin chats if admin
      const { SUPER_ADMINS } = await import('../firebase.js');
      if (SUPER_ADMINS.includes((user.email || '').toLowerCase()) || state.dynamicAdmins.includes((user.email || '').toLowerCase())) {
        if (window.loadAdminChats) window.loadAdminChats();
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          const oname = document.getElementById('order-name');
          if (oname) oname.value = data.name || '';
          const ophone = document.getElementById('order-phone1');
          if (ophone) ophone.value = data.phone1 || user.phoneNumber || '';
          const ophone2 = document.getElementById('order-phone2');
          if (ophone2) ophone2.value = data.phone2 || '';
          const oaddr = document.getElementById('order-address');
          if (oaddr) oaddr.value = data.address || '';
          if (data.gov) {
            const og = document.getElementById('order-gov');
            if (og) {
              og.value = data.gov;
              og.dispatchEvent(new Event('change'));
              setTimeout(() => {
                const oc = document.getElementById('order-city');
                if (oc && data.city) oc.value = data.city;
              }, 100);
            }
          }
          if (data.cart && data.cart.length > 0) {
            state.cart = data.cart;
            localStorage.setItem('cart', JSON.stringify(state.cart));
          }
          if (data.savedForLater && data.savedForLater.length > 0) {
            state.savedForLater = data.savedForLater;
            localStorage.setItem('savedForLater', JSON.stringify(state.savedForLater));
          }
        }
        await setDoc(doc(db, 'users', user.uid), {
          email: user.email || user.phoneNumber || 'غير مسجل',
          name: user.displayName || (userDoc.exists() ? userDoc.data().name : ''),
          lastLogin: new Date().toISOString()
        }, { merge: true });
      } catch (err) {
        console.error('Auth state error:', err);
      }

      window.renderSavedAccounts();
      const activeP = document.querySelector('.panel.active');
      if (activeP && activeP.id === 'auth-panel') {
        if (window.showPanel) window.showPanel('home');
      }
    } else {
      // User logged out
      const um = document.getElementById('user-menu-container');
      if (um) um.style.display = 'none';
      const bs = document.getElementById('btn-show-auth');
      if (bs) bs.style.display = 'inline-block';
      const sa = document.getElementById('sidebar-account-section');
      if (sa) sa.style.display = 'none';
      const ssw = document.getElementById('sidebar-switch-accounts-section');
      if (ssw) ssw.style.display = 'none';
      const co = document.getElementById('nav-customer-orders');
      if (co) co.style.display = 'none';
      const sp = document.getElementById('nav-support');
      if (sp) sp.style.display = 'none';

      if (window.updateAdminUI) window.updateAdminUI();

      const sm = document.getElementById('support-auth-msg');
      if (sm) sm.style.display = 'block';
      const sc = document.getElementById('support-content');
      if (sc) sc.style.display = 'none';
      const lm = document.getElementById('login-to-review-msg');
      if (lm) lm.style.display = 'block';
      const ar = document.getElementById('add-review-section');
      if (ar) ar.style.display = 'none';
      const cf = document.getElementById('checkout-form');
      if (cf) cf.reset();

      const og = document.getElementById('order-gov');
      if (og) og.dispatchEvent(new Event('change'));

      const activeP = document.querySelector('.panel.active');
      if (activeP && ['support-panel'].includes(activeP.id)) {
        if (window.showPanel) window.showPanel('home');
      }

      if (state.unsubscribeUserChat) { state.unsubscribeUserChat(); state.unsubscribeUserChat = null; }
      if (state.unsubscribeActiveAdminChat) { state.unsubscribeActiveAdminChat(); state.unsubscribeActiveAdminChat = null; }
    }
    if (window.updateCartUI) window.updateCartUI();
  });
}

/**
 * Save account locally for quick switching
 * @param {string} email - User email
 * @param {string} password - User passworexport async function saveAccountLocally(email, password) {ord) {
  const existsIndex = state.savedAccounts.findIndex(a => a.email === email);
  if (existsIndex > -1) {
    state.savedAccounts[existsIndex].password = btoa(password);
  } else {
    state.savedAccounts.push({ email, password: btoa(password) });
  }
  localStorage.setItem('zait_saved_accounts', JSON.stringify(state.savedAccounts));
  renderSavedAccounts();
}

/**
 * Render saved accounts in drexport async function renderSavedAccounts() {Accounts() {
  const list1 = document.getElementById('saved-accounts-list');
  const list2 = document.getElementById('sidebar-saved-accounts-list');
  let html = '';
  const btnTxt = state.currentLang === 'ar' ? '🔄 التبديل لـ' : '🔄 Switch to';
  state.savedAccounts.forEach(acc => {
    if (state.currentUser && state.currentUser.email === acc.email) return;
    html += `<button type="button" class="dropdown-item" style="color:var(--primary); font-size:0.85rem; background:rgba(2, 128, 144, 0.05);" onclick="window.switchFastAccount('${acc.email}', '${acc.password}')">${btnTxt} ${acc.email.split('@')[0]}</button>`;
  });
  if (list1) list1.innerHTML = html;
  if (list2) list2.innerHTML = html;
}

/**
 * Switch to another saved account
 * @param {string} email - Account email
 * @param {string} encodedPass - Base64 encoded password
 */
export async function switchFastAccount(email, encodedPass) {
  if (window.closeDropdown) window.closeDropdown();
  showToast('جاري التبديل للحساب الآخر...', 'info');
  try {
    await signInWithEmailAndPassword(auth, email, atob(encodedPass));
    showToast('تم التبديل بنجاح', 'success');
    if (window.showPanel) window.showPanel('home');
  } catch (e) {
    showToast('انتهت الجلسة، يرجى إدخال الباسورد يدوياً', 'error');
    if (window.showPanel) window.showPanel('auth');
  }
}

/**
 * Logout user
 */
export async function logoutUser() {
  try {
    await signOut(auth);
    if (window.closeDropdown) window.closeDropdown();
    showToast('تم تسجيل الخروج بنجاح', 'info');
    if (window.showPanel) window.showPanel('auth');
  } catch (e) {
    showToast('حدث خطأ', 'error');
  }
}

/**
 * Save profile data
 */
export async function saveProfileData() {
  if (!state.currentUser) return;
  const name = document.getElementById('prof-name').value;
  const phone1 = document.getElementById('prof-phone1').value;
  const gov = document.getElementById('prof-gov').value;
  const city = document.getElementById('prof-city').value;
  const address = document.getElementById('prof-address').value;

  try {
    await setDoc(doc(db, 'users', state.currentUser.uid), {
      name: name,
      phone1: phone1,
      gov: gov,
      city: city,
      address: address
    }, { merge: true });
    showToast('تم حفظ البيانات بنجاح', 'success');
    const pnd = document.getElementById('profile-name-display');
    if (pnd) pnd.innerText = name;
  } catch (e) {
    showToast('حدث خطأ أثناء الحفظ', 'error');
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
 * Show profile panel
 */
export async function showProfilePanel() {
  if (window.showPanel) window.showPanel('profile');
  if (state.currentUser) {
    const pAuthMsg = document.getElementById('profile-auth-msg');
    if (pAuthMsg) pAuthMsg.style.display = 'none';
    const pContent = document.getElementById('profile-content');
    if (pContent) pContent.style.display = 'block';

    const pNameDisplay = document.getElementById('profile-name-display');
    if (pNameDisplay) pNameDisplay.innerText = state.currentUser.displayName || (state.currentUser.email ? state.currentUser.email.split('@')[0] : 'عميل');
    const pEmailDisplay = document.getElementById('profile-email-display');
    if (pEmailDisplay) pEmailDisplay.innerText = state.currentUser.email || state.currentUser.phoneNumber || '';

    if (window.customerOrdersArray) {
      const pOrdersCount = document.getElementById('profile-orders-count');
      if (pOrdersCount) pOrdersCount.innerText = window.customerOrdersArray.length;
    }

    try {
      const userDoc = await getDoc(doc(db, 'users', state.currentUser.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        const pPoints = document.getElementById('profile-points');
        if (pPoints) pPoints.innerText = data.loyaltyPoints || 0;
        const profName = document.getElementById('prof-name');
        if (profName) profName.value = data.name || state.currentUser.displayName || '';
        const profPhone1 = document.getElementById('prof-phone1');
        if (profPhone1) profPhone1.value = data.phone1 || state.currentUser.phoneNumber || '';
        const profAddress = document.getElementById('prof-address');
        if (profAddress) profAddress.value = data.address || '';

        const pGov = document.getElementById('prof-gov');
        const pCity = document.getElementById('prof-city');
        if (data.gov && pGov) {
          pGov.value = data.gov;
          pGov.dispatchEvent(new Event('change'));
          setTimeout(() => { if (pCity && data.city) pCity.value = data.city; }, 100);
        }
      }
    } catch (e) {}
  } else {
    const pAuthMsg = document.getElementById('profile-auth-msg');
    if (pAuthMsg) pAuthMsg.style.display = 'block';
    const pContent = document.getElementById('profile-content');
    if (pContent) pContent.style.display = 'none';
  }
}

// Admin PIN functions
window.toEngDigits = toEngDigits;

const ulrBtn = document.getElementById('btn-unlock-roles');
if (ulrBtn) {
  ulrBtn.addEventListener('click', async () => {
    const pin = toEngDigits(document.getElementById('roles-pin').value.trim());
    const hashed = await hashString(pin);
    const { PIN_HASH } = await import('../firebase.js');
    if (hashed === PIN_HASH) {
      const ras = document.getElementById('roles-auth-section');
      if (ras) ras.style.display = 'none';
      const rcs = document.getElementById('roles-content-section');
      if (rcs) rcs.style.display = 'block';
      const rpin = document.getElementById('roles-pin');
      if (rpin) rpin.value = '';
      showToast('تم الفتح', 'success');
    } else {
      showToast("رمز خاطئ!", 'error');
    }
  });
}

const fprBtn = document.getElementById('btn-forgot-roles-pin');
if (fprBtn) {
  fprBtn.addEventListener('click', async () => {
    const nid = prompt("الرقم القومي:");
    if (nid) {
      const hashedNid = await hashString(toEngDigits(nid.trim()));
      const { NATIONAL_ID_HASH } = await import('../firebase.js');
      if (hashedNid === NATIONAL_ID_HASH) {
        const ras = document.getElementById('roles-auth-section');
        if (ras) ras.style.display = 'none';
        const rcs = document.getElementById('roles-content-section');
        if (rcs) rcs.style.display = 'block';
        showToast('تم الدخول بنجاح', 'success');
      } else {
        showToast('رقم قومي خاطئ', 'error');
      }
    }
  });
}

const lrBtn = document.getElementById('btn-lock-roles');
if (lrBtn) {
  lrBtn.addEventListener('click', () => {
    const rcs = document.getElementById('roles-content-section');
    if (rcs) rcs.style.display = 'none';
    const ras = document.getElementById('roles-auth-section');
    if (ras) ras.style.display = 'block';
  });
}

// Admin reset functions
window.resetAdminRevenue = async function() {
  const pin = prompt("أدخل رمز الأمان للمؤسس لتصفير الأرباح فقط 🔄:");
  if (pin) {
    const hashed = await hashString(toEngDigits(pin.trim()));
    const { PIN_HASH } = await import('../firebase.js');
    if (hashed === PIN_HASH) {
      try {
        const newResetDate = new Date().toISOString();
        await setDoc(doc(db, 'settings', 'main'), { revenueResetDate: newResetDate }, { merge: true });
        showToast('تم تصفير الأرباح بنجاح', 'success');
        if (window.loadAdminOrders) window.loadAdminOrders();
      } catch (e) { showToast('حدث خطأ أثناء التصفير', 'error'); }
    } else { showToast('رمز الأمان غير صحيح!', 'error'); }
  }
};

window.resetAdminOrdersCount = async function() {
  const pin = prompt("أدخل رمز الأمان للمؤسس لتصفير الطلبات فقط 🔄:");
  if (pin) {
    const hashed = await hashString(toEngDigits(pin.trim()));
    const { PIN_HASH } = await import('../firebase.js');
    if (hashed === PIN_HASH) {
      try {
        const newResetDate = new Date().toISOString();
        await setDoc(doc(db, 'settings', 'main'), { ordersResetDate: newResetDate }, { merge: true });
        showToast('تم تصفير الطلبات بنجاح', 'success');
        if (window.loadAdminOrders) window.loadAdminOrders();
      } catch (e) { showToast('حدث خطأ أثناء التصفير', 'error'); }
    } else { showToast('رمز الأمان غير صحيح!', 'error'); }
  }
};

// Make functions available globally
if (typeof window !== 'undefined') {
  window.saveAccountLocally = saveAccountLocally;
  window.renderSavedAccounts = renderSavedAccounts;
  window.switchFastAccount = switchFastAccount;
  window.logoutUser = logoutUser;
  window.saveProfileData = saveProfileData;
  window.initProfileSelects = initProfileSelects;
  window.showProfilePanel = showProfilePanel;
}

export default {
  initAuth,
  saveAccountLocally,
  renderSavedAccounts,
  switchFastAccount,
  logoutUser,
  saveProfileData,
  initProfileSelects,
  showProfilePanel
};