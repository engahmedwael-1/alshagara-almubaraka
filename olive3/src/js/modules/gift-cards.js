/**
 * Gift Cards Module
 * Handles gift card purchase, redemption, and management
 */

import { db } from '../firebase.js';
import { collection, getDocs, query, where, doc, getDoc, addDoc, setDoc, updateDoc, increment, arrayUnion, orderBy } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { state } from '../state.js';
import { showToast, escapeHTML, formatCurrency, generateId } from '../utils.js';

/**
 * Generate gift card code
 * @returns {string} Gift card code
 */
function generateGiftCardCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'GIFT-';
  for (let i = 0; i < 12; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
    if (i === 3 || i === 7) code += '-';
  }
  return code;
}

/**
 * Purchase gift card
 * @param {Object} data - Gift card data
 */
export async function purchaseGiftCard(data) {
  if (!state.currentUser) {
    showToast('يجب تسجيل الدخول أولاً', 'error');
    return;
  }

  const { amount, recipientEmail, recipientName, message, senderName } = data;

  if (!amount || amount < 50) {
    showToast('الحد الأدنى 50 ج', 'error');
    return;
  }

  const code = generateGiftCardCode();

  try {
    await addDoc(collection(db, 'gift_cards'), {
      code,
      amount,
      balance: amount,
      buyerId: state.currentUser.uid,
      buyerEmail: state.currentUser.email,
      buyerName: senderName || state.currentUser.displayName,
      recipientEmail: recipientEmail || '',
      recipientName: recipientName || '',
      message: message || '',
      status: 'active', // active, redeemed, expired
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year
    });

    // Deduct from buyer's loyalty points or charge payment
    // For now, just create the card

    showToast('تم إنشاء بطاقة الهدية بنجاح!', 'success');
    return { success: true, code };
  } catch (e) {
    console.error('Purchase gift card error:', e);
    showToast('فشل إنشاء البطاقة', 'error');
    return { success: false };
  }
}

/**
 * Redeem gift card
 * @param {string} code - Gift card code
 * @returns {Promise<Object>} Redemption result
 */
export async function redeemGiftCard(code) {
  if (!state.currentUser) {
    return { success: false, message: 'يجب تسجيل الدخول أولاً' };
  }

  const normalizedCode = code.trim().toUpperCase();

  try {
    const { getDocs } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");
    const q = query(collection(db, 'gift_cards'), where('code', '==', normalizedCode));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return { success: false, message: 'كود البطاقة غير صحيح' };
    }

    const cardDoc = snapshot.docs[0];
    const card = cardDoc.data();

    if (card.status !== 'active') {
      return { success: false, message: 'البطاقة مستخدمة أو منتهية' };
    }

    if (new Date(card.expiresAt) < new Date()) {
      return { success: false, message: 'انتهت صلاحية البطاقة' };
    }

    if (card.recipientEmail && card.recipientEmail !== state.currentUser.email) {
      return { success: false, message: 'هذه البطاقة مخصصة لمستخدم آخر' };
    }

    // Redeem
    await updateDoc(doc(db, 'gift_cards', cardDoc.id), {
      balance: 0,
      status: 'redeemed',
      redeemedBy: state.currentUser.uid,
      redeemedAt: new Date().toISOString()
    });

    // Add balance to user (as loyalty points equivalent or wallet)
    const pointsEquivalent = Math.round(card.amount * 5); // 1 EGP = 5 points

    await updateDoc(doc(db, 'users', state.currentUser.uid), {
      loyaltyPoints: increment(pointsEquivalent),
      unreadNotifs: increment(1),
      notifications: arrayUnion({
        title: 'تم استلام بطاقة هدية! 🎁',
        message: `قيمة البطاقة: ${formatCurrency(card.amount)}. تمت إضافة ${pointsEquivalent} نقطة لرصيدك.`,
        date: new Date().toISOString()
      })
    });

    showToast(`تم استرداد البطاقة! تمت إضافة ${formatCurrency(card.amount)} لرصيدك`, 'success');
    return { success: true, amount: card.amount, points: pointsEquivalent };
  } catch (e) {
    console.error('Redeem gift card error:', e);
    return { success: false, message: 'حدث خطأ' };
  }
}

/**
 * Get user's gift cards
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Gift cards
 */
export async function getUserGiftCards(userId) {
  try {
    const { getDocs, query, where, orderBy } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");
    const q = query(collection(db, 'gift_cards'), where('buyerId', '==', userId), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (e) {
    return [];
  }
}

/**
 * Render gift card purchase UI
 */
export function renderGiftCardPurchase() {
  const container = document.getElementById('gift-card-purchase');
  if (!container) return;

  container.innerHTML = `
    <div style="background:var(--panel-bg); border:1px solid var(--border-color); border-radius:16px; padding:20px;">
      <h3 style="color:var(--primary); margin-top:0;">🎁 شراء بطاقة هدية</h3>
      <form id="gift-card-form" onsubmit="event.preventDefault(); window.submitGiftCardPurchase()">
        <div class="form-row" style="margin-bottom:15px;">
          <div style="flex:1;">
            <label>القيمة (ج):</label>
            <input type="number" id="gift-amount" min="50" max="5000" step="50" value="200" required style="width:100%; padding:10px; border-radius:8px; border:1px solid var(--border-color);">
          </div>
        </div>
        <div class="form-row" style="margin-bottom:15px;">
          <div style="flex:1;">
            <label>اسم المرسل:</label>
            <input type="text" id="gift-sender-name" value="${state.currentUser?.displayName || ''}" required style="width:100%; padding:10px; border-radius:8px; border:1px solid var(--border-color);">
          </div>
        </div>
        <div class="form-row" style="margin-bottom:15px;">
          <div style="flex:1;">
            <label>اسم المستلم (اختياري):</label>
            <input type="text" id="gift-recipient-name" placeholder="اسم المستلم" style="width:100%; padding:10px; border-radius:8px; border:1px solid var(--border-color);">
          </div>
        </div>
        <div class="form-row" style="margin-bottom:15px;">
          <div style="flex:1;">
            <label>بريد المستلم (اختياري):</label>
            <input type="email" id="gift-recipient-email" placeholder="email@example.com" style="width:100%; padding:10px; border-radius:8px; border:1px solid var(--border-color);">
          </div>
        </div>
        <div class="form-row" style="margin-bottom:15px;">
          <div style="flex:1;">
            <label>رسالة شخصية (اختياري):</label>
            <textarea id="gift-message" rows="3" placeholder="أكتب رسالتك هنا..." style="width:100%; padding:10px; border-radius:8px; border:1px solid var(--border-color);"></textarea>
          </div>
        </div>
        <button type="submit" class="btn" style="width:100%; background:#028090;">شراء بطاقة الهدية 🎁</button>
      </form>
      <div id="gift-card-result" style="margin-top:20px; display:none;"></div>
    </div>
  `;
}

/**
 * Submit gift card purchase
 */
export async function submitGiftCardPurchase() {
  const amount = parseFloat(document.getElementById('gift-amount')?.value);
  const senderName = document.getElementById('gift-sender-name')?.value;
  const recipientName = document.getElementById('gift-recipient-name')?.value;
  const recipientEmail = document.getElementById('gift-recipient-email')?.value;
  const message = document.getElementById('gift-message')?.value;
  const resultDiv = document.getElementById('gift-card-result');

  const result = await purchaseGiftCard({ amount, senderName, recipientName, recipientEmail, message });

  if (result.success && resultDiv) {
    resultDiv.style.display = 'block';
    resultDiv.innerHTML = `
      <div style="background:linear-gradient(135deg, #ffd700, #ff8c00); color:white; padding:20px; border-radius:12px; text-align:center;">
        <h3 style="margin:0 0 10px;">🎉 تم إنشاء بطاقة الهدية!</h3>
        <div style="font-size:1.5rem; font-family:monospace; letter-spacing:2px; background:rgba(255,255,255,0.2); padding:15px; border-radius:8px; margin:15px 0;">${result.code}</div>
        <p style="margin:0;">القيمة: ${formatCurrency(amount)}</p>
        <button class="btn" onclick="navigator.clipboard.writeText('${result.code}'); showToast('تم النسخ!', 'success')" style="margin-top:15px;">📋 نسخ الكود</button>
      </div>
    `;
    document.getElementById('gift-card-form').reset();
  }
}

/**
 * Render gift card redeem UI
 */
export function renderGiftCardRedeem() {
  const container = document.getElementById('gift-card-redeem');
  if (!container) return;

  container.innerHTML = `
    <div style="background:var(--panel-bg); border:1px solid var(--border-color); border-radius:16px; padding:20px;">
      <h3 style="color:var(--primary); margin-top:0;">🎫 استرداد بطاقة هدية</h3>
      <form id="gift-card-redeem-form" onsubmit="event.preventDefault(); window.submitGiftCardRedeem()">
        <div style="margin-bottom:15px;">
          <label>كود البطاقة:</label>
          <input type="text" id="gift-redeem-code" placeholder="GIFT-XXXX-XXXX-XXXX" required style="width:100%; padding:12px; font-size:1.1rem; letter-spacing:1px; border-radius:8px; border:1px solid var(--border-color); text-transform:uppercase;">
        </div>
        <button type="submit" class="btn" style="width:100%;">استرداد 🎁</button>
      </form>
      <div id="gift-redeem-result" style="margin-top:15px;"></div>
    </div>
  `;
}

/**
 * Submit gift card redeem
 */
export async function submitGiftCardRedeem() {
  const code = document.getElementById('gift-redeem-code')?.value;
  const resultDiv = document.getElementById('gift-redeem-result');

  const result = await redeemGiftCard(code);

  if (resultDiv) {
    resultDiv.style.display = 'block';
    if (result.success) {
      resultDiv.innerHTML = `<div style="background:#d4edda; color:#155724; padding:15px; border-radius:8px; border:1px solid #c3e6cb;">✅ ${result.message}</div>`;
    } else {
      resultDiv.innerHTML = `<div style="background:#f8d7da; color:#721c24; padding:15px; border-radius:8px; border:1px solid #f5c6cb;">❌ ${result.message}</div>`;
    }
  }
}

/**
 * Render user's gift cards
 */
export async function renderUserGiftCards() {
  if (!state.currentUser) return;

  const container = document.getElementById('user-gift-cards');
  if (!container) return;

  const cards = await getUserGiftCards(state.currentUser.uid);

  if (cards.length === 0) {
    container.innerHTML = '<p style="text-align:center; color:var(--text-muted);">لم تشترِ بطاقات هدايا بعد</p>';
    return;
  }

  let html = '';
  cards.forEach(card => {
    const statusColors = { active: '#28a745', redeemed: '#6c757d', expired: '#dc3545' };
    const statusLabels = { active: '✅ نشطة', redeemed: '✅ مستخدمة', expired: '❌ منتهية' };
    const date = new Date(card.createdAt).toLocaleDateString('ar-EG');

    html += `
      <div style="background:var(--input-bg); border:1px solid var(--border-color); border-radius:12px; padding:15px; margin-bottom:10px;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div>
            <code style="font-size:1rem; color:var(--primary); background:var(--panel-bg); padding:5px 10px; border-radius:6px;">${escapeHTML(card.code)}</code>
            <br><small style="color:var(--text-muted);">تم الشراء: ${date}</small>
          </div>
          <div style="text-align:left;">
            <span style="background:${statusColors[card.status]}; color:white; padding:4px 10px; border-radius:12px; font-size:0.8rem;">${statusLabels[card.status]}</span>
            <br><strong style="color:var(--secondary);">${formatCurrency(card.amount)}</strong>
          </div>
        </div>
        ${card.message ? `<p style="margin-top:10px; font-style:italic; color:var(--text-muted);">"${escapeHTML(card.message)}"</p>` : ''}
      </div>
    `;
  });
  container.innerHTML = html;
}

// Make functions available globally
if (typeof window !== 'undefined') {
  window.purchaseGiftCard = purchaseGiftCard;
  window.redeemGiftCard = redeemGiftCard;
  window.getUserGiftCards = getUserGiftCards;
  window.renderGiftCardPurchase = renderGiftCardPurchase;
  window.submitGiftCardPurchase = submitGiftCardPurchase;
  window.renderGiftCardRedeem = renderGiftCardRedeem;
  window.submitGiftCardRedeem = submitGiftCardRedeem;
  window.renderUserGiftCards = renderUserGiftCards;
}

export default {
  purchaseGiftCard,
  redeemGiftCard,
  getUserGiftCards,
  renderGiftCardPurchase,
  submitGiftCardPurchase,
  renderGiftCardRedeem,
  submitGiftCardRedeem,
  renderUserGiftCards
};