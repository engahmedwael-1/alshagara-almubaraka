/**
 * Cart Module
 * Handles cart operations, saved for later, wishlist, checkout
 */

import { db } from '../firebase.js';
import { doc, updateDoc, setDoc, getDoc, increment, arrayUnion } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { state } from '../state.js';
import { escapeHTML, showToast } from '../utils.js';

/**
 * Toggle cart item selection
 * @param {string} cartItemId - Cart item ID
 * @param {boolean} isChecked - Whether checked
 */
export function toggleCartItemSelection(cartItemId, isChecked) {
  const item = state.cart.find(i => i.cartItemId === cartItemId);
  if (item) {
    item.selected = isChecked;
    localStorage.setItem('cart', JSON.stringify(state.cart));
    updateCartUI();
  }
}

/**
 * Save item for later
 * @param {string} cartItemId - Cart item ID
 */
export function saveForLater(cartItemId) {
  const itemIndex = state.cart.findIndex(i => i.cartItemId === cartItemId);
  if (itemIndex > -1) {
    const item = state.cart[itemIndex];
    state.cart.splice(itemIndex, 1);
    state.savedForLater.push(item);
    localStorage.setItem('cart', JSON.stringify(state.cart));
    localStorage.setItem('savedForLater', JSON.stringify(state.savedForLater));
    updateCartUI();
    showToast(state.currentLang === 'ar' ? 'تم الحفظ لوقت لاحق' : 'Saved for later', 'success');
  }
}

/**
 * Move item from saved for later to cart
 * @param {string} cartItemId - Cart item ID
 */
export function moveToCart(cartItemId) {
  const itemIndex = state.savedForLater.findIndex(i => i.cartItemId === cartItemId);
  if (itemIndex > -1) {
    const item = state.savedForLater[itemIndex];
    state.savedForLater.splice(itemIndex, 1);
    item.selected = true;
    state.cart.push(item);
    localStorage.setItem('cart', JSON.stringify(state.cart));
    localStorage.setItem('savedForLater', JSON.stringify(state.savedForLater));
    updateCartUI();
    showToast(state.currentLang === 'ar' ? 'تم النقل للسلة' : 'Moved to cart', 'success');
  }
}

/**
 * Update cart item custom note
 * @param {string} cartItemId - Cart item ID
 * @param {string} note - Custom note
 */
export function updateCartItemCustomNote(cartItemId, note) {
  const item = state.cart.find(i => i.cartItemId === cartItemId);
  if (item) {
    item.customNote = note;
    localStorage.setItem('cart', JSON.stringify(state.cart));
  }
}

/**
 * Sync cart to cloud (Firestore)
 */
export async function syncCartToCloud() {
  if (state.currentUser) {
    try {
      await setDoc(doc(db, 'users', state.currentUser.uid), {
        cart: state.cart,
        savedForLater: state.savedForLater,
        cartUpdatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (e) {
      console.error("Sync error", e);
    }
  }
}

/**
 * Remove discount (promo code or loyalty points)
 */
export async function removeDiscount() {
  if (state.loyaltyPointsUsedTemp > 0 && state.currentUser) {
    try {
      await updateDoc(doc(db, 'users', state.currentUser.uid), {
        loyaltyPoints: increment(state.loyaltyPointsUsedTemp),
        unreadNotifs: increment(1),
        notifications: arrayUnion({
          title: 'إلغاء الخصم 🔄',
          message: `تم استرجاع ${state.loyaltyPointsUsedTemp} نقطة لإلغائك الخصم من السلة.`,
          date: new Date().toISOString()
        })
      });
      showToast('تم إلغاء الخصم واسترجاع النقاط', 'info');
    } catch (e) {}
  } else if (state.currentDiscountPercent > 0) {
    showToast('تم إلغاء الكوبون', 'info');
  }

  state.loyaltyDiscountFixed = 0;
  state.loyaltyPointsUsedTemp = 0;
  state.currentDiscountPercent = 0;
  state.appliedPromoCode = "";

  const pInput1 = document.getElementById('promo-code-input-cart');
  if (pInput1) pInput1.value = '';
  const pInput2 = document.getElementById('promo-code-input');
  if (pInput2) pInput2.value = '';
  const pMsg1 = document.getElementById('promo-msg-cart');
  if (pMsg1) pMsg1.textContent = '';
  const pMsg2 = document.getElementById('promo-msg');
  if (pMsg2) pMsg2.textContent = '';

  updateInvoiceUI();
}

/**
 * Go to checkout
 */
export function goToCheckout() {
  const selectedItems = state.cart.filter(item => item.selected !== false);
  if (selectedItems.length === 0) {
    showToast(state.currentLang === 'ar' ? 'قم بتحديد منتج واحد على الأقل للمتابعة!' : 'Select at least one item to proceed!', 'error');
    return;
  }
  if (window.showPanel) window.showPanel('checkout');
}

/**
 * Process order (checkout)
 * @param {string} method - Payment method
 */
export async function processOrder(method) {
  try {
    const form = document.getElementById('checkout-form');
    if (form && !form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const latEl = document.getElementById('order-lat');
    const lngEl = document.getElementById('order-lng');
    const lat = latEl ? latEl.value : 0;
    const lng = lngEl ? lngEl.value : 0;

    if (!lat || !lng || lat == 0) {
      const mw = document.getElementById('map-warning');
      if (mw) mw.style.display = 'block';
      const mm = document.getElementById('map');
      if (mm) window.scrollTo({ top: mm.offsetTop - 100, behavior: 'smooth' });
      showToast('حدد موقعك على الخريطة', 'error');
      return;
    }

    const nameEl = document.getElementById('order-name');
    const phone1El = document.getElementById('order-phone1');
    const phone2El = document.getElementById('order-phone2');
    const govEl = document.getElementById('order-gov');
    const cityEl = document.getElementById('order-city');
    const mapAddrEl = document.getElementById('order-map-address');
    const addrEl = document.getElementById('order-address');
    const payEl = document.getElementById('order-payment-method');

    const name = nameEl ? nameEl.value : "عميل";
    const phone1 = phone1El ? phone1El.value : "";
    const phone2 = phone2El ? phone2El.value : "لا يوجد";
    const gov = govEl ? govEl.value : "";
    const city = cityEl ? cityEl.value : "";
    const mapAddress = mapAddrEl ? mapAddrEl.value : "";
    const addressDetails = addrEl ? addrEl.value : "";
    const payMethod = payEl ? payEl.value : "كاش";

    let bundleDiscVal = window.getBundleDiscountAmount ? window.getBundleDiscountAmount() : 0;
    let discountVal = Math.round(state.currentSubtotal * (state.currentDiscountPercent / 100)) + bundleDiscVal + state.loyaltyDiscountFixed;
    let enableFreeShip = state.storeSettings.enableFreeShipping !== false;
    let targetAmount = (state.storeSettings && state.storeSettings.freeShippingThreshold) ? Number(state.storeSettings.freeShippingThreshold) : 1000;
    if (gov && window.getShippingCostForGov) state.currentShippingCost = window.getShippingCostForGov(gov);
    let finalShippingCost = (enableFreeShip && state.currentSubtotal >= targetAmount) ? 0 : state.currentShippingCost;
    let finalTotal = (state.currentSubtotal - discountVal) + finalShippingCost;
    if (finalTotal < 0) finalTotal = 0;
    const mapLink = `https://www.google.com/maps?q=${lat},${lng}`;

    let receiptUrl = "";
    const selectedItems = state.cart.filter(item => item.selected !== false);
    if (selectedItems.length === 0) {
      showToast(state.currentLang === 'ar' ? 'قم بتحديد منتج واحد على الأقل' : 'Select at least one item', 'error');
      return;
    }

    if (payMethod === 'محفظة إلكترونية') {
      const fileInput = document.getElementById('order-receipt-file');
      if (!fileInput || fileInput.files.length === 0) {
        showToast('يرجى إرفاق صورة إيصال التحويل لتأكيد الطلب!', 'error');
        return;
      }
      let statusLabel = document.getElementById('receipt-upload-status');
      if (statusLabel) statusLabel.style.display = 'block';
      document.querySelectorAll('.checkout-submit-btn').forEach(b => b.disabled = true);
      try {
        const formData = new FormData();
        formData.append('image', fileInput.files[0]);
        const res = await fetch(`https://api.cloudinary.com/v1_1/${state.storeSettings.cloudinaryCloudName || 'demo'}/image/upload`, {
          method: 'POST',
          body: formData
        });
        const data = await res.json();
        if (data.success) {
          receiptUrl = data.secure_url;
        } else {
          throw new Error('فشل رفع الإيصال');
        }
      } catch (err) {
        if (statusLabel) statusLabel.style.display = 'none';
        document.querySelectorAll('.checkout-submit-btn').forEach(b => b.disabled = false);
        showToast('فشل رفع صورة الإيصال، حاول مرة أخرى.', 'error');
        return;
      }
      if (statusLabel) statusLabel.style.display = 'none';
    }

    document.querySelectorAll('.checkout-submit-btn').forEach(b => b.disabled = true);

    let waBtnInfo = state.storeSettings.floatingButtons ? state.storeSettings.floatingButtons.find(b => b.icon === '📱' || b.link.includes('wa.me')) : null;
    let pureWa = waBtnInfo ? waBtnInfo.link.split('/').pop() : "201018631768";
    if (pureWa && !pureWa.startsWith('20') && pureWa.length === 10) pureWa = '20' + pureWa;
    let custEmail = state.currentUser ? (state.currentUser.email || state.currentUser.phoneNumber) : "غير مسجل";

    const orderPayload = {
      usedLoyaltyPoints: state.loyaltyPointsUsedTemp || 0,
      userId: state.currentUser ? state.currentUser.uid : "",
      customerEmail: custEmail || "",
      customerName: name || "",
      phones: { primary: phone1 || "", secondary: phone2 || "" },
      location: {
        governorate: gov || "",
        city: city || "",
        mapAddress: mapAddress || "",
        details: addressDetails || "",
        lat: lat || 0,
        lng: lng || 0,
        mapLink: mapLink || ""
      },
      items: selectedItems,
      subtotal: state.currentSubtotal || 0,
      discount: discountVal || 0,
      promoCode: state.appliedPromoCode || "",
      shippingCost: finalShippingCost || 0,
      totalAmount: finalTotal || 0,
      orderMethod: method || "",
      trafficSource: window.getDetectedTrafficSource ? window.getDetectedTrafficSource() : 'مباشر (Direct)',
      freeGiftUnlocked: window.getUnlockedFreeGiftName ? window.getUnlockedFreeGiftName() : '',
      deliveryTimeSlot: (state.storeSettings.enableDeliverySlot !== false && document.getElementById('order-delivery-slot')) ? document.getElementById('order-delivery-slot').value : '',
      giftWrapInfo: (state.storeSettings.enableGiftWrap !== false && document.getElementById('order-gift-wrap-cb') && document.getElementById('order-gift-wrap-cb').checked) ? (document.getElementById('order-gift-wrap-msg').value.trim() || 'تغليف كهدية فاخرة 🎀') : '',
      paymentMethod: payMethod || "",
      receiptUrl: receiptUrl || "",
      status: "قيد المراجعة",
      orderDate: new Date().toISOString()
    };

    const { addDoc, collection } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");
    const orderRef = await addDoc(collection(db, 'orders'), orderPayload);

    if (state.appliedPromoCode) {
      let usedPromoObj = state.promoCodesList.find(p => p.code === String(state.appliedPromoCode).split(' ')[0].trim());
      if (usedPromoObj && usedPromoObj.id && usedPromoObj.singleUse) {
        try { await deleteDoc(doc(db, 'promoCodes', usedPromoObj.id)); } catch (e) {}
      }
    }

    if (state.currentUser) {
      await setDoc(doc(db, 'users', state.currentUser.uid), {
        name: name || "",
        phone1: phone1 || "",
        phone2: phone2 || "",
        gov: gov || "",
        city: city || "",
        address: addressDetails || ""
      }, { merge: true });
    }

    if (window.trackEvent) {
      window.trackEvent('Purchase', { value: finalTotal, currency: 'EGP', content_type: 'product_group' });
    }

    // Update product stock
    selectedItems.forEach(item => {
      const prod = state.products.find(p => p.id === item.id);
      if (prod && prod.stock !== undefined && prod.stock !== "") {
        updateDoc(doc(db, 'products', item.id), { stock: increment(-item.quantity) }).catch(e => {});
      }
    });

    // Notify admins
    try {
      let orderNotif = {
        title: 'طلب جديد 🛒',
        message: `طلب جديد من ${name} بقيمة ${finalTotal} ج`,
        date: new Date().toISOString(),
        orderId: orderRef.id
      };
      const { getDocs, query, where } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");
      const { SUPER_ADMINS } = await import('../firebase.js');

      for (const adminEmail of SUPER_ADMINS) {
        let qSnap = await getDocs(query(collection(db, 'users'), where('email', '==', adminEmail)));
        qSnap.forEach(async (uDoc) => {
          await updateDoc(doc(db, 'users', uDoc.id), { unreadNotifs: increment(1), notifications: arrayUnion(orderNotif) });
        });
      }
      for (const adminEmail of state.dynamicAdmins) {
        let qSnap = await getDocs(query(collection(db, 'users'), where('email', '==', adminEmail)));
        qSnap.forEach(async (uDoc) => {
          await updateDoc(doc(db, 'users', uDoc.id), { unreadNotifs: increment(1), notifications: arrayUnion(orderNotif) });
        });
      }
    } catch (e) {}

    if (method === 'عبر واتساب') {
      let msg = `*طلب جديد* 🌿\n\n👤 ${name}\n📞 ${phone1}\n📍 ${gov} - ${city}\n🗺️ الخريطة: ${mapAddress}\n🏠 التفاصيل: ${addressDetails}\n💳 الدفع: ${payMethod}\n🔗 ${mapLink}\n`;
      if (receiptUrl) msg += `\n🧾 *إيصال التحويل:* ${receiptUrl}\n`;
      msg += `\n🛍️ *المنتجات:*\n`;
      selectedItems.forEach(item => { msg += `- ${item.name} (${item.quantity}) بـ ${item.price * item.quantity} ج\n`; });
      msg += `\n💰 *الإجمالي المطلوب:* ${finalTotal} ج (شامل التوصيل)\n\n(أرجو التأكيد)`;
      window.open(`https://wa.me/${pureWa}?text=${encodeURIComponent(msg)}`, '_blank');
    } else {
      showToast('تم تأكيد طلبك بنجاح!', 'success');
    }

    // Clear selected items from cart
    state.cart = state.cart.filter(item => item.selected === false);
    localStorage.setItem('cart', JSON.stringify(state.cart));
    localStorage.removeItem('cart_last_updated');

    state.loyaltyDiscountFixed = 0;
    state.loyaltyPointsUsedTemp = 0;
    updateCartUI();

    const pci = document.getElementById('promo-code-input');
    if (pci) pci.value = '';
    state.currentDiscountPercent = 0;
    state.appliedPromoCode = '';
    const dr = document.getElementById('discount-row');
    if (dr) dr.style.display = 'none';
    const orf = document.getElementById('order-receipt-file');
    if (orf) orf.value = '';
    document.querySelectorAll('.checkout-submit-btn').forEach(b => b.disabled = false);
    if (window.showPanel) window.showPanel('customer-orders');

  } catch (error) {
    console.error("Order Process Error: ", error);
    showToast('حدث خطأ في الاتصال بقاعدة البيانات. حاول مجدداً.', 'error');
    document.querySelectorAll('.checkout-submit-btn').forEach(b => b.disabled = false);
  }
}

/**
 * Buy now (direct checkout)
 */
export function executeBuyNow() {
  const id = state.activeProductForReview;
  const product = state.products.find(p => p.id === id);
  if (!product) return;

  let safeName = product.name.replace(/'/g, "\\'");
  let priceToUse = product.price;
  let finalName = safeName;
  let variantSuffix = "";
  let img = (product.images && product.images.length > 0) ? product.images[0] : (product.imageUrl || 'https://via.placeholder.com/300');

  if (state.activeVariantForCart) {
    priceToUse = state.activeVariantForCart.price;
    finalName = `${safeName} (${state.activeVariantForCart.name})`;
    variantSuffix = state.activeVariantForCart.name;
  }

  let cartItemId = variantSuffix ? `${id}_${variantSuffix}` : id;
  let existingItem = state.cart.find(item => item.cartItemId === cartItemId);
  if (!existingItem) {
    state.cart.push({ id: id, cartItemId: cartItemId, name: finalName, price: Number(priceToUse), imageUrl: img, quantity: 1, variant: variantSuffix, selected: true });
  } else {
    existingItem.selected = true;
  }
  localStorage.setItem('cart', JSON.stringify(state.cart));
  updateCartUI();
  if (window.closeProductModal) window.closeProductModal();
  if (window.showPanel) window.showPanel('checkout');
  updateInvoiceUI();
}

// Make functions available globally
if (typeof window !== 'undefined') {
  window.toggleCartItemSelection = toggleCartItemSelection;
  window.saveForLater = saveForLater;
  window.moveToCart = moveToCart;
  window.updateCartItemCustomNote = updateCartItemCustomNote;
  window.syncCartToCloud = syncCartToCloud;
  window.removeDiscount = removeDiscount;
  window.goToCheckout = goToCheckout;
  window.processOrder = processOrder;
  window.executeBuyNow = executeBuyNow;
}

export default {
  toggleCartItemSelection,
  saveForLater,
  moveToCart,
  updateCartItemCustomNote,
  syncCartToCloud,
  removeDiscount,
  goToCheckout,
  processOrder,
  executeBuyNow
};