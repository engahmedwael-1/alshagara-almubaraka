/**
 * Order Tracking Module
 * Handles public order tracking without login
 */

import { db } from '../firebase.js';
import { collection, getDocs, query, where, doc, getDoc, orderBy } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { state } from '../state.js';
import { showToast, escapeHTML, formatDateTime, normalizeEgyptPhone, getStepIndex } from '../utils.js';

/**
 * Initialize tracking page
 */
export function initTrackingPage() {
  const trackForm = document.getElementById('track-order-form');
  if (trackForm) {
    trackForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      await trackOrder();
    });
  }

  // Check URL params
  const urlParams = new URLSearchParams(window.location.search);
  const orderId = urlParams.get('order') || urlParams.get('id');
  const phone = urlParams.get('phone');

  if (orderId) {
    document.getElementById('track-order-id').value = orderId;
    trackOrder();
  } else if (phone) {
    document.getElementById('track-phone').value = phone;
    trackOrderByPhone();
  }
}

/**
 * Track order by ID
 */
export async function trackOrder() {
  const orderIdInput = document.getElementById('track-order-id');
  const phoneInput = document.getElementById('track-phone');
  const orderId = orderIdInput?.value.trim();
  const phone = phoneInput?.value.trim();

  if (!orderId && !phone) {
    showToast('أدخل رقم الطلب أو رقم الهاتف', 'error');
    return;
  }

  showToast('جاري البحث عن الطلب...', 'info');

  try {
    let orders = [];

    if (orderId) {
      // Try to find by order ID (partial match)
      const { getDocs, query, where } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");
      const q = query(collection(db, 'orders'), where('id', '==', orderId));
      const snapshot = await getDocs(q);
      snapshot.forEach(doc => orders.push({ id: doc.id, ...doc.data() }));
    } else if (phone) {
      // Track by phone number
      orders = await trackOrderByPhone(phone);
    }

    if (orders.length === 0) {
      showToast('لم يتم العثور على طلب بهذا الرقم', 'error');
      return;
    }

    // Show latest order
    displayOrderTracking(orders[0]);
    showToast('تم العثور على الطلب', 'success');
  } catch (error) {
    console.error('Tracking error:', error);
    showToast('حدث خطأ أثناء البحث', 'error');
  }
}

/**
 * Track orders by phone number
 * @param {string} phone - Phone number
 * @returns {Promise<Array>} Orders
 */
export async function trackOrderByPhone(phone) {
  const normalizedPhone = normalizeEgyptPhone(phone);
  const orders = [];

  try {
    const { getDocs, query, where } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");
    const q = query(
      collection(db, 'orders'),
      where('phones.primary', '==', normalizedPhone)
    );
    const snapshot = await getDocs(q);
    snapshot.forEach(doc => orders.push({ id: doc.id, ...doc.data() }));
    orders.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));
  } catch (error) {
    console.error('Track by phone error:', error);
  }

  return orders;
}

/**
 * Display order tracking information
 * @param {Object} order - Order data
 */
export function displayOrderTracking(order) {
  const container = document.getElementById('tracking-result');
  if (!container) return;

  const step = getStepIndex(order.status);
  let trackerHtml = '';

  let badgeClass = 'status-pending';
  let statusIcon = '🕒';
  if (order.status.includes('تجهيز')) { badgeClass = 'status-prep'; statusIcon = '📦'; }
  else if (order.status.includes('شحن')) { badgeClass = 'status-shipped'; statusIcon = '🚚'; }
  else if (order.status.includes('توصيل')) { badgeClass = 'status-delivered'; statusIcon = '✅'; }
  else if (order.status.includes('رفض') || order.status.includes('لغى')) { badgeClass = 'status-canceled'; statusIcon = '❌'; }

  if (!order.status.includes('❌') && !order.status.includes('الاسترجاع')) {
    const t1 = state.currentLang === 'ar' ? 'مراجعة' : 'Review';
    const t2 = state.currentLang === 'ar' ? 'تجهيز' : 'Prep';
    const t3 = state.currentLang === 'ar' ? 'شحن' : 'Ship';
    const t4 = state.currentLang === 'ar' ? 'توصيل' : 'Delivered';
    trackerHtml = `<div class="order-track" style="margin: 25px 0;"><div class="track-step ${step >= 1 ? (step > 1 ? 'done' : 'active') : ''}"><div class="track-dot">1</div>${t1}</div><div class="track-step ${step >= 2 ? (step > 2 ? 'done' : 'active') : ''}"><div class="track-dot">2</div>${t2}</div><div class="track-step ${step >= 3 ? (step > 3 ? 'done' : 'active') : ''}"><div class="track-dot">3</div>${t3}</div><div class="track-step ${step >= 4 ? 'done' : ''}"><div class="track-dot">4</div>${t4}</div></div>`;
  }

  let itemsHtml = '';
  order.items.forEach(item => { itemsHtml += `<li>${escapeHTML(item.name)} <b style="color:var(--primary);">(${item.quantity})</b></li>`; });

  let html = `
    <div style="background:var(--input-bg); padding:15px; border-radius:8px; margin-bottom:15px; border:1px solid var(--border-color);">
      <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
        <span style="font-size:0.85rem; color:var(--text-muted);">📅 ${formatDateTime(order.orderDate)}</span>
        <span class="order-status-badge ${badgeClass}" style="font-size:0.75rem;">${statusIcon} ${escapeHTML(order.status)}</span>
      </div>
      ${trackerHtml}
    </div>

    <div style="background:#f8fafc; padding:15px; border-radius:8px; border:1px dashed var(--border-color); margin-bottom:15px;">
      <strong style="color:var(--primary); display:block; margin-bottom:10px;">📦 المنتجات:</strong>
      <ul style="margin:0; padding-right:20px;">${itemsHtml}</ul>
    </div>

    <div style="display:flex; justify-content:space-between; align-items:center; background:#f0fdf4; padding:15px; border-radius:8px; border:1px solid #bbf7d0; margin-bottom:15px;">
      <strong style="font-size:1.1rem;">الإجمالي:</strong>
      <strong style="color:#166534; font-size:1.4rem;">${order.totalAmount} ج</strong>
    </div>

    <div style="background:var(--input-bg); padding:15px; border-radius:8px; border:1px solid var(--border-color); margin-bottom:15px;">
      <h4 style="margin-top:0; color:var(--primary);">📍 عنوان التوصيل</h4>
      <p style="margin:5px 0;"><strong>المحافظة:</strong> ${escapeHTML(order.location.governorate)}</p>
      <p style="margin:5px 0;"><strong>المدينة:</strong> ${escapeHTML(order.location.city)}</p>
      <p style="margin:5px 0;"><strong>العنوان:</strong> ${escapeHTML(order.location.details)}</p>
      ${order.location.mapLink ? `<a href="${order.location.mapLink}" target="_blank" class="btn btn-info" style="margin-top:10px; display:inline-block;">🗺️ عرض على الخريطة</a>` : ''}
    </div>

    <div style="background:#fff3cd; padding:15px; border-radius:8px; border:1px solid #ffc107;">
      <strong style="color:#856404;">📞 تواصل معنا</strong><br>
      <small>لأي استفسار بخصوص طلبك، تواصل معنا عبر واتساب: <a href="https://wa.me/201018631768" target="_blank" style="color:#25D366;">201018631768</a></small>
    </div>
  `;

  container.innerHTML = html;
  container.style.display = 'block';
}

/**
 * Show all orders for a phone number
 * @param {Array} orders - Orders array
 */
export function displayOrderList(orders) {
  const container = document.getElementById('tracking-result');
  if (!container) return;

  if (orders.length === 0) {
    container.innerHTML = '<p style="text-align:center; color:var(--text-muted);">لا توجد طلبات</p>';
    return;
  }

  let html = '<h3 style="color:var(--primary);">📦 طلباتك:</h3>';
  orders.forEach(order => {
    let badgeClass = 'status-pending';
    if (order.status.includes('تجهيز')) badgeClass = 'status-prep';
    else if (order.status.includes('شحن')) badgeClass = 'status-shipped';
    else if (order.status.includes('توصيل')) badgeClass = 'status-delivered';
    else if (order.status.includes('رفض') || order.status.includes('لغى')) badgeClass = 'status-canceled';

    html += `
      <div class="admin-msg-card" style="cursor:pointer; border-right:4px solid #028090; margin-bottom:10px;" onclick="window.displayOrderTracking(this.dataset.order)">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
          <div>
            <strong style="color:var(--primary);">📦 طلب #${order.id.slice(0,6).toUpperCase()}</strong><br>
            <span style="font-size:0.85rem; color:var(--text-muted);">${formatDateTime(order.orderDate)}</span><br>
            <strong style="color:var(--secondary);">${order.totalAmount} ج</strong>
          </div>
          <span class="order-status-badge ${badgeClass}" style="font-size:0.75rem;">${escapeHTML(order.status)}</span>
        </div>
      </div>
    `;
  });
  container.innerHTML = html;
  container.style.display = 'block';
}

// Make functions available globally
if (typeof window !== 'undefined') {
  window.initTrackingPage = initTrackingPage;
  window.trackOrder = trackOrder;
  window.trackOrderByPhone = trackOrderByPhone;
  window.displayOrderTracking = displayOrderTracking;
  window.displayOrderList = displayOrderList;
}

export default {
  initTrackingPage,
  trackOrder,
  trackOrderByPhone,
  displayOrderTracking,
  displayOrderList
};