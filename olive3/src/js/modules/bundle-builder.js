/**
 * Bundle Builder Module
 * Handles custom box/bundle building
 */

import { db } from '../firebase.js';
import { collection, getDocs, doc, getDoc, addDoc, setDoc, updateDoc, query, where, orderBy } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { state } from '../state.js';
import { showToast, escapeHTML, formatCurrency, generateId } from '../utils.js';

/**
 * Initialize bundle builder
 */
export function initBundleBuilder() {
  const container = document.getElementById('bundle-builder-container');
  if (!container) return;

  renderBundleBuilder();
}

/**
 * Render bundle builder UI
 */
export function renderBundleBuilder() {
  const container = document.getElementById('bundle-builder-container');
  if (!container) return;

  // Get available products for bundles
  const bundleProducts = state.products.filter(p => p.category === 'زيت زيتون' && !p.isHidden);

  container.innerHTML = `
    <div style="background:var(--panel-bg); border:1px solid var(--border-color); border-radius:16px; padding:20px;">
      <h3 style="color:var(--primary); margin-top:0;">📦 اصنع صندوقك المخصص</h3>
      <p style="color:var(--text-muted);">اختر المنتجات التي تريدها في صندوقك، وسنحسب السعر تلقائياً</p>

      <div style="display:grid; grid-template-columns: 1fr 350px; gap:20px; margin-top:20px;">
        <div>
          <h4 style="color:var(--primary);">المنتجات المتاحة</h4>
          <div id="bundle-products-grid" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap:15px; margin-top:15px;">
            ${bundleProducts.map(p => `
              <div class="bundle-product-card" data-id="${p.id}" style="background:var(--input-bg); border:2px solid var(--border-color); border-radius:12px; padding:10px; cursor:pointer; transition:0.3s;"
                onclick="window.toggleBundleProduct('${p.id}')">
                <img src="${(p.images && p.images[0]) || p.imageUrl || 'https://via.placeholder.com/150'}" style="width:100%; height:100px; object-fit:cover; border-radius:8px;">
                <h5 style="margin:10px 0 5px; color:var(--primary);">${escapeHTML(p.name)}</h5>
                <div style="color:var(--secondary); font-weight:bold;">${formatCurrency(p.price)}</div>
                <div style="font-size:0.8rem; color:var(--text-muted); margin-top:5px;">الحد الأقصى: ${p.bundleMaxQty || 5}</div>
                <input type="number" class="bundle-qty-input" min="0" max="${p.bundleMaxQty || 5}" value="0" style="width:100%; margin-top:10px; padding:8px; border-radius:8px; border:1px solid var(--border-color);" onchange="window.updateBundleQty('${p.id}', this.value)">
              </div>
            `).join('')}
          </div>
        </div>

        <div id="bundle-summary" style="background:var(--input-bg); border-radius:12px; padding:20px; height:fit-content; position:sticky; top:100px;">
          <h4 style="color:var(--primary); margin-top:0;">📋 ملخص الصندوق</h4>
          <div id="bundle-items-list" style="min-height:100px; margin-bottom:15px;">
            <p style="text-align:center; color:var(--text-muted);">الصندوق فارغ</p>
          </div>
          <div style="border-top:1px solid var(--border-color); padding-top:15px;">
            <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
              <span>عدد المنتجات:</span>
              <strong id="bundle-total-items" style="color:var(--primary);">0</strong>
            </div>
            <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
              <span>إجمالي السعر:</span>
              <strong id="bundle-total-price" style="color:var(--secondary); font-size:1.2rem;">0 ج</strong>
            </div>
            <div style="display:flex; justify-content:space-between; margin-bottom:15px; color:#28a745;">
              <span>خصم الصندوق (10%):</span>
              <strong id="bundle-discount">0 ج</strong>
            </div>
            <div style="display:flex; justify-content:space-between; font-size:1.2rem; font-weight:bold; color:var(--primary);">
              <span>الإجمالي النهائي:</span>
              <span id="bundle-final-price">0 ج</span>
            </div>
          </div>
          <button class="btn" style="width:100%; margin-top:15px; background:#028090;" onclick="window.addBundleToCart()">أضف الصندوق للسلة 🛒</button>
          <button class="btn btn-outline" style="width:100%; margin-top:10px;" onclick="window.saveBundleTemplate()">حفظ كقالب 💾</button>
        </div>
      </div>
    </div>
  `;

  // Initialize bundle state
  window.bundleState = { items: {}, totalItems: 0, totalPrice: 0 };
  updateBundleSummary();
}

/**
 * Toggle product in bundle
 * @param {string} productId - Product ID
 */
export function toggleBundleProduct(productId) {
  const card = document.querySelector(`.bundle-product-card[data-id="${productId}"]`);
  const input = card?.querySelector('.bundle-qty-input');
  if (input) {
    const currentVal = parseInt(input.value) || 0;
    input.value = currentVal > 0 ? 0 : 1;
    updateBundleQty(productId, input.value);
  }
}

/**
 * Update bundle quantity
 * @param {string} productId - Product ID
 * @param {string} qty - Quantity
 */
export function updateBundleQty(productId, qty) {
  const product = state.products.find(p => p.id === productId);
  if (!product) return;

  qty = Math.max(0, Math.min(parseInt(qty) || 0, product.bundleMaxQty || 5));

  if (qty > 0) {
    window.bundleState.items[productId] = { qty, price: product.price, name: product.name };
  } else {
    delete window.bundleState.items[productId];
  }

  updateBundleSummary();
}

/**
 * Update bundle summary display
 */
export function updateBundleSummary() {
  const itemsList = document.getElementById('bundle-items-list');
  const totalItemsEl = document.getElementById('bundle-total-items');
  const totalPriceEl = document.getElementById('bundle-total-price');
  const discountEl = document.getElementById('bundle-discount');
  const finalPriceEl = document.getElementById('bundle-final-price');

  let totalItems = 0;
  let totalPrice = 0;
  let html = '';

  Object.entries(window.bundleState.items || {}).forEach(([id, item]) => {
    totalItems += item.qty;
    totalPrice += item.qty * item.price;
    html += `
      <div style="display:flex; justify-content:space-between; align-items:center; padding:8px 0; border-bottom:1px solid var(--border-color);">
        <div style="display:flex; align-items:center; gap:10px;">
          <span style="color:var(--secondary); font-weight:bold;">×${item.qty}</span>
          <span>${escapeHTML(item.name)}</span>
        </div>
        <span style="color:var(--primary);">${formatCurrency(item.qty * item.price)}</span>
      </div>
    `;
  });

  const discount = Math.round(totalPrice * 0.1); // 10% bundle discount
  const finalPrice = totalPrice - discount;

  if (itemsList) itemsList.innerHTML = html || '<p style="text-align:center; color:var(--text-muted);">الصندوق فارغ</p>';
  if (totalItemsEl) totalItemsEl.textContent = totalItems;
  if (totalPriceEl) totalPriceEl.textContent = formatCurrency(totalPrice);
  if (discountEl) discountEl.textContent = formatCurrency(discount);
  if (finalPriceEl) finalPriceEl.textContent = formatCurrency(finalPrice);

  window.bundleState.totalItems = totalItems;
  window.bundleState.totalPrice = totalPrice;
  window.bundleState.discount = discount;
  window.bundleState.finalPrice = finalPrice;
}

/**
 * Add bundle to cart
 */
export function addBundleToCart() {
  if (window.bundleState.totalItems === 0) {
    showToast('الصندوق فارغ! أضف منتجات أولاً', 'error');
    return;
  }

  Object.entries(window.bundleState.items).forEach(([id, item]) => {
    const product = state.products.find(p => p.id === id);
    if (product) {
      for (let i = 0; i < item.qty; i++) {
        window.addToCart(id, item.name, item.price, product.imageUrl, 'bundle');
      }
    }
  });

  showToast(`تم إضافة ${window.bundleState.totalItems} منتج للسلة بخصم ${formatCurrency(window.bundleState.discount)}!`, 'success');

  // Reset bundle
  window.bundleState.items = {};
  updateBundleSummary();
  document.querySelectorAll('.bundle-qty-input').forEach(input => input.value = 0);
  document.querySelectorAll('.bundle-product-card').forEach(card => card.style.borderColor = 'var(--border-color)');
}

/**
 * Save bundle as template
 */
export async function saveBundleTemplate() {
  if (window.bundleState.totalItems === 0) {
    showToast('الصندوق فارغ!', 'error');
    return;
  }

  const name = prompt('اسم القالب:');
  if (!name) return;

  try {
    await addDoc(collection(db, 'bundle_templates'), {
      name,
      items: window.bundleState.items,
      totalItems: window.bundleState.totalItems,
      totalPrice: window.bundleState.totalPrice,
      discount: window.bundleState.discount,
      finalPrice: window.bundleState.finalPrice,
      createdBy: state.currentUser?.uid,
      createdAt: new Date().toISOString(),
      isActive: true
    });
    showToast('تم حفظ القالب!', 'success');
  } catch (e) {
    showToast('فشل الحفظ', 'error');
  }
}

/**
 * Load bundle templates
 */
export async function loadBundleTemplates() {
  const container = document.getElementById('bundle-templates-list');
  if (!container) return;

  try {
    const { getDocs, query, where } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");
    const q = query(collection(db, 'bundle_templates'), where('isActive', '==', true), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    let html = '';
    snapshot.forEach(doc => {
      const t = doc.data();
      html += `
        <div class="bundle-template-card" onclick="window.loadBundleTemplate('${doc.id}')" style="background:var(--input-bg); border:1px solid var(--border-color); border-radius:12px; padding:15px; margin-bottom:10px; cursor:pointer;">
          <strong style="color:var(--primary);">${escapeHTML(t.name)}</strong><br>
          <small>${t.totalItems} منتج • ${formatCurrency(t.finalPrice)} (خصم ${formatCurrency(t.discount)})</small>
        </div>
      `;
    });
    container.innerHTML = html || '<p style="text-align:center; color:var(--text-muted);">لا توجد قوالب محفوظة</p>';
  } catch (e) {
    console.error('Load templates error:', e);
  }
}

/**
 * Load bundle template
 * @param {string} templateId - Template ID
 */
export async function loadBundleTemplate(templateId) {
  try {
    const { doc, getDoc } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");
    const templateDoc = await getDoc(doc(db, 'bundle_templates', templateId));
    if (!templateDoc.exists()) return;

    const template = templateDoc.data();
    window.bundleState.items = { ...template.items };
    updateBundleSummary();

    // Update UI inputs
    Object.entries(template.items).forEach(([id, item]) => {
      const input = document.querySelector(`.bundle-product-card[data-id="${id}"] .bundle-qty-input`);
      if (input) input.value = item.qty;
    });

    showToast(`تم تحميل قالب "${template.name}"`, 'success');
  } catch (e) {
    showToast('فشل التحميل', 'error');
  }
}

// Make functions available globally
if (typeof window !== 'undefined') {
  window.initBundleBuilder = initBundleBuilder;
  window.renderBundleBuilder = renderBundleBuilder;
  window.toggleBundleProduct = toggleBundleProduct;
  window.updateBundleQty = updateBundleQty;
  window.updateBundleSummary = updateBundleSummary;
  window.addBundleToCart = addBundleToCart;
  window.saveBundleTemplate = saveBundleTemplate;
  window.loadBundleTemplates = loadBundleTemplates;
  window.loadBundleTemplate = loadBundleTemplate;
}

export default {
  initBundleBuilder,
  renderBundleBuilder,
  toggleBundleProduct,
  updateBundleQty,
  updateBundleSummary,
  addBundleToCart,
  saveBundleTemplate,
  loadBundleTemplates,
  loadBundleTemplate
};