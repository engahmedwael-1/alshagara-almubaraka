self.addEventListener('install', (e) => {
    console.log('[Service Worker] Installed');
});

self.addEventListener('fetch', (e) => {
    // هذا السطر مطلوب فقط لتفعيل زر التثبيت في متصفح كروم
});