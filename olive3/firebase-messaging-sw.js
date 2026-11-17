importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');
self.addEventListener('push', (event) => {
  let data = {}; try { data = event.data ? event.data.json() : {}; } catch (e) {}
  const notif = data.notification || {};
  event.waitUntil(self.registration.showNotification(notif.title || '🌿 متجر زيت الشجرة المباركة', {
    body: notif.body || 'لديك إشعار جديد من متجر زيت الشجرة المباركة',
    icon: './icon-192.png', badge: './icon-192.png'
  }));
});