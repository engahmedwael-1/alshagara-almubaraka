import { event } from "./products.js";
/**
 * Orders Module
 * Handles order loading, tracking, admin management, returns
 */

import { db } from '../firebase.js';
import { collection, onSnapshot, query, orderBy, where, doc, getDoc, updateDoc, deleteDoc, addDoc, getDocs, increment, arrayUnion } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { state } from '../state.js';
import { showToast, escapeHTML, formatDate, formatDateTime, normalizeEgyptPhone } from '../utils.js';

/**
 * Load admin orders
 */
export function loadAdminOrders() {
  if (state.adminOrdersUnsubscribe) state.adminOrdersUnsubscribe();

  state.adminOrdersUnsubscribe = onSnapshot(
    query(collection(db, 'orders'), orderBy('orderDate', 'desc')),
    (snapshot) => {
      state.adminOrdersArray = [];
      state.totalGlobalRevenue = 0;
      state.totalGlobalOrders = 0;

      const revResetDateStr = state.storeSettings.revenueResetDate || "2000-01-01T00:00:00.000Z";
      const ordResetDateStr = state.storeSettings.ordersResetDate || "2000-01-01T00:00:00.000Z";
      const revResetDate = new Date(revResetDateStr);
      const ordResetDate = new Date(ordResetDateStr);

      snapshot.forEach(docSnap => {
        const d = docSnap.data();
        state.adminOrdersArray.push({ id: docSnap.id, ...d });
        if (d.status !== "تم الرفض" && d.status !== "ملغى من العميل ❌" && d.status !== "تم الرفض ❌") {
          const orderDate = new Date(d.orderDate);
          if (orderDate >= revResetDate) {
            state.totalGlobalRevenue += Number(d.totalAmount);
          }
          if (orderDate >= ordResetDate) {
            state.totalGlobalOrders++;
          }
        }
      });

      if (window.checkWorkHubRealtimeChanges) window.checkWorkHubRealtimeChanges('orders');
      renderAdminOrdersUI();
      if (window.renderAdminWorkHub) window.renderAdminWorkHub();

      const so = document.getElementById('stat-orders');
      if (so) so.textContent = state.totalGlobalOrders;
      const sr = document.getElementById('stat-revenue');
      if (sr) sr.textContent = state.totalGlobalRevenue.toLocaleString() + ' ج';
    }
  );
}

/**
 * Render admin orders UI
 */
export function renderAdminOrdersUI() {
  const container = document.getElementById('admin-orders-container');
  if (!container) return;

  if (state.adminOrdersArray.length === 0) {
    container.innerHTML = '<div style="text-align:center; padding:40px; color:#94a3b8;"><span style="font-size:3rem; display:block; margin-bottom:10px;">📭</span><h3>لا توجد طلبات هنا</h3></div>';
    return;
  }

  let filtered = state.adminOrdersArray.filter(o =>
    state.currentAdminOrderFilter === 'الكل' || o.status === state.currentAdminOrderFilter
  );

  if (filtered.length === 0) {
    container.innerHTML = '<div style="text-align:center; padding:40px; color:#94a3b8;"><span style="font-size:3rem; display:block; margin-bottom:10px;">📭</span><h3>لا توجد طلبات هنا</h3></div>';
    return;
  }

  let htmlContent = '';
  filtered.forEach((data) => {
    let badgeClass = 'status-pending';
    if (data.status.includes('تجهيز')) badgeClass = 'status-prep';
    else if (data.status.includes('شحن')) badgeClass = 'status-shipped';
    else if (data.status.includes('توصيل')) badgeClass = 'status-delivered';
    else if (data.status.includes('رفض') || data.status.includes('لغى')) badgeClass = 'status-canceled';

    const dStr = formatDateTime(data.orderDate);

    htmlContent += `
      <div class="admin-msg-card" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; cursor:pointer; border-right:4px solid var(--secondary);" onclick="window.openAdminOrderModal('${data.id}')">
        <div>
          <strong style="color:var(--primary); font-size:1.1rem;">👤 ${escapeHTML(data.customerName)}</strong><br>
          <span style="font-size:0.85rem; color:var(--text-muted);">رقم: #${data.id.slice(0,6).toUpperCase()} | 📅 ${dStr}</span><br>
          <strong style="color:var(--secondary);">${data.totalAmount} ج</strong>
        </div>
        <div>
          <span class="order-status-badge ${badgeClass}" style="font-size:0.75rem;">${escapeHTML(data.status)}</span>
        </div>
      </div>`;
  });
  container.innerHTML = htmlContent;
}

/**
 * Filter admin orders by status
 * @param {string} status - Status to filter by
 */
export function filterAdminOrders(status) {
  state.currentAdminOrderFilter = status;
  document.querySelectorAll('#admin-orders-panel .filter-btn').forEach(btn => btn.classList.remove('active'));
  if (event && event.target && event.target.classList) event.target.classList.add('active');
  renderAdminOrdersUI();
}

/**
 * Open admin order modal
 * @param {string} id - Order ID
 */
export function openAdminOrderModal(id) {
  const data = state.adminOrdersArray.find(o => o.id === id);
  if (!data) return;

  let itemsHtml = '';
  data.items.forEach(item => {
    itemsHtml += `<li>${escapeHTML(item.name)} <b style="color:var(--secondary);">(${item.quantity})</b></li>`;
  });

  const receiptHtml = data.receiptUrl ? `<a href="${data.receiptUrl}" target="_blank" class="btn btn-outline" style="padding:6px 12px; font-size:0.85rem;">📄 عرض الإيصال</a>` : '';

  let html = `
    <div style="background:var(--input-bg); padding:15px; border-radius:8px; margin-bottom:15px; border:1px solid var(--border-color);">
      <div style="display:flex; justify-content:space-between; margin-bottom:10px;"><span><strong>العميل:</strong> ${escapeHTML(data.customerName)}</span><span><strong>الهاتف:</strong> ${escapeHTML(data.phones.primary)}</span></div>
      <div style="margin-bottom:10px;"><strong>المكان:</strong> ${escapeHTML(data.location.governorate)} - ${escapeHTML(data.location.city)}</div>
      <div style="margin-bottom:10px; background:#e0f7fa; padding:10px; border-radius:6px;"><strong>العنوان التفصيلي:</strong> ${escapeHTML(data.location.details)}</div>
      ${data.location.mapLink ? `<a href="${data.location.mapLink}" target="_blank" class="btn btn-info" style="display:inline-block; padding:6px 12px; font-size:0.9rem; margin-bottom:10px;">🗺️ فتح الموقع على الخريطة</a>` : ''}
    </div>

    <div style="background:#f8fafc; padding:15px; border-radius:8px; border:1px dashed var(--border-color); margin-bottom:15px;">
      <strong style="color:var(--primary); display:block; margin-bottom:10px;">📦 المنتجات:</strong>
      <ul style="margin:0; padding-right:20px;">${itemsHtml}</ul>
    </div>

    <div style="display:flex; justify-content:space-between; align-items:center; background:#f0fdf4; padding:15px; border-radius:8px; border:1px solid #bbf7d0; margin-bottom:15px;">
      <strong style="font-size:1.1rem;">الإجمالي المطلوب:</strong>
      <strong style="color:#166534; font-size:1.4rem;">${data.totalAmount} ج</strong>
    </div>

    <div style="display:flex; gap:10px; flex-wrap:wrap; align-items:center; background:var(--panel-bg); padding:15px; border-radius:8px; border:1px solid var(--border-color);">
      <div style="flex:1; min-width:200px;">
        <label style="font-weight:bold; font-size:0.85rem; color:var(--text-muted); display:block; margin-bottom:5px;">تحديث حالة الطلب:</label>
        <select onchange="window.updateOrderStatus('${data.id}', this.value)" style="width:100%; margin:0; padding:10px; border:2px solid var(--secondary); font-weight:bold; border-radius:8px;">
          <option value="قيد المراجعة" ${data.status === 'قيد المراجعة' ? 'selected' : ''}>قيد المراجعة 🕒</option>
          <option value="تم التجهيز" ${data.status === 'تم التجهيز' ? 'selected' : ''}>تم التجهيز 📦</option>
          <option value="تم الشحن" ${data.status === 'تم الشحن' ? 'selected' : ''}>تم الشحن 🚚</option>
          <option value="تم التوصيل ✅" ${data.status === 'تم التوصيل ✅' ? 'selected' : ''}>تم التوصيل ✅</option>
          <option value="تم الرفض ❌" ${data.status === 'تم الرفض ❌' ? 'selected' : ''}>تم الرفض ❌</option>
          <option value="ملغى من العميل ❌" ${data.status === 'ملغى من العميل ❌' ? 'selected' : ''}>ملغى ❌</option>
        </select>
      </div>
      ${receiptHtml}
      <button type="button" class="btn btn-outline" style="border-color:#17a2b8; color:#17a2b8; padding:10px 15px; border-radius:8px; font-size:0.9rem;" onclick="window.printOrder('${data.id}')">🖨️ طباعة الفاتورة</button>
      <button type="button" class="btn btn-danger" style="padding:10px 15px; border-radius:8px; font-size:0.9rem;" onclick="window.deleteAdminOrder('${data.id}'); document.getElementById('admin-order-modal').style.display='none';">حذف الطلب 🗑️</button>
    </div>
  `;

  const aomContent = document.getElementById('aom-content');
  if (aomContent) aomContent.innerHTML = html;
  const adminOrderModal = document.getElementById('admin-order-modal');
  if (adminOrderModal) adminOrderModal.style.display = 'flex';
}

/**
 * Update order status
 * @param {string} orderId - Order ID
 * @param {string} newStatus - New status
 */
export async function updateOrderStatus(orderId, newStatus) {
  const statusPayload = {
    status: newStatus,
    updatedAt: new Date().toISOString()
  };
  if (String(newStatus).includes('لغى') || String(newStatus).includes('رفض')) {
    statusPayload.canceledAt = new Date().toISOString();
  } else {
    statusPayload.unreadCancelByAdmin = false;
  }

  try {
    await updateDoc(doc(db, 'orders', orderId), statusPayload);
    showToast('تم تحديث الحالة', 'success');

    const oData = state.adminOrdersArray.find(o => o.id === orderId);
    if (oData && oData.userId) {
      try {
        await updateDoc(doc(db, 'users', oData.userId), {
          unreadNotifs: increment(1),
          notifications: arrayUnion({ title: 'تحديث حالة الطلب 📦', message: `تم تحديث حالة طلبك #${orderId.slice(0,6).toUpperCase()} إلى: ${newStatus}`, date: new Date().toISOString() })
        });
      } catch (e) {}
    }

    // Award loyalty points on delivery
    if (newStatus === 'تم التوصيل ✅' && oData && oData.userId && !oData.pointsAdded) {
      const earnRate = window.loyaltyEarnRateActual || 20;
      const pts = Math.floor((oData.totalAmount - (oData.shippingCost || 0)) / earnRate);
      if (pts > 0) {
        try {
          await updateDoc(doc(db, 'users', oData.userId), {
            loyaltyPoints: increment(pts),
            unreadNotifs: increment(1),
            notifications: arrayUnion({ title: 'نقاط ولاء جديدة 🎁', message: `مبروك! حصلت على ${pts} نقطة لإتمام طلبك.`, date: new Date().toISOString() })
          });
          await updateDoc(doc(db, 'orders', orderId), { pointsAdded: true });
        } catch (e) {}
      }
    }
  } catch (e) {
    showToast('فشل التحديث', 'error');
  }
}

/**
 * Delete admin order
 * @param {string} orderId - Order ID
 */
export async function deleteAdminOrder(orderId) {
  if (confirm('هل أنت متأكد من حذف هذا الطلب نهائياً من قاعدة البيانات؟')) {
    try {
      await deleteDoc(doc(db, 'orders', orderId));
      showToast('تم حذف الطلب بنجاح', 'success');
    } catch (e) {
      showToast('فشل الحذف', 'error');
    }
  }
}

/**
 * Print order
 * @param {string} id - Order ID
 */
export function printOrder(id) {
  const data = state.adminOrdersArray.find(o => o.id === id);
  if (!data) return;

  let itemsHtml = data.items.map(i => `<tr><td style="padding:8px; border:1px solid #ddd;">${escapeHTML(i.name)}</td><td style="padding:8px; border:1px solid #ddd;">${i.quantity}</td><td style="padding:8px; border:1px solid #ddd;">${i.price * i.quantity} ج</td></tr>`).join('');

  let printWindow = window.open('', '_blank');
  printWindow.document.write(`
    <html dir="rtl" lang="ar">
    <head>
      <title>فاتورة طلب #${data.id.slice(0,6).toUpperCase()}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
        .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; text-align:right; }
        th, td { border: 1px solid #ddd; padding: 10px; text-align: right; }
        th { background-color: #f8f9fa; }
        .total { font-weight: bold; font-size: 1.2rem; margin-top: 20px; text-align: left; background:#f0fdf4; padding:10px; border-radius:8px; border:1px solid #bbf7d0;}
        @media print { button { display: none; } }
      </style>
    </head>
    <body>
      <div class="header">
        <h2>زيت الشجرة المباركة</h2>
        <p>فاتورة طلب إلكتروني #${data.id.slice(0,6).toUpperCase()}</p>
        <p>تاريخ الطلب: ${formatDateTime(data.orderDate)}</p>
      </div>
      <div style="margin-bottom:20px;">
        <p><strong>العميل:</strong> ${escapeHTML(data.customerName)}</p>
        <p><strong>الهاتف:</strong> ${escapeHTML(data.phones.primary)}</p>
        <p><strong>المحافظة:</strong> ${escapeHTML(data.location.governorate)}</p>
        <p><strong>المدينة:</strong> ${escapeHTML(data.location.city)}</p>
        <p><strong>العنوان:</strong> ${escapeHTML(data.location.details)}</p>
        <p><strong>الدفع:</strong> ${escapeHTML(data.paymentMethod || 'كاش')}</p>
      </div>
      <table>
        <thead><tr><th>المنتج</th><th>الكمية</th><th>السعر</th></tr></thead>
        <tbody>${itemsHtml}</tbody>
      </table>
      <div class="total">الإجمالي: ${data.totalAmount} ج</div>
      <button onclick="window.print()">طباعة</button>
    </body>
    </html>
  `);
  printWindow.document.close();
}

/**
 * Load customer orders
 */
export function loadCustomerOrders() {
  if (!state.currentUser) return;
  const filterKey = state.currentUser.email || state.currentUser.phoneNumber;
  if (!filterKey) return;

  onSnapshot(
    query(collection(db, 'orders'), where('customerEmail', '==', filterKey)),
    (snapshot) => {
      const container = document.getElementById('customer-orders-container');
      if (!container) return;

      window.customerOrdersArray = [];
      snapshot.forEach(doc => window.customerOrdersArray.push({ id: doc.id, ...doc.data() }));
      let userOrders = window.customerOrdersArray;
      userOrders.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));

      if (userOrders.length === 0) {
        container.innerHTML = `<div style="text-align:center; padding:40px; color:#94a3b8;"><span style="font-size:3rem; display:block; margin-bottom:10px;">🛒</span><h3>لا توجد طلبات بعد.</h3></div>`;
        return;
      }

      let htmlContent = '';
      userOrders.forEach(order => {
        let itemsHtml = '';
        order.items.forEach(item => { itemsHtml += `<li>${escapeHTML(item.name)} <b style="color:var(--primary);">(${item.quantity})</b></li>`; });

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

        let actionBtns = '';
        if (order.status === 'قيد المراجعة') actionBtns = `<button type="button" class="btn btn-danger" style="margin-top:10px; width:100%; padding:12px; border-radius:8px;" onclick="window.cancelOrder('${order.id}')">إلغاء الطلب ❌</button>`;
        else if (order.status === 'تم التوصيل ✅' || order.status === 'تم الشحن') actionBtns = `<button type="button" class="btn btn-outline" style="margin-top:10px; width:100%; border-color:var(--danger); color:var(--danger); padding:12px; border-radius:8px;" onclick="window.openReturnModal('${order.id}')">طلب استرجاع 🔄</button>`;

        const dStr = formatDate(order.orderDate, { dateStyle: 'long' });

        htmlContent += `
          <div class="admin-msg-card" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; cursor:pointer; border-right:4px solid #028090;" onclick="window.openCustomerOrderModal('${order.id}')">
            <div>
              <strong style="color:var(--primary); font-size:1.1rem;">📦 طلب #${order.id.slice(0,6).toUpperCase()}</strong><br>
              <span style="font-size:0.85rem; color:var(--text-muted);">📅 ${dStr}</span><br>
              <strong style="color:var(--secondary);">${order.totalAmount} ج</strong>
            </div>
            <div style="display:flex; flex-direction:column; align-items:flex-end; gap:6px;">
              <span class="order-status-badge ${badgeClass}" style="font-size:0.75rem;">${statusIcon} ${escapeHTML(order.status)}</span>
              ${state.storeSettings.enableBuyAgain !== false ? `<button type="button" class="btn btn-outline" style="padding:4px 10px; font-size:0.78rem; border-color:var(--primary); color:var(--primary);" onclick="event.stopPropagation(); window.buyAgainOrder('${order.id}')">🔄 اطلبه مجدداً</button>` : ''}
            </div>
          </div>`;
      });
      container.innerHTML = htmlContent;
    }
  );
}

/**
 * Get step index for order tracking
 * @param {string} status - Order status
 * @returns {number} Step index
 */
export function getStepIndex(status) {
  if (status === 'قيد المراجعة') return 1;
  if (status === 'تم التجهيز') return 2;
  if (status === 'تم الشحن') return 3;
  if (status === 'تم التوصيل ✅' || status === 'تم التوصيل') return 4;
  return 0;
}

/**
 * Open customer order modal
 * @param {string} orderId - Order ID
 */
export function openCustomerOrderModal(orderId) {
  if (!window.customerOrdersArray) return;
  const order = window.customerOrdersArray.find(o => o.id === orderId);
  if (!order) return;

  let itemsHtml = '';
  order.items.forEach(item => { itemsHtml += `<li>${escapeHTML(item.name)} <b style="color:var(--primary);">(${item.quantity})</b></li>`; });

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

  let actionBtns = '';
  if (order.status === 'قيد المراجعة') actionBtns = `<button type="button" class="btn btn-danger" style="margin-top:10px; width:100%; padding:12px; border-radius:8px;" onclick="window.cancelOrder('${order.id}'); document.getElementById('customer-order-modal').style.display='none';">إلغاء الطلب ❌</button>`;
  else if (order.status === 'تم التوصيل ✅' || order.status === 'تم الشحن') actionBtns = `<button type="button" class="btn btn-outline" style="margin-top:10px; width:100%; border-color:var(--danger); color:var(--danger); padding:12px; border-radius:8px;" onclick="window.openReturnModal('${order.id}'); document.getElementById('customer-order-modal').style.display='none';">طلب استرجاع 🔄</button>`;

  const dStr = formatDate(order.orderDate, { dateStyle: 'long' });

  let html = `
    <div style="background:var(--input-bg); padding:15px; border-radius:8px; margin-bottom:15px; border:1px solid var(--border-color);">
      <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
        <span style="font-size:0.85rem; color:var(--text-muted);">📅 ${dStr}</span>
        <span class="order-status-badge ${badgeClass}" style="font-size:0.75rem;">${statusIcon} ${escapeHTML(order.status)}</span>
      </div>
      ${trackerHtml}
    </div>

    <div style="background:#f8fafc; padding:15px; border-radius:8px; border:1px dashed var(--border-color); margin-bottom:15px;">
      <strong style="color:var(--primary); display:block; margin-bottom:10px;">📦 المنتجات المطلوبة:</strong>
      <ul style="margin:0; padding-right:20px;">${itemsHtml}</ul>
    </div>

    <div style="display:flex; justify-content:space-between; align-items:center; background:#f0fdf4; padding:15px; border-radius:8px; border:1px solid #bbf7d0; margin-bottom:15px;">
      <strong style="font-size:1.1rem;">الإجمالي المدفوع:</strong>
      <strong style="color:#166534; font-size:1.4rem;">${order.totalAmount} ج</strong>
    </div>

    ${actionBtns ? `<div>${actionBtns}</div>` : ''}
  `;

  const comContent = document.getElementById('com-content');
  if (comContent) comContent.innerHTML = html;
  const customerOrderModal = document.getElementById('customer-order-modal');
  if (customerOrderModal) customerOrderModal.style.display = 'flex';
}

/**
 * Cancel order
 * @param {string} orderId - Order ID
 */
export async function cancelOrder(orderId) {
  if (confirm('متأكد من الإلغاء؟')) {
    try {
      const orderDoc = await getDoc(doc(db, 'orders', orderId));
      if (orderDoc.exists()) {
        const oData = orderDoc.data();
        await updateDoc(doc(db, 'orders', orderId), { status: 'ملغى من العميل ❌', canceledAt: new Date().toISOString(), updatedAt: new Date().toISOString(), unreadCancelByAdmin: true });

        // Restore loyalty points if they were used
        if (oData.usedLoyaltyPoints && oData.userId) {
          await updateDoc(doc(db, 'users', oData.userId), {
            loyaltyPoints: increment(oData.usedLoyaltyPoints),
            unreadNotifs: increment(1),
            notifications: arrayUnion({ title: 'استرجاع نقاط 🔄', message: `تم استرجاع ${oData.usedLoyaltyPoints} نقطة لإلغائك الطلب.`, date: new Date().toISOString() })
          });
        }
      }
      showToast('تم الإلغاء.', 'success');
    } catch (e) {
      showToast('فشل الإلغاء', 'error');
    }
  }
}

/**
 * Open return modal
 * @param {string} orderId - Order ID
 */
export function openReturnModal(orderId) {
  const ri = document.getElementById('return-order-id');
  if (ri) ri.value = orderId;
  const rn = document.getElementById('return-notes');
  if (rn) rn.value = '';
  const rif = document.getElementById('return-image-file');
  if (rif) rif.value = '';
  const rm = document.getElementById('return-modal');
  if (rm) rm.style.display = 'flex';
}

/**
 * Submit return request
 */
export async function submitReturnRequest() {
  const orderId = document.getElementById('return-order-id').value;
  const reason = document.getElementById('return-reason').value;
  const notes = document.getElementById('return-notes').value;
  const fileInput = document.getElementById('return-image-file');

  if (!fileInput || fileInput.files.length === 0) {
    showToast('يرجى إرفاق صورة توضح المشكلة', 'error');
    return;
  }

  const btn = document.getElementById('btn-submit-return');
  if (btn) btn.disabled = true;
  const statusLabel = document.getElementById('return-upload-status');
  if (statusLabel) statusLabel.style.display = 'block';

  let returnImageUrl = null;
  try {
    const formData = new FormData();
    formData.append('image', fileInput.files[0]);
    const res = await fetch(`https://api.cloudinary.com/v1_1/${state.storeSettings.cloudinaryCloudName || 'demo'}/image/upload`, {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    if (data.success) {
      returnImageUrl = data.secure_url;
    } else {
      throw new Error();
    }

    await addDoc(collection(db, 'return_requests'), {
      orderId: orderId,
      customerEmail: state.currentUser.email || state.currentUser.phoneNumber,
      reason: reason,
      notes: notes,
      imageUrl: returnImageUrl,
      status: 'قيد المراجعة',
      date: new Date().toISOString()
    });

    await updateDoc(doc(db, 'orders', orderId), { status: 'طلب استرجاع قيد المراجعة 🔄' });
    showToast('تم إرسال طلب الاسترجاع بنجاح', 'success');

    const rm = document.getElementById('return-modal');
    if (rm) rm.style.display = 'none';
  } catch (e) {
    showToast('فشل إرسال الطلب', 'error');
  }

  if (btn) btn.disabled = false;
  if (statusLabel) statusLabel.style.display = 'none';
}

/**
 * Load admin returns
 */
export function loadAdminReturns() {
  if (state.adminReturnsUnsubscribe) return;

  state.adminReturnsUnsubscribe = onSnapshot(
    query(collection(db, 'return_requests'), orderBy('date', 'desc')),
    (snapshot) => {
      state.adminReturnsArray = [];
      const container = document.getElementById('admin-returns-container');
      let html = '';

      snapshot.forEach(docSnap => {
        const d = docSnap.data();
        state.adminReturnsArray.push({ id: docSnap.id, ...d });
        const imgHtml = d.imageUrl ? `<a href="${d.imageUrl}" target="_blank" style="display:inline-block; margin-top:10px; padding:5px 10px; background:#17a2b8; color:white; text-decoration:none; border-radius:6px; font-size:0.85rem;">📸 عرض صورة المشكلة</a>` : '';
        const actionBtn = d.status === 'قيد المراجعة' ? `<button type="button" class="btn btn-full" style="background:#28a745; margin-top:10px;" onclick="window.approveReturn('${docSnap.id}', '${d.orderId}')">الموافقة وإرسال مندوب ✅</button>` : `<div style="margin-top:10px; font-weight:bold; color:var(--primary); text-align:center;">تم الموافقة على الطلب</div>`;

        html += `<div class="admin-msg-card" style="border-left:4px solid var(--danger);"><h4>رقم الطلب الأصلي: #${d.orderId.slice(0,6).toUpperCase()}</h4><p><strong>العميل:</strong> ${escapeHTML(d.customerEmail)}</p><p><strong>السبب:</strong> ${escapeHTML(d.reason)}</p><p style="color:var(--text-muted);"><strong>الملاحظات:</strong> ${escapeHTML(d.notes)}</p><p><strong>التاريخ:</strong> ${formatDateTime(d.date)}</p>${imgHtml}${actionBtn}</div>`;
      });

      if (container) container.innerHTML = html || '<h3 style="text-align: center; color: var(--text-muted);">لا توجد طلبات استرجاع حالياً.</h3>';
      if (window.checkWorkHubRealtimeChanges) window.checkWorkHubRealtimeChanges('returns');
      if (window.renderAdminWorkHub) window.renderAdminWorkHub();
    }
  );
}

/**
 * Approve return request
 * @param {string} returnId - Return request ID
 * @param {string} orderId - Order ID
 */
export async function approveReturn(returnId, orderId) {
  if (confirm('الموافقة على الاسترجاع وإرسال إشعار للعميل بموعد المندوب؟')) {
    try {
      await updateDoc(doc(db, 'return_requests', returnId), { status: 'تمت الموافقة' });
      await updateDoc(doc(db, 'orders', orderId), { status: 'جاري الاسترجاع 🔄' });
      await addDoc(collection(db, 'global_notifications'), { message: `تم الموافقة على طلب الاسترجاع الخاص بك للطلب #${orderId.slice(0,6).toUpperCase()}. سيتواصل معك المندوب قريباً.`, timestamp: new Date().toISOString() });
      showToast('تم الموافقة على الطلب', 'success');
    } catch (e) {
      showToast('حدث خطأ', 'error');
    }
  }
}

/**
 * Buy again order
 * @param {string} orderId - Order ID
 */
export function buyAgainOrder(orderId) {
  const order = state.adminOrdersArray.find(o => o.id === orderId) || window.customerOrdersArray?.find(o => o.id === orderId);
  if (!order) return;

  order.items.forEach(item => {
    const product = state.products.find(p => p.id === item.id);
    if (product) {
      if (window.addToCart) {
        window.addToCart(item.id, item.name, item.price, item.imageUrl, item.variant);
      }
    }
  });
  showToast('تم إضافة منتجات الطلب للسلة', 'success');
  if (window.showPanel) window.showPanel('cart');
}

// Make functions available globally
if (typeof window !== 'undefined') {
  window.loadAdminOrders = loadAdminOrders;
  window.renderAdminOrdersUI = renderAdminOrdersUI;
  window.filterAdminOrders = filterAdminOrders;
  window.openAdminOrderModal = openAdminOrderModal;
  window.updateOrderStatus = updateOrderStatus;
  window.deleteAdminOrder = deleteAdminOrder;
  window.printOrder = printOrder;
  window.loadCustomerOrders = loadCustomerOrders;
  window.getStepIndex = getStepIndex;
  window.openCustomerOrderModal = openCustomerOrderModal;
  window.cancelOrder = cancelOrder;
  window.openReturnModal = openReturnModal;
  window.submitReturnRequest = submitReturnRequest;
  window.loadAdminReturns = loadAdminReturns;
  window.approveReturn = approveReturn;
  window.buyAgainOrder = buyAgainOrder;
}

export default {
  loadAdminOrders,
  renderAdminOrdersUI,
  filterAdminOrders,
  openAdminOrderModal,
  updateOrderStatus,
  deleteAdminOrder,
  printOrder,
  loadCustomerOrders,
  getStepIndex,
  openCustomerOrderModal,
  cancelOrder,
  openReturnModal,
  submitReturnRequest,
  loadAdminReturns,
  approveReturn,
  buyAgainOrder
};