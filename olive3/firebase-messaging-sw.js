// Firebase Cloud Messaging Background Service Worker - Zait El Shagara Store V67
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch (e) {}
  const notif = data.notification || {};
  const title = notif.title || '🌿 متجر زيت الشجرة المباركة';
  const options = {
    body: notif.body || 'لديك رسالة أو تحديث جديد من خدمة العملاء (اضغط للفتح)',
    icon: './icon-192.png',
    badge: './icon-192.png',
    data: { url: 'https://alshagara-almubaraka.vercel.app/?openChat=1' }
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) ? event.notification.data.url : 'https://alshagara-almubaraka.vercel.app/?openChat=1';
  event.waitUntil(clients.openWindow(targetUrl));
});
