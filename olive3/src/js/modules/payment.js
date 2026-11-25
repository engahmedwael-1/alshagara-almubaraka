import { getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
function require(...args) { if (typeof window !== 'undefined' && typeof window['require'] === 'function' && window['require'] !== require) return window['require'](...args); }
function Stripe(...args) { if (typeof window !== 'undefined' && typeof window['Stripe'] === 'function' && window['Stripe'] !== Stripe) return window['Stripe'](...args); }
/**
 * Payment Module
 * Handles payment integration with Paymob/Fawry/Stripe
 */

import { state } from '../state.js';
import { showToast, escapeHTML } from '../utils.js';

/**
 * Payment configuration
 */
const PAYMENT_CONFIG = {
  paymob: {
    apiKey: state.storeSettings?.paymobApiKey || '',
    integrationId: state.storeSettings?.paymobIntegrationId || '',
    iframeId: state.storeSettings?.paymobIframeId || '',
    hmacSecret: state.storeSettings?.paymobHmacSecret || ''
  },
  fawry: {
    merchantCode: state.storeSettings?.fawryMerchantCode || '',
    merchantRefNum: state.storeSettings?.fawryMerchantRefNum || '',
    secureKey: state.storeSettings?.fawrySecureKey || ''
  },
  stripe: {
    publishableKey: state.storeSettings?.stripePublishableKey || '',
    secretKey: state.storeSettings?.stripeSecretKey || ''
  }
};

/**
 * Initialize payment methods in checkout
 */
export function initPaymentMethods() {
  const payMethodSelect = document.getElementById('order-payment-method');
  if (!payMethodSelect) return;

  // Add event listener for payment method change
  payMethodSelect.addEventListener('change', (e) => {
    const method = e.target.value;
    const walletInfo = document.getElementById('wallet-info');
    const cardInfo = document.getElementById('card-info');
    const paymobInfo = document.getElementById('paymob-info');
    const fawryInfo = document.getElementById('fawry-info');

    // Hide all payment info sections
    [walletInfo, cardInfo, paymobInfo, fawryInfo].forEach(el => {
      if (el) el.style.display = 'none';
    });

    // Show relevant section
    if (method === 'محفظة إلكترونية' && walletInfo) walletInfo.style.display = 'block';
    if (method === 'بطاقة ائتمان' && cardInfo) cardInfo.style.display = 'block';
    if (method === 'Paymob' && paymobInfo) paymobInfo.style.display = 'block';
    if (method === 'فوري' && fawryInfo) fawryInfo.style.display = 'block';
  });
}

/**
 * Process Paymob payment
 * @param {Object} orderData - Order data
 * @returns {Promise<string>} Payment URL
 */
export async function processPaymobPayment(orderData) {
  try {
    // Step 1: Get auth token
    const authResponse = await fetch('https://accept.paymob.com/api/auth/tokens', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: PAYMENT_CONFIG.paymob.apiKey })
    });
    const authData = await authResponse.json();
    const token = authData.token;

    // Step 2: Create order
    const orderResponse = await fetch('https://accept.paymob.com/api/ecommerce/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        auth_token: token,
        delivery_needed: 'true',
        amount_cents: Math.round(orderData.totalAmount * 100),
        currency: 'EGP',
        items: orderData.items.map(item => ({
          name: item.name,
          amount_cents: Math.round(item.price * 100),
          description: item.name,
          quantity: item.quantity
        })),
        shipping_data: {
          first_name: orderData.customerName.split(' ')[0],
          last_name: orderData.customerName.split(' ').slice(1).join(' ') || '.',
          email: orderData.customerEmail || 'customer@example.com',
          phone_number: orderData.phones.primary,
          city: orderData.location.city,
          country: 'EG',
          state: orderData.location.governorate,
          street: orderData.location.details,
          building: 'N/A',
          floor: 'N/A',
          apartment: 'N/A',
          postal_code: '00000'
        }
      })
    });
    const orderResult = await orderResponse.json();
    const paymobOrderId = orderResult.id;

    // Step 3: Get payment key
    const paymentKeyResponse = await fetch('https://accept.paymob.com/api/acceptance/payment_keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        auth_token: token,
        amount_cents: Math.round(orderData.totalAmount * 100),
        expiration: 3600,
        order_id: paymobOrderId,
        billing_data: {
          first_name: orderData.customerName.split(' ')[0],
          last_name: orderData.customerName.split(' ').slice(1).join(' ') || '.',
          email: orderData.customerEmail || 'customer@example.com',
          phone_number: orderData.phones.primary,
          city: orderData.location.city,
          country: 'EG',
          state: orderData.location.governorate,
          street: orderData.location.details,
          building: 'N/A',
          floor: 'N/A',
          apartment: 'N/A',
          postal_code: '00000'
        },
        currency: 'EGP',
        integration_id: PAYMENT_CONFIG.paymob.integrationId
      })
    });
    const paymentKeyData = await paymentKeyResponse.json();
    const paymentToken = paymentKeyData.token;

    // Step 4: Redirect to iframe
    const iframeUrl = `https://accept.paymob.com/api/acceptance/iframes/${PAYMENT_CONFIG.paymob.iframeId}?payment_token=${paymentToken}`;

    return iframeUrl;
  } catch (error) {
    console.error('Paymob payment error:', error);
    throw new Error('فشل في إنشاء رابط الدفع');
  }
}

/**
 * Process Fawry payment
 * @param {Object} orderData - Order data
 * @returns {Promise<Object>} Payment reference
 */
export async function processFawryPayment(orderData) {
  try {
    const chargeRequest = {
      merchantCode: PAYMENT_CONFIG.fawry.merchantCode,
      merchantRefNum: PAYMENT_CONFIG.fawry.merchantRefNum + '_' + Date.now(),
      customerName: orderData.customerName,
      customerMobile: orderData.phones.primary,
      customerEmail: orderData.customerEmail || 'customer@example.com',
      paymentAmount: orderData.totalAmount,
      chargeItems: orderData.items.map(item => ({
        itemId: item.id,
        description: item.name,
        price: item.price,
        quantity: item.quantity
      })),
      orderExpiry: Math.floor(Date.now() / 1000) + 3600, // 1 hour
      returnUrl: `${window.location.origin}/payment-success.html`,
      cancelUrl: `${window.location.origin}/payment-cancel.html`
    };

    // Generate signature
    const signatureString = `${chargeRequest.merchantCode}${chargeRequest.merchantRefNum}${chargeRequest.customerName}${chargeRequest.paymentAmount}${PAYMENT_CONFIG.fawry.secureKey}`;
    const crypto = await import('crypto');
    const signature = crypto.createHash('sha256').update(signatureString).digest('hex');

    const response = await fetch('https://atfawry.fawrystaging.com/ECommerceWeb/Fawry/payment/charge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...chargeRequest, signature })
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Fawry payment error:', error);
    throw new Error('فشل في إنشاء طلب الدفع');
  }
}

/**
 * Verify Paymob HMAC callback
 * @param {Object} callbackData - Callback data from Paymob
 * @returns {boolean} Is valid
 */
export function verifyPaymobHMAC(callbackData) {
  try {
    const {
      amount_cents, created_at, currency, error_occured, has_parent_transaction,
      id, integration_id, is_3d_secure, is_auth, is_capture, is_refunded,
      is_standalone_payment, is_voided, order, owner, pending, source_data,
      success, txn_response_code, type
    } = callbackData;

    const hmacString = `${amount_cents}${created_at}${currency}${error_occured}${has_parent_transaction}${id}${integration_id}${is_3d_secure}${is_auth}${is_capture}${is_refunded}${is_standalone_payment}${is_voided}${order.id}${owner}${pending}${source_data.type}${success}${txn_response_code}${type}${PAYMENT_CONFIG.paymob.hmacSecret}`;

    const crypto = require('crypto');
    const calculatedHMAC = crypto.createHash('sha512').update(hmacString).digest('hex');

    return calculatedHMAC === callbackData.hmac;
  } catch (error) {
    console.error('HMAC verification error:', error);
    return false;
  }
}

/**
 * Handle successful payment callback
 * @param {Object} paymentData - Payment callback data
 */
export async function handlePaymentSuccess(paymentData) {
  try {
    // Update order status in Firestore
    const { db } = await import('../firebase.js');
    const { doc, updateDoc } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");

    const orderId = paymentData.order_id || paymentData.merchant_order_id;
    if (!orderId) return;

    await updateDoc(doc(db, 'orders', orderId), {
      status: 'تم الدفع ✅',
      paidAt: new Date().toISOString(),
      paymentDetails: paymentData
    });

    // Award loyalty points
    const orderDoc = await getDoc(doc(db, 'orders', orderId));
    if (orderDoc.exists()) {
      const oData = orderDoc.data();
      if (oData.userId && !oData.pointsAdded) {
        const earnRate = window.loyaltyEarnRateActual || 20;
        const pts = Math.floor((oData.totalAmount - (oData.shippingCost || 0)) / earnRate);
        if (pts > 0) {
          const { increment, arrayUnion } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");
          await updateDoc(doc(db, 'users', oData.userId), {
            loyaltyPoints: increment(pts),
            unreadNotifs: increment(1),
            notifications: arrayUnion({ title: 'نقاط ولاء جديدة 🎁', message: `مبروك! حصلت على ${pts} نقطة لإتمام طلبك.`, date: new Date().toISOString() })
          });
          await updateDoc(doc(db, 'orders', orderId), { pointsAdded: true });
        }
      }
    }

    showToast('تم الدفع بنجاح! جاري تأكيد طلبك.', 'success');
  } catch (error) {
    console.error('Payment success handling error:', error);
  }
}

/**
 * Handle failed payment callback
 * @param {Object} paymentData - Payment callback data
 */
export async function handlePaymentFailure(paymentData) {
  try {
    const { db } = await import('../firebase.js');
    const { doc, updateDoc } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");

    const orderId = paymentData.order_id || paymentData.merchant_order_id;
    if (!orderId) return;

    await updateDoc(doc(db, 'orders', orderId), {
      status: 'فشل الدفع ❌',
      failedAt: new Date().toISOString(),
      paymentDetails: paymentData
    });

    showToast('فشل الدفع. يرجى المحاولة مرة أخرى.', 'error');
  } catch (error) {
    console.error('Payment failure handling error:', error);
  }
}

/**
 * Initialize Stripe Elements
 */
export function initStripeElements() {
  if (typeof Stripe === 'undefined' || !PAYMENT_CONFIG.stripe.publishableKey) return;

  const stripe = Stripe(PAYMENT_CONFIG.stripe.publishableKey);
  const elements = stripe.elements();

  const card = elements.create('card', {
    style: {
      base: {
        fontSize: '16px',
        color: '#32325d',
        fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
        '::placeholder': { color: '#aab7c4' }
      },
      invalid: { color: '#fa755a', iconColor: '#fa755a' }
    }
  });

  card.mount('#stripe-card-element');

  card.on('change', (event) => {
    const displayError = document.getElementById('stripe-card-errors');
    if (displayError) {
      displayError.textContent = event.error ? event.error.message : '';
    }
  });

  return { stripe, card };
}

/**
 * Process Stripe payment
 * @param {Object} stripe - Stripe instance
 * @param {Object} card - Card element
 * @param {Object} orderData - Order data
 * @returns {Promise<Object>} Payment result
 */
export async function processStripePayment(stripe, card, orderData) {
  try {
    const { error, paymentMethod } = await stripe.createPaymentMethod('card', card);
    if (error) throw new Error(error.message);

    // Send to backend to confirm payment
    const response = await fetch('/api/confirm-stripe-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        paymentMethodId: paymentMethod.id,
        amount: Math.round(orderData.totalAmount * 100),
        currency: 'egp',
        orderId: orderData.orderId
      })
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Stripe payment error:', error);
    throw error;
  }
}

// Make functions available globally
if (typeof window !== 'undefined') {
  window.initPaymentMethods = initPaymentMethods;
  window.processPaymobPayment = processPaymobPayment;
  window.processFawryPayment = processFawryPayment;
  window.verifyPaymobHMAC = verifyPaymobHMAC;
  window.handlePaymentSuccess = handlePaymentSuccess;
  window.handlePaymentFailure = handlePaymentFailure;
  window.initStripeElements = initStripeElements;
  window.processStripePayment = processStripePayment;
}

export default {
  initPaymentMethods,
  processPaymobPayment,
  processFawryPayment,
  verifyPaymobHMAC,
  handlePaymentSuccess,
  handlePaymentFailure,
  initStripeElements,
  processStripePayment
};