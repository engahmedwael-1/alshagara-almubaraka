/**
 * Advanced Coupons Module
 * Handles advanced coupon functionality
 */

import { db } from '../firebase.js';
import { collection, getDocs, query, where, doc, getDoc, addDoc, updateDoc, deleteDoc, increment, arrayUnion } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { state } from '../state.js';
import { showToast, escapeHTML, formatCurrency } from '../utils.js';

/**
 * Execute promo logic with advanced validation
 * @param {string} inputCode - Promo code
 * @param {string} source - Source (cart/checkout)
 */
export async function executePromoLogic(inputCode, source) {
  const code = inputCode.trim().toUpperCase();
  let promo = state.promoCodesList.find(p => p.code === code);

  // Check abandoned cart code
  const abCode = String(state.storeSettings.abandonedCartCode || 'COMEBACK').trim().toUpperCase();
  const abDisc = Number(state.storeSettings.abandonedCartDiscount) || 3;
  if (!promo && code === abCode) {
    promo = { code: abCode, discount: abDisc, singleUse: false };
  }

  // Check group buy code
  if (!promo && code === 'GROUP7' && state.storeSettings.enableGroupBuy !== false) {
    promo = { code: 'GROUP7', discount: 7, singleUse: false };
  }

  // Check preorder code
  if (!promo && code === 'EARLY10' && state.storeSettings.enablePreorderHarvest !== false) {
    promo = { code: 'EARLY10', discount: 10, singleUse: false };
  }

  if (!promo) {
    applyPromoResult(null, source, 'كود غير صالح');
    return;
  }

  // Validate promo
  const validation = validatePromo(promo);
  if (!validation.valid) {
    applyPromoResult(null, source, validation.message);
    return;
  }

  // Check minimum order amount
  if (promo.minOrderAmount && state.currentSubtotal < promo.minOrderAmount) {
    applyPromoResult(null, source, `الحد الأدنى للطلب ${formatCurrency(promo.minOrderAmount)}`);
    return;
  }

  // Check max discount
  let discountVal = Math.round(state.currentSubtotal * (promo.discount / 100));
  if (promo.maxDiscountAmount && discountVal > promo.maxDiscountAmount) {
    discountVal = promo.maxDiscountAmount;
  }

  // Check applicable categories/products
  if (promo.applicableCategories?.length || promo.applicableProducts?.length) {
    const hasApplicable = state.cart.some(item => {
      const product = state.products.find(p => p.id === item.id);
      if (!product) return false;
      if (promo.applicableCategories?.includes(product.category)) return true;
      if (promo.applicableProducts?.includes(product.id)) return true;
      return false;
    });
    if (!hasApplicable) {
      applyPromoResult(null, source, 'هذا الكوبون لا ينطبق على منتجات السلة الحالية');
      return;
    }
  }

  // Check expiry
  if (promo.validUntil && new Date(promo.validUntil) < new Date()) {
    applyPromoResult(null, source, 'انتهت صلاحية الكوبون');
    return;
  }

  if (promo.validFrom && new Date(promo.validFrom) > new Date()) {
    applyPromoResult(null, source, 'الكوبون غير فعال بعد');
    return;
  }

  // Apply promo
  state.currentDiscountPercent = promo.discount;
  state.appliedPromoCode = promo.code;

  // Track usage if single use
  if (promo.singleUse && promo.id) {
    try {
      await updateDoc(doc(db, 'promoCodes', promo.id), {
        usageCount: increment(1),
        usedBy: arrayUnion(state.currentUser?.uid || 'guest')
      });
    } catch (e) {}
  }

  applyPromoResult(promo, source, null);
}

/**
 * Validate promo code
 * @param {Object} promo - Promo object
 * @returns {Object} Validation result
 */
function validatePromo(promo) {
  if (promo.singleUse && promo.used) {
    return { valid: false, message: 'هذا الكود مخصص لاستخدام مرة واحدة فقط وتم استخدامه مسبقاً!' };
  }

  if (promo.usageLimit && promo.usageCount >= promo.usageLimit) {
    return { valid: false, message: 'انتهت استخدامات هذا الكوبون' };
  }

  if (promo.userLimit && promo.usedBy?.includes(state.currentUser?.uid)) {
    return { valid: false, message: 'لقد استخدمت هذا الكوبون من قبل' };
  }

  return { valid: true };
}

/**
 * Apply promo result to UI
 * @param {Object|null} promo - Promo object or null
 * @param {string} source - Source
 * @param {string|null} error - Error message
 */
function applyPromoResult(promo, source, error) {
  const isCart = source === 'cart';
  const pMsg = isCart ? document.getElementById('promo-msg-cart') : document.getElementById('promo-msg');
  const pInput = isCart ? document.getElementById('promo-code-input-cart') : document.getElementById('promo-code-input');

  if (error) {
    state.currentDiscountPercent = 0;
    state.appliedPromoCode = "";
    if (pMsg) { pMsg.textContent = `❌ ${error}`; pMsg.style.color = 'var(--danger)'; }
    if (window.updateInvoiceUI) window.updateInvoiceUI();
    showToast(error, 'error');
  } else {
    if (pMsg) { pMsg.textContent = `✅ تم تفعيل خصم ${promo.discount}%`; pMsg.style.color = '#2a9d8f'; }
    if (pInput) pInput.value = promo.code;
    if (window.updateInvoiceUI) window.updateInvoiceUI();
    showToast('تم التفعيل', 'success');
  }
}

/**
 * Load promo codes
 */
export async function loadPromoCodes() {
  try {
    const snapshot = await getDocs(collection(db, 'promoCodes'));
    state.promoCodesList = [];
    let html = '';
    snapshot.forEach(doc => {
      const data = doc.data();
      data.id = doc.id;
      state.promoCodesList.push(data);
      html += `<div style="background:var(--input-bg); padding:10px; border:1px solid var(--border-color); border-radius:8px; display:flex; justify-content:space-between; margin-bottom:5px;"><span><strong>${data.code}</strong> (${data.discount}%)${data.singleUse ? ' <span style="color:var(--danger); font-size:0.75rem;">(استخدام واحد)</span>' : ''}${data.minOrderAmount ? ` <span style="color:var(--primary); font-size:0.75rem;">حد أدنى: ${formatCurrency(data.minOrderAmount)}</span>` : ''}</span><button type="button" class="btn-danger" style="border:none; padding:4px 8px; border-radius:4px; cursor:pointer;" onclick="window.removePromo('${data.id}')">حذف</button></div>`;
    });
    const listEl = document.getElementById('admin-promos-list');
    if (listEl) listEl.innerHTML = html;
  } catch (e) {
    console.error('Load promos error:', e);
  }
}

/**
 * Add promo code
 */
export async function addPromoCode() {
  const code = document.getElementById('new-promo-code').value.trim().toUpperCase();
  const discount = parseInt(document.getElementById('new-promo-discount').value);
  const singleUse = document.getElementById('promo-single-use')?.checked || false;
  const minOrder = parseFloat(document.getElementById('promo-min-order')?.value) || 0;
  const maxDiscount = parseFloat(document.getElementById('promo-max-discount')?.value) || 0;
  const usageLimit = parseInt(document.getElementById('promo-usage-limit')?.value) || 0;
  const validFrom = document.getElementById('promo-valid-from')?.value || '';
  const validUntil = document.getElementById('promo-valid-until')?.value || '';
  const applicableCategories = (document.getElementById('promo-categories')?.value || '').split(',').map(s => s.trim()).filter(Boolean);
  const applicableProducts = (document.getElementById('promo-products')?.value || '').split(',').map(s => s.trim()).filter(Boolean);

  if (code && discount > 0 && discount <= 100) {
    try {
      await addDoc(collection(db, 'promoCodes'), {
        code, discount, singleUse,
        minOrderAmount: minOrder || null,
        maxDiscountAmount: maxDiscount || null,
        usageLimit: usageLimit || null,
        usageCount: 0,
        usedBy: [],
        validFrom: validFrom || null,
        validUntil: validUntil || null,
        applicableCategories: applicableCategories.length ? applicableCategories : null,
        applicableProducts: applicableProducts.length ? applicableProducts : null,
        createdAt: new Date().toISOString()
      });
      document.getElementById('new-promo-code').value = '';
      document.getElementById('new-promo-discount').value = '';
      showToast('تمت الإضافة', 'success');
      loadPromoCodes();
    } catch (e) {
      showToast('فشل الإضافة', 'error');
    }
  }
}

/**
 * Remove promo code
 * @param {string} id - Promo ID
 */
export async function removePromo(id) {
  if (confirm('حذف الكوبون؟')) {
    try {
      await deleteDoc(doc(db, 'promoCodes', id));
      showToast('تم الحذف', 'success');
      loadPromoCodes();
    } catch (e) {
      showToast('فشل الحذف', 'error');
    }
  }
}

// Make functions available globally
if (typeof window !== 'undefined') {
  window.executePromoLogic = executePromoLogic;
  window.applyPromoCode = (inputCode, source) => executePromoLogic(inputCode, source);
  window.applyPromoCodeCart = () => executePromoLogic(document.getElementById('promo-code-input-cart').value.trim().toUpperCase(), 'cart');
  window.loadPromoCodes = loadPromoCodes;
  window.addPromoCode = addPromoCode;
  window.removePromo = removePromo;
}

export default {
  executePromoLogic,
  loadPromoCodes,
  addPromoCode,
  removePromo
};