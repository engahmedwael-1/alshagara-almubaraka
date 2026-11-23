/**
 * Loyalty Tiers Module
 * Handles tiered loyalty program
 */

import { db } from '../firebase.js';
import { collection, getDocs, query, where, doc, getDoc, setDoc, updateDoc, increment, arrayUnion, orderBy } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { state } from '../state.js';
import { showToast, escapeHTML, formatCurrency, formatNumber } from '../utils.js';

// Default loyalty tiers
const DEFAULT_TIERS = [
  { id: 'bronze', name: 'برونزي', minPoints: 0, maxPoints: 499, color: '#cd7f32', benefits: ['كسب نقاط عادي', 'خصم 5% في عيد الميلاد'] },
  { id: 'silver', name: 'فضي', minPoints: 500, maxPoints: 1999, color: '#c0c0c0', benefits: ['كسب نقاط 1.25x', 'شحن مجاني للطلبات فوق 500 ج', 'خصم 10% في عيد الميلاد'] },
  { id: 'gold', name: 'ذهبي', minPoints: 2000, maxPoints: 4999, color: '#ffd700', benefits: ['كسب نقاط 1.5x', 'شحن مجاني دائماً', 'خصم 15% في عيد الميلاد', 'أولوية في الدعم'] },
  { id: 'platinum', name: 'بلاتيني', minPoints: 5000, maxPoints: 9999, color: '#e5e4e2', benefits: ['كسب نقاط 2x', 'شحن مجاني سريع', 'خصم 20% في عيد الميلاد', 'مدير حساب مخصص', 'هدايا حصرية'] },
  { id: 'diamond', name: 'ماسي', minPoints: 10000, maxPoints: Infinity, color: '#b9f2ff', benefits: ['كسب نقاط 3x', 'شحن مجاني فوري', 'خصم 25% في عيد الميلاد', 'مدير حساب VIP', 'دعوات لمنتجات حصرية', 'استرجاع مجاني'] }
];

/**
 * Get user's current tier
 * @param {number} points - User points
 * @returns {Object} Tier object
 */
export function getUserTier(points) {
  const tiers = state.storeSettings.loyaltyTiers || DEFAULT_TIERS;
  return tiers.find(t => points >= t.minPoints && points <= t.maxPoints) || tiers[0];
}

/**
 * Get next tier
 * @param {number} points - User points
 * @returns {Object|null} Next tier or null if max
 */
export function getNextTier(points) {
  const tiers = state.storeSettings.loyaltyTiers || DEFAULT_TIERS;
  const currentIndex = tiers.findIndex(t => points >= t.minPoints && points <= t.maxPoints);
  return currentIndex >= 0 && currentIndex < tiers.length - 1 ? tiers[currentIndex + 1] : null;
}

/**
 * Calculate points multiplier for tier
 * @param {string} tierId - Tier ID
 * @returns {number} Multiplier
 */
export function getTierMultiplier(tierId) {
  const multipliers = { bronze: 1, silver: 1.25, gold: 1.5, platinum: 2, diamond: 3 };
  return multipliers[tierId] || 1;
}

/**
 * Update user tier based on points
 * @param {string} userId - User ID
 * @param {number} newPoints - New points total
 */
export async function updateUserTier(userId, newPoints) {
  const tier = getUserTier(newPoints);
  const nextTier = getNextTier(newPoints);

  try {
    await updateDoc(doc(db, 'users', userId), {
      loyaltyTier: tier.id,
      loyaltyPoints: newPoints,
      tierProgress: nextTier ? {
        currentTier: tier.id,
        nextTier: nextTier.id,
        pointsNeeded: nextTier.minPoints - newPoints,
        progressPercent: Math.min(100, ((newPoints - tier.minPoints) / (nextTier.minPoints - tier.minPoints)) * 100)
      } : { currentTier: tier.id, isMax: true }
    });

    // Log tier change
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists() && userDoc.data().loyaltyTier !== tier.id) {
      await addDoc(collection(db, 'loyalty_transactions'), {
        userId,
        type: 'tier_upgrade',
        oldTier: userDoc.data().loyaltyTier,
        newTier: tier.id,
        points: newPoints,
        date: new Date().toISOString()
      });

      // Notify user
      await updateDoc(doc(db, 'users', userId), {
        unreadNotifs: increment(1),
        notifications: arrayUnion({
          title: `تهانينا! ترقيت لمستوى ${tier.name} 🎉`,
          message: `لقد وصلت لمستوى ${tier.name} مع ${formatNumber(newPoints)} نقطة! استمتع بمزايا جديدة.`,
          date: new Date().toISOString()
        })
      });
    }
  } catch (e) {
    console.error('Update tier error:', e);
  }
}

/**
 * Add loyalty points with tier multiplier
 * @param {string} userId - User ID
 * @param {number} basePoints - Base points to add
 * @param {string} reason - Reason for points
 * @param {Object} metadata - Additional metadata
 */
export async function addLoyaltyPoints(userId, basePoints, reason, metadata = {}) {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    const currentPoints = userDoc.exists() ? (userDoc.data().loyaltyPoints || 0) : 0;
    const currentTier = userDoc.exists() ? (userDoc.data().loyaltyTier || 'bronze') : 'bronze';
    const multiplier = getTierMultiplier(currentTier);
    const earnedPoints = Math.round(basePoints * multiplier);

    const newPoints = currentPoints + earnedPoints;

    await updateDoc(doc(db, 'users', userId), {
      loyaltyPoints: increment(earnedPoints),
      unreadNotifs: increment(1),
      notifications: arrayUnion({
        title: 'نقاط ولاء جديدة 🎁',
        message: `حصلت على ${earnedPoints} نقطة (${basePoints} × ${multiplier}x) - ${reason}`,
        date: new Date().toISOString()
      })
    });

    // Log transaction
    await addDoc(collection(db, 'loyalty_transactions'), {
      userId,
      type: 'earn',
      points: earnedPoints,
      basePoints,
      multiplier,
      tier: currentTier,
      reason,
      metadata,
      date: new Date().toISOString()
    });

    // Check for tier upgrade
    await updateUserTier(userId, newPoints);

    return { earnedPoints, newPoints, tier: getUserTier(newPoints) };
  } catch (e) {
    console.error('Add loyalty points error:', e);
    return null;
  }
}

/**
 * Redeem loyalty points for discount
 * @param {string} userId - User ID
 * @param {number} pointsToRedeem - Points to redeem
 * @returns {Promise<Object>} Redemption result
 */
export async function redeemPointsForDiscount(userId, pointsToRedeem) {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) return { success: false, message: 'المستخدم غير موجود' };

    const currentPoints = userDoc.data().loyaltyPoints || 0;
    if (currentPoints < pointsToRedeem) {
      return { success: false, message: 'نقاط غير كافية' };
    }

    // Minimum 50 points, multiples of 50
    if (pointsToRedeem < 50 || pointsToRedeem % 50 !== 0) {
      return { success: false, message: 'يجب استبدال 50 نقطة على الأقل ومضاعفات 50' };
    }

    const redeemValue = state.storeSettings.loyaltyRedeemValue || 10; // 50 points = 10 EGP default
    const discountAmount = (pointsToRedeem / 50) * redeemValue;

    await updateDoc(doc(db, 'users', userId), {
      loyaltyPoints: increment(-pointsToRedeem),
      unreadNotifs: increment(1),
      notifications: arrayUnion({
        title: 'استبدال نقاط 🎁',
        message: `تم خصم ${pointsToRedeem} نقطة وتحويلها لخصم ${formatCurrency(discountAmount)}`,
        date: new Date().toISOString()
      })
    });

    // Log transaction
    await addDoc(collection(db, 'loyalty_transactions'), {
      userId,
      type: 'redeem',
      points: -pointsToRedeem,
      discountAmount,
      date: new Date().toISOString()
    });

    // Check for tier downgrade
    const newPoints = currentPoints - pointsToRedeem;
    await updateUserTier(userId, newPoints);

    return { success: true, discountAmount, newPoints };
  } catch (e) {
    console.error('Redeem points error:', e);
    return { success: false, message: 'حدث خطأ' };
  }
}

/**
 * Render loyalty dashboard for user
 */
export function renderLoyaltyDashboard() {
  if (!state.currentUser) return;

  const container = document.getElementById('loyalty-dashboard');
  if (!container) return;

  getDoc(doc(db, 'users', state.currentUser.uid)).then(userDoc => {
    if (!userDoc.exists()) return;

    const data = userDoc.data();
    const points = data.loyaltyPoints || 0;
    const tier = getUserTier(points);
    const nextTier = getNextTier(points);
    const multiplier = getTierMultiplier(tier.id);

    let progressHtml = '';
    if (nextTier) {
      const progress = ((points - tier.minPoints) / (nextTier.minPoints - tier.minPoints)) * 100;
      progressHtml = `
        <div style="margin-bottom:15px;">
          <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
            <span>التقدم نحو ${nextTier.name}</span>
            <span>${Math.round(progress)}%</span>
          </div>
          <div style="background:var(--border-color); border-radius:10px; height:10px; overflow:hidden;">
            <div style="background:${nextTier.color}; height:100%; width:${progress}%; transition:width 0.5s;"></div>
          </div>
          <small style="color:var(--text-muted);">${nextTier.minPoints - points} نقطة المتبقية</small>
        </div>
      `;
    } else {
      progressHtml = `<div style="text-align:center; color:${tier.color}; font-weight:bold; padding:10px;">🎉 لقد وصلت لأعلى مستوى!</div>`;
    }

    const benefitsHtml = tier.benefits.map(b => `<li>${escapeHTML(b)}</li>`).join('');

    container.innerHTML = `
      <div style="background:linear-gradient(135deg, ${tier.color}22, ${tier.color}11); border:2px solid ${tier.color}; border-radius:16px; padding:20px; margin-bottom:20px;">
        <div style="display:flex; align-items:center; gap:15px; margin-bottom:15px;">
          <div style="width:80px; height:80px; border-radius:50%; background:${tier.color}; display:flex; align-items:center; justify-content:center; font-size:2rem; color:white;">${tier.id === 'diamond' ? '💎' : tier.id === 'platinum' ? '💠' : tier.id === 'gold' ? '🥇' : tier.id === 'silver' ? '🥈' : '🥉'}</div>
          <div>
            <h2 style="margin:0; color:${tier.color};">${escapeHTML(tier.name)}</h2>
            <p style="margin:5px 0 0; color:var(--text-muted);">مضاعف النقاط: ${multiplier}x</p>
          </div>
        </div>
        <div style="display:flex; justify-content:space-around; text-align:center;">
          <div><strong style="font-size:2rem; color:var(--primary);">${formatNumber(points)}</strong><br><small>نقطة</small></div>
          <div><strong style="font-size:1.5rem; color:var(--secondary);">${formatCurrency(points * (state.storeSettings.loyaltyRedeemValue || 10) / 50)}</strong><br><small>قيمة الخصم</small></div>
        </div>
        ${progressHtml}
      </div>

      <div style="background:var(--panel-bg); border:1px solid var(--border-color); border-radius:12px; padding:20px; margin-bottom:20px;">
        <h3 style="color:var(--primary); margin-top:0;">مزايا مستواك:</h3>
        <ul style="line-height:2;">${benefitsHtml}</ul>
      </div>

      <button type="button" class="btn" style="width:100%; background:#028090;" onclick="window.showRedeemModal()">استبدال النقاط بخصم 🎁</button>
    `;
  });
}

/**
 * Show redeem modal
 */
export function showRedeemModal() {
  const points = state.currentUser ? (JSON.parse(localStorage.getItem('zait_user_cache') || '{}').loyaltyPoints || 0) : 0;
  const maxRedeemable = Math.floor(points / 50) * 50;
  const redeemValue = state.storeSettings.loyaltyRedeemValue || 10;

  const modal = document.getElementById('redeem-modal');
  if (modal) {
    modal.innerHTML = `
      <div class="modal-content" style="max-width:400px;">
        <button class="modal-close" onclick="this.closest('.modal-overlay').style.display='none'">✖</button>
        <h3 style="color:var(--primary);">استبدال النقاط</h3>
        <p>رصيدك: <strong style="color:var(--primary);">${formatNumber(points)}</strong> نقطة</p>
        <p>يمكنك استبدال: <strong style="color:var(--secondary);">${formatNumber(maxRedeemable)}</strong> نقطة = <strong>${formatCurrency((maxRedeemable / 50) * redeemValue)}</strong></p>
        <div style="margin:15px 0;">
          <label>عدد النقاط للاستبدال (مضاعفات 50):</label>
          <input type="number" id="redeem-points-input" min="50" max="${maxRedeemable}" step="50" value="${maxRedeemable}" style="width:100%; padding:10px; border-radius:8px; border:1px solid var(--border-color);">
          <div id="redeem-preview" style="margin-top:10px; color:var(--secondary); font-weight:bold;"></div>
        </div>
        <button class="btn" style="width:100%;" onclick="window.confirmRedeem()">تأكيد الاستبدال</button>
      </div>
    `;
    modal.style.display = 'flex';

    // Update preview
    const input = document.getElementById('redeem-points-input');
    const preview = document.getElementById('redeem-preview');
    if (input && preview) {
      input.addEventListener('input', () => {
        const val = parseInt(input.value) || 0;
        if (val % 50 === 0 && val >= 50) {
          preview.textContent = `= ${formatCurrency((val / 50) * redeemValue)} خصم`;
        } else {
          preview.textContent = 'يجب أن يكون مضاعف لـ 50';
        }
      });
    }
  }
}

/**
 * Confirm redeem
 */
export async function confirmRedeem() {
  const input = document.getElementById('redeem-points-input');
  const points = parseInt(input?.value) || 0;
  const result = await redeemPointsForDiscount(state.currentUser.uid, points);

  if (result.success) {
    showToast(`تم استبدال ${points} نقطة بخصم ${formatCurrency(result.discountAmount)}!`, 'success');
    const modal = document.getElementById('redeem-modal');
    if (modal) modal.style.display = 'none';
    if (window.updateCartUI) window.updateCartUI();
    state.loyaltyDiscountFixed = result.discountAmount;
    state.loyaltyPointsUsedTemp = points;
  } else {
    showToast(result.message, 'error');
  }
}

// Make functions available globally
if (typeof window !== 'undefined') {
  window.getUserTier = getUserTier;
  window.getNextTier = getNextTier;
  window.getTierMultiplier = getTierMultiplier;
  window.updateUserTier = updateUserTier;
  window.addLoyaltyPoints = addLoyaltyPoints;
  window.redeemPointsForDiscount = redeemPointsForDiscount;
  window.renderLoyaltyDashboard = renderLoyaltyDashboard;
  window.showRedeemModal = showRedeemModal;
  window.confirmRedeem = confirmRedeem;
}

export default {
  getUserTier,
  getNextTier,
  getTierMultiplier,
  updateUserTier,
  addLoyaltyPoints,
  redeemPointsForDiscount,
  renderLoyaltyDashboard,
  showRedeemModal,
  confirmRedeem
};