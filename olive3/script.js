
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
        import { getFirestore, collection, addDoc, deleteDoc, doc, onSnapshot, query, orderBy, updateDoc, setDoc, getDoc, increment, arrayUnion, where } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
        import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

        const firebaseConfig = { apiKey: "AIzaSyBJFZRij_8cprlkj4qV98WSZVRWdYLQY-I", authDomain: "olive-oile-store.firebaseapp.com", projectId: "olive-oile-store", messagingSenderId: "991769684700", appId: "1:991769684700:web:adfd4958d6aba1c7902219" };
        const app = initializeApp(firebaseConfig); const db = getFirestore(app); const auth = getAuth(app); const googleProvider = new GoogleAuthProvider();
        const SUPER_ADMINS = ["aw734622@gmail.com", "mhmwdaltahrahmdwayl@gmail.com"];
        let dynamicAdmins = [], dynamicAdminsList = [];
        window.loyaltyEarnRateActual = 20; window.loyaltyRedeemValueActual = 10;

        
        
        window.hashString = async function(str) {
            const buffer = new TextEncoder().encode(str);
            const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        };
        
        window.escapeHTML = function(str) {
            if(!str) return "";
            return String(str).replace(/[&<>'"]/g, tag => ({
                '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
            }[tag]));
        };

        window.loyaltyDiscountFixed = 0; window.loyaltyPointsUsedTemp = 0; // متغير لخصم نقاط الولاء

        // دالة الميكروفون
        window.startVoiceTyping = function(inputId, btnElement) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (!SpeechRecognition) { window.showToast(window.currentLang === 'ar' ? 'متصفحك لا يدعم الإدخال الصوتي' : 'Voice input not supported', 'error'); return; }
            const recognition = new SpeechRecognition();
            recognition.lang = window.currentLang === 'ar' ? 'ar-EG' : 'en-US';
            recognition.interimResults = false;
            recognition.onstart = function() { if(btnElement) btnElement.classList.add('recording'); window.showToast(window.currentLang === 'ar' ? 'تحدث الآن...' : 'Speak now...', 'info'); };
            recognition.onresult = function(event) { const transcript = event.results[0][0].transcript; const inputEl = document.getElementById(inputId); if (inputEl) { inputEl.value = transcript; inputEl.dispatchEvent(new Event('input', { bubbles: true })); } };
            recognition.onerror = function() { window.showToast(window.currentLang === 'ar' ? 'لم نتمكن من سماعك بوضوح' : 'Could not hear you clearly', 'error'); };
            recognition.onend = function() { if(btnElement) btnElement.classList.remove('recording'); };
            recognition.start();
        };

        // دالة البحث الحي السريع (Live Search)
        window.handleLiveSearch = function(val) {
            let resContainer = document.getElementById('live-search-results');
            if(!val.trim() || !isProductsLoaded) { resContainer.style.display = 'none'; return; }
            let q = val.toLowerCase();
            let matches = products.filter(p => window.fuzzyMatch(p.name, q)).slice(0, 5); // عرض 5 نتائج كحد أقصى
            if(matches.length === 0) { resContainer.style.display = 'none'; return; }
            let html = '';
            matches.forEach(p => {
                let img = (p.images && p.images.length > 0) ? p.images[0] : (p.imageUrl || 'https://via.placeholder.com/40');
                html += `<div class="live-search-item" onclick="document.getElementById('search-input').value=''; document.getElementById('live-search-results').style.display='none'; window.openProductModal('${p.id}')">
                    <img loading="lazy" src="${img}" class="live-search-img">
                    <div class="live-search-info">
                        <span class="live-search-title">${p.name}</span>
                        <span class="live-search-price">${p.price} ج</span>
                    </div>
                </div>`;
            });
            resContainer.innerHTML = html;
            resContainer.style.display = 'block';
        };

        // إخفاء البحث الحي أو الإشعارات عند الضغط خارجهما
        document.addEventListener('click', (e) => {
            let resContainer = document.getElementById('live-search-results');
            if(resContainer && !e.target.closest('#search-input') && !e.target.closest('#live-search-results')) { resContainer.style.display = 'none'; }
            let nd = document.getElementById('notifications-dropdown');
            if (nd && !e.target.closest('.notification-bell') && !e.target.closest('.notifications-dropdown')) { nd.classList.remove('show'); }
        });

        // دوال الإشعارات ونقاط الولاء
        window.toggleNotifications = function(e) {
            if(e) e.stopPropagation();
            let el = document.getElementById('notifications-dropdown');
            if(el) { el.classList.toggle('show'); if(el.classList.contains('show') && currentUser) { updateDoc(doc(db, 'users', currentUser.uid), { unreadNotifs: 0 }); } }
        };

        let userNotificationsUnsubscribe = null;
        window.loadUserNotifications = function() {
            if(!currentUser) return;
            if(userNotificationsUnsubscribe) userNotificationsUnsubscribe();
            userNotificationsUnsubscribe = onSnapshot(doc(db, 'users', currentUser.uid), (docSnap) => {
                if(docSnap.exists()) {
                    let data = docSnap.data();
                    let notifs = data.notifications || [];
                    let loyalty = data.loyaltyPoints || 0;
                    
                    // تحديث واجهة نقاط الولاء
                    let lp = document.getElementById('nav-loyalty-points'); if(lp) lp.textContent = loyalty;
                    let plp = document.getElementById('loyalty-page-points'); if(plp) plp.textContent = loyalty;
                    let clp = document.getElementById('cart-loyalty-points'); if(clp) clp.textContent = loyalty;
                    let ls = document.getElementById('loyalty-section'); if(ls) ls.style.display = loyalty >= 50 ? 'flex' : 'none'; // تفعيل الاستبدال لو 50 نقطة فأكثر
                    
                    // تحديث واجهة الإشعارات
                    let fullCont = document.getElementById('full-notifications-container');
                    let notifBadge = document.getElementById('notif-badge-main');
                    let unreadCount = data.unreadNotifs || 0;
                    if(notifs.length > 0) {
                        notifs.sort((a,b) => new Date(b.date) - new Date(a.date));
                        let html = '';
                        notifs.forEach(n => {
                            let d = new Date(n.date).toLocaleString('ar-EG');
                            html += `<div class="notification-item"><strong>${n.title}</strong><span>${n.message}</span><span class="notification-time">${d}</span></div>`;
                        });
                        
                        let fullCont = document.getElementById('full-notifications-container');
                        if(fullCont) fullCont.innerHTML = html;
                        if(notifBadge) { notifBadge.textContent = unreadCount; notifBadge.style.display = unreadCount > 0 ? 'flex' : 'none'; }
                        let btnN = document.getElementById('btn-notifications-main'); if(btnN) btnN.style.display = 'block';
                    }
                }
            });
        };

        
        window.redeemLoyaltyPoints = function() {
            if(cart.length === 0) { window.showToast('السلة فارغة، أضف منتجات أولاً', 'error'); return; }
            if(currentUser) {

                getDoc(doc(db, 'users', currentUser.uid)).then(d => {
                    if(d.exists()) {
                        let pts = d.data().loyaltyPoints || 0;
                        if(pts >= 50) {
                            let discountAmount = Math.floor(pts / 50) * window.loyaltyRedeemValueActual; // كل 50 نقطة = 10 جنيه خصم
                            let usedPts = Math.floor(pts / 50) * 50;
                            updateDoc(doc(db, 'users', currentUser.uid), {
                                loyaltyPoints: increment(-usedPts),
                                unreadNotifs: increment(1),
                                notifications: arrayUnion({title: 'استبدال نقاط 🎁', message: `تم خصم ${usedPts} نقطة بنجاح، وتحويلها لخصم ${discountAmount} جنيه في سلتك الحالية.`, date: new Date().toISOString()})
                            }).then(() => {
                                window.loyaltyDiscountFixed = discountAmount; window.loyaltyPointsUsedTemp = usedPts;
                                window.updateInvoiceUI();
                                document.getElementById('discount-row').style.display = 'flex';
                                window.showToast(`تم استبدال ${usedPts} نقطة بخصم ${discountAmount} جنيه!`, 'success'); window.showPanel('cart');
                            });
                        } else { window.showToast('تحتاج 50 نقطة على الأقل للاستبدال', 'error'); }
                    }
                });
            }
        };

        window.loadAllReviews = function() {
            window.showPanel('reviews');
            let container = document.getElementById('all-reviews-container');
            if(!container) return;
            let allReviews = [];
            products.forEach(p => { if(p.reviews && p.reviews.length > 0) { p.reviews.forEach(r => { allReviews.push({ ...r, productName: p.name, productId: p.id }); }); } });
            getDoc(doc(db, 'settings', 'store_reviews')).then(docSnap => {
                if(docSnap.exists() && docSnap.data().reviews) { docSnap.data().reviews.forEach(r => { allReviews.push({ ...r, productName: window.currentLang === 'ar' ? 'تقييم عام للمتجر' : 'General Store Review' }); }); }
                renderReviewsList(allReviews, container);
            }).catch(() => { renderReviewsList(allReviews, container); });
        };

        function renderReviewsList(allReviews, container) {
            allReviews.sort((a,b) => new Date(b.date) - new Date(a.date));
            if(allReviews.length === 0) { container.innerHTML = `<h3 style="text-align: center; grid-column: 1 / -1; color: var(--text-muted);">${window.currentLang === 'ar' ? 'لا توجد تقييمات بعد.' : 'No reviews yet.'}</h3>`; return; }
            let html = '';
            allReviews.forEach(r => {
                let d = new Date(r.date).toLocaleDateString('ar-EG');
                let revImgHtml = r.imageUrl ? `<img loading="lazy" src="${r.imageUrl}" class="review-img" onclick="window.open('${r.imageUrl}', '_blank')">` : '';
                html += `<div class="review-box"><strong style="color:var(--primary);">${window.escapeHTML(r.userName)}</strong> <span style="font-size:0.8rem; color:var(--text-muted);">(${d})</span><br><span style="font-size:0.85rem; color:var(--secondary);">${r.productName}</span><br>${'⭐'.repeat(r.rating || 5)}<br><span style="color:var(--text-color); font-size:0.95rem;">${window.escapeHTML(r.comment)}</span><br>${revImgHtml}</div>`;
            });
            container.innerHTML = html;
        }

        window.submitGeneralReview = async function() {
            if(!currentUser) { window.showToast(window.currentLang === 'ar' ? 'يرجى تسجيل الدخول أولاً' : 'Please login first', 'error'); window.showPanel('auth'); return; }
            let txt = document.getElementById('general-review-text').value.trim();
            if(!txt) { window.showToast(window.currentLang === 'ar' ? 'اكتب تقييمك أولاً' : 'Write your review first', 'error'); return; }
            try {
                let rName = currentUser.displayName || (currentUser.email ? currentUser.email.split('@')[0] : currentUser.phoneNumber); 
                let reviewObj = { userName: rName, userId: currentUser.uid, comment: txt, rating: 5, date: new Date().toISOString() };
                let chatRef = doc(db, 'settings', 'store_reviews'); 
                let snap = await getDoc(chatRef);
                if(snap.exists()) { await updateDoc(chatRef, { reviews: arrayUnion(reviewObj) }); } else { await setDoc(chatRef, { reviews: [reviewObj] }); }
                document.getElementById('general-review-text').value = '';
                window.showToast(window.currentLang === 'ar' ? 'شكراً لتقييمك!' : 'Thank you for your review!', 'success');
                window.loadAllReviews();
            } catch (error) { window.showToast('حدث خطأ أثناء الإرسال', 'error'); }
        };

        const deliveryData = { "القاهرة": { shippingCost: 90, cities: ["مدينة نصر", "المعادي", "مصر الجديدة", "شبرا", "التجمع الخامس", "عين شمس", "حلوان", "المطرية", "المرج", "وسط البلد", "الزمالك", "الرحاب", "الشروق", "مدينتي", "العباسية", "دار السلام"] }, "الجيزة": { shippingCost: 90, cities: ["الدقي", "المهندسين", "الهرم", "فيصل", "6 أكتوبر", "الشيخ زايد", "العجوزة", "البدرشين", "الصف", "الحوامدية", "العياط", "أوسيم", "كرداسة", "الوراق", "إمبابة"] }, "الشرقية": { shippingCost: 90, cities: ["الزقازيق", "فاقوس", "بلبيس", "منيا القمح", "أبو حماد", "العاشر من رمضان", "ههيا", "أبو كبير", "ديرب نجم", "الحسينية", "مشتول السوق", "أولاد صقر", "الإبراهيمية", "القرين", "القنايات"] }, "الإسكندرية": { shippingCost: 90, cities: ["سيدي جابر", "سموحة", "محرم بك", "العجمي", "المنتزه", "ميامي", "العامرية", "برج العرب", "سيدي بشر", "المندرة", "كليوباترا", "لوران", "كامب شيزار"] }, "القليوبية": { shippingCost: 90, cities: ["بنها", "شبرا الخيمة", "قليوب", "طوخ", "الخانكة", "القناطر الخيرية", "شبين القناطر", "العبور", "الخصوص", "قها"] }, "الدقهلية": { shippingCost: 90, cities: ["المنصورة", "ميت غمر", "السنبلاوين", "دكرنس", "بلقاس", "شربين", "طلخا", "منية النصر", "نبروه", "أجا", "الجمالية", "المطرية", "تمي الأمديد", "ميت سلسيل"] }, "البحيرة": { shippingCost: 90, cities: ["دمنهور", "كفر الدوار", "إيتاي البارود", "أبو حمص", "كوم حمادة", "رشيد", "حوش عيسى", "المحمودية", "إدكو", "الدلنجات", "شبراخيت", "الرحمانية", "النوبارية", "وادي النطرون"] }, "الغربية": { shippingCost: 90, cities: ["طنطا", "المحلة الكبرى", "زفتى", "كفر الزيات", "سمنود", "بسيون", "قطور", "السنطة"] }, "المنوفية": { shippingCost: 90, cities: ["شبين الكوم", "منوف", "أشمون", "قويسنا", "بركة السبع", "تلا", "الشهداء", "السادات", "سرس الليان"] }, "كفر الشيخ": { shippingCost: 90, cities: ["كفر الشيخ", "دسوق", "فوه", "مطوبس", "بيلا", "الحامول", "سيدي سالم", "بلطيم", "قلين", "الرياض", "سيدي غازي", "مسير"] }, "دمياط": { shippingCost: 90, cities: ["دمياط", "رأس البر", "فارسكور", "الزرقا", "كفر سعد", "عزبة البرج", "السرو", "ميت أبو غالب", "الروضة"] }, "بورسعيد": { shippingCost: 90, cities: ["حي الشرق", "حي العرب", "حي المناخ", "حي الضواحي", "بورفؤاد", "حي الزهور", "حي الجنوب"] }, "الإسماعيلية": { shippingCost: 90, cities: ["الإسماعيلية", "فايد", "القنطرة شرق", "القنطرة غرب", "التل الكبير", "أبو صوير", "القصاصين"] }, "السويس": { shippingCost: 90, cities: ["السويس", "الأربعين", "عتاقة", "فيصل", "الجناين"] }, "شمال سيناء": { shippingCost: 100, cities: ["العريش", "الشيخ زويد", "رفح", "بئر العبد", "نخل", "الحسنة"] }, "جنوب سيناء": { shippingCost: 100, cities: ["شرم الشيخ", "طور سيناء", "دهب", "نويبع", "طابا", "رأس سدر", "سانت كاترين", "أبو رديس", "أبو زنيمة"] }, "الفيوم": { shippingCost: 90, cities: ["الفيوم", "سنورس", "إطسا", "طامية", "يوسف الصديق", "أبشواي"] }, "بني سويف": { shippingCost: 90, cities: ["بني سويف", "الواسطى", "ناصر", "إهناسيا", "ببا", "سمسطا", "الفشن"] }, "المنيا": { shippingCost: 90, cities: ["المنيا", "ملوي", "مغاغة", "بني مزار", "سمالوط", "أبو قرقاص", "مطاي", "دير مواس", "العدوة"] }, "أسيوط": { shippingCost: 90, cities: ["أسيوط", "ديروط", "القوصية", "أبنوب", "منفلوط", "أبو تيج", "الغنايم", "البداري", "ساحل سليم", "صدفا", "الفتح"] }, "سوهاج": { shippingCost: 90, cities: ["سوهاج", "طما", "طهطا", "المراغة", "أخميم", "جرجا", "المنشأة", "دار السلام", "البلينا", "جهينة", "ساقلتة", "العسيرات"] }, "قنا": { shippingCost: 90, cities: ["قنا", "نجع حمادي", "دشنا", "قوص", "أبو تشت", "فرشوط", "فاو", "نقادة", "الوقف", "قفط"] }, "الأقصر": { shippingCost: 90, cities: ["الأقصر", "إسنا", "أرمنت", "البياضية", "القرنة", "الطود", "الزينية"] }, "أسوان": { shippingCost: 100, cities: ["أسوان", "إدفو", "كوم أمبو", "نصر النوبة", "دراو", "أبو سمبل", "كلابشة", "الرديسية", "البصيلية", "السباعية"] }, "البحر الأحمر": { shippingCost: 100, cities: ["الغردقة", "سفاجا", "القصير", "مرسى علم", "رأس غارب", "حلايب", "شلاتين"] }, "الوادي الجديد": { shippingCost: 100, cities: ["الخارجة", "الداخلة", "الفرافرة", "باريس", "بلاط"] }, "مطروح": { shippingCost: 100, cities: ["مرسى مطروح", "العلمين", "الحمام", "الضبعة", "سيوة", "النجيلة", "براني", "السلوم"] } };

        
        function parseVariants(vStr) {
            if(!vStr) return [];
            let arr = [];
            let parts = vStr.split(',');
            parts.forEach(p => {
                let kv = p.split('-');
                if(kv.length === 2) {
                    arr.push({ name: kv[0].trim(), price: Number(kv[1].trim()) });
                }
            });
            return arr;
        }
let products = [], currentUser = null, isLoginMode = true, isCurrentUserAdmin = false, isProductsLoaded = false, currentCategoryFilter = 'الكل', searchQuery = '', activeProductForReview = null, activeVariantForCart = null;
        let adminOrdersArray = [], currentAdminOrderFilter = 'الكل';
        let cart = JSON.parse(localStorage.getItem('cart')) || [];
        let savedForLater = JSON.parse(localStorage.getItem('savedForLater')) || [];
        let wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
        
        let currentSubtotal = 0, currentShippingCost = 0, currentDiscountPercent = 0, appliedPromoCode = "", promoCodesList = [];
        let totalGlobalRevenue = 0, totalGlobalOrders = 0;
        let unsubscribeUserChat = null, activeAdminChatId = null, unsubscribeActiveAdminChat = null, adminOrdersUnsubscribe = null, adminReturnsUnsubscribe = null;
        let savedAccounts = JSON.parse(localStorage.getItem('zait_saved_accounts')) || [];
        let currentRenderedProducts = 8; const productsPerPage = 8;
        
        let storeSettings = { walletNumber: "01018631768", fbPixelId: "", ttPixelId: "", categories: ["زيت زيتون"], autoReplyMessage: "أهلًا بيك❤️\nاكتب استفسارك وبمجرد ما يتوفر أدمن هيتم التواصل معاكم في أسرع وقت.", floatingButtons: [{ id: 'btn_support', icon: '💬', link: '#support', color: '#007bff', isSystem: true, title: 'خدمة العملاء' }, { id: 'btn_wa', icon: '📱', link: 'https://wa.me/201018631768', color: '#25D366', isSystem: false, title: 'واتساب' }], revenueResetDate: "2000-01-01T00:00:00.000Z", ordersResetDate: "2000-01-01T00:00:00.000Z", enableCrossSell: true };

        window.syncCartToCloud = async function() {
            if(currentUser) {
                try {
                    await setDoc(doc(db, 'users', currentUser.uid), { cart: cart, savedForLater: savedForLater }, { merge: true });
                } catch(e) { console.error("Sync error", e); }
            }
        };

        window.toggleCartItemSelection = function(cartItemId, isChecked) {
            let item = cart.find(i => i.cartItemId === cartItemId);
            if(item) { item.selected = isChecked; localStorage.setItem('cart', JSON.stringify(cart)); window.updateCartUI(); }
        };

        window.saveForLater = function(cartItemId) {
            let itemIndex = cart.findIndex(i => i.cartItemId === cartItemId);
            if(itemIndex > -1) {
                let item = cart[itemIndex];
                cart.splice(itemIndex, 1);
                savedForLater.push(item);
                localStorage.setItem('cart', JSON.stringify(cart));
                localStorage.setItem('savedForLater', JSON.stringify(savedForLater));
                window.updateCartUI();
                window.showToast(window.currentLang === 'ar' ? 'تم الحفظ لوقت لاحق' : 'Saved for later', 'success');
            }
        };

        window.moveToCart = function(cartItemId) {
            let itemIndex = savedForLater.findIndex(i => i.cartItemId === cartItemId);
            if(itemIndex > -1) {
                let item = savedForLater[itemIndex];
                savedForLater.splice(itemIndex, 1);
                item.selected = true;
                cart.push(item);
                localStorage.setItem('cart', JSON.stringify(cart));
                localStorage.setItem('savedForLater', JSON.stringify(savedForLater));
                window.updateCartUI();
                window.showToast(window.currentLang === 'ar' ? 'تم النقل للسلة' : 'Moved to cart', 'success');
            }
        };

        window.updateCartUI = function() { 
            let totalItems = 0; currentSubtotal = 0; let htmlContent = ''; 
            cart.forEach(item => { 
                totalItems += item.quantity; 
                let isChecked = item.selected !== false;
                if(isChecked) { currentSubtotal += (item.price * item.quantity); }
                let checkAttr = isChecked ? 'checked' : '';
                htmlContent += `<div class="cart-item" style="opacity: ${isChecked ? '1' : '0.6'}">
                    <input type="checkbox" class="cart-item-checkbox" ${checkAttr} onchange="window.toggleCartItemSelection('${item.cartItemId}', this.checked)">
                    <div class="cart-item-info">
                        <img loading="lazy" src="${item.imageUrl}">
                        <div><strong style="display:block; color:var(--primary); font-size:1.05rem;">${item.name}</strong>
                        <span style="color:var(--text-muted); font-size:0.9rem;">السعر: ${item.price} ج</span>
                        <br><button type="button" class="save-for-later-btn" onclick="window.saveForLater('${item.cartItemId}')"><span class="translatable">حفظ لوقت لاحق</span></button>
                        </div>
                    </div>
                    <div style="display:flex; align-items:center; gap:15px; flex-wrap:wrap;">
                        <div class="qty-controls">
                            <button type="button" class="qty-btn" onclick="window.updateQuantity('${item.cartItemId}', 1)">+</button>
                            <span style="font-weight:bold; min-width:20px; text-align:center; color:var(--text-color);">${item.quantity}</span>
                            <button type="button" class="qty-btn" onclick="window.updateQuantity('${item.cartItemId}', -1)">-</button>
                        </div>
                        <span style="font-weight:900; color:var(--secondary); font-size:1.1rem;">${item.price * item.quantity} ج</span>
                    </div>
                </div>`; 
            }); 
            let cic = document.getElementById('cart-items-container'); 
            let mtMsg = window.currentLang === 'ar' ? 'سلتك فارغة.' : 'Your cart is empty.';
            if(cic) cic.innerHTML = htmlContent || `<p style="text-align:center; color:var(--text-muted);">${mtMsg}</p>`; 
            let cc = document.getElementById('cart-count'); if(cc) cc.textContent = totalItems; 
            let bcb = document.getElementById('bottom-cart-badge'); if(bcb) bcb.textContent = totalItems;
            let ct = document.getElementById('cart-total'); if(ct) ct.textContent = currentSubtotal; 
            
            let sflSection = document.getElementById('saved-for-later-section');
            let sflContainer = document.getElementById('saved-for-later-container');
            if(sflSection && sflContainer) {
                if(savedForLater.length > 0) {
                    sflSection.style.display = 'block';
                    let sflHtml = '';
                    savedForLater.forEach(item => {
                        sflHtml += `<div class="saved-item-box">
                            <div style="display:flex; align-items:center; gap:10px;">
                                <img loading="lazy" src="${item.imageUrl}" style="width:50px; height:50px; border-radius:6px; object-fit:cover;">
                                <div><strong style="color:var(--primary); font-size:0.95rem;">${item.name}</strong><br><span style="color:var(--secondary); font-weight:bold;">${item.price} ج</span></div>
                            </div>
                            <button type="button" class="btn btn-outline" style="padding:6px 12px; font-size:0.85rem;" onclick="window.moveToCart('${item.cartItemId}')"><span class="translatable">نقل إلى السلة</span></button>
                        </div>`;
                    });
                    sflContainer.innerHTML = sflHtml;
                } else { sflSection.style.display = 'none'; }
            }
            window.updateInvoiceUI(); 
            
            let freeShippingBox = document.getElementById('free-shipping-box');
            let freeShippingBar = document.getElementById('free-shipping-bar');
            let freeShippingMsg = document.getElementById('free-shipping-msg');
            let targetAmount = (storeSettings && storeSettings.freeShippingThreshold) ? storeSettings.freeShippingThreshold : 1000;
            if(freeShippingBox && freeShippingBar && freeShippingMsg) {
                freeShippingBox.style.display = 'block';
                if(currentSubtotal >= targetAmount) {
                    freeShippingBar.style.width = '100%';
                    freeShippingBar.style.backgroundColor = '#28a745';
                    freeShippingMsg.innerHTML = '🎉 مبروك! لقد حصلت على شحن مجاني';
                } else {
                    let progress = (currentSubtotal / targetAmount) * 100;
                    freeShippingBar.style.width = progress + '%';
                    freeShippingBar.style.backgroundColor = 'var(--secondary)';
                    let remaining = targetAmount - currentSubtotal;
                    freeShippingMsg.innerHTML = `<span class="translatable">أضف منتجات بقيمة</span> <strong>${remaining} ج</strong> <span class="translatable">لتحصل على شحن مجاني! 🚚</span>`;
                }
            }
            window.syncCartToCloud();

            let transElements = document.querySelectorAll('.translatable');
        }

        window.currentLang = 'ar';
        window.toggleLanguage = function() {
            window.currentLang = window.currentLang === 'ar' ? 'en' : 'ar';
            document.documentElement.dir = window.currentLang === 'ar' ? 'rtl' : 'ltr';
            document.documentElement.lang = window.currentLang;
            let langBtn = document.getElementById('lang-btn');
            if(langBtn) langBtn.innerText = window.currentLang === 'ar' ? '🌐 EN' : '🌐 ع';
            
            let transElements = document.querySelectorAll('.translatable');
            const enDict = { 
                "الخدمات والأقسام": "Services & Categories", "الرئيسية": "Home", "آراء العملاء": "Reviews", "👤 حسابي:": "👤 My Account:", "سلة المشتريات": "Shopping Cart", "طلباتي": "My Orders", "المفضلة": "Wishlist", "سجل المشاهدات": "Recently Viewed", "تصفح الأقسام:": "Browse Categories:", "🔄 تبديل الحسابات:": "🔄 Switch Accounts:", "إضافة حساب آخر": "Add Another Account", "تسجيل الخروج": "Logout", "الرئيسية 🏠": "Home 🏠", "السلة 🛒": "Cart 🛒", "المفضلة ❤️": "Wishlist ❤️", "طلباتي 📦": "Orders 📦", "الدعم 💬": "Support 💬", "تسجيل الدخول": "Login", "رصيد نقاط الولاء": "Loyalty Points", "نقطة": "Point", "🛒 منتجاتك في انتظارك!": "🛒 Your products are waiting!", "لإتمام طلبك الآن نهديك كود خصم خاص!": "Complete your order now and get a special discount!", "إكمال الطلب الآن 🚀": "Complete Order Now 🚀", "🔄 طلب استرجاع منتج": "🔄 Return Product", "سبب الاسترجاع:": "Return Reason:", "ملاحظات تفصيلية:": "Detailed Notes:", "📸 إرفاق صورة توضح المشكلة (مهم جداً):": "📸 Attach an image (Important):", "إرسال طلب الاسترجاع 🚀": "Submit Return 🚀", "زيت الشجرة المباركة": "Blessed Tree Oil", "زيتون سيناوي بكر ممتاز لذيذ أول طعم بارد بدون أي إضافات، أصلي من قلب الطبيعة.": "Premium Sinai Extra Virgin Olive Oil, cold pressed, 100% natural.", "🔥 عرض خاص لفترة محدودة!": "🔥 Special Limited Time Offer!", "الفلاتر والترتيب:": "Filters & Sorting:", "جاري تحميل المنتجات... ⏳": "Loading Products... ⏳", "جاري تحميل المزيد من المنتجات... ⏳": "Loading More... ⏳", "👀 سجل المشاهدات": "👀 Recently Viewed", "📅 ابحث عن المنتجات التي شاهدتها في يوم محدد:": "📅 Search by date:", "تصفية": "Filter", "الكل": "All", "🛒 سلة مشترياتك": "🛒 Shopping Cart", "الإجمالي:": "Total:", "المتابعة للدفع والتوصيل": "Proceed to Checkout", "❤️ منتجاتي المفضلة": "❤️ Favorite Products", "لم تقم بإضافة منتجات للمفضلة بعد.": "Your wishlist is empty.", "⭐️ آراء وتقييمات عملائنا": "⭐️ Customer Reviews", "هل جربت الشراء منا؟": "Have you purchased from us?", "نشر التقييم": "Post Review", "📍 بيانات التوصيل والدفع": "📍 Delivery & Payment", "هل لديك كود خصم؟ 🎁": "Have a promo code? 🎁", "تفعيل": "Apply", "حدد موقعك على الخريطة لتسهيل التوصيل تلقائياً.": "Pin your location on the map for delivery.", "📍 حدد موقعي الحالي": "📍 Pin My Location", "يرجى لمس الخريطة لتحديد موقعك بدقة!": "Please tap on the map to accurately pin your location!", "💳 طريقة الدفع:": "💳 Payment Method:", "المنتجات:": "Products:", "الخصم:": "Discount:", "الشحن:": "Shipping:", "الإجمالي النهائي:": "Final Total:", "تأكيد عبر الموقع 🌐": "Confirm via Website 🌐", "تأكيد عبر واتساب 💬": "Confirm via WhatsApp 💬", "العودة للسلة": "Back to Cart", "👤 طلباتي وحالة الشحن": "👤 My Orders & Shipping", "جاري تحميل طلباتك...": "Loading orders...", "💬 خدمة العملاء": "💬 Customer Support", "إنهاء 🛑": "End 🛑", "حذف 🗑️": "Delete 🗑️", "يرجى تسجيل الدخول أولاً.": "Please log in first.", "إرسال 🚀": "Send 🚀", "حساب جديد": "New Account", "دخول": "Login", "تسجيل": "Register", "ليس لديك حساب؟ أنشئ حساباً جديداً": "Don't have an account? Sign up", "لديك حساب؟ سجل الدخول": "Have an account? Log in", "نسيت كلمة المرور؟": "Forgot Password?", "أو": "OR", "🌐 المتابعة بحساب جوجل": "🌐 Continue with Google", "🔗 مشاركة": "🔗 Share", "يشاهده الآن": "Viewed now by", "شخص": "person", "اختر الحجم / النوع:": "Select Size / Type:", "طبيعي 100%": "100% Natural", "شحن سريع": "Fast Shipping", "دفع آمن": "Secure Payment", "استرجاع مضمون": "Guaranteed Return", "🛍️ منتجات قد تعجبك:": "🛍️ Products you may like:", "تقييمات العملاء ⭐️": "Customer Reviews ⭐️", "أضف تقييمك:": "Add your review:", "📸 إرفاق صورة للمنتج (اختياري):": "📸 Attach Product Image (Optional):", "⏳ جاري الرفع...": "⏳ Uploading...", "إرسال التقييم": "Submit Review", "سجل الدخول لإضافة تقييم.": "Log in to review.", "اشترى": "Bought", "منذ دقيقتين": "2 mins ago", "الوضع الليلي / النهاري": "Dark / Light Mode", "الإجمالي (للعناصر المحددة):": "Total (selected):", "حفظ لوقت لاحق": "Save for later", "📦 محفوظة لوقت لاحق": "📦 Saved for later", "نقل إلى السلة": "Move to Cart", "تفعيل البيع المتقاطع (المنتجات المقترحة للعميل) 🛍️": "Enable Cross-Selling 🛍️", "العملاء 👥": "Customers 👥", "👥 قائمة العملاء المسجلين": "👥 Registered Customers", "نقاط الولاء 🎁": "Loyalty Points 🎁", "مرحباً بك في برنامج الولاء الخاص بنا!": "Welcome to our loyalty program!", "إجمالي نقاطك الحالية": "Total Points", "استبدل النقاط بخصم الآن!": "Redeem points for discount!", "كيف يعمل البرنامج؟ 🤔": "How it works? 🤔", "تكسب": "Earn", "مقابل كل": "for every", "جنيه تنفقها في المتجر.": "EGP spent.", "تتم إضافة النقاط إلى حسابك تلقائياً بمجرد استلامك للطلب.": "Points are added automatically upon delivery.", "يمكنك استبدال كل": "You can redeem", "بخصم فوري قيمته": "for a direct discount of", "جنيه على طلبك القادم.": "EGP on your next order.", "أضف منتجات بقيمة": "Add products worth", "لتحصل على شحن مجاني! 🚚": "to get free shipping! 🚚", "🎉 مبروك! لقد حصلت على شحن مجاني": "🎉 Congrats! Free shipping unlocked", "استبدال بخصم": "Redeem", "🚀 اشتري الآن (دفع سريع)": "🚀 Buy Now"
            };
            const arDict = {}; for(let key in enDict) { arDict[enDict[key]] = key; }
            transElements.forEach(el => {
                let txt = el.innerText.trim();
                if(window.currentLang === 'en' && enDict[txt]) el.innerText = enDict[txt];
                if(window.currentLang === 'ar' && arDict[txt]) el.innerText = arDict[txt];
            });
            let searchInp = document.getElementById('search-input'); if(searchInp) searchInp.placeholder = window.currentLang === 'ar' ? 'ابحث عن منتج...' : 'Search for a product...';
            let authEmail = document.getElementById('auth-email'); if(authEmail) authEmail.placeholder = window.currentLang === 'ar' ? 'البريد الإلكتروني' : 'Email Address';
            let authPass = document.getElementById('auth-password'); if(authPass) authPass.placeholder = window.currentLang === 'ar' ? 'كلمة المرور (6 أحرف على الأقل)' : 'Password (at least 6 chars)';
            let promoInp = document.getElementById('promo-code-input'); if(promoInp) promoInp.placeholder = window.currentLang === 'ar' ? 'أدخل الكود' : 'Enter Code';
            window.renderProducts(false); window.updateCartUI();
        };

        window.showToast = function(message, type = 'info') { const container = document.getElementById('toast-container'); const toast = document.createElement('div'); toast.className = `toast ${type}`; let icon = type === 'success' ? '✅' : (type === 'error' ? '❌' : 'ℹ️'); toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`; container.appendChild(toast); setTimeout(() => toast.classList.add('show'), 10); setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 300); }, 3000); };

        const panels = { 'home': document.getElementById('home-panel'), 'cart': document.getElementById('cart-panel'), 'checkout': document.getElementById('checkout-panel'), 'auth': document.getElementById('auth-panel'), 'admin': document.getElementById('admin-panel'), 'support': document.getElementById('support-panel'), 'admin-messages': document.getElementById('admin-messages-panel'), 'admin-orders': document.getElementById('admin-orders-panel'), 'admin-returns': document.getElementById('admin-returns-panel'), 'customer-orders': document.getElementById('customer-orders-panel'), 'admin-dashboard': document.getElementById('admin-dashboard-panel'), 'wishlist': document.getElementById('wishlist-panel'), 'reviews': document.getElementById('reviews-panel'), 'recently-viewed-panel': document.getElementById('recently-viewed-panel'), 'global-notifications-panel': document.getElementById('global-notifications-panel'), 'admin-users': document.getElementById('admin-users-panel'), 'loyalty': document.getElementById('loyalty-panel') };
        let checkoutMap = null, userMarker = null;

        window.openSidebar = function() { document.getElementById('sidebar').classList.add('open'); document.getElementById('sidebar-overlay').classList.add('show'); }
        window.closeSidebar = function() { document.getElementById('sidebar').classList.remove('open'); document.getElementById('sidebar-overlay').classList.remove('show'); }
        
        window.toggleDarkMode = function() { document.body.classList.toggle('dark-mode'); let isDark = document.body.classList.contains('dark-mode'); localStorage.setItem('zait_theme', isDark ? 'dark' : 'light'); window.closeSidebar(); }
        if(localStorage.getItem('zait_theme') === 'dark') document.body.classList.add('dark-mode');

        window.fuzzyMatch = function(str, query) { str = str.toLowerCase(); query = query.toLowerCase(); if (str.includes(query)) return true; let typoMap = {"زت":"زيت", "زتون":"زيتون", "عсл":"عسل", "عسل":"عسل", "سينوي":"سيناوي", "بكر":"بكر"}; for(let key in typoMap) { query = query.replace(new RegExp(key, 'g'), typoMap[key]); } if (str.includes(query)) return true; let i = 0, j = 0; while (i < str.length && j < query.length) { if (str[i] === query[j]) j++; i++; } return j === query.length; }

        const fakeNames = ["محمد من القاهرة", "أحمد من الإسكندرية", "محمود من الجيزة", "كريم من المنصورة", "مصطفى من طنطا", "Mohamed from Cairo", "Ahmed from Alex"];
        window.showRandomSocialProof = function() { if(!isProductsLoaded || products.length === 0) return; let p = products[Math.floor(Math.random() * products.length)]; let n = fakeNames[Math.floor(Math.random() * fakeNames.length)]; let img = (p.images && p.images.length > 0) ? p.images[0] : (p.imageUrl || '1000392409.jpeg'); let imgEl = document.getElementById('sp-img'); let nameEl = document.getElementById('sp-name'); let prodEl = document.getElementById('sp-product'); if(imgEl) imgEl.src = img; if(nameEl) nameEl.innerText = n; if(prodEl) prodEl.innerText = p.name.substring(0, 20) + '..'; let toast = document.getElementById('social-proof-toast'); if(toast) { toast.classList.add('show'); setTimeout(() => { toast.classList.remove('show'); }, 4000); } }
        setInterval(window.showRandomSocialProof, 25000);

        window.addRecentlyViewed = function(product) { let recent = JSON.parse(localStorage.getItem('zait_recently_viewed_history')) || []; let today = new Date().toISOString().split('T')[0]; recent = recent.filter(r => r.id !== product.id); recent.unshift({ id: product.id, name: product.name, price: product.price, image: (product.images && product.images.length > 0) ? product.images[0] : (product.imageUrl || ''), viewDate: today }); if(recent.length > 30) recent.pop(); localStorage.setItem('zait_recently_viewed_history', JSON.stringify(recent)); window.renderRecentlyViewedFull(); }
        window.filterRecentlyViewed = function() { let filterDate = document.getElementById('recent-date-filter').value; window.renderRecentlyViewedFull(filterDate); }
        window.clearRecentFilter = function() { let input = document.getElementById('recent-date-filter'); if(input) input.value = ''; window.renderRecentlyViewedFull(); }
        window.renderRecentlyViewedFull = function(filterDate = null) { let recent = JSON.parse(localStorage.getItem('zait_recently_viewed_history')) || []; let container = document.getElementById('recently-viewed-full-list'); if(!container) return; if(filterDate) { recent = recent.filter(r => r.viewDate === filterDate); } if(recent.length > 0) { let html = ''; recent.forEach(r => { let d = new Date(r.viewDate).toLocaleDateString('ar-EG'); let viewTxt = window.currentLang === 'ar' ? 'عرض مجدداً' : 'View Again'; html += `<div class="product-card" onclick="window.openProductModal('${r.id}')"><span class="category-badge" style="background:var(--secondary);">${d}</span><img loading="lazy" src="${r.image}" onerror="this.src='https://via.placeholder.com/300x250?text=صورة'"><div style="padding: 0 10px;"><h3>${r.name}</h3><div class="price">${r.price} ج</div><button type="button" class="btn btn-full" style="padding: 8px; font-size:1rem;">${viewTxt}</button></div></div>`; }); container.innerHTML = html; } else { let msg = window.currentLang === 'ar' ? `لم يتم العثور على مشاهدات ${filterDate ? 'في هذا اليوم' : 'بعد'}.` : `No views found ${filterDate ? 'on this day' : 'yet'}.`; container.innerHTML = `<h3 style="text-align: center; grid-column: 1 / -1; color: var(--text-muted);">${msg}</h3>`; } }

        window.initMagnifier = function() { const container = document.getElementById('magnifier-container'); const img = document.getElementById('modal-img-main'); if(!container || !img) return; container.addEventListener('mousemove', function(e) { const {left, top, width, height} = container.getBoundingClientRect(); const x = (e.clientX - left) / width * 100; const y = (e.clientY - top) / height * 100; img.style.transformOrigin = `${x}% ${y}%`; img.style.transform = 'scale(2)'; }); container.addEventListener('mouseleave', function() { img.style.transformOrigin = 'center center'; img.style.transform = 'scale(1)'; }); }

        let lastScrollY = window.scrollY;
        window.addEventListener('scroll', () => { const nav = document.getElementById('smart-nav'); if(nav) { if (window.scrollY > lastScrollY && window.scrollY > 100) nav.classList.add('hidden'); else nav.classList.remove('hidden'); } lastScrollY = window.scrollY; let homePanel = document.getElementById('home-panel'); if (homePanel && homePanel.classList.contains('active')) { if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 500) { let totalFiltered = window.getFilteredProductsCount(); if(currentRenderedProducts < totalFiltered) { let indicator = document.getElementById('loading-more-indicator'); if(indicator) indicator.style.display = 'block'; setTimeout(() => { currentRenderedProducts += productsPerPage; window.renderProducts(false); if(indicator) indicator.style.display = 'none'; }, 500); } } } });

        window.updateOfferTimer = function() { let endTime = localStorage.getItem('offer_end_time'); let now = new Date().getTime(); if(!endTime || now > endTime) { endTime = now + (72 * 60 * 60 * 1000); localStorage.setItem('offer_end_time', endTime); } setInterval(() => { now = new Date().getTime(); let distance = endTime - now; if(distance < 0) { endTime = now + (72 * 60 * 60 * 1000); localStorage.setItem('offer_end_time', endTime); distance = endTime - now; } let hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)); let minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)); let seconds = Math.floor((distance % (1000 * 60)) / 1000); let tStr = (hours < 10 ? "0"+hours : hours) + ":" + (minutes < 10 ? "0"+minutes : minutes) + ":" + (seconds < 10 ? "0"+seconds : seconds); let timerEl = document.getElementById('offer-timer'); if(timerEl) timerEl.innerText = tStr; }, 1000); }
        window.updateOfferTimer();

        window.checkAbandonedCart = function() { if(cart.length > 0) { let lastTime = localStorage.getItem('cart_last_updated'); let now = new Date().getTime(); if(lastTime && (now - lastTime > 1800000)) { setTimeout(() => { let modal = document.getElementById('abandoned-cart-modal'); if(modal) modal.style.display = 'flex'; localStorage.setItem('cart_last_updated', new Date().getTime()); }, 3000); } } }
        window.addEventListener('load', () => { window.checkAbandonedCart(); window.initMagnifier(); window.renderRecentlyViewedFull(); window.updateCartUI(); });

        window.toggleDropdown = function(e) { if(e) e.stopPropagation(); let el = document.getElementById('profile-dropdown'); if(el) el.classList.toggle('show'); }
        window.closeDropdown = function() { let menu = document.getElementById('profile-dropdown'); if(menu) menu.classList.remove('show'); }
        
        window.saveAccountLocally = function(email, password) { let existsIndex = savedAccounts.findIndex(a => a.email === email); if(existsIndex > -1) savedAccounts[existsIndex].password = btoa(password); else savedAccounts.push({email, password: btoa(password)}); localStorage.setItem('zait_saved_accounts', JSON.stringify(savedAccounts)); window.renderSavedAccounts(); }
        window.renderSavedAccounts = function() { let list1 = document.getElementById('saved-accounts-list'); let list2 = document.getElementById('sidebar-saved-accounts-list'); let html = ''; let btnTxt = window.currentLang === 'ar' ? '🔄 التبديل لـ' : '🔄 Switch to'; savedAccounts.forEach(acc => { if(currentUser && currentUser.email === acc.email) return; html += `<button type="button" class="dropdown-item" style="color:var(--primary); font-size:0.85rem; background:rgba(2, 128, 144, 0.05);" onclick="window.switchFastAccount('${acc.email}', '${acc.password}')">${btnTxt} ${acc.email.split('@')[0]}</button>`; }); if(list1) list1.innerHTML = html; if(list2) list2.innerHTML = html; }
        window.switchFastAccount = function(email, encodedPass) { window.closeDropdown(); window.showToast('جاري التبديل للحساب الآخر...', 'info'); signInWithEmailAndPassword(auth, email, atob(encodedPass)).then(() => { window.showToast('تم التبديل بنجاح', 'success'); window.showPanel('home'); }).catch(() => { window.showToast('انتهت الجلسة، يرجى إدخال الباسورد يدوياً', 'error'); window.showPanel('auth'); }); }

        let btnGoogle = document.getElementById('btn-google-signin');
        if(btnGoogle) { btnGoogle.addEventListener('click', () => { window.showToast(window.currentLang === 'ar' ? 'جاري الاتصال بجوجل...' : 'Connecting to Google...', 'info'); signInWithPopup(auth, googleProvider).then((result) => { const user = result.user; window.showToast(window.currentLang === 'ar' ? `أهلاً بك يا ${user.displayName}` : `Welcome ${user.displayName}`, 'success'); window.showPanel('home'); }).catch((error) => { console.error(error); window.showToast(window.currentLang === 'ar' ? 'حدث خطأ أثناء تسجيل الدخول بجوجل' : 'Error signing in with Google', 'error'); }); }); }

        function injectPixels() { let scriptHtml = ''; if(storeSettings.fbPixelId) { scriptHtml += `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init', '${storeSettings.fbPixelId}');fbq('track', 'PageView');`; } if(storeSettings.ttPixelId) { scriptHtml += `!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"];ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};ttq.load('${storeSettings.ttPixelId}');ttq.page();}(window,document,'ttq');`; } let sEl = document.getElementById('dynamic-pixel-script'); if(sEl) sEl.innerHTML = scriptHtml; }
        window.trackEvent = function(eventName, data = {}) { try { if(window.fbq) fbq('track', eventName, data); if(window.ttq) { let ttEvent = eventName === 'Purchase' ? 'CompletePayment' : (eventName === 'AddToCart' ? 'AddToCart' : eventName); ttq.track(ttEvent, data); } } catch(e){} }

        if (!sessionStorage.getItem('visited')) { sessionStorage.setItem('visited', 'true'); const statsRef = doc(db, 'settings', 'stats'); getDoc(statsRef).then(docSnap => { if(docSnap.exists()) updateDoc(statsRef, { visits: increment(1) }).catch(e=>{}); else setDoc(statsRef, { visits: 1 }).catch(e=>{}); }); }

        window.showPanel = function(panelId) { 
            Object.values(panels).forEach(p => { if(p) { p.classList.remove('active'); p.style.display = ''; } }); 
            document.querySelectorAll('.nav-btn, .bottom-nav-btn').forEach(btn => btn.classList.remove('active')); 
            if(panels[panelId]) panels[panelId].classList.add('active');
            
 
            document.querySelectorAll(`.nav-btn[onclick="window.showPanel('${panelId}')"], .bottom-nav-btn[onclick="window.showPanel('${panelId}')"]`).forEach(btn => btn.classList.add('active'));
            
            let hSection = document.getElementById('hero-section'); if(hSection) hSection.style.display = panelId === 'home' ? 'block' : 'none'; 
            if(panelId === 'wishlist') { window.renderWishlist(); } 
            if (panelId === 'checkout') { 
                setTimeout(() => { if (!checkoutMap) { let mEl = document.getElementById('map'); if(mEl) { checkoutMap = L.map('map').setView([30.0444, 31.2357], 6); L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(checkoutMap); checkoutMap.on('click', async function(e) { if(userMarker) checkoutMap.removeLayer(userMarker); userMarker = L.marker(e.latlng).addTo(checkoutMap); document.getElementById('order-lat').value = e.latlng.lat; document.getElementById('order-lng').value = e.latlng.lng; document.getElementById('map-warning').style.display = 'none'; try { let res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${e.latlng.lat}&lon=${e.latlng.lng}&accept-language=ar`, { headers: { 'User-Agent': 'ZaitStoreApp/1.0' } }); let data = await res.json(); if(data && data.display_name) { document.getElementById('order-map-address').value = data.display_name; let govSelect = document.getElementById('order-gov'); if(data.address && data.address.state) { let stateName = data.address.state.replace('محافظة ', '').trim(); for(let i=0; i<govSelect.options.length; i++) { if(stateName.includes(govSelect.options[i].value) || govSelect.options[i].value.includes(stateName)) { govSelect.selectedIndex = i; govSelect.dispatchEvent(new Event('change')); break; } } } } } catch(err) { } }); } } if(checkoutMap) checkoutMap.invalidateSize(); }, 300); 
            } 
            window.scrollTo({ top: 0, behavior: 'smooth' }); 
        };

        window.togglePaymentInfo = function(method) { let wi = document.getElementById('wallet-info'); if(wi) wi.style.display = method === "محفظة إلكترونية" ? 'block' : 'none'; }
        let locBtn = document.getElementById('btn-locate-me'); if(locBtn) { locBtn.addEventListener('click', () => { if (navigator.geolocation) { window.showToast('جاري تحديد موقعك...', 'info'); navigator.geolocation.getCurrentPosition(async (position) => { const lat = position.coords.latitude; const lng = position.coords.longitude; if(userMarker) checkoutMap.removeLayer(userMarker); userMarker = L.marker([lat, lng]).addTo(checkoutMap); checkoutMap.flyTo([lat, lng], 16); document.getElementById('order-lat').value = lat; document.getElementById('order-lng').value = lng; document.getElementById('map-warning').style.display = 'none'; window.showToast('تم تحديد الموقع بنجاح', 'success'); try { let res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=ar`, { headers: { 'User-Agent': 'ZaitStoreApp/1.0' } }); let data = await res.json(); if(data && data.display_name) { document.getElementById('order-map-address').value = data.display_name; } } catch(err) {} }, (error) => { window.showToast('يرجى تفعيل الـ GPS في هاتفك وإعطاء الصلاحية', 'error'); }); } else { window.showToast('متصفحك لا يدعم هذه الميزة', 'error'); } }); }

        window.logoutUser = function() { signOut(auth).then(() => { window.closeDropdown(); window.showToast('تم تسجيل الخروج بنجاح', 'info'); window.showPanel('auth'); }); };
        
        window.goToCheckout = function() { let selectedItems = cart.filter(item => item.selected !== false); if (selectedItems.length === 0) { window.showToast(window.currentLang === 'ar' ? 'قم بتحديد منتج واحد على الأقل للمتابعة!' : 'Select at least one item to proceed!', 'error'); return; } if (currentUser) { window.showPanel('checkout'); } else { window.showToast("يرجى تسجيل الدخول أولاً.", 'error'); window.showPanel('auth'); } };

        onSnapshot(doc(db, 'settings', 'main'), (docSnap) => { if (docSnap.exists()) { const data = docSnap.data(); storeSettings = { ...storeSettings, ...data }; if(!storeSettings.walletNumber) storeSettings.walletNumber = "01018631768"; if(storeSettings.enableCrossSell === undefined) storeSettings.enableCrossSell = true; } else { setDoc(doc(db, 'settings', 'main'), storeSettings); } window.applySettingsToUI(); injectPixels(); if(isCurrentUserAdmin) {window.loadAdminOrders(); window.loadAdminUsers();} });
        onSnapshot(doc(db, 'settings', 'stats'), (docSnap) => { let sEl = document.getElementById('stat-visits'); if(docSnap.exists() && isCurrentUserAdmin && sEl) { sEl.textContent = docSnap.data().visits || 0; } });
        onSnapshot(collection(db, 'promoCodes'), (snapshot) => { promoCodesList = []; let html = ''; snapshot.forEach(doc => { let data = doc.data(); data.id = doc.id; promoCodesList.push(data); html += `<div style="background:var(--input-bg); padding:10px; border:1px solid var(--border-color); border-radius:8px; display:flex; justify-content:space-between; margin-bottom:5px;"><span><strong>${data.code}</strong> (${data.discount}%)</span><button type="button" class="btn-danger" style="border:none; padding:4px 8px; border-radius:4px; cursor:pointer;" onclick="window.removePromo('${data.id}')">حذف</button></div>`; }); let listEl = document.getElementById('admin-promos-list'); if(listEl) listEl.innerHTML = html; });

        window.applySettingsToUI = function() {
            if(storeSettings.loyaltyEarnRate) window.loyaltyEarnRateActual = storeSettings.loyaltyEarnRate;
            if(storeSettings.loyaltyRedeemValue) window.loyaltyRedeemValueActual = storeSettings.loyaltyRedeemValue;
            let letxt = document.getElementById('loyalty-earn-text'); if(letxt) letxt.textContent = window.loyaltyEarnRateActual;
            let lrtxt = document.getElementById('loyalty-redeem-text'); if(lrtxt) lrtxt.textContent = window.loyaltyRedeemValueActual;
            
            if(isCurrentUserAdmin) { let csToggle = document.getElementById('setting-cross-sell'); if(csToggle) csToggle.checked = storeSettings.enableCrossSell;
                let loyE = document.getElementById('setting-loyalty-earn'); if(loyE && storeSettings.loyaltyEarnRate) loyE.value = storeSettings.loyaltyEarnRate;
                let loyV = document.getElementById('setting-loyalty-value'); if(loyV && storeSettings.loyaltyRedeemValue) loyV.value = storeSettings.loyaltyRedeemValue;
                let autoEl = document.getElementById('setting-auto-reply'); if(autoEl) autoEl.value = storeSettings.autoReplyMessage || ''; let wallEl = document.getElementById('setting-wallet-number'); if(wallEl) wallEl.value = storeSettings.walletNumber || ''; let fbEl = document.getElementById('setting-fb-pixel'); if(fbEl) fbEl.value = storeSettings.fbPixelId || ''; let ttEl = document.getElementById('setting-tt-pixel'); if(ttEl) ttEl.value = storeSettings.ttPixelId || ''; 
                let fsInp = document.getElementById('setting-free-shipping'); if(fsInp && storeSettings.freeShippingThreshold) fsInp.value = storeSettings.freeShippingThreshold; }
            let chWall = document.getElementById('checkout-wallet-number'); if(chWall) chWall.textContent = storeSettings.walletNumber || '01018631768';
            const floatingContainer = document.getElementById('floating-menu-container'), footerSocialContainer = document.getElementById('footer-social-links'), adminBtnsList = document.getElementById('admin-floating-btns-list');
            if(floatingContainer) floatingContainer.innerHTML = ''; if(footerSocialContainer) footerSocialContainer.innerHTML = ''; if(adminBtnsList) adminBtnsList.innerHTML = '';
            
            let currentBtns = storeSettings.floatingButtons || [];
            if(!currentBtns.find(b => b.link === '#support')) {
                currentBtns.unshift({ id: 'btn_support', icon: '💬', link: '#support', color: '#007bff', isSystem: true, title: 'خدمة العملاء' });
            }
            currentBtns.forEach((btn, index) => {

                if(btn.link === '#support') { if(floatingContainer) floatingContainer.innerHTML += `<button type="button" class="float-btn" style="background-color: ${btn.color};" title="${btn.title}" onclick="window.showPanel('support')">${btn.icon}</button>`; } else { if(floatingContainer) floatingContainer.innerHTML += `<a href="${btn.link}" target="_blank" class="float-btn" style="background-color: ${btn.color};" title="${btn.title}">${btn.icon}</a>`; if(footerSocialContainer) footerSocialContainer.innerHTML += `<div>${btn.icon} <a href="${btn.link}" target="_blank" style="color:#ddd; text-decoration:none;">${btn.title}</a></div>`; }
                if(btn.isSystem) { if(adminBtnsList) adminBtnsList.innerHTML += `<div style="background:var(--input-bg); padding:10px; border:1px solid var(--border-color); border-radius:8px; margin-bottom:5px;">${btn.icon} <strong>${btn.title}</strong> (أساسي)</div>`; } else { if(adminBtnsList) adminBtnsList.innerHTML += `<div style="background:var(--input-bg); padding:10px; border:1px solid var(--border-color); border-radius:8px; display:flex; gap:10px; align-items:center; flex-wrap:wrap; margin-bottom:5px;"><span>${btn.icon} <strong>${btn.title}</strong></span><input type="url" value="${btn.link}" id="edit-float-link-${index}" style="flex:1; padding:5px; margin:0; min-width:150px;"><button type="button" class="btn-info" style="border:none; padding:5px 10px; border-radius:4px;" onclick="window.updateFloatingBtn(${index})">تحديث</button><button type="button" class="btn-danger" style="border:none; padding:5px 10px; border-radius:4px;" onclick="window.removeFloatingBtn(${index})">حذف</button></div>`; }
            });
            let filterHtml = `<button type="button" class="filter-btn ${currentCategoryFilter === 'الكل' ? 'active' : ''}" onclick="window.filterProducts('الكل')">الكل</button>`; let selectHtml = `<option value="" disabled selected>اختر القسم...</option>`; let adminListHtml = ''; let sidebarCatsHtml = '';
            (storeSettings.categories || []).forEach((cat, index) => {
                filterHtml += `<button type="button" class="filter-btn ${currentCategoryFilter === cat ? 'active' : ''}" onclick="window.filterProducts('${cat}')">${cat}</button>`; selectHtml += `<option value="${cat}">${cat}</option>`; adminListHtml += `<div style="background:var(--input-bg); padding:5px 10px; border:1px solid var(--border-color); border-radius:20px; display:flex; align-items:center; gap:8px;">${cat} <button type="button" class="btn-danger" style="border:none; border-radius:50%; width:20px; height:20px; font-size:10px; cursor:pointer;" onclick="window.removeCategory(${index})">X</button></div>`; sidebarCatsHtml += `<button type="button" class="btn btn-outline" style="width: 100%; border-color: var(--border-color); color: var(--text-color); text-align: right;" onclick="window.filterProducts('${cat}'); window.closeSidebar(); window.showPanel('home');">📂 ${cat}</button>`;
            });
            let cfc = document.getElementById('category-filters-container'); if(cfc) cfc.innerHTML = filterHtml; let pc = document.getElementById('product-category'); if(pc) pc.innerHTML = selectHtml; let acl = document.getElementById('admin-categories-list'); if(acl) acl.innerHTML = adminListHtml; let scl = document.getElementById('sidebar-categories-list'); if(scl) scl.innerHTML = sidebarCatsHtml;
            window.renderProducts(false);
        }

        window.saveSettings = async function() { 
            const newAutoReply = document.getElementById('setting-auto-reply') ? document.getElementById('setting-auto-reply').value.trim() : storeSettings.autoReplyMessage; 
            const newWallet = document.getElementById('setting-wallet-number') ? document.getElementById('setting-wallet-number').value.trim() : storeSettings.walletNumber; 
            const newFb = document.getElementById('setting-fb-pixel') ? document.getElementById('setting-fb-pixel').value.trim() : storeSettings.fbPixelId; 
            const newTt = document.getElementById('setting-tt-pixel') ? document.getElementById('setting-tt-pixel').value.trim() : storeSettings.ttPixelId; 
            const newCrossSell = document.getElementById('setting-cross-sell') ? document.getElementById('setting-cross-sell').checked : true;
            
            const earnEl = document.getElementById('setting-loyalty-earn'); const lEarn = earnEl ? (parseInt(earnEl.value) || 20) : 20;
            const redeemEl = document.getElementById('setting-loyalty-value'); const lRedeem = redeemEl ? (parseInt(redeemEl.value) || 10) : 10;
            const fsEl = document.getElementById('setting-free-shipping'); const fsThresh = fsEl ? (Number(fsEl.value) || 1000) : 1000;
            
            try {
                await updateDoc(doc(db, 'settings', 'main'), { 
                    autoReplyMessage: newAutoReply, 
                    walletNumber: newWallet, 
                    fbPixelId: newFb, 
                    ttPixelId: newTt, 
                    enableCrossSell: newCrossSell, 
                    freeShippingThreshold: fsThresh, 
                    loyaltyEarnRate: lEarn, 
                    loyaltyRedeemValue: lRedeem 
                }); 
                window.showToast('تم الحفظ بنجاح', 'success'); 
                window.injectPixels(); 
            } catch(e) {
                window.showToast('فشل الحفظ', 'error');
                console.error(e);
            }
        };
        window.addCategory = async function() { const newCat = document.getElementById('new-category-input').value.trim(); if(newCat && !(storeSettings.categories||[]).includes(newCat)) { let updatedCats = [...(storeSettings.categories||[]), newCat]; await updateDoc(doc(db, 'settings', 'main'), { categories: updatedCats }); document.getElementById('new-category-input').value = ''; window.showToast('تم الإضافة', 'success'); } };
        window.removeCategory = async function(index) { if(confirm('حذف القسم؟')) { let updatedCats = storeSettings.categories.filter((_, i) => i !== index); await updateDoc(doc(db, 'settings', 'main'), { categories: updatedCats }); window.showToast('تم الحذف', 'success'); } };
        window.addPromoCode = async function() { const code = document.getElementById('new-promo-code').value.trim().toUpperCase(), discount = parseInt(document.getElementById('new-promo-discount').value); if(code && discount > 0 && discount <= 100) { await addDoc(collection(db, 'promoCodes'), { code, discount }); document.getElementById('new-promo-code').value = ''; document.getElementById('new-promo-discount').value = ''; window.showToast('تمت الإضافة', 'success'); } };
        window.removePromo = async function(id) { if(confirm('حذف الكوبون؟')) { await deleteDoc(doc(db, 'promoCodes', id)); window.showToast('تم الحذف', 'success'); } };
        
        window.applyPromoCodeCart = function() {
            let inputCode = document.getElementById('promo-code-input-cart').value.trim().toUpperCase();
            window.executePromoLogic(inputCode, 'cart');
        };
        window.applyPromoCode = function() {
            let inputCode = document.getElementById('promo-code-input').value.trim().toUpperCase();
            window.executePromoLogic(inputCode, 'checkout');
        };
        
        window.executePromoLogic = function(inputCode, source) {
            let promo = promoCodesList.find(p => p.code === inputCode);
            if(promo) { 
                currentDiscountPercent = promo.discount; appliedPromoCode = promo.code; 
                let pMsg1 = document.getElementById('promo-msg-cart'); if(pMsg1) { pMsg1.textContent = `✅ تم تفعيل خصم ${promo.discount}%`; pMsg1.style.color = '#2a9d8f'; } 
                let pMsg2 = document.getElementById('promo-msg'); if(pMsg2) { pMsg2.textContent = `✅ تم تفعيل خصم ${promo.discount}%`; pMsg2.style.color = '#2a9d8f'; } 
                
                let pInput1 = document.getElementById('promo-code-input-cart'); if(pInput1) pInput1.value = promo.code;
                let pInput2 = document.getElementById('promo-code-input'); if(pInput2) pInput2.value = promo.code;
                
                window.updateInvoiceUI(); window.showToast('تم التفعيل', 'success'); 
            } else { 
                currentDiscountPercent = 0; appliedPromoCode = ""; 
                let pMsg1 = document.getElementById('promo-msg-cart'); if(pMsg1) { pMsg1.textContent = `❌ كود غير صالح`; pMsg1.style.color = 'var(--danger)'; } 
                let pMsg2 = document.getElementById('promo-msg'); if(pMsg2) { pMsg2.textContent = `❌ كود غير صالح`; pMsg2.style.color = 'var(--danger)'; } 
                window.updateInvoiceUI(); 
            }
        };


        const govSelect = document.getElementById('order-gov'), citySelect = document.getElementById('order-city');
        if(govSelect && citySelect) {
            govSelect.innerHTML = '<option value="" disabled selected>اختر المحافظة...</option>'; for (let gov in deliveryData) { let option = document.createElement('option'); option.value = gov; option.textContent = gov; govSelect.appendChild(option); }
            govSelect.addEventListener('change', function() { const data = deliveryData[this.value]; let citiesHtml = '<option value="" disabled selected>اختر المركز/المدينة...</option>'; data.cities.forEach(city => { citiesHtml += `<option value="${city}">${city}</option>`; }); citiesHtml += `<option value="مدينة أخرى">أخرى (تُكتب بالعنوان التفصيلي)</option>`; citySelect.innerHTML = citiesHtml; citySelect.disabled = false; currentShippingCost = data.shippingCost; window.updateInvoiceUI(); });
        }
        
        window.updateInvoiceUI = function() { 
            let discountVal = Math.round(currentSubtotal * (currentDiscountPercent / 100)) + window.loyaltyDiscountFixed; 
            let targetAmount = (storeSettings && storeSettings.freeShippingThreshold) ? storeSettings.freeShippingThreshold : 1000;
            let finalShipping = currentShippingCost;
            if(currentSubtotal >= targetAmount) finalShipping = 0;
            let finalTot = (currentSubtotal - discountVal) + finalShipping;
            if(finalTot < 0) finalTot = 0;

            document.querySelectorAll('#invoice-subtotal, .invoice-subtotal-val').forEach(el => el.textContent = currentSubtotal);
            document.querySelectorAll('#invoice-discount, .invoice-discount-val').forEach(el => el.textContent = discountVal);
            document.querySelectorAll('#invoice-shipping, .invoice-shipping-val').forEach(el => el.textContent = finalShipping);
            document.querySelectorAll('#invoice-total, .invoice-total-val, #cart-total').forEach(el => el.textContent = finalTot);

            document.querySelectorAll('#discount-row, .discount-row-val').forEach(dr => {
                if(discountVal > 0) {
                    dr.style.display = 'flex';
                    let desc = [];
                    if(currentDiscountPercent > 0) desc.push(`كوبون (${appliedPromoCode})`);
                    if(window.loyaltyDiscountFixed > 0) desc.push("نقاط الولاء");
                    dr.innerHTML = `<span class="translatable discount-desc" style="color:var(--danger); font-weight:bold;">خصم (${desc.join(' + ')}):</span><span style="color:var(--danger); font-weight:bold;">-<span class="invoice-discount-val">${discountVal}</span> ج</span>`;
                } else {
                    dr.style.display = 'none';
                }
            });
            
            let btnCnlPromo = document.getElementById('btn-cancel-promo');
            if(btnCnlPromo) btnCnlPromo.style.display = currentDiscountPercent > 0 ? 'block' : 'none';
            
            let btnRdmLoyalty = document.getElementById('btn-redeem-loyalty');
            let btnCnlLoyalty = document.getElementById('btn-cancel-loyalty');
            if(btnRdmLoyalty && btnCnlLoyalty) {
                if(window.loyaltyPointsUsedTemp > 0) {
                    btnRdmLoyalty.style.display = 'none';
                    btnCnlLoyalty.style.display = 'inline-block';
                } else {
                    btnRdmLoyalty.style.display = 'inline-block';
                    btnCnlLoyalty.style.display = 'none';
                }
            }
        }
        
        window.removeDiscount = async function() {
            if(window.loyaltyPointsUsedTemp > 0 && currentUser) {
                try {
                    await updateDoc(doc(db, 'users', currentUser.uid), {
                        loyaltyPoints: increment(window.loyaltyPointsUsedTemp),
                        unreadNotifs: increment(1),
                        notifications: arrayUnion({title: 'إلغاء الخصم 🔄', message: `تم استرجاع ${window.loyaltyPointsUsedTemp} نقطة لإلغائك الخصم من السلة.`, date: new Date().toISOString()})
                    });
                    window.showToast('تم إلغاء الخصم واسترجاع النقاط', 'info');
                } catch(e) {}
            } else if (currentDiscountPercent > 0) {
                window.showToast('تم إلغاء الكوبون', 'info');
            }
            
        window.hashString = async function(str) {
            const buffer = new TextEncoder().encode(str);
            const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        };
        
        window.escapeHTML = function(str) {
            if(!str) return "";
            return String(str).replace(/[&<>'"]/g, tag => ({
                '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
            }[tag]));
        };

        window.loyaltyDiscountFixed = 0;
            window.loyaltyPointsUsedTemp = 0;
            currentDiscountPercent = 0;
            appliedPromoCode = "";
            let pInput1 = document.getElementById('promo-code-input-cart'); if(pInput1) pInput1.value = '';
            let pInput2 = document.getElementById('promo-code-input'); if(pInput2) pInput2.value = '';
            let pMsg1 = document.getElementById('promo-msg-cart'); if(pMsg1) pMsg1.textContent = '';
            let pMsg2 = document.getElementById('promo-msg'); if(pMsg2) pMsg2.textContent = '';
            window.updateInvoiceUI();
        };
window.toEngDigits = function(str) { const ar = ['٠','١','٢','٣','٤','٥','٦','٧','٨','٩']; return str.split('').map(c => ar.indexOf(c) !== -1 ? ar.indexOf(c) : c).join(''); }
        
        let ulrBtn = document.getElementById('btn-unlock-roles'); if(ulrBtn) { ulrBtn.addEventListener('click', async () => { let pin = window.toEngDigits(document.getElementById('roles-pin').value.trim()); let hashed = await window.hashString(pin); if (hashed === "7a2ec40ff8a1247c532309355f798a779e00acff579c63eec3636ffb2902c1ac") { document.getElementById('roles-auth-section').style.display = 'none'; document.getElementById('roles-content-section').style.display = 'block'; document.getElementById('roles-pin').value = ''; window.showToast('تم الفتح', 'success'); } else { window.showToast("رمز خاطئ!", 'error'); } }); }
        let fprBtn = document.getElementById('btn-forgot-roles-pin'); if(fprBtn) { fprBtn.addEventListener('click', async () => { let nid = prompt("الرقم القومي:"); if (nid) { let hashedNid = await window.hashString(window.toEngDigits(nid.trim())); if (hashedNid === "2d622f2c91074a475800b09968b837412b3a12f26519ca815feb9b0b1ad9a715") { document.getElementById('roles-auth-section').style.display = 'none'; document.getElementById('roles-content-section').style.display = 'block'; window.showToast('تم الدخول بنجاح', 'success'); } else { window.showToast('رقم قومي خاطئ', 'error'); } } }); }
        let lrBtn = document.getElementById('btn-lock-roles'); if(lrBtn) { lrBtn.addEventListener('click', () => { document.getElementById('roles-content-section').style.display = 'none'; document.getElementById('roles-auth-section').style.display = 'block'; }); }

        window.resetAdminRevenue = async function() { let pin = prompt("أدخل رمز الأمان للمؤسس لتصفير الأرباح فقط 🔄:"); if (pin) { let hashed = await window.hashString(window.toEngDigits(pin.trim())); if (hashed === "7a2ec40ff8a1247c532309355f798a779e00acff579c63eec3636ffb2902c1ac") { try { let newResetDate = new Date().toISOString(); await setDoc(doc(db, 'settings', 'main'), { revenueResetDate: newResetDate }, { merge: true }); window.showToast('تم تصفير الأرباح بنجاح', 'success'); window.loadAdminOrders(); } catch(e) { window.showToast('حدث خطأ أثناء التصفير', 'error'); } } else { window.showToast('رمز الأمان غير صحيح!', 'error'); } } };
        window.resetAdminOrdersCount = async function() { let pin = prompt("أدخل رمز الأمان للمؤسس لتصفير الطلبات فقط 🔄:"); if (pin) { let hashed = await window.hashString(window.toEngDigits(pin.trim())); if (hashed === "7a2ec40ff8a1247c532309355f798a779e00acff579c63eec3636ffb2902c1ac") { try { let newResetDate = new Date().toISOString(); await setDoc(doc(db, 'settings', 'main'), { ordersResetDate: newResetDate }, { merge: true }); window.showToast('تم تصفير الطلبات بنجاح', 'success'); window.loadAdminOrders(); } catch(e) { window.showToast('حدث خطأ أثناء التصفير', 'error'); } } else { window.showToast('رمز الأمان غير صحيح!', 'error'); } } };

        window.loadAdminReturns = function() {
            if(adminReturnsUnsubscribe) return;
            adminReturnsUnsubscribe = onSnapshot(query(collection(db, 'return_requests'), orderBy('date', 'desc')), (snapshot) => {
                adminReturnsArray = []; let container = document.getElementById('admin-returns-container'); let html = '';
                snapshot.forEach(docSnap => {
                    let d = docSnap.data(); adminReturnsArray.push({id: docSnap.id, ...d}); let imgHtml = d.imageUrl ? `<a href="${d.imageUrl}" target="_blank" style="display:inline-block; margin-top:10px; padding:5px 10px; background:#17a2b8; color:white; text-decoration:none; border-radius:6px; font-size:0.85rem;">📸 عرض صورة المشكلة</a>` : ''; let actionBtn = d.status === 'قيد المراجعة' ? `<button type="button" class="btn btn-full" style="background:#28a745; margin-top:10px;" onclick="window.approveReturn('${docSnap.id}', '${d.orderId}')">الموافقة وإرسال مندوب ✅</button>` : `<div style="margin-top:10px; font-weight:bold; color:var(--primary); text-align:center;">تم الموافقة على الطلب</div>`;
                    html += `<div class="admin-msg-card" style="border-left:4px solid var(--danger);"><h4>رقم الطلب الأصلي: #${d.orderId.slice(0,6).toUpperCase()}</h4><p><strong>العميل:</strong> ${d.customerEmail}</p><p><strong>السبب:</strong> ${d.reason}</p><p style="color:var(--text-muted);"><strong>الملاحظات:</strong> ${d.notes}</p><p><strong>التاريخ:</strong> ${new Date(d.date).toLocaleString('ar-EG')}</p>${imgHtml}${actionBtn}</div>`;
                });
                if(container) container.innerHTML = html || '<h3 style="text-align: center; color: var(--text-muted);">لا توجد طلبات استرجاع حالياً.</h3>'; 
            });
        }

        window.approveReturn = async function(returnId, orderId) { if(confirm('الموافقة على الاسترجاع وإرسال إشعار للعميل بموعد المندوب؟')) { try { await updateDoc(doc(db, 'return_requests', returnId), { status: 'تمت الموافقة' }); await updateDoc(doc(db, 'orders', orderId), { status: 'جاري الاسترجاع 🔄' }); await addDoc(collection(db, 'global_notifications'), { message: `تم الموافقة على طلب الاسترجاع الخاص بك للطلب #${orderId.slice(0,6).toUpperCase()}. سيتواصل معك المندوب قريباً.`, timestamp: new Date().toISOString() }); window.showToast('تم الموافقة على الطلب', 'success'); } catch(e) { window.showToast('حدث خطأ', 'error'); } } }

        window.loadAdminOrders = function() {
            if(adminOrdersUnsubscribe) adminOrdersUnsubscribe(); 
            adminOrdersUnsubscribe = onSnapshot(query(collection(db, 'orders'), orderBy('orderDate', 'desc')), (snapshot) => { 
                adminOrdersArray = []; totalGlobalRevenue = 0; totalGlobalOrders = 0;
                let revResetDateStr = storeSettings.revenueResetDate || "2000-01-01T00:00:00.000Z"; let ordResetDateStr = storeSettings.ordersResetDate || "2000-01-01T00:00:00.000Z"; let revResetDate = new Date(revResetDateStr); let ordResetDate = new Date(ordResetDateStr);
                snapshot.forEach(docSnap => { 
                    let d = docSnap.data(); adminOrdersArray.push({id: docSnap.id, ...d}); 
                    if(d.status !== "تم الرفض" && d.status !== "ملغى من العميل ❌" && d.status !== "تم الرفض ❌") { let orderDate = new Date(d.orderDate); if(orderDate >= revResetDate) { totalGlobalRevenue += Number(d.totalAmount); } if(orderDate >= ordResetDate) { totalGlobalOrders++; } } 
                }); 
                window.renderAdminOrdersUI();  
                let so = document.getElementById('stat-orders'); if(so) so.textContent = totalGlobalOrders; let sr = document.getElementById('stat-revenue'); if(sr) sr.textContent = totalGlobalRevenue.toLocaleString() + ' ج'; 
            });
        }

        
        window.updateOrderStatus = async function(orderId, newStatus) { 
            await updateDoc(doc(db, 'orders', orderId), { status: newStatus }); 
            window.showToast('تم تحديث الحالة', 'success'); 
            let oData = adminOrdersArray.find(o => o.id === orderId);
            if(oData && oData.userId) {
                try {
                    await updateDoc(doc(db, 'users', oData.userId), {
                        unreadNotifs: increment(1),
                        notifications: arrayUnion({title: 'تحديث حالة الطلب 📦', message: `تم تحديث حالة طلبك #${orderId.slice(0,6).toUpperCase()} إلى: ${newStatus}`, date: new Date().toISOString()})
                    });
                } catch(e) {}
            }
            if(newStatus === 'تم التوصيل ✅' && oData && oData.userId && !oData.pointsAdded) {
                let earnRate = window.loyaltyEarnRateActual || 20;
                let pts = Math.floor((oData.totalAmount - (oData.shippingCost || 0)) / earnRate); 
                if(pts > 0) {
                    try {
                        await updateDoc(doc(db, 'users', oData.userId), { 
                            loyaltyPoints: increment(pts), unreadNotifs: increment(1),
                            notifications: arrayUnion({title: 'نقاط ولاء جديدة 🎁', message: `مبروك! حصلت على ${pts} نقطة لإتمام طلبك.`, date: new Date().toISOString()})
                        });
                        await updateDoc(doc(db, 'orders', orderId), { pointsAdded: true });
                    } catch(e){}
                }
            }
        }
let adminUsersUnsubscribe = null;
        window.loadAdminUsers = function() {
            if(adminUsersUnsubscribe) adminUsersUnsubscribe();
            adminUsersUnsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
                let container = document.getElementById('admin-users-container');
                if(!container) return;
                let usersList = [];
                snapshot.forEach(doc => { usersList.push({id: doc.id, ...doc.data()}); });
                usersList.sort((a,b) => new Date(b.lastLogin || 0) - new Date(a.lastLogin || 0));

                if(usersList.length === 0) {
                    container.innerHTML = '<h3 style="text-align:center; color:var(--text-muted);">لا يوجد عملاء مسجلين.</h3>'; return;
                }
                let html = '';
                usersList.forEach(u => {
                    let loginDate = u.lastLogin ? new Date(u.lastLogin).toLocaleString('ar-EG') : 'غير محدد';
                    html += `<div class="admin-msg-card" style="border-right: 4px solid #6f42c1; cursor:pointer;" onclick="window.showUserHistory('${u.id}', '${(u.name || 'عميل').replace(/'/g, "\'")}')">
                        <h4 style="margin:0 0 5px 0; color:var(--primary);">👤 ${u.name || 'عميل بدون اسم'}</h4>
                        <p style="margin: 3px 0;"><strong>التواصل:</strong> ${u.email || u.phone1 || 'غير متوفر'}</p>
                        <p style="margin: 3px 0;"><strong>المحافظة:</strong> ${u.gov || 'غير محدد'} - ${u.city || ''}</p>
                        <p style="margin: 3px 0; color:var(--text-muted); font-size:0.85rem;"><strong>آخر دخول:</strong> ${loginDate}</p>
                    </div>`;
                });
                container.innerHTML = html;
            });
        }

        
        
        
        

        window.updateAdminUI = function() { 
            if (currentUser) { 
                isCurrentUserAdmin = SUPER_ADMINS.includes((currentUser.email || '').toLowerCase()) || dynamicAdmins.includes((currentUser.email || '').toLowerCase()) || (currentUser.phoneNumber && SUPER_ADMINS.includes(currentUser.phoneNumber)); 
                document.querySelectorAll('.admin-tab').forEach(tab => tab.style.display = isCurrentUserAdmin ? 'inline-block' : 'none'); 
                let activePanel = document.querySelector('.panel.active');
                if(!isCurrentUserAdmin && activePanel && ['admin', 'admin-orders', 'admin-messages', 'admin-dashboard', 'admin-returns', 'admin-users'].includes(activePanel.id.replace('-panel',''))) { window.showPanel('home'); }
                if(isCurrentUserAdmin) { window.loadAdminOrders(); window.loadAdminReturns(); window.loadAdminUsers(); }
            } else { 
                isCurrentUserAdmin = false; document.querySelectorAll('.admin-tab').forEach(tab => tab.style.display = 'none'); 
                if(adminOrdersUnsubscribe) { adminOrdersUnsubscribe(); adminOrdersUnsubscribe = null; } if(adminReturnsUnsubscribe) { adminReturnsUnsubscribe(); adminReturnsUnsubscribe = null; } if(adminUsersUnsubscribe) { adminUsersUnsubscribe(); adminUsersUnsubscribe = null; }
            } window.applySettingsToUI(); window.renderProducts(false); 
        }
        
        onSnapshot(collection(db, 'admins'), (snapshot) => { dynamicAdmins = []; dynamicAdminsList = []; snapshot.forEach(doc => { dynamicAdmins.push(doc.data().email.toLowerCase()); dynamicAdminsList.push({ id: doc.id, email: doc.data().email.toLowerCase() }); }); window.updateAdminUI(); window.renderAdminsList(); });
        window.renderAdminsList = function() { let html = '<ul style="line-height:2;">'; SUPER_ADMINS.forEach(email => { html += `<li><strong>${email}</strong> <span style="color:#28a745; font-size:0.8rem;">(مؤسس)</span></li>`; }); dynamicAdminsList.forEach(admin => { html += `<li><strong>${admin.email}</strong> <button type="button" class="btn-danger" style="padding: 2px 6px; font-size: 0.8rem; border-radius:4px; border:none; cursor:pointer;" onclick="window.removeAdmin('${admin.id}')">حذف</button></li>`; }); let listCont = document.getElementById('admins-list-container'); if(listCont) listCont.innerHTML = html + '</ul>'; }
        
        let aForm = document.getElementById('add-admin-form');
        if(aForm) { aForm.addEventListener('submit', async (e) => { e.preventDefault(); const newEmail = document.getElementById('new-admin-email').value.trim().toLowerCase(); if (!SUPER_ADMINS.includes(newEmail) && !dynamicAdmins.includes(newEmail)) { await addDoc(collection(db, 'admins'), { email: newEmail }); document.getElementById('new-admin-email').value = ''; window.showToast('تم الإضافة', 'success'); } }); }
        window.removeAdmin = async function(id) { if(confirm('حذف؟')) await deleteDoc(doc(db, 'admins', id)); }

        onAuthStateChanged(auth, async (user) => {
            currentUser = user;
            if (user) {
                
                let displayTxt = user.displayName || (user.email ? user.email.split('@')[0] : user.phoneNumber);
                let ud = document.getElementById('user-email-display'); if(ud) ud.textContent = displayTxt; 
                let um = document.getElementById('user-menu-container'); if(um) um.style.display = 'block'; 
                let bs = document.getElementById('btn-show-auth'); if(bs) bs.style.display = 'none'; 
                let sa = document.getElementById('sidebar-account-section'); if(sa) sa.style.display = 'block'; 
                let ssw = document.getElementById('sidebar-switch-accounts-section'); if(ssw) ssw.style.display = 'block';
                let co = document.getElementById('nav-customer-orders'); if(co) co.style.display = 'inline-block'; 
                let sp = document.getElementById('nav-support'); if(sp) sp.style.display = 'inline-block'; 
                
                // إخفاء رسالة طلب الدخول فوراً
                let sm = document.getElementById('support-auth-msg'); if(sm) sm.style.display = 'none'; 
                let sc = document.getElementById('support-content'); if(sc) sc.style.display = 'block'; 
                let lm = document.getElementById('login-to-review-msg'); if(lm) lm.style.display = 'none'; 
                let ar = document.getElementById('add-review-section'); if(ar) ar.style.display = 'block';

                window.updateAdminUI(); 
                window.loadCustomerOrders(); 
                window.loadCustomerChat(); 
                window.loadUserNotifications();
                
                if(SUPER_ADMINS.includes((user.email || '').toLowerCase()) || dynamicAdmins.includes((user.email || '').toLowerCase())) { window.loadAdminChats(); }
try { 
                    const userDoc = await getDoc(doc(db, 'users', user.uid)); 
                    if(userDoc.exists()) { 
                        const data = userDoc.data(); 
                        let oname = document.getElementById('order-name'); if(oname) oname.value = data.name || ''; let ophone = document.getElementById('order-phone1'); if(ophone) ophone.value = data.phone1 || user.phoneNumber || ''; let ophone2 = document.getElementById('order-phone2'); if(ophone2) ophone2.value = data.phone2 || ''; let oaddr = document.getElementById('order-address'); if(oaddr) oaddr.value = data.address || ''; if(data.gov) { let og = document.getElementById('order-gov'); if(og) { og.value = data.gov; og.dispatchEvent(new Event('change')); setTimeout(() => { let oc = document.getElementById('order-city'); if(oc && data.city) oc.value = data.city; }, 100); } } 
                        if(data.cart && data.cart.length > 0) { cart = data.cart; localStorage.setItem('cart', JSON.stringify(cart)); }
                        if(data.savedForLater && data.savedForLater.length > 0) { savedForLater = data.savedForLater; localStorage.setItem('savedForLater', JSON.stringify(savedForLater)); }
                    } 
                    await setDoc(doc(db, 'users', user.uid), { email: user.email || user.phoneNumber || 'غير مسجل', name: user.displayName || (userDoc.exists() ? userDoc.data().name : ''), lastLogin: new Date().toISOString() }, { merge: true });
                } catch(err) {}
                
                window.renderSavedAccounts(); let activeP = document.querySelector('.panel.active'); if(activeP && activeP.id === 'auth-panel') window.showPanel('home');
            } else {
                let um = document.getElementById('user-menu-container'); if(um) um.style.display = 'none'; let bs = document.getElementById('btn-show-auth'); if(bs) bs.style.display = 'inline-block'; 
                let sa = document.getElementById('sidebar-account-section'); if(sa) sa.style.display = 'none'; let ssw = document.getElementById('sidebar-switch-accounts-section'); if(ssw) ssw.style.display = 'none';
                let co = document.getElementById('nav-customer-orders'); if(co) co.style.display = 'none'; let sp = document.getElementById('nav-support'); if(sp) sp.style.display = 'none'; 
                window.updateAdminUI(); 
                let sm = document.getElementById('support-auth-msg'); if(sm) sm.style.display = 'block'; let sc = document.getElementById('support-content'); if(sc) sc.style.display = 'none'; let lm = document.getElementById('login-to-review-msg'); if(lm) lm.style.display = 'block'; let ar = document.getElementById('add-review-section'); if(ar) ar.style.display = 'none'; let cf = document.getElementById('checkout-form'); if(cf) cf.reset(); 
                let og = document.getElementById('order-gov'); if(og) og.dispatchEvent(new Event('change')); 
                let activeP = document.querySelector('.panel.active'); if(activeP && ['customer-orders-panel', 'support-panel'].includes(activeP.id)) window.showPanel('home');
                if(unsubscribeUserChat) { unsubscribeUserChat(); unsubscribeUserChat = null; } if(unsubscribeActiveAdminChat) { unsubscribeActiveAdminChat(); unsubscribeActiveAdminChat = null; }
            } window.updateCartUI(); 
        });

        let auForm = document.getElementById('auth-form');
        if(auForm) { auForm.addEventListener('submit', (e) => { e.preventDefault(); const email = document.getElementById('auth-email').value, password = document.getElementById('auth-password').value; if (isLoginMode) { signInWithEmailAndPassword(auth, email, password).then(() => { window.saveAccountLocally(email, password); document.getElementById('auth-form').reset(); window.showToast('تم الدخول بنجاح', 'success'); window.showPanel('home'); }).catch(() => window.showToast("بيانات الدخول غير صحيحة", 'error')); } else { createUserWithEmailAndPassword(auth, email, password).then(() => { window.saveAccountLocally(email, password); window.showToast("تم إنشاء الحساب بنجاح!", 'success'); document.getElementById('auth-form').reset(); window.showPanel('home'); }).catch(() => window.showToast("حدث خطأ في التسجيل", 'error')); } }); }

        let atMode = document.getElementById('auth-toggle-mode');
        if(atMode) { atMode.addEventListener('click', () => { isLoginMode = !isLoginMode; let at = document.getElementById('auth-title'); if(at) at.textContent = isLoginMode ? "تسجيل الدخول" : "حساب جديد"; let asb = document.getElementById('auth-submit-btn'); if(asb) asb.textContent = isLoginMode ? "دخول" : "تسجيل"; let atm = document.getElementById('auth-toggle-mode'); if(atm) atm.textContent = isLoginMode ? "ليس لديك حساب؟ أنشئ حساباً" : "لديك حساب؟ سجل الدخول"; let afp = document.getElementById('auth-forgot-password'); if(afp) afp.style.display = isLoginMode ? "block" : "none"; }); }
        
        window.applyAdvancedFilters = function() { currentRenderedProducts = productsPerPage; window.renderProducts(); };
        window.filterProducts = function(category) { currentCategoryFilter = category; document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active')); if(event && event.target && event.target.classList) event.target.classList.add('active'); currentRenderedProducts = productsPerPage; window.renderProducts(); }
        
        onSnapshot(collection(db, 'products'), (snapshot) => { products = []; snapshot.forEach(doc => products.push({ id: doc.id, ...doc.data() })); products.sort((a,b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)); isProductsLoaded = true; window.renderProducts(false); if(document.getElementById('wishlist-panel') && document.getElementById('wishlist-panel').classList.contains('active')) window.renderWishlist(); });

        window.toggleWishlist = function(event, id) { event.stopPropagation(); const index = wishlist.indexOf(id); if(index > -1) { wishlist.splice(index, 1); window.showToast('تم الحذف من المفضلة'); } else { wishlist.push(id); window.showToast('تمت الإضافة للمفضلة ❤️', 'success'); } localStorage.setItem('wishlist', JSON.stringify(wishlist)); window.renderProducts(false); if(document.getElementById('wishlist-panel') && document.getElementById('wishlist-panel').classList.contains('active')) window.renderWishlist(); }

        window.getFilteredProductsCount = function() { let minP = document.getElementById('min-price'); let minPrice = minP ? (Number(minP.value) || 0) : 0; let maxP = document.getElementById('max-price'); let maxPrice = maxP ? (Number(maxP.value) || Infinity) : Infinity; if(maxPrice === 0) maxPrice = Infinity; let filteredProducts = products.filter(p => { let inCategory = (currentCategoryFilter === 'الكل' || (p.category || 'أخرى') === currentCategoryFilter); let inSearch = window.fuzzyMatch(p.name, searchQuery); let inPrice = p.price >= minPrice && p.price <= maxPrice; return inCategory && inSearch && inPrice; }); return filteredProducts.length; }

        window.renderProducts = function(scrollToTop = true) {
            let container = document.getElementById('products-container'); if(!container) return;
            if (!isProductsLoaded) { let skeletonHtml = `<div class="skeleton-card"><div class="skeleton-img"></div><div class="skeleton-text"></div><div class="skeleton-text short"></div><div class="skeleton-btn"></div></div>`.repeat(8); container.innerHTML = skeletonHtml; return; }
            let sOpt = document.getElementById('sort-options'); let sortOption = sOpt ? sOpt.value : 'default'; let minP = document.getElementById('min-price'); let minPrice = minP ? (Number(minP.value) || 0) : 0; let maxP = document.getElementById('max-price'); let maxPrice = maxP ? (Number(maxP.value) || Infinity) : Infinity; if(maxPrice === 0) maxPrice = Infinity;
            let filteredProducts = products.filter(p => { let inCategory = (currentCategoryFilter === 'الكل' || (p.category || 'أخرى') === currentCategoryFilter); let inSearch = window.fuzzyMatch(p.name, searchQuery); let inPrice = p.price >= minPrice && p.price <= maxPrice; return inCategory && inSearch && inPrice; });
            if(sortOption === 'price-asc') { filteredProducts.sort((a,b) => a.price - b.price); } else if(sortOption === 'price-desc') { filteredProducts.sort((a,b) => b.price - a.price); } else if(sortOption === 'rating-desc') { filteredProducts.sort((a,b) => { let rA = a.reviews && a.reviews.length>0 ? a.reviews.reduce((acc, r)=>acc+r.rating,0)/a.reviews.length : 0; let rB = b.reviews && b.reviews.length>0 ? b.reviews.reduce((acc, r)=>acc+r.rating,0)/b.reviews.length : 0; return rB - rA; }); }
            if(filteredProducts.length === 0) { let msg = window.currentLang === 'ar' ? 'لا توجد منتجات مطابقة للبحث أو الفلتر.' : 'No products match your search or filter.'; container.innerHTML = `<h3 style="text-align: center; grid-column: 1 / -1; color: var(--text-muted);">${msg}</h3>`; return; }
            
            let paginatedProducts = filteredProducts.slice(0, currentRenderedProducts); let htmlContent = '';
            
            paginatedProducts.forEach(product => {
                let safeName = product.name.replace(/'/g, "\\'"); let categoryLabel = product.category || 'أخرى';
                let avgRating = 5; if(product.reviews && product.reviews.length > 0) { let total = 0; product.reviews.forEach(r => total += r.rating); avgRating = (total / product.reviews.length).toFixed(1); }
                let adminBtns = currentUser && isCurrentUserAdmin ? `<div style="display:flex; gap:5px; padding: 0 10px; margin-top:5px;"><button type="button" class="btn btn-info" style="flex:1; font-size:0.9rem; padding:5px;" onclick="event.stopPropagation(); window.editProduct('${product.id}')">تعديل</button><button type="button" class="btn btn-danger" style="flex:1; font-size:0.9rem; padding:5px;" onclick="event.stopPropagation(); window.deleteProduct('${product.id}')">حذف</button></div>` : '';
                let vArr = product.variantsData ? product.variantsData : []; let displayPriceText = `${product.price} ج`; if(vArr.length > 0) displayPriceText = `يبدأ من ${vArr[0].price} ج`;
                let priceHtml = `<div class="price">${displayPriceText}</div>`; if(isCurrentUserAdmin && vArr.length === 0) { priceHtml = `<div class="price"><span class="inline-edit-price" contenteditable="true" onclick="event.stopPropagation();" onblur="window.updateProductPriceAdmin('${product.id}', this)">${product.price}</span> ج ✏️</div>`; }
                let discountBadge = ''; let addTxt = window.currentLang === 'ar' ? 'إضافة 🛒' : 'Add 🛒'; let selTxt = window.currentLang === 'ar' ? 'اختر الحجم 🛒' : 'Select 🛒'; let discTxt = window.currentLang === 'ar' ? 'خصم' : 'Off';
                if(product.oldPrice && Number(product.oldPrice) > Number(product.price)) { let discountPercent = Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100); discountBadge = `<span class="discount-badge">${discTxt} ${discountPercent}%</span>`; displayPriceText = `<del style="color:var(--text-muted); font-size:0.9rem; margin-left:5px; font-weight:normal;">${product.oldPrice}</del> ` + displayPriceText; }
                let isWished = wishlist.includes(product.id) ? 'active' : ''; let wishBtnHtml = `<button type="button" class="wishlist-btn ${isWished}" onclick="window.toggleWishlist(event, '${product.id}')">❤</button>`;
                let stockBadge = (product.stock !== undefined && product.stock !== "" && Number(product.stock) <= 0) ? `<div style="color:var(--danger); font-weight:bold; margin-bottom:5px;">نفدت الكمية ❌</div>` : '';
                let addBtnState = (product.stock !== undefined && product.stock !== "" && Number(product.stock) <= 0) ? `disabled style="background:var(--border-color); cursor:not-allowed;"` : `onclick="window.executeAddToCart(event, '${product.id}', '${safeName}');"`;
                let primaryImage = (product.images && product.images.length > 0) ? product.images[0] : (product.imageUrl || 'https://via.placeholder.com/300');
                let videoIcon = product.videoUrl ? `<div style="position:absolute; bottom:50px; right:10px; background:rgba(0,0,0,0.7); padding:5px; border-radius:50%; color:white; font-size:0.8rem; z-index:2;">▶️</div>` : '';
                htmlContent += `<div class="product-card" onclick="window.openProductModal('${product.id}')">${discountBadge}${wishBtnHtml}<span class="category-badge">${categoryLabel}</span><div style="position:relative;"><img loading="lazy" src="${primaryImage}" onerror="this.src='https://via.placeholder.com/300x250?text=صورة'">${videoIcon}</div><div style="padding: 0 10px;"><h3>${product.name}</h3><div class="rating-stars">⭐ ${avgRating}</div>${priceHtml}${stockBadge}<button type="button" class="btn btn-full" style="padding: 8px; font-size:1rem;" ${addBtnState}>${vArr.length > 0 ? selTxt : addTxt}</button></div>${adminBtns}</div>`;
            }); 
            container.innerHTML = htmlContent; if(scrollToTop) window.scrollTo(0,0);
        }

        window.renderWishlist = function() {
            let container = document.getElementById('wishlist-container'); let favProducts = products.filter(p => wishlist.includes(p.id));
            if(favProducts.length === 0) { let msg = window.currentLang === 'ar' ? 'لم تقم بإضافة منتجات للمفضلة بعد.' : 'No products in your wishlist yet.'; container.innerHTML = `<h3 style="text-align: center; grid-column: 1 / -1; color: var(--text-muted);">${msg}</h3>`; return; }
            let htmlContent = '';
            favProducts.forEach(product => {
                let isWished = 'active'; let wishBtnHtml = `<button type="button" class="wishlist-btn ${isWished}" onclick="window.toggleWishlist(event, '${product.id}')">❤</button>`;
                let primaryImage = (product.images && product.images.length > 0) ? product.images[0] : (product.imageUrl || 'https://via.placeholder.com/300');
                let detTxt = window.currentLang === 'ar' ? 'عرض التفاصيل' : 'View Details';
                htmlContent += `<div class="product-card" onclick="window.openProductModal('${product.id}')">${wishBtnHtml}<img loading="lazy" src="${primaryImage}" onerror="this.src='https://via.placeholder.com/300x250?text=صورة'"><div style="padding: 0 10px;"><h3>${product.name}</h3><div class="price">${product.price} ج</div><button type="button" class="btn btn-full" style="padding: 8px; font-size:1rem;">${detTxt}</button></div></div>`;
            }); container.innerHTML = htmlContent;
        }

        window.openProductModal = function(id) {
            const product = products.find(p => p.id === id); if(!product) return; activeProductForReview = product.id;
            let safeSlug = product.name.trim().replace(/\s+/g, '-').replace(/[^a-zA-Z0-9؀-ۿ-]/g, '');
            let newUrl = '?item=' + encodeURIComponent(safeSlug) + '&id=' + id;
            if (window.location.search !== newUrl) {
                window.history.pushState({productId: id}, '', newUrl);
            }
 
            let safeName = product.name.replace(/'/g, "\\'"); window.addRecentlyViewed(product);
            
            let imgs = product.images && product.images.length > 0 ? product.images : (product.imageUrl ? [product.imageUrl] : []);
            let mim = document.getElementById('modal-img-main'); if(mim) mim.src = imgs[0] || 'https://via.placeholder.com/300';
            let galleryHtml = ''; if(product.videoUrl) { galleryHtml += `<div style="width:50px; height:50px; background:#000; color:white; display:flex; align-items:center; justify-content:center; border-radius:8px; cursor:pointer; opacity:0.8; font-size:1.5rem;" onclick="window.open('${product.videoUrl}', '_blank')">▶️</div>`; }
            if(imgs.length > 1) { imgs.forEach((url, i) => { galleryHtml += `<img loading="lazy" src="${url}" class="${i===0?'active':''}" onclick="window.changeMainImg('${url}', this)">`; }); }
            let mgc = document.getElementById('modal-gallery-container'); if(mgc) mgc.innerHTML = galleryHtml;
            
            let viewersCount = Math.floor(Math.random() * (80 - 20 + 1)) + 20; let viewersEl = document.getElementById('live-viewers-count'); if(viewersEl) viewersEl.innerText = viewersCount;
            let mc = document.getElementById('modal-category'); if(mc) mc.textContent = product.category || 'أخرى'; let mt = document.getElementById('modal-title'); if(mt) mt.textContent = product.name; let st = document.getElementById('sticky-title'); if(st) st.textContent = product.name;
            
            activeVariantForCart = null; let vArr = product.variantsData ? product.variantsData : []; let variantContainer = document.getElementById('modal-variants-container'); let variantSelect = document.getElementById('modal-variant-select');
            if(vArr.length > 0) {
                if(variantContainer) variantContainer.style.display = 'block'; let opts = ''; vArr.forEach((v, idx) => { opts += `<option value="${idx}">${v.name} - ${v.price} ج</option>`; }); if(variantSelect) variantSelect.innerHTML = opts;
                activeVariantForCart = { name: vArr[0].name, price: vArr[0].price }; let mp = document.getElementById('modal-price'); if(mp) mp.innerHTML = `<span>${vArr[0].price} ج</span>`; let spr = document.getElementById('sticky-price'); if(spr) spr.innerHTML = `${vArr[0].price} ج`;
            } else {
                if(variantContainer) variantContainer.style.display = 'none'; let mp = document.getElementById('modal-price');
                if(mp) { if(product.oldPrice && Number(product.oldPrice) > Number(product.price)) { mp.innerHTML = `<del style="color:var(--text-muted); font-size:1.1rem;">${product.oldPrice} ج</del> <span>${product.price} ج</span>`; } else { mp.innerHTML = `<span>${product.price} ج</span>`; } }
                let spr = document.getElementById('sticky-price'); if(spr) spr.innerHTML = `${product.price} ج`;
            }

            let ms = document.getElementById('modal-stock');
            if(ms) { if(product.stock !== undefined && product.stock !== "") { let avTxt = window.currentLang === 'ar' ? 'الكمية المتاحة:' : 'In stock:'; let outTxt = window.currentLang === 'ar' ? 'نفدت الكمية ❌' : 'Out of stock ❌'; if(Number(product.stock) > 0) ms.textContent = `${avTxt} ${product.stock}`; else ms.textContent = outTxt; } else { ms.textContent = ''; } }

            let md = document.getElementById('modal-desc'); if(md) md.textContent = product.description || '';
            let avgRating = 5; let reviewsHtml = '';
            if(product.reviews && product.reviews.length > 0) { let total = 0; product.reviews.forEach(r => { total += r.rating; let revImgHtml = r.imageUrl ? `<br><img loading="lazy" src="${r.imageUrl}" class="review-img" onclick="window.open('${r.imageUrl}', '_blank')">` : ''; 
                let delBtn = (currentUser && isCurrentUserAdmin) ? `<button onclick="window.deleteReview('${product.id}', ${product.reviews.indexOf(r)})" style="float:left; background:transparent; border:none; color:var(--danger); font-size:1.2rem; cursor:pointer;" title="حذف التقييم">🗑️</button>` : '';
                reviewsHtml += `<div class="review-box">${delBtn}<strong style="color:var(--primary);">${window.escapeHTML(r.userName)}</strong><br>${'⭐'.repeat(r.rating)}<br><span style="color:var(--text-color); font-size:0.95rem;">${window.escapeHTML(r.comment)}</span>${revImgHtml}</div>`;
 }); avgRating = (total / product.reviews.length).toFixed(1); } else { let noR = window.currentLang === 'ar' ? 'كن أول من يقيّم المنتج!' : 'Be the first to review!'; reviewsHtml = `<p style="color:var(--text-muted); text-align:center;">${noR}</p>`; }
            
            let mra = document.getElementById('modal-rating-avg'); if(mra) mra.innerHTML = `⭐ ${avgRating} / 5.0`; let mrl = document.getElementById('modal-reviews-list'); if(mrl) mrl.innerHTML = reviewsHtml;
            
            let crossSellSec = document.getElementById('modal-cross-sell-section');
            if(crossSellSec && storeSettings.enableCrossSell) {
                let crossSellList = document.getElementById('modal-cross-sell-list');
                let related = products.filter(p => p.id !== product.id && p.category === product.category).slice(0, 4);
                if(related.length === 0) related = products.filter(p => p.id !== product.id).slice(0, 4);
                if(related.length > 0) {
                    crossSellSec.style.display = 'block'; let csHtml = '';
                    related.forEach(r => {
                        let rImg = (r.images && r.images.length > 0) ? r.images[0] : (r.imageUrl || 'https://via.placeholder.com/150');
                        csHtml += `<div style="min-width:120px; max-width:120px; background:var(--input-bg); border:1px solid var(--border-color); border-radius:8px; padding:8px; cursor:pointer;" onclick="window.openProductModal('${r.id}')">
                            <img loading="lazy" src="${rImg}" style="width:100%; height:80px; object-fit:cover; border-radius:6px;">
                            <div style="font-size:0.8rem; font-weight:bold; color:var(--primary); margin-top:5px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${r.name}</div>
                            <div style="font-size:0.9rem; color:var(--secondary); font-weight:bold;">${r.price} ج</div>
                        </div>`;
                    });
                    if(crossSellList) crossSellList.innerHTML = csHtml;
                } else { crossSellSec.style.display = 'none'; }
            } else if (crossSellSec) { crossSellSec.style.display = 'none'; }

            let addBtnState = (product.stock !== undefined && product.stock !== "" && Number(product.stock) <= 0) ? `disabled style="background:var(--border-color); cursor:not-allowed;"` : `onclick="window.executeAddToCart(event, '${product.id}', '${safeName}');"`;
            let addTxt = window.currentLang === 'ar' ? 'أضف للسلة 🛒' : 'Add to Cart 🛒';
            let sab = document.getElementById('sticky-action-btn'); if(sab) sab.innerHTML = `<button type="button" class="btn" style="padding: 8px 15px; font-size:1rem;" ${addBtnState}>${addTxt}</button>`;
            
            window.trackEvent('ViewContent', { content_name: product.name, content_category: product.category, value: product.price, currency: 'EGP' });
            let btnBuyNow = document.getElementById('btn-buy-now'); if(btnBuyNow) btnBuyNow.style.display = 'block'; let pm = document.getElementById('product-modal'); if(pm) pm.style.display = 'flex';
        }

        window.changeMainImg = function(url, el) { let mim = document.getElementById('modal-img-main'); if(mim) mim.src = url; document.querySelectorAll('.modal-gallery img').forEach(img => img.classList.remove('active')); if(el && el.classList) el.classList.add('active'); }
        window.updateModalVariantPrice = function() { if(!activeProductForReview) return; const product = products.find(p => p.id === activeProductForReview); let ms = document.getElementById('modal-variant-select'); let idx = ms ? ms.value : 0; if(!product || !product.variantsData || !product.variantsData[idx]) return; let selectedVar = product.variantsData[idx]; activeVariantForCart = selectedVar; let mp = document.getElementById('modal-price'); if(mp) mp.innerHTML = `<span>${selectedVar.price} ج</span>`; let spr = document.getElementById('sticky-price'); if(spr) spr.innerHTML = `${selectedVar.price} ج`; }
        window.executeAddToCart = function(event, id, name) { if(event) event.stopPropagation(); let p = products.find(x => x.id === id); if(!p) return; let priceToUse = p.price; let finalName = name; let variantSuffix = ""; let img = (p.images && p.images.length > 0) ? p.images[0] : (p.imageUrl || 'https://via.placeholder.com/300'); if(activeVariantForCart) { priceToUse = activeVariantForCart.price; finalName = `${name} (${activeVariantForCart.name})`; variantSuffix = activeVariantForCart.name; } window.addToCart(id, finalName, priceToUse, img, variantSuffix); window.closeProductModal(); }
        window.closeProductModal = function() { let pm = document.getElementById('product-modal'); if(pm) pm.style.display = 'none'; activeProductForReview = null; window.history.pushState(null, '', window.location.pathname); activeVariantForCart = null; }

        
        window.deleteReview = async function(productId, reviewIndex) {
            if(!confirm('هل أنت متأكد من حذف هذا التقييم؟')) return;
            let product = products.find(p => p.id === productId);
            if(product && product.reviews) {
                product.reviews.splice(reviewIndex, 1);
                try {
                    await updateDoc(doc(db, 'products', productId), { reviews: product.reviews });
                    window.showToast('تم حذف التقييم', 'success');
                    window.openProductModal(productId); // refresh
                } catch(e) { window.showToast('حدث خطأ', 'error'); }
            }
        };

        window.submitReview = async function() { 
            if(!currentUser) { window.showToast(window.currentLang === 'ar' ? 'سجل الدخول لتقييم المنتج' : 'Login to review', "error"); return; } 
            if(!activeProductForReview) return; 
            const rating = parseInt(document.getElementById('review-stars').value); const comment = document.getElementById('review-text').value.trim(); const fileInput = document.getElementById('review-image-file'); const submitBtn = document.getElementById('btn-submit-review'); const statusLabel = document.getElementById('review-upload-status');
            if(!comment) { window.showToast(window.currentLang === 'ar' ? 'اكتب تعليقاً' : 'Write a comment', "error"); return; } 
            submitBtn.disabled = true; let reviewImageUrl = null;
            if(fileInput.files.length > 0) { statusLabel.style.display = 'block'; try { const formData = new FormData(); formData.append('image', fileInput.files[0]); const res = await fetch(`https://api.imgbb.com/1/upload?key=D37b01ec4b27dcce48777a7b229a1fdb`, { method: 'POST', body: formData }); const data = await res.json(); if(data.success) { reviewImageUrl = data.data.url; } } catch(e) { window.showToast('فشل رفع الصورة، سيتم إرسال التقييم بدون صورة', 'error'); } statusLabel.style.display = 'none'; }
            const product = products.find(p => p.id === activeProductForReview); let currentReviews = product.reviews || []; let rName = currentUser.displayName || (currentUser.email ? currentUser.email.split('@')[0] : currentUser.phoneNumber); 
            let reviewObj = { userName: rName, rating: rating, comment: comment, date: new Date().toISOString() }; if(reviewImageUrl) reviewObj.imageUrl = reviewImageUrl; currentReviews.push(reviewObj); 
            try { await updateDoc(doc(db, 'products', activeProductForReview), { reviews: currentReviews }); window.showToast(window.currentLang === 'ar' ? 'شكراً لتقييمك!' : 'Thank you!', "success"); document.getElementById('review-text').value = ''; document.getElementById('review-image-file').value = ''; window.closeProductModal(); } catch(e) { window.showToast("خطأ", "error"); } submitBtn.disabled = false;
        }

        
        window.generateFakeReviews = function(productName, count) {
            if(count <= 0) return [];
            const names = ["أحمد محمود", "كريم سعيد", "محمود علي", "فاطمة حسن", "منى جمال", "طارق يوسف", "محمد عمر", "مصطفى كمال", "هبة عبد الرحمن", "سمر فوزي", "خالد عبدالله"];
            const comments = [
                `منتج ممتاز جداً، بنصح الكل يشتريه (${productName})`,
                `جودة عالية وسعر مناسب، شكراً ليكم!`,
                `أفضل ${productName} جربته، طعم وريحة خيال.`,
                `تغليف ممتاز وتوصيل سريع، برافو متجر زيت الشجرة المباركة 👏`,
                `بصراحة شيء يفتح النفس، أكيد هطلب تاني.`,
                `من أفضل المتاجر اللي اتعاملت معاها، والمنتج جودته وهمية!`,
                `تسلم إيديكم بجد، الطعم أصلي 100% 😍`,
                `تجربة شراء ممتازة، والمنتج مطابق للوصف بالظبط.`,
                `سعر ممتاز مقارنة بالجودة العالية دي، هعتمدكم دايماً.`,
                `وصل في ميعاده ومغلف كويس جداً، شكراً لاهتمامكم بالتفاصيل.`
            ];
            let reviews = [];
            for(let i=0; i<count; i++) {
                let rDate = new Date();
                rDate.setDate(rDate.getDate() - Math.floor(Math.random() * 30)); // random date within last 30 days
                reviews.push({
                    userName: names[Math.floor(Math.random() * names.length)],
                    rating: 5,
                    comment: comments[Math.floor(Math.random() * comments.length)],
                    date: rDate.toISOString()
                });
            }
            return reviews;
        };

        window.deleteProduct = async function(id) { if(confirm('حذف المنتج نهائياً؟')) { await deleteDoc(doc(db, 'products', id)); window.showToast('تم الحذف', 'success'); } }
        window.editProduct = function(id) { const product = products.find(p => p.id === id); if(!product) return; document.getElementById('edit-product-id').value = product.id; document.getElementById('product-name').value = product.name; document.getElementById('product-price').value = product.price; document.getElementById('product-old-price').value = product.oldPrice || ''; document.getElementById('product-category').value = product.category || 'أخرى'; document.getElementById('product-stock').value = product.stock !== undefined ? product.stock : ''; document.getElementById('product-desc').value = product.description || ''; let vStr = ""; if(product.variantsData) { vStr = product.variantsData.map(v => `${v.name}-${v.price}`).join(', '); } document.getElementById('product-variants').value = vStr; document.getElementById('edit-product-old-image').value = (product.images && product.images.length > 0) ? JSON.stringify(product.images) : (product.imageUrl || ''); document.getElementById('product-image-url').value = ''; let pvu = document.getElementById('product-video-url'); if(pvu) pvu.value = product.videoUrl || ''; document.getElementById('admin-product-title').innerHTML = '✏️ تعديل المنتج'; document.getElementById('btn-submit-product').textContent = 'تحديث'; document.getElementById('btn-cancel-edit').style.display = 'block'; window.showPanel('admin'); window.scrollTo(0,0); }
        window.cancelEditProduct = function() { document.getElementById('add-product-form').reset(); document.getElementById('edit-product-id').value = ''; document.getElementById('edit-product-old-image').value = ''; document.getElementById('admin-product-title').innerHTML = '🛒 إضافة منتج جديد'; document.getElementById('btn-submit-product').textContent = 'حفظ'; document.getElementById('btn-cancel-edit').style.display = 'none'; }

        let addPForm = document.getElementById('add-product-form');
        if(addPForm) { addPForm.addEventListener('submit', async (e) => { e.preventDefault(); const btnSubmit = document.getElementById('btn-submit-product'); const statusLabel = document.getElementById('upload-status'); btnSubmit.disabled = true; const id = document.getElementById('edit-product-id').value; const name = document.getElementById('product-name').value; const price = Number(document.getElementById('product-price').value); const oldPrice = document.getElementById('product-old-price').value; const category = document.getElementById('product-category').value; const description = document.getElementById('product-desc').value; const stockVal = document.getElementById('product-stock').value; const vString = document.getElementById('product-variants').value.trim(); const variantsData = parseVariants(vString); let stock = stockVal === "" ? "" : Number(stockVal); let finalImages = []; let oldImgData = document.getElementById('edit-product-old-image').value; if(oldImgData) { try { finalImages = JSON.parse(oldImgData); } catch(err) { finalImages = [oldImgData]; } } const fileInput = document.getElementById('product-image-file'); const urlInput = document.getElementById('product-image-url').value.trim(); let videoUrl = ""; let pvu = document.getElementById('product-video-url'); if(pvu) videoUrl = pvu.value.trim(); try { if(fileInput.files.length > 0) { if(statusLabel) {statusLabel.style.display = 'block'; statusLabel.textContent = `⏳ جاري الرفع`;} const imgbbKey = "D37b01ec4b27dcce48777a7b229a1fdb"; let newUploads = []; let limit = Math.min(fileInput.files.length, 4); for(let i=0; i<limit; i++) { const formData = new FormData(); formData.append('image', fileInput.files[i]); const res = await fetch(`https://api.imgbb.com/1/upload?key=${imgbbKey}`, { method: 'POST', body: formData }); const data = await res.json(); if(data.success) { newUploads.push(data.data.url); } } if(newUploads.length > 0) finalImages = newUploads; } else if (urlInput) { finalImages = [urlInput]; } else if (finalImages.length === 0) { window.showToast('اختر صورة أو ضع رابط', 'error'); btnSubmit.disabled = false; return; } let productPayload = { createdAt: new Date().toISOString(), name, price, oldPrice, category, stock, description, images: finalImages, variantsData, imageUrl: finalImages[0] }; if(videoUrl) productPayload.videoUrl = videoUrl; if(id) { await updateDoc(doc(db, 'products', id), productPayload); window.showToast('تم التحديث!', 'success'); } else { 
                let fcEl = document.getElementById('product-fake-reviews-count');
                let fCount = fcEl ? parseInt(fcEl.value) : 5;
                productPayload.reviews = window.generateFakeReviews(name, fCount); 
                await addDoc(collection(db, 'products'), productPayload); 
                window.showToast('تم الإضافة!', 'success');
 } window.cancelEditProduct(); } catch(err) { if(statusLabel) statusLabel.style.display = 'none'; window.showToast('فشل الرفع', 'error'); } btnSubmit.disabled = false; if(statusLabel) statusLabel.style.display = 'none'; }); }

        window.addToCart = function(id, name, price, imageUrl, variantSuffix = "") { try { let product = products.find(p => p.id === id); let cartItemId = variantSuffix ? `${id}_${variantSuffix}` : id; let existingItem = cart.find(item => item.cartItemId === cartItemId); if(product && product.stock !== undefined && product.stock !== "") { let currentQtyInCart = existingItem ? existingItem.quantity : 0; if(currentQtyInCart >= Number(product.stock)) { window.showToast(`الكمية المتاحة في المخزن (${product.stock}) فقط!`, 'error'); return; } } if (existingItem) { existingItem.quantity += 1; } else { cart.push({ id: id, cartItemId: cartItemId, name: name, price: Number(price), imageUrl: imageUrl, quantity: 1, variant: variantSuffix, selected: true }); } localStorage.setItem('cart', JSON.stringify(cart)); localStorage.setItem('cart_last_updated', new Date().getTime()); window.updateCartUI(); window.showToast('تمت الإضافة للسلة', 'success'); } catch(e) { console.error(e); } }
        window.updateQuantity = function(cartItemId, change) { try { let itemIndex = cart.findIndex(item => item.cartItemId === cartItemId); if(itemIndex > -1) { let product = products.find(p => p.id === cart[itemIndex].id); let newQty = cart[itemIndex].quantity + change; if(change > 0 && product && product.stock !== undefined && product.stock !== "") { if(newQty > Number(product.stock)) { window.showToast(`الكمية المتاحة (${product.stock}) فقط!`, 'error'); return; } } cart[itemIndex].quantity = newQty; if(cart[itemIndex].quantity <= 0) cart.splice(itemIndex, 1); localStorage.setItem('cart', JSON.stringify(cart)); localStorage.setItem('cart_last_updated', new Date().getTime()); window.updateCartUI(); } } catch(e) { console.error(e); } }

        window.processOrder = async function(method) {
            try {
                const form = document.getElementById('checkout-form'); if(form && !form.checkValidity()) { form.reportValidity(); return; }
                const latEl = document.getElementById('order-lat'); const lngEl = document.getElementById('order-lng'); const lat = latEl ? latEl.value : 0; const lng = lngEl ? lngEl.value : 0;
                if (!lat || !lng || lat == 0) { let mw = document.getElementById('map-warning'); if(mw) mw.style.display = 'block'; let mm = document.getElementById('map'); if(mm) window.scrollTo({ top: mm.offsetTop - 100, behavior: 'smooth' }); window.showToast('حدد موقعك على الخريطة', 'error'); return; }
                const nameEl = document.getElementById('order-name'); const phone1El = document.getElementById('order-phone1'); const phone2El = document.getElementById('order-phone2'); const govEl = document.getElementById('order-gov'); const cityEl = document.getElementById('order-city'); const mapAddrEl = document.getElementById('order-map-address'); const addrEl = document.getElementById('order-address'); const payEl = document.getElementById('order-payment-method');
                const name = nameEl ? nameEl.value : "عميل"; const phone1 = phone1El ? phone1El.value : ""; const phone2 = phone2El ? phone2El.value : "لا يوجد"; const gov = govEl ? govEl.value : ""; const city = cityEl ? cityEl.value : ""; const mapAddress = mapAddrEl ? mapAddrEl.value : ""; const addressDetails = addrEl ? addrEl.value : ""; const payMethod = payEl ? payEl.value : "كاش";
                
                let discountVal = Math.round(currentSubtotal * (currentDiscountPercent / 100)) + window.loyaltyDiscountFixed; 
                let finalTotal = (currentSubtotal - discountVal) + currentShippingCost; 
                if(finalTotal < 0) finalTotal = 0; 
                const mapLink = `https://www.google.com/maps?q=${lat},${lng}`; 
                let receiptUrl = "";
                
                let selectedItems = cart.filter(item => item.selected !== false);
                if(selectedItems.length === 0) { window.showToast(window.currentLang === 'ar' ? 'قم بتحديد منتج אחד على الأقل' : 'Select at least one item', 'error'); return; }

                if(payMethod === 'محفظة إلكترونية') { const fileInput = document.getElementById('order-receipt-file'); if(!fileInput || fileInput.files.length === 0) { window.showToast('يرجى إرفاق صورة إيصال التحويل لتأكيد الطلب!', 'error'); return; } let statusLabel = document.getElementById('receipt-upload-status'); if(statusLabel) statusLabel.style.display = 'block'; document.querySelectorAll('.checkout-submit-btn').forEach(b => b.disabled = true); try { const formData = new FormData(); formData.append('image', fileInput.files[0]); const res = await fetch(`https://api.imgbb.com/1/upload?key=D37b01ec4b27dcce48777a7b229a1fdb`, { method: 'POST', body: formData }); const data = await res.json(); if(data.success) { receiptUrl = data.data.url; } else { throw new Error('فشل رفع الإيصال'); } } catch (err) { if(statusLabel) statusLabel.style.display = 'none'; document.querySelectorAll('.checkout-submit-btn').forEach(b => b.disabled = false); window.showToast('فشل رفع صورة الإيصال، حاول مرة أخرى.', 'error'); return; } if(statusLabel) statusLabel.style.display = 'none'; }

                document.querySelectorAll('.checkout-submit-btn').forEach(b => b.disabled = true); let waBtnInfo = storeSettings.floatingButtons ? storeSettings.floatingButtons.find(b => b.icon === '📱' || b.link.includes('wa.me')) : null; let pureWa = waBtnInfo ? waBtnInfo.link.split('/').pop() : "201018631768"; if(pureWa && !pureWa.startsWith('20') && pureWa.length === 10) pureWa = '20' + pureWa; let custEmail = currentUser ? (currentUser.email || currentUser.phoneNumber) : "غير مسجل";
                
                let orderPayload = { usedLoyaltyPoints: window.loyaltyPointsUsedTemp || 0, userId: currentUser ? currentUser.uid : "", customerEmail: custEmail || "", customerName: name || "", phones: { primary: phone1 || "", secondary: phone2 || "" }, location: { governorate: gov || "", city: city || "", mapAddress: mapAddress || "", details: addressDetails || "", lat: lat || 0, lng: lng || 0, mapLink: mapLink || "" }, items: selectedItems, subtotal: currentSubtotal || 0, discount: discountVal || 0, promoCode: appliedPromoCode || "", shippingCost: currentShippingCost || 0, totalAmount: finalTotal || 0, orderMethod: method || "", paymentMethod: payMethod || "", receiptUrl: receiptUrl || "", status: "قيد المراجعة", orderDate: new Date().toISOString() };
                await addDoc(collection(db, 'orders'), orderPayload);
                if(currentUser) { await setDoc(doc(db, 'users', currentUser.uid), { name: name||"", phone1: phone1||"", phone2: phone2||"", gov: gov||"", city: city||"", address: addressDetails||"" }, { merge: true }); }
                window.trackEvent('Purchase', { value: finalTotal, currency: 'EGP', content_type: 'product_group' });
                
                selectedItems.forEach(item => { const prod = products.find(p => p.id === item.id); if(prod && prod.stock !== undefined && prod.stock !== "") { updateDoc(doc(db, 'products', item.id), { stock: increment(-item.quantity) }).catch(e=>{}); } });

                try {
                    let orderNotif = {
                        title: 'طلب جديد 🛒',
                        message: `طلب جديد من ${name} بقيمة ${finalTotal} ج`,
                        date: new Date().toISOString(),
                        orderId: orderPayload.id || ''
                    };
                    SUPER_ADMINS.forEach(async (adminEmail) => {
                        let qSnap = await getDocs(query(collection(db, 'users'), where('email', '==', adminEmail)));
                        qSnap.forEach(async (uDoc) => {
                            await updateDoc(doc(db, 'users', uDoc.id), { unreadNotifs: increment(1), notifications: arrayUnion(orderNotif) });
                        });
                    });
                    dynamicAdmins.forEach(async (adminEmail) => {
                        let qSnap = await getDocs(query(collection(db, 'users'), where('email', '==', adminEmail)));
                        qSnap.forEach(async (uDoc) => {
                            await updateDoc(doc(db, 'users', uDoc.id), { unreadNotifs: increment(1), notifications: arrayUnion(orderNotif) });
                        });
                    });
                } catch(e) {}

                if (method === 'عبر واتساب') { 
                    let msg = `*طلب جديد* 🌿\n\n👤 ${name}\n📞 ${phone1}\n📍 ${gov} - ${city}\n🗺️ الخريطة: ${mapAddress}\n🏠 التفاصيل: ${addressDetails}\n💳 الدفع: ${payMethod}\n🔗 ${mapLink}\n`; 
                    if(receiptUrl) msg += `\n🧾 *إيصال التحويل:* ${receiptUrl}\n`; 
                    msg += `\n🛍️ *المنتجات:*\n`; 
                    selectedItems.forEach(item => { msg += `- ${item.name} (${item.quantity}) بـ ${item.price * item.quantity} ج\n`; }); 
                    msg += `\n💰 *الإجمالي المطلوب:* ${finalTotal} ج (شامل التوصيل)\n\n(أرجو التأكيد)`; 
                    window.open(`https://wa.me/${pureWa}?text=${encodeURIComponent(msg)}`, '_blank'); 
                } else { 
                    window.showToast('تم تأكيد طلبك بنجاح!', 'success'); 
                }
                
                cart = cart.filter(item => item.selected === false);
                localStorage.setItem('cart', JSON.stringify(cart)); localStorage.removeItem('cart_last_updated'); 
                
        window.hashString = async function(str) {
            const buffer = new TextEncoder().encode(str);
            const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        };
        
        window.escapeHTML = function(str) {
            if(!str) return "";
            return String(str).replace(/[&<>'"]/g, tag => ({
                '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
            }[tag]));
        };

        window.loyaltyDiscountFixed = 0; window.loyaltyPointsUsedTemp = 0; 
                window.updateCartUI(); 
                
                let pci = document.getElementById('promo-code-input'); if(pci) pci.value = ''; currentDiscountPercent = 0; appliedPromoCode = ''; 
                let dr = document.getElementById('discount-row'); if(dr) dr.style.display = 'none'; 
                let orf = document.getElementById('order-receipt-file'); if(orf) orf.value = ''; 
                document.querySelectorAll('.checkout-submit-btn').forEach(b => b.disabled = false); window.showPanel('customer-orders');
            } catch (error) { console.error("Order Process Error: ", error); window.showToast('حدث خطأ في الاتصال بقاعدة البيانات. حاول مجدداً.', 'error'); document.querySelectorAll('.checkout-submit-btn').forEach(b => b.disabled = false); }
        }

        
        window.sendGlobalNotification = async function() {
            let msgInput = document.getElementById('admin-notif-msg');
            let msg = msgInput ? msgInput.value.trim() : "";
            if(!msg) { window.showToast('اكتب الإشعار أولاً', 'error'); return; }
            try {
                let notifObj = {
                    title: 'إشعار من الإدارة 📢',
                    message: msg,
                    date: new Date().toISOString()
                };
                await addDoc(collection(db, 'global_notifications'), notifObj);
                
                // Add to all users
                const { getDocs } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
                const usersSnap = await getDocs(collection(db, 'users'));
                usersSnap.forEach(async (uDoc) => {
                    try {
                        await updateDoc(doc(db, 'users', uDoc.id), {
                            unreadNotifs: increment(1),
                            notifications: arrayUnion(notifObj)
                        });
                    } catch(e){}
                });
                
                if(msgInput) msgInput.value = '';
                window.showToast('تم إرسال الإشعار للجميع!', 'success');
            } catch(e) {
                console.error(e);
                window.showToast('فشل إرسال الإشعار', 'error');
            }
        };

        
        window.deleteGlobalNotification = async function(docId) {
            if(confirm('حذف الإشعار من السجل؟')) {
                try {
                    await deleteDoc(doc(db, 'global_notifications', docId));
                    window.showToast('تم الحذف', 'success');
                } catch(e) {}
            }
        };

        window.exportOrdersCSV = function() { if(adminOrdersArray.length === 0) { window.showToast('لا توجد طلبات لتصديرها', 'error'); return; } let csv = "رقم الطلب,تاريخ الطلب,اسم العميل,رقم الهاتف,المحافظة,المدينة,العنوان,المنتجات,طريقة الدفع,الاجمالي,حالة الطلب\n"; adminOrdersArray.forEach(o => { let dateStr = new Date(o.orderDate).toLocaleString('ar-EG').replace(/,/g, ''); let cleanName = String(o.customerName).replace(/,/g, ' '); let cleanGov = String(o.location.governorate).replace(/,/g, ''); let cleanCity = String(o.location.city).replace(/,/g, ''); let cleanAddress = String(o.location.details).replace(/,/g, ' ').replace(/\n/g, ' '); let itemsStr = o.items.map(i => `${i.name} (${i.quantity})`).join(' | ').replace(/,/g, ''); let pMethod = o.paymentMethod || 'كاش'; csv += `"${o.id}","${dateStr}","${cleanName}","${o.phones.primary}","${cleanGov}","${cleanCity}","${cleanAddress}","${itemsStr}","${pMethod}","${o.totalAmount}","${o.status}"\n`; }); const blob = new Blob(["\uFEFF"+csv], {type: 'text/csv;charset=utf-8;'}); const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = `orders_${new Date().toISOString().slice(0,10)}.csv`; link.click(); window.showToast('تم تحميل الملف بنجاح!', 'success'); }

        window.getStepIndex = function(status) { if(status === 'قيد المراجعة') return 1; if(status === 'تم التجهيز') return 2; if(status === 'تم الشحن') return 3; if(status === 'تم التوصيل ✅' || status === 'تم التوصيل') return 4; return 0; }

        
        
        window.loadCustomerOrders = function() {
            if(!currentUser) return; let filterKey = currentUser.email || currentUser.phoneNumber; if(!filterKey) return;
            onSnapshot(query(collection(db, 'orders'), where('customerEmail', '==', filterKey)), (snapshot) => {
                const container = document.getElementById('customer-orders-container'); if(!container) return;
                window.customerOrdersArray = []; snapshot.forEach(doc => window.customerOrdersArray.push({id: doc.id, ...doc.data()})); let userOrders = window.customerOrdersArray;
                userOrders.sort((a,b) => new Date(b.orderDate) - new Date(a.orderDate));
                if(userOrders.length === 0) { container.innerHTML = `<div style="text-align:center; padding:40px; color:#94a3b8;"><span style="font-size:3rem; display:block; margin-bottom:10px;">🛒</span><h3>لا توجد طلبات بعد.</h3></div>`; return; }
                let htmlContent = '';
                userOrders.forEach(order => {
                    let itemsHtml = ''; order.items.forEach(item => { itemsHtml += `<li>${item.name} <b style="color:var(--primary);">(${item.quantity})</b></li>`; });
                    let step = window.getStepIndex(order.status);
                    let trackerHtml = '';
                    
                    let badgeClass = 'status-pending';
                    let statusIcon = '🕒';
                    if(order.status.includes('تجهيز')) { badgeClass = 'status-prep'; statusIcon = '📦'; }
                    else if(order.status.includes('شحن')) { badgeClass = 'status-shipped'; statusIcon = '🚚'; }
                    else if(order.status.includes('توصيل')) { badgeClass = 'status-delivered'; statusIcon = '✅'; }
                    else if(order.status.includes('رفض') || order.status.includes('لغى')) { badgeClass = 'status-canceled'; statusIcon = '❌'; }

                    if(!order.status.includes('❌') && !order.status.includes('الاسترجاع')) {
                        let t1 = window.currentLang==='ar'?'مراجعة':'Review'; let t2 = window.currentLang==='ar'?'تجهيز':'Prep'; let t3 = window.currentLang==='ar'?'شحن':'Ship'; let t4 = window.currentLang==='ar'?'توصيل':'Delivered';
                        trackerHtml = `<div class="order-track" style="margin: 25px 0;"><div class="track-step ${step >= 1 ? (step>1?'done':'active') : ''}"><div class="track-dot">1</div>${t1}</div><div class="track-step ${step >= 2 ? (step>2?'done':'active') : ''}"><div class="track-dot">2</div>${t2}</div><div class="track-step ${step >= 3 ? (step>3?'done':'active') : ''}"><div class="track-dot">3</div>${t3}</div><div class="track-step ${step >= 4 ? 'done' : ''}"><div class="track-dot">4</div>${t4}</div></div>`;
                    }
                    
                    let actionBtns = '';
                    if(order.status === 'قيد المراجعة') actionBtns = `<button type="button" class="btn btn-danger" style="margin-top:10px; width:100%; padding:12px; border-radius:8px;" onclick="window.cancelOrder('${order.id}')">إلغاء الطلب ❌</button>`;
                    else if (order.status === 'تم التوصيل ✅' || order.status === 'تم الشحن') actionBtns = `<button type="button" class="btn btn-outline" style="margin-top:10px; width:100%; border-color:var(--danger); color:var(--danger); padding:12px; border-radius:8px;" onclick="window.openReturnModal('${order.id}')">طلب استرجاع 🔄</button>`;
                    
                    let dStr = new Date(order.orderDate).toLocaleDateString('ar-EG', { dateStyle: 'long' });
                    
                    htmlContent += `
                    <div class="admin-msg-card" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; cursor:pointer; border-right:4px solid #028090;" onclick="window.openCustomerOrderModal('${order.id}')">
                        <div>
                            <strong style="color:var(--primary); font-size:1.1rem;">📦 طلب #${order.id.slice(0,6).toUpperCase()}</strong><br>
                            <span style="font-size:0.85rem; color:var(--text-muted);">📅 ${dStr}</span><br>
                            <strong style="color:var(--secondary);">${order.totalAmount} ج</strong>
                        </div>
                        <div>
                            <span class="order-status-badge ${badgeClass}" style="font-size:0.75rem;">${statusIcon} ${order.status}</span>
                        </div>
                    </div>`;
                });
                container.innerHTML = htmlContent;
            });
        }



        window.openCustomerOrderModal = function(orderId) {
            if(!window.customerOrdersArray) return;
            let order = window.customerOrdersArray.find(o => o.id === orderId);
            if(!order) return;
            
            let itemsHtml = ''; order.items.forEach(item => { itemsHtml += `<li>${item.name} <b style="color:var(--primary);">(${item.quantity})</b></li>`; });
            let step = window.getStepIndex(order.status);
            let trackerHtml = '';
            
            let badgeClass = 'status-pending';
            let statusIcon = '🕒';
            if(order.status.includes('تجهيز')) { badgeClass = 'status-prep'; statusIcon = '📦'; }
            else if(order.status.includes('شحن')) { badgeClass = 'status-shipped'; statusIcon = '🚚'; }
            else if(order.status.includes('توصيل')) { badgeClass = 'status-delivered'; statusIcon = '✅'; }
            else if(order.status.includes('رفض') || order.status.includes('لغى')) { badgeClass = 'status-canceled'; statusIcon = '❌'; }

            if(!order.status.includes('❌') && !order.status.includes('الاسترجاع')) {
                let t1 = window.currentLang==='ar'?'مراجعة':'Review'; let t2 = window.currentLang==='ar'?'تجهيز':'Prep'; let t3 = window.currentLang==='ar'?'شحن':'Ship'; let t4 = window.currentLang==='ar'?'توصيل':'Delivered';
                trackerHtml = `<div class="order-track" style="margin: 25px 0;"><div class="track-step ${step >= 1 ? (step>1?'done':'active') : ''}"><div class="track-dot">1</div>${t1}</div><div class="track-step ${step >= 2 ? (step>2?'done':'active') : ''}"><div class="track-dot">2</div>${t2}</div><div class="track-step ${step >= 3 ? (step>3?'done':'active') : ''}"><div class="track-dot">3</div>${t3}</div><div class="track-step ${step >= 4 ? 'done' : ''}"><div class="track-dot">4</div>${t4}</div></div>`;
            }
            
            let actionBtns = '';
            if(order.status === 'قيد المراجعة') actionBtns = `<button type="button" class="btn btn-danger" style="margin-top:10px; width:100%; padding:12px; border-radius:8px;" onclick="window.cancelOrder('${order.id}'); document.getElementById('customer-order-modal').style.display='none';">إلغاء الطلب ❌</button>`;
            else if (order.status === 'تم التوصيل ✅' || order.status === 'تم الشحن') actionBtns = `<button type="button" class="btn btn-outline" style="margin-top:10px; width:100%; border-color:var(--danger); color:var(--danger); padding:12px; border-radius:8px;" onclick="window.openReturnModal('${order.id}'); document.getElementById('customer-order-modal').style.display='none';">طلب استرجاع 🔄</button>`;
            
            let dStr = new Date(order.orderDate).toLocaleDateString('ar-EG', { dateStyle: 'long' });
            
            let html = `
                <div style="background:var(--input-bg); padding:15px; border-radius:8px; margin-bottom:15px; border:1px solid var(--border-color);">
                    <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                        <span style="font-size:0.85rem; color:var(--text-muted);">📅 ${dStr}</span>
                        <span class="order-status-badge ${badgeClass}" style="font-size:0.75rem;">${statusIcon} ${order.status}</span>
                    </div>
                    ${trackerHtml}
                </div>
                
                <div style="background:#f8fafc; padding:15px; border-radius:8px; border:1px dashed var(--border-color); margin-bottom:15px;">
                    <strong style="color:var(--primary); display:block; margin-bottom:10px;">📦 المنتجات المطلوبة:</strong>
                    <ul style="margin:0; padding-right:20px;">${itemsHtml}</ul>
                </div>
                
                <div style="display:flex; justify-content:space-between; align-items:center; background:#f0fdf4; padding:15px; border-radius:8px; border:1px solid #bbf7d0; margin-bottom:15px;">
                    <strong style="font-size:1.1rem;">الإجمالي المدفوع:</strong>
                    <strong style="color:#166534; font-size:1.4rem;">${order.totalAmount} ج</strong>
                </div>
                
                ${actionBtns ? `<div>${actionBtns}</div>` : ''}
            `;
            document.getElementById('com-content').innerHTML = html;
            document.getElementById('customer-order-modal').style.display = 'flex';
        };

        window.cancelOrder = async function(orderId) { 
    if(confirm('متأكد من الإلغاء؟')) { 
        let orderDoc = await getDoc(doc(db, 'orders', orderId));
        if(orderDoc.exists()) {
            let oData = orderDoc.data();
            await updateDoc(doc(db, 'orders', orderId), { status: 'ملغى من العميل ❌' }); 
            
            // Restore loyalty points if they were used
            if(oData.usedLoyaltyPoints && oData.userId) {
                await updateDoc(doc(db, 'users', oData.userId), {
                    loyaltyPoints: increment(oData.usedLoyaltyPoints),
                    unreadNotifs: increment(1),
                    notifications: arrayUnion({title: 'استرجاع نقاط 🔄', message: `تم استرجاع ${oData.usedLoyaltyPoints} نقطة لإلغائك الطلب.`, date: new Date().toISOString()})
                });
            }
        }
        window.showToast('تم الإلغاء.', 'success'); 
    } 
}

        
        window.openReturnModal = function(orderId) { let ri = document.getElementById('return-order-id'); if(ri) ri.value = orderId; let rn = document.getElementById('return-notes'); if(rn) rn.value = ''; let rif = document.getElementById('return-image-file'); if(rif) rif.value = ''; let rm = document.getElementById('return-modal'); if(rm) rm.style.display = 'flex'; }
        window.submitReturnRequest = async function() { let orderId = document.getElementById('return-order-id').value; let reason = document.getElementById('return-reason').value; let notes = document.getElementById('return-notes').value; let fileInput = document.getElementById('return-image-file'); if(!fileInput || fileInput.files.length === 0) { window.showToast('يرجى إرفاق صورة توضح المشكلة', 'error'); return; } let btn = document.getElementById('btn-submit-return'); if(btn) btn.disabled = true; let statusLabel = document.getElementById('return-upload-status'); if(statusLabel) statusLabel.style.display = 'block'; let returnImageUrl = null; try { const formData = new FormData(); formData.append('image', fileInput.files[0]); const res = await fetch(`https://api.imgbb.com/1/upload?key=D37b01ec4b27dcce48777a7b229a1fdb`, { method: 'POST', body: formData }); const data = await res.json(); if(data.success) { returnImageUrl = data.data.url; } else { throw new Error(); } await addDoc(collection(db, 'return_requests'), { orderId: orderId, customerEmail: currentUser.email || currentUser.phoneNumber, reason: reason, notes: notes, imageUrl: returnImageUrl, status: 'قيد المراجعة', date: new Date().toISOString() }); await updateDoc(doc(db, 'orders', orderId), { status: 'طلب استرجاع قيد المراجعة 🔄' }); window.showToast('تم إرسال طلب الاسترجاع بنجاح', 'success'); let rm = document.getElementById('return-modal'); if(rm) rm.style.display = 'none'; } catch(e) { window.showToast('فشل إرسال الطلب', 'error'); } if(btn) btn.disabled = false; if(statusLabel) statusLabel.style.display = 'none'; }

        window.filterAdminOrders = function(status) { currentAdminOrderFilter = status; document.querySelectorAll('#admin-orders-panel .filter-btn').forEach(btn => btn.classList.remove('active')); if(event && event.target && event.target.classList) event.target.classList.add('active'); window.renderAdminOrdersUI();  }
        
        
        
        window.renderAdminOrdersUI = function() {
            const container = document.getElementById('admin-orders-container'); if(!container) return;
            if(adminOrdersArray.length === 0) { container.innerHTML = '<div style="text-align:center; padding:40px; color:#94a3b8;"><span style="font-size:3rem; display:block; margin-bottom:10px;">📭</span><h3>لا توجد طلبات هنا</h3></div>'; return; }
            let filtered = adminOrdersArray.filter(o => currentAdminOrderFilter === 'الكل' || o.status === currentAdminOrderFilter);
            if(filtered.length === 0) { container.innerHTML = '<div style="text-align:center; padding:40px; color:#94a3b8;"><span style="font-size:3rem; display:block; margin-bottom:10px;">📭</span><h3>لا توجد طلبات هنا</h3></div>'; return; }
            let htmlContent = '';
            filtered.forEach((data) => {
                let badgeClass = 'status-pending';
                if(data.status.includes('تجهيز')) badgeClass = 'status-prep'; else if(data.status.includes('شحن')) badgeClass = 'status-shipped'; else if(data.status.includes('توصيل')) badgeClass = 'status-delivered'; else if(data.status.includes('رفض') || data.status.includes('لغى')) badgeClass = 'status-canceled';
                
                let dStr = new Date(data.orderDate).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' });
                
                htmlContent += `
                <div class="admin-msg-card" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; cursor:pointer; border-right:4px solid var(--secondary);" onclick="window.openAdminOrderModal('${data.id}')">
                    <div>
                        <strong style="color:var(--primary); font-size:1.1rem;">👤 ${data.customerName}</strong><br>
                        <span style="font-size:0.85rem; color:var(--text-muted);">رقم: #${data.id.slice(0,6).toUpperCase()} | 📅 ${dStr}</span><br>
                        <strong style="color:var(--secondary);">${data.totalAmount} ج</strong>
                    </div>
                    <div>
                        <span class="order-status-badge ${badgeClass}" style="font-size:0.75rem;">${data.status}</span>
                    </div>
                </div>`;
            });
            container.innerHTML = htmlContent;
        };
        
        window.openAdminOrderModal = function(id) {
            let data = adminOrdersArray.find(o => o.id === id);
            if(!data) return;
            let itemsHtml = ''; data.items.forEach(item => { itemsHtml += `<li>${item.name} <b style="color:var(--secondary);">(${item.quantity})</b></li>`; });
            let receiptHtml = data.receiptUrl ? `<a href="${data.receiptUrl}" target="_blank" class="btn btn-outline" style="padding:6px 12px; font-size:0.85rem;">📄 عرض الإيصال</a>` : '';
            
            let html = `
                <div style="background:var(--input-bg); padding:15px; border-radius:8px; margin-bottom:15px; border:1px solid var(--border-color);">
                    <div style="display:flex; justify-content:space-between; margin-bottom:10px;"><span><strong>العميل:</strong> ${data.customerName}</span><span><strong>الهاتف:</strong> ${data.phones.primary}</span></div>
                    <div style="margin-bottom:10px;"><strong>المكان:</strong> ${data.location.governorate} - ${data.location.city}</div>
                    <div style="margin-bottom:10px; background:#e0f7fa; padding:10px; border-radius:6px;"><strong>العنوان التفصيلي:</strong> ${data.location.details}</div>
                    ${data.location.mapLink ? `<a href="${data.location.mapLink}" target="_blank" class="btn btn-info" style="display:inline-block; padding:6px 12px; font-size:0.9rem; margin-bottom:10px;">🗺️ فتح الموقع على الخريطة</a>` : ''}
                </div>
                
                <div style="background:#f8fafc; padding:15px; border-radius:8px; border:1px dashed var(--border-color); margin-bottom:15px;">
                    <strong style="color:var(--primary); display:block; margin-bottom:10px;">📦 المنتجات:</strong>
                    <ul style="margin:0; padding-right:20px;">${itemsHtml}</ul>
                </div>
                
                <div style="display:flex; justify-content:space-between; align-items:center; background:#f0fdf4; padding:15px; border-radius:8px; border:1px solid #bbf7d0; margin-bottom:15px;">
                    <strong style="font-size:1.1rem;">الإجمالي المطلوب:</strong>
                    <strong style="color:#166534; font-size:1.4rem;">${data.totalAmount} ج</strong>
                </div>
                
                <div style="display:flex; gap:10px; flex-wrap:wrap; align-items:center; background:var(--panel-bg); padding:15px; border-radius:8px; border:1px solid var(--border-color);">
                    <div style="flex:1; min-width:200px;">
                        <label style="font-weight:bold; font-size:0.85rem; color:var(--text-muted); display:block; margin-bottom:5px;">تحديث حالة الطلب:</label>
                        <select onchange="window.updateOrderStatus('${data.id}', this.value)" style="width:100%; margin:0; padding:10px; border:2px solid var(--secondary); font-weight:bold; border-radius:8px;">
                            <option value="قيد المراجعة" ${data.status === 'قيد المراجعة' ? 'selected' : ''}>قيد المراجعة 🕒</option>
                            <option value="تم التجهيز" ${data.status === 'تم التجهيز' ? 'selected' : ''}>تم التجهيز 📦</option>
                            <option value="تم الشحن" ${data.status === 'تم الشحن' ? 'selected' : ''}>تم الشحن 🚚</option>
                            <option value="تم التوصيل ✅" ${data.status === 'تم التوصيل ✅' ? 'selected' : ''}>تم التوصيل ✅</option>
                            <option value="تم الرفض ❌" ${data.status === 'تم الرفض ❌' ? 'selected' : ''}>تم الرفض ❌</option>
                            <option value="ملغى من العميل ❌" ${data.status === 'ملغى من العميل ❌' ? 'selected' : ''}>ملغى ❌</option>
                        </select>
                    </div>
                    ${receiptHtml}
                    <button type="button" class="btn btn-danger" style="padding:10px 15px; border-radius:8px; font-size:0.9rem;" onclick="window.deleteAdminOrder('${data.id}'); document.getElementById('admin-order-modal').style.display='none';">حذف الطلب 🗑️</button>
                </div>
            `;
            document.getElementById('aom-content').innerHTML = html;
            document.getElementById('admin-order-modal').style.display = 'flex';
        };
window.deleteAdminOrder = async function(orderId) { if(confirm('هل أنت متأكد من حذف هذا الطلب نهائياً من قاعدة البيانات؟')) { await deleteDoc(doc(db, 'orders', orderId)); window.showToast('تم حذف الطلب بنجاح', 'success'); } };

        window.loadCustomerChat = function() { if(!currentUser) return; let chatId = currentUser.email || currentUser.phoneNumber; if(!chatId) return; if(unsubscribeUserChat) unsubscribeUserChat(); unsubscribeUserChat = onSnapshot(doc(db, 'chats', chatId), (docSnap) => { const container = document.getElementById('support-history-container'); if(!container) return; if(docSnap.exists()) { let data = docSnap.data(); let html = ''; (data.messages || []).forEach(m => { let isCust = m.sender === 'customer'; let alignClass = isCust ? 'chat-msg-customer' : 'chat-msg-admin'; let bubbleClass = isCust ? 'bubble-customer' : 'bubble-admin'; let prefix = isCust ? '' : '<strong style="color:var(--secondary);font-size:0.8rem;">الدعم:</strong><br>'; html += `<div class="chat-msg-wrapper ${alignClass}"><div class="chat-bubble ${bubbleClass}">${prefix}${window.escapeHTML(m.text)}</div></div>`; }); container.innerHTML = html; container.scrollTop = container.scrollHeight; } else { let msg = window.currentLang === 'ar' ? 'ابدأ المحادثة الآن وسنرد عليك في أقرب وقت!' : 'Start the conversation now!'; container.innerHTML = `<p style="text-align:center; color:var(--text-muted);">${msg}</p>`; } }); }
        let sf = document.getElementById('support-form'); if(sf) { sf.addEventListener('submit', async (e) => { e.preventDefault(); const msgInput = document.getElementById('support-message'); const txt = msgInput.value.trim(); if(!txt || !currentUser) return; msgInput.value = ''; let chatId = currentUser.email || currentUser.phoneNumber; let dName = currentUser.displayName || chatId.split('@')[0]; let msg = { sender: 'customer', text: txt, timestamp: new Date().toISOString() }; let chatRef = doc(db, 'chats', chatId); let snap = await getDoc(chatRef); if(snap.exists()) { await updateDoc(chatRef, { messages: arrayUnion(msg), lastUpdate: msg.timestamp }); } else { await setDoc(chatRef, { customerName: dName, messages: [msg], lastUpdate: msg.timestamp }); } }); }

        window.loadAdminChats = function() { onSnapshot(query(collection(db, 'chats'), orderBy('lastUpdate', 'desc')), (snap) => { let container = document.getElementById('admin-chat-list'); if(!container) return; let html = ''; snap.forEach(d => { let chat = d.data(); let date = new Date(chat.lastUpdate).toLocaleString('ar-EG'); html += `<div class="admin-msg-card" style="cursor:pointer; border-right:4px solid var(--primary);" onclick="window.openAdminChat('${d.id}', '${chat.customerName}')"><h4 style="margin:0 0 5px 0;">👤 ${chat.customerName}</h4><span style="font-size:0.85rem; color:var(--text-muted);">آخر رسالة: ${date}</span></div>`; }); container.innerHTML = html || '<h3 style="text-align:center; color:var(--text-muted);">لا توجد رسائل.</h3>'; }); }
        window.openAdminChat = function(id, name) { let acl = document.getElementById('admin-chat-list'); if(acl) acl.style.display = 'none'; let aac = document.getElementById('admin-active-chat'); if(aac) aac.style.display = 'block'; let acu = document.getElementById('active-chat-user'); if(acu) acu.textContent = name; activeAdminChatId = id; if(unsubscribeActiveAdminChat) unsubscribeActiveAdminChat(); unsubscribeActiveAdminChat = onSnapshot(doc(db, 'chats', id), (docSnap) => { let container = document.getElementById('admin-chat-messages'); if(!container) return; if(docSnap.exists()) { let data = docSnap.data(); let html = ''; (data.messages || []).forEach(m => { let isAdm = m.sender === 'admin'; let alignClass = isAdm ? 'chat-msg-customer' : 'chat-msg-admin'; let bubbleClass = isAdm ? 'bubble-customer' : 'bubble-admin'; let prefix = isAdm ? '' : '<strong style="color:var(--secondary);font-size:0.8rem;">العميل:</strong><br>'; html += `<div class="chat-msg-wrapper ${alignClass}"><div class="chat-bubble ${bubbleClass}">${prefix}${window.escapeHTML(m.text)}</div></div>`; }); container.innerHTML = html; container.scrollTop = container.scrollHeight; } }); }
        window.closeAdminChat = function() { let acl = document.getElementById('admin-chat-list'); if(acl) acl.style.display = 'block'; let aac = document.getElementById('admin-active-chat'); if(aac) aac.style.display = 'none'; activeAdminChatId = null; if(unsubscribeActiveAdminChat) { unsubscribeActiveAdminChat(); unsubscribeActiveAdminChat = null; } }
        window.sendAdminMessage = async function() { let input = document.getElementById('admin-chat-input'); let txt = input ? input.value.trim() : ""; if(!txt || !activeAdminChatId) return; input.value = ''; let msg = { sender: 'admin', text: txt, timestamp: new Date().toISOString() }; await updateDoc(doc(db, 'chats', activeAdminChatId), { messages: arrayUnion(msg), lastUpdate: msg.timestamp }); }
        window.deleteAdminChat = async function() { if(confirm('حذف المحادثة للعميل؟')) { await deleteDoc(doc(db, 'chats', activeAdminChatId)); window.showToast('تم الحذف', 'success'); window.closeAdminChat(); } }
        window.endChat = async function() { if(confirm('إنهاء المحادثة؟')) { let chatId = currentUser.email || currentUser.phoneNumber; let msg = { sender: 'customer', text: '--- تم إنهاء المحادثة من العميل ---', timestamp: new Date().toISOString() }; await updateDoc(doc(db, 'chats', chatId), { messages: arrayUnion(msg), lastUpdate: msg.timestamp }); window.showToast('تم إنهاء المحادثة', 'info'); } }
        window.deleteChat = async function() { if(confirm('مسح سجلك؟')) { let chatId = currentUser.email || currentUser.phoneNumber; await deleteDoc(doc(db, 'chats', chatId)); window.showToast('تم المسح', 'success'); } }

window.executeBuyNow = function() {
    let id = activeProductForReview;
    const product = products.find(p => p.id === id); if(!product) return;
    let safeName = product.name.replace(/'/g, "\\'");
    let priceToUse = product.price; let finalName = safeName; let variantSuffix = ""; let img = (product.images && product.images.length > 0) ? product.images[0] : (product.imageUrl || 'https://via.placeholder.com/300'); 
    if(activeVariantForCart) { priceToUse = activeVariantForCart.price; finalName = `${safeName} (${activeVariantForCart.name})`; variantSuffix = activeVariantForCart.name; } 
    
    let cartItemId = variantSuffix ? `${id}_${variantSuffix}` : id;
    let existingItem = cart.find(item => item.cartItemId === cartItemId);
    if (!existingItem) {
        cart.push({ id: id, cartItemId: cartItemId, name: finalName, price: Number(priceToUse), imageUrl: img, quantity: 1, variant: variantSuffix, selected: true });
    } else {
        existingItem.selected = true; 
    }
    localStorage.setItem('cart', JSON.stringify(cart));
    window.updateCartUI();
    window.closeProductModal();
    window.showPanel('checkout');
    // Ensure form total is updated
    window.updateInvoiceUI();
}

window.selectAllOrders = function() {
    let checkboxes = document.querySelectorAll('.order-checkbox');
    let allChecked = true;
    checkboxes.forEach(cb => { if(!cb.checked) allChecked = false; });
    checkboxes.forEach(cb => cb.checked = !allChecked);
}

window.bulkUpdateOrderStatus = async function() {
    let selectedIds = [];
    document.querySelectorAll('.order-checkbox:checked').forEach(cb => selectedIds.push(cb.value));
    if(selectedIds.length === 0) { window.showToast('الرجاء تحديد طلب واحد على الأقل', 'error'); return; }
    if(confirm(`هل أنت متأكد من تغيير حالة ${selectedIds.length} طلب إلى "تم الشحن"؟`)) {
        try {
            for(let id of selectedIds) { 
                const { doc, updateDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
                await updateDoc(doc(db, 'orders', id), { status: 'تم الشحن' }); 
            }
            window.showToast('تم تحديث الطلبات بنجاح!', 'success');
        } catch(e) { window.showToast('حدث خطأ أثناء التحديث', 'error'); }
    }
}

window.showUserHistory = function(userId, userName) {
    let container = document.getElementById('admin-users-container');
    let userOrdersList = adminOrdersArray.filter(o => o.userId === userId);
    let totalSpent = userOrdersList.filter(o => o.status === 'تم التوصيل ✅').reduce((sum, o) => sum + Number(o.totalAmount), 0);
    
    let html = `<button type="button" class="btn btn-outline" style="margin-bottom:15px; border-color:#6f42c1; color:#6f42c1;" onclick="window.loadAdminUsers()">🔙 العودة للقائمة</button>`;
    html += `<div style="background:var(--input-bg); padding:15px; border-radius:8px; border:1px solid var(--border-color); margin-bottom:15px;">`;
    html += `<h3 style="margin-top:0; color:var(--primary);">سجل العميل: ${userName || 'غير مسجل'}</h3>`;
    html += `<p>إجمالي المشتريات المكتملة: <strong style="color:var(--secondary); font-size:1.2rem;">${totalSpent} ج</strong></p>`;
    html += `<p>عدد الطلبات: <strong>${userOrdersList.length}</strong> طلب</p></div>`;
    
    if(userOrdersList.length === 0) {
        html += `<p style="text-align:center; color:var(--text-muted);">هذا العميل لم يقم بأي طلبات بعد.</p>`;
    } else {
        html += `<h4 style="color:var(--danger);">📦 طلبات العميل:</h4>`;
        userOrdersList.forEach(order => {
            html += `<div class="admin-msg-card" style="font-size:0.9rem;"><p><strong>رقم:</strong> #${order.id.slice(0,6).toUpperCase()}</p><p><strong>التاريخ:</strong> ${new Date(order.orderDate).toLocaleString('ar-EG')}</p><p><strong>الإجمالي:</strong> ${order.totalAmount} ج</p><p><strong>الحالة:</strong> ${order.status}</p></div>`;
        });
    }
    container.innerHTML = html;
}


        window.shareProduct = function() {
            if(!activeProductForReview) return;
            const product = products.find(p => p.id === activeProductForReview);
            if(navigator.share) {
                navigator.share({
                    title: product.name,
                    text: `اكتشف هذا المنتج الرائع: ${product.name} بـ ${product.price} ج فقط!`,
                    url: window.location.href
                }).catch(e => console.log('Share error:', e));
            } else {
                window.showToast('ميزة المشاركة غير مدعومة في متصفحك', 'error');
            }
        };

        window.togglePassword = function() {
            let x = document.getElementById("auth-password");
            if (x && x.type === "password") { x.type = "text"; } else if(x) { x.type = "password"; }
        };

        window.addEventListener('load', () => {
            setTimeout(() => {
                const urlParams = new URLSearchParams(window.location.search);
                const productId = urlParams.get('id') || urlParams.get('product');
                if(productId && isProductsLoaded) {
                    window.openProductModal(productId);
                }
            }, 1000);
        });



        window.addEventListener('popstate', (event) => {
            if (event.state && event.state.productId) {
                window.openProductModal(event.state.productId);
            } else {
                let pm = document.getElementById('product-modal'); 
                if(pm) pm.style.display = 'none';
            }
        });
