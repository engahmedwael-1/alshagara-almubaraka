/**
 * Admin Module
 * Handles admin panel functionality, user management, settings, analytics
 */

import { db } from '../firebase.js';
import { collection, onSnapshot, query, orderBy, where, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, addDoc, increment, arrayUnion } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { state } from '../state.js';
import { showToast, escapeHTML, formatDateTime, hashString, toEngDigits } from '../utils.js';
import { SUPER_ADMINS, isSuperAdmin, isAdmin } from '../firebase.js';

let adminUsersUnsubscribe = null;
let adminChatsUnsubscribe = null;

/**
 * Update admin UI visibility
 */
export async function updateAdminUI() {
  if (state.currentUser) {
    const email = (state.currentUser.email || '').toLowerCase();
    const phone = state.currentUser.phoneNumber || '';

    state.isCurrentUserAdmin = SUPER_ADMINS.includes(email) ||
      SUPER_ADMINS.includes(phone) ||
      state.dynamicAdmins.includes(email);

    document.querySelectorAll('.admin-tab').forEach(tab => {
      tab.style.display = state.isCurrentUserAdmin ? 'inline-block' : 'none';
    });

    const activePanel = document.querySelector('.panel.active');
    if (!state.isCurrentUserAdmin && activePanel && [
      'admin', 'admin-add-product', 'admin-work', 'admin-orders',
      'admin-messages', 'admin-dashboard', 'admin-returns',
      'admin-users', 'admin-staff-ratings', 'admin-broadcast'
    ].includes(activePanel.id.replace('-panel', ''))) {
      if (window.showPanel) window.showPanel('home');
    }

    if (state.isCurrentUserAdmin) {
      if (window.loadAdminOrders) window.loadAdminOrders();
      if (window.loadAdminReturns) window.loadAdminReturns();
      if (window.loadAdminUsers) window.loadAdminUsers();
      if (window.loadAdminAbandonedCarts) window.loadAdminAbandonedCarts();
      if (window.renderLowStockAlerts) window.renderLowStockAlerts();
    }
  } else {
    state.isCurrentUserAdmin = false;
    document.querySelectorAll('.admin-tab').forEach(tab => tab.style.display = 'none');

    if (state.adminOrdersUnsubscribe) { state.adminOrdersUnsubscribe(); state.adminOrdersUnsubscribe = null; }
    if (state.adminReturnsUnsubscribe) { state.adminReturnsUnsubscribe(); state.adminReturnsUnsubscribe = null; }
    if (adminUsersUnsubscribe) { adminUsersUnsubscribe(); adminUsersUnsubscribe = null; }
    if (state.adminAbandonedCartsUnsubscribe) { state.adminAbandonedCartsUnsubscribe(); state.adminAbandonedCartsUnsubscribe = null; }
  }

  if (window.applySettingsToUI) window.applySettingsToUI();
  if (window.renderProducts) window.renderProducts(false);
  if (window.renderVisualBar) window.renderVisualBar();
}

/**
 * Load admin users
 */
export function loadAdminUsers() {
  if (adminUsersUnsubscribe) adminUsersUnsubscribe();

  adminUsersUnsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
    const container = document.getElementById('admin-users-container');
    if (!container) return;

    let usersList = [];
    snapshot.forEach(doc => usersList.push({ id: doc.id, ...doc.data() }));
    usersList.sort((a, b) => new Date(b.lastLogin || 0) - new Date(a.lastLogin || 0));

    if (usersList.length === 0) {
      container.innerHTML = '<h3 style="text-align:center; color:var(--text-muted);">لا يوجد عملاء مسجلين.</h3>';
      return;
    }

    let html = '';
    usersList.forEach(u => {
      const loginDate = u.lastLogin ? formatDateTime(u.lastLogin) : 'غير محدد';
      html += `<div class="admin-msg-card" style="border-right: 4px solid #6f42c1; cursor:pointer;" onclick="window.showUserHistory('${u.id}', '${(u.name || 'عميل').replace(/'/g, "\\'")}')">
        <h4 style="margin:0 0 5px 0; color:var(--primary);">👤 ${escapeHTML(u.name || 'عميل بدون اسم')}</h4>
        <p style="margin: 3px 0;"><strong>التواصل:</strong> ${escapeHTML(u.email || u.phone1 || 'غير متوفر')}</p>
        <p style="margin: 3px 0;"><strong>المحافظة:</strong> ${escapeHTML(u.gov || 'غير محدد')} - ${escapeHTML(u.city || '')}</p>
        <p style="margin: 3px 0; color:var(--text-muted); font-size:0.85rem;"><strong>آخر دخول:</strong> ${loginDate}</p>
      </div>`;
    });
    container.innerHTML = html;
  });
}

/**
 * Show user history
 * @param {string} userId - User ID
 * @param {string} userName - User name
 */
export function showUserHistory(userId, userName) {
  const container = document.getElementById('admin-users-container');
  const userOrdersList = state.adminOrdersArray.filter(o => o.userId === userId);
  const totalSpent = userOrdersList.filter(o => o.status === 'تم التوصيل ✅').reduce((sum, o) => sum + Number(o.totalAmount), 0);

  let html = `<button type="button" class="btn btn-outline" style="margin-bottom:15px; border-color:#6f42c1; color:#6f42c1;" onclick="window.loadAdminUsers()">🔙 العودة للقائمة</button>`;
  html += `<div style="background:var(--input-bg); padding:15px; border-radius:8px; border:1px solid var(--border-color); margin-bottom:15px;">`;
  html += `<h3 style="margin-top:0; color:var(--primary);">سجل العميل: ${userName || 'غير مسجل'}</h3>`;
  html += `<p>إجمالي المشتريات المكتملة: <strong style="color:var(--secondary); font-size:1.2rem;">${totalSpent} ج</strong></p>`;
  html += `<p>عدد الطلبات: <strong>${userOrdersList.length}</strong> طلب</p></div>`;

  if (userOrdersList.length === 0) {
    html += `<p style="text-align:center; color:var(--text-muted);">هذا العميل لم يقم بأي طلبات بعد.</p>`;
  } else {
    html += `<h4 style="color:var(--danger);">📦 طلبات العميل:</h4>`;
    userOrdersList.forEach(order => {
      html += `<div class="admin-msg-card" style="font-size:0.9rem;"><p><strong>رقم:</strong> #${order.id.slice(0,6).toUpperCase()}</p><p><strong>التاريخ:</strong> ${formatDateTime(order.orderDate)}</p><p><strong>الإجمالي:</strong> ${order.totalAmount} ج</p><p><strong>الحالة:</strong> ${escapeHTML(order.status)}</p></div>`;
    });
  }
  container.innerHTML = html;
}

/**
 * Render admins list
 */
export function renderAdminsList() {
  let html = '<ul style="line-height:2;">';
  SUPER_ADMINS.forEach(email => {
    html += `<li><strong>${email}</strong> <span style="color:#28a745; font-size:0.8rem;">(مؤسس)</span></li>`;
  });
  state.dynamicAdminsList.forEach(admin => {
    html += `<li><strong>${admin.email}</strong> <button type="button" class="btn-danger" style="padding: 2px 6px; font-size: 0.8rem; border-radius:4px; border:none; cursor:pointer;" onclick="window.removeAdmin('${admin.id}')">حذف</button></li>`;
  });
  const listCont = document.getElementById('admins-list-container');
  if (listCont) listCont.innerHTML = html + '</ul>';
}

/**
 * Add admin
 */
export async function addAdmin() {
  const newEmail = document.getElementById('new-admin-email').value.trim().toLowerCase();
  if (!SUPER_ADMINS.includes(newEmail) && !state.dynamicAdmins.includes(newEmail)) {
    try {
      await addDoc(collection(db, 'admins'), { email: newEmail });
      document.getElementById('new-admin-email').value = '';
      showToast('تم الإضافة', 'success');
    } catch (e) {
      showToast('فشل الإضافة', 'error');
    }
  }
}

/**
 * Remove admin
 * @param {string} id - Admin document ID
 */
export async function removeAdmin(id) {
  if (confirm('حذف؟')) {
    try {
      await deleteDoc(doc(db, 'admins', id));
      showToast('تم الحذف', 'success');
    } catch (e) {
      showToast('فشل الحذف', 'error');
    }
  }
}

/**
 * Load admin chats
 */
export function loadAdminChats() {
  if (adminChatsUnsubscribe) adminChatsUnsubscribe();

  adminChatsUnsubscribe = onSnapshot(
    query(collection(db, 'chats'), orderBy('lastUpdate', 'desc')),
    (snap) => {
      const container = document.getElementById('admin-chat-list');
      if (!container) return;
      let html = '';
      snap.forEach(d => {
        const chat = d.data();
        const date = formatDateTime(chat.lastUpdate);
        html += `<div class="admin-msg-card" style="cursor:pointer; border-right:4px solid var(--primary);" onclick="window.openAdminChat('${d.id}', '${chat.customerName}')"><h4 style="margin:0 0 5px 0;">👤 ${escapeHTML(chat.customerName)}</h4><span style="font-size:0.85rem; color:var(--text-muted);">آخر رسالة: ${date}</span></div>`;
      });
      container.innerHTML = html || '<h3 style="text-align:center; color:var(--text-muted);">لا توجد رسائل.</h3>';
    }
  );
}

/**
 * Open admin chat
 * @param {string} id - Chat ID
 * @param {string} name - Customer name
 */
export function openAdminChat(id, name) {
  const acl = document.getElementById('admin-chat-list');
  if (acl) acl.style.display = 'none';
  const aac = document.getElementById('admin-active-chat');
  if (aac) aac.style.display = 'block';
  const acu = document.getElementById('active-chat-user');
  if (acu) acu.textContent = name;
  state.activeAdminChatId = id;

  if (state.unsubscribeActiveAdminChat) {
    state.unsubscribeActiveAdminChat();
    state.unsubscribeActiveAdminChat = null;
  }

  state.unsubscribeActiveAdminChat = onSnapshot(doc(db, 'chats', id), (docSnap) => {
    const container = document.getElementById('admin-chat-messages');
    if (!container) return;
    if (docSnap.exists()) {
      const data = docSnap.data();
      let html = '';
      (data.messages || []).forEach(m => {
        const isAdm = m.sender === 'admin';
        const alignClass = isAdm ? 'chat-msg-customer' : 'chat-msg-admin';
        const bubbleClass = isAdm ? 'bubble-customer' : 'bubble-admin';
        const prefix = isAdm ? '' : '<strong style="color:var(--secondary);font-size:0.8rem;">العميل:</strong><br>';
        html += `<div class="chat-msg-wrapper ${alignClass}"><div class="chat-bubble ${bubbleClass}">${prefix}${escapeHTML(m.text)}</div></div>`;
      });
      container.innerHTML = html;
      container.scrollTop = container.scrollHeight;
    }
  });
}

/**
 * Close admin chat
 */
export function closeAdminChat() {
  const acl = document.getElementById('admin-chat-list');
  if (acl) acl.style.display = 'block';
  const aac = document.getElementById('admin-active-chat');
  if (aac) aac.style.display = 'none';
  state.activeAdminChatId = null;
  if (state.unsubscribeActiveAdminChat) {
    state.unsubscribeActiveAdminChat();
    state.unsubscribeActiveAdminChat = null;
  }
}

/**
 * Send admin message
 */
export async function sendAdminMessage() {
  const input = document.getElementById('admin-chat-input');
  const txt = input ? input.value.trim() : "";
  if (!txt || !state.activeAdminChatId) return;
  input.value = '';

  const msg = { sender: 'admin', text: txt, timestamp: new Date().toISOString(), isAutoReply: false };
  await updateDoc(doc(db, 'chats', state.activeAdminChatId), {
    messages: arrayUnion(msg),
    lastUpdate: msg.timestamp,
    adminReplied: true,
    unreadByAdmin: false
  });
}

/**
 * End admin chat
 */
export async function endAdminChat() {
  if (state.activeAdminChatId && confirm('إنهاء المحادثة الحالية؟ (سيعود الرد الآلي للعمل إذا أرسل العميل رسالة جديدة)')) {
    const msg = { sender: 'admin', text: '--- تم إنهاء المحادثة من خدمة العملاء ---', timestamp: new Date().toISOString() };
    await updateDoc(doc(db, 'chats', state.activeAdminChatId), { messages: arrayUnion(msg), lastUpdate: msg.timestamp, adminReplied: false });
    showToast('تم إنهاء المحادثة', 'info');
  }
}

/**
 * Delete admin chat
 */
export async function deleteAdminChat() {
  if (confirm('حذف المحادثة للعميل؟')) {
    await deleteDoc(doc(db, 'chats', state.activeAdminChatId));
    showToast('تم الحذف', 'success');
    closeAdminChat();
  }
}

/**
 * Apply settings to UI
 */
export function applySettingsToUI() {
  if (state.storeSettings.loyaltyEarnRate) window.loyaltyEarnRateActual = state.storeSettings.loyaltyEarnRate;
  if (state.storeSettings.loyaltyRedeemValue) window.loyaltyRedeemValueActual = state.storeSettings.loyaltyRedeemValue;
  const letxt = document.getElementById('loyalty-earn-text');
  if (letxt) letxt.textContent = window.loyaltyEarnRateActual;
  const lrtxt = document.getElementById('loyalty-redeem-text');
  if (lrtxt) lrtxt.textContent = window.loyaltyRedeemValueActual;

  if (state.isCurrentUserAdmin) {
    const csToggle = document.getElementById('setting-cross-sell');
    if (csToggle) csToggle.checked = state.storeSettings.enableCrossSell;
    const loyE = document.getElementById('setting-loyalty-earn');
    if (loyE && state.storeSettings.loyaltyEarnRate) loyE.value = state.storeSettings.loyaltyEarnRate;
    const loyV = document.getElementById('setting-loyalty-value');
    if (loyV && state.storeSettings.loyaltyRedeemValue) loyV.value = state.storeSettings.loyaltyRedeemValue;
    const vMode = document.getElementById('setting-visual-bar-mode');
    if (vMode) vMode.value = state.storeSettings.visualBarMode || 'categories';

    const autoEl = document.getElementById('setting-auto-reply');
    if (autoEl) autoEl.value = state.storeSettings.autoReplyMessage || 'أهلًا بيك❤️\nاكتب استفسارك وبمجرد ما يتوفر أدمن هيتم التواصل معاكم في أسرع وقت.';
    const wallEl = document.getElementById('setting-wallet-number');
    if (wallEl) wallEl.value = state.storeSettings.walletNumber || '';
    const fbEl = document.getElementById('setting-fb-pixel');
    if (fbEl) fbEl.value = state.storeSettings.fbPixelId || '';
    const ttEl = document.getElementById('setting-tt-pixel');
    if (ttEl) ttEl.value = state.storeSettings.ttPixelId || '';
    const fsInp = document.getElementById('setting-free-shipping');
    if (fsInp && state.storeSettings.freeShippingThreshold) fsInp.value = state.storeSettings.freeShippingThreshold;
  }

  const chWall = document.getElementById('checkout-wallet-number');
  if (chWall) chWall.textContent = state.storeSettings.walletNumber || '01018631768';

  const floatingContainer = document.getElementById('floating-menu-container');
  const footerSocialContainer = document.getElementById('footer-social-links');
  const adminBtnsList = document.getElementById('admin-floating-btns-list');
  if (floatingContainer) floatingContainer.innerHTML = '';
  if (footerSocialContainer) footerSocialContainer.innerHTML = '';
  if (adminBtnsList) adminBtnsList.innerHTML = '';

  let currentBtns = state.storeSettings.floatingButtons || [];
  if (!currentBtns.find(b => b.link === '#support')) {
    currentBtns.unshift({ id: 'btn_support', icon: '💬', link: '#support', color: '#007bff', isSystem: true, title: 'خدمة العملاء' });
  }

  currentBtns.forEach((btn, index) => {
    if (btn.link === '#support') {
      if (floatingContainer) floatingContainer.innerHTML += `<button type="button" class="float-btn" style="background-color: ${btn.color};" title="${btn.title}" onclick="window.showPanel('support')">${btn.icon}</button>`;
    } else {
      if (floatingContainer) floatingContainer.innerHTML += `<a href="${btn.link}" target="_blank" class="float-btn" style="background-color: ${btn.color};" title="${btn.title}">${btn.icon}</a>`;
      if (footerSocialContainer) footerSocialContainer.innerHTML += `<div>${btn.icon} <a href="${btn.link}" target="_blank" style="color:#ddd; text-decoration:none;">${btn.title}</a></div>`;
    }
    if (btn.isSystem) {
      if (adminBtnsList) adminBtnsList.innerHTML += `<div style="background:var(--input-bg); padding:10px; border:1px solid var(--border-color); border-radius:8px; margin-bottom:5px;">${btn.icon} <strong>${btn.title}</strong> (أساسي)</div>`;
    } else {
      if (adminBtnsList) adminBtnsList.innerHTML += `<div style="background:var(--input-bg); padding:10px; border:1px solid var(--border-color); border-radius:8px; display:flex; gap:10px; align-items:center; flex-wrap:wrap; margin-bottom:5px;"><span>${btn.icon} <strong>${btn.title}</strong></span><input type="url" value="${btn.link}" id="edit-float-link-${index}" style="flex:1; padding:5px; margin:0; min-width:150px;"><button type="button" class="btn-info" style="border:none; padding:5px 10px; border-radius:4px;" onclick="window.updateFloatingBtn(${index})">تحديث</button><button type="button" class="btn-danger" style="border:none; padding:5px 10px; border-radius:4px;" onclick="window.removeFloatingBtn(${index})">حذف</button></div>`;
    }
  });

  let filterHtml = `<button type="button" class="filter-btn ${state.currentCategoryFilter === 'الكل' ? 'active' : ''}" onclick="window.filterProducts('الكل')">الكل</button>`;
  let selectHtml = `<option value="" disabled selected>اختر القسم...</option>`;
  let adminListHtml = '';
  let sidebarCatsHtml = '';

  (state.storeSettings.categories || []).forEach((cat, index) => {
    filterHtml += `<button type="button" class="filter-btn ${state.currentCategoryFilter === cat ? 'active' : ''}" onclick="window.filterProducts('${cat}')">${cat}</button>`;
    selectHtml += `<option value="${cat}">${cat}</option>`;
    adminListHtml += `<div style="background:var(--input-bg); padding:5px 10px; border:1px solid var(--border-color); border-radius:20px; display:flex; align-items:center; gap:8px;">${cat} <button type="button" class="btn-danger" style="border:none; border-radius:50%; width:20px; height:20px; font-size:10px; cursor:pointer;" onclick="window.removeCategory(${index})">X</button></div>`;
    sidebarCatsHtml += `<button type="button" class="btn btn-outline" style="width: 100%; border-color: var(--border-color); color: var(--text-color); text-align: right;" onclick="window.filterProducts('${cat}'); window.closeSidebar(); window.showPanel('home');">📂 ${cat}</button>`;
  });

  const cfc = document.getElementById('category-filters-container');
  if (cfc) cfc.innerHTML = filterHtml;
  const pc = document.getElementById('product-category');
  if (pc) pc.innerHTML = selectHtml;
  const acl = document.getElementById('admin-categories-list');
  if (acl) acl.innerHTML = adminListHtml;
  const scl = document.getElementById('sidebar-categories-list');
  if (scl) scl.innerHTML = sidebarCatsHtml;

  if (window.renderProducts) window.renderProducts(false);
  if (window.renderVisualBar) window.renderVisualBar();
}

/**
 * Save settings
 */
export async function saveSettings() {
  const newAutoReply = document.getElementById('setting-auto-reply') ? document.getElementById('setting-auto-reply').value.trim() : state.storeSettings.autoReplyMessage;
  const newWallet = document.getElementById('setting-wallet-number') ? document.getElementById('setting-wallet-number').value.trim() : state.storeSettings.walletNumber;
  const newFb = document.getElementById('setting-fb-pixel') ? document.getElementById('setting-fb-pixel').value.trim() : state.storeSettings.fbPixelId;
  const newTt = document.getElementById('setting-tt-pixel') ? document.getElementById('setting-tt-pixel').value.trim() : state.storeSettings.ttPixelId;
  const newCrossSell = document.getElementById('setting-cross-sell') ? document.getElementById('setting-cross-sell').checked : true;
  const newVMode = document.getElementById('setting-visual-bar-mode') ? document.getElementById('setting-visual-bar-mode').value : 'categories';

  const earnEl = document.getElementById('setting-loyalty-earn');
  const lEarn = earnEl ? (parseInt(earnEl.value) || 20) : 20;
  const redeemEl = document.getElementById('setting-loyalty-value');
  const lRedeem = redeemEl ? (parseInt(redeemEl.value) || 10) : 10;
  const fsEl = document.getElementById('setting-free-shipping');
  const fsThresh = fsEl ? (Number(fsEl.value) || 1000) : 1000;

  try {
    await updateDoc(doc(db, 'settings', 'main'), {
      autoReplyMessage: newAutoReply,
      walletNumber: newWallet,
      fbPixelId: newFb,
      ttPixelId: newTt,
      enableCrossSell: newCrossSell,
      freeShippingThreshold: fsThresh,
      loyaltyEarnRate: lEarn,
      loyaltyRedeemValue: lRedeem,
      visualBarMode: newVMode
    });
    showToast('تم الحفظ بنجاح', 'success');
    if (window.injectPixels) window.injectPixels();
  } catch (e) {
    showToast('فشل الحفظ', 'error');
    console.error(e);
  }
}

/**
 * Add category
 */
export async function addCategory() {
  const newCat = document.getElementById('new-category-input').value.trim();
  if (newCat && !(state.storeSettings.categories || []).includes(newCat)) {
    const updatedCats = [...(state.storeSettings.categories || []), newCat];
    await updateDoc(doc(db, 'settings', 'main'), { categories: updatedCats });
    document.getElementById('new-category-input').value = '';
    showToast('تم الإضافة', 'success');
  }
}

/**
 * Remove category
 * @param {number} index - Category index
 */
export async function removeCategory(index) {
  if (confirm('حذف القسم؟')) {
    const updatedCats = state.storeSettings.categories.filter((_, i) => i !== index);
    await updateDoc(doc(db, 'settings', 'main'), { categories: updatedCats });
    showToast('تم الحذف', 'success');
  }
}

/**
 * Add promo code
 */
export async function addPromoCode() {
  const code = document.getElementById('new-promo-code').value.trim().toUpperCase();
  const discount = parseInt(document.getElementById('new-promo-discount').value);
  if (code && discount > 0 && discount <= 100) {
    await addDoc(collection(db, 'promoCodes'), { code, discount });
    document.getElementById('new-promo-code').value = '';
    document.getElementById('new-promo-discount').value = '';
    showToast('تمت الإضافة', 'success');
  }
}

/**
 * Remove promo code
 * @param {string} id - Promo code document ID
 */
export async function removePromo(id) {
  if (confirm('حذف الكوبون؟')) {
    await deleteDoc(doc(db, 'promoCodes', id));
    showToast('تم الحذف', 'success');
  }
}

/**
 * Send global notification
 */
export async function sendGlobalNotification() {
  const msgInput = document.getElementById('admin-notif-msg');
  const msg = msgInput ? msgInput.value.trim() : "";
  if (!msg) { showToast('اكتب الإشعار أولاً', 'error'); return; }

  try {
    const notifObj = {
      title: 'إشعار من الإدارة 📢',
      message: msg,
      date: new Date().toISOString()
    };
    await addDoc(collection(db, 'global_notifications'), notifObj);

    const usersSnap = await getDocs(collection(db, 'users'));
    usersSnap.forEach(async (uDoc) => {
      try {
        await updateDoc(doc(db, 'users', uDoc.id), {
          unreadNotifs: increment(1),
          notifications: arrayUnion(notifObj)
        });
      } catch (e) {}
    });

    if (msgInput) msgInput.value = '';
    showToast('تم إرسال الإشعار للجميع!', 'success');
  } catch (e) {
    console.error(e);
    showToast('فشل إرسال الإشعار', 'error');
  }
}

/**
 * Delete global notification
 * @param {string} docId - Notification document ID
 */
export async function deleteGlobalNotification(docId) {
  if (confirm('حذف الإشعار من السجل؟')) {
    try {
      await deleteDoc(doc(db, 'global_notifications', docId));
      showToast('تم الحذف', 'success');
    } catch (e) {}
  }
}

/**
 * Export orders to CSV
 */
export function exportOrdersCSV() {
  if (state.adminOrdersArray.length === 0) { showToast('لا توجد طلبات لتصديرها', 'error'); return; }
  let csv = "رقم الطلب,تاريخ الطلب,اسم العميل,رقم الهاتف,المحافظة,المدينة,العنوان,المنتجات,طريقة الدفع,الاجمالي,حالة الطلب\n";
  state.adminOrdersArray.forEach(o => {
    const dateStr = formatDateTime(o.orderDate).replace(/,/g, '');
    const cleanName = String(o.customerName).replace(/,/g, ' ');
    const cleanGov = String(o.location.governorate).replace(/,/g, '');
    const cleanCity = String(o.location.city).replace(/,/g, '');
    const cleanAddress = String(o.location.details).replace(/,/g, ' ').replace(/\n/g, ' ');
    const itemsStr = o.items.map(i => `${i.name} (${i.quantity})`).join(' | ').replace(/,/g, '');
    const pMethod = o.paymentMethod || 'كاش';
    csv += `"${o.id}","${dateStr}","${cleanName}","${o.phones.primary}","${cleanGov}","${cleanCity}","${cleanAddress}","${itemsStr}","${pMethod}","${o.totalAmount}","${o.status}"\n`;
  });
  const blob = new Blob(["﻿" + csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `orders_${new Date().toISOString().slice(0,10)}.csv`;
  link.click();
  showToast('تم تحميل الملف بنجاح!', 'success');
}

/**
 * Bulk update order status
 */
export async function bulkUpdateOrderStatus() {
  const selectedIds = [];
  document.querySelectorAll('.order-checkbox:checked').forEach(cb => selectedIds.push(cb.value));
  if (selectedIds.length === 0) { showToast('الرجاء تحديد طلب واحد على الأقل', 'error'); return; }
  if (confirm(`هل أنت متأكد من تغيير حالة ${selectedIds.length} طلب إلى "تم الشحن"؟`)) {
    try {
      for (let id of selectedIds) {
        await updateDoc(doc(db, 'orders', id), { status: 'تم الشحن' });
      }
      showToast('تم تحديث الطلبات بنجاح!', 'success');
    } catch (e) { showToast('حدث خطأ أثناء التحديث', 'error'); }
  }
}

/**
 * Select all orders checkbox
 */
export function selectAllOrders() {
  const checkboxes = document.querySelectorAll('.order-checkbox');
  let allChecked = true;
  checkboxes.forEach(cb => { if (!cb.checked) allChecked = false; });
  checkboxes.forEach(cb => cb.checked = !allChecked);
}

// Listen for dynamic admins
onSnapshot(collection(db, 'admins'), (snapshot) => {
  state.dynamicAdmins = [];
  state.dynamicAdminsList = [];
  snapshot.forEach(doc => {
    state.dynamicAdmins.push(doc.data().email.toLowerCase());
    state.dynamicAdminsList.push({ id: doc.id, email: doc.data().email.toLowerCase() });
  });
  updateAdminUI();
  renderAdminsList();
});

// Make functions available globally
if (typeof window !== 'undefined') {
  window.updateAdminUI = updateAdminUI;
  window.loadAdminUsers = loadAdminUsers;
  window.showUserHistory = showUserHistory;
  window.renderAdminsList = renderAdminsList;
  window.addAdmin = addAdmin;
  window.removeAdmin = removeAdmin;
  window.loadAdminChats = loadAdminChats;
  window.openAdminChat = openAdminChat;
  window.closeAdminChat = closeAdminChat;
  window.sendAdminMessage = sendAdminMessage;
  window.endAdminChat = endAdminChat;
  window.deleteAdminChat = deleteAdminChat;
  window.applySettingsToUI = applySettingsToUI;
  window.saveSettings = saveSettings;
  window.addCategory = addCategory;
  window.removeCategory = removeCategory;
  window.addPromoCode = addPromoCode;
  window.removePromo = removePromo;
  window.sendGlobalNotification = sendGlobalNotification;
  window.deleteGlobalNotification = deleteGlobalNotification;
  window.exportOrdersCSV = exportOrdersCSV;
  window.bulkUpdateOrderStatus = bulkUpdateOrderStatus;
  window.selectAllOrders = selectAllOrders;
}

export default {
  updateAdminUI,
  loadAdminUsers,
  showUserHistory,
  renderAdminsList,
  addAdmin,
  removeAdmin,
  loadAdminChats,
  openAdminChat,
  closeAdminChat,
  sendAdminMessage,
  endAdminChat,
  deleteAdminChat,
  applySettingsToUI,
  saveSettings,
  addCategory,
  removeCategory,
  addPromoCode,
  removePromo,
  sendGlobalNotification,
  deleteGlobalNotification,
  exportOrdersCSV,
  bulkUpdateOrderStatus,
  selectAllOrders
};

import { onSnapshot as __zait_re_onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
export { __zait_re_onSnapshot as onSnapshot };

import { collection as __zait_re_collection } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
export { __zait_re_collection as collection };

export function injectPixels(settings) {
  try {
    const s = settings || {};
    const fbId = String(s.fbPixelId || s.facebookPixelId || '').trim();
    if (fbId && typeof document !== 'undefined' && !window.__zaitFbPixelLoaded) {
      window.__zaitFbPixelLoaded = fbId;
      const sc = document.createElement('script');
      sc.async = true;
      sc.src = 'https://connect.facebook.net/en_US/fbevents.js';
      document.head.appendChild(sc);
    }
    const ttId = String(s.tiktokPixelId || '').trim();
    if (ttId && typeof document !== 'undefined' && !window.__zaitTtPixelLoaded) {
      window.__zaitTtPixelLoaded = ttId;
      const sc2 = document.createElement('script');
      sc2.async = true;
      sc2.src = 'https://analytics.tiktok.com/i18n/pixel/events.js?sdkid=' + encodeURIComponent(ttId) + '&lib=ttq';
      document.head.appendChild(sc2);
    }
  } catch (e) {}
}
