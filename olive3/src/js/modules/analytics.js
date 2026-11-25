import { onSnapshot } from "./admin.js";
/**
 * Analytics Dashboard Module
 * Handles analytics tracking and dashboard
 */

import { db } from '../firebase.js';
import { collection, getDocs, query, where, orderBy, doc, getDoc, addDoc, setDoc, updateDoc, increment, limit, startAfter } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { state } from '../state.js';
import { showToast, escapeHTML, formatNumber, formatCurrency, formatDate } from '../utils.js';

/**
 * Track analytics event
 * @param {string} eventName - Event name
 * @param {Object} data - Event data
 */
export async function trackEvent(eventName, data = {}) {
  try {
    // Track in Firestore
    await addDoc(collection(db, 'analytics_events'), {
      eventName,
      data,
      userId: state.currentUser?.uid || 'anonymous',
      sessionId: getSessionId(),
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      referrer: document.referrer
    });

    // Also send to external analytics if configured
    if (window.fbq) fbq('track', eventName, data);
    if (window.ttq) {
      const ttEvent = eventName === 'Purchase' ? 'CompletePayment' : eventName;
      ttq.track(ttEvent, data);
    }
  } catch (error) {
    console.error('Analytics tracking error:', error);
  }
}

/**
 * Get or create session ID
 * @returns {string} Session ID
 */
function getSessionId() {
  let sessionId = sessionStorage.getItem('analytics_session_id');
  if (!sessionId) {
    sessionId = 'sess_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    sessionStorage.setItem('analytics_session_id', sessionId);
  }
  return sessionId;
}

/**
 * Initialize analytics dashboard
 */
export async function initAnalyticsDashboard() {
  if (!state.isCurrentUserAdmin) return;

  await loadDashboardStats();
  setupRealtimeUpdates();
}

/**
 * Load dashboard statistics
 */
export async function loadDashboardStats() {
  try {
    // Get orders for stats
    const ordersSnap = await getDocs(query(collection(db, 'orders'), orderBy('orderDate', 'desc'), limit(1000)));
    const orders = ordersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Calculate stats
    const totalOrders = orders.length;
    const completedOrders = orders.filter(o => o.status === 'تم التوصيل ✅').length;
    const pendingOrders = orders.filter(o => o.status === 'قيد المراجعة').length;
    const cancelledOrders = orders.filter(o => o.status.includes('ملغى') || o.status.includes('رفض')).length;

    const totalRevenue = orders
      .filter(o => o.status === 'تم التوصيل ✅')
      .reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);

    const avgOrderValue = completedOrders > 0 ? totalRevenue / completedOrders : 0;

    // Conversion rate (simplified)
    const visitsSnap = await getDoc(doc(db, 'settings', 'stats'));
    const totalVisits = visitsSnap.exists() ? (visitsSnap.data().visits || 1) : 1;
    const conversionRate = totalVisits > 0 ? (completedOrders / totalVisits * 100).toFixed(2) : 0;

    // Top products
    const productSales = {};
    orders.filter(o => o.status === 'تم التوصيل ✅').forEach(o => {
      o.items.forEach(item => {
        if (!productSales[item.id]) productSales[item.id] = { name: item.name, quantity: 0, revenue: 0 };
        productSales[item.id].quantity += item.quantity;
        productSales[item.id].revenue += item.price * item.quantity;
      });
    });

    const topProducts = Object.entries(productSales)
      .sort((a, b) => b[1].quantity - a[1].quantity)
      .slice(0, 5);

    // Revenue by day (last 30 days)
    const revenueByDay = {};
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    orders.filter(o => new Date(o.orderDate) >= thirtyDaysAgo && o.status === 'تم التوصيل ✅').forEach(o => {
      const day = formatDate(o.orderDate, { dateStyle: 'short' });
      if (!revenueByDay[day]) revenueByDay[day] = 0;
      revenueByDay[day] += Number(o.totalAmount || 0);
    });

    // Update UI
    updateStatCard('stat-total-orders', formatNumber(totalOrders));
    updateStatCard('stat-completed-orders', formatNumber(completedOrders));
    updateStatCard('stat-pending-orders', formatNumber(pendingOrders));
    updateStatCard('stat-cancelled-orders', formatNumber(cancelledOrders));
    updateStatCard('stat-total-revenue', formatCurrency(totalRevenue));
    updateStatCard('stat-avg-order-value', formatCurrency(avgOrderValue));
    updateStatCard('stat-conversion-rate', conversionRate + '%');

    // Top products
    renderTopProducts(topProducts);

    // Revenue chart
    renderRevenueChart(revenueByDay);

  } catch (error) {
    console.error('Load dashboard stats error:', error);
  }
}

/**
 * Update stat card
 * @param {string} id - Element ID
 * @param {string} value - Value to display
 */
function updateStatCard(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

/**
 * Render top products
 * @param {Array} topProducts - Top products array
 */
function renderTopProducts(topProducts) {
  const container = document.getElementById('top-products-list');
  if (!container) return;

  let html = '';
  topProducts.forEach(([id, data], index) => {
    html += `
      <div style="display:flex; justify-content:space-between; align-items:center; padding:10px; border-bottom:1px solid var(--border-color);">
        <div>
          <strong style="color:var(--primary);">#${index + 1} ${escapeHTML(data.name)}</strong><br>
          <small style="color:var(--text-muted);">${formatNumber(data.quantity)} وحدة مباعة</small>
        </div>
        <div style="text-align:left;">
          <strong style="color:var(--secondary);">${formatCurrency(data.revenue)}</strong>
        </div>
      </div>
    `;
  });
  container.innerHTML = html || '<p style="text-align:center; color:var(--text-muted);">لا توجد بيانات</p>';
}

/**
 * Render revenue chart (simple canvas)
 * @param {Object} revenueByDay - Revenue by day
 */
function renderRevenueChart(revenueByDay) {
  const canvas = document.getElementById('revenue-chart');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.offsetWidth || 400;
  const height = canvas.height = 200;

  // Clear
  ctx.clearRect(0, 0, width, height);

  // Data
  const days = Object.keys(revenueByDay).sort();
  const values = days.map(d => revenueByDay[d]);
  const maxValue = Math.max(...values, 1);

  // Draw axes
  ctx.strokeStyle = '#ddd';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(50, 10);
  ctx.lineTo(50, height - 30);
  ctx.lineTo(width - 10, height - 30);
  ctx.stroke();

  // Draw line
  ctx.strokeStyle = 'var(--secondary)';
  ctx.lineWidth = 2;
  ctx.beginPath();

  days.forEach((day, i) => {
    const x = 50 + (i / Math.max(days.length - 1, 1)) * (width - 70);
    const y = height - 30 - (values[i] / maxValue) * (height - 50);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  // Draw points
  ctx.fillStyle = 'var(--secondary)';
  days.forEach((day, i) => {
    const x = 50 + (i / Math.max(days.length - 1, 1)) * (width - 70);
    const y = height - 30 - (values[i] / maxValue) * (height - 50);
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
  });

  // Labels
  ctx.fillStyle = '#666';
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'center';
  days.forEach((day, i) => {
    const x = 50 + (i / Math.max(days.length - 1, 1)) * (width - 70);
    ctx.fillText(day, x, height - 10);
  });
}

/**
 * Setup realtime updates
 */
function setupRealtimeUpdates() {
  // Listen for new orders
  onSnapshot(query(collection(db, 'orders'), orderBy('orderDate', 'desc'), limit(100)), (snapshot) => {
    loadDashboardStats();
  });
}

/**
 * Track page view
 * @param {string} pageName - Page name
 */
export function trackPageView(pageName) {
  trackEvent('page_view', { page: pageName });
}

/**
 * Track product view
 * @param {Object} product - Product object
 */
export function trackProductView(product) {
  trackEvent('view_item', {
    item_id: product.id,
    item_name: product.name,
    price: product.price,
    currency: 'EGP',
    category: product.category
  });
}

/**
 * Track add to cart
 * @param {Object} product - Product object
 * @param {number} quantity - Quantity
 */
export function trackAddToCart(product, quantity) {
  trackEvent('add_to_cart', {
    item_id: product.id,
    item_name: product.name,
    price: product.price,
    quantity: quantity,
    currency: 'EGP',
    category: product.category
  });
}

/**
 * Track begin checkout
 * @param {Array} items - Cart items
 * @param {number} value - Total value
 */
export function trackBeginCheckout(items, value) {
  trackEvent('begin_checkout', {
    value: value,
    currency: 'EGP',
    items: items.map(i => ({
      item_id: i.id,
      item_name: i.name,
      price: i.price,
      quantity: i.quantity
    }))
  });
}

/**
 * Track purchase
 * @param {Object} order - Order object
 */
export function trackPurchase(order) {
  trackEvent('purchase', {
    transaction_id: order.id,
    value: order.totalAmount,
    currency: 'EGP',
    shipping: order.shippingCost,
    tax: 0,
    items: order.items.map(i => ({
      item_id: i.id,
      item_name: i.name,
      price: i.price,
      quantity: i.quantity,
      category: i.variant || 'default'
    }))
  });
}

/**
 * Track search
 * @param {string} searchTerm - Search term
 */
export function trackSearch(searchTerm) {
  trackEvent('search', { search_term: searchTerm });
}

/**
 * Get analytics summary for date range
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise<Object>} Analytics summary
 */
export async function getAnalyticsSummary(startDate, endDate) {
  try {
    const { getDocs, query, where } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");

    // Orders in range
    const ordersSnap = await getDocs(query(
      collection(db, 'orders'),
      where('orderDate', '>=', startDate.toISOString()),
      where('orderDate', '<=', endDate.toISOString())
    ));

    const orders = ordersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const completedOrders = orders.filter(o => o.status === 'تم التوصيل ✅');

    const totalRevenue = completedOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
    const totalOrders = completedOrders.length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Unique customers
    const uniqueCustomers = new Set(completedOrders.map(o => o.customerEmail)).size;

    // Top products
    const productSales = {};
    completedOrders.forEach(o => {
      o.items.forEach(item => {
        if (!productSales[item.id]) productSales[item.id] = { name: item.name, quantity: 0, revenue: 0 };
        productSales[item.id].quantity += item.quantity;
        productSales[item.id].revenue += item.price * item.quantity;
      });
    });

    const topProducts = Object.entries(productSales)
      .sort((a, b) => b[1].revenue - a[1].revenue)
      .slice(0, 10);

    return {
      totalRevenue,
      totalOrders,
      avgOrderValue,
      uniqueCustomers,
      topProducts,
      ordersByStatus: {
        completed: orders.filter(o => o.status === 'تم التوصيل ✅').length,
        pending: orders.filter(o => o.status === 'قيد المراجعة').length,
        shipped: orders.filter(o => o.status === 'تم الشحن').length,
        cancelled: orders.filter(o => o.status.includes('ملغى') || o.status.includes('رفض')).length
      }
    };
  } catch (error) {
    console.error('Get analytics summary error:', error);
    return null;
  }
}

// Make functions available globally
if (typeof window !== 'undefined') {
  window.trackEvent = trackEvent;
  window.trackPageView = trackPageView;
  window.trackProductView = trackProductView;
  window.trackAddToCart = trackAddToCart;
  window.trackBeginCheckout = trackBeginCheckout;
  window.trackPurchase = trackPurchase;
  window.trackSearch = trackSearch;
  window.initAnalyticsDashboard = initAnalyticsDashboard;
  window.getAnalyticsSummary = getAnalyticsSummary;
}

export default {
  trackEvent,
  trackPageView,
  trackProductView,
  trackAddToCart,
  trackBeginCheckout,
  trackPurchase,
  trackSearch,
  initAnalyticsDashboard,
  getAnalyticsSummary
};