import { query } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { collection } from "./admin.js";
import { orderBy } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { setDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
/**
 * Notifications Module
 * Handles user notifications, loyalty points, global notifications
 */

import { db } from '../firebase.js';
import { doc, onSnapshot, updateDoc, increment, arrayUnion, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { state } from '../state.js';
import { showToast, escapeHTML } from '../utils.js';

let userNotificationsUnsubscribe = null;

/**
 * Toggle notifications dropdown
 * @param {Event} e - Click event
 */
export function toggleNotifications(e) {
  if (e) e.stopPropagation();
  const el = document.getElementById('notifications-dropdown');
  if (el) {
    el.classList.toggle('show');
    if (el.classList.contains('show') && state.currentUser) {
      updateDoc(doc(db, 'users', state.currentUser.uid), { unreadNotifs: 0 });
    }
  }
}

/**
 * Load user notifications
 */
export function loadUserNotifications() {
  if (!state.currentUser) return;
  if (userNotificationsUnsubscribe) userNotificationsUnsubscribe();

  userNotificationsUnsubscribe = onSnapshot(doc(db, 'users', state.currentUser.uid), (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      const notifs = data.notifications || [];
      const loyalty = data.loyaltyPoints || 0;

      // Update loyalty points UI
      const lp = document.getElementById('nav-loyalty-points'); if (lp) lp.textContent = loyalty;
      const plp = document.getElementById('loyalty-page-points'); if (plp) plp.textContent = loyalty;
      const clp = document.getElementById('cart-loyalty-points'); if (clp) clp.textContent = loyalty;
      const ls = document.getElementById('loyalty-section'); if (ls) ls.style.display = loyalty >= 50 ? 'flex' : 'none';

      // Update notifications UI
      const fullCont = document.getElementById('full-notifications-container');
      const notifBadge = document.getElementById('notif-badge-main');
      const unreadCount = data.unreadNotifs || 0;

      if (notifs.length > 0) {
        notifs.sort((a, b) => new Date(b.date) - new Date(a.date));
        let html = '';
        notifs.forEach(n => {
          const d = new Date(n.date).toLocaleString('ar-EG');
          html += `<div class="notification-item"><strong>${escapeHTML(n.title)}</strong><span>${escapeHTML(n.message)}</span><span class="notification-time">${d}</span></div>`;
        });

        if (fullCont) fullCont.innerHTML = html;
        if (notifBadge) { notifBadge.textContent = unreadCount; notifBadge.style.display = unreadCount > 0 ? 'flex' : 'none'; }
        const btnN = document.getElementById('btn-notifications-main'); if (btnN) btnN.style.display = 'block';
      }
    }
  });
}

/**
 * Load global notifications panel
 */
export function loadGlobalNotificationsPanel() {
  const container = document.getElementById('global-notifications-list');
  if (!container) return;

  onSnapshot(
    query(collection(db, 'global_notifications'), orderBy('timestamp', 'desc')),
    (snapshot) => {
      let html = '';
      snapshot.forEach(doc => {
        const n = doc.data();
        const date = new Date(n.timestamp).toLocaleString('ar-EG');
        html += `<div class="admin-msg-card" style="margin-bottom:10px;"><strong>${escapeHTML(n.title || 'إشعار')}</strong><br><span>${escapeHTML(n.message)}</span><br><small style="color:var(--text-muted);">${date}</small></div>`;
      });
      container.innerHTML = html || '<p style="text-align:center; color:var(--text-muted);">لا توجد إشعارات عامة.</p>';
    }
  );
}

/**
 * Redeem loyalty points
 */
export async function redeemLoyaltyPoints() {
  if (state.cart.length === 0) { showToast('السلة فارغة، أضف منتجات أولاً', 'error'); return; }
  if (!state.currentUser) return;

  try {
    const userDoc = await getDoc(doc(db, 'users', state.currentUser.uid));
    if (userDoc.exists()) {
      const pts = userDoc.data().loyaltyPoints || 0;
      if (pts >= 50) {
        const discountAmount = Math.floor(pts / 50) * (window.loyaltyRedeemValueActual || 10);
        const usedPts = Math.floor(pts / 50) * 50;
        await updateDoc(doc(db, 'users', state.currentUser.uid), {
          loyaltyPoints: increment(-usedPts),
          unreadNotifs: increment(1),
          notifications: arrayUnion({ title: 'استبدال نقاط 🎁', message: `تم خصم ${usedPts} نقطة بنجاح، وتحويلها لخصم ${discountAmount} جنيه في سلتك الحالية.`, date: new Date().toISOString() })
        });
        state.loyaltyDiscountFixed = discountAmount;
        state.loyaltyPointsUsedTemp = usedPts;
        if (window.updateInvoiceUI) window.updateInvoiceUI();
        const dr = document.getElementById('discount-row'); if (dr) dr.style.display = 'flex';
        showToast(`تم استبدال ${usedPts} نقطة بخصم ${discountAmount} جنيه!`, 'success');
        if (window.showPanel) window.showPanel('cart');
      } else {
        showToast('تحتاج 50 نقطة على الأقل للاستبدال', 'error');
      }
    }
  } catch (error) {
    showToast('حدث خطأ', 'error');
  }
}

/**
 * Load all reviews
 */
export function loadAllReviews() {
  if (window.showPanel) window.showPanel('reviews');
  const container = document.getElementById('all-reviews-container');
  if (!container) return;

  let allReviews = [];
  state.products.forEach(p => {
    if (p.reviews && p.reviews.length > 0) {
      p.reviews.forEach(r => { allReviews.push({ ...r, productName: p.name, productId: p.id }); });
    }
  });

  getDoc(doc(db, 'settings', 'store_reviews')).then(docSnap => {
    if (docSnap.exists() && docSnap.data().reviews) {
      docSnap.data().reviews.forEach(r => { allReviews.push({ ...r, productName: state.currentLang === 'ar' ? 'تقييم عام للمتجر' : 'General Store Review' }); });
    }
    renderReviewsList(allReviews, container);
  }).catch(() => { renderReviewsList(allReviews, container); });
}

/**
 * Render reviews list
 * @param {Array} allReviews - All reviews
 * @param {HTMLElement} container - Container element
 */
export function renderReviewsList(allReviews, container) {
  allReviews.sort((a, b) => new Date(b.date) - new Date(a.date));
  if (allReviews.length === 0) {
    container.innerHTML = `<h3 style="text-align: center; grid-column: 1 / -1; color: var(--text-muted);">${state.currentLang === 'ar' ? 'لا توجد تقييمات بعد.' : 'No reviews yet.'}</h3>`;
    return;
  }
  let html = '';
  allReviews.forEach(r => {
    const d = new Date(r.date).toLocaleDateString('ar-EG');
    const revImgHtml = r.imageUrl ? `<img loading="lazy" src="${r.imageUrl}" class="review-img" onclick="window.open('${r.imageUrl}', '_blank')">` : '';
    html += `<div class="review-box"><strong style="color:var(--primary);">${escapeHTML(r.userName)}</strong> <span style="font-size:0.8rem; color:var(--text-muted);">(${d})</span><br><span style="font-size:0.85rem; color:var(--secondary);">${escapeHTML(r.productName)}</span><br>${'⭐'.repeat(r.rating || 5)}<br><span style="color:var(--text-color); font-size:0.95rem;">${escapeHTML(r.comment)}</span><br>${revImgHtml}</div>`;
  });
  container.innerHTML = html;
}

/**
 * Submit general review
 */
export async function submitGeneralReview() {
  if (!state.currentUser) { showToast(state.currentLang === 'ar' ? 'يرجى تسجيل الدخول أولاً' : 'Please login first', 'error'); if (window.showPanel) window.showPanel('auth'); return; }
  const txt = document.getElementById('general-review-text').value.trim();
  if (!txt) { showToast(state.currentLang === 'ar' ? 'اكتب تقييمك أولاً' : 'Write your review first', 'error'); return; }

  try {
    const rName = state.currentUser.displayName || (state.currentUser.email ? state.currentUser.email.split('@')[0] : state.currentUser.phoneNumber);
    const reviewObj = { userName: rName, userId: state.currentUser.uid, comment: txt, rating: 5, date: new Date().toISOString() };
    const chatRef = doc(db, 'settings', 'store_reviews');
    const snap = await getDoc(chatRef);
    if (snap.exists()) { await updateDoc(chatRef, { reviews: arrayUnion(reviewObj) }); }
    else { await setDoc(chatRef, { reviews: [reviewObj] }); }
    document.getElementById('general-review-text').value = '';
    showToast(state.currentLang === 'ar' ? 'شكراً لتقييمك!' : 'Thank you for your review!', 'success');
    loadAllReviews();
  } catch (error) { showToast('حدث خطأ أثناء الإرسال', 'error'); }
}

// Make functions available globally
if (typeof window !== 'undefined') {
  window.toggleNotifications = toggleNotifications;
  window.loadUserNotifications = loadUserNotifications;
  window.loadGlobalNotificationsPanel = loadGlobalNotificationsPanel;
  window.redeemLoyaltyPoints = redeemLoyaltyPoints;
  window.loadAllReviews = loadAllReviews;
  window.submitGeneralReview = submitGeneralReview;
}

export default {
  toggleNotifications,
  loadUserNotifications,
  loadGlobalNotificationsPanel,
  redeemLoyaltyPoints,
  loadAllReviews,
  submitGeneralReview
};