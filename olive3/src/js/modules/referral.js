/**
 * Referral/Affiliate Module
 * Handles referral program functionality
 */

import { db } from '../firebase.js';
import { collection, getDocs, query, where, doc, getDoc, addDoc, updateDoc, increment, arrayUnion } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { state } from '../state.js';
import { showToast, escapeHTML, formatCurrency, generateId } from '../utils.js';

/**
 * Generate referral code for user
 * @param {string} userId - User ID
 * @returns {Promise<string>} Referral code
 */
export async function generateReferralCode(userId) {
  const userDoc = await getDoc(doc(db, 'users', userId));
  if (userDoc.exists() && userDoc.data().referralCode) {
    return userDoc.data().referralCode;
  }

  const baseName = userDoc.exists() ? (userDoc.data().name || 'USER') : 'USER';
  const code = (baseName.replace(/\s+/g, '').toUpperCase().substring(0, 6) + generateId().substring(0, 4)).toUpperCase();

  await updateDoc(doc(db, 'users', userId), { referralCode: code });
  return code;
}

/**
 * Get user's referral code
 * @param {string} userId - User ID
 * @returns {Promise<string>} Referral code
 */
export async function getReferralCode(userId) {
  const userDoc = await getDoc(doc(db, 'users', userId));
  return userDoc.exists() ? (userDoc.data().referralCode || '') : '';
}

/**
 * Apply referral code during registration
 * @param {string} referralCode - Referral code
 * @param {string} newUserId - New user ID
 */
export async function applyReferralCode(referralCode, newUserId) {
  try {
    // Find referrer
    const { getDocs, query, where } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");
    const q = query(collection(db, 'users'), where('referralCode', '==', referralCode.toUpperCase()));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return { success: false, message: 'كود الإحالة غير صحيح' };
    }

    const referrerDoc = snapshot.docs[0];
    const referrerId = referrerDoc.id;

    // Prevent self-referral
    if (referrerId === newUserId) {
      return { success: false, message: 'لا يمكنك إحالة نفسك' };
    }

    // Check if already referred
    const existingReferral = await getDocs(query(collection(db, 'referrals'), where('referredId', '==', newUserId)));
    if (!existingReferral.empty) {
      return { success: false, message: 'تم تطبيق كود إحالة مسبقاً' };
    }

    // Create referral record
    const referrerReward = state.storeSettings.referrerReward || 50; // points
    const referredReward = state.storeSettings.referredReward || 25; // points

    await addDoc(collection(db, 'referrals'), {
      referrerId,
      referredId: newUserId,
      referralCode,
      referrerReward,
      referredReward,
      status: 'pending', // pending, completed
      createdAt: new Date().toISOString()
    });

    // Give immediate reward to referred user
    await updateDoc(doc(db, 'users', newUserId), {
      loyaltyPoints: increment(referredReward),
      referredBy: referrerId,
      unreadNotifs: increment(1),
      notifications: arrayUnion({
        title: 'مرحباً بك! 🎁',
        message: `حصلت على ${referredReward} نقطة ترحيبية عبر كود الإحالة!`,
        date: new Date().toISOString()
      })
    });

    // Notify referrer
    await updateDoc(doc(db, 'users', referrerId), {
      unreadNotifs: increment(1),
      notifications: arrayUnion({
        title: 'إحالة جديدة! 👥',
        message: `سجل مستخدم جديد عبر كودك. ستحصل على ${referrerReward} نقطة عند إتمام أول طلب له.`,
        date: new Date().toISOString()
      })
    });

    return { success: true };
  } catch (e) {
    console.error('Apply referral error:', e);
    return { success: false, message: 'حدث خطأ' };
  }
}

/**
 * Complete referral when referred user makes first purchase
 * @param {string} referredId - Referred user ID
 */
export async function completeReferral(referredId) {
  try {
    const { getDocs, query, where } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");
    const q = query(collection(db, 'referrals'), where('referredId', '==', referredId), where('status', '==', 'pending'));
    const snapshot = await getDocs(q);

    if (snapshot.empty) return;

    const referralDoc = snapshot.docs[0];
    const referral = referralDoc.data();

    // Update referral status
    await updateDoc(doc(db, 'referrals', referralDoc.id), {
      status: 'completed',
      completedAt: new Date().toISOString()
    });

    // Reward referrer
    await updateDoc(doc(db, 'users', referral.referrerId), {
      loyaltyPoints: increment(referral.referrerReward),
      unreadNotifs: increment(1),
      notifications: arrayUnion({
        title: 'مكافأة إحالة! 🎉',
        message: `أكمل صديقك أول طلب! حصلت على ${referral.referrerReward} نقطة.`,
        date: new Date().toISOString()
      })
    });

    // Log transaction
    await addDoc(collection(db, 'loyalty_transactions'), {
      userId: referral.referrerId,
      type: 'referral_reward',
      points: referral.referrerReward,
      referralId: referralDoc.id,
      date: new Date().toISOString()
    });

  } catch (e) {
    console.error('Complete referral error:', e);
  }
}

/**
 * Get referral stats for user
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Referral stats
 */
export async function getReferralStats(userId) {
  try {
    const { getDocs, query, where } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");
    const q = query(collection(db, 'referrals'), where('referrerId', '==', userId));
    const snapshot = await getDocs(q);

    let totalReferrals = 0;
    let completedReferrals = 0;
    let pendingReferrals = 0;
    let totalEarned = 0;

    snapshot.forEach(doc => {
      const r = doc.data();
      totalReferrals++;
      if (r.status === 'completed') {
        completedReferrals++;
        totalEarned += r.referrerReward;
      } else {
        pendingReferrals++;
      }
    });

    return { totalReferrals, completedReferrals, pendingReferrals, totalEarned };
  } catch (e) {
    return { totalReferrals: 0, completedReferrals: 0, pendingReferrals: 0, totalEarned: 0 };
  }
}

/**
 * Render referral dashboard
 */
export async function renderReferralDashboard() {
  if (!state.currentUser) return;

  const container = document.getElementById('referral-dashboard');
  if (!container) return;

  const code = await getReferralCode(state.currentUser.uid);
  const stats = await getReferralStats(state.currentUser.uid);
  const referralLink = `${window.location.origin}/?ref=${code}`;

  container.innerHTML = `
    <div style="background:var(--panel-bg); border:1px solid var(--border-color); border-radius:12px; padding:20px; margin-bottom:20px;">
      <h3 style="color:var(--primary); margin-top:0;">👥 برنامج الإحالة</h3>
      <p>شارك كودك مع أصدقائك واكسب نقاطاً لكل طلب يتم عبرك!</p>

      <div style="background:var(--input-bg); border-radius:8px; padding:15px; margin:15px 0; display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
        <div style="flex:1; min-width:200px;">
          <strong>كود الإحالة الخاص بك:</strong><br>
          <code style="font-size:1.5rem; color:var(--primary); background:var(--panel-bg); padding:5px 10px; border-radius:6px; border:1px solid var(--border-color);">${escapeHTML(code)}</code>
        </div>
        <button class="btn btn-outline" onclick="navigator.clipboard.writeText('${referralLink}'); showToast('تم نسخ الرابط!', 'success')">📋 نسخ الرابط</button>
        <button class="btn" onclick="window.shareReferral('${referralLink}')">📤 مشاركة</button>
      </div>

      <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(120px,1fr)); gap:10px; margin-top:15px;">
        <div style="background:var(--input-bg); padding:15px; border-radius:8px; text-align:center;">
          <div style="font-size:1.5rem; font-weight:bold; color:var(--primary);">${stats.totalReferrals}</div>
          <div style="font-size:0.8rem; color:var(--text-muted);">إجمالي الإحالات</div>
        </div>
        <div style="background:var(--input-bg); padding:15px; border-radius:8px; text-align:center;">
          <div style="font-size:1.5rem; font-weight:bold; color:#28a745;">${stats.completedReferrals}</div>
          <div style="font-size:0.8rem; color:var(--text-muted);">مكتملة</div>
        </div>
        <div style="background:var(--input-bg); padding:15px; border-radius:8px; text-align:center;">
          <div style="font-size:1.5rem; font-weight:bold; color:#ffc107;">${stats.pendingReferrals}</div>
          <div style="font-size:0.8rem; color:var(--text-muted);">قيد الانتظار</div>
        </div>
        <div style="background:var(--input-bg); padding:15px; border-radius:8px; text-align:center;">
          <div style="font-size:1.5rem; font-weight:bold; color:var(--secondary);">${stats.totalEarned}</div>
          <div style="font-size:0.8rem; color:var(--text-muted);">نقاط مكتسبة</div>
        </div>
      </div>
    </div>

    <div style="background:var(--panel-bg); border:1px solid var(--border-color); border-radius:12px; padding:20px;">
      <h4 style="color:var(--primary);">📋 إحالاتك الأخيرة</h4>
      <div id="referral-history"></div>
    </div>
  `;

  // Load referral history
  loadReferralHistory();
}

/**
 * Load referral history
 */
export async function loadReferralHistory() {
  const container = document.getElementById('referral-history');
  if (!container || !state.currentUser) return;

  const { getDocs, query, where, orderBy } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");
  const q = query(collection(db, 'referrals'), where('referrerId', '==', state.currentUser.uid), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    container.innerHTML = '<p style="text-align:center; color:var(--text-muted);">لا توجد إحالات بعد</p>';
    return;
  }

  let html = '';
  snapshot.forEach(doc => {
    const r = doc.data();
    const statusColors = { pending: '#ffc107', completed: '#28a745' };
    const statusLabels = { pending: '⏳ قيد الانتظار', completed: '✅ مكتملة' };
    const date = new Date(r.createdAt).toLocaleDateString('ar-EG');

    html += `
      <div style="display:flex; justify-content:space-between; align-items:center; padding:10px; border-bottom:1px solid var(--border-color);">
        <div>
          <strong>كود: ${escapeHTML(r.referralCode)}</strong><br>
          <small style="color:var(--text-muted);">${date}</small>
        </div>
        <div style="text-align:left;">
          <span style="background:${statusColors[r.status]}; color:white; padding:2px 8px; border-radius:12px; font-size:0.75rem;">${statusLabels[r.status]}</span><br>
          <small style="color:var(--secondary);">${r.referrerReward} نقطة</small>
        </div>
      </div>
    `;
  });
  container.innerHTML = html;
}

/**
 * Share referral link
 * @param {string} link - Referral link
 */
export async function shareReferral(link) {
  if (navigator.share) {
    await navigator.share({
      title: 'انضم لمتجر زيت الشجرة المباركة',
      text: `اكسب نقاطاً عند التسجيل عبر رابط إحالتي! ${link}`,
      url: link
    });
  } else {
    await navigator.clipboard.writeText(link);
    showToast('تم نسخ الرابط!', 'success');
  }
}

// Make functions available globally
if (typeof window !== 'undefined') {
  window.generateReferralCode = generateReferralCode;
  window.getReferralCode = getReferralCode;
  window.applyReferralCode = applyReferralCode;
  window.completeReferral = completeReferral;
  window.getReferralStats = getReferralStats;
  window.renderReferralDashboard = renderReferralDashboard;
  window.loadReferralHistory = loadReferralHistory;
  window.shareReferral = shareReferral;
}

export default {
  generateReferralCode,
  getReferralCode,
  applyReferralCode,
  completeReferral,
  getReferralStats,
  renderReferralDashboard,
  loadReferralHistory,
  shareReferral
};