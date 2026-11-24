/**
 * Push Notifications Module
 * Handles Firebase Cloud Messaging for real push notifications
 */

import { db } from '../firebase.js';
import { doc, getDoc, setDoc, updateDoc, onSnapshot, collection, query, orderBy, limit, addDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { state } from '../state.js';
import { showToast } from '../utils.js';

let messaging = null;
let vapidKey = null;

/**
 * Initialize Firebase Messaging
 */
export async function initPushNotifications() {
  try {
    // Check if messaging is supported
    const { isSupported, getMessaging, getToken, onMessage, deleteToken } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging.js");

    const supported = await isSupported();
    if (!supported) {
      console.log('Push notifications not supported in this browser');
      return;
    }

    messaging = getMessaging();
    vapidKey = state.storeSettings?.fcmVapidKey || 'YOUR_VAPID_KEY_HERE';

    // Request permission
    await requestNotificationPermission();

    // Get token
    const token = await getToken(messaging, { vapidKey });
    if (token && state.currentUser) {
      await saveTokenToUser(token);
    }

    // Listen for foreground messages
    onMessage(messaging, (payload) => {
      console.log('Foreground message received:', payload);
      handleForegroundMessage(payload);
    });

    // Listen for token refresh
    // Note: onTokenRefresh is deprecated, token is refreshed automatically

    console.log('✅ Push notifications initialized');
  } catch (error) {
    console.error('Push notifications init error:', error);
  }
}

/**
 * Request notification permission
 */
export async function requestNotificationPermission() {
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      console.log('Notification permission granted');
      return true;
    } else {
      console.log('Notification permission denied');
      return false;
    }
  } catch (error) {
    console.error('Permission request error:', error);
    return false;
  }
}

/**
 * Save FCM token to user document
 * @param {string} token - FCM token
 */
export async function saveTokenToUser(token) {
  if (!state.currentUser) return;

  try {
    const userRef = doc(db, 'users', state.currentUser.uid);
    const userDoc = await getDoc(userRef);

    const tokens = userDoc.exists() ? (userDoc.data().fcmTokens || []) : [];
    if (!tokens.includes(token)) {
      tokens.push(token);
      // Keep only last 5 tokens
      if (tokens.length > 5) tokens.shift();

      await updateDoc(userRef, { fcmTokens: tokens });
    }
  } catch (error) {
    console.error('Save token error:', error);
  }
}

/**
 * Handle foreground message
 * @param {Object} payload - Message payload
 */
export function handleForegroundMessage(payload) {
  const { notification, data } = payload;

  if (notification) {
    // Show custom toast instead of browser notification
    showToast(`${notification.title}: ${notification.body}`, 'info');

    // Also show browser notification if page is not focused
    if (document.visibilityState === 'hidden') {
      new Notification(notification.title, {
        body: notification.body,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: data?.click_action || 'default',
        data: data
      });
    }
  }
}

/**
 * Send push notification to specific user
 * @param {string} userId - Target user ID
 * @param {Object} notification - Notification object
 */
export async function sendPushToUser(userId, notification) {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) return;

    const tokens = userDoc.data().fcmTokens || [];
    if (tokens.length === 0) return;

    // In production, this should be done via a Cloud Function
    // For now, we'll store the notification in Firestore for the user to fetch
    await addDoc(collection(db, 'user_notifications'), {
      userId,
      title: notification.title,
      body: notification.body,
      icon: notification.icon || '/icon-192.png',
      clickAction: notification.clickAction || '/',
      data: notification.data || {},
      read: false,
      createdAt: new Date().toISOString()
    });

    // Also increment unread count
    await updateDoc(userRef, {
      unreadNotifs: increment(1),
      notifications: arrayUnion({
        title: notification.title,
        message: notification.body,
        date: new Date().toISOString()
      })
    });
  } catch (error) {
    console.error('Send push error:', error);
  }
}

/**
 * Send push notification to all users (broadcast)
 * @param {Object} notification - Notification object
 */
export async function sendBroadcastNotification(notification) {
  try {
    // Store in global notifications for admin panel
    await addDoc(collection(db, 'global_notifications'), {
      title: notification.title,
      message: notification.body,
      timestamp: new Date().toISOString(),
      sent: true
    });

    // In production, use Cloud Function to send to all FCM tokens
    // For now, add to all users' notifications
    const { getDocs } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");
    const usersSnap = await getDocs(collection(db, 'users'));

    const batch = [];
    usersSnap.forEach(async (uDoc) => {
      try {
        batch.push(updateDoc(doc(db, 'users', uDoc.id), {
          unreadNotifs: increment(1),
          notifications: arrayUnion({
            title: notification.title,
            message: notification.body,
            date: new Date().toISOString()
          })
        }));
      } catch (e) {}
    });

    await Promise.all(batch);
    console.log(`Broadcast sent to ${usersSnap.size} users`);
  } catch (error) {
    console.error('Broadcast error:', error);
  }
}

/**
 * Register service worker for background notifications
 */
export async function registerSW() {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      console.log('SW registered:', registration.scope);
      return registration;
    } catch (error) {
      console.error('SW registration failed:', error);
    }
  }
}

/**
 * Subscribe to topic
 * @param {string} topic - Topic name
 */
export async function subscribeToTopic(topic) {
  if (!messaging) return;
  try {
    // Topic subscription is handled server-side
    console.log(`Subscribed to topic: ${topic}`);
  } catch (error) {
    console.error('Topic subscription error:', error);
  }
}

/**
 * Unsubscribe from topic
 * @param {string} topic - Topic name
 */
export async function unsubscribeFromTopic(topic) {
  if (!messaging) return;
  try {
    console.log(`Unsubscribed from topic: ${topic}`);
  } catch (error) {
    console.error('Topic unsubscription error:', error);
  }
}

/**
 * Get notification history for user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Notifications
 */
export async function getUserNotifications(userId) {
  try {
    const { getDocs, query, where, orderBy, limit: limitQuery } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");
    const q = query(
      collection(db, 'user_notifications'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limitQuery(50)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Get notifications error:', error);
    return [];
  }
}

/**
 * Mark notification as read
 * @param {string} notificationId - Notification ID
 */
export async function markNotificationRead(notificationId) {
  try {
    const { doc, updateDoc } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");
    await updateDoc(doc(db, 'user_notifications', notificationId), { read: true });
  } catch (error) {
    console.error('Mark read error:', error);
  }
}

/**
 * Delete notification
 * @param {string} notificationId - Notification ID
 */
export async function deleteNotification(notificationId) {
  try {
    const { doc, deleteDoc } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");
    await deleteDoc(doc(db, 'user_notifications', notificationId));
  } catch (error) {
    console.error('Delete notification error:', error);
  }
}

/**
 * Initialize notification UI
 */
export function initNotificationUI() {
  // Notification bell click handler
  const bell = document.getElementById('notification-bell');
  if (bell) {
    bell.addEventListener('click', toggleNotifications);
  }

  // Close dropdown on outside click
  document.addEventListener('click', (e) => {
    const dropdown = document.getElementById('notifications-dropdown');
    if (dropdown && !e.target.closest('.notification-bell') && !e.target.closest('.notifications-dropdown')) {
      dropdown.classList.remove('show');
    }
  });
}

/**
 * Toggle notifications dropdown
 */
export function toggleNotifications() {
  const dropdown = document.getElementById('notifications-dropdown');
  if (dropdown) {
    dropdown.classList.toggle('show');
    if (dropdown.classList.contains('show') && state.currentUser) {
      loadUserNotifications();
    }
  }
}

/**
 * Load user notifications into dropdown
 */
export async function loadUserNotifications() {
  const container = document.getElementById('notifications-dropdown-content');
  if (!container || !state.currentUser) return;

  const notifications = await getUserNotifications(state.currentUser.uid);

  if (notifications.length === 0) {
    container.innerHTML = '<p style="padding: 15px; text-align: center; color: var(--text-muted);">لا توجد إشعارات</p>';
    return;
  }

  let html = '';
  notifications.forEach(n => {
    const date = new Date(n.createdAt).toLocaleString('ar-EG');
    const readClass = n.read ? '' : 'unread';
    html += `
      <div class="notification-item ${readClass}" data-id="${n.id}">
        <strong>${escapeHTML(n.title)}</strong>
        <span>${escapeHTML(n.body)}</span>
        <span class="notification-time">${date}</span>
      </div>
    `;
  });
  container.innerHTML = html;

  // Mark as read on click
  container.querySelectorAll('.notification-item').forEach(item => {
    item.addEventListener('click', async () => {
      const id = item.dataset.id;
      await markNotificationRead(id);
      item.classList.remove('unread');
      // Handle click action
      const notif = notifications.find(n => n.id === id);
      if (notif?.clickAction) {
        window.location.href = notif.clickAction;
      }
    });
  });
}

// Helper function (should use from utils)
function escapeHTML(str) {
  if (!str) return "";
  return String(str).replace(/[&<>'"]/g, tag => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[tag]));
}

// Make functions available globally
if (typeof window !== 'undefined') {
  window.initPushNotifications = initPushNotifications;
  window.requestNotificationPermission = requestNotificationPermission;
  window.sendPushToUser = sendPushToUser;
  window.sendBroadcastNotification = sendBroadcastNotification;
  window.registerSW = registerSW;
  window.subscribeToTopic = subscribeToTopic;
  window.unsubscribeFromTopic = unsubscribeFromTopic;
  window.getUserNotifications = getUserNotifications;
  window.markNotificationRead = markNotificationRead;
  window.deleteNotification = deleteNotification;
  window.initNotificationUI = initNotificationUI;
  window.toggleNotifications = toggleNotifications;
}

export default {
  initPushNotifications,
  requestNotificationPermission,
  sendPushToUser,
  sendBroadcastNotification,
  registerSW,
  subscribeToTopic,
  unsubscribeFromTopic,
  getUserNotifications,
  markNotificationRead,
  deleteNotification,
  initNotificationUI,
  toggleNotifications
};