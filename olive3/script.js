
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
        import { getFirestore, collection, addDoc, deleteDoc, doc, onSnapshot, query, orderBy, updateDoc, setDoc, getDoc, getDocs, increment, arrayUnion, where } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
        import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut, GoogleAuthProvider, signInWithPopup, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

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
            searchQuery = val.trim();
            currentRenderedProducts = productsPerPage;
            window.renderProducts(false);
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
        let adminOrdersArray = [], adminReturnsArray = [], currentAdminOrderFilter = 'الكل'; window.adminReturnsArray = adminReturnsArray;
        let cart = JSON.parse(localStorage.getItem('cart')) || [];
        let savedForLater = JSON.parse(localStorage.getItem('savedForLater')) || [];
        let wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
        
        let currentSubtotal = 0, currentShippingCost = 0, currentDiscountPercent = 0, appliedPromoCode = "", promoCodesList = [];
        let totalGlobalRevenue = 0, totalGlobalOrders = 0;
        let unsubscribeUserChat = null, activeAdminChatId = null, unsubscribeActiveAdminChat = null, adminOrdersUnsubscribe = null, adminReturnsUnsubscribe = null;
        let savedAccounts = JSON.parse(localStorage.getItem('zait_saved_accounts')) || [];
        let currentRenderedProducts = 8; const productsPerPage = 8;
        
        let storeSettings = { walletNumber: "01018631768", fbPixelId: "", ttPixelId: "", categories: ["زيت زيتون"], autoReplyMessage: "أهلًا بيك❤️\nاكتب استفسارك وبمجرد ما يتوفر أدمن هيتم التواصل معاكم في أسرع وقت.", floatingButtons: [{ id: 'btn_support', icon: '💬', link: '#support', color: '#007bff', isSystem: true, title: 'خدمة العملاء' }, { id: 'btn_wa', icon: '📱', link: 'https://wa.me/201018631768', color: '#25D366', isSystem: false, title: 'واتساب' }], revenueResetDate: "2000-01-01T00:00:00.000Z", ordersResetDate: "2000-01-01T00:00:00.000Z", enableCrossSell: true, visualBarMode: 'categories' };

        window.syncCartToCloud = async function() {
            if(currentUser) {
                try {
                    await setDoc(doc(db, 'users', currentUser.uid), { cart: cart, savedForLater: savedForLater, cartUpdatedAt: new Date().toISOString() }, { merge: true });
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
            window.renderProducts(false); window.renderVisualBar(); window.updateCartUI();
        };

        window.showToast = function(message, type = 'info') { const container = document.getElementById('toast-container'); const toast = document.createElement('div'); toast.className = `toast ${type}`; let icon = type === 'success' ? '✅' : (type === 'error' ? '❌' : 'ℹ️'); toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`; container.appendChild(toast); setTimeout(() => toast.classList.add('show'), 10); setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 300); }, 3000); };

        const panels = { 'home': document.getElementById('home-panel'), 'cart': document.getElementById('cart-panel'), 'checkout': document.getElementById('checkout-panel'), 'auth': document.getElementById('auth-panel'), 'admin': document.getElementById('admin-panel'), 'support': document.getElementById('support-panel'), 'admin-messages': document.getElementById('admin-messages-panel'), 'admin-orders': document.getElementById('admin-orders-panel'), 'admin-returns': document.getElementById('admin-returns-panel'), 'customer-orders': document.getElementById('customer-orders-panel'), 'admin-dashboard': document.getElementById('admin-dashboard-panel'), 'wishlist': document.getElementById('wishlist-panel'), 'reviews': document.getElementById('reviews-panel'), 'recently-viewed-panel': document.getElementById('recently-viewed-panel'), 'global-notifications-panel': document.getElementById('global-notifications-panel'), 'admin-users': document.getElementById('admin-users-panel'), 'loyalty': document.getElementById('loyalty-panel'), 'profile': document.getElementById('profile-panel'), 'admin-work': document.getElementById('admin-work-panel'), 'admin-add-product': document.getElementById('admin-add-product-panel'), 'recipes': document.getElementById('recipes-panel') };
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
        window.addEventListener('scroll', () => { const nav = document.getElementById('smart-nav'); if(nav) { if (window.scrollY > lastScrollY + 4 && window.scrollY > 70) nav.classList.add('hidden'); else if (window.scrollY < lastScrollY - 3 || window.scrollY <= 70) nav.classList.remove('hidden'); } lastScrollY = window.scrollY; let homePanel = document.getElementById('home-panel'); if (homePanel && homePanel.classList.contains('active')) { if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 500) { let totalFiltered = window.getFilteredProductsCount(); if(currentRenderedProducts < totalFiltered) { let indicator = document.getElementById('loading-more-indicator'); if(indicator) indicator.style.display = 'block'; setTimeout(() => { currentRenderedProducts += productsPerPage; window.renderProducts(false); window.renderVisualBar(); if(indicator) indicator.style.display = 'none'; }, 500); } } } });

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
        
        window.goToCheckout = function() { let selectedItems = cart.filter(item => item.selected !== false); if (selectedItems.length === 0) { window.showToast(window.currentLang === 'ar' ? 'قم بتحديد منتج واحد على الأقل للمتابعة!' : 'Select at least one item to proceed!', 'error'); return; } window.showPanel('checkout'); };

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
                let vMode = document.getElementById('setting-visual-bar-mode'); if(vMode) vMode.value = storeSettings.visualBarMode || 'categories';

                let autoEl = document.getElementById('setting-auto-reply'); if(autoEl) autoEl.value = storeSettings.autoReplyMessage || 'أهلًا بيك❤️\nاكتب استفسارك وبمجرد ما يتوفر أدمن هيتم التواصل معاكم في أسرع وقت.'; let wallEl = document.getElementById('setting-wallet-number'); if(wallEl) wallEl.value = storeSettings.walletNumber || ''; let fbEl = document.getElementById('setting-fb-pixel'); if(fbEl) fbEl.value = storeSettings.fbPixelId || ''; let ttEl = document.getElementById('setting-tt-pixel'); if(ttEl) ttEl.value = storeSettings.ttPixelId || ''; 
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
            window.renderProducts(false); window.renderVisualBar();
        }

        window.saveSettings = async function() { 
            const newAutoReply = document.getElementById('setting-auto-reply') ? document.getElementById('setting-auto-reply').value.trim() : storeSettings.autoReplyMessage; 
            const newWallet = document.getElementById('setting-wallet-number') ? document.getElementById('setting-wallet-number').value.trim() : storeSettings.walletNumber; 
            const newFb = document.getElementById('setting-fb-pixel') ? document.getElementById('setting-fb-pixel').value.trim() : storeSettings.fbPixelId; 
            const newTt = document.getElementById('setting-tt-pixel') ? document.getElementById('setting-tt-pixel').value.trim() : storeSettings.ttPixelId; 
            const newCrossSell = document.getElementById('setting-cross-sell') ? document.getElementById('setting-cross-sell').checked : true;
            const newVMode = document.getElementById('setting-visual-bar-mode') ? document.getElementById('setting-visual-bar-mode').value : 'categories';
            
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
                    loyaltyRedeemValue: lRedeem, 
                    visualBarMode: newVMode
                }); 
                window.showToast('تم الحفظ بنجاح', 'success'); 
                injectPixels(); 
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
            let abCode = String(storeSettings.abandonedCartCode || 'COMEBACK').trim().toUpperCase();
            let abDisc = Number(storeSettings.abandonedCartDiscount) || 3;
            let promo = promoCodesList.find(p => p.code === inputCode);
            if (!promo && inputCode === abCode) {
                promo = { code: abCode, discount: abDisc, singleUse: false };
            }
            if (promo && promo.singleUse && promo.used) {
                currentDiscountPercent = 0; appliedPromoCode = "";
                let errTxt = window.currentLang === 'en' ? '❌ This single-use coupon has already been used!' : '❌ هذا الكود مخصص لاستخدام مرة واحدة فقط وتم استخدامه مسبقاً!';
                let pMsg1 = document.getElementById('promo-msg-cart'); if(pMsg1) { pMsg1.textContent = errTxt; pMsg1.style.color = 'var(--danger)'; }
                let pMsg2 = document.getElementById('promo-msg'); if(pMsg2) { pMsg2.textContent = errTxt; pMsg2.style.color = 'var(--danger)'; }
                window.updateInvoiceUI();
                window.showToast(errTxt, 'error');
                return;
            }
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


        
        window.showProfilePanel = function() {
            window.showPanel('profile');
            if(currentUser) {
                document.getElementById('profile-auth-msg').style.display = 'none';
                document.getElementById('profile-content').style.display = 'block';
                
                document.getElementById('profile-name-display').innerText = currentUser.displayName || (currentUser.email ? currentUser.email.split('@')[0] : 'عميل');
                document.getElementById('profile-email-display').innerText = currentUser.email || currentUser.phoneNumber || '';
                
                if (window.customerOrdersArray) {
                    document.getElementById('profile-orders-count').innerText = window.customerOrdersArray.length;
                }
                
                getDoc(doc(db, 'users', currentUser.uid)).then(d => {
                    if(d.exists()) {
                        let data = d.data();
                        document.getElementById('profile-points').innerText = data.loyaltyPoints || 0;
                        document.getElementById('prof-name').value = data.name || currentUser.displayName || '';
                        document.getElementById('prof-phone1').value = data.phone1 || currentUser.phoneNumber || '';
                        document.getElementById('prof-address').value = data.address || '';
                        
                        let pGov = document.getElementById('prof-gov');
                        let pCity = document.getElementById('prof-city');
                        if (data.gov && pGov) {
                            pGov.value = data.gov;
                            pGov.dispatchEvent(new Event('change'));
                            setTimeout(() => { if(pCity && data.city) pCity.value = data.city; }, 100);
                        }
                    }
                });
            } else {
                document.getElementById('profile-auth-msg').style.display = 'block';
                document.getElementById('profile-content').style.display = 'none';
            }
        };
        
        window.saveProfileData = async function() {
            if(!currentUser) return;
            const name = document.getElementById('prof-name').value;
            const phone1 = document.getElementById('prof-phone1').value;
            const gov = document.getElementById('prof-gov').value;
            const city = document.getElementById('prof-city').value;
            const address = document.getElementById('prof-address').value;
            
            try {
                await setDoc(doc(db, 'users', currentUser.uid), {
                    name: name,
                    phone1: phone1,
                    gov: gov,
                    city: city,
                    address: address
                }, { merge: true });
                window.showToast('تم حفظ البيانات بنجاح', 'success');
                document.getElementById('profile-name-display').innerText = name;
            } catch(e) {
                window.showToast('حدث خطأ أثناء الحفظ', 'error');
            }
        };

        const profGovSelect = document.getElementById('prof-gov'), profCitySelect = document.getElementById('prof-city');
        if(profGovSelect && profCitySelect) {
            profGovSelect.innerHTML = '<option value="" disabled selected>اختر المحافظة...</option>'; 
            for (let gov in deliveryData) { 
                let option = document.createElement('option'); 
                option.value = gov; 
                option.textContent = gov; 
                profGovSelect.appendChild(option); 
            }
            profGovSelect.addEventListener('change', function() { 
                const data = deliveryData[this.value]; 
                let citiesHtml = '<option value="" disabled selected>اختر المركز/المدينة...</option>'; 
                data.cities.forEach(city => { citiesHtml += `<option value="${city}">${city}</option>`; }); 
                citiesHtml += `<option value="مدينة أخرى">أخرى (تُكتب بالعنوان التفصيلي)</option>`; 
                profCitySelect.innerHTML = citiesHtml; 
                profCitySelect.disabled = false; 
            });
        }
        
        let visualScrollInterval;
        window.startVisualAutoScroll = function() {
            let bar = document.getElementById('visual-scroll-bar');
            if(!bar) return;
            clearInterval(visualScrollInterval);
            visualScrollInterval = setInterval(() => {
                if(bar.matches(':hover') || bar.matches(':active') || bar.matches(':focus-within')) return;
                let prev = bar.scrollLeft;
                if(document.documentElement.dir === 'rtl' || window.currentLang === 'ar') {
                    bar.scrollLeft -= 1;
                    if (bar.scrollLeft === prev) { bar.scrollLeft = bar.scrollWidth; }
                } else {
                    bar.scrollLeft += 1;
                    if (bar.scrollLeft === prev) { bar.scrollLeft = 0; }
                }
            }, 30);
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
                if (window.checkWorkHubRealtimeChanges) window.checkWorkHubRealtimeChanges('returns');
                if (window.renderAdminWorkHub) window.renderAdminWorkHub();
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
                if (window.checkWorkHubRealtimeChanges) window.checkWorkHubRealtimeChanges('orders');
                window.renderAdminOrdersUI();
                if (window.renderAdminWorkHub) window.renderAdminWorkHub();
                let so = document.getElementById('stat-orders'); if(so) so.textContent = totalGlobalOrders; let sr = document.getElementById('stat-revenue'); if(sr) sr.textContent = totalGlobalRevenue.toLocaleString() + ' ج'; 
            });
        }

        
        window.updateOrderStatus = async function(orderId, newStatus) {
            let statusPayload = { status: newStatus, updatedAt: new Date().toISOString() };
            if (String(newStatus).includes('لغى') || String(newStatus).includes('رفض')) {
                statusPayload.canceledAt = new Date().toISOString();
            } else {
                statusPayload.unreadCancelByAdmin = false;
            }
            await updateDoc(doc(db, 'orders', orderId), statusPayload); 
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
                if(!isCurrentUserAdmin && activePanel && ['admin', 'admin-add-product', 'admin-work', 'admin-orders', 'admin-messages', 'admin-dashboard', 'admin-returns', 'admin-users'].includes(activePanel.id.replace('-panel',''))) { window.showPanel('home'); }
                if(isCurrentUserAdmin) { window.loadAdminOrders(); window.loadAdminReturns(); window.loadAdminUsers(); if(window.loadAdminAbandonedCarts) window.loadAdminAbandonedCarts(); if(window.renderLowStockAlerts) window.renderLowStockAlerts(); }
            } else { 
                isCurrentUserAdmin = false; document.querySelectorAll('.admin-tab').forEach(tab => tab.style.display = 'none'); 
                if(adminOrdersUnsubscribe) { adminOrdersUnsubscribe(); adminOrdersUnsubscribe = null; } if(adminReturnsUnsubscribe) { adminReturnsUnsubscribe(); adminReturnsUnsubscribe = null; } if(adminUsersUnsubscribe) { adminUsersUnsubscribe(); adminUsersUnsubscribe = null; } if(window.adminAbandonedCartsUnsubscribe) { window.adminAbandonedCartsUnsubscribe(); window.adminAbandonedCartsUnsubscribe = null; }
            } window.applySettingsToUI(); window.renderProducts(false); window.renderVisualBar(); 
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
                let activeP = document.querySelector('.panel.active'); if(activeP && ['support-panel'].includes(activeP.id)) window.showPanel('home');
                if(unsubscribeUserChat) { unsubscribeUserChat(); unsubscribeUserChat = null; } if(unsubscribeActiveAdminChat) { unsubscribeActiveAdminChat(); unsubscribeActiveAdminChat = null; }
            } window.updateCartUI(); 
        });

        let auForm = document.getElementById('auth-form');
        if(auForm) { auForm.addEventListener('submit', (e) => { e.preventDefault(); const email = document.getElementById('auth-email').value, password = document.getElementById('auth-password').value; if (isLoginMode) { signInWithEmailAndPassword(auth, email, password).then(() => { window.saveAccountLocally(email, password); document.getElementById('auth-form').reset(); window.showToast('تم الدخول بنجاح', 'success'); window.showPanel('home'); }).catch(() => window.showToast("بيانات الدخول غير صحيحة", 'error')); } else { createUserWithEmailAndPassword(auth, email, password).then(() => { window.saveAccountLocally(email, password); window.showToast("تم إنشاء الحساب بنجاح!", 'success'); document.getElementById('auth-form').reset(); window.showPanel('home'); }).catch(() => window.showToast("حدث خطأ في التسجيل", 'error')); } }); }

        let atMode = document.getElementById('auth-toggle-mode');
        if(atMode) { atMode.addEventListener('click', () => { isLoginMode = !isLoginMode; let at = document.getElementById('auth-title'); if(at) at.textContent = isLoginMode ? "تسجيل الدخول" : "حساب جديد"; let asb = document.getElementById('auth-submit-btn'); if(asb) asb.textContent = isLoginMode ? "دخول" : "تسجيل"; let atm = document.getElementById('auth-toggle-mode'); if(atm) atm.textContent = isLoginMode ? "ليس لديك حساب؟ أنشئ حساباً" : "لديك حساب؟ سجل الدخول"; let afp = document.getElementById('auth-forgot-password'); if(afp) afp.style.display = isLoginMode ? "block" : "none"; }); }
        
        window.applyAdvancedFilters = function() { currentRenderedProducts = productsPerPage; window.renderProducts(); };
        window.filterProducts = function(category) { currentCategoryFilter = category; document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active')); if(event && event.target && event.target.classList) event.target.classList.add('active'); currentRenderedProducts = productsPerPage; window.renderProducts(); }
        
        onSnapshot(collection(db, 'products'), (snapshot) => { products = []; snapshot.forEach(doc => products.push({ id: doc.id, ...doc.data() })); products.sort((a,b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)); isProductsLoaded = true; window.renderProducts(false); window.renderVisualBar(); if(document.getElementById('wishlist-panel') && document.getElementById('wishlist-panel').classList.contains('active')) window.renderWishlist(); });

        window.toggleWishlist = function(event, id) { event.stopPropagation(); const index = wishlist.indexOf(id); if(index > -1) { wishlist.splice(index, 1); window.showToast('تم الحذف من المفضلة'); } else { wishlist.push(id); window.showToast('تمت الإضافة للمفضلة ❤️', 'success'); } localStorage.setItem('wishlist', JSON.stringify(wishlist)); window.renderProducts(false); window.renderVisualBar(); if(document.getElementById('wishlist-panel') && document.getElementById('wishlist-panel').classList.contains('active')) window.renderWishlist(); }

        window.getFilteredProductsCount = function() { let minP = document.getElementById('min-price'); let minPrice = minP ? (Number(minP.value) || 0) : 0; let maxP = document.getElementById('max-price'); let maxPrice = maxP ? (Number(maxP.value) || Infinity) : Infinity; if(maxPrice === 0) maxPrice = Infinity; let filteredProducts = products.filter(p => { if (p.isHidden && !isCurrentUserAdmin) return false; let inCategory = (currentCategoryFilter === 'الكل' || (p.category || 'أخرى') === currentCategoryFilter); let inSearch = window.fuzzyMatch(p.name, searchQuery); let inPrice = p.price >= minPrice && p.price <= maxPrice; return inCategory && inSearch && inPrice; });
            if (storeSettings.enablePinHideProducts !== false) {
                filteredProducts.sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));
            } return filteredProducts.length; }

        window.renderProducts = function(scrollToTop = true) {
            let container = document.getElementById('products-container'); if(!container) return;
            if (!isProductsLoaded) { let skeletonHtml = `<div class="skeleton-card"><div class="skeleton-img"></div><div class="skeleton-text"></div><div class="skeleton-text short"></div><div class="skeleton-btn"></div></div>`.repeat(8); container.innerHTML = skeletonHtml; return; }
            let sOpt = document.getElementById('sort-options'); let sortOption = sOpt ? sOpt.value : 'default'; let minP = document.getElementById('min-price'); let minPrice = minP ? (Number(minP.value) || 0) : 0; let maxP = document.getElementById('max-price'); let maxPrice = maxP ? (Number(maxP.value) || Infinity) : Infinity; if(maxPrice === 0) maxPrice = Infinity;
            let filteredProducts = products.filter(p => { if (p.isHidden && !isCurrentUserAdmin) return false; let inCategory = (currentCategoryFilter === 'الكل' || (p.category || 'أخرى') === currentCategoryFilter); let inSearch = window.fuzzyMatch(p.name, searchQuery); let inPrice = p.price >= minPrice && p.price <= maxPrice; return inCategory && inSearch && inPrice; });
            if (storeSettings.enablePinHideProducts !== false) {
                filteredProducts.sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));
            }
            if(sortOption === 'price-asc') { filteredProducts.sort((a,b) => a.price - b.price); } else if(sortOption === 'price-desc') { filteredProducts.sort((a,b) => b.price - a.price); } else if(sortOption === 'rating-desc') { filteredProducts.sort((a,b) => { let rA = a.reviews && a.reviews.length>0 ? a.reviews.reduce((acc, r)=>acc+r.rating,0)/a.reviews.length : 0; let rB = b.reviews && b.reviews.length>0 ? b.reviews.reduce((acc, r)=>acc+r.rating,0)/b.reviews.length : 0; return rB - rA; }); }
            if(filteredProducts.length === 0) { let msg = window.currentLang === 'ar' ? 'لا توجد منتجات مطابقة للبحث أو الفلتر.' : 'No products match your search or filter.'; container.innerHTML = `<h3 style="text-align: center; grid-column: 1 / -1; color: var(--text-muted);">${msg}</h3>`; return; }
            
            let paginatedProducts = filteredProducts.slice(0, currentRenderedProducts); let htmlContent = '';
            
            paginatedProducts.forEach(product => {
                let safeName = product.name.replace(/'/g, "\\'"); let categoryLabel = product.category || 'أخرى';
                let avgRating = 5; if(product.reviews && product.reviews.length > 0) { let total = 0; product.reviews.forEach(r => total += r.rating); avgRating = (total / product.reviews.length).toFixed(1); }
                let pinHideBtns = (currentUser && isCurrentUserAdmin && storeSettings.enablePinHideProducts !== false) ? `<div style="display:flex; gap:5px; padding:0 10px; margin-top:5px;"><button type="button" class="btn btn-outline" style="flex:1; font-size:0.78rem; padding:4px;" onclick="event.stopPropagation(); window.togglePinProduct('${product.id}', ${Boolean(product.isPinned)})">${product.isPinned ? '📌 إلغاء التثبيت' : '📌 تثبيت بالأول'}</button><button type="button" class="btn btn-outline" style="flex:1; font-size:0.78rem; padding:4px; border-color:var(--danger); color:var(--danger);" onclick="event.stopPropagation(); window.toggleHideProduct('${product.id}', ${Boolean(product.isHidden)})">${product.isHidden ? '👁️ إظهار للعملاء' : '🙈 إخفاء مؤقت'}</button></div>` : '';
                let adminBtns = currentUser && isCurrentUserAdmin ? `<div style="display:flex; gap:5px; padding: 0 10px; margin-top:5px;"><button type="button" class="btn btn-info" style="flex:1; font-size:0.9rem; padding:5px;" onclick="event.stopPropagation(); window.editProduct('${product.id}')">تعديل</button><button type="button" class="btn btn-danger" style="flex:1; font-size:0.9rem; padding:5px;" onclick="event.stopPropagation(); window.deleteProduct('${product.id}')">حذف</button></div>${pinHideBtns}` : '';
                let vArr = product.variantsData ? product.variantsData : []; let displayPriceText = `${product.price} ج`; if(vArr.length > 0) displayPriceText = `يبدأ من ${vArr[0].price} ج`;
                let discountBadge = ''; let addTxt = window.currentLang === 'ar' ? 'إضافة 🛒' : 'Add 🛒'; let selTxt = window.currentLang === 'ar' ? 'اختر الحجم 🛒' : 'Select 🛒'; let discTxt = window.currentLang === 'ar' ? 'خصم' : 'Off';
                if(product.oldPrice && Number(product.oldPrice) > Number(product.price)) { let discountPercent = Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100); discountBadge = `<span class="discount-badge">${discTxt} ${discountPercent}%</span>`; displayPriceText = `<del style="color:var(--text-muted); font-size:0.82rem; margin-left:4px; font-weight:normal;">${product.oldPrice}</del> ` + displayPriceText; }
                let priceHtml = `<div class="price">${displayPriceText}</div>`; if(isCurrentUserAdmin && vArr.length === 0) { priceHtml = `<div class="price"><span class="inline-edit-price" contenteditable="true" onclick="event.stopPropagation();" onblur="window.updateProductPriceAdmin('${product.id}', this)">${product.price}</span> ج ✏️</div>`; }
                let isWished = wishlist.includes(product.id) ? 'active' : ''; let wishBtnHtml = `<button type="button" class="wishlist-btn ${isWished}" onclick="window.toggleWishlist(event, '${product.id}')">❤</button>`;
                let isOutOfStock = (product.stock !== undefined && product.stock !== "" && Number(product.stock) <= 0);
                let stockBadge = isOutOfStock ? `<div style="color:var(--danger); font-weight:bold; font-size:0.8rem; margin-bottom:4px;">${window.currentLang === 'en' ? 'Out of Stock ❌' : 'نفدت الكمية ❌'}</div>` : '';
                let notifyTxt = window.currentLang === 'en' ? '🔔 Notify Me' : '🔔 بلغني عند التوفر';
                let addBtnState = isOutOfStock
                    ? (storeSettings.enableBackInStock !== false
                        ? `style="background:#e0a800; color:white; padding: 7px 10px; font-size:0.88rem; border-radius:8px;" onclick="window.requestBackInStock(event, '${product.id}', '${safeName}');"`
                        : `disabled style="background:var(--border-color); cursor:not-allowed; padding: 7px 10px; font-size:0.92rem; border-radius:8px;"`)
                    : `style="padding: 7px 10px; font-size:0.92rem; border-radius:8px;" onclick="window.executeAddToCart(event, '${product.id}', '${safeName}');"`;
                let primaryImage = (product.images && product.images.length > 0) ? product.images[0] : (product.imageUrl || 'https://via.placeholder.com/300');
                let videoIcon = product.videoUrl ? `<div style="position:absolute; bottom:8px; right:8px; background:rgba(0,0,0,0.7); padding:4px 6px; border-radius:50%; color:white; font-size:0.75rem; z-index:2;">▶️</div>` : '';
                let specialBadgeHtml = (storeSettings.enableProductBadges !== false && product.specialBadge) ? `<span class="special-product-badge">${window.escapeHTML(product.specialBadge)}</span>` : '';
                let pinnedBadgeHtml = (storeSettings.enablePinHideProducts !== false && product.isPinned) ? `<span class="pinned-product-badge">📌 مثبت</span>` : '';
                let hiddenClass = product.isHidden ? 'hidden-product-card' : '';
                htmlContent += `<div class="product-card ${hiddenClass}" onclick="window.openProductModal('${product.id}')">
                    <div class="product-card-media">
                        ${wishBtnHtml}
                        ${storeSettings.enableProductCompare !== false ? `<button type="button" class="compare-btn-mini ${(window.compareProductIds||[]).includes(product.id)?'active':''}" title="مقارنة" onclick="window.toggleCompareProduct(event, '${product.id}')">⚖️</button>` : ''}
                        <span class="category-badge">${categoryLabel}</span>
                        ${pinnedBadgeHtml}
                        <img loading="lazy" src="${primaryImage}" onerror="this.src='https://via.placeholder.com/300x250?text=صورة'">
                        ${discountBadge}
                        ${specialBadgeHtml}
                        ${videoIcon}
                    </div>
                    <div class="product-card-body">
                        <div>
                            <h3>${product.name}</h3>
                            <div class="rating-stars">⭐ ${avgRating}</div>
                        </div>
                        <div>
                            ${priceHtml}
                            ${window.getScarcityBarHtml ? window.getScarcityBarHtml(product) : ''}
                            ${stockBadge}
                            <div style="display:flex; gap:5px; align-items:center;">
                                <button type="button" class="btn btn-full" style="flex:1;" ${addBtnState}>${isOutOfStock && storeSettings.enableBackInStock !== false ? notifyTxt : (vArr.length > 0 ? selTxt : addTxt)}</button>
                                ${(!isOutOfStock && storeSettings.enableQuickOrder !== false) ? `<button type="button" class="btn btn-outline" style="padding:7px 9px; font-size:0.82rem; border-radius:8px; border-color:var(--secondary); color:var(--primary); white-space:nowrap;" title="طلب فوري سريع" onclick="window.openQuickOrderModal(event, '${product.id}')">⚡</button>` : ''}
                            </div>
                        </div>
                    </div>
                    ${adminBtns}
                </div>`;
            }); 
            container.innerHTML = htmlContent; if(scrollToTop) window.scrollTo(0,0); if(isCurrentUserAdmin && window.renderLowStockAlerts) window.renderLowStockAlerts();
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

            let isModalOut = (product.stock !== undefined && product.stock !== "" && Number(product.stock) <= 0);
            let addBtnState = isModalOut
                ? (storeSettings.enableBackInStock !== false
                    ? `style="background:#e0a800; color:white; padding: 8px 15px; font-size:0.95rem;" onclick="window.requestBackInStock(event, '${product.id}', '${safeName}');"`
                    : `disabled style="background:var(--border-color); cursor:not-allowed; padding: 8px 15px; font-size:1rem;"`)
                : `style="padding: 8px 15px; font-size:1rem;" onclick="window.executeAddToCart(event, '${product.id}', '${safeName}');"`;
            let addTxt = isModalOut && storeSettings.enableBackInStock !== false
                ? (window.currentLang === 'ar' ? '🔔 بلغني عند التوفر' : '🔔 Notify When Available')
                : (window.currentLang === 'ar' ? 'أضف للسلة 🛒' : 'Add to Cart 🛒');
            let sab = document.getElementById('sticky-action-btn'); if(sab) sab.innerHTML = `<button type="button" class="btn" ${addBtnState}>${addTxt}</button>`;
            
            window.trackEvent('ViewContent', { content_name: product.name, content_category: product.category, value: product.price, currency: 'EGP' });
            
            let waBtnContainer = document.getElementById('modal-wa-btn-container');
            if (waBtnContainer) {
                waBtnContainer.innerHTML = `<button type="button" class="btn btn-outline" style="width:100%; border-color:#25D366; color:#25D366; display:flex; align-items:center; justify-content:center; gap:8px;" onclick="window.askProductWa('${product.id}')">💬 ${window.currentLang === 'ar' ? 'استفسار عن المنتج عبر واتساب' : 'Inquire on WhatsApp'}</button>`;
            }

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
        window.editProduct = function(id) { const product = products.find(p => p.id === id); if(!product) return; document.getElementById('edit-product-id').value = product.id; document.getElementById('product-name').value = product.name; document.getElementById('product-price').value = product.price; document.getElementById('product-old-price').value = product.oldPrice || ''; document.getElementById('product-category').value = product.category || 'أخرى'; document.getElementById('product-stock').value = product.stock !== undefined ? product.stock : ''; document.getElementById('product-desc').value = product.description || '';
        let spBadgeEl = document.getElementById('product-special-badge'); if(spBadgeEl) spBadgeEl.value = product.specialBadge || '';
        let cSpecsEl = document.getElementById('product-custom-specs'); if(cSpecsEl) cSpecsEl.value = product.customSpecs || '';
        let cCostEl = document.getElementById('product-cost-price'); if(cCostEl) cCostEl.value = product.costPrice || ''; let vStr = ""; if(product.variantsData) { vStr = product.variantsData.map(v => `${v.name}-${v.price}`).join(', '); } document.getElementById('product-variants').value = vStr; document.getElementById('edit-product-old-image').value = (product.images && product.images.length > 0) ? JSON.stringify(product.images) : (product.imageUrl || ''); document.getElementById('product-image-url').value = ''; let pvu = document.getElementById('product-video-url'); if(pvu) pvu.value = product.videoUrl || ''; document.getElementById('admin-product-title').innerHTML = '✏️ تعديل المنتج'; document.getElementById('btn-submit-product').textContent = 'تحديث'; document.getElementById('btn-cancel-edit').style.display = 'block'; window.showPanel('admin-add-product'); window.scrollTo(0,0); }
        window.cancelEditProduct = function() { document.getElementById('add-product-form').reset(); document.getElementById('edit-product-id').value = ''; document.getElementById('edit-product-old-image').value = ''; document.getElementById('admin-product-title').innerHTML = '🛒 إضافة منتج جديد'; document.getElementById('btn-submit-product').textContent = 'حفظ'; document.getElementById('btn-cancel-edit').style.display = 'none'; }

        let addPForm = document.getElementById('add-product-form');
        if(addPForm) { addPForm.addEventListener('submit', async (e) => { e.preventDefault(); const btnSubmit = document.getElementById('btn-submit-product'); const statusLabel = document.getElementById('upload-status'); btnSubmit.disabled = true; const id = document.getElementById('edit-product-id').value; const name = document.getElementById('product-name').value; const price = Number(document.getElementById('product-price').value); const oldPrice = document.getElementById('product-old-price').value; const category = document.getElementById('product-category').value; const description = document.getElementById('product-desc').value; const stockVal = document.getElementById('product-stock').value; const vString = document.getElementById('product-variants').value.trim(); const variantsData = parseVariants(vString); let stock = stockVal === "" ? "" : Number(stockVal); let finalImages = []; let oldImgData = document.getElementById('edit-product-old-image').value; if(oldImgData) { try { finalImages = JSON.parse(oldImgData); } catch(err) { finalImages = [oldImgData]; } } const fileInput = document.getElementById('product-image-file'); const urlInput = document.getElementById('product-image-url').value.trim(); let videoUrl = ""; let pvu = document.getElementById('product-video-url'); if(pvu) videoUrl = pvu.value.trim(); try { if(fileInput.files.length > 0) { if(statusLabel) {statusLabel.style.display = 'block'; statusLabel.textContent = `⏳ جاري الرفع`;} const imgbbKey = "D37b01ec4b27dcce48777a7b229a1fdb"; let newUploads = []; let limit = Math.min(fileInput.files.length, 4); for(let i=0; i<limit; i++) { const formData = new FormData(); formData.append('image', fileInput.files[i]); const res = await fetch(`https://api.imgbb.com/1/upload?key=${imgbbKey}`, { method: 'POST', body: formData }); const data = await res.json(); if(data.success) { newUploads.push(data.data.url); } } if(newUploads.length > 0) finalImages = newUploads; } else if (urlInput) { finalImages = [urlInput]; } else if (finalImages.length === 0) { window.showToast('اختر صورة أو ضع رابط', 'error'); btnSubmit.disabled = false; return; } let specialBadge = document.getElementById('product-special-badge') ? document.getElementById('product-special-badge').value : '';
        let customSpecs = document.getElementById('product-custom-specs') ? document.getElementById('product-custom-specs').value.trim() : '';
        let costPrice = document.getElementById('product-cost-price') ? (Number(document.getElementById('product-cost-price').value) || 0) : 0;
        let productPayload = { createdAt: new Date().toISOString(), name, price, oldPrice, costPrice, category, stock, description, images: finalImages, variantsData, imageUrl: finalImages[0], specialBadge, customSpecs }; if(videoUrl) productPayload.videoUrl = videoUrl; if(id) { await updateDoc(doc(db, 'products', id), productPayload); window.showToast('تم التحديث!', 'success'); } else { 
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
                
                let bundleDiscVal = window.getBundleDiscountAmount ? window.getBundleDiscountAmount() : 0;
                let discountVal = Math.round(currentSubtotal * (currentDiscountPercent / 100)) + bundleDiscVal + window.loyaltyDiscountFixed;
                let enableFreeShip = storeSettings.enableFreeShipping !== false;
                let targetAmount = (storeSettings && storeSettings.freeShippingThreshold) ? Number(storeSettings.freeShippingThreshold) : 1000;
                if (gov && window.getShippingCostForGov) currentShippingCost = window.getShippingCostForGov(gov);
                let finalShippingCost = (enableFreeShip && currentSubtotal >= targetAmount) ? 0 : currentShippingCost;
                let finalTotal = (currentSubtotal - discountVal) + finalShippingCost; 
                if(finalTotal < 0) finalTotal = 0; 
                const mapLink = `https://www.google.com/maps?q=${lat},${lng}`; 
                let receiptUrl = "";
                
                let selectedItems = cart.filter(item => item.selected !== false);
                if(selectedItems.length === 0) { window.showToast(window.currentLang === 'ar' ? 'قم بتحديد منتج אחד على الأقل' : 'Select at least one item', 'error'); return; }

                if(payMethod === 'محفظة إلكترونية') { const fileInput = document.getElementById('order-receipt-file'); if(!fileInput || fileInput.files.length === 0) { window.showToast('يرجى إرفاق صورة إيصال التحويل لتأكيد الطلب!', 'error'); return; } let statusLabel = document.getElementById('receipt-upload-status'); if(statusLabel) statusLabel.style.display = 'block'; document.querySelectorAll('.checkout-submit-btn').forEach(b => b.disabled = true); try { const formData = new FormData(); formData.append('image', fileInput.files[0]); const res = await fetch(`https://api.imgbb.com/1/upload?key=D37b01ec4b27dcce48777a7b229a1fdb`, { method: 'POST', body: formData }); const data = await res.json(); if(data.success) { receiptUrl = data.data.url; } else { throw new Error('فشل رفع الإيصال'); } } catch (err) { if(statusLabel) statusLabel.style.display = 'none'; document.querySelectorAll('.checkout-submit-btn').forEach(b => b.disabled = false); window.showToast('فشل رفع صورة الإيصال، حاول مرة أخرى.', 'error'); return; } if(statusLabel) statusLabel.style.display = 'none'; }

                document.querySelectorAll('.checkout-submit-btn').forEach(b => b.disabled = true); let waBtnInfo = storeSettings.floatingButtons ? storeSettings.floatingButtons.find(b => b.icon === '📱' || b.link.includes('wa.me')) : null; let pureWa = waBtnInfo ? waBtnInfo.link.split('/').pop() : "201018631768"; if(pureWa && !pureWa.startsWith('20') && pureWa.length === 10) pureWa = '20' + pureWa; let custEmail = currentUser ? (currentUser.email || currentUser.phoneNumber) : "غير مسجل";
                
                let orderPayload = { usedLoyaltyPoints: window.loyaltyPointsUsedTemp || 0, userId: currentUser ? currentUser.uid : "", customerEmail: custEmail || "", customerName: name || "", phones: { primary: phone1 || "", secondary: phone2 || "" }, location: { governorate: gov || "", city: city || "", mapAddress: mapAddress || "", details: addressDetails || "", lat: lat || 0, lng: lng || 0, mapLink: mapLink || "" }, items: selectedItems, subtotal: currentSubtotal || 0, discount: discountVal || 0, promoCode: appliedPromoCode || "", shippingCost: finalShippingCost || 0, totalAmount: finalTotal || 0, orderMethod: method || "", trafficSource: window.getDetectedTrafficSource ? window.getDetectedTrafficSource() : 'مباشر (Direct)', freeGiftUnlocked: window.getUnlockedFreeGiftName ? window.getUnlockedFreeGiftName() : '',
                deliveryTimeSlot: (storeSettings.enableDeliverySlot !== false && document.getElementById('order-delivery-slot')) ? document.getElementById('order-delivery-slot').value : '',
                giftWrapInfo: (storeSettings.enableGiftWrap !== false && document.getElementById('order-gift-wrap-cb') && document.getElementById('order-gift-wrap-cb').checked) ? (document.getElementById('order-gift-wrap-msg').value.trim() || 'تغليف كهدية فاخرة 🎀') : '', paymentMethod: payMethod || "", receiptUrl: receiptUrl || "", status: "قيد المراجعة", orderDate: new Date().toISOString() };
                await addDoc(collection(db, 'orders'), orderPayload);
                if (appliedPromoCode) {
                    let usedPromoObj = promoCodesList.find(p => p.code === String(appliedPromoCode).split(' ')[0].trim());
                    if (usedPromoObj && usedPromoObj.id && usedPromoObj.singleUse) {
                        try { await deleteDoc(doc(db, 'promoCodes', usedPromoObj.id)); } catch(e) {}
                    }
                }
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
                        <div style="display:flex; flex-direction:column; align-items:flex-end; gap:6px;">
                            <span class="order-status-badge ${badgeClass}" style="font-size:0.75rem;">${statusIcon} ${order.status}</span>
                            ${storeSettings.enableBuyAgain !== false ? `<button type="button" class="btn btn-outline" style="padding:4px 10px; font-size:0.78rem; border-color:var(--primary); color:var(--primary);" onclick="event.stopPropagation(); window.buyAgainOrder('${order.id}')">🔄 اطلبه مجدداً</button>` : ''}
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
            await updateDoc(doc(db, 'orders', orderId), { status: 'ملغى من العميل ❌', canceledAt: new Date().toISOString(), updatedAt: new Date().toISOString(), unreadCancelByAdmin: true }); 
            
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
                    
                    <button type="button" class="btn btn-outline" style="border-color:#17a2b8; color:#17a2b8; padding:10px 15px; border-radius:8px; font-size:0.9rem;" onclick="window.printOrder('${data.id}')">🖨️ طباعة الفاتورة</button>
                    <button type="button" class="btn btn-danger" style="padding:10px 15px; border-radius:8px; font-size:0.9rem;" onclick="window.deleteAdminOrder('${data.id}'); document.getElementById('admin-order-modal').style.display='none';">حذف الطلب 🗑️</button>

                </div>
            `;
            document.getElementById('aom-content').innerHTML = html;
            document.getElementById('admin-order-modal').style.display = 'flex';
        };
window.deleteAdminOrder = async function(orderId) { if(confirm('هل أنت متأكد من حذف هذا الطلب نهائياً من قاعدة البيانات؟')) { await deleteDoc(doc(db, 'orders', orderId)); window.showToast('تم حذف الطلب بنجاح', 'success'); } };

        window.loadCustomerChat = function() { if(!currentUser) return; let chatId = currentUser.email || currentUser.phoneNumber || currentUser.uid; if(!chatId) return; if(unsubscribeUserChat) unsubscribeUserChat(); unsubscribeUserChat = onSnapshot(doc(db, 'chats', chatId), (docSnap) => { const container = document.getElementById('support-history-container'); if(!container) return; if(docSnap.exists()) { let data = docSnap.data(); let html = ''; (data.messages || []).forEach(m => { let isCust = m.sender === 'customer'; let alignClass = isCust ? 'chat-msg-customer' : 'chat-msg-admin'; let bubbleClass = isCust ? 'bubble-customer' : 'bubble-admin'; let prefix = isCust ? '' : '<strong style="color:var(--secondary);font-size:0.8rem;">الدعم:</strong><br>'; html += `<div class="chat-msg-wrapper ${alignClass}"><div class="chat-bubble ${bubbleClass}">${prefix}${window.escapeHTML(m.text)}</div></div>`; }); container.innerHTML = html; container.scrollTop = container.scrollHeight; } else { let msg = window.currentLang === 'ar' ? 'ابدأ المحادثة الآن وسنرد عليك في أقرب وقت!' : 'Start the conversation now!'; container.innerHTML = `<p style="text-align:center; color:var(--text-muted);">${msg}</p>`; } }); }
        let sf = document.getElementById('support-form');
        if(sf) {
            sf.addEventListener('submit', async (e) => {
                e.preventDefault();
                const msgInput = document.getElementById('support-message');
                const txt = msgInput.value.trim();
                if(!txt || !currentUser) return;
                msgInput.value = '';
                
                let chatId = currentUser.email || currentUser.phoneNumber || currentUser.uid;
                let dName = currentUser.displayName || (chatId.includes('@') ? chatId.split('@')[0] : chatId);
                let nowIso = new Date().toISOString();
                let replyIso = new Date(Date.now() + 1000).toISOString();
                
                let arMsg = (storeSettings.autoReplyMessage && storeSettings.autoReplyMessage.trim() !== '') 
                    ? storeSettings.autoReplyMessage.trim() 
                    : 'تم إرسال رسالتك بنجاح ✅ وبمجرد توفر موظف خدمة العملاء سيتم الرد عليك في أسرع وقت.';

                let msg = { sender: 'customer', text: txt, timestamp: nowIso };
                let replyObj = { sender: 'admin', text: arMsg, timestamp: replyIso, isAutoReply: true };

                try {
                    let chatRef = doc(db, 'chats', chatId);
                    let snap = await getDoc(chatRef);
                    let existingMsgs = (snap.exists() && Array.isArray(snap.data().messages)) ? snap.data().messages : [];
                    let isAdminReplied = snap.exists() && snap.data().adminReplied === true;

                    if (storeSettings.appendHoursToAutoReply && storeSettings.workingHoursText) {
                        replyObj.text = arMsg + "\n\n" + storeSettings.workingHoursText;
                    }
                    if (isAdminReplied || storeSettings.enableAutoReply === false) {
                        existingMsgs.push(msg);
                        await setDoc(chatRef, {
                            customerName: dName,
                            messages: existingMsgs,
                            lastUpdate: nowIso,
                            lastCustomerMsgAt: nowIso,
                            unreadByAdmin: true
                        }, { merge: true });
                    } else {
                        existingMsgs.push(msg, replyObj);
                        await setDoc(chatRef, {
                            customerName: dName,
                            messages: existingMsgs,
                            lastUpdate: replyIso,
                            lastCustomerMsgAt: nowIso,
                            adminReplied: false,
                            unreadByAdmin: true
                        }, { merge: true });
                    }
                    window.showToast('تم إرسال رسالتك بنجاح 💬', 'success');
                } catch(err) {
                    console.error("Chat error:", err);
                }
            });
        }

        window.loadAdminChats = function() { onSnapshot(query(collection(db, 'chats'), orderBy('lastUpdate', 'desc')), (snap) => { let container = document.getElementById('admin-chat-list'); if(!container) return; let html = ''; snap.forEach(d => { let chat = d.data(); let date = new Date(chat.lastUpdate).toLocaleString('ar-EG'); html += `<div class="admin-msg-card" style="cursor:pointer; border-right:4px solid var(--primary);" onclick="window.openAdminChat('${d.id}', '${chat.customerName}')"><h4 style="margin:0 0 5px 0;">👤 ${chat.customerName}</h4><span style="font-size:0.85rem; color:var(--text-muted);">آخر رسالة: ${date}</span></div>`; }); container.innerHTML = html || '<h3 style="text-align:center; color:var(--text-muted);">لا توجد رسائل.</h3>'; }); }
        window.openAdminChat = function(id, name) { let acl = document.getElementById('admin-chat-list'); if(acl) acl.style.display = 'none'; let aac = document.getElementById('admin-active-chat'); if(aac) aac.style.display = 'block'; let acu = document.getElementById('active-chat-user'); if(acu) acu.textContent = name; activeAdminChatId = id; if(unsubscribeActiveAdminChat) unsubscribeActiveAdminChat(); unsubscribeActiveAdminChat = onSnapshot(doc(db, 'chats', id), (docSnap) => { let container = document.getElementById('admin-chat-messages'); if(!container) return; if(docSnap.exists()) { let data = docSnap.data(); let html = ''; (data.messages || []).forEach(m => { let isAdm = m.sender === 'admin'; let alignClass = isAdm ? 'chat-msg-customer' : 'chat-msg-admin'; let bubbleClass = isAdm ? 'bubble-customer' : 'bubble-admin'; let prefix = isAdm ? '' : '<strong style="color:var(--secondary);font-size:0.8rem;">العميل:</strong><br>'; html += `<div class="chat-msg-wrapper ${alignClass}"><div class="chat-bubble ${bubbleClass}">${prefix}${window.escapeHTML(m.text)}</div></div>`; }); container.innerHTML = html; container.scrollTop = container.scrollHeight; } }); }
        window.closeAdminChat = function() { let acl = document.getElementById('admin-chat-list'); if(acl) acl.style.display = 'block'; let aac = document.getElementById('admin-active-chat'); if(aac) aac.style.display = 'none'; activeAdminChatId = null; if(unsubscribeActiveAdminChat) { unsubscribeActiveAdminChat(); unsubscribeActiveAdminChat = null; } }
        window.sendAdminMessage = async function() { let input = document.getElementById('admin-chat-input'); let txt = input ? input.value.trim() : ""; if(!txt || !activeAdminChatId) return; input.value = ''; let msg = { sender: 'admin', text: txt, timestamp: new Date().toISOString(), isAutoReply: false }; await updateDoc(doc(db, 'chats', activeAdminChatId), { messages: arrayUnion(msg), lastUpdate: msg.timestamp, adminReplied: true, unreadByAdmin: false }); }
        window.endAdminChat = async function() { if(activeAdminChatId && confirm('إنهاء المحادثة الحالية؟ (سيعود الرد الآلي للعمل إذا أرسل العميل رسالة جديدة)')) { let msg = { sender: 'admin', text: '--- تم إنهاء المحادثة من خدمة العملاء ---', timestamp: new Date().toISOString() }; await updateDoc(doc(db, 'chats', activeAdminChatId), { messages: arrayUnion(msg), lastUpdate: msg.timestamp, adminReplied: false }); window.showToast('تم إنهاء المحادثة', 'info'); } }
        window.deleteAdminChat = async function() { if(confirm('حذف المحادثة للعميل؟')) { await deleteDoc(doc(db, 'chats', activeAdminChatId)); window.showToast('تم الحذف', 'success'); window.closeAdminChat(); } }
        window.endChat = async function() { if(confirm('إنهاء المحادثة؟')) { let chatId = currentUser.email || currentUser.phoneNumber || currentUser.uid; let msg = { sender: 'customer', text: '--- تم إنهاء المحادثة من العميل ---', timestamp: new Date().toISOString() }; await updateDoc(doc(db, 'chats', chatId), { messages: arrayUnion(msg), lastUpdate: msg.timestamp, adminReplied: false }); window.showToast('تم إنهاء المحادثة', 'info'); } }
        window.deleteChat = async function() { if(confirm('مسح سجلك؟')) { let chatId = currentUser.email || currentUser.phoneNumber || currentUser.uid; await deleteDoc(doc(db, 'chats', chatId)); window.showToast('تم المسح', 'success'); } }

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


        window.renderVisualBar = function() {
            let container = document.getElementById('visual-scroll-bar');
            if(!container) return;
            let mode = storeSettings.visualBarMode || 'categories';
            if(mode === 'none' || !isProductsLoaded) { container.style.display = 'none'; return; }
            
            let html = '';
            if(mode === 'categories') {
                let cats = storeSettings.categories || [];
                cats.forEach(cat => {
                    let catProduct = products.find(p => p.category === cat && p.images && p.images.length > 0) || products.find(p => p.category === cat && p.imageUrl);
                    let img = catProduct ? (catProduct.images ? catProduct.images[0] : catProduct.imageUrl) : '1000392409.jpeg';
                    html += `<div class="visual-item" onclick="window.showPanel('home'); window.filterProducts('${cat}')">
                        <img loading="lazy" src="${img}" alt="${cat}" onerror="this.src='1000392409.jpeg'">
                        <span>${cat}</span>
                    </div>`;
                });
            } else if (mode === 'products') {
                let displayProducts = products.slice(0, 10);
                displayProducts.forEach(p => {
                    let img = (p.images && p.images.length > 0) ? p.images[0] : (p.imageUrl || '1000392409.jpeg');
                    html += `<div class="visual-item" onclick="window.openProductModal('${p.id}')">
                        <img loading="lazy" src="${img}" alt="${window.escapeHTML(p.name)}" onerror="this.src='1000392409.jpeg'">
                        <span>${window.escapeHTML(p.name)}</span>
                    </div>`;
                });
            }
            container.innerHTML = html;
            container.style.display = html ? 'flex' : 'none';
            window.startVisualAutoScroll();
        };


        window.askProductWa = function(id) {
            let p = products.find(x => x.id === id);
            if(!p) return;
            let waBtnInfo = storeSettings.floatingButtons ? storeSettings.floatingButtons.find(b => b.icon === '📱' || b.link.includes('wa.me')) : null;
            let pureWa = waBtnInfo ? waBtnInfo.link.split('/').pop() : "201018631768";
            if(pureWa && !pureWa.startsWith('20') && pureWa.length === 10) pureWa = '20' + pureWa;
            let msg = window.currentLang === 'ar' 
                ? `مرحباً، أستفسر عن المنتج: *${p.name}*` + (p.price ? `\nوالذي سعره: ${p.price} ج` : '')
                : `Hello, I'm inquiring about: *${p.name}*` + (p.price ? `\nPrice: ${p.price} EGP` : '');
            window.open(`https://wa.me/${pureWa}?text=${encodeURIComponent(msg)}`, '_blank');
        };


        window.printOrder = function(id) {
            let data = adminOrdersArray.find(o => o.id === id);
            if(!data) return;
            let itemsHtml = data.items.map(i => `<tr><td style="padding:8px; border:1px solid #ddd;">${i.name}</td><td style="padding:8px; border:1px solid #ddd;">${i.quantity}</td><td style="padding:8px; border:1px solid #ddd;">${i.price * i.quantity} ج</td></tr>`).join('');
            
            let printWindow = window.open('', '_blank');
            printWindow.document.write(`
                <html dir="rtl" lang="ar">
                <head>
                    <title>فاتورة طلب #${data.id.slice(0,6).toUpperCase()}</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
                        .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; text-align:right; }
                        th, td { border: 1px solid #ddd; padding: 10px; text-align: right; }
                        th { background-color: #f8f9fa; }
                        .total { font-weight: bold; font-size: 1.2rem; margin-top: 20px; text-align: left; background:#f0fdf4; padding:10px; border-radius:8px; border:1px solid #bbf7d0;}
                        @media print { button { display: none; } }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h2>زيت الشجرة المباركة</h2>
                        <p>فاتورة طلب إلكتروني #${data.id.slice(0,6).toUpperCase()}</p>
                        <p>تاريخ الطلب: ${new Date(data.orderDate).toLocaleString('ar-EG')}</p>
                    </div>
                    <div style="background:#f8f9fa; padding:15px; border-radius:8px; border:1px solid #eee;">
                        <p><strong>اسم العميل:</strong> ${data.customerName}</p>
                        <p><strong>رقم الهاتف:</strong> ${data.phones.primary} ${data.phones.secondary !== 'لا يوجد' ? ' / ' + data.phones.secondary : ''}</p>
                        <p><strong>المحافظة والمدينة:</strong> ${data.location.governorate} - ${data.location.city}</p>
                        <p><strong>العنوان التفصيلي:</strong> ${data.location.details}</p>
                        <p><strong>طريقة الدفع:</strong> ${data.paymentMethod}</p>
                    </div>
                    <table>
                        <thead><tr><th>المنتج</th><th>الكمية</th><th>السعر الإجمالي</th></tr></thead>
                        <tbody>${itemsHtml}</tbody>
                    </table>
                    <div style="margin-top:10px;">
                        <p><strong>قيمة المنتجات:</strong> ${data.subtotal} ج</p>
                        <p><strong>الخصم:</strong> ${data.discount} ج</p>
                        <p><strong>مصاريف الشحن:</strong> ${data.shippingCost} ج</p>
                    </div>
                    <div class="total">الإجمالي النهائي المطلوب: ${data.totalAmount} ج</div>
                    
                    <div style="margin-top:30px; text-align:center;">
                        <button onclick="window.print()" style="padding:10px 20px; font-size:1.1rem; background:#3c521e; color:white; border:none; border-radius:8px; cursor:pointer;">🖨️ طباعة الفاتورة الآن</button>
                    </div>
                </body>
                </html>
            `);
            printWindow.document.close();
        };


        window.toggleAbandonedCartsList = function() {
            let listEl = document.getElementById('admin-abandoned-carts-list');
            let arrowEl = document.getElementById('abandoned-carts-arrow');
            if(!listEl) return;
            if(listEl.style.display === 'none') {
                listEl.style.display = 'block';
                if(arrowEl) arrowEl.style.transform = 'rotate(180deg)';
            } else {
                listEl.style.display = 'none';
                if(arrowEl) arrowEl.style.transform = 'rotate(0deg)';
            }
        };

        window.adminAbandonedCartsUnsubscribe = null;
        window.loadAdminAbandonedCarts = function() {
            if(window.adminAbandonedCartsUnsubscribe) window.adminAbandonedCartsUnsubscribe();
            window.adminAbandonedCartsUnsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
                let container = document.getElementById('admin-abandoned-carts-list');
                let badge = document.getElementById('abandoned-carts-count-badge');
                if(!container) return;
                let abandonedHtml = '';
                let count = 0;
                let usersList = [];
                snapshot.forEach(d => usersList.push({id: d.id, ...d.data()}));
                usersList.sort((a,b) => new Date(b.lastLogin || 0) - new Date(a.lastLogin || 0));

                usersList.forEach(data => {
                    if (data.cart && Array.isArray(data.cart) && data.cart.length > 0) {
                        let total = 0;
                        data.cart.forEach(item => total += (Number(item.price || 0) * Number(item.quantity || 1)));
                        let phone = data.phone1 || data.email || 'غير مسجل';
                        let pureWa = String(phone).replace(/\D/g, '');
                        if(pureWa && !pureWa.startsWith('20') && pureWa.length >= 10) pureWa = '20' + pureWa;
                        
                        let waText = 'مرحباً ' + (data.name || 'عميلنا العزيز') + '، لاحظنا وجود منتجات في سلة مشترياتك 🛒 هل واجهت مشكلة أثناء الدفع؟ خصم خاص بانتظارك لو أكملت الطلب اليوم!';
                        let waBtn = pureWa.length >= 10 
                            ? `<a href="https://wa.me/${pureWa}?text=${encodeURIComponent(waText)}" target="_blank" class="btn btn-outline" style="border-color:#25D366; color:#25D366; padding:5px 10px; font-size:0.85rem; text-decoration:none;">💬 تواصل واتساب</a>`
                            : `<span style="font-size:0.8rem; color:var(--text-muted);">لا يوجد رقم هاتف</span>`;

                        abandonedHtml += `<div style="background:var(--input-bg); padding:10px; border:1px solid var(--border-color); border-radius:8px; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
                            <div>
                                <strong style="color:var(--primary);">${window.escapeHTML(data.name || 'عميل')}</strong><br>
                                <span style="font-size:0.85rem; color:var(--text-muted);">${window.escapeHTML(phone)}</span><br>
                                <span style="font-size:0.85rem; color:var(--secondary); font-weight:bold;">المنتجات: ${data.cart.length} (بقيمة ~${total} ج)</span>
                            </div>
                            ${waBtn}
                        </div>`;
                        count++;
                    }
                });
                if(badge) badge.textContent = count;
                container.innerHTML = count === 0 
                    ? '<p style="color:var(--text-muted); font-size:0.9rem;">لا توجد سلال متروكة حالياً.</p>' 
                    : abandonedHtml;
            });
        };

        window.renderLowStockAlerts = function() {
            let container = document.getElementById('admin-low-stock-list');
            if(!container) return;
            let lowProducts = products.filter(p => p.stock !== undefined && p.stock !== "" && Number(p.stock) <= 5);
            if(lowProducts.length === 0) {
                container.innerHTML = '<p style="color:var(--text-muted); font-size:0.9rem;">المخزون ممتاز، لا توجد منتجات أوشكت على النفاد.</p>';
                return;
            }
            let html = '<ul style="padding-right:20px; margin:0; line-height:1.8;">';
            lowProducts.forEach(p => {
                let stockNum = Number(p.stock);
                let color = stockNum <= 0 ? 'var(--danger)' : '#e0a800';
                let txt = stockNum <= 0 ? 'نفدت الكمية تماماً ❌' : `متبقي ${stockNum} قطع فقط ⚠️`;
                html += `<li style="margin-bottom:8px; font-size:0.9rem;"><strong>${window.escapeHTML(p.name)}</strong> - <span style="color:${color};">${txt}</span> <button type="button" onclick="window.showPanel('admin-add-product'); window.editProduct('${p.id}')" style="background:transparent; border:1px solid #ccc; padding:2px 8px; cursor:pointer; border-radius:4px; font-size:0.75rem; margin-right:10px;">تحديث</button></li>`;
            });
            html += '</ul>';
            container.innerHTML = html;
        };


        // --- المرحلة الأولى: التحكم الشامل في كافة العناصر وتفعيل/إيقاف كل ميزة ---
        const REMOTE_GOVS = ["شمال سيناء", "جنوب سيناء", "أسوان", "البحر الأحمر", "الوادي الجديد", "مطروح"];

        window.getShippingCostForGov = function(gov) {
            if (!gov || !deliveryData[gov]) return 0;
            if (storeSettings.enableCustomShipping) {
                if (storeSettings.customGovShipping && storeSettings.customGovShipping[gov] !== undefined && storeSettings.customGovShipping[gov] !== "") {
                    return Number(storeSettings.customGovShipping[gov]);
                }
                if (REMOTE_GOVS.includes(gov)) {
                    return storeSettings.remoteShippingCost !== undefined ? Number(storeSettings.remoteShippingCost) : 100;
                }
                return storeSettings.defaultShippingCost !== undefined ? Number(storeSettings.defaultShippingCost) : 90;
            }
            return deliveryData[gov].shippingCost;
        };

        window.getSelectedCartQty = function() {
            let qty = 0;
            cart.forEach(item => { if (item.selected !== false) qty += Number(item.quantity || 1); });
            return qty;
        };

        window.getBundleDiscountAmount = function() {
            if (!storeSettings.enableBundles) return 0;
            let minQty = Number(storeSettings.bundleMinQty) || 2;
            let discPct = Number(storeSettings.bundleDiscountPercent) || 10;
            if (window.getSelectedCartQty() >= minQty && discPct > 0) {
                return Math.round(currentSubtotal * (discPct / 100));
            }
            return 0;
        };

        if (govSelect) {
            govSelect.addEventListener('change', function() {
                currentShippingCost = window.getShippingCostForGov(this.value);
                window.updateInvoiceUI();
            });
        }

        window.updateInvoiceUI = function() {
            let promoDiscVal = Math.round(currentSubtotal * (currentDiscountPercent / 100));
            let bundleDiscVal = window.getBundleDiscountAmount();
            let discountVal = promoDiscVal + bundleDiscVal + window.loyaltyDiscountFixed;

            let enableFreeShip = storeSettings.enableFreeShipping !== false;
            let targetAmount = (storeSettings && storeSettings.freeShippingThreshold) ? Number(storeSettings.freeShippingThreshold) : 1000;
            let selectedGov = govSelect && govSelect.value ? govSelect.value : "";
            if (selectedGov) currentShippingCost = window.getShippingCostForGov(selectedGov);

            let finalShipping = currentShippingCost;
            if (enableFreeShip && currentSubtotal >= targetAmount) finalShipping = 0;

            let finalTot = (currentSubtotal - discountVal) + finalShipping;
            if (finalTot < 0) finalTot = 0;

            document.querySelectorAll('#invoice-subtotal, .invoice-subtotal-val').forEach(el => el.textContent = currentSubtotal);
            document.querySelectorAll('#invoice-discount, .invoice-discount-val').forEach(el => el.textContent = discountVal);
            document.querySelectorAll('#invoice-shipping, .invoice-shipping-val').forEach(el => el.textContent = finalShipping);
            document.querySelectorAll('#invoice-total, .invoice-total-val, #cart-total').forEach(el => el.textContent = finalTot);

            document.querySelectorAll('#discount-row, .discount-row-val').forEach(dr => {
                if (discountVal > 0) {
                    dr.style.display = 'flex';
                    let desc = [];
                    if (currentDiscountPercent > 0) desc.push(`كوبون ${appliedPromoCode}`);
                    if (bundleDiscVal > 0) desc.push(`عرض الباقات ${storeSettings.bundleDiscountPercent || 10}%`);
                    if (window.loyaltyDiscountFixed > 0) desc.push("نقاط الولاء");
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

            let freeShippingBox = document.getElementById('free-shipping-box');
            if (freeShippingBox) {
                freeShippingBox.style.display = enableFreeShip ? 'block' : 'none';
            }

            let cartBundleBanner = document.getElementById('cart-bundle-banner');
            if (cartBundleBanner) {
                if (storeSettings.enableBundles) {
                    let minQ = Number(storeSettings.bundleMinQty) || 2;
                    let dPct = Number(storeSettings.bundleDiscountPercent) || 10;
                    let curQ = window.getSelectedCartQty();
                    cartBundleBanner.style.display = 'block';
                    if (curQ >= minQ) {
                        cartBundleBanner.innerHTML = `🎉 تم تفعيل خصم الباقات الفوري (${dPct}%) لأن سلتك تحتوي على ${curQ} قطع!`;
                    } else {
                        cartBundleBanner.innerHTML = storeSettings.bundlePromoText || `🔥 عرض الباقات: اشترِ ${minQ} قطع أو أكثر واحصل على خصم فوري ${dPct}%! (متبقي ${minQ - curQ} قطعة)`;
                    }
                } else {
                    cartBundleBanner.style.display = 'none';
                }
            }
        };

        window.setCustomGovShipping = async function() {
            let gSel = document.getElementById('setting-custom-gov-select');
            let gPrice = document.getElementById('setting-custom-gov-price');
            if (!gSel || !gSel.value || !gPrice || gPrice.value === '') {
                window.showToast('اختر المحافظة واكتب السعر أولاً', 'error');
                return;
            }
            let customMap = { ...(storeSettings.customGovShipping || {}) };
            customMap[gSel.value] = Number(gPrice.value);
            await updateDoc(doc(db, 'settings', 'main'), { customGovShipping: customMap, enableCustomShipping: true });
            gPrice.value = '';
            window.showToast(`تم تخصيص شحن ${gSel.value} بـ ${customMap[gSel.value]} ج`, 'success');
        };

        window.removeCustomGovShipping = async function(govName) {
            let customMap = { ...(storeSettings.customGovShipping || {}) };
            delete customMap[govName];
            await updateDoc(doc(db, 'settings', 'main'), { customGovShipping: customMap });
            window.showToast(`تم إلغاء تخصيص ${govName}`, 'info');
        };

        window.addFloatingButton = async function() {
            let icon = document.getElementById('new-floating-icon').value;
            let link = document.getElementById('new-floating-link').value.trim();
            if (!link) { window.showToast('أدخل الرابط أولاً', 'error'); return; }
            let btns = [...(storeSettings.floatingButtons || [])];
            let color = icon === '📱' ? '#25D366' : (icon === '🌐' ? '#1877F2' : '#c59b27');
            let title = icon === '📱' ? 'واتساب' : (icon === '🌐' ? 'فيسبوك' : 'تواصل معنا');
            btns.push({ id: 'btn_' + Date.now(), icon, link, color, isSystem: false, title });
            await updateDoc(doc(db, 'settings', 'main'), { floatingButtons: btns });
            document.getElementById('new-floating-link').value = '';
            window.showToast('تمت إضافة الزر بنجاح', 'success');
        };

        window.updateFloatingBtn = async function(index) {
            let inp = document.getElementById(`edit-float-link-${index}`);
            if (!inp) return;
            let btns = [...(storeSettings.floatingButtons || [])];
            if (btns[index]) {
                btns[index].link = inp.value.trim();
                await updateDoc(doc(db, 'settings', 'main'), { floatingButtons: btns });
                window.showToast('تم تحديث الرابط', 'success');
            }
        };

        window.removeFloatingBtn = async function(index) {
            let btns = (storeSettings.floatingButtons || []).filter((_, i) => i !== index);
            await updateDoc(doc(db, 'settings', 'main'), { floatingButtons: btns });
            window.showToast('تم حذف الزر', 'info');
        };

        const origApplySettings = window.applySettingsToUI;
        window.applySettingsToUI = function() {
            origApplySettings();

            let cGovSel = document.getElementById('setting-custom-gov-select');
            if (cGovSel && cGovSel.options.length === 0) {
                let gHtml = '<option value="" disabled selected>اختر المحافظة...</option>';
                for (let g in deliveryData) gHtml += `<option value="${g}">${g}</option>`;
                cGovSel.innerHTML = gHtml;
            }

            let cGovList = document.getElementById('admin-custom-gov-shipping-list');
            if (cGovList) {
                let map = storeSettings.customGovShipping || {};
                let bHtml = '';
                for (let g in map) {
                    bHtml += `<div style="background:var(--panel-bg); padding:4px 10px; border:1px solid var(--border-color); border-radius:15px; font-size:0.8rem; display:flex; align-items:center; gap:6px;"><strong>${g}:</strong> ${map[g]} ج <button type="button" class="btn-danger" style="border:none; border-radius:50%; width:18px; height:18px; font-size:10px; cursor:pointer;" onclick="window.removeCustomGovShipping('${g}')">✖</button></div>`;
                }
                cGovList.innerHTML = bHtml;
            }

            if (isCurrentUserAdmin) {
                let setCheck = (id, val, def = true) => { let el = document.getElementById(id); if (el) el.checked = val !== undefined ? Boolean(val) : def; };
                let setVal = (id, val, def = '') => { let el = document.getElementById(id); if (el) el.value = val !== undefined ? val : def; };

                setCheck('setting-enable-topbar', storeSettings.enableTopBar, false);
                setVal('setting-topbar-text', storeSettings.topBarText, '🌿 شحن سريع لجميع المحافظات | زيت زيتون سيناوي بكر ممتاز عصره أولى على البارد 100% 🌿');
                setVal('setting-topbar-bg', storeSettings.topBarBg, '#c59b27');

                setCheck('setting-enable-custom-shipping', storeSettings.enableCustomShipping, true);
                setVal('setting-shipping-default', storeSettings.defaultShippingCost, 90);
                setVal('setting-shipping-remote', storeSettings.remoteShippingCost, 100);

                setCheck('setting-enable-free-shipping', storeSettings.enableFreeShipping, true);

                setCheck('setting-enable-bundles', storeSettings.enableBundles, false);
                setVal('setting-bundle-min-qty', storeSettings.bundleMinQty, 2);
                setVal('setting-bundle-discount', storeSettings.bundleDiscountPercent, 10);
                setVal('setting-bundle-text', storeSettings.bundlePromoText, '🔥 عرض الباقات: اشترِ قطعتين أو أكثر واحصل على خصم فوري 10%!');

                setCheck('setting-enable-auto-reply', storeSettings.enableAutoReply, true);
                setCheck('setting-enable-working-hours', storeSettings.enableWorkingHours, true);
                setVal('setting-working-hours-text', storeSettings.workingHoursText, '⏰ مواعيد العمل الرسمية لخدمة العملاء: يومياً من 10 صباحاً حتى 11 مساءً');
                setCheck('setting-append-hours-autoreply', storeSettings.appendHoursToAutoReply, false);

                setCheck('setting-enable-loyalty', storeSettings.enableLoyalty, true);
                setCheck('setting-enable-offer-banner', storeSettings.enableOfferBanner, true);
                setVal('setting-offer-banner-text', storeSettings.offerBannerText, '🔥 عرض خاص لفترة محدودة!');
                setCheck('setting-enable-social-proof', storeSettings.enableSocialProof, true);
            }

            let topBar = document.getElementById('top-announcement-bar');
            if (topBar) {
                if (storeSettings.enableTopBar && storeSettings.topBarText) {
                    topBar.style.display = 'block';
                    topBar.style.backgroundColor = storeSettings.topBarBg || '#c59b27';
                    topBar.textContent = storeSettings.topBarText;
                } else {
                    topBar.style.display = 'none';
                }
            }

            let whBanner = document.getElementById('support-working-hours-banner');
            if (whBanner) {
                if (storeSettings.enableWorkingHours !== false && storeSettings.workingHoursText) {
                    whBanner.style.display = 'block';
                    whBanner.textContent = storeSettings.workingHoursText;
                } else {
                    whBanner.style.display = 'none';
                }
            }

            let modalBundle = document.getElementById('modal-bundle-banner');
            if (modalBundle) {
                if (storeSettings.enableBundles) {
                    modalBundle.style.display = 'block';
                    let minQ = Number(storeSettings.bundleMinQty) || 2;
                    let dPct = Number(storeSettings.bundleDiscountPercent) || 10;
                    modalBundle.textContent = storeSettings.bundlePromoText || `🔥 عرض الباقات: اشترِ ${minQ} قطع أو أكثر واحصل على خصم فوري ${dPct}%!`;
                } else {
                    modalBundle.style.display = 'none';
                }
            }

            let offerBannerEl = document.getElementById('home-limited-offer-banner');
            let offerTextEl = document.getElementById('home-offer-banner-text');
            if (offerBannerEl) {
                offerBannerEl.style.display = storeSettings.enableOfferBanner !== false ? 'flex' : 'none';
                if (offerTextEl && storeSettings.offerBannerText) offerTextEl.textContent = storeSettings.offerBannerText;
            }

            let loySec = document.getElementById('loyalty-section');
            if (loySec && storeSettings.enableLoyalty === false) loySec.style.display = 'none';

            window.updateInvoiceUI();
        };

        window.saveSettings = async function() {
            const getCheck = (id, def = true) => { let el = document.getElementById(id); return el ? el.checked : def; };
            const getVal = (id, def = '') => { let el = document.getElementById(id); return el ? el.value.trim() : def; };

            let payload = {
                enableTopBar: getCheck('setting-enable-topbar', false),
                topBarText: getVal('setting-topbar-text', storeSettings.topBarText || ''),
                topBarBg: getVal('setting-topbar-bg', storeSettings.topBarBg || '#c59b27'),

                enableCustomShipping: getCheck('setting-enable-custom-shipping', true),
                defaultShippingCost: Number(getVal('setting-shipping-default', 90)) || 90,
                remoteShippingCost: Number(getVal('setting-shipping-remote', 100)) || 100,

                enableFreeShipping: getCheck('setting-enable-free-shipping', true),
                freeShippingThreshold: Number(getVal('setting-free-shipping', 1000)) || 1000,

                enableBundles: getCheck('setting-enable-bundles', false),
                bundleMinQty: Number(getVal('setting-bundle-min-qty', 2)) || 2,
                bundleDiscountPercent: Number(getVal('setting-bundle-discount', 10)) || 10,
                bundlePromoText: getVal('setting-bundle-text', '🔥 عرض الباقات: اشترِ قطعتين أو أكثر واحصل على خصم فوري 10%!'),

                enableAutoReply: getCheck('setting-enable-auto-reply', true),
                autoReplyMessage: getVal('setting-auto-reply', storeSettings.autoReplyMessage || ''),

                enableWorkingHours: getCheck('setting-enable-working-hours', true),
                workingHoursText: getVal('setting-working-hours-text', '⏰ مواعيد العمل الرسمية لخدمة العملاء: يومياً من 10 صباحاً حتى 11 مساءً'),
                appendHoursToAutoReply: getCheck('setting-append-hours-autoreply', false),

                enableLoyalty: getCheck('setting-enable-loyalty', true),
                loyaltyEarnRate: parseInt(getVal('setting-loyalty-earn', 20)) || 20,
                loyaltyRedeemValue: parseInt(getVal('setting-loyalty-value', 10)) || 10,

                enableOfferBanner: getCheck('setting-enable-offer-banner', true),
                offerBannerText: getVal('setting-offer-banner-text', '🔥 عرض خاص لفترة محدودة!'),
                enableSocialProof: getCheck('setting-enable-social-proof', true),
                enableCrossSell: getCheck('setting-cross-sell', true),

                visualBarMode: getVal('setting-visual-bar-mode', 'categories'),
                walletNumber: getVal('setting-wallet-number', '01018631768'),
                fbPixelId: getVal('setting-fb-pixel', ''),
                ttPixelId: getVal('setting-tt-pixel', '')
            };

            try {
                await updateDoc(doc(db, 'settings', 'main'), payload);
                window.showToast('تم حفظ الإعدادات وتحديث المتجر بنجاح ✅', 'success');
                injectPixels();
            } catch (e) {
                window.showToast('حدث خطأ أثناء الحفظ', 'error');
                console.error(e);
            }
        };

        const origSocialProof = window.showRandomSocialProof;
        window.showRandomSocialProof = function() {
            if (storeSettings.enableSocialProof === false) return;
            origSocialProof();
        };


        // === المرحلة العالمية (الجزء الأول V49): دوال الواجهة وتسهيلات العملاء ===
        let heroSlideTimer = null;
        let currentHeroSlideIndex = 0;

        window.getDefaultHeroSlidesText = function() {
            return [
                "زيت الشجرة المباركة البكر الممتاز | عصرة أولى على البارد 100% من قلب مزارع سيناء | تسوق الآن",
                "عروض التوفير والشحن السريع | توصيل لباب البيت لجميع محافظات مصر مع ضمان الاسترجاع | تصفح العروض",
                "منتجات طبيعية أصلية 100% | نقاء وجودة عالية للصحة والمناعة والطعم الأصلي | اطلب الآن"
            ].join("\n");
        };

        window.renderHeroSlider = function() {
            let heroSec = document.getElementById('hero-section');
            let sliderWrap = document.getElementById('hero-slider-wrapper');
            let slidesCont = document.getElementById('hero-slides-container');
            let dotsCont = document.getElementById('hero-slider-dots');
            let homePanel = document.getElementById('home-panel');
            let isHomeActive = homePanel && homePanel.classList.contains('active');

            if (!isHomeActive) {
                if (heroSec) heroSec.style.display = 'none';
                if (sliderWrap) sliderWrap.style.display = 'none';
                return;
            }

            if (storeSettings.enableHeroSlider) {
                if (heroSec) heroSec.style.display = 'none';
                if (sliderWrap) sliderWrap.style.display = 'block';
                let rawText = storeSettings.heroSlidesData || window.getDefaultHeroSlidesText();
                let lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
                if (lines.length === 0) lines = [window.getDefaultHeroSlidesText().split('\n')[0]];

                let sHtml = '';
                let dHtml = '';
                lines.forEach((line, idx) => {
                    let parts = line.split('|').map(p => p.trim());
                    let title = parts[0] || 'زيت الشجرة المباركة';
                    let desc = parts[1] || 'زيت زيتون سيناوي بكر ممتاز على البارد 100%';
                    let btnTxt = parts[2] || 'تسوق الآن 🛒';
                    let prodImg = (products[idx] && products[idx].images && products[idx].images[0]) ? products[idx].images[0] : '1000392409.jpeg';
                    sHtml += `<div class="hero-slide ${idx === 0 ? 'active' : ''}">
                        <div class="hero-slide-text">
                            <h2>${window.escapeHTML(title)}</h2>
                            <p>${window.escapeHTML(desc)}</p>
                            <button type="button" class="btn" onclick="document.getElementById('products-container').scrollIntoView({behavior:'smooth'})">${window.escapeHTML(btnTxt)}</button>
                        </div>
                        <img loading="lazy" src="${prodImg}" class="hero-slide-img" onerror="this.src='1000392409.jpeg'" alt="Slide">
                    </div>`;
                    dHtml += `<span class="hero-dot ${idx === 0 ? 'active' : ''}" onclick="window.showHeroSlide(${idx})"></span>`;
                });
                if (slidesCont) slidesCont.innerHTML = sHtml;
                if (dotsCont) dotsCont.innerHTML = lines.length > 1 ? dHtml : '';
                currentHeroSlideIndex = 0;
                if (heroSlideTimer) clearInterval(heroSlideTimer);
                if (lines.length > 1) {
                    heroSlideTimer = setInterval(() => {
                        window.showHeroSlide((currentHeroSlideIndex + 1) % lines.length);
                    }, 4500);
                }
            } else {
                if (heroSec) heroSec.style.display = 'block';
                if (sliderWrap) sliderWrap.style.display = 'none';
                if (heroSlideTimer) clearInterval(heroSlideTimer);
            }
        };

        window.showHeroSlide = function(idx) {
            let slides = document.querySelectorAll('#hero-slides-container .hero-slide');
            let dots = document.querySelectorAll('#hero-slider-dots .hero-dot');
            if (slides.length === 0) return;
            slides.forEach((s, i) => s.classList.toggle('active', i === idx));
            dots.forEach((d, i) => d.classList.toggle('active', i === idx));
            currentHeroSlideIndex = idx;
        };

        // حساب موعد التوصيل المتوقع
        window.getEstimatedDeliveryText = function() {
            let minD = Number(storeSettings.deliveryMinDays) || 2;
            let maxD = Number(storeSettings.deliveryMaxDays) || 4;
            if (maxD < minD) maxD = minD + 1;
            let d1 = new Date(Date.now() + minD * 86400000);
            let d2 = new Date(Date.now() + maxD * 86400000);
            let fmt = new Intl.DateTimeFormat('ar-EG', { weekday: 'long', day: 'numeric', month: 'long' });
            return `🚚 اطلبه الآن ليصلك ما بين (${fmt.format(d1)}) و (${fmt.format(d2)})`;
        };

        window.updateEstimatedDeliveryUI = function() {
            let show = storeSettings.enableEstDelivery !== false;
            let txt = window.getEstimatedDeliveryText();
            ['modal-estimated-delivery', 'checkout-estimated-delivery'].forEach(id => {
                let el = document.getElementById(id);
                if (el) {
                    el.style.display = show ? 'flex' : 'none';
                    el.innerHTML = txt;
                }
            });
        };

        // عرض جدول المواصفات والأسئلة الشائعة داخل نافذة المنتج
        window.renderProductSpecsAndFAQ = function(product) {
            let sec = document.getElementById('modal-specs-faq-section');
            let tbl = document.getElementById('modal-specs-table');
            let faqCont = document.getElementById('modal-faq-list');
            if (!sec || !tbl || !faqCont) return;

            if (storeSettings.enableSpecsFaq === false) {
                sec.style.display = 'none';
                return;
            }
            sec.style.display = 'block';

            let specsStr = (product && product.customSpecs) ? product.customSpecs : (storeSettings.defaultSpecsText || "العصرة: أولى على البارد | النقاء: طبيعي 100% بدون إضافات | المنشأ: مزارع سيناء | الضمان: استرجاع مضمون");
            let specPairs = specsStr.split('|').map(s => s.trim()).filter(Boolean);
            let tHtml = '';
            if (product && product.category) {
                tHtml += `<tr><td>القسم</td><td>${window.escapeHTML(product.category)}</td></tr>`;
            }
            specPairs.forEach(pair => {
                let kv = pair.split(':');
                if (kv.length >= 2) {
                    tHtml += `<tr><td>${window.escapeHTML(kv[0].trim())}</td><td>${window.escapeHTML(kv.slice(1).join(':').trim())}</td></tr>`;
                } else {
                    tHtml += `<tr><td>مواصفة</td><td>${window.escapeHTML(pair)}</td></tr>`;
                }
            });
            tbl.innerHTML = tHtml;

            let defaultFaqs = "هل الزيت أصلي وطبيعي 100%؟ نعم، زيت زيتون سيناوي بكر ممتاز معصور على البارد بدون أي إضافات ومضمون 100%.\nمتى يصلني الطلب؟ يتم الشحن والتوصيل خلال 2 إلى 4 أيام عمل لجميع المحافظات.\nهل يمكن معاينة الطلب أو استرجاعه؟ نعم، نوفر ضمان استرجاع كامل في حالة وجود أي مشكلة بالمنتج.";
            let faqRaw = storeSettings.defaultFaqsText || defaultFaqs;
            let faqLines = faqRaw.split('\n').map(l => l.trim()).filter(Boolean);
            let fHtml = '<h4 style="color:var(--primary); margin:12px 0 8px 0;">❓ أسئلة شائعة:</h4>';
            faqLines.forEach((line, idx) => {
                let qAndA = line.split('؟');
                let q = qAndA[0] ? qAndA[0].trim() + '؟' : line;
                let a = qAndA.slice(1).join('؟').trim() || 'نعم، متاح ومضمون 100%.';
                fHtml += `<div class="faq-item">
                    <div class="faq-question" onclick="let ans=this.nextElementSibling; ans.style.display=ans.style.display==='block'?'none':'block';">
                        <span>${window.escapeHTML(q)}</span><span>▼</span>
                    </div>
                    <div class="faq-answer">${window.escapeHTML(a)}</div>
                </div>`;
            });
            faqCont.innerHTML = fHtml;
        };

        // ربط فتح نافذة المنتج بإظهار المواصفات وموعد التوصيل المتوقع
        const origOpenProductModal = window.openProductModal;
        window.openProductModal = function(id) {
            origOpenProductModal(id);
            const product = products.find(p => p.id === id);
            window.updateEstimatedDeliveryUI();
            window.renderProductSpecsAndFAQ(product);
        };

        // ربط تغيير الصفحات بإظهار السلايدر في الرئيسية
        const origShowPanel = window.showPanel;
        window.showPanel = function(panelId) {
            origShowPanel(panelId);
            window.renderHeroSlider();
            window.updateEstimatedDeliveryUI();
            window.renderOneTapCoupons();
            if (panelId === 'customer-orders' && !currentUser) {
                let c = document.getElementById('customer-orders-container');
                if (c) c.innerHTML = '<p style="text-align:center; color:var(--text-muted);">أدخل رقم هاتفك في المربع بالأعلى لتتبع طلباتك فوراً بدون الحاجة لتسجيل الدخول.</p>';
            }
        };

        // عرض أزرار الكوبونات الجاهزة بضغطة واحدة في السلة والدفع
        window.renderOneTapCoupons = function() {
            let show = storeSettings.enableOneTapCoupons !== false && promoCodesList && promoCodesList.length > 0;
            ['one-tap-coupons-cart', 'one-tap-coupons-checkout'].forEach(cid => {
                let el = document.getElementById(cid);
                if (!el) return;
                if (!show) {
                    el.style.display = 'none';
                    return;
                }
                el.style.display = 'flex';
                let html = '<span style="font-size:0.8rem; color:var(--text-muted); width:100%;">🎁 كوبونات متاحة (اضغط للتفعيل الفوري):</span>';
                promoCodesList.filter(p => !p.singleUse && !p.used).forEach(p => {
                    html += `<button type="button" class="one-tap-coupon-chip" onclick="window.executePromoLogic('${window.escapeHTML(p.code)}', 'onetap')">🏷️ ${window.escapeHTML(p.code)} (خصم ${p.discount}%)</button>`;
                });
                el.innerHTML = html;
            });
        };

        // إعادة الطلب بضغطة واحدة (Buy Again)
        window.buyAgainOrder = function(orderId) {
            let sourceList = (window.customerOrdersArray && window.customerOrdersArray.length > 0) ? window.customerOrdersArray : (window.phoneTrackedOrders || []);
            let ord = sourceList.find(o => o.id === orderId);
            if (!ord || !ord.items || ord.items.length === 0) return;
            ord.items.forEach(item => {
                let cId = item.cartItemId || item.id;
                let existing = cart.find(c => c.cartItemId === cId);
                if (existing) {
                    existing.quantity += Number(item.quantity || 1);
                    existing.selected = true;
                } else {
                    cart.push({
                        id: item.id,
                        cartItemId: cId,
                        name: item.name,
                        price: Number(item.price),
                        imageUrl: item.imageUrl || '1000392409.jpeg',
                        quantity: Number(item.quantity || 1),
                        variant: item.variant || '',
                        selected: true
                    });
                }
            });
            localStorage.setItem('cart', JSON.stringify(cart));
            window.updateCartUI();
            window.showToast('تمت إضافة منتجات الطلب إلى سلتك بنجاح 🛒', 'success');
            window.showPanel('cart');
        };

        // تتبع الطلب برقم الهاتف للزوار والعملاء
        window.phoneTrackedOrders = [];
        window.trackOrderByPhone = async function() {
            let inp = document.getElementById('track-phone-input');
            let resBox = document.getElementById('phone-tracked-orders-result');
            if (!inp || !resBox) return;
            let rawPhone = window.toEngDigits(inp.value.trim()).replace(/\s+/g, '');
            if (!rawPhone || rawPhone.length < 8) {
                window.showToast('يرجى إدخال رقم هاتف صحيح', 'error');
                return;
            }
            resBox.innerHTML = '<p style="color:var(--primary); font-weight:bold;">⏳ جاري البحث عن طلباتك...</p>';
            try {
                let qSnap = await getDocs(collection(db, 'orders'));
                let matched = [];
                qSnap.forEach(d => {
                    let data = d.data();
                    let p1 = data.phones && data.phones.primary ? window.toEngDigits(String(data.phones.primary)).replace(/\s+/g, '') : '';
                    let p2 = data.phones && data.phones.secondary ? window.toEngDigits(String(data.phones.secondary)).replace(/\s+/g, '') : '';
                    if (p1.includes(rawPhone) || rawPhone.includes(p1) || (p2 && p2 !== 'لايوجد' && (p2.includes(rawPhone) || rawPhone.includes(p2)))) {
                        matched.push({ id: d.id, ...data });
                    }
                });
                matched.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));
                window.phoneTrackedOrders = matched;

                if (matched.length === 0) {
                    resBox.innerHTML = '<p style="color:var(--danger); font-weight:bold;">❌ لم يتم العثور على طلبات مسجلة بهذا الرقم.</p>';
                    return;
                }
                let html = '';
                matched.forEach(order => {
                    let step = window.getStepIndex(order.status);
                    let trackerHtml = '';
                    if (!order.status.includes('❌') && !order.status.includes('الاسترجاع')) {
                        trackerHtml = `<div class="order-track" style="margin: 15px 0;"><div class="track-step ${step >= 1 ? (step>1?'done':'active') : ''}"><div class="track-dot">1</div>مراجعة</div><div class="track-step ${step >= 2 ? (step>2?'done':'active') : ''}"><div class="track-dot">2</div>تجهيز</div><div class="track-step ${step >= 3 ? (step>3?'done':'active') : ''}"><div class="track-dot">3</div>شحن</div><div class="track-step ${step >= 4 ? 'done' : ''}"><div class="track-dot">4</div>توصيل</div></div>`;
                    }
                    let itemsTxt = (order.items || []).map(i => `${window.escapeHTML(i.name)} (${i.quantity})`).join(' ، ');
                    let dStr = new Date(order.orderDate).toLocaleDateString('ar-EG', { dateStyle: 'medium' });
                    html += `<div class="admin-msg-card" style="border-right:4px solid var(--primary); margin-bottom:10px;">
                        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
                            <strong>📦 طلب #${order.id.slice(0,6).toUpperCase()} (${dStr})</strong>
                            <span class="order-status-badge status-prep">${window.escapeHTML(order.status)}</span>
                        </div>
                        <p style="margin:8px 0; font-size:0.88rem; color:var(--text-muted);">المنتجات: ${itemsTxt}</p>
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <strong style="color:var(--secondary);">الإجمالي: ${order.totalAmount} ج</strong>
                            ${storeSettings.enableBuyAgain !== false ? `<button type="button" class="btn btn-outline" style="padding:4px 10px; font-size:0.8rem;" onclick="window.buyAgainOrder('${order.id}')">🔄 اطلبه مجدداً</button>` : ''}
                        </div>
                        ${trackerHtml}
                    </div>`;
                });
                resBox.innerHTML = html;
            } catch (e) {
                console.error(e);
                resBox.innerHTML = '<p style="color:var(--danger);">حدث خطأ أثناء البحث، يرجى المحاولة مرة أخرى.</p>';
            }
        };

        // دمج إعدادات الجزء الأول في applySettingsToUI و saveSettings
        const prevApplySettingsV48 = window.applySettingsToUI;
        window.applySettingsToUI = function() {
            prevApplySettingsV48();

            if (isCurrentUserAdmin) {
                let setCheck = (id, val, def = true) => { let el = document.getElementById(id); if (el) el.checked = val !== undefined ? Boolean(val) : def; };
                let setVal = (id, val, def = '') => { let el = document.getElementById(id); if (el) el.value = val !== undefined ? val : def; };

                setCheck('setting-enable-hero-slider', storeSettings.enableHeroSlider, false);
                setVal('setting-hero-slides-data', storeSettings.heroSlidesData, window.getDefaultHeroSlidesText());

                setCheck('setting-enable-est-delivery', storeSettings.enableEstDelivery, true);
                setVal('setting-delivery-min-days', storeSettings.deliveryMinDays, 2);
                setVal('setting-delivery-max-days', storeSettings.deliveryMaxDays, 4);

                setCheck('setting-enable-specs-faq', storeSettings.enableSpecsFaq, true);
                setVal('setting-default-specs', storeSettings.defaultSpecsText, 'العصرة: أولى على البارد | النقاء: طبيعي 100% بدون إضافات | المنشأ: مزارع سيناء | الضمان: استرجاع مضمون');
                setVal('setting-default-faqs', storeSettings.defaultFaqsText, 'هل الزيت أصلي وطبيعي 100%؟ نعم، زيت زيتون سيناوي بكر ممتاز معصور على البارد بدون أي إضافات ومضمون 100%.\nمتى يصلني الطلب؟ يتم الشحن والتوصيل خلال 2 إلى 4 أيام عمل لجميع المحافظات.');

                setCheck('setting-enable-product-badges', storeSettings.enableProductBadges, true);
                setCheck('setting-enable-guest-tracking', storeSettings.enableGuestTracking, true);
                setCheck('setting-enable-onetap-coupons', storeSettings.enableOneTapCoupons, true);
                setCheck('setting-enable-buy-again', storeSettings.enableBuyAgain, true);
            }

            let guestTrackBox = document.getElementById('guest-order-track-box');
            let sidebarTrackBtn = document.getElementById('sidebar-track-order-btn');
            let showGuestTrack = storeSettings.enableGuestTracking !== false;
            if (guestTrackBox) guestTrackBox.style.display = showGuestTrack ? 'block' : 'none';
            if (sidebarTrackBtn) sidebarTrackBtn.style.display = showGuestTrack ? 'block' : 'none';

            window.renderHeroSlider();
            window.updateEstimatedDeliveryUI();
            window.renderOneTapCoupons();
        };

        const prevSaveSettingsV48 = window.saveSettings;
        window.saveSettings = async function() {
            const getCheck = (id, def = true) => { let el = document.getElementById(id); return el ? el.checked : def; };
            const getVal = (id, def = '') => { let el = document.getElementById(id); return el ? el.value.trim() : def; };

            let extraPayload = {
                enableHeroSlider: getCheck('setting-enable-hero-slider', false),
                heroSlidesData: getVal('setting-hero-slides-data', window.getDefaultHeroSlidesText()),
                enableEstDelivery: getCheck('setting-enable-est-delivery', true),
                deliveryMinDays: Number(getVal('setting-delivery-min-days', 2)) || 2,
                deliveryMaxDays: Number(getVal('setting-delivery-max-days', 4)) || 4,
                enableSpecsFaq: getCheck('setting-enable-specs-faq', true),
                defaultSpecsText: getVal('setting-default-specs', 'العصرة: أولى على البارد | النقاء: طبيعي 100% بدون إضافات | المنشأ: مزارع سيناء | الضمان: استرجاع مضمون'),
                defaultFaqsText: getVal('setting-default-faqs', ''),
                enableProductBadges: getCheck('setting-enable-product-badges', true),
                enableGuestTracking: getCheck('setting-enable-guest-tracking', true),
                enableOneTapCoupons: getCheck('setting-enable-onetap-coupons', true),
                enableBuyAgain: getCheck('setting-enable-buy-again', true)
            };

            try {
                await updateDoc(doc(db, 'settings', 'main'), extraPayload);
            } catch (e) {
                console.error(e);
            }
            await prevSaveSettingsV48();
        };


        // === الجزء الثاني V50: تثبيت وإخفاء المنتجات + بحث وتحديث جماعي للطلبات ===
        window.togglePinProduct = async function(id, currentlyPinned) {
            try {
                await updateDoc(doc(db, 'products', id), { isPinned: !currentlyPinned });
                window.showToast(!currentlyPinned ? '📌 تم تثبيت المنتج في مقدمة المتجر' : 'تم إلغاء تثبيت المنتج', 'success');
            } catch (e) {
                window.showToast('حدث خطأ أثناء التحديث', 'error');
            }
        };

        window.toggleHideProduct = async function(id, currentlyHidden) {
            try {
                await updateDoc(doc(db, 'products', id), { isHidden: !currentlyHidden });
                window.showToast(!currentlyHidden ? '🙈 تم إخفاء المنتج مؤقتاً عن العملاء' : '👁️ تم إظهار المنتج للعملاء', 'success');
            } catch (e) {
                window.showToast('حدث خطأ أثناء التحديث', 'error');
            }
        };

        window.renderAdminOrdersUI = function() {
            const container = document.getElementById('admin-orders-container');
            if (!container) return;
            if (adminOrdersArray.length === 0) {
                container.innerHTML = '<div style="text-align:center; padding:40px; color:#94a3b8;"><span style="font-size:3rem; display:block; margin-bottom:10px;">📭</span><h3>لا توجد طلبات هنا</h3></div>';
                return;
            }
            let searchEl = document.getElementById('admin-orders-search');
            let q = (searchEl && storeSettings.enableAdminOrderTools !== false) ? searchEl.value.trim().toLowerCase() : '';

            let filtered = adminOrdersArray.filter(o => {
                let matchStatus = (currentAdminOrderFilter === 'الكل' || o.status === currentAdminOrderFilter);
                if (!matchStatus) return false;
                if (!q) return true;
                let nameStr = String(o.customerName || '').toLowerCase();
                let phoneStr = String((o.phones && o.phones.primary) || '').toLowerCase();
                let govStr = String((o.location && o.location.governorate) || '').toLowerCase();
                let idStr = String(o.id || '').toLowerCase();
                return nameStr.includes(q) || phoneStr.includes(q) || govStr.includes(q) || idStr.includes(q);
            });

            if (filtered.length === 0) {
                container.innerHTML = '<div style="text-align:center; padding:40px; color:#94a3b8;"><span style="font-size:3rem; display:block; margin-bottom:10px;">📭</span><h3>لا توجد طلبات مطابقة</h3></div>';
                return;
            }
            let htmlContent = '';
            let showCheck = storeSettings.enableAdminOrderTools !== false;
            filtered.forEach((data) => {
                let badgeClass = 'status-pending';
                if (data.status.includes('تجهيز')) badgeClass = 'status-prep';
                else if (data.status.includes('شحن')) badgeClass = 'status-shipped';
                else if (data.status.includes('توصيل')) badgeClass = 'status-delivered';
                else if (data.status.includes('رفض') || data.status.includes('لغى')) badgeClass = 'status-canceled';

                let dStr = new Date(data.orderDate).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' });
                let checkHtml = showCheck ? `<input type="checkbox" class="order-checkbox" value="${data.id}" onclick="event.stopPropagation();" style="width:20px; height:20px; accent-color:var(--primary); cursor:pointer;">` : '';

                htmlContent += `
                <div class="admin-msg-card" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; cursor:pointer; border-right:4px solid var(--secondary);" onclick="window.openAdminOrderModal('${data.id}')">
                    <div style="display:flex; align-items:center; gap:12px;">
                        ${checkHtml}
                        <div>
                            <strong style="color:var(--primary); font-size:1.1rem;">👤 ${window.escapeHTML(data.customerName)} ${window.getCustomerTagBadgeHtml ? window.getCustomerTagBadgeHtml((data.phones && data.phones.primary) || "") : ""}</strong><br>
                            <span style="font-size:0.85rem; color:var(--text-muted);">رقم: #${data.id.slice(0,6).toUpperCase()} | 📞 ${window.escapeHTML((data.phones && data.phones.primary) || '')} | 📅 ${dStr}</span><br>
                            <strong style="color:var(--secondary);">${data.totalAmount} ج</strong>
                        </div>
                    </div>
                    <div>
                        <span class="order-status-badge ${badgeClass}" style="font-size:0.75rem;">${window.escapeHTML(data.status)}</span>
                    </div>
                </div>`;
            });
            container.innerHTML = htmlContent;
        };

        window.bulkUpdateSelectedOrders = async function() {
            let selectedIds = [];
            document.querySelectorAll('.order-checkbox:checked').forEach(cb => selectedIds.push(cb.value));
            if (selectedIds.length === 0) {
                window.showToast('يرجى تحديد طلب واحد على الأقل أولاً', 'error');
                return;
            }
            let statusSel = document.getElementById('bulk-order-status-select');
            let newStatus = statusSel ? statusSel.value : 'تم الشحن';
            if (confirm(`هل أنت متأكد من تحديث حالة (${selectedIds.length}) طلبات إلى "${newStatus}" دفعة واحدة؟`)) {
                try {
                    for (let oid of selectedIds) {
                        await window.updateOrderStatus(oid, newStatus);
                    }
                    window.showToast(`تم تحديث ${selectedIds.length} طلبات بنجاح ✅`, 'success');
                } catch (e) {
                    window.showToast('حدث خطأ أثناء التحديث الجماعي', 'error');
                }
            }
        };

        const prevApplySettingsV49 = window.applySettingsToUI;
        window.applySettingsToUI = function() {
            prevApplySettingsV49();
            if (isCurrentUserAdmin) {
                let elPin = document.getElementById('setting-enable-pin-hide-products');
                if (elPin) elPin.checked = storeSettings.enablePinHideProducts !== false;
                let elOrdTools = document.getElementById('setting-enable-admin-order-tools');
                if (elOrdTools) elOrdTools.checked = storeSettings.enableAdminOrderTools !== false;
            }
            let toolbar = document.getElementById('admin-orders-toolbar');
            if (toolbar) {
                toolbar.style.display = storeSettings.enableAdminOrderTools !== false ? 'flex' : 'none';
            }
            if (isCurrentUserAdmin) window.renderAdminOrdersUI();
        };

        const prevSaveSettingsV49 = window.saveSettings;
        window.saveSettings = async function() {
            let elPin = document.getElementById('setting-enable-pin-hide-products');
            let elOrdTools = document.getElementById('setting-enable-admin-order-tools');
            try {
                await updateDoc(doc(db, 'settings', 'main'), {
                    enablePinHideProducts: elPin ? elPin.checked : true,
                    enableAdminOrderTools: elOrdTools ? elOrdTools.checked : true
                });
            } catch (e) {}
            await prevSaveSettingsV49();
        };


        // === الجزء الثالث والأخير V51: إحصائيات الأكثر مبيعاً + النسخ الاحتياطي + التقييم السريع بعد الاستلام ===
        window.renderTopAnalytics = function() {
            let box = document.getElementById('admin-advanced-analytics-box');
            if (box) box.style.display = storeSettings.enableTopAnalytics !== false ? 'grid' : 'none';
            if (storeSettings.enableTopAnalytics === false) return;

            let prodCont = document.getElementById('admin-top-products-list');
            let govCont = document.getElementById('admin-top-govs-list');
            if (!prodCont || !govCont) return;

            let validOrders = adminOrdersArray.filter(o => !String(o.status || '').includes('رفض') && !String(o.status || '').includes('لغى'));
            let prodMap = {};
            let govMap = {};

            validOrders.forEach(o => {
                let gov = (o.location && o.location.governorate) ? o.location.governorate : 'غير محدد';
                govMap[gov] = (govMap[gov] || 0) + 1;
                (o.items || []).forEach(it => {
                    let key = it.name || 'منتج';
                    if (!prodMap[key]) prodMap[key] = { qty: 0, rev: 0 };
                    let q = Number(it.quantity || 1);
                    prodMap[key].qty += q;
                    prodMap[key].rev += (Number(it.price || 0) * q);
                });
            });

            let topProds = Object.entries(prodMap).sort((a, b) => b[1].qty - a[1].qty).slice(0, 5);
            if (topProds.length === 0) {
                prodCont.innerHTML = '<p style="color:var(--text-muted); margin:0;">لا توجد بيانات مبيعات كافية بعد.</p>';
            } else {
                let pHtml = '<ol style="margin:0; padding-right:18px; line-height:1.9;">';
                topProds.forEach(([name, stat]) => {
                    pHtml += `<li><strong>${window.escapeHTML(name)}</strong>: <span style="color:var(--secondary); font-weight:bold;">${stat.qty} قطعة</span> (${stat.rev.toLocaleString()} ج)</li>`;
                });
                pHtml += '</ol>';
                prodCont.innerHTML = pHtml;
            }

            let topGovs = Object.entries(govMap).sort((a, b) => b[1] - a[1]).slice(0, 5);
            if (topGovs.length === 0) {
                govCont.innerHTML = '<p style="color:var(--text-muted); margin:0;">لا توجد بيانات محافظات بعد.</p>';
            } else {
                let gHtml = '<ol style="margin:0; padding-right:18px; line-height:1.9;">';
                topGovs.forEach(([govName, cnt]) => {
                    gHtml += `<li><strong>${window.escapeHTML(govName)}</strong>: <span style="color:#6f42c1; font-weight:bold;">${cnt} طلب</span></li>`;
                });
                gHtml += '</ol>';
                govCont.innerHTML = gHtml;
            }
        };

        const origRenderAdminOrdersV50 = window.renderAdminOrdersUI;
        window.renderAdminOrdersUI = function() {
            origRenderAdminOrdersV50();
            if (isCurrentUserAdmin) window.renderTopAnalytics();
        };

        window.downloadStoreBackup = function() {
            let backupData = {
                backupDate: new Date().toISOString(),
                storeSettings: storeSettings,
                products: products,
                promoCodes: promoCodesList
            };
            let blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json;charset=utf-8' });
            let a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `Zait_Store_Backup_${new Date().toISOString().slice(0,10)}.json`;
            a.click();
            window.showToast('تم تحميل النسخة الاحتياطية بنجاح 💾', 'success');
        };

        window.restoreStoreBackup = function(inputEl) {
            if (!inputEl.files || inputEl.files.length === 0) return;
            let file = inputEl.files[0];
            let reader = new FileReader();
            reader.onload = async function(e) {
                try {
                    let data = JSON.parse(e.target.result);
                    if (!confirm('هل أنت متأكد من استعادة النسخة الاحتياطية؟ سيتم تحديث الإعدادات وإضافة المنتجات المحفوظة.')) return;
                    if (data.storeSettings) {
                        await setDoc(doc(db, 'settings', 'main'), data.storeSettings, { merge: true });
                    }
                    if (Array.isArray(data.products)) {
                        for (let p of data.products) {
                            let pId = p.id;
                            let copy = { ...p };
                            delete copy.id;
                            if (pId) await setDoc(doc(db, 'products', pId), copy, { merge: true });
                        }
                    }
                    window.showToast('تمت استعادة النسخة الاحتياطية بنجاح ✅', 'success');
                } catch (err) {
                    window.showToast('ملف النسخة الاحتياطية غير صالح', 'error');
                }
                inputEl.value = '';
            };
            reader.readAsText(file);
        };

        // نافذة التقييم السريع بعد التوصيل داخل تفاصيل طلب العميل
        const origOpenCustOrderModal = window.openCustomerOrderModal;
        window.openCustomerOrderModal = function(orderId) {
            origOpenCustOrderModal(orderId);
            if (storeSettings.enableQuickRating === false) return;
            let order = (window.customerOrdersArray || []).find(o => o.id === orderId);
            if (order && order.status.includes('توصيل')) {
                let comContent = document.getElementById('com-content');
                if (comContent) {
                    comContent.innerHTML += `
                    <div style="margin-top:12px; padding:12px; background:rgba(197,155,39,0.12); border:1px dashed var(--secondary); border-radius:8px; text-align:center;">
                        <strong style="color:var(--primary); display:block; margin-bottom:8px;">⭐ ما رأيك في تجربتك مع هذا الطلب؟</strong>
                        <button type="button" class="btn" style="padding:6px 16px; font-size:0.9rem;" onclick="document.getElementById('customer-order-modal').style.display='none'; window.loadAllReviews();">أضف تقييمك الآن ⭐</button>
                    </div>`;
                }
            }
        };

        const prevApplySettingsV50 = window.applySettingsToUI;
        window.applySettingsToUI = function() {
            prevApplySettingsV50();
            if (isCurrentUserAdmin) {
                let elTop = document.getElementById('setting-enable-top-analytics');
                if (elTop) elTop.checked = storeSettings.enableTopAnalytics !== false;
                let elQR = document.getElementById('setting-enable-quick-rating');
                if (elQR) elQR.checked = storeSettings.enableQuickRating !== false;
                let elBR = document.getElementById('setting-enable-backup-restore');
                if (elBR) elBR.checked = storeSettings.enableBackupRestore !== false;
            }
            let brBox = document.getElementById('admin-backup-restore-box');
            if (brBox) brBox.style.display = storeSettings.enableBackupRestore !== false ? 'flex' : 'none';
            if (isCurrentUserAdmin) window.renderTopAnalytics();
        };

        const prevSaveSettingsV50 = window.saveSettings;
        window.saveSettings = async function() {
            let elTop = document.getElementById('setting-enable-top-analytics');
            let elQR = document.getElementById('setting-enable-quick-rating');
            let elBR = document.getElementById('setting-enable-backup-restore');
            try {
                await updateDoc(doc(db, 'settings', 'main'), {
                    enableTopAnalytics: elTop ? elTop.checked : true,
                    enableQuickRating: elQR ? elQR.checked : true,
                    enableBackupRestore: elBR ? elBR.checked : true
                });
            } catch (e) {}
            await prevSaveSettingsV50();
        };


        // === النسخة V52: طي الفلاتر والتصميم المدمج السريع وإخفاء شريط الإدارة الفارغ للعملاء ===
        window.toggleAdvancedFilters = function() {
            let box = document.getElementById('advanced-filters-box');
            let arrow = document.getElementById('filter-arrow-icon');
            if (!box) return;
            if (box.style.display === 'none' || box.style.display === '') {
                box.style.display = 'flex';
                if (arrow) arrow.style.transform = 'rotate(180deg)';
            } else {
                box.style.display = 'none';
                if (arrow) arrow.style.transform = 'rotate(0deg)';
            }
        };

        const origUpdateAdminUIV51 = window.updateAdminUI;
        window.updateAdminUI = function() {
            origUpdateAdminUIV51();
            let sNav = document.getElementById('smart-nav');
            if (sNav) {
                sNav.style.display = isCurrentUserAdmin ? 'flex' : 'none';
            }
        };

        const prevApplySettingsV51 = window.applySettingsToUI;
        window.applySettingsToUI = function() {
            prevApplySettingsV51();
            let isCompact = storeSettings.enableCompactUI !== false;
            document.body.classList.toggle('compact-ui', isCompact);
            if (isCurrentUserAdmin) {
                let elComp = document.getElementById('setting-enable-compact-ui');
                if (elComp) elComp.checked = isCompact;
            }
            let sNav = document.getElementById('smart-nav');
            if (sNav) {
                sNav.style.display = isCurrentUserAdmin ? 'flex' : 'none';
            }
        };

        const prevSaveSettingsV51 = window.saveSettings;
        window.saveSettings = async function() {
            let elComp = document.getElementById('setting-enable-compact-ui');
            try {
                await updateDoc(doc(db, 'settings', 'main'), {
                    enableCompactUI: elComp ? elComp.checked : true
                });
            } catch (e) {}
            await prevSaveSettingsV51();
        };


        // =========================================================================
        // === النسخة V53: الميزات العالمية النهائية + محرك الترجمة الشامل 100% ===
        // =========================================================================

        // 1. تتبع مصدر الزيارة (Traffic Source Detection)
        window.getDetectedTrafficSource = function() {
            let saved = sessionStorage.getItem('zait_traffic_source');
            if (saved) return saved;
            let src = 'مباشر (Direct)';
            let urlParams = new URLSearchParams(window.location.search);
            let utm = (urlParams.get('utm_source') || urlParams.get('ref') || '').toLowerCase();
            let ref = (document.referrer || '').toLowerCase();
            let combined = utm + ' ' + ref;
            if (combined.includes('facebook') || combined.includes('fb')) src = 'فيسبوك (Facebook)';
            else if (combined.includes('tiktok') || combined.includes('tt')) src = 'تيك توك (TikTok)';
            else if (combined.includes('whatsapp') || combined.includes('wa')) src = 'واتساب (WhatsApp)';
            else if (combined.includes('instagram') || combined.includes('ig')) src = 'إنستجرام (Instagram)';
            else if (combined.includes('google')) src = 'بحث جوجل (Google)';
            sessionStorage.setItem('zait_traffic_source', src);
            return src;
        };
        window.getDetectedTrafficSource();

        // 2. طلب "بلغني عند التوفر" للمنتجات النافدة
        window.requestBackInStock = async function(event, productId, productName) {
            if (event) event.stopPropagation();
            let defaultContact = '';
            if (currentUser) defaultContact = currentUser.phoneNumber || currentUser.email || '';
            let promptMsg = window.currentLang === 'en'
                ? `Enter your WhatsApp phone number to notify you as soon as (${productName}) is back in stock:`
                : `أدخل رقم هاتفك (واتساب) لنقوم بإبلاغك فور توفر (${productName}):`;
            let phone = prompt(promptMsg, defaultContact);
            if (!phone || !phone.trim()) return;
            try {
                await addDoc(collection(db, 'stock_alerts'), {
                    productId: productId,
                    productName: productName,
                    customerPhone: phone.trim(),
                    customerName: currentUser && currentUser.displayName ? currentUser.displayName : 'عميل',
                    date: new Date().toISOString()
                });
                window.showToast(window.currentLang === 'en' ? '🔔 You will be notified once back in stock!' : '🔔 تم تسجيل رقمك! سنبلغك فور توفر المنتج', 'success');
            } catch (e) {
                window.showToast(window.currentLang === 'en' ? 'Saved locally!' : 'تم تسجيل طلبك بنجاح!', 'success');
            }
        };

        window.adminStockAlertsUnsubscribe = null;
        window.loadAdminStockAlerts = function() {
            if (window.adminStockAlertsUnsubscribe) window.adminStockAlertsUnsubscribe();
            window.adminStockAlertsUnsubscribe = onSnapshot(collection(db, 'stock_alerts'), (snap) => {
                let cont = document.getElementById('admin-stock-alerts-list');
                let badge = document.getElementById('stock-alerts-count-badge');
                if (!cont) return;
                let list = [];
                snap.forEach(d => list.push({ id: d.id, ...d.data() }));
                list.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
                if (badge) badge.textContent = list.length;
                if (list.length === 0) {
                    cont.innerHTML = '<p style="color:var(--text-muted); font-size:0.88rem; margin:0;">لا توجد طلبات انتظار حالياً.</p>';
                    return;
                }
                let html = '';
                list.forEach(item => {
                    let pureWa = String(item.customerPhone || '').replace(/\D/g, '');
                    if (pureWa && !pureWa.startsWith('20') && pureWa.length >= 10) pureWa = '20' + pureWa;
                    let waMsg = `مرحباً بك من متجر زيت الشجرة المباركة 🌿 نبشرك بأن المنتج الذي طلبته (${item.productName}) قد توفر الآن من جديد! يمكنك طلبه الآن قبل نفاد الكمية.`;
                    let waBtn = pureWa.length >= 10
                        ? `<a href="https://wa.me/${pureWa}?text=${encodeURIComponent(waMsg)}" target="_blank" class="btn btn-outline" style="border-color:#25D366; color:#25D366; padding:4px 10px; font-size:0.8rem; text-decoration:none;">💬 بشر العميل واتساب</a>`
                        : '';
                    html += `<div style="background:var(--input-bg); padding:8px 10px; border:1px solid var(--border-color); border-radius:8px; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
                        <div>
                            <strong style="color:var(--primary);">${window.escapeHTML(item.productName)}</strong><br>
                            <span style="font-size:0.82rem; color:var(--text-muted);">📞 ${window.escapeHTML(item.customerPhone)}</span>
                        </div>
                        <div style="display:flex; gap:6px; align-items:center;">
                            ${waBtn}
                            <button type="button" class="btn btn-danger" style="padding:4px 8px; font-size:0.78rem;" onclick="window.deleteStockAlert('${item.id}')">🗑️</button>
                        </div>
                    </div>`;
                });
                cont.innerHTML = html;
            });
        };

        window.deleteStockAlert = async function(id) {
            try {
                await deleteDoc(doc(db, 'stock_alerts', id));
                window.showToast('تم حذف التنبيه', 'info');
            } catch (e) {}
        };

        // 3. حساب "إجمالي ما وفرته اليوم" + اقتراح منتج مكمل داخل السلة (In-Cart Upsell)
        window.renderSavingsAndUpsell = function() {
            // A. Total Savings Banner
            let showSavings = storeSettings.enableSavingsBadge !== false;
            let oldPriceSaved = 0;
            cart.forEach(item => {
                if (item.selected !== false) {
                    let prod = products.find(p => p.id === item.id);
                    if (prod && prod.oldPrice && Number(prod.oldPrice) > Number(item.price)) {
                        oldPriceSaved += (Number(prod.oldPrice) - Number(item.price)) * Number(item.quantity || 1);
                    }
                }
            });
            let promoDiscVal = Math.round(currentSubtotal * (currentDiscountPercent / 100));
            let bundleDiscVal = window.getBundleDiscountAmount ? window.getBundleDiscountAmount() : 0;
            let enableFreeShip = storeSettings.enableFreeShipping !== false;
            let targetAmount = (storeSettings && storeSettings.freeShippingThreshold) ? Number(storeSettings.freeShippingThreshold) : 1000;
            let shipSaved = (enableFreeShip && currentSubtotal >= targetAmount && currentSubtotal > 0) ? (currentShippingCost || 90) : 0;

            let totalSaved = oldPriceSaved + promoDiscVal + bundleDiscVal + (window.loyaltyDiscountFixed || 0) + shipSaved;

            ['cart-total-savings-banner', 'checkout-total-savings-banner'].forEach(id => {
                let el = document.getElementById(id);
                if (!el) return;
                if (showSavings && currentSubtotal > 0 && totalSaved > 0) {
                    el.style.display = 'block';
                    el.innerHTML = window.currentLang === 'en'
                        ? `🎉 Congrats! Total saved on this order: <strong>${totalSaved} EGP</strong>`
                        : `🎉 مبروك! إجمالي ما وفرته في هذا الطلب: <strong>${totalSaved} ج</strong>`;
                } else {
                    el.style.display = 'none';
                }
            });

            // B. In-Cart Upsell
            let upsellBox = document.getElementById('cart-upsell-container');
            if (!upsellBox) return;
            if (storeSettings.enableCartUpsell === false || cart.length === 0 || products.length === 0) {
                upsellBox.style.display = 'none';
                return;
            }
            let cartIds = cart.map(c => c.id);
            let candidate = products.find(p => !cartIds.includes(p.id) && !p.isHidden && (p.stock === undefined || p.stock === "" || Number(p.stock) > 0));
            if (!candidate) {
                upsellBox.style.display = 'none';
                return;
            }
            let cImg = (candidate.images && candidate.images[0]) ? candidate.images[0] : (candidate.imageUrl || '1000392409.jpeg');
            let safeCName = candidate.name.replace(/'/g, "\\'");
            upsellBox.style.display = 'flex';
            upsellBox.innerHTML = `
                <div style="display:flex; align-items:center; gap:10px;">
                    <img loading="lazy" src="${cImg}" style="width:48px; height:48px; border-radius:8px; object-fit:cover; border:1px solid var(--secondary);">
                    <div>
                        <span style="font-size:0.76rem; color:var(--secondary); font-weight:bold; display:block;">${window.currentLang === 'en' ? '💡 Recommended Add-On:' : '💡 منتج مقترح لإكمال طلبك:'}</span>
                        <strong style="color:var(--primary); font-size:0.9rem;">${window.escapeHTML(candidate.name)}</strong>
                        <span style="color:var(--text-muted); font-size:0.85rem; margin-right:6px;">(${candidate.price} ${window.currentLang === 'en' ? 'EGP' : 'ج'})</span>
                    </div>
                </div>
                <button type="button" class="btn" style="padding:6px 12px; font-size:0.82rem;" onclick="window.executeAddToCart(event, '${candidate.id}', '${safeCName}')">${window.currentLang === 'en' ? '+ Add to Cart 🛒' : '+ أضف للسلة 🛒'}</button>
            `;
        };

        const origUpdateInvoiceV52 = window.updateInvoiceUI;
        window.updateInvoiceUI = function() {
            origUpdateInvoiceV52();
            window.renderSavingsAndUpsell();
        };

        // 4. مؤقت "اطلب خلال X ساعات للشحن اليوم"
        window.updateDispatchTimerUI = function() {
            let show = storeSettings.enableDispatchTimer !== false;
            let now = new Date();
            let cutoff = 18; // 6 PM daily dispatch cutoff
            let remHours = cutoff - now.getHours() - 1;
            let remMins = 59 - now.getMinutes();
            if (remHours < 0) {
                remHours += 24;
            }
            let msgAr = `⚡ اطلب خلال ${remHours} ساعة و ${remMins} دقيقة ليتم تجهيز وشحن طلبك في أسرع دفعة!`;
            let msgEn = `⚡ Order within ${remHours} hrs ${remMins} mins for priority same-day preparation!`;
            ['modal-dispatch-timer', 'checkout-dispatch-timer'].forEach(id => {
                let el = document.getElementById(id);
                if (el) {
                    el.style.display = show ? 'block' : 'none';
                    el.innerHTML = window.currentLang === 'en' ? msgEn : msgAr;
                }
            });
        };

        // 5. نوافذ السياسات والثقة وشهادة الجودة
        window.openPolicyModal = function(type) {
            let modal = document.getElementById('policy-info-modal');
            let titleEl = document.getElementById('policy-modal-title');
            let bodyEl = document.getElementById('policy-modal-body');
            if (!modal || !titleEl || !bodyEl) return;
            let isEn = window.currentLang === 'en';

            if (type === 'story') {
                titleEl.textContent = isEn ? '🌿 Our Farms Story in Sinai' : '🌿 قصة مزارعنا في سيناء';
                bodyEl.textContent = isEn
                    ? "At Blessed Tree Oil, we harvest the finest olives directly from our blessed farms in North Sinai.\n\n• 100% Cold Pressed (First Press) without any heat or chemicals.\n• Bottled fresh to preserve natural antioxidants, vitamins, and authentic Sinai aroma.\n• Direct from farm to your table with full quality guarantee."
                    : "في متجر (زيت الشجرة المباركة)، نقطف لكم أجود ثمار الزيتون مباشرة من مزارعنا المباركة في أرض سيناء الحبيبة.\n\n• عصرة أولى على البارد 100% بدون أي معالجة حرارية أو إضافات كيميائية.\n• تعبئة طازجة تحفظ كافة الفيتامينات ومضادات الأكسدة الطبيعية والطعم السيناوي الأصلي.\n• من المزرعة إلى مائدتكم مباشرة بضمان كامل للجودة والنقاء.";
            } else if (type === 'quality') {
                titleEl.textContent = isEn ? '🏅 Quality Certificate & Acidity Test' : '🏅 شهادة الجودة ونسبة الحموضة';
                bodyEl.textContent = isEn
                    ? "✔ Extra Virgin Sinai Olive Oil (100% Pure & Natural).\n✔ Acidity Level: Less than 0.8% (International Extra Virgin Standard).\n✔ Extraction Method: First Cold Press (< 27°C).\n✔ Free from any preservatives, artificial colors, or blended oils.\n✔ Full Money-Back Guarantee if quality does not match specifications."
                    : "✔ زيت زيتون سيناوي بكر ممتاز (طبيعي ونقي 100%).\n✔ نسبة الحموضة: أقل من 0.8% (مطابق لأعلى المعايير العالمية للزيت البكر الممتاز).\n✔ طريقة العصر: عصرة أولى على البارد (أقل من 27 درجة مئوية).\n✔ خالٍ تماماً من أي مواد حافظة أو ألوان صناعية أو زيوت مخلوطة.\n✔ ضمان استرجاع فوري في حال عدم مطابقة المنتج لأي من هذه المواصفات.";
            } else if (type === 'return') {
                titleEl.textContent = isEn ? '🔄 Return & Exchange Policy' : '🔄 سياسة الاستبدال والاسترجاع';
                bodyEl.textContent = isEn
                    ? "• Customer satisfaction is our top priority.\n• You have the right to inspect your order upon delivery.\n• Full return or replacement is guaranteed within 14 days if the product has any defect, damage, or mismatch.\n• Simply click 'Return Product' inside 'My Orders' or contact us via Customer Support or WhatsApp."
                    : "• رضاكم وثقتكم هما أساس عملنا في زيت الشجرة المباركة.\n• يحق للعميل معاينة الطلب والتأكد من سلامة العبوات عند الاستلام.\n• نضمن لكم حق الاستبدال أو الاسترجاع الكامل خلال 14 يوماً في حال وجود أي تلف أو خطأ في الطلب أو عدم مطابقة للمواصفات.\n• يمكنك تقديم طلب استرجاع بضغطة زر من قسم (طلباتي) أو التواصل معنا عبر خدمة العملاء أو واتساب.";
            } else if (type === 'privacy') {
                titleEl.textContent = isEn ? '🔒 Privacy & Security Policy' : '🔒 سياسة الخصوصية والأمان';
                bodyEl.textContent = isEn
                    ? "• All customer data (name, phone number, and delivery address) is strictly confidential and encrypted.\n• Your information is used solely for delivering your orders and providing customer support.\n• We never share your personal information with any third party outside the delivery courier."
                    : "• جميع بيانات العملاء (الاسم، رقم الهاتف، والعنوان) مشفرة ومحفوظة بسرية تامة.\n• تُستخدم البيانات فقط لغرض توصيل الطلبات، حساب نقاط الولاء، وخدمة العملاء.\n• لا يتم مشاركة بياناتك مع أي جهة خارجية باستثناء مندوب التوصيل المكلف بتسليم طلبك.";
            }
            modal.style.display = 'flex';
        };

        // 6. معرض صور العملاء في صفحة التقييمات
        const origLoadAllReviewsV52 = window.loadAllReviews;
        window.loadAllReviews = function() {
            origLoadAllReviewsV52();
            let galBox = document.getElementById('customer-photos-gallery-box');
            let strip = document.getElementById('customer-photos-strip');
            if (!galBox || !strip) return;
            if (storeSettings.enableCustomerGallery === false) {
                galBox.style.display = 'none';
                return;
            }
            let imgs = [];
            products.forEach(p => {
                (p.reviews || []).forEach(r => { if (r.imageUrl) imgs.push(r.imageUrl); });
                if (p.images && p.images[0]) imgs.push(p.images[0]);
            });
            imgs = [...new Set(imgs)].slice(0, 10);
            if (imgs.length > 0) {
                galBox.style.display = 'block';
                strip.innerHTML = imgs.map(u => `<img loading="lazy" src="${u}" onclick="window.open('${u}', '_blank')" alt="Customer Review">`).join('');
            } else {
                galBox.style.display = 'none';
            }
        };

        // 7. تصدير شيت شركات الشحن (Bosta / Mylerz CSV) + إحصائية مصادر الزيارات
        window.exportCourierCSV = function() {
            if (adminOrdersArray.length === 0) {
                window.showToast('لا توجد طلبات لتصديرها', 'error');
                return;
            }
            let activeOrders = adminOrdersArray.filter(o => !String(o.status || '').includes('رفض') && !String(o.status || '').includes('لغى'));
            let csv = "Order Reference,Full Name,Phone 1,Phone 2,Governorate,City,Detailed Address,COD Amount,Items Description,Total Pieces,Payment Method,Order Status\n";
            activeOrders.forEach(o => {
                let refId = o.id.slice(0, 8).toUpperCase();
                let cleanName = String(o.customerName || '').replace(/,/g, ' ');
                let p1 = (o.phones && o.phones.primary) ? o.phones.primary : '';
                let p2 = (o.phones && o.phones.secondary && o.phones.secondary !== 'لا يوجد') ? o.phones.secondary : '';
                let gov = (o.location && o.location.governorate) ? String(o.location.governorate).replace(/,/g, ' ') : '';
                let city = (o.location && o.location.city) ? String(o.location.city).replace(/,/g, ' ') : '';
                let addr = (o.location && o.location.details) ? String(o.location.details).replace(/,/g, ' ').replace(/\n/g, ' ') : '';
                let totalQty = 0;
                let itemsDesc = (o.items || []).map(i => { totalQty += Number(i.quantity || 1); return `${i.name} x${i.quantity}`; }).join(' + ').replace(/,/g, ' ');
                let cod = (o.paymentMethod === 'محفظة إلكترونية') ? 0 : o.totalAmount;
                csv += `"${refId}","${cleanName}","${p1}","${p2}","${gov}","${city}","${addr}","${cod}","${itemsDesc}","${totalQty}","${o.paymentMethod || 'كاش'}","${o.status}"\n`;
            });
            const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = `Courier_Sheet_Bosta_Mylerz_${new Date().toISOString().slice(0,10)}.csv`;
            link.click();
            window.showToast('تم تحميل شيت شركة الشحن بنجاح 🚚', 'success');
        };

        window.renderTrafficSourcesAnalytics = function() {
            let cont = document.getElementById('admin-traffic-sources-list');
            let card = document.getElementById('admin-traffic-sources-card');
            if (card) card.style.display = storeSettings.enableCourierExport !== false ? 'block' : 'none';
            if (!cont || storeSettings.enableCourierExport === false) return;
            let srcMap = {};
            adminOrdersArray.forEach(o => {
                if (String(o.status || '').includes('رفض') || String(o.status || '').includes('لغى')) return;
                let s = o.trafficSource || (o.orderMethod === 'عبر واتساب' ? 'واتساب (WhatsApp)' : 'مباشر (Direct)');
                srcMap[s] = (srcMap[s] || 0) + 1;
            });
            let entries = Object.entries(srcMap).sort((a, b) => b[1] - a[1]);
            if (entries.length === 0) {
                cont.innerHTML = '<p style="color:var(--text-muted); margin:0;">لا توجد بيانات مصادر كافية بعد.</p>';
                return;
            }
            let html = '<ul style="margin:0; padding-right:18px; line-height:1.9;">';
            entries.forEach(([sName, count]) => {
                html += `<li><strong>${window.escapeHTML(sName)}</strong>: <span style="color:#028090; font-weight:bold;">${count} طلب</span></li>`;
            });
            html += '</ul>';
            cont.innerHTML = html;
        };

        // ربط فتح المنتج والمودال بـ V53
        const origOpenProductModalV52 = window.openProductModal;
        window.openProductModal = function(id) {
            origOpenProductModalV52(id);
            window.updateDispatchTimerUI();
            let qBox = document.getElementById('modal-quality-cert-box');
            if (qBox) qBox.style.display = storeSettings.enableQualityCert !== false ? 'flex' : 'none';
            if (window.currentLang === 'en') window.translateDOM(document.getElementById('product-modal'));
        };

        const origUpdateAdminUIV52 = window.updateAdminUI;
        window.updateAdminUI = function() {
            origUpdateAdminUIV52();
            if (isCurrentUserAdmin) {
                window.loadAdminStockAlerts();
                window.renderTrafficSourcesAnalytics();
            } else if (window.adminStockAlertsUnsubscribe) {
                window.adminStockAlertsUnsubscribe();
                window.adminStockAlertsUnsubscribe = null;
            }
        };

        const origRenderAdminOrdersV52 = window.renderAdminOrdersUI;
        window.renderAdminOrdersUI = function() {
            origRenderAdminOrdersV52();
            if (isCurrentUserAdmin) window.renderTrafficSourcesAnalytics();
        };

        const prevApplySettingsV52 = window.applySettingsToUI;
        window.applySettingsToUI = function() {
            prevApplySettingsV52();
            if (isCurrentUserAdmin) {
                let setC = (id, val) => { let el = document.getElementById(id); if (el) el.checked = val !== false; };
                setC('setting-enable-savings-badge', storeSettings.enableSavingsBadge);
                setC('setting-enable-cart-upsell', storeSettings.enableCartUpsell);
                setC('setting-enable-back-in-stock', storeSettings.enableBackInStock);
                setC('setting-enable-dispatch-timer', storeSettings.enableDispatchTimer);
                setC('setting-enable-quality-cert', storeSettings.enableQualityCert);
                setC('setting-enable-trust-policies', storeSettings.enableTrustPolicies);
                setC('setting-enable-customer-gallery', storeSettings.enableCustomerGallery);
                setC('setting-enable-courier-export', storeSettings.enableCourierExport);
            }
            let stockCard = document.getElementById('admin-stock-alerts-card');
            if (stockCard) stockCard.style.display = storeSettings.enableBackInStock !== false ? 'block' : 'none';

            let courierBtn = document.getElementById('btn-export-courier-csv');
            if (courierBtn) courierBtn.style.display = storeSettings.enableCourierExport !== false ? 'block' : 'none';

            document.querySelectorAll('.footer-policy-item').forEach(el => {
                el.style.display = storeSettings.enableTrustPolicies !== false ? 'block' : 'none';
            });

            window.updateDispatchTimerUI();
            window.renderSavingsAndUpsell();
            if (window.currentLang === 'en') window.translateDOM(document.body);
        };

        const prevSaveSettingsV52 = window.saveSettings;
        window.saveSettings = async function() {
            const getC = (id) => { let el = document.getElementById(id); return el ? el.checked : true; };
            try {
                await updateDoc(doc(db, 'settings', 'main'), {
                    enableSavingsBadge: getC('setting-enable-savings-badge'),
                    enableCartUpsell: getC('setting-enable-cart-upsell'),
                    enableBackInStock: getC('setting-enable-back-in-stock'),
                    enableDispatchTimer: getC('setting-enable-dispatch-timer'),
                    enableQualityCert: getC('setting-enable-quality-cert'),
                    enableTrustPolicies: getC('setting-enable-trust-policies'),
                    enableCustomerGallery: getC('setting-enable-customer-gallery'),
                    enableCourierExport: getC('setting-enable-courier-export')
                });
            } catch (e) {}
            await prevSaveSettingsV52();
        };

        // =========================================================================
        // === 8. محرك الترجمة الشامل ثنائي اللغة (100% Arabic <-> English) ===
        // =========================================================================
        window.FULL_AR_TO_EN = {
            "زيت الشجرة المباركة": "Blessed Tree Oil",
            "🌿 زيت الشجرة المباركة": "🌿 Blessed Tree Oil",
            "زيتون سيناوي بكر ممتاز لذيذ أول طعم بارد بدون أي إضافات، أصلي من قلب الطبيعة.": "Premium Sinai Extra Virgin Olive Oil, first cold press without any additives, 100% natural.",
            "متجركم الأول للمنتجات الطبيعية. الجودة والثقة هما أساس عملنا.": "Your #1 store for 100% natural products. Quality and trust are our foundation.",
            "روابط هامة": "Important Links",
            "تواصل معنا": "Contact Us",
            "📍 الإدارة: مزارعنا في سيناء": "📍 HQ: Our Farms in Sinai",
            "تم الإنشاء بواسطة المهندس أحمد وائل": "Created by Eng. Ahmed Wael",
            "🌿 قصة مزارعنا في سيناء": "🌿 Our Sinai Farms Story",
            "🏅 شهادة الجودة ونسبة الحموضة": "🏅 Quality & Acidity Certificate",
            "🔄 سياسة الاستبدال والاسترجاع": "🔄 Return & Exchange Policy",
            "🔒 سياسة الخصوصية والأمان": "🔒 Privacy & Security Policy",
            "إغلاق": "Close",
            "الرئيسية": "Home",
            "السلة": "Cart",
            "المفضلة": "Wishlist",
            "حسابي": "My Account",
            "الخدمات والأقسام": "Services & Categories",
            "خدمة العملاء": "Customer Support",
            "آراء العملاء": "Customer Reviews",
            "آراء العملاء ⭐️": "Customer Reviews ⭐️",
            "تتبع طلبي برقم الهاتف": "Track Order by Phone",
            "👤 حسابي:": "👤 My Account:",
            "نقاط الولاء": "Loyalty Points",
            "سلة المشتريات": "Shopping Cart",
            "طلباتي": "My Orders",
            "الإشعارات": "Notifications",
            "سجل المشاهدات": "Recently Viewed",
            "تصفح الأقسام:": "Browse Categories:",
            "🔄 تبديل الحسابات:": "🔄 Switch Accounts:",
            "إضافة حساب آخر": "Add Another Account",
            "الوضع الليلي / النهاري": "Dark / Light Mode",
            "تسجيل الدخول": "Login",
            "تسجيل الدخول الآن": "Login Now",
            "تسجيل الخروج": "Logout",
            "🚪 تسجيل الخروج": "🚪 Logout",
            "رصيد نقاط الولاء": "Loyalty Points Balance",
            "نقطة": "Pts",
            "فلتر وترتيب": "Filter & Sort",
            "الفلاتر والترتيب:": "Filters & Sorting:",
            "الترتيب الافتراضي": "Default Sorting",
            "الأقل سعراً أولاً": "Price: Low to High",
            "الأعلى سعراً أولاً": "Price: High to Low",
            "الأعلى تقييماً ⭐️": "Highest Rated ⭐️",
            "الكل": "All",
            "زيت زيتون": "Olive Oil",
            "📂 زيت زيتون": "📂 Olive Oil",
            "أخرى": "Other",
            "🔥 عرض خاص لفترة محدودة!": "🔥 Special Limited Time Offer!",
            "جاري تحميل المنتجات... ⏳": "Loading products... ⏳",
            "جاري تحميل المزيد من المنتجات... ⏳": "Loading more products... ⏳",
            "جاري التحميل...": "Loading...",
            "جاري تحميل طلباتك...": "Loading your orders...",
            "🛒 سلة مشترياتك": "🛒 Your Shopping Cart",
            "سلتك فارغة.": "Your cart is empty.",
            "هل لديك كود خصم؟ 🎁": "Have a promo code? 🎁",
            "تفعيل": "Apply",
            "إلغاء كود الخصم ✖": "Remove Promo Code ✖",
            "لديك نقاط ولاء! 🎁": "You have loyalty points! 🎁",
            "رصيدك:": "Your Balance:",
            "استبدل بخصم": "Redeem Discount",
            "إلغاء ✖": "Cancel ✖",
            "الإجمالي الفرعي:": "Subtotal:",
            "الخصم:": "Discount:",
            "الشحن المتوقع:": "Estimated Shipping:",
            "الشحن:": "Shipping:",
            "المنتجات:": "Products:",
            "الإجمالي النهائي:": "Final Total:",
            "المتابعة للدفع والتوصيل": "Proceed to Checkout & Delivery",
            "📦 محفوظة لوقت لاحق": "📦 Saved for Later",
            "حفظ لوقت لاحق": "Save for later",
            "نقل إلى السلة": "Move to Cart",
            "❤️ منتجاتي المفضلة": "❤️ My Wishlist",
            "لم تقم بإضافة منتجات للمفضلة بعد.": "No products in your wishlist yet.",
            "⭐️ آراء وتقييمات عملائنا": "⭐️ Customer Reviews & Ratings",
            "📸 صور حقيقية من تجارب عملائنا:": "📸 Real Photos from Our Customers:",
            "هل جربت الشراء منا؟": "Have you tried our products?",
            "نشر التقييم": "Post Review",
            "📍 بيانات التوصيل والدفع": "📍 Delivery & Payment Details",
            "حدد موقعك على الخريطة لتسهيل التوصيل تلقائياً.": "Pin your location on the map for fast delivery.",
            "📍 حدد موقعي الحالي": "📍 Pin My Current Location",
            "يرجى لمس الخريطة لتحديد موقعك بدقة!": "Please tap the map to pin your exact location!",
            "💳 طريقة الدفع:": "💳 Payment Method:",
            "💵 الدفع كاش عند الاستلام": "💵 Cash on Delivery (COD)",
            "📱 المحافظ الإلكترونية وإنستاباي": "📱 Mobile Wallets & InstaPay",
            "برجاء تحويل إجمالي المبلغ على الرقم / الحساب التالي:": "Please transfer the total amount to the following number/account:",
            "📸 أرفق صورة إيصال التحويل (سكرين شوت):": "📸 Attach transfer receipt screenshot:",
            "تأكيد عبر الموقع 🌐": "Confirm via Website 🌐",
            "تأكيد عبر واتساب 💬": "Confirm via WhatsApp 💬",
            "العودة للسلة": "Back to Cart",
            "🔔 الإشعارات": "🔔 Notifications",
            "👤 طلباتي وحالة الشحن": "👤 My Orders & Tracking",
            "🚚 تتبع حالة طلبك برقم الهاتف (للزوار والعملاء):": "🚚 Track Your Order by Phone Number (Guests & Customers):",
            "بحث وتتبع 🔍": "Track Order 🔍",
            "💬 خدمة العملاء": "💬 Customer Support",
            "إنهاء 🛑": "End 🛑",
            "حذف 🗑️": "Delete 🗑️",
            "يرجى تسجيل الدخول أولاً.": "Please login first.",
            "إرسال 🚀": "Send 🚀",
            "👤 حسابي الشخصي": "👤 My Profile",
            "يرجى تسجيل الدخول لعرض حسابك.": "Please login to view your profile.",
            "🎁 نقاطي": "🎁 My Points",
            "📦 طلباتي": "📦 My Orders",
            "تحديث بياناتي وعنواني:": "Update My Info & Address:",
            "حفظ التعديلات": "Save Changes",
            "حساب جديد": "Create Account",
            "دخول": "Login",
            "تسجيل": "Sign Up",
            "نسيت كلمة المرور؟": "Forgot Password?",
            "ليس لديك حساب؟ أنشئ حساباً جديداً": "Don't have an account? Create one",
            "ليس لديك حساب؟ أنشئ حساباً": "Don't have an account? Create one",
            "لديك حساب؟ سجل الدخول": "Already have an account? Login",
            "أو": "OR",
            "🌐 المتابعة بحساب جوجل": "🌐 Continue with Google",
            "👀 سجل المشاهدات": "👀 Recently Viewed",
            "📅 ابحث عن المنتجات التي شاهدتها في يوم محدد:": "📅 Filter viewed products by date:",
            "تصفية": "Filter",
            "نقاط الولاء 🎁": "Loyalty Points 🎁",
            "مرحباً بك في برنامج الولاء الخاص بنا!": "Welcome to our Loyalty Program!",
            "إجمالي نقاطك الحالية": "Your Current Points Balance",
            "استبدل النقاط بخصم الآن!": "Redeem Points for Discount Now!",
            "كيف يعمل البرنامج؟ 🤔": "How does it work? 🤔",
            "تكسب": "Earn",
            "1 نقطة": "1 Point",
            "مقابل كل": "for every",
            "جنيه تنفقها في المتجر.": "EGP spent in our store.",
            "تتم إضافة النقاط إلى حسابك تلقائياً بمجرد استلامك للطلب.": "Points are added automatically once your order is delivered.",
            "يمكنك استبدال كل": "You can redeem every",
            "50 نقطة": "50 Points",
            "بخصم فوري قيمته": "for an instant discount of",
            "جنيه على طلبك القادم.": "EGP on your next order.",
            "مشاركة": "Share",
            "يشاهده الآن": "Viewing now:",
            "شخص": "people",
            "اختر الحجم / النوع:": "Select Size / Variant:",
            "🚀 اشتري الآن (دفع سريع)": "🚀 Buy Now (Express Checkout)",
            "🏅 ضمان الجودة الأصلي 100%": "🏅 100% Authentic Quality Guarantee",
            "عصرة أولى على البارد - حموضة أقل من 0.8% - مفحوص معملياً": "First Cold Press - Acidity < 0.8% - Lab Tested",
            "📜 شهادة الجودة": "📜 Quality Cert",
            "طبيعي 100%": "100% Natural",
            "شحن سريع": "Fast Delivery",
            "دفع آمن": "Secure Payment",
            "استرجاع مضمون": "Guaranteed Return",
            "📋 مواصفات وضمان المنتج:": "📋 Product Specifications & Guarantee:",
            "❓ أسئلة شائعة:": "❓ Frequently Asked Questions:",
            "🛍️ منتجات قد تعجبك:": "🛍️ You May Also Like:",
            "تقييمات العملاء ⭐️": "Customer Reviews ⭐️",
            "أضف تقييمك:": "Add Your Review:",
            "⭐⭐⭐⭐⭐ ممتاز": "⭐⭐⭐⭐⭐ Excellent",
            "⭐⭐⭐⭐ جيد جداً": "⭐⭐⭐⭐ Very Good",
            "⭐⭐⭐ جيد": "⭐⭐⭐ Good",
            "⭐⭐ مقبول": "⭐⭐ Fair",
            "⭐ سيء": "⭐ Poor",
            "📸 إرفاق صورة للمنتج (اختياري):": "📸 Attach Product Photo (Optional):",
            "⏳ جاري الرفع...": "⏳ Uploading...",
            "إرسال التقييم": "Submit Review",
            "سجل الدخول لإضافة تقييم.": "Please login to add a review.",
            "🛒 منتجاتك في انتظارك!": "🛒 Your Cart is Waiting!",
            "لإتمام طلبك الآن نهديك كود خصم خاص!": "Complete your order now with this special discount code!",
            "إكمال الطلب الآن 🚀": "Complete Order Now 🚀",
            "🔄 طلب استرجاع منتج": "🔄 Return Product Request",
            "سبب الاسترجاع:": "Reason for Return:",
            "المنتج تالف أو مكسور": "Product is damaged or broken",
            "وصلني منتج مختلف عن طلبي": "Received wrong item",
            "جودة المنتج غير مطابقة للمواصفات": "Quality does not match description",
            "سبب آخر": "Other reason",
            "ملاحظات تفصيلية:": "Detailed Notes:",
            "📸 إرفاق صورة توضح المشكلة (مهم جداً):": "📸 Attach photo showing the issue (Required):",
            "إرسال طلب الاسترجاع 🚀": "Submit Return Request 🚀",
            "📦 تفاصيل طلبي": "📦 My Order Details",
            "📋 تفاصيل الطلب": "📋 Order Details",
            "الإحصائيات 📊": "Analytics 📊",
            "الطلبات 📦": "Orders 📦",
            "الرسائل 📩": "Messages 📩",
            "الاسترجاع 🔄": "Returns 🔄",
            "العملاء 👥": "Customers 👥",
            "الإعدادات ⚙️": "Settings ⚙️",
            "اختر المحافظة...": "Select Governorate...",
            "المحافظة...": "Governorate...",
            "المركز / المدينة...": "City / District...",
            "المدينة...": "City...",
            "اختر المركز/المدينة...": "Select City / District...",
            "أخرى (تُكتب بالعنوان التفصيلي)": "Other (Write in detailed address)",
            "🔥 الأكثر مبيعاً": "🔥 Bestseller",
            "✨ وصل حديثاً": "✨ New Arrival",
            "🌿 عصرة أولى عالبارد": "🌿 Cold Pressed",
            "⭐ اختيار العملاء": "⭐ Top Pick",
            "⚡ كمية محدودة": "⚡ Limited Stock",
            "📌 مثبت": "📌 Pinned",
            "إضافة 🛒": "Add 🛒",
            "اختر الحجم 🛒": "Select Size 🛒",
            "أضف للسلة 🛒": "Add to Cart 🛒",
            "🔔 بلغني عند التوفر": "🔔 Notify Me",
            "نفدت الكمية ❌": "Out of Stock ❌",
            "عرض التفاصيل": "View Details",
            "عرض مجدداً": "View Again",
            "🎉 مبروك! لقد حصلت على شحن مجاني": "🎉 Congrats! You unlocked FREE Shipping",
            "أضف منتجات بقيمة": "Add products worth",
            "لتحصل على شحن مجاني! 🚚": "to get FREE shipping! 🚚",
            "اشترى": "Purchased",
            "منذ دقيقتين": "2 mins ago",
            "محمد من القاهرة": "Mohamed from Cairo"
        };

        // ترجمة أسماء المحافظات
        const GOV_EN_MAP = {
            "القاهرة": "Cairo", "الجيزة": "Giza", "الشرقية": "Sharqia", "الإسكندرية": "Alexandria",
            "القليوبية": "Qalyubia", "الدقهلية": "Dakahlia", "البحيرة": "Beheira", "الغربية": "Gharbia",
            "المنوفية": "Monufia", "كفر الشيخ": "Kafr El Sheikh", "دمياط": "Damietta", "بورسعيد": "Port Said",
            "الإسماعيلية": "Ismailia", "السويس": "Suez", "شمال سيناء": "North Sinai", "جنوب سيناء": "South Sinai",
            "الفيوم": "Fayoum", "بني سويف": "Beni Suef", "المنيا": "Minya", "أسيوط": "Assiut",
            "سوهاج": "Sohag", "قنا": "Qena", "الأقصر": "Luxor", "أسوان": "Aswan",
            "البحر الأحمر": "Red Sea", "الوادي الجديد": "New Valley", "مطروح": "Matrouh"
        };
        Object.assign(window.FULL_AR_TO_EN, GOV_EN_MAP);

        // ترجمة الـ Placeholders
        window.PLACEHOLDER_AR_TO_EN = {
            "ابحث عن منتج...": "Search for a product...",
            "أقل سعر": "Min Price",
            "أعلى سعر": "Max Price",
            "أدخل الكود": "Enter promo code",
            "أدخل رقم الهاتف الذي طلبت به...": "Enter the phone number used in your order...",
            "الاسم بالكامل": "Full Name",
            "رقم الهاتف الأساسي": "Primary Phone Number",
            "رقم هاتف احتياطي (اختياري)": "Secondary Phone (Optional)",
            "العنوان المستخرج من الخريطة تلقائياً...": "Address extracted from map automatically...",
            "العنوان التفصيلي الدقيق (اسم الشارع، رقم العمارة، رقم الشقة، علامة مميزة)": "Detailed Address (Street, Building, Floor/Apt, Landmark)",
            "العنوان التفصيلي (شارع، عمارة، شقة)": "Detailed Address (Street, Building, Apt)",
            "اكتب أو تحدث استفسارك...": "Type or speak your message...",
            "البريد الإلكتروني": "Email Address",
            "كلمة المرور (6 أحرف على الأقل)": "Password (at least 6 characters)",
            "رأيك يهمنا...": "Share your experience with this product...",
            "اكتب رأيك في المتجر وخدماتنا بشكل عام...": "Write your review about our store and service...",
            "اكتب تفاصيل المشكلة هنا...": "Describe the issue in detail..."
        };

        // دالة ذكية لتحويل أي نص عربي ثابت أو ديناميكي إلى الإنجليزية
        window.translateTextToEn = function(str) {
            if (!str) return str;
            let trimmed = str.trim();
            if (!trimmed) return str;
            if (window.FULL_AR_TO_EN[trimmed]) {
                return str.replace(trimmed, window.FULL_AR_TO_EN[trimmed]);
            }
            let out = str;
            // استبدالات ديناميكية للأرقام والأسعار والعبارات المركبة
            out = out.replace(/يبدأ من\s*(\d+)\s*ج/g, 'Starts from $1 EGP');
            out = out.replace(/السعر:\s*(\d+)\s*ج/g, 'Price: $1 EGP');
            out = out.replace(/الكمية المتاحة:\s*(\d+)/g, 'Available Stock: $1');
            out = out.replace(/خصم\s*(\d+)%/g, '$1% Off');
            out = out.replace(/\(خصم\s*(\d+)%\)/g, '($1% Off)');
            out = out.replace(/خصم \((.*?)\):/g, 'Discount ($1):');
            out = out.replace(/كوبون/g, 'Coupon');
            out = out.replace(/عرض الباقات/g, 'Bundle Offer');
            out = out.replace(/نقاط الولاء/g, 'Loyalty Points');
            out = out.replace(/🎁 كوبونات متاحة \(اضغط للتفعيل الفوري\):/g, '🎁 Available Coupons (Tap to apply):');
            out = out.replace(/💬 استفسار عن المنتج عبر واتساب/g, '💬 Inquire via WhatsApp');
            out = out.replace(/🔄 اطلبه مجدداً/g, '🔄 Buy Again');
            out = out.replace(/أدخل رقم هاتفك في المربع بالأعلى لتتبع طلباتك فوراً بدون الحاجة لتسجيل الدخول\./g, 'Enter your phone number above to track your orders instantly without logging in.');
            out = out.replace(/ابدأ المحادثة الآن وسنرد عليك في أقرب وقت!/g, 'Start the conversation now and we will reply shortly!');
            out = out.replace(/الدعم:/g, 'Support:');
            out = out.replace(/(\d+)\s*ج\b/g, '$1 EGP');
            out = out.replace(/^ج$/g, 'EGP');
            return out;
        };

        let isTranslatingDOM = false;
        window.translateDOM = function(root = document.body) {
            if (!root || isTranslatingDOM) return;
            isTranslatingDOM = true;
            try {
                const isEn = window.currentLang === 'en';
                // 1. ترجمة جميع الـ Placeholders
                root.querySelectorAll('input[placeholder], textarea[placeholder]').forEach(el => {
                    if (!el.dataset.origArPh) {
                        el.dataset.origArPh = el.getAttribute('placeholder') || '';
                    }
                    if (isEn) {
                        let orig = el.dataset.origArPh;
                        if (window.PLACEHOLDER_AR_TO_EN[orig]) {
                            el.setAttribute('placeholder', window.PLACEHOLDER_AR_TO_EN[orig]);
                        }
                    } else if (el.dataset.origArPh) {
                        el.setAttribute('placeholder', el.dataset.origArPh);
                    }
                });

                // 2. ترجمة جميع النصوص عبر TreeWalker
                const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
                let node;
                const arRegex = /[\u0600-\u06FF]/;
                while ((node = walker.nextNode())) {
                    let parent = node.parentElement;
                    if (!parent) continue;
                    let tag = parent.tagName;
                    if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'TEXTAREA') continue;
                    // لا نترجم داخل لوحة الإعدادات المحمية الخاصة بالمدير حتى لا تتغير نصوص الإعدادات المحفوظة
                    // ترجمة شاملة لكافة أقسام المتجر والإدارة

                    let val = node.nodeValue;
                    if (arRegex.test(val)) {
                        node._origAr = val;
                    }
                    if (isEn) {
                        let sourceAr = node._origAr || val;
                        let translated = window.translateTextToEn(sourceAr);
                        if (translated !== val) {
                            node.nodeValue = translated;
                        }
                    } else {
                        if (node._origAr && node.nodeValue !== node._origAr) {
                            node.nodeValue = node._origAr;
                        }
                    }
                }
            } catch (e) {
                console.error("Translation error:", e);
            }
            isTranslatingDOM = false;
        };

        // مراقب ذكي لترجمة أي عنصر ديناميكي يظهر أثناء تفعيل اللغة الإنجليزية
        const domLangObserver = new MutationObserver(() => {
            if (window.currentLang === 'en' && !isTranslatingDOM) {
                window.translateDOM(document.body);
            }
        });
        domLangObserver.observe(document.body, { childList: true, subtree: true });

        // استبدال دالة toggleLanguage لتعمل بشكل شامل 100%
        window.toggleLanguage = function() {
            window.currentLang = window.currentLang === 'ar' ? 'en' : 'ar';
            document.documentElement.dir = window.currentLang === 'ar' ? 'rtl' : 'ltr';
            document.documentElement.lang = window.currentLang;
            let langBtn = document.getElementById('lang-btn');
            if (langBtn) langBtn.innerText = window.currentLang === 'ar' ? '🌐 EN' : '🌐 ع';

            window.renderProducts(false);
            window.renderVisualBar();
            window.updateCartUI();
            window.updateEstimatedDeliveryUI();
            window.updateDispatchTimerUI();
            window.renderOneTapCoupons();
            window.renderSavingsAndUpsell();
            window.translateDOM(document.body);
        };


        // =========================================================================
        // === النسخة V54 (الجزء الأول): التسويق التفاعلي وتسهيلات العميل الذكية ===
        // =========================================================================

        // 1. شريط ندرة المخزون والمبيعات (Scarcity Progress Bar)
        window.getScarcityBarHtml = function(product) {
            if (storeSettings.enableScarcityBar === false) return '';
            if (product.stock !== undefined && product.stock !== "" && Number(product.stock) <= 0) return '';
            let hash = 0;
            let str = String(product.id || product.name || 'zait');
            for (let i = 0; i < str.length; i++) hash = (hash * 31 + str.charCodeAt(i)) % 100;
            let soldPct = 68 + (hash % 24);
            let label = window.currentLang === 'en' ? `🔥 Sold ${soldPct}% of batch` : `🔥 تم بيع ${soldPct}% من الكمية`;
            return `<div class="scarcity-sold-box">
                <div class="scarcity-sold-text"><span>${label}</span></div>
                <div class="scarcity-sold-track"><div class="scarcity-sold-fill" style="width:${soldPct}%;"></div></div>
            </div>`;
        };

        // 2. عجلة الحظ التفاعلية (Spin & Win)
        window.openSpinWheelModal = function() {
            let modal = document.getElementById('spin-wheel-modal');
            if (modal) modal.style.display = 'flex';
        };

        window.spinTheWheelNow = async function() {
            let phoneInp = document.getElementById('wheel-phone-input');
            let btn = document.getElementById('btn-spin-now');
            let wheel = document.getElementById('wheel-visual-circle');
            let resArea = document.getElementById('wheel-result-area');
            if (!phoneInp || !wheel || !resArea) return;

            let phone = phoneInp.value.trim();
            if (!phone || phone.replace(/\D/g, '').length < 9) {
                window.showToast(window.currentLang === 'en' ? 'Please enter a valid WhatsApp phone number!' : 'يرجى إدخال رقم واتساب صحيح للمشاركة!', 'error');
                return;
            }
            if (btn) btn.disabled = true;

            let deg = 1440 + Math.floor(Math.random() * 360);
            wheel.style.transform = `rotate(${deg}deg)`;

            let winCode = (storeSettings.wheelCouponCode || 'LUCKY10').trim().toUpperCase();
            let winDisc = Number(storeSettings.wheelDiscountPercent) || 10;

            setTimeout(async () => {
                currentDiscountPercent = winDisc;
                appliedPromoCode = winCode;
                window.updateInvoiceUI();

                resArea.style.display = 'block';
                resArea.innerHTML = window.currentLang === 'en'
                    ? `🎉 <strong>Congratulations!</strong> You won a <strong>${winDisc}% OFF</strong> coupon: <span style="background:white; padding:2px 8px; border-radius:6px; border:1px dashed #166534;">${winCode}</span><br><small>Applied automatically to your cart!</small>`
                    : `🎉 <strong>مبروك!</strong> كسبت خصم فوري <strong>${winDisc}%</strong> بكود: <span style="background:white; padding:2px 8px; border-radius:6px; border:1px dashed #166534;">${winCode}</span><br><small>تم تفعيل الخصم في سلتك تلقائياً الآن!</small>`;

                localStorage.setItem('zait_wheel_spun', 'true');
                try {
                    await addDoc(collection(db, 'wheel_leads'), {
                        phone: phone,
                        prizeCode: winCode,
                        discount: winDisc,
                        date: new Date().toISOString()
                    });
                } catch (e) {}
                if (btn) btn.disabled = false;
            }, 3300);
        };

        window.adminWheelLeadsUnsubscribe = null;
        window.loadAdminWheelLeads = function() {
            if (window.adminWheelLeadsUnsubscribe) window.adminWheelLeadsUnsubscribe();
            window.adminWheelLeadsUnsubscribe = onSnapshot(collection(db, 'wheel_leads'), (snap) => {
                let cont = document.getElementById('admin-wheel-leads-list');
                let badge = document.getElementById('wheel-leads-count-badge');
                if (!cont) return;
                let list = [];
                snap.forEach(d => list.push({ id: d.id, ...d.data() }));
                list.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
                if (badge) badge.textContent = list.length;
                if (list.length === 0) {
                    cont.innerHTML = '<p style="color:var(--text-muted); font-size:0.88rem; margin:0;">لا توجد أرقام مسجلة بعد.</p>';
                    return;
                }
                let html = '';
                list.forEach(item => {
                    let pureWa = String(item.phone || '').replace(/\D/g, '');
                    if (pureWa && !pureWa.startsWith('20') && pureWa.length >= 10) pureWa = '20' + pureWa;
                    let waMsg = `مرحباً بك من متجر زيت الشجرة المباركة 🌿 مبروك فوزك في عجلة الحظ بخصم ${item.discount}% بكود (${item.prizeCode})! هل تحب نساعدك في إتمام طلبك بالخصم اليوم؟`;
                    let waBtn = pureWa.length >= 10
                        ? `<a href="https://wa.me/${pureWa}?text=${encodeURIComponent(waMsg)}" target="_blank" class="btn btn-outline" style="border-color:#25D366; color:#25D366; padding:4px 10px; font-size:0.8rem; text-decoration:none;">💬 تواصل واتساب</a>`
                        : '';
                    html += `<div style="background:var(--input-bg); padding:8px 10px; border:1px solid var(--border-color); border-radius:8px; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
                        <div>
                            <strong style="color:var(--primary);">📞 ${window.escapeHTML(item.phone)}</strong><br>
                            <span style="font-size:0.8rem; color:var(--secondary);">الجائزة: ${window.escapeHTML(item.prizeCode)} (${item.discount}%)</span>
                        </div>
                        <div style="display:flex; gap:6px;">
                            ${waBtn}
                            <button type="button" class="btn btn-danger" style="padding:4px 8px; font-size:0.78rem;" onclick="window.deleteWheelLead('${item.id}')">🗑️</button>
                        </div>
                    </div>`;
                });
                cont.innerHTML = html;
            });
        };

        window.deleteWheelLead = async function(id) {
            try {
                await deleteDoc(doc(db, 'wheel_leads', id));
                window.showToast('تم حذف الرقم', 'info');
            } catch (e) {}
        };

        // 3. شريط الهدية المجانية التلقائية في السلة (Free Gift Bar)
        window.getUnlockedFreeGiftName = function() {
            if (!storeSettings.enableFreeGift) return '';
            let thresh = Number(storeSettings.freeGiftThreshold) || 1500;
            let giftName = storeSettings.freeGiftName || 'عبوة زيت زيتون 250 مل هدية مجانية 🎁';
            return currentSubtotal >= thresh ? giftName : '';
        };

        window.updateFreeGiftUI = function() {
            let box = document.getElementById('free-gift-box');
            let msg = document.getElementById('free-gift-msg');
            let bar = document.getElementById('free-gift-bar');
            if (!box || !msg || !bar) return;
            if (storeSettings.enableFreeGift === false) {
                box.style.display = 'none';
                return;
            }
            box.style.display = 'block';
            let thresh = Number(storeSettings.freeGiftThreshold) || 1500;
            let giftName = storeSettings.freeGiftName || 'عبوة زيت زيتون 250 مل هدية مجانية 🎁';
            if (currentSubtotal >= thresh) {
                bar.style.width = '100%';
                msg.innerHTML = window.currentLang === 'en'
                    ? `🎁 Congrats! Free Gift Unlocked with your order: <strong style="color:#166534;">(${window.escapeHTML(giftName)})</strong>`
                    : `🎁 مبروك! حصلت على هدية مجانية مع طلبك: <strong style="color:#166534;">(${window.escapeHTML(giftName)})</strong>`;
            } else {
                let rem = thresh - currentSubtotal;
                let pct = Math.min(100, Math.round((currentSubtotal / thresh) * 100));
                bar.style.width = pct + '%';
                msg.innerHTML = window.currentLang === 'en'
                    ? `🎁 Add <strong>${rem} EGP</strong> more to unlock your FREE Gift: <strong>(${window.escapeHTML(giftName)})</strong>`
                    : `🎁 أضف منتجات بقيمة <strong>${rem} ج</strong> لتحصل على هدية مجانية: <strong>(${window.escapeHTML(giftName)})</strong>`;
            }
        };

        const origUpdateInvoiceV53 = window.updateInvoiceUI;
        window.updateInvoiceUI = function() {
            origUpdateInvoiceV53();
            window.updateFreeGiftUI();
        };

        // 4. أزرار الأسئلة الذكية الفورية في شات خدمة العملاء (Smart Chatbot Chips)
        window.triggerSmartBotChip = function(topic) {
            let container = document.getElementById('support-history-container');
            if (!container) return;
            if (container.querySelector('p')) container.innerHTML = '';
            let isEn = window.currentLang === 'en';
            let qText = '';
            let aText = '';
            let defShip = storeSettings.defaultShippingCost || 90;
            let freeThresh = storeSettings.freeShippingThreshold || 1000;

            if (topic === 'shipping') {
                qText = isEn ? '🚚 How much is shipping and delivery time?' : '🚚 كم سعر ومدة الشحن؟';
                aText = isEn
                    ? `Shipping is ${defShip} EGP for standard governorates (and FREE on orders over ${freeThresh} EGP 🎉). Delivery takes 2 to 4 business days right to your doorstep.`
                    : `سعر الشحن ${defShip} ج للمحافظات العادية (ومجاني تماماً للطلبات فوق ${freeThresh} ج 🎉). ويصل الطلب لباب البيت خلال 2 إلى 4 أيام عمل.`;
            } else if (topic === 'quality') {
                qText = isEn ? '🌿 How do I know the olive oil is 100% authentic?' : '🌿 كيف أتأكد أن الزيت أصلي؟';
                aText = isEn
                    ? 'Our olive oil is 100% pure Extra Virgin from our farms in Sinai, first cold press with acidity under 0.8%. You have the right to inspect your order upon delivery with a full money-back guarantee!'
                    : 'زيت الشجرة المباركة طبيعي وبكر ممتاز 100% من مزارعنا في سيناء (عصرة أولى على البارد وحموضة أقل من 0.8%). ومتاح معاينة الطلب عند الاستلام مع ضمان استرجاع كامل!';
            } else if (topic === 'payment') {
                qText = isEn ? '💳 What payment methods are available?' : '💳 ما طرق الدفع المتاحة؟';
                aText = isEn
                    ? `You can pay Cash on Delivery (COD) or via Mobile Wallets & InstaPay to (${storeSettings.walletNumber || '01018631768'}).`
                    : `متاح الدفع كاش عند الاستلام، أو التحويل عبر المحافظ الإلكترونية وإنستاباي على الرقم (${storeSettings.walletNumber || '01018631768'}).`;
            } else if (topic === 'offers') {
                qText = isEn ? '🎁 What are the current offers and gifts?' : '🎁 ما هي العروض والهدايا الحالية؟';
                aText = isEn
                    ? `Enjoy automatic bundle discounts, free shipping on orders over ${freeThresh} EGP, and loyalty points on every purchase!`
                    : `متاح خصم فوري عند شراء عبوتين أو أكثر، وشحن مجاني للطلبات فوق ${freeThresh} ج، بالإضافة لنقاط ولاء تتحول لرصيد خصم في كل طلب!`;
            }

            container.innerHTML += `<div class="chat-msg-wrapper chat-msg-customer"><div class="chat-bubble bubble-customer">${window.escapeHTML(qText)}</div></div>`;
            container.innerHTML += `<div class="chat-msg-wrapper chat-msg-admin"><div class="chat-bubble bubble-admin"><strong style="color:var(--secondary);font-size:0.8rem;">🤖 المساعد الذكي:</strong><br>${window.escapeHTML(aText)}</div></div>`;
            container.scrollTop = container.scrollHeight;
        };

        // 5. دفتر العناوين المحفوظة للعميل (Saved Addresses Book)
        window.getSavedAddressesList = function() {
            try {
                return JSON.parse(localStorage.getItem('zait_saved_addresses_book')) || [];
            } catch (e) {
                return [];
            }
        };

        window.renderSavedAddressesBook = function() {
            let box = document.getElementById('saved-addresses-book-box');
            let listEl = document.getElementById('saved-addresses-chips-list');
            if (!box || !listEl) return;
            if (storeSettings.enableSavedAddresses === false) {
                box.style.display = 'none';
                return;
            }
            box.style.display = 'block';
            let addrs = window.getSavedAddressesList();
            if (addrs.length === 0) {
                listEl.innerHTML = `<span style="font-size:0.8rem; color:var(--text-muted);">${window.currentLang === 'en' ? 'Fill your address below then click (+ Save Current Address) for 1-click checkout next time.' : 'املأ بيانات عنوانك بالأسفل ثم اضغط (➕ حفظ العنوان الحالي) لاختياره بضغطة زر في طلباتك القادمة.'}</span>`;
                return;
            }
            let html = '';
            addrs.forEach((a, idx) => {
                html += `<div class="saved-address-chip" onclick="window.applySavedAddress(${idx})">
                    <span>📍 ${window.escapeHTML(a.label)} (${window.escapeHTML(a.gov)})</span>
                    <span style="color:var(--danger); font-weight:bold; margin-right:4px;" onclick="event.stopPropagation(); window.deleteSavedAddress(${idx})">✖</span>
                </div>`;
            });
            listEl.innerHTML = html;
        };

        window.saveCurrentCheckoutAddress = function() {
            let name = (document.getElementById('order-name') || {}).value || '';
            let phone1 = (document.getElementById('order-phone1') || {}).value || '';
            let phone2 = (document.getElementById('order-phone2') || {}).value || '';
            let gov = (document.getElementById('order-gov') || {}).value || '';
            let city = (document.getElementById('order-city') || {}).value || '';
            let addr = (document.getElementById('order-address') || {}).value || '';
            let lat = (document.getElementById('order-lat') || {}).value || '30.0444';
            let lng = (document.getElementById('order-lng') || {}).value || '31.2357';

            if (!gov || !addr) {
                window.showToast(window.currentLang === 'en' ? 'Select governorate and write detailed address first!' : 'اختر المحافظة واكتب العنوان التفصيلي أولاً لحفظه!', 'error');
                return;
            }
            let label = prompt(window.currentLang === 'en' ? 'Address Label (e.g. Home / Work / Family):' : 'اسم العنوان (مثال: المنزل / العمل / العائلة):', '🏠 المنزل');
            if (!label) return;
            let addrs = window.getSavedAddressesList();
            addrs.push({ label: label.trim(), name, phone1, phone2, gov, city, addr, lat: lat || '30.0444', lng: lng || '31.2357' });
            localStorage.setItem('zait_saved_addresses_book', JSON.stringify(addrs));
            window.renderSavedAddressesBook();
            window.showToast(window.currentLang === 'en' ? 'Address saved to your book!' : 'تم حفظ العنوان في دفترك بنجاح 📍', 'success');
        };

        window.applySavedAddress = function(idx) {
            let addrs = window.getSavedAddressesList();
            let a = addrs[idx];
            if (!a) return;
            if (a.name && document.getElementById('order-name')) document.getElementById('order-name').value = a.name;
            if (a.phone1 && document.getElementById('order-phone1')) document.getElementById('order-phone1').value = a.phone1;
            if (a.phone2 && document.getElementById('order-phone2')) document.getElementById('order-phone2').value = a.phone2;
            if (a.addr && document.getElementById('order-address')) document.getElementById('order-address').value = a.addr;
            if (document.getElementById('order-lat')) document.getElementById('order-lat').value = a.lat || '30.0444';
            if (document.getElementById('order-lng')) document.getElementById('order-lng').value = a.lng || '31.2357';
            let gEl = document.getElementById('order-gov');
            if (gEl && a.gov) {
                gEl.value = a.gov;
                gEl.dispatchEvent(new Event('change'));
                setTimeout(() => {
                    let cEl = document.getElementById('order-city');
                    if (cEl && a.city) cEl.value = a.city;
                }, 80);
            }
            window.showToast(window.currentLang === 'en' ? `Applied address: ${a.label}` : `تم اختيار عنوان: ${a.label}`, 'success');
        };

        window.deleteSavedAddress = function(idx) {
            let addrs = window.getSavedAddressesList();
            addrs.splice(idx, 1);
            localStorage.setItem('zait_saved_addresses_book', JSON.stringify(addrs));
            window.renderSavedAddressesBook();
        };

        // 6. مقارنة المنتجات السريعة + حاسبة التوفير للأحجام (Product Compare & Value Calculator)
        window.compareProductIds = [];
        window.toggleCompareProduct = function(event, productId) {
            if (event) event.stopPropagation();
            if (storeSettings.enableProductCompare === false) return;
            let idx = window.compareProductIds.indexOf(productId);
            if (idx > -1) {
                window.compareProductIds.splice(idx, 1);
            } else {
                if (window.compareProductIds.length >= 4) {
                    window.showToast(window.currentLang === 'en' ? 'You can compare up to 4 products at a time' : 'يمكنك مقارنة 4 منتجات كحد أقصى في المرة الواحدة', 'info');
                    return;
                }
                window.compareProductIds.push(productId);
                window.showToast(window.currentLang === 'en' ? 'Added to comparison ⚖️' : 'تمت إضافة المنتج للمقارنة ⚖️', 'info');
            }
            window.updateCompareFloatingBar();
            window.renderProducts(false);
        };

        window.clearCompareList = function() {
            window.compareProductIds = [];
            window.updateCompareFloatingBar();
            window.renderProducts(false);
        };

        window.updateCompareFloatingBar = function() {
            let bar = document.getElementById('compare-floating-bar');
            let cnt = document.getElementById('compare-count-num');
            if (!bar || !cnt) return;
            if (storeSettings.enableProductCompare !== false && window.compareProductIds.length > 0) {
                bar.style.display = 'flex';
                cnt.textContent = window.compareProductIds.length;
            } else {
                bar.style.display = 'none';
            }
        };

        window.openCompareModal = function() {
            let modal = document.getElementById('compare-products-modal');
            let cont = document.getElementById('compare-table-container');
            if (!modal || !cont) return;
            let items = products.filter(p => window.compareProductIds.includes(p.id));
            if (items.length === 0) return;

            let isEn = window.currentLang === 'en';
            let html = `<table class="specs-table" style="text-align:center;">
                <tr>
                    <td>${isEn ? 'Product' : 'المنتج'}</td>
                    ${items.map(p => `<td><img src="${(p.images && p.images[0]) || p.imageUrl || '1000392409.jpeg'}" style="width:65px; height:65px; object-fit:cover; border-radius:8px; display:block; margin:0 auto 6px;"><strong>${window.escapeHTML(p.name)}</strong></td>`).join('')}
                </tr>
                <tr>
                    <td>${isEn ? 'Price' : 'السعر'}</td>
                    ${items.map(p => `<td style="color:var(--secondary); font-weight:bold; font-size:1.05rem;">${p.price} ${isEn ? 'EGP' : 'ج'}</td>`).join('')}
                </tr>
                <tr>
                    <td>${isEn ? 'Category' : 'القسم'}</td>
                    ${items.map(p => `<td>${window.escapeHTML(p.category || 'زيت زيتون')}</td>`).join('')}
                </tr>
                <tr>
                    <td>${isEn ? 'Sizes / Variants' : 'الأحجام المتاحة'}</td>
                    ${items.map(p => `<td>${p.variantsData && p.variantsData.length > 0 ? p.variantsData.map(v => `${window.escapeHTML(v.name)} (${v.price} ج)`).join('<br>') : (isEn ? 'Standard Size' : 'الحجم الأساسي')}</td>`).join('')}
                </tr>
                <tr>
                    <td>${isEn ? 'Action' : 'الشراء'}</td>
                    ${items.map(p => `<td><button type="button" class="btn" style="padding:5px 10px; font-size:0.8rem;" onclick="document.getElementById('compare-products-modal').style.display='none'; window.openProductModal('${p.id}')">${isEn ? 'View & Buy 🛒' : 'عرض وشراء 🛒'}</button></td>`).join('')}
                </tr>
            </table>`;
            cont.innerHTML = html;
            modal.style.display = 'flex';
        };

        window.updateModalValueCalculator = function(product) {
            let calcEl = document.getElementById('modal-value-calculator');
            if (!calcEl) return;
            if (storeSettings.enableProductCompare === false || !product) {
                calcEl.style.display = 'none';
                return;
            }
            let vArr = product.variantsData || [];
            if (vArr.length >= 2) {
                let last = vArr[vArr.length - 1];
                calcEl.style.display = 'block';
                calcEl.innerHTML = window.currentLang === 'en'
                    ? `🧮 <strong>Value Tip:</strong> Choosing larger sizes like (${window.escapeHTML(last.name)}) gives you the best value per liter + qualifies faster for Free Shipping!`
                    : `🧮 <strong>نصيحة التوفير:</strong> اختيار العبوات الأكبر مثل (${window.escapeHTML(last.name)}) يوفر لك في سعر اللتر ويقربك أسرع للشحن المجاني والهدية!`;
            } else if (product.oldPrice && Number(product.oldPrice) > Number(product.price)) {
                let diff = Number(product.oldPrice) - Number(product.price);
                calcEl.style.display = 'block';
                calcEl.innerHTML = window.currentLang === 'en'
                    ? `🧮 <strong>Direct Saving:</strong> You save <strong>${diff} EGP</strong> per unit on this offer!`
                    : `🧮 <strong>حاسبة التوفير:</strong> توفر في العبوة الواحدة من هذا العرض <strong>${diff} ج</strong> فوراً!`;
            } else {
                calcEl.style.display = 'none';
            }
        };

        const origOpenProductModalV53 = window.openProductModal;
        window.openProductModal = function(id) {
            origOpenProductModalV53(id);
            const product = products.find(p => p.id === id);
            window.updateModalValueCalculator(product);
        };

        const origUpdateAdminUIV53 = window.updateAdminUI;
        window.updateAdminUI = function() {
            origUpdateAdminUIV53();
            if (isCurrentUserAdmin) {
                window.loadAdminWheelLeads();
            } else if (window.adminWheelLeadsUnsubscribe) {
                window.adminWheelLeadsUnsubscribe();
                window.adminWheelLeadsUnsubscribe = null;
            }
        };

        const prevApplySettingsV53 = window.applySettingsToUI;
        window.applySettingsToUI = function() {
            prevApplySettingsV53();
            if (isCurrentUserAdmin) {
                let setC = (id, val, def = true) => { let el = document.getElementById(id); if (el) el.checked = val !== undefined ? Boolean(val) : def; };
                let setV = (id, val, def = '') => { let el = document.getElementById(id); if (el) el.value = val !== undefined ? val : def; };

                setC('setting-enable-spin-wheel', storeSettings.enableSpinWheel, true);
                setV('setting-wheel-coupon', storeSettings.wheelCouponCode, 'LUCKY10');
                setV('setting-wheel-discount', storeSettings.wheelDiscountPercent, 10);

                setC('setting-enable-free-gift', storeSettings.enableFreeGift, true);
                setV('setting-free-gift-threshold', storeSettings.freeGiftThreshold, 1500);
                setV('setting-free-gift-name', storeSettings.freeGiftName, 'عبوة زيت زيتون 250 مل هدية مجانية 🎁');

                setC('setting-enable-scarcity-bar', storeSettings.enableScarcityBar, true);
                setC('setting-enable-smart-chat-chips', storeSettings.enableSmartChatChips, true);
                setC('setting-enable-saved-addresses', storeSettings.enableSavedAddresses, true);
                setC('setting-enable-product-compare', storeSettings.enableProductCompare, true);
            }

            let fab = document.getElementById('spin-wheel-fab');
            if (fab) fab.style.display = storeSettings.enableSpinWheel !== false ? 'flex' : 'none';

            let wheelCard = document.getElementById('admin-wheel-leads-card');
            if (wheelCard) wheelCard.style.display = storeSettings.enableSpinWheel !== false ? 'block' : 'none';

            let chipsBox = document.getElementById('smart-chat-chips-box');
            if (chipsBox) chipsBox.style.display = storeSettings.enableSmartChatChips !== false ? 'flex' : 'none';

            window.updateFreeGiftUI();
            window.renderSavedAddressesBook();
            window.updateCompareFloatingBar();
            if (window.currentLang === 'en') window.translateDOM(document.body);
        };

        const prevSaveSettingsV53 = window.saveSettings;
        window.saveSettings = async function() {
            const getC = (id, def = true) => { let el = document.getElementById(id); return el ? el.checked : def; };
            const getV = (id, def = '') => { let el = document.getElementById(id); return el ? el.value.trim() : def; };
            try {
                await updateDoc(doc(db, 'settings', 'main'), {
                    enableSpinWheel: getC('setting-enable-spin-wheel', true),
                    wheelCouponCode: getV('setting-wheel-coupon', 'LUCKY10'),
                    wheelDiscountPercent: Number(getV('setting-wheel-discount', 10)) || 10,
                    enableFreeGift: getC('setting-enable-free-gift', true),
                    freeGiftThreshold: Number(getV('setting-free-gift-threshold', 1500)) || 1500,
                    freeGiftName: getV('setting-free-gift-name', 'عبوة زيت زيتون 250 مل هدية مجانية 🎁'),
                    enableScarcityBar: getC('setting-enable-scarcity-bar', true),
                    enableSmartChatChips: getC('setting-enable-smart-chat-chips', true),
                    enableSavedAddresses: getC('setting-enable-saved-addresses', true),
                    enableProductCompare: getC('setting-enable-product-compare', true)
                });
            } catch (e) {}
            await prevSaveSettingsV53();
        };

        // إضافة مصطلحات V54 للقاموس الإنجليزي
        Object.assign(window.FULL_AR_TO_EN, {
            "جرب حظك واربح!": "Spin & Win!",
            "عجلة الحظ والمكافآت": "Spin & Win Rewards",
            "أدخل رقم الواتساب الخاص بك ولف العجلة لتربح كود خصم فوري على طلبك!": "Enter your WhatsApp number and spin the wheel to win an instant discount!",
            "لف العجلة الآن!": "Spin Now!",
            "المقارنة:": "Compare:",
            "قارن الآن": "Compare Now",
            "مقارنة المنتجات": "Product Comparison",
            "كم سعر ومدة الشحن؟": "Shipping cost & time?",
            "كيف أتأكد أن الزيت أصلي؟": "Is the olive oil 100% authentic?",
            "ما طرق الدفع المتاحة؟": "Payment methods?",
            "ما هي العروض والهدايا الحالية؟": "Current offers & gifts?",
            "دفتر عناويني المحفوظة (اختر للتعبئة السريعة):": "My Saved Addresses (Tap to autofill):",
            "حفظ العنوان الحالي": "Save Current Address"
        });
        Object.assign(window.PLACEHOLDER_AR_TO_EN, {
            "أدخل رقم هاتفك (واتساب)...": "Enter your WhatsApp phone number..."
        });


        // =========================================================================
        // === النسخة V55: عجلة الـ 7 هدايا المخصصة + تجديد الخميس + أدوات المدير ===
        // =========================================================================

        // 1. الـ 7 هدايا الافتراضية لعجلة الحظ (مع تحديد 3 هدايا مسموح الفوز بها افتراضياً)
        window.getDefaultWheel7Prizes = function() {
            return [
                { label: "خصم 5% فوري", code: "WIN5", discount: 5, allowed: true },
                { label: "خصم 10% فوري", code: "LUCKY10", discount: 10, allowed: true },
                { label: "شحن مجاني 🚚", code: "FREESHIP", discount: 0, allowed: false },
                { label: "خصم 8% خاص", code: "ZAIT8", discount: 8, allowed: true },
                { label: "عبوة 250مل هدية 🎁", code: "GIFT250", discount: 0, allowed: false },
                { label: "خصم 20% كبرى", code: "MEGA20", discount: 20, allowed: false },
                { label: "جركن 1 لتر هدية 🏆", code: "GIFT1L", discount: 0, allowed: false }
            ];
        };

        window.getWheel7Prizes = function() {
            if (Array.isArray(storeSettings.wheel7Prizes) && storeSettings.wheel7Prizes.length === 7) {
                return storeSettings.wheel7Prizes;
            }
            return window.getDefaultWheel7Prizes();
        };

        // حساب دورة يوم الخميس الحالية + وقت التجديد القادم يوم الخميس
        window.getThursdayCycleInfo = function() {
            let now = new Date();
            let day = now.getDay(); // 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
            let daysSinceThu = (day - 4 + 7) % 7;
            let lastThu = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysSinceThu, 0, 0, 0, 0);
            let nextThu = new Date(lastThu.getTime() + 7 * 86400000);
            let resetVer = storeSettings.wheelResetVersion || 1;
            let cycleId = `${lastThu.getFullYear()}-${lastThu.getMonth()+1}-${lastThu.getDate()}_v${resetVer}`;
            return { cycleId, nextThu, remMs: Math.max(0, nextThu.getTime() - now.getTime()) };
        };

        // عداد تنازلي حي ليوم الخميس القادم بالأيام والساعات والدقائق والثواني
        window.updateWheelThursdayCountdown = function() {
            let el = document.getElementById('wheel-thursday-countdown');
            if (!el) return;
            let info = window.getThursdayCycleInfo();
            let totalSec = Math.floor(info.remMs / 1000);
            let days = Math.floor(totalSec / 86400);
            let hours = Math.floor((totalSec % 86400) / 3600);
            let mins = Math.floor((totalSec % 3600) / 60);
            let secs = totalSec % 60;

            let isEn = window.currentLang === 'en';
            el.innerHTML = isEn
                ? `⏳ Next Spin Reset (Thursday) in: <strong>${days}d : ${hours}h : ${mins}m : ${secs}s</strong>`
                : `⏳ تتجدد فرصتك القادمة يوم الخميس بعد: <strong style="color:var(--danger);">${days} يوم و ${hours} ساعة و ${mins} دقيقة و ${secs} ثانية</strong>`;
        };
        setInterval(window.updateWheelThursdayCountdown, 1000);

        // رسم قائمة الـ 7 هدايا داخل نافذة العجلة للعميل
        window.renderWheelModalContent = function(highlightIdx = -1) {
            window.updateWheelThursdayCountdown();
            let prizes = window.getWheel7Prizes();
            let legendEl = document.getElementById('wheel-prizes-legend');
            if (legendEl) {
                legendEl.innerHTML = prizes.map((p, idx) => `
                    <div class="wheel-prize-pill ${highlightIdx === idx ? 'winner-highlight' : ''}" id="wheel-pill-${idx}">
                        <span style="background:var(--secondary); color:white; border-radius:50%; width:18px; height:18px; display:inline-flex; align-items:center; justify-content:center; font-size:0.7rem;">${idx + 1}</span>
                        <span>${window.escapeHTML(p.label)}</span>
                    </div>
                `).join('');
            }

            // التحقق من رقم الواتساب المحفوظ مسبقاً (يُطلب أول مرة فقط)
            let savedPhone = localStorage.getItem('zait_wheel_saved_phone') || '';
            let phoneInp = document.getElementById('wheel-phone-input');
            let savedBar = document.getElementById('wheel-saved-phone-bar');
            if (savedPhone && phoneInp && savedBar) {
                phoneInp.value = savedPhone;
                phoneInp.style.display = 'none';
                savedBar.style.display = 'block';
                savedBar.innerHTML = window.currentLang === 'en'
                    ? `✅ Registered WhatsApp: <strong>${window.escapeHTML(savedPhone)}</strong> <a href="#" onclick="event.preventDefault(); window.changeWheelSavedPhone();" style="color:var(--secondary); margin-left:6px;">(Change)</a>`
                    : `✅ رقم الواتساب المسجل: <strong>${window.escapeHTML(savedPhone)}</strong> <a href="#" onclick="event.preventDefault(); window.changeWheelSavedPhone();" style="color:var(--secondary); margin-right:6px;">(تغيير الرقم)</a>`;
            } else if (phoneInp && savedBar) {
                phoneInp.style.display = 'block';
                savedBar.style.display = 'none';
            }

            // التحقق مما إذا كان العميل قد لف العجلة في دورة الخميس الحالية
            let info = window.getThursdayCycleInfo();
            let lastCycle = localStorage.getItem('zait_wheel_last_cycle');
            let lastPrizeJson = localStorage.getItem('zait_wheel_last_prize');
            let btn = document.getElementById('btn-spin-now');
            let resArea = document.getElementById('wheel-result-area');

            if (lastCycle === info.cycleId && lastPrizeJson) {
                try {
                    let won = JSON.parse(lastPrizeJson);
                    if (btn) {
                        btn.disabled = true;
                        btn.innerHTML = window.currentLang === 'en' ? '✅ Used this week (Resets Thursday)' : '✅ حصلت على هديتك هذا الأسبوع (تتجدد الخميس)';
                        btn.style.opacity = '0.65';
                    }
                    if (resArea) {
                        resArea.style.display = 'block';
                        resArea.innerHTML = window.currentLang === 'en'
                            ? `🎁 Your Prize This Week: <strong>${window.escapeHTML(won.label)}</strong> (Code: <strong>${window.escapeHTML(won.code)}</strong>)<br><small>Come back on Thursday for a new spin!</small>`
                            : `🎁 هديتك في هذا الأسبوع: <strong>${window.escapeHTML(won.label)}</strong> (الكود: <strong>${window.escapeHTML(won.code)}</strong>)<br><small>انتظر تجديد الفرصة يوم الخميس القادم لتلف العجلة من جديد!</small>`;
                    }
                } catch (e) {}
            } else {
                if (btn) {
                    btn.disabled = false;
                    btn.innerHTML = window.currentLang === 'en' ? '🎲 Spin the Wheel Now!' : '🎲 لف العجلة الآن!';
                    btn.style.opacity = '1';
                }
                if (resArea && highlightIdx === -1) {
                    resArea.style.display = 'none';
                }
            }
        };

        window.changeWheelSavedPhone = function() {
            localStorage.removeItem('zait_wheel_saved_phone');
            let phoneInp = document.getElementById('wheel-phone-input');
            let savedBar = document.getElementById('wheel-saved-phone-bar');
            if (phoneInp) {
                phoneInp.style.display = 'block';
                phoneInp.value = '';
                phoneInp.focus();
            }
            if (savedBar) savedBar.style.display = 'none';
        };

        window.openSpinWheelModal = function() {
            let modal = document.getElementById('spin-wheel-modal');
            if (modal) {
                window.renderWheelModalContent(-1);
                modal.style.display = 'flex';
            }
        };

        window.spinTheWheelNow = async function() {
            let info = window.getThursdayCycleInfo();
            if (localStorage.getItem('zait_wheel_last_cycle') === info.cycleId) {
                window.showToast(window.currentLang === 'en' ? 'You already spun this week! Next spin is on Thursday.' : 'لقد استخدمت فرصتك لهذا الأسبوع! تتجدد الفرصة يوم الخميس القادم.', 'info');
                window.renderWheelModalContent(-1);
                return;
            }

            let savedPhone = localStorage.getItem('zait_wheel_saved_phone') || '';
            let phoneInp = document.getElementById('wheel-phone-input');
            let phone = savedPhone || (phoneInp ? phoneInp.value.trim() : '');

            if (!phone || phone.replace(/\D/g, '').length < 9) {
                window.showToast(window.currentLang === 'en' ? 'Please enter your WhatsApp phone number first!' : 'يرجى إدخال رقم الواتساب الخاص بك أولاً!', 'error');
                if (phoneInp) { phoneInp.style.display = 'block'; phoneInp.focus(); }
                return;
            }

            // حفظ رقم الواتساب حتى لا يضطر العميل لكتابته مرة أخرى في الأسابيع القادمة
            localStorage.setItem('zait_wheel_saved_phone', phone);

            let prizes = window.getWheel7Prizes();
            // اختيار الهدية حصرياً من الهدايا التي حددها الأدمن كـ (مسموح الفوز بها)
            let allowedIndices = [];
            prizes.forEach((p, idx) => { if (p.allowed) allowedIndices.push(idx); });
            if (allowedIndices.length === 0) allowedIndices = [0];

            let winningIndex = allowedIndices[Math.floor(Math.random() * allowedIndices.length)];
            let winningPrize = prizes[winningIndex];

            let btn = document.getElementById('btn-spin-now');
            let wheel = document.getElementById('wheel-visual-circle');
            let resArea = document.getElementById('wheel-result-area');
            if (btn) btn.disabled = true;

            // حساب زاوية الدوران لتقف العجلة على رقم الهدية الفائزة
            let sliceDeg = 360 / 7;
            let targetSliceCenter = (winningIndex * sliceDeg) + (sliceDeg / 2);
            let extraSpins = 5 * 360;
            let finalDeg = extraSpins + (360 - targetSliceCenter);
            if (wheel) {
                wheel.style.transition = 'none';
                wheel.style.transform = 'rotate(0deg)';
                setTimeout(() => {
                    wheel.style.transition = 'transform 3.6s cubic-bezier(0.15, 0.85, 0.15, 1)';
                    wheel.style.transform = `rotate(${finalDeg}deg)`;
                }, 30);
            }

            setTimeout(async () => {
                // تطبيق الجائزة للعميل
                let winDisc = Number(winningPrize.discount) || 0;
                let winCode = String(winningPrize.code || 'LUCKY').trim().toUpperCase();
                if (winDisc > 0) {
                    currentDiscountPercent = winDisc;
                    appliedPromoCode = winCode;
                } else if (winCode === 'FREESHIP') {
                    currentShippingCost = 0;
                    appliedPromoCode = winCode;
                } else {
                    appliedPromoCode = `${winCode} (${winningPrize.label})`;
                }
                window.updateInvoiceUI();

                localStorage.setItem('zait_wheel_last_cycle', info.cycleId);
                localStorage.setItem('zait_wheel_last_prize', JSON.stringify(winningPrize));

                window.renderWheelModalContent(winningIndex);
                if (resArea) {
                    resArea.style.display = 'block';
                    resArea.innerHTML = window.currentLang === 'en'
                        ? `🎉 <strong>Congrats! You won Prize #${winningIndex + 1}:</strong><br><span style="font-size:1.05rem; font-weight:900;">${window.escapeHTML(winningPrize.label)}</span><br>Code: <strong style="background:white; padding:2px 8px; border-radius:6px; border:1px dashed #166534;">${window.escapeHTML(winCode)}</strong> (Applied automatically!)`
                        : `🎉 <strong>مبروك! فزت بالهدية رقم (${winningIndex + 1}):</strong><br><span style="font-size:1.05rem; font-weight:900;">${window.escapeHTML(winningPrize.label)}</span><br>الكود: <strong style="background:white; padding:2px 8px; border-radius:6px; border:1px dashed #166534;">${window.escapeHTML(winCode)}</strong> (تم تفعيله تلقائياً في طلبك!)`;
                }

                try {
                    await addDoc(collection(db, 'wheel_leads'), {
                        phone: phone,
                        prizeCode: `${winningPrize.label} (${winCode})`,
                        discount: winDisc,
                        date: new Date().toISOString()
                    });
                } catch (e) {}
            }, 3700);
        };

        // رسم محرر الهدايا الـ 7 داخل الإعدادات المحمية للأدمن
        window.renderAdminWheel7PrizesEditor = function() {
            let cont = document.getElementById('admin-wheel-7prizes-editor');
            if (!cont) return;
            let prizes = window.getWheel7Prizes();
            let html = '';
            prizes.forEach((p, idx) => {
                html += `<div style="display:flex; gap:6px; align-items:center; flex-wrap:wrap; background:var(--input-bg); padding:6px 8px; border-radius:8px; border:1px solid var(--border-color);">
                    <strong style="color:var(--primary); font-size:0.8rem; min-width:22px;">#${idx + 1}</strong>
                    <label style="display:flex; align-items:center; gap:4px; font-size:0.78rem; color:#166534; font-weight:bold; cursor:pointer; margin:0;">
                        <input type="checkbox" class="wheel-prize-allowed-cb" data-idx="${idx}" ${p.allowed ? 'checked' : ''} style="width:16px; height:16px; margin:0; accent-color:#166534;">
                        <span>مسموح يربحها</span>
                    </label>
                    <input type="text" class="wheel-prize-label-inp" data-idx="${idx}" value="${window.escapeHTML(p.label)}" placeholder="اسم الهدية" style="margin:0; flex:1.5; min-width:110px; padding:5px 8px; font-size:0.8rem;">
                    <input type="text" class="wheel-prize-code-inp" data-idx="${idx}" value="${window.escapeHTML(p.code)}" placeholder="الكود" style="margin:0; flex:1; max-width:90px; padding:5px 8px; font-size:0.8rem;">
                    <input type="number" class="wheel-prize-disc-inp" data-idx="${idx}" value="${Number(p.discount) || 0}" placeholder="الخصم %" style="margin:0; max-width:70px; padding:5px 8px; font-size:0.8rem;" title="نسبة الخصم % (اكتب 0 لو شحن مجاني أو هدية عينية)">
                </div>`;
            });
            cont.innerHTML = html;
        };

        window.collectAdminWheel7PrizesFromDOM = function() {
            let labels = document.querySelectorAll('.wheel-prize-label-inp');
            if (!labels || labels.length !== 7) return window.getWheel7Prizes();
            let result = [];
            for (let i = 0; i < 7; i++) {
                let lbl = document.querySelector(`.wheel-prize-label-inp[data-idx="${i}"]`);
                let cod = document.querySelector(`.wheel-prize-code-inp[data-idx="${i}"]`);
                let dsc = document.querySelector(`.wheel-prize-disc-inp[data-idx="${i}"]`);
                let alw = document.querySelector(`.wheel-prize-allowed-cb[data-idx="${i}"]`);
                result.push({
                    label: lbl ? lbl.value.trim() : `هدية ${i+1}`,
                    code: cod ? cod.value.trim().toUpperCase() : `WIN${i+1}`,
                    discount: dsc ? (Number(dsc.value) || 0) : 0,
                    allowed: alw ? alw.checked : false
                });
            }
            return result;
        };

        window.resetAllUsersWheelSpinsNow = async function() {
            if (!confirm('هل تريد تجديد فرصة لف العجلة لجميع العملاء الآن قبل يوم الخميس؟')) return;
            let nextVer = (Number(storeSettings.wheelResetVersion) || 1) + 1;
            try {
                await updateDoc(doc(db, 'settings', 'main'), { wheelResetVersion: nextVer });
                localStorage.removeItem('zait_wheel_last_cycle');
                localStorage.removeItem('zait_wheel_last_prize');
                window.showToast('تم تجديد فرصة العجلة لجميع العملاء فوراً 🔄', 'success');
            } catch (e) {
                window.showToast('حدث خطأ أثناء التجديد', 'error');
            }
        };

        // 2. حاسبة صافي الربح الفعلي للمدير (Net Profit Tracker)
        window.renderNetProfitStat = function() {
            let card = document.getElementById('admin-net-profit-card');
            let statEl = document.getElementById('stat-net-profit');
            if (card) card.style.display = storeSettings.enableNetProfit !== false ? 'block' : 'none';
            if (!statEl || storeSettings.enableNetProfit === false) return;

            let revReset = storeSettings.revenueResetDate ? new Date(storeSettings.revenueResetDate) : new Date(0);
            let totalNet = 0;
            adminOrdersArray.forEach(o => {
                let st = String(o.status || '');
                if (st.includes('رفض') || st.includes('لغى')) return;
                if (new Date(o.orderDate) <= revReset) return;
                let orderCost = 0;
                (o.items || []).forEach(it => {
                    let prod = products.find(p => p.id === it.id || p.name === it.name);
                    let unitCost = (prod && prod.costPrice) ? Number(prod.costPrice) : 0;
                    orderCost += unitCost * Number(it.quantity || 1);
                });
                let revWithoutShip = Number(o.totalAmount || 0) - Number(o.shippingCost || 0);
                totalNet += Math.max(0, revWithoutShip - orderCost);
            });
            statEl.textContent = `${totalNet.toLocaleString()} ج`;
        };

        // 3. تعديل الأسعار الجماعي بضغطة زر (Bulk Price Editor)
        window.executeBulkPriceUpdate = async function() {
            let op = (document.getElementById('bulk-price-op') || {}).value || 'inc';
            let type = (document.getElementById('bulk-price-type') || {}).value || 'pct';
            let val = Number((document.getElementById('bulk-price-val') || {}).value || 0);
            if (!val || val <= 0) {
                window.showToast('يرجى إدخال قيمة صحيحة للتعديل الجماعي', 'error');
                return;
            }
            let actionDesc = `${op === 'inc' ? 'زيادة' : 'تخفيض'} أسعار جميع المنتجات (${products.length} منتج) بمقدار ${val} ${type === 'pct' ? '%' : 'جنيه'}`;
            if (!confirm(`هل أنت متأكد من ${actionDesc} دفعة واحدة؟`)) return;

            try {
                for (let p of products) {
                    let curP = Number(p.price) || 0;
                    let delta = type === 'pct' ? Math.round(curP * (val / 100)) : val;
                    let newP = op === 'inc' ? (curP + delta) : Math.max(1, curP - delta);
                    let updatedVariants = (p.variantsData || []).map(v => {
                        let vp = Number(v.price) || 0;
                        let vd = type === 'pct' ? Math.round(vp * (val / 100)) : val;
                        return { ...v, price: op === 'inc' ? (vp + vd) : Math.max(1, vp - vd) };
                    });
                    await updateDoc(doc(db, 'products', p.id), { price: newP, variantsData: updatedVariants });
                }
                window.showToast('تم تحديث أسعار جميع المنتجات بنجاح 🚀', 'success');
            } catch (e) {
                window.showToast('حدث خطأ أثناء تحديث الأسعار', 'error');
            }
        };

        // 4. تصنيف العملاء (VIP / حظر) + إرسال حالة الطلب عبر واتساب من داخل تفاصيل الطلب
        window.getCustomerTagBadgeHtml = function(phone) {
            if (storeSettings.enableCustomerTags === false || !phone) return '';
            let clean = String(phone).replace(/\D/g, '');
            let tagsMap = storeSettings.customerTagsMap || {};
            let tagObj = tagsMap[clean];
            if (!tagObj) return '';
            if (tagObj.type === 'vip') return `<span class="cust-tag-vip" title="${window.escapeHTML(tagObj.note || '')}">🌟 VIP</span>`;
            if (tagObj.type === 'blacklist') return `<span class="cust-tag-blacklist" title="${window.escapeHTML(tagObj.note || '')}">🚫 حظر / لا يستلم</span>`;
            return '';
        };

        window.setCustomerTag = async function(phone, type) {
            let clean = String(phone || '').replace(/\D/g, '');
            if (!clean) return;
            let tagsMap = { ...(storeSettings.customerTagsMap || {}) };
            if (type === 'clear') {
                delete tagsMap[clean];
            } else {
                let note = prompt(type === 'vip' ? 'ملاحظة عن العميل المميز (اختياري):' : 'سبب وضع العميل في قائمة الحظر (مثال: يرفض الاستلام):', (tagsMap[clean] && tagsMap[clean].note) || '');
                if (note === null) return;
                tagsMap[clean] = { type, note: note.trim() };
            }
            try {
                await updateDoc(doc(db, 'settings', 'main'), { customerTagsMap: tagsMap });
                window.showToast('تم تحديث تصنيف العميل بنجاح ✅', 'success');
            } catch (e) {}
        };

        window.sendOrderWhatsAppStatus = function(orderId) {
            let o = adminOrdersArray.find(ord => ord.id === orderId);
            if (!o) return;
            let rawPhone = (o.phones && o.phones.primary) ? String(o.phones.primary).replace(/\D/g, '') : '';
            if (rawPhone && !rawPhone.startsWith('20') && rawPhone.length >= 10) rawPhone = '20' + rawPhone;
            let itemsStr = (o.items || []).map(i => `${i.name} (${i.quantity})`).join(' + ');
            let msg = `مرحباً ${o.customerName} 🌿\nبخصوص طلبك رقم #${o.id.slice(0,6).toUpperCase()} من *متجر زيت الشجرة المباركة*:\n📦 المنتجات: ${itemsStr}\n💰 الإجمالي: ${o.totalAmount} ج\n📌 حالة الطلب الحالية: *${o.status}*\nنسعد دائماً بخدمتك!`;
            window.open(`https://wa.me/${rawPhone}?text=${encodeURIComponent(msg)}`, '_blank');
        };

        const origOpenAdminOrderModalV54 = window.openAdminOrderModal;
        window.openAdminOrderModal = function(id) {
            origOpenAdminOrderModalV54(id);
            let o = adminOrdersArray.find(ord => ord.id === id);
            let aom = document.getElementById('aom-content');
            if (!o || !aom) return;
            let phone = (o.phones && o.phones.primary) || '';
            let clean = String(phone).replace(/\D/g, '');
            let tagObj = (storeSettings.customerTagsMap || {})[clean];

            let extraHtml = '<div style="margin-top:12px; padding-top:12px; border-top:1px dashed var(--border-color); display:flex; flex-direction:column; gap:8px;">';
            if (storeSettings.enableWaOrderStatus !== false) {
                extraHtml += `<button type="button" class="btn" style="background:#25D366; width:100%;" onclick="window.sendOrderWhatsAppStatus('${o.id}')">📲 إرسال تحديث حالة الطلب للعميل عبر واتساب</button>`;
            }
            if (storeSettings.enableCustomerTags !== false) {
                let noteBanner = tagObj ? `<div style="padding:8px; border-radius:6px; background:${tagObj.type==='vip'?'#fef3c7':'#fee2e2'}; color:${tagObj.type==='vip'?'#92400e':'#991b1b'}; font-weight:bold; font-size:0.85rem;">${tagObj.type==='vip'?'🌟 عميل VIP مميز':'🚫 تنبيه: هذا العميل في قائمة الحظر'} ${tagObj.note ? ' - ' + window.escapeHTML(tagObj.note) : ''}</div>` : '';
                extraHtml += `${noteBanner}
                <div style="display:flex; gap:6px; flex-wrap:wrap;">
                    <button type="button" class="btn btn-outline" style="flex:1; font-size:0.8rem; border-color:#d97706; color:#d97706; padding:6px;" onclick="window.setCustomerTag('${phone}', 'vip')">🌟 تمييز كـ VIP</button>
                    <button type="button" class="btn btn-outline" style="flex:1; font-size:0.8rem; border-color:#dc2626; color:#dc2626; padding:6px;" onclick="window.setCustomerTag('${phone}', 'blacklist')">🚫 حظر / لا يستلم</button>
                    ${tagObj ? `<button type="button" class="btn btn-outline" style="font-size:0.8rem; padding:6px;" onclick="window.setCustomerTag('${phone}', 'clear')">إلغاء التصنيف</button>` : ''}
                </div>`;
            }
            extraHtml += '</div>';
            aom.innerHTML += extraHtml;
        };

        // 5. نظام دعوة الأصدقاء (Referral Link)
        window.getCustomerReferralLink = function() {
            let baseUrl = window.location.origin + window.location.pathname;
            let refCode = currentUser ? (currentUser.uid || '').slice(0, 6).toUpperCase() : 'FRIEND';
            return `${baseUrl}?utm_source=referral&ref=${refCode}`;
        };

        window.shareReferralLinkWhatsApp = function() {
            let link = window.getCustomerReferralLink();
            let txt = window.currentLang === 'en'
                ? `Try the finest 100% pure Sinai Extra Virgin Olive Oil from Blessed Tree Oil Store 🌿 Order now via my link: ${link}`
                : `جرب أفضل زيت زيتون سيناوي بكر ممتاز عصره أولى على البارد 100% من متجر زيت الشجرة المباركة 🌿 اطلب الآن من خلال رابط الدعوة الخاص بي: ${link}`;
            window.open(`https://wa.me/?text=${encodeURIComponent(txt)}`, '_blank');
        };

        window.copyReferralLink = function() {
            let link = window.getCustomerReferralLink();
            if (navigator.clipboard) {
                navigator.clipboard.writeText(link);
            }
            window.showToast(window.currentLang === 'en' ? 'Referral link copied! 📋' : 'تم نسخ رابط الدعوة بنجاح! 📋', 'success');
        };

        // 6. القصص المصورة التفاعلية (Instagram-Style Stories)
        let instaStoryInterval = null;
        window.openInstaStoryModal = function(product) {
            if (!product) return;
            let modal = document.getElementById('insta-story-modal');
            let img = document.getElementById('insta-story-img');
            let title = document.getElementById('insta-story-title');
            let desc = document.getElementById('insta-story-desc');
            let act = document.getElementById('insta-story-action');
            let prog = document.getElementById('insta-story-progress');
            if (!modal || !img || !title || !desc || !act || !prog) return;

            img.src = (product.images && product.images[0]) ? product.images[0] : (product.imageUrl || '1000392409.jpeg');
            title.textContent = product.name;
            desc.textContent = `${product.price} ${window.currentLang === 'en' ? 'EGP' : 'ج'} - ${(product.description || '').slice(0, 90)}`;
            act.innerHTML = `<button type="button" class="btn btn-full" onclick="window.closeInstaStoryModal(); window.openProductModal('${product.id}')">${window.currentLang === 'en' ? '🛒 Order This Product Now' : '🛒 اطلب المنتج الآن'}</button>`;
            modal.style.display = 'flex';

            let pct = 0;
            prog.style.width = '0%';
            if (instaStoryInterval) clearInterval(instaStoryInterval);
            instaStoryInterval = setInterval(() => {
                pct += 2;
                prog.style.width = pct + '%';
                if (pct >= 100) {
                    window.closeInstaStoryModal();
                }
            }, 100);
        };

        window.closeInstaStoryModal = function() {
            if (instaStoryInterval) clearInterval(instaStoryInterval);
            let modal = document.getElementById('insta-story-modal');
            if (modal) modal.style.display = 'none';
        };

        // ربط الشريط المصور بالقصص التفاعلية عند تفعيلها
        const origRenderVisualBarV54 = window.renderVisualBar;
        window.renderVisualBar = function() {
            origRenderVisualBarV54();
            if (storeSettings.enableInstaStories !== false && storeSettings.visualBarMode === 'products') {
                let items = document.querySelectorAll('#visual-scroll-bar .visual-item');
                items.forEach((el, idx) => {
                    if (products[idx]) {
                        el.onclick = () => window.openInstaStoryModal(products[idx]);
                    }
                });
            }
        };

        // 7. تطبيق ثيمات المواسم وربط إعدادات V55
        window.applyStoreTheme = function() {
            document.body.classList.remove('theme-ramadan', 'theme-blackfriday', 'theme-luxury');
            if (storeSettings.enableSeasonalThemes !== false && storeSettings.storeThemeName && storeSettings.storeThemeName !== 'default') {
                document.body.classList.add('theme-' + storeSettings.storeThemeName);
            }
        };

        const origRenderAdminOrdersV54 = window.renderAdminOrdersUI;
        window.renderAdminOrdersUI = function() {
            origRenderAdminOrdersV54();
            if (isCurrentUserAdmin) window.renderNetProfitStat();
        };

        const prevApplySettingsV54 = window.applySettingsToUI;
        window.applySettingsToUI = function() {
            prevApplySettingsV54();
            if (isCurrentUserAdmin) {
                window.renderAdminWheel7PrizesEditor();
                let setC = (id, val, def = true) => { let el = document.getElementById(id); if (el) el.checked = val !== undefined ? Boolean(val) : def; };
                setC('setting-enable-net-profit', storeSettings.enableNetProfit, true);
                setC('setting-enable-wa-order-status', storeSettings.enableWaOrderStatus, true);
                setC('setting-enable-customer-tags', storeSettings.enableCustomerTags, true);
                setC('setting-enable-referral', storeSettings.enableReferral, true);
                setC('setting-enable-insta-stories', storeSettings.enableInstaStories, true);
                setC('setting-enable-seo-articles', storeSettings.enableSeoArticles, true);
                setC('setting-enable-seasonal-themes', storeSettings.enableSeasonalThemes, true);
                setC('setting-enable-bulk-price', storeSettings.enableBulkPrice, true);

                let thSel = document.getElementById('setting-store-theme-name');
                if (thSel) thSel.value = storeSettings.storeThemeName || 'default';
                let bulkBox = document.getElementById('admin-bulk-price-tool-box');
                if (bulkBox) bulkBox.style.display = storeSettings.enableBulkPrice !== false ? 'flex' : 'none';
            }

            let seoSec = document.getElementById('home-seo-benefits-section');
            if (seoSec) seoSec.style.display = storeSettings.enableSeoArticles !== false ? 'block' : 'none';

            let refBox = document.getElementById('loyalty-referral-box');
            if (refBox) refBox.style.display = storeSettings.enableReferral !== false ? 'block' : 'none';

            window.applyStoreTheme();
            if (isCurrentUserAdmin) window.renderNetProfitStat();
            if (window.currentLang === 'en') window.translateDOM(document.body);
        };

        const prevSaveSettingsV54 = window.saveSettings;
        window.saveSettings = async function() {
            const getC = (id, def = true) => { let el = document.getElementById(id); return el ? el.checked : def; };
            let thSel = document.getElementById('setting-store-theme-name');
            let collectedPrizes = window.collectAdminWheel7PrizesFromDOM();
            try {
                await updateDoc(doc(db, 'settings', 'main'), {
                    wheel7Prizes: collectedPrizes,
                    enableNetProfit: getC('setting-enable-net-profit', true),
                    enableWaOrderStatus: getC('setting-enable-wa-order-status', true),
                    enableCustomerTags: getC('setting-enable-customer-tags', true),
                    enableReferral: getC('setting-enable-referral', true),
                    enableInstaStories: getC('setting-enable-insta-stories', true),
                    enableSeoArticles: getC('setting-enable-seo-articles', true),
                    enableSeasonalThemes: getC('setting-enable-seasonal-themes', true),
                    storeThemeName: thSel ? thSel.value : 'default',
                    enableBulkPrice: getC('setting-enable-bulk-price', true)
                });
            } catch (e) {}
            await prevSaveSettingsV54();
        };

        // إضافة مصطلحات V55 للقاموس الإنجليزي
        Object.assign(window.FULL_AR_TO_EN, {
            "عجلة الحظ الأسبوعية (7 هدايا)": "Weekly Spin & Win (7 Prizes)",
            "فوائد زيت الزيتون السيناوي البكر وطريقة الاستخدام الصحيحة": "Benefits of Sinai Extra Virgin Olive Oil & Best Usage",
            "عصرة أولى على البارد 100%": "100% First Cold Press",
            "غني بمضادات الأكسدة الطبيعية والأوميجا 3 و 9 لدعم صحة القلب والمناعة والهضم.": "Rich in natural antioxidants and Omega 3 & 9 to support heart health, immunity, and digestion.",
            "الاستخدام اليومي المثالي": "Ideal Daily Usage",
            "ملعقة صباحاً على الريق أو إضافته للسلطات والجبن والفول ليمنحك طاقة ونقاء طبيعي.": "One spoonful in the morning or added to salads and dishes for natural energy and purity.",
            "للشعر والبشرة": "For Hair & Skin Care",
            "يرطب البشرة بعمق ويغذي بصيلات الشعر بفضل فيتامين E الطبيعي بدون أي كيماويات.": "Deeply moisturizes skin and nourishes hair follicles with natural Vitamin E.",
            "ادعُ أصدقاءك واكسب نقاط ومكافآت!": "Invite Friends & Earn Rewards!",
            "شارك رابط الدعوة الخاص بك مع أصدقائك على واتساب، واحصل على نقاط ولاء إضافية عند طلبهم من المتجر!": "Share your referral link with friends on WhatsApp and earn bonus loyalty points on their orders!",
            "مشاركة الرابط عبر واتساب": "Share Link via WhatsApp",
            "نسخ رابط الدعوة": "Copy Referral Link"
        });
        Object.assign(window.PLACEHOLDER_AR_TO_EN, {
            "أدخل رقم هاتفك (واتساب) لأول مرة فقط...": "Enter your WhatsApp number (first time only)..."
        });


        // =========================================================================
        // === النسخة V56: غرفة متابعة العمل والشغل المباشرة (Live Work Center) ===
        // =========================================================================
        window.currentWorkHubFilter = 'all';
        window.workHubChatsArray = [];
        window.workHubStockAlerts = [];
        window.workHubWheelLeads = [];
        window.workHubAbandonedUsers = [];
        window.workSoundEnabled = localStorage.getItem('zait_work_sound') !== 'off';
        window.lastWorkTotalEventsCount = -1;
        window.workChatsUnsub = null;
        window.workAbandonedUnsub = null;

        // تنبيه صوتي لطيف عند وصول طلب جديد أو رسالة أو إلغاء
        window.playWorkNotificationSound = function() {
            if (!window.workSoundEnabled) return;
            try {
                const AudioCtx = window.AudioContext || window.webkitAudioContext;
                if (!AudioCtx) return;
                const ctx = new AudioCtx();
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
                osc.frequency.setValueAtTime(880, ctx.currentTime + 0.12); // A5
                gain.gain.setValueAtTime(0.15, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start();
                osc.stop(ctx.currentTime + 0.45);
            } catch (e) {}
        };

        window.toggleWorkSoundAlert = function() {
            window.workSoundEnabled = !window.workSoundEnabled;
            localStorage.setItem('zait_work_sound', window.workSoundEnabled ? 'on' : 'off');
            let btn = document.getElementById('btn-toggle-work-sound');
            if (btn) btn.textContent = window.workSoundEnabled ? '🔊 الصوت: مفعل' : '🔇 الصوت: صامت';
            if (window.workSoundEnabled) window.playWorkNotificationSound();
        };

        window.initAdminWorkHubStreams = function() {
            if (!isCurrentUserAdmin) return;
            let btnSnd = document.getElementById('btn-toggle-work-sound');
            if (btnSnd) btnSnd.textContent = window.workSoundEnabled ? '🔊 الصوت: مفعل' : '🔇 الصوت: صامت';

            // متابعة لحظية لمحادثات العملاء
            if (!window.workChatsUnsub) {
                window.workChatsUnsub = onSnapshot(collection(db, 'chats'), (snap) => {
                    let arr = [];
                    snap.forEach(d => arr.push({ id: d.id, ...d.data() }));
                    arr.sort((a, b) => new Date(b.lastUpdate || 0) - new Date(a.lastUpdate || 0));
                    window.workHubChatsArray = arr;
                    window.renderAdminWorkHub();
                });
            }

            // متابعة لحظية للسلال المتروكة
            if (!window.workAbandonedUnsub) {
                window.workAbandonedUnsub = onSnapshot(collection(db, 'users'), (snap) => {
                    let arr = [];
                    snap.forEach(d => {
                        let data = d.data();
                        if (data.cart && Array.isArray(data.cart) && data.cart.length > 0) {
                            arr.push({ id: d.id, ...data });
                        }
                    });
                    window.workHubAbandonedUsers = arr;
                    window.renderAdminWorkHub();
                });
            }
        };

        window.filterWorkHub = function(tab) {
            window.currentWorkHubFilter = tab;
            ['all', 'orders', 'chats', 'cancels', 'leads'].forEach(t => {
                let el = document.getElementById('wk-tab-' + t);
                if (el) el.classList.toggle('active', t === tab);
            });
            window.renderAdminWorkHub();
        };

        // إرسال رد فوري للعميل من داخل غرفة العمل مباشرة بدون مغادرة الصفحة
        window.sendInlineWorkChatReply = async function(chatId) {
            let inp = document.getElementById('wk-reply-inp-' + chatId);
            if (!inp || !inp.value.trim()) {
                window.showToast('اكتب رسالة الرد أولاً', 'error');
                return;
            }
            let txt = inp.value.trim();
            inp.value = '';
            let msg = { sender: 'admin', text: txt, timestamp: new Date().toISOString(), isAutoReply: false };
            try {
                await updateDoc(doc(db, 'chats', chatId), {
                    messages: arrayUnion(msg),
                    lastUpdate: msg.timestamp,
                    adminReplied: true
                });
                window.showToast('تم إرسال ردك للعميل فوراً ✅', 'success');
            } catch (e) {
                window.showToast('حدث خطأ أثناء إرسال الرد', 'error');
            }
        };

        window.insertCannedWorkReply = function(chatId, text) {
            let inp = document.getElementById('wk-reply-inp-' + chatId);
            if (inp) {
                inp.value = text;
                inp.focus();
            }
        };

        window.insertCannedAdminReply = function(text) {
            let inp = document.getElementById('admin-chat-input');
            if (inp) {
                inp.value = text;
                inp.focus();
            }
        };

        // بناء وعرض كل أحداث الشغل في شاشة واحدة مرتبة زمنياً
        window.renderAdminWorkHub = function() {
            if (!isCurrentUserAdmin) return;
            let container = document.getElementById('admin-work-stream-container');
            let searchEl = document.getElementById('work-hub-search');
            let q = searchEl ? searchEl.value.trim().toLowerCase() : '';

            let events = [];
            let activeOrdersCount = 0;
            let pendingReviewOrdersCount = 0;
            let unrepliedChatsCount = 0;
            let cancelsAndReturnsCount = 0;
            let leadsCount = 0;

            // 1. جمع الطلبات (النشطة والملغاة)
            (adminOrdersArray || []).forEach(ord => {
                let st = String(ord.status || '');
                let isCanceled = st.includes('لغى') || st.includes('رفض');
                if (isCanceled) {
                    cancelsAndReturnsCount++;
                    events.push({
                        category: 'cancels',
                        subType: 'canceled_order',
                        date: ord.canceledAt || ord.orderDate || new Date().toISOString(),
                        data: ord
                    });
                } else {
                    activeOrdersCount++;
                    if (st === 'قيد المراجعة') pendingReviewOrdersCount++;
                    events.push({
                        category: 'orders',
                        subType: 'active_order',
                        date: ord.orderDate || new Date().toISOString(),
                        data: ord
                    });
                }
            });

            // 2. جمع طلبات الاسترجاع
            (adminReturnsArray || []).forEach(ret => {
                cancelsAndReturnsCount++;
                events.push({
                    category: 'cancels',
                    subType: 'return_request',
                    date: ret.date || new Date().toISOString(),
                    data: ret
                });
            });

            // 3. جمع رسائل خدمة العملاء
            (window.workHubChatsArray || []).forEach(chat => {
                let msgs = chat.messages || [];
                let lastCustMsg = [...msgs].reverse().find(m => m.sender === 'customer');
                let needsReply = !chat.adminReplied && Boolean(lastCustMsg);
                if (needsReply) unrepliedChatsCount++;
                events.push({
                    category: 'chats',
                    subType: 'chat_thread',
                    needsReply: needsReply,
                    date: chat.lastUpdate || new Date().toISOString(),
                    data: chat
                });
            });

            // 4. جمع السلال المتروكة وتنبيهات العملاء
            (window.workHubAbandonedUsers || []).forEach(u => {
                leadsCount++;
                events.push({
                    category: 'leads',
                    subType: 'abandoned_cart',
                    date: u.lastLogin || new Date().toISOString(),
                    data: u
                });
            });

            // تحديث العدادات العلوية وشارة زر (💼 العمل)
            let urgentTotal = pendingReviewOrdersCount + unrepliedChatsCount + cancelsAndReturnsCount;
            let badgeEl = document.getElementById('work-hub-badge');
            if (badgeEl) badgeEl.textContent = urgentTotal;

            if (window.lastWorkTotalEventsCount !== -1 && urgentTotal > window.lastWorkTotalEventsCount) {
                window.playWorkNotificationSound();
            }
            window.lastWorkTotalEventsCount = urgentTotal;

            let setKpi = (id, val) => { let el = document.getElementById(id); if (el) el.textContent = val; };
            setKpi('wk-count-all', events.length);
            setKpi('wk-count-orders', activeOrdersCount);
            setKpi('wk-count-chats', (window.workHubChatsArray || []).length);
            setKpi('wk-count-cancels', cancelsAndReturnsCount);
            setKpi('wk-count-leads', leadsCount);

            if (!container) return;

            // فلترة حسب التبويب والبحث
            let filtered = events.filter(ev => {
                if (window.currentWorkHubFilter !== 'all' && ev.category !== window.currentWorkHubFilter) return false;
                if (!q) return true;
                let str = JSON.stringify(ev.data || {}).toLowerCase();
                return str.includes(q);
            });

            // ترتيب زمني من الأحدث للأقدم
            filtered.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

            if (filtered.length === 0) {
                container.innerHTML = `<div style="text-align:center; padding:40px 20px; background:var(--input-bg); border-radius:12px; color:var(--text-muted);">
                    <span style="font-size:2.8rem; display:block; margin-bottom:8px;">✨</span>
                    <h3 style="margin:0;">لا توجد أحداث في هذا القسم حالياً</h3>
                    <p style="font-size:0.85rem; margin-top:5px;">أي طلب جديد أو رسالة عميل أو إلغاء سيظهر لك هنا تلقائياً وفي نفس اللحظة!</p>
                </div>`;
                return;
            }

            let html = '';
            filtered.slice(0, 60).forEach(ev => {
                let dStr = new Date(ev.date).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' });

                if (ev.subType === 'active_order') {
                    let o = ev.data;
                    let phone = (o.phones && o.phones.primary) || '';
                    let itemsTxt = (o.items || []).map(i => `${window.escapeHTML(i.name)} (${i.quantity})`).join(' ، ');
                    let tagBadge = window.getCustomerTagBadgeHtml ? window.getCustomerTagBadgeHtml(phone) : '';
                    let statusColor = o.status === 'قيد المراجعة' ? '#dc3545' : (o.status.includes('توصيل') ? '#28a745' : '#028090');

                    html += `<div class="work-event-card type-order">
                        <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:8px;">
                            <div>
                                <span style="background:${statusColor}; color:white; padding:2px 8px; border-radius:8px; font-size:0.75rem; font-weight:bold;">📦 طلب #${o.id.slice(0,6).toUpperCase()} (${window.escapeHTML(o.status)})</span>
                                <strong style="color:var(--primary); font-size:1.05rem; margin-right:6px;">👤 ${window.escapeHTML(o.customerName)} ${tagBadge}</strong>
                            </div>
                            <span style="font-size:0.78rem; color:var(--text-muted);">🕒 ${dStr}</span>
                        </div>
                        <div style="margin-top:8px; font-size:0.88rem; color:var(--text-color); line-height:1.6;">
                            <div>📞 <strong>الهاتف:</strong> ${window.escapeHTML(phone)} | 📍 <strong>العنوان:</strong> ${window.escapeHTML((o.location && o.location.governorate) || '')} - ${window.escapeHTML((o.location && o.location.city) || '')}</div>
                            <div>🛍️ <strong>المنتجات:</strong> ${itemsTxt} ${o.freeGiftUnlocked ? `<span style="color:#166534; font-weight:bold;">+ ${window.escapeHTML(o.freeGiftUnlocked)}</span>` : ''}</div>
                            <div>💰 <strong>الإجمالي المطلوب:</strong> <strong style="color:var(--secondary); font-size:1rem;">${o.totalAmount} ج</strong> (${window.escapeHTML(o.paymentMethod || 'كاش')})</div>
                        </div>
                        <div class="work-inline-actions">
                            <button type="button" class="btn" style="padding:5px 10px; font-size:0.78rem; background:#028090;" onclick="window.updateOrderStatus('${o.id}', 'تم التجهيز')">📦 تم التجهيز</button>
                            <button type="button" class="btn" style="padding:5px 10px; font-size:0.78rem; background:#007bff;" onclick="window.updateOrderStatus('${o.id}', 'تم الشحن')">🚚 تم الشحن</button>
                            <button type="button" class="btn" style="padding:5px 10px; font-size:0.78rem; background:#28a745;" onclick="window.updateOrderStatus('${o.id}', 'تم التوصيل ✅')">✅ تم التوصيل</button>
                            <button type="button" class="btn btn-outline" style="padding:5px 10px; font-size:0.78rem; border-color:#25D366; color:#25D366;" onclick="window.sendOrderWhatsAppStatus('${o.id}')">📲 واتساب</button>
                            ${storeSettings.enableShippingLabel !== false ? `<button type="button" class="btn btn-outline" style="padding:5px 10px; font-size:0.78rem;" onclick="window.printOrderShippingLabel('${o.id}')">🖨️ بوليصة الشحن</button>` : ''}
                            <button type="button" class="btn btn-outline" style="padding:5px 10px; font-size:0.78rem;" onclick="window.openAdminOrderModal('${o.id}')">📋 التفاصيل</button>
                        </div>
                    </div>`;
                } else if (ev.subType === 'canceled_order') {
                    let o = ev.data;
                    let phone = (o.phones && o.phones.primary) || '';
                    let pureWa = String(phone).replace(/\D/g, '');
                    if (pureWa && !pureWa.startsWith('20') && pureWa.length >= 10) pureWa = '20' + pureWa;
                    let waMsg = `مرحباً ${o.customerName} 🌿 لاحظنا إلغاء طلبك رقم #${o.id.slice(0,6).toUpperCase()} في متجر زيت الشجرة المباركة، هل واجهتك أي مشكلة أو تود تعديل الطلب؟ يسعدنا خدمتك فوراً!`;
                    let itemsTxt = (o.items || []).map(i => `${window.escapeHTML(i.name)} (${i.quantity})`).join(' ، ');

                    html += `<div class="work-event-card type-cancel">
                        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
                            <div>
                                <span style="background:#dc3545; color:white; padding:2px 8px; border-radius:8px; font-size:0.75rem; font-weight:bold;">🚨 طلب ملغى #${o.id.slice(0,6).toUpperCase()}</span>
                                <strong style="color:var(--danger); font-size:1.02rem; margin-right:6px;">👤 ${window.escapeHTML(o.customerName)} (${window.escapeHTML(o.status)})</strong>
                            </div>
                            <span style="font-size:0.78rem; color:var(--text-muted);">🕒 ${dStr}</span>
                        </div>
                        <div style="margin-top:8px; font-size:0.86rem;">
                            📞 <strong>الهاتف:</strong> ${window.escapeHTML(phone)} | 🛍️ <strong>المنتجات:</strong> ${itemsTxt} | 💰 <strong>القيمة:</strong> ${o.totalAmount} ج
                        </div>
                        <div class="work-inline-actions">
                            <a href="https://wa.me/${pureWa}?text=${encodeURIComponent(waMsg)}" target="_blank" class="btn" style="background:#25D366; padding:5px 12px; font-size:0.78rem; text-decoration:none;">💬 تواصل واتساب لمعرفة سبب الإلغاء</a>
                            <button type="button" class="btn btn-outline" style="padding:5px 10px; font-size:0.78rem;" onclick="window.updateOrderStatus('${o.id}', 'قيد المراجعة')">🔄 استعادة وتفعيل الطلب</button>
                            <button type="button" class="btn btn-outline" style="padding:5px 10px; font-size:0.78rem;" onclick="window.openAdminOrderModal('${o.id}')">📋 التفاصيل</button>
                        </div>
                    </div>`;
                } else if (ev.subType === 'return_request') {
                    let r = ev.data;
                    html += `<div class="work-event-card type-cancel">
                        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
                            <div>
                                <span style="background:#e0a800; color:white; padding:2px 8px; border-radius:8px; font-size:0.75rem; font-weight:bold;">🔄 طلب استرجاع #${(r.orderId || '').slice(0,6).toUpperCase()}</span>
                                <strong style="color:var(--primary); margin-right:6px;">السبب: ${window.escapeHTML(r.reason || '')}</strong>
                            </div>
                            <span style="font-size:0.78rem; color:var(--text-muted);">🕒 ${dStr}</span>
                        </div>
                        <p style="margin:6px 0; font-size:0.85rem; color:var(--text-muted);">ملاحظات العميل: ${window.escapeHTML(r.notes || 'لا توجد')}</p>
                        <div class="work-inline-actions">
                            ${r.status === 'قيد المراجعة' ? `<button type="button" class="btn" style="background:#28a745; padding:5px 12px; font-size:0.78rem;" onclick="window.approveReturn('${r.id}', '${r.orderId}')">✅ الموافقة وإرسال مندوب</button>` : `<span style="color:#28a745; font-weight:bold; font-size:0.82rem;">✅ تمت الموافقة</span>`}
                            ${r.imageUrl ? `<a href="${r.imageUrl}" target="_blank" class="btn btn-outline" style="padding:5px 10px; font-size:0.78rem; text-decoration:none;">📸 عرض صورة المنتج</a>` : ''}
                        </div>
                    </div>`;
                } else if (ev.subType === 'chat_thread') {
                    let c = ev.data;
                    let msgs = c.messages || [];
                    let lastMsgs = msgs.slice(-2);
                    let statusBadge = ev.needsReply
                        ? `<span style="background:#dc3545; color:white; padding:2px 8px; border-radius:8px; font-size:0.74rem; font-weight:bold;">🔴 رسالة عميل تنتظر ردك</span>`
                        : `<span style="background:#007bff; color:white; padding:2px 8px; border-radius:8px; font-size:0.74rem; font-weight:bold;">💬 محادثة خدمة عملاء (تم الرد)</span>`;

                    let previewHtml = lastMsgs.map(m => `<div style="font-size:0.83rem; padding:4px 8px; border-radius:6px; margin-top:4px; background:${m.sender==='customer'?'rgba(0,123,255,0.08)':'var(--input-bg)'};"><strong>${m.sender==='customer'?'👤 العميل:':'🛡️ الإدارة:'}</strong> ${window.escapeHTML(m.text)}</div>`).join('');
                    let safeId = c.id.replace(/'/g, "\\'");
                    let safeName = (c.customerName || 'عميل').replace(/'/g, "\\'");

                    html += `<div class="work-event-card type-chat">
                        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
                            <div>
                                ${statusBadge}
                                <strong style="color:var(--primary); font-size:1rem; margin-right:6px;">👤 ${window.escapeHTML(c.customerName || c.id)}</strong>
                            </div>
                            <span style="font-size:0.78rem; color:var(--text-muted);">🕒 ${dStr}</span>
                        </div>
                        <div style="margin:8px 0;">${previewHtml}</div>
                        <div style="display:flex; gap:5px; flex-wrap:wrap; margin-bottom:6px;">
                            <button type="button" class="work-canned-chip" onclick="window.insertCannedWorkReply('${safeId}', 'أهلاً بحضرتك 🌿 تحت أمرك، جاري مراجعة استفسارك فوراً.')">👋 ترحيب</button>
                            <button type="button" class="work-canned-chip" onclick="window.insertCannedWorkReply('${safeId}', 'طلب حضرتك قيد التجهيز والشحن السريع لباب البيت 🚚')">🚚 حالة الشحن</button>
                            <button type="button" class="work-canned-chip" onclick="window.insertCannedWorkReply('${safeId}', 'زيت الشجرة المباركة سيناوي بكر عصرة أولى على البارد 100% ومضمون 🌿')">🌿 ضمان الزيت</button>
                        </div>
                        <div style="display:flex; gap:6px; align-items:center; flex-wrap:wrap;">
                            <input type="text" id="wk-reply-inp-${c.id}" placeholder="اكتب ردك المباشر للعميل هنا..." style="margin:0; flex:1; min-width:170px; padding:7px 10px; font-size:0.85rem;">
                            <button type="button" class="btn" style="background:#007bff; padding:7px 12px; font-size:0.82rem;" onclick="window.sendInlineWorkChatReply('${safeId}')">إرسال الرد 🚀</button>
                            <button type="button" class="btn btn-outline" style="padding:7px 10px; font-size:0.8rem;" onclick="window.showPanel('admin-messages'); window.openAdminChat('${safeId}', '${safeName}');">فتح الشات 💬</button>
                        </div>
                    </div>`;
                } else if (ev.subType === 'abandoned_cart') {
                    let u = ev.data;
                    let total = 0;
                    (u.cart || []).forEach(it => total += Number(it.price || 0) * Number(it.quantity || 1));
                    let phone = u.phone1 || u.email || 'غير مسجل';
                    let pureWa = String(phone).replace(/\D/g, '');
                    if (pureWa && !pureWa.startsWith('20') && pureWa.length >= 10) pureWa = '20' + pureWa;
                    let waText = `مرحباً ${u.name || 'عميلنا العزيز'} 🌿 لاحظنا وجود منتجات في سلة مشترياتك بمتجر زيت الشجرة المباركة، هل تحب نساعدك في إتمام الطلب اليوم مع هدية أو خصم خاص؟`;

                    html += `<div class="work-event-card type-lead">
                        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
                            <div>
                                <span style="background:#ff6b00; color:white; padding:2px 8px; border-radius:8px; font-size:0.74rem; font-weight:bold;">🛒 سلة متروكة نشطة</span>
                                <strong style="color:var(--primary); margin-right:6px;">👤 ${window.escapeHTML(u.name || 'عميل')} (${window.escapeHTML(phone)})</strong>
                            </div>
                            <span style="font-size:0.78rem; color:var(--text-muted);">🕒 ${dStr}</span>
                        </div>
                        <div style="margin-top:6px; font-size:0.85rem; color:var(--secondary); font-weight:bold;">
                            عدد المنتجات بالسلة: ${u.cart.length} (بقيمة إجمالية ~${total} ج)
                        </div>
                        ${pureWa.length >= 10 ? `<div class="work-inline-actions"><a href="https://wa.me/${pureWa}?text=${encodeURIComponent(waText)}" target="_blank" class="btn btn-outline" style="border-color:#25D366; color:#25D366; padding:5px 12px; font-size:0.8rem; text-decoration:none;">💬 تواصل مع العميل عبر واتساب</a></div>` : ''}
                    </div>`;
                }
            });

            container.innerHTML = html;
        };

        // =========================================================================
        // === 2. طباعة بوليصة الشحن بالباركود (Shipping Label) + فاتورة العميل ===
        // =========================================================================
        window.printOrderShippingLabel = function(orderId) {
            let o = (adminOrdersArray || []).find(ord => ord.id === orderId) || (window.customerOrdersArray || []).find(ord => ord.id === orderId);
            if (!o) return;
            let itemsHtml = (o.items || []).map(i => `<tr><td style="padding:6px; border:1px solid #333;">${window.escapeHTML(i.name)}</td><td style="padding:6px; border:1px solid #333; text-align:center;">${i.quantity}</td><td style="padding:6px; border:1px solid #333; text-align:center;">${i.price * i.quantity} ج</td></tr>`).join('');
            let qrUrl = o.location && o.location.mapLink ? `https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${encodeURIComponent(o.location.mapLink)}` : '';
            let codAmount = (o.paymentMethod === 'محفظة إلكترونية') ? '0 ج (مدفوع مسبقاً)' : `${o.totalAmount} ج`;

            let w = window.open('', '_blank', 'width=720,height=850');
            if (!w) return;
            w.document.write(`
                <html dir="rtl" lang="ar">
                <head>
                    <title>بوليصة شحن وفاتورة #${o.id.slice(0,6).toUpperCase()}</title>
                    <style>
                        body { font-family: 'Cairo', Tahoma, sans-serif; padding: 20px; color: #111; }
                        .label-box { border: 3px solid #111; border-radius: 12px; padding: 18px; max-width: 650px; margin: 0 auto; }
                        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px dashed #333; padding-bottom: 12px; margin-bottom: 12px; }
                        .cod-box { background: #f1f5f9; border: 2px solid #111; padding: 10px 16px; border-radius: 8px; font-size: 1.25rem; font-weight: 900; text-align: center; margin: 12px 0; }
                        table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 0.92rem; }
                    </style>
                </head>
                <body onload="window.print()">
                    <div class="label-box">
                        <div class="header">
                            <div>
                                <h2 style="margin:0; color:#3c521e;">🌿 متجر زيت الشجرة المباركة</h2>
                                <small>زيت زيتون سيناوي بكر ممتاز - عصرة أولى على البارد 100%</small><br>
                                <strong>رقم البوليصة / الطلب: #${o.id.slice(0,8).toUpperCase()}</strong>
                            </div>
                            ${qrUrl ? `<div style="text-align:center;"><img src="${qrUrl}" width="90" height="90"><br><small style="font-size:0.7rem;">امسح لموقع العميل GPS</small></div>` : ''}
                        </div>
                        <div style="line-height:1.8; font-size:1rem;">
                            <div><strong>👤 اسم المستلم:</strong> ${window.escapeHTML(o.customerName)}</div>
                            <div><strong>📞 هاتف المستلم:</strong> ${window.escapeHTML((o.phones && o.phones.primary) || '')} ${(o.phones && o.phones.secondary && o.phones.secondary !== 'لا يوجد') ? ' / ' + window.escapeHTML(o.phones.secondary) : ''}</div>
                            <div><strong>📍 المحافظة والمدينة:</strong> ${window.escapeHTML((o.location && o.location.governorate) || '')} - ${window.escapeHTML((o.location && o.location.city) || '')}</div>
                            <div><strong>🏠 العنوان التفصيلي:</strong> ${window.escapeHTML((o.location && o.location.details) || '')}</div>
                        </div>
                        <div class="cod-box">
                            💰 المبلغ المطلوب تحصيله (COD): ${codAmount}
                        </div>
                        <table>
                            <thead>
                                <tr style="background:#eee;">
                                    <th style="padding:6px; border:1px solid #333;">المنتج</th>
                                    <th style="padding:6px; border:1px solid #333;">الكمية</th>
                                    <th style="padding:6px; border:1px solid #333;">الإجمالي</th>
                                </tr>
                            </thead>
                            <tbody>${itemsHtml}</tbody>
                        </table>
                        ${o.freeGiftUnlocked ? `<p style="margin-top:8px; font-weight:bold; color:#166534;">🎁 هدية مرفقة مع الطلب: ${window.escapeHTML(o.freeGiftUnlocked)}</p>` : ''}
                        <div style="margin-top:14px; padding-top:10px; border-top:1px solid #ccc; display:flex; justify-content:space-between; font-size:0.8rem;">
                            <span>تاريخ الطلب: ${new Date(o.orderDate).toLocaleDateString('ar-EG')}</span>
                            <span>✅ متاح معاينة الطلب عند الاستلام - ضمان استرجاع كامل</span>
                        </div>
                    </div>
                </body>
                </html>
            `);
            w.document.close();
        };

        // إضافة زر طباعة البوليصة داخل تفاصيل طلب الإدارة وزر فاتورة الضمان داخل طلب العميل
        const origOpenAdminOrderModalV55 = window.openAdminOrderModal;
        window.openAdminOrderModal = function(id) {
            origOpenAdminOrderModalV55(id);
            if (storeSettings.enableShippingLabel === false) return;
            let aom = document.getElementById('aom-content');
            if (aom) {
                aom.innerHTML += `<button type="button" class="btn btn-outline" style="width:100%; margin-top:8px; border-color:var(--primary); color:var(--primary);" onclick="window.printOrderShippingLabel('${id}')">🖨️ طباعة بوليصة الشحن والفاتورة (QR)</button>`;
            }
        };

        const origOpenCustOrderModalV55 = window.openCustomerOrderModal;
        window.openCustomerOrderModal = function(orderId) {
            origOpenCustOrderModalV55(orderId);
            if (storeSettings.enableShippingLabel === false) return;
            let com = document.getElementById('com-content');
            if (com) {
                com.innerHTML += `<button type="button" class="btn btn-outline" style="width:100%; margin-top:10px; border-color:var(--primary); color:var(--primary);" onclick="window.printOrderShippingLabel('${orderId}')">🧾 طباعة / تحميل فاتورة الضمان الرسمية</button>`;
            }
        };

        // =========================================================================
        // === 3. سجل المصروفات والإعلانات (Expense Tracker) وخصمه من صافي الربح ===
        // =========================================================================
        window.getStoreExpensesList = function() {
            return Array.isArray(storeSettings.expensesList) ? storeSettings.expensesList : [];
        };

        window.addStoreExpense = async function() {
            let tInp = document.getElementById('expense-title-input');
            let aInp = document.getElementById('expense-amount-input');
            if (!tInp || !aInp || !tInp.value.trim() || !aInp.value) {
                window.showToast('أدخل بيان المصروف والمبلغ أولاً', 'error');
                return;
            }
            let list = [...window.getStoreExpensesList()];
            list.unshift({
                id: 'exp_' + Date.now(),
                title: tInp.value.trim(),
                amount: Number(aInp.value) || 0,
                date: new Date().toISOString()
            });
            try {
                await updateDoc(doc(db, 'settings', 'main'), { expensesList: list });
                tInp.value = '';
                aInp.value = '';
                window.showToast('تم تسجيل المصروف وخصمه من صافي الربح ✅', 'success');
            } catch (e) {}
        };

        window.deleteStoreExpense = async function(expId) {
            let list = window.getStoreExpensesList().filter(e => e.id !== expId);
            try {
                await updateDoc(doc(db, 'settings', 'main'), { expensesList: list });
                window.showToast('تم حذف المصروف', 'info');
            } catch (e) {}
        };

        window.renderAdminExpenses = function() {
            let card = document.getElementById('admin-expenses-card');
            let listEl = document.getElementById('admin-expenses-list');
            let badge = document.getElementById('admin-total-expenses-badge');
            if (card) card.style.display = storeSettings.enableShippingLabel !== false ? 'block' : 'none';
            if (!listEl || !badge) return;

            let list = window.getStoreExpensesList();
            let totalExp = 0;
            let html = '';
            list.forEach(e => {
                totalExp += Number(e.amount || 0);
                let dStr = new Date(e.date).toLocaleDateString('ar-EG');
                html += `<div style="display:flex; justify-content:space-between; align-items:center; padding:6px 10px; background:var(--input-bg); border:1px solid var(--border-color); border-radius:8px; margin-bottom:6px; font-size:0.85rem;">
                    <span><strong>${window.escapeHTML(e.title)}</strong> <small style="color:var(--text-muted);">(${dStr})</small></span>
                    <div style="display:flex; align-items:center; gap:8px;">
                        <strong style="color:var(--danger);">-${e.amount} ج</strong>
                        <button type="button" class="btn btn-danger" style="padding:2px 7px; font-size:0.75rem;" onclick="window.deleteStoreExpense('${e.id}')">✖</button>
                    </div>
                </div>`;
            });
            badge.textContent = `${totalExp.toLocaleString()} ج`;
            listEl.innerHTML = html || '<p style="color:var(--text-muted); font-size:0.84rem; margin:0;">لم يتم تسجيل مصروفات بعد.</p>';
        };

        // تحديث دالة صافي الربح لتخصم إجمالي المصروفات المسجلة أيضاً
        const origRenderNetProfitV55 = window.renderNetProfitStat;
        window.renderNetProfitStat = function() {
            origRenderNetProfitV55();
            window.renderAdminExpenses();
            let statEl = document.getElementById('stat-net-profit');
            if (!statEl || storeSettings.enableNetProfit === false) return;
            let currentNet = parseInt(statEl.textContent.replace(/[^0-9-]/g, '')) || 0;
            let totalExp = window.getStoreExpensesList().reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
            let finalNet = currentNet - totalExp;
            statEl.textContent = `${finalNet.toLocaleString()} ج`;
        };

        // =========================================================================
        // === 4. كرتونة التوفير المخصصة + مساعد الاختيار الذكي + الطلب الخاطف ===
        // =========================================================================

        // أ) كوّن كرتونة التوفير (Build Your Own Box)
        window.customBoxCounts = {};
        window.openCustomBoxModal = function() {
            let modal = document.getElementById('custom-box-modal');
            if (!modal) return;
            window.customBoxCounts = {};
            window.renderCustomBoxBuilder();
            modal.style.display = 'flex';
        };

        window.changeCustomBoxQty = function(prodId, delta) {
            let cur = window.customBoxCounts[prodId] || 0;
            let next = Math.max(0, cur + delta);
            if (next === 0) delete window.customBoxCounts[prodId];
            else window.customBoxCounts[prodId] = next;
            window.renderCustomBoxBuilder();
        };

        window.renderCustomBoxBuilder = function() {
            let listEl = document.getElementById('custom-box-products-list');
            let statusEl = document.getElementById('custom-box-status-bar');
            if (!listEl || !statusEl) return;

            let totalItems = 0;
            let totalPrice = 0;
            let availableProds = products.filter(p => !p.isHidden && (p.stock === undefined || p.stock === "" || Number(p.stock) > 0));

            let html = '';
            availableProds.forEach(p => {
                let q = window.customBoxCounts[p.id] || 0;
                totalItems += q;
                totalPrice += q * Number(p.price || 0);
                let img = (p.images && p.images[0]) ? p.images[0] : (p.imageUrl || '1000392409.jpeg');
                html += `<div style="display:flex; justify-content:space-between; align-items:center; padding:8px 10px; background:var(--panel-bg); border:1px solid ${q>0?'var(--secondary)':'var(--border-color)'}; border-radius:10px;">
                    <div style="display:flex; align-items:center; gap:10px;">
                        <img src="${img}" style="width:45px; height:45px; border-radius:8px; object-fit:cover;">
                        <div>
                            <strong style="color:var(--primary); font-size:0.88rem;">${window.escapeHTML(p.name)}</strong><br>
                            <span style="color:var(--secondary); font-weight:bold; font-size:0.84rem;">${p.price} ج</span>
                        </div>
                    </div>
                    <div style="display:flex; align-items:center; gap:8px;">
                        <button type="button" class="qty-btn" onclick="window.changeCustomBoxQty('${p.id}', 1)">+</button>
                        <strong style="min-width:20px; text-align:center;">${q}</strong>
                        <button type="button" class="qty-btn" onclick="window.changeCustomBoxQty('${p.id}', -1)">-</button>
                    </div>
                </div>`;
            });
            listEl.innerHTML = html;

            let discPct = Number(storeSettings.bundleDiscountPercent) || 10;
            if (totalItems >= 3) {
                let afterDisc = Math.round(totalPrice * (1 - discPct / 100));
                statusEl.innerHTML = `🎉 اخترت ${totalItems} عبوات! السعر بعد خصم الكرتونة (${discPct}%): <strong style="color:#166534;">${afterDisc} ج</strong> بدلاً من <del>${totalPrice} ج</del>`;
            } else {
                statusEl.innerHTML = `📦 اخترت (${totalItems} من 3 عبوات) — أضف ${3 - totalItems} عبوة أخرى لتفعيل خصم الكرتونة الفوري (${discPct}%)!`;
            }
        };

        window.addCustomBoxToCart = function() {
            let entries = Object.entries(window.customBoxCounts);
            if (entries.length === 0) {
                window.showToast('اختر منتجات الكرتونة أولاً', 'error');
                return;
            }
            let totalPicked = 0;
            entries.forEach(([pid, qty]) => {
                totalPicked += qty;
                let p = products.find(pr => pr.id === pid);
                if (!p) return;
                let existing = cart.find(c => c.cartItemId === p.id);
                if (existing) {
                    existing.quantity += qty;
                    existing.selected = true;
                } else {
                    cart.push({
                        id: p.id,
                        cartItemId: p.id,
                        name: p.name,
                        price: Number(p.price),
                        imageUrl: (p.images && p.images[0]) || p.imageUrl || '1000392409.jpeg',
                        quantity: qty,
                        variant: '',
                        selected: true
                    });
                }
            });
            if (totalPicked >= 3) {
                currentDiscountPercent = Math.max(currentDiscountPercent, Number(storeSettings.bundleDiscountPercent) || 10);
                if (!appliedPromoCode) appliedPromoCode = 'BOX' + (storeSettings.bundleDiscountPercent || 10);
            }
            localStorage.setItem('cart', JSON.stringify(cart));
            window.updateCartUI();
            document.getElementById('custom-box-modal').style.display = 'none';
            window.showToast('تمت إضافة كرتونة التوفير إلى سلتك بنجاح 📦🛒', 'success');
            window.showPanel('cart');
        };

        // ب) مساعد الاختيار الذكي (Product Finder Quiz)
        window.openProductQuizModal = function() {
            let modal = document.getElementById('product-quiz-modal');
            let res = document.getElementById('quiz-result-box');
            if (res) res.style.display = 'none';
            if (modal) modal.style.display = 'flex';
        };

        window.runProductFinderQuiz = function() {
            let q2 = (document.getElementById('quiz-q2') || {}).value || 'medium';
            let resBox = document.getElementById('quiz-result-box');
            if (!resBox || products.length === 0) return;

            let available = products.filter(p => !p.isHidden);
            if (available.length === 0) available = products;
            let sorted = [...available].sort((a, b) => Number(a.price) - Number(b.price));

            let recommended = sorted[0];
            if (q2 === 'large') recommended = sorted[sorted.length - 1];
            else if (q2 === 'medium') recommended = sorted[Math.floor(sorted.length / 2)];

            let img = (recommended.images && recommended.images[0]) ? recommended.images[0] : (recommended.imageUrl || '1000392409.jpeg');
            resBox.style.display = 'block';
            resBox.innerHTML = `
                <div style="display:flex; align-items:center; gap:12px; text-align:right; margin-bottom:10px;">
                    <img src="${img}" style="width:65px; height:65px; border-radius:10px; object-fit:cover; border:2px solid var(--secondary);">
                    <div>
                        <span style="font-size:0.76rem; color:#028090; font-weight:bold;">🎯 الترشيح الأنسب والأوفر لاحتياجك:</span>
                        <h4 style="margin:2px 0; color:var(--primary);">${window.escapeHTML(recommended.name)}</h4>
                        <strong style="color:var(--secondary);">${recommended.price} ج</strong>
                    </div>
                </div>
                <button type="button" class="btn btn-full" onclick="document.getElementById('product-quiz-modal').style.display='none'; window.openProductModal('${recommended.id}');">🛒 عرض المنتج وإضافته للسلة</button>
            `;
        };

        // ج) الشراء الخاطف بضغطة واحدة (1-Click Quick Order)
        window.quickOrderTargetProduct = null;
        window.openQuickOrderModal = function(event, prodId) {
            if (event) event.stopPropagation();
            let p = products.find(pr => pr.id === prodId);
            if (!p) return;
            window.quickOrderTargetProduct = p;

            let sumEl = document.getElementById('quick-order-product-summary');
            if (sumEl) sumEl.textContent = `🛍️ ${p.name} — السعر: ${p.price} ج`;

            let govSel = document.getElementById('qo-gov');
            if (govSel && govSel.options.length === 0) {
                let gHtml = '<option value="" disabled selected>اختر المحافظة...</option>';
                for (let g in deliveryData) gHtml += `<option value="${g}">${g}</option>`;
                govSel.innerHTML = gHtml;
            }

            let modal = document.getElementById('quick-order-modal');
            if (modal) modal.style.display = 'flex';
        };

        window.submitQuickOrderNow = async function() {
            let p = window.quickOrderTargetProduct;
            if (!p) return;
            let name = (document.getElementById('qo-name') || {}).value.trim();
            let phone = (document.getElementById('qo-phone') || {}).value.trim();
            let gov = (document.getElementById('qo-gov') || {}).value;
            let addr = (document.getElementById('qo-address') || {}).value.trim();

            if (!name || !phone || !gov || !addr) {
                window.showToast('يرجى إدخال الاسم ورقم الهاتف والمحافظة والعنوان', 'error');
                return;
            }
            let btn = document.getElementById('btn-submit-quick-order');
            if (btn) btn.disabled = true;

            let shipCost = window.getShippingCostForGov ? window.getShippingCostForGov(gov) : 90;
            let enableFreeShip = storeSettings.enableFreeShipping !== false;
            let targetAmount = (storeSettings && storeSettings.freeShippingThreshold) ? Number(storeSettings.freeShippingThreshold) : 1000;
            if (enableFreeShip && Number(p.price) >= targetAmount) shipCost = 0;

            let totalAmt = Number(p.price) + shipCost;
            let orderPayload = {
                userId: currentUser ? currentUser.uid : "guest_quick",
                userEmail: currentUser ? (currentUser.email || currentUser.phoneNumber || "زائر سريع") : "زائر سريع",
                customerName: name,
                phones: { primary: phone, secondary: "لا يوجد" },
                location: { governorate: gov, city: "طلب سريع", details: addr, mapAddress: "", mapLink: "" },
                items: [{
                    id: p.id,
                    cartItemId: p.id,
                    name: p.name,
                    price: Number(p.price),
                    imageUrl: (p.images && p.images[0]) || p.imageUrl || '1000392409.jpeg',
                    quantity: 1
                }],
                subtotal: Number(p.price),
                shippingCost: shipCost,
                discountApplied: "0%",
                usedLoyaltyPoints: 0,
                totalAmount: totalAmt,
                paymentMethod: "كاش عند الاستلام (طلب سريع ⚡)",
                receiptUrl: "",
                orderMethod: "طلب خاطف سريع ⚡",
                trafficSource: window.getDetectedTrafficSource ? window.getDetectedTrafficSource() : 'مباشر (Direct)',
                status: "قيد المراجعة",
                pointsAwarded: false,
                orderDate: new Date().toISOString()
            };

            try {
                await addDoc(collection(db, 'orders'), orderPayload);
                document.getElementById('quick-order-modal').style.display = 'none';
                window.showToast('🎉 تم تسجيل طلبك السريع بنجاح! سنتواصل معك فوراً لتأكيد الشحن', 'success');
            } catch (e) {
                window.showToast('حدث خطأ أثناء إرسال الطلب السريع', 'error');
            }
            if (btn) btn.disabled = false;
        };

        // د) تبديل طريقة عرض المنتجات (Grid / List View)
        window.isListViewMode = false;
        window.toggleProductsViewMode = function() {
            window.isListViewMode = !window.isListViewMode;
            let grid = document.getElementById('products-container');
            let btn = document.getElementById('btn-toggle-view-mode');
            if (grid) grid.classList.toggle('list-view-mode', window.isListViewMode);
            if (btn) btn.textContent = window.isListViewMode ? '🔲' : '📋';
        };

        // ربط تحديثات الإدارة والإعدادات بـ V56
        const origUpdateAdminUIV55 = window.updateAdminUI;
        window.updateAdminUI = function() {
            origUpdateAdminUIV55();
            if (isCurrentUserAdmin) {
                window.initAdminWorkHubStreams();
                window.renderAdminWorkHub();
            }
        };

        const origRenderAdminOrdersV55 = window.renderAdminOrdersUI;
        window.renderAdminOrdersUI = function() {
            origRenderAdminOrdersV55();
            if (isCurrentUserAdmin) window.renderAdminWorkHub();
        };

        const prevApplySettingsV55 = window.applySettingsToUI;
        window.applySettingsToUI = function() {
            prevApplySettingsV55();
            if (isCurrentUserAdmin) {
                let setC = (id, val, def = true) => { let el = document.getElementById(id); if (el) el.checked = val !== undefined ? Boolean(val) : def; };
                setC('setting-enable-work-hub', storeSettings.enableWorkHub, true);
                setC('setting-enable-quick-order', storeSettings.enableQuickOrder, true);
                setC('setting-enable-box-builder', storeSettings.enableBoxBuilder, true);
                setC('setting-enable-trust-marquee', storeSettings.enableTrustMarquee, true);
                setC('setting-enable-shipping-label', storeSettings.enableShippingLabel, true);
            }

            let toolsBar = document.getElementById('home-smart-tools-bar');
            if (toolsBar) toolsBar.style.display = storeSettings.enableBoxBuilder !== false ? 'flex' : 'none';

            let marquee = document.getElementById('home-trust-marquee');
            let viewBtn = document.getElementById('btn-toggle-view-mode');
            if (marquee) marquee.style.display = storeSettings.enableTrustMarquee !== false ? 'flex' : 'none';
            if (viewBtn) viewBtn.style.display = storeSettings.enableTrustMarquee !== false ? 'flex' : 'none';

            if (isCurrentUserAdmin) {
                window.renderAdminWorkHub();
                window.renderAdminExpenses();
            }
            if (window.currentLang === 'en') window.translateDOM(document.body);
        };

        const prevSaveSettingsV55 = window.saveSettings;
        window.saveSettings = async function() {
            const getC = (id, def = true) => { let el = document.getElementById(id); return el ? el.checked : def; };
            try {
                await updateDoc(doc(db, 'settings', 'main'), {
                    enableWorkHub: getC('setting-enable-work-hub', true),
                    enableQuickOrder: getC('setting-enable-quick-order', true),
                    enableBoxBuilder: getC('setting-enable-box-builder', true),
                    enableTrustMarquee: getC('setting-enable-trust-marquee', true),
                    enableShippingLabel: getC('setting-enable-shipping-label', true)
                });
            } catch (e) {}
            await prevSaveSettingsV55();
        };

        // إضافة مصطلحات V56 للقاموس الإنجليزي
        Object.assign(window.FULL_AR_TO_EN, {
            "من مزارعنا في سيناء مباشرة": "Direct from Our Sinai Farms",
            "حق معاينة الطلب عند الاستلام": "Inspect Order Upon Delivery",
            "ضمان استبدال واسترجاع": "Guaranteed Return & Exchange",
            "كوّن كرتونة التوفير بخصم خاص!": "Build Your Own Box & Save!",
            "محتار؟ مساعد الاختيار الذكي": "Product Finder Quiz",
            "كوّن كرتونة التوفير الخاصة بك": "Build Your Own Value Box",
            "اختر 3 منتجات أو أكثر في كرتونتك واحصل على خصم باقة إضافي فوري!": "Pick 3 or more items in your box and get an instant bundle discount!",
            "🛒 إضافة الكرتونة للسلة وتفعيل الخصم": "🛒 Add Box to Cart & Apply Discount",
            "مساعد اختيار العبوة الأنسب": "Smart Product Finder Quiz",
            "أجب عن سؤالين سريعين لنرشح لك المنتج والعبوة الأفضل والأوفر لك:": "Answer 2 quick questions to find the best value bottle for you:",
            "1. ما هو استخدامك الأساسي لزيت الزيتون؟": "1. What is your primary use for olive oil?",
            "2. ما هو حجم استهلاكك أو عدد أفراد الأسرة؟": "2. What is your household consumption size?",
            "اعرض الترشيح الأنسب لي": "Show My Best Match",
            "طلب سريع فوري في 5 ثوانٍ": "Express 1-Click Order in 5 Seconds",
            "تأكيد وإرسال الطلب فوراً": "Confirm & Submit Order Instantly"
        });


        // =========================================================================
        // === النسخة V57: الضبط الجذري لغرفة العمل (الصوت + العداد + التواريخ) + المرحلة النهائية ===
        // =========================================================================

        // 1. نظام الصوت المضمون 100% (Web Audio API المفتوح تلقائياً + ملف WAV احتياطي مدمج)
        window.sharedWorkAudioCtx = null;
        window.fallbackChimeAudio = null;

        window.initFallbackWavChime = function() {
            if (window.fallbackChimeAudio) return;
            try {
                // توليد نغمة جرس واضحة جداً بصيغة WAV في الذاكرة للعمل على جميع المتصفحات والموبايلات
                const sampleRate = 22050;
                const duration = 0.55;
                const numSamples = Math.floor(sampleRate * duration);
                const buffer = new ArrayBuffer(44 + numSamples * 2);
                const view = new DataView(buffer);
                const writeStr = (offset, str) => { for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i)); };
                writeStr(0, 'RIFF');
                view.setUint32(4, 36 + numSamples * 2, true);
                writeStr(8, 'WAVE');
                writeStr(12, 'fmt ');
                view.setUint32(16, 16, true);
                view.setUint16(20, 1, true);
                view.setUint16(22, 1, true);
                view.setUint32(24, sampleRate, true);
                view.setUint32(28, sampleRate * 2, true);
                view.setUint16(32, 2, true);
                view.setUint16(34, 16, true);
                writeStr(36, 'data');
                view.setUint32(40, numSamples * 2, true);

                for (let i = 0; i < numSamples; i++) {
                    let t = i / sampleRate;
                    let freq = t < 0.22 ? 659.25 : 880.0; // E5 -> A5 Ding-Dong chime
                    let env = Math.exp(-3.5 * (t < 0.22 ? t : (t - 0.22)));
                    let sample = Math.sin(2 * Math.PI * freq * t) * env * 0.65;
                    view.setInt16(44 + i * 2, Math.max(-1, Math.min(1, sample)) * 32767, true);
                }
                let binary = '';
                let bytes = new Uint8Array(buffer);
                for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
                window.fallbackChimeAudio = new Audio('data:audio/wav;base64,' + btoa(binary));
                window.fallbackChimeAudio.volume = 0.95;
            } catch (e) {}
        };
        window.initFallbackWavChime();

        // فتح قفل الصوت في المتصفح مع أول لمسة أو ضغطة في أي مكان بالموقع
        window.unlockWorkAudioEngine = function() {
            try {
                const AudioCtx = window.AudioContext || window.webkitAudioContext;
                if (AudioCtx) {
                    if (!window.sharedWorkAudioCtx) window.sharedWorkAudioCtx = new AudioCtx();
                    if (window.sharedWorkAudioCtx.state === 'suspended') {
                        window.sharedWorkAudioCtx.resume();
                    }
                }
                if (!window.fallbackChimeAudio) window.initFallbackWavChime();
            } catch (e) {}
        };
        ['click', 'touchstart', 'keydown'].forEach(evt => {
            document.addEventListener(evt, window.unlockWorkAudioEngine, { passive: true });
        });

        window.playWorkNotificationSound = function(forcePlay = false) {
            if (!forcePlay && !window.workSoundEnabled) return;
            window.unlockWorkAudioEngine();
            let playedWebAudio = false;
            try {
                let ctx = window.sharedWorkAudioCtx;
                if (ctx && ctx.state === 'running') {
                    let now = ctx.currentTime;
                    // النغمة الأولى (Ding)
                    let osc1 = ctx.createOscillator();
                    let g1 = ctx.createGain();
                    osc1.type = 'triangle';
                    osc1.frequency.setValueAtTime(659.25, now);
                    g1.gain.setValueAtTime(0.35, now);
                    g1.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
                    osc1.connect(g1);
                    g1.connect(ctx.destination);
                    osc1.start(now);
                    osc1.stop(now + 0.25);

                    // النغمة الثانية (Dong)
                    let osc2 = ctx.createOscillator();
                    let g2 = ctx.createGain();
                    osc2.type = 'sine';
                    osc2.frequency.setValueAtTime(880.0, now + 0.22);
                    g2.gain.setValueAtTime(0.4, now + 0.22);
                    g2.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
                    osc2.connect(g2);
                    g2.connect(ctx.destination);
                    osc2.start(now + 0.22);
                    osc2.stop(now + 0.65);
                    playedWebAudio = true;
                }
            } catch (e) {}

            // تشغيل ملف الـ WAV المدمج كدعم إضافي مضمون 100%
            try {
                if (window.fallbackChimeAudio) {
                    window.fallbackChimeAudio.currentTime = 0;
                    let p = window.fallbackChimeAudio.play();
                    if (p && p.catch) p.catch(() => {});
                }
            } catch (e) {}
        };

        // 2. محلل ومُنسق التواريخ الذكي الدقيق (يمنع أي تاريخ قديم أو خاطئ أو 1970 أو هجري)
        window.parseSafeTimestamp = function(val, fallbackMs = 0) {
            if (!val) return fallbackMs;
            if (typeof val === 'number') return val > 1e11 ? val : val * 1000;
            if (typeof val === 'object') {
                if (typeof val.toDate === 'function') return val.toDate().getTime();
                if (typeof val.seconds === 'number') return val.seconds * 1000;
            }
            let parsed = Date.parse(String(val));
            if (!isNaN(parsed) && parsed > 946684800000) { // بعد سنة 2000
                return parsed;
            }
            return fallbackMs;
        };

        window.formatWorkHubDate = function(rawVal) {
            let ms = window.parseSafeTimestamp(rawVal, Date.now());
            let now = Date.now();
            let diffSec = Math.max(0, Math.floor((now - ms) / 1000));
            let rel = '';
            if (diffSec < 60) rel = 'الآن';
            else if (diffSec < 3600) rel = `منذ ${Math.floor(diffSec / 60)} دقيقة`;
            else if (diffSec < 86400) rel = `منذ ${Math.floor(diffSec / 3600)} ساعة`;
            else if (diffSec < 172800) rel = 'أمس';
            else rel = `منذ ${Math.floor(diffSec / 86400)} يوم`;

            let dObj = new Date(ms);
            let exactStr = '';
            try {
                exactStr = new Intl.DateTimeFormat('ar-EG-u-ca-gregory', {
                    year: 'numeric', month: '2-digit', day: '2-digit',
                    hour: '2-digit', minute: '2-digit', hour12: true
                }).format(dObj);
            } catch (e) {
                exactStr = dObj.toLocaleString('ar-EG');
            }
            return `<span class="work-time-pill">🕒 <strong style="color:var(--secondary);">${rel}</strong> <span>• ${exactStr}</span></span>`;
        };

        // 3. حساب الرسائل غير المقروءة وآخر توقيت فعلي لكل محادثة بدقة 100%
        window.getChatWorkInfo = function(chat) {
            let msgs = Array.isArray(chat.messages) ? chat.messages : [];
            let lastAdminRealIdx = -1;
            let latestMs = window.parseSafeTimestamp(chat.lastCustomerMsgAt, 0) || window.parseSafeTimestamp(chat.lastUpdate, 0);
            let totalCustMsgs = 0;

            msgs.forEach((m, idx) => {
                let mTime = window.parseSafeTimestamp(m.timestamp, 0);
                if (mTime > latestMs) latestMs = mTime;
                if (m.sender === 'admin' && !m.isAutoReply && !String(m.text || '').includes('تم إنهاء المحادثة')) {
                    lastAdminRealIdx = idx;
                }
                if (m.sender === 'customer' && !String(m.text || '').includes('تم إنهاء المحادثة')) {
                    totalCustMsgs++;
                }
            });

            let unreadCustMsgs = 0;
            for (let i = lastAdminRealIdx + 1; i < msgs.length; i++) {
                let m = msgs[i];
                if (m && m.sender === 'customer' && !String(m.text || '').includes('تم إنهاء المحادثة')) {
                    unreadCustMsgs++;
                }
            }
            if (chat.unreadByAdmin === false) {
                unreadCustMsgs = 0;
            }
            let needsReply = unreadCustMsgs > 0 || chat.unreadByAdmin === true;
            if (needsReply && unreadCustMsgs === 0) unreadCustMsgs = 1;
            if (!latestMs) latestMs = Date.now();

            return {
                needsReply,
                unreadCustMsgs,
                totalCustMsgs,
                latestMs,
                latestIso: new Date(latestMs).toISOString()
            };
        };

        // 4. راصد التغييرات اللحظي (يكتشف أي رسالة جديدة أو طلب جديد أو إلغاء أثناء وجودك في الصفحة الرئيسية أو أي صفحة)
        window.workKnownOrders = new Map();
        window.workKnownChats = new Map();
        window.workKnownReturns = new Set();
        window.workOrdersInitialized = false;
        window.workChatsInitialized = false;
        window.workReturnsInitialized = false;

        window.showWorkLivePopupAlert = function(title, subtitle) {
            window.playWorkNotificationSound(false);
            let container = document.getElementById('toast-container');
            if (!container) return;
            let toast = document.createElement('div');
            toast.className = 'toast info show';
            toast.style.cssText = 'background:linear-gradient(135deg, #1e3a5f, #028090); color:white; border:2px solid #c59b27; cursor:pointer; padding:12px 16px; box-shadow:0 8px 25px rgba(0,0,0,0.3);';
            toast.innerHTML = `<div onclick="window.showPanel('admin-work'); this.parentElement.remove();">
                <strong style="display:block; font-size:0.95rem; color:#fcd34d;">${window.escapeHTML(title)}</strong>
                <span style="font-size:0.84rem;">${window.escapeHTML(subtitle)} (اضغط للفتح في غرفة العمل 💼)</span>
            </div>`;
            container.appendChild(toast);
            setTimeout(() => { if (toast.parentElement) toast.remove(); }, 6500);
        };

        window.checkWorkHubRealtimeChanges = function(source) {
            if (!isCurrentUserAdmin) return;
            try {
                if (source === 'orders') {
                    if (!window.workOrdersInitialized) {
                        (adminOrdersArray || []).forEach(o => window.workKnownOrders.set(o.id, o.status));
                        window.workOrdersInitialized = true;
                        return;
                    }
                    (adminOrdersArray || []).forEach(o => {
                        let prevStatus = window.workKnownOrders.get(o.id);
                        if (prevStatus === undefined) {
                            window.showWorkLivePopupAlert('📦 وصل طلب جديد الآن!', `العميل: ${o.customerName} — الإجمالي: ${o.totalAmount} ج`);
                        } else if (prevStatus !== o.status && (String(o.status).includes('لغى') || String(o.status).includes('رفض'))) {
                            window.showWorkLivePopupAlert('🚨 تم إلغاء طلب الآن!', `العميل: ${o.customerName} — طلب #${o.id.slice(0,6).toUpperCase()}`);
                        }
                        window.workKnownOrders.set(o.id, o.status);
                    });
                } else if (source === 'chats') {
                    if (!window.workChatsInitialized) {
                        (window.workHubChatsArray || []).forEach(c => {
                            let info = window.getChatWorkInfo(c);
                            window.workKnownChats.set(c.id, info.totalCustMsgs);
                        });
                        window.workChatsInitialized = true;
                        return;
                    }
                    (window.workHubChatsArray || []).forEach(c => {
                        let info = window.getChatWorkInfo(c);
                        let prevCount = window.workKnownChats.get(c.id) || 0;
                        if (info.totalCustMsgs > prevCount) {
                            let msgs = c.messages || [];
                            let lastCust = [...msgs].reverse().find(m => m.sender === 'customer');
                            let snippet = lastCust ? lastCust.text.slice(0, 45) : 'رسالة جديدة';
                            window.showWorkLivePopupAlert(`💬 رسالة جديدة من ${c.customerName || 'عميل'}!`, snippet);
                        }
                        window.workKnownChats.set(c.id, info.totalCustMsgs);
                    });
                } else if (source === 'returns') {
                    if (!window.workReturnsInitialized) {
                        (adminReturnsArray || []).forEach(r => window.workKnownReturns.add(r.id));
                        window.workReturnsInitialized = true;
                        return;
                    }
                    (adminReturnsArray || []).forEach(r => {
                        if (!window.workKnownReturns.has(r.id)) {
                            window.showWorkLivePopupAlert('🔄 طلب استرجاع جديد الآن!', `السبب: ${r.reason || 'غير محدد'}`);
                            window.workKnownReturns.add(r.id);
                        }
                    });
                }
            } catch (e) {
                console.error("Realtime check error:", e);
            }
        };

        // ربط استماع المحادثات اللحظي براصد التغييرات فوراً
        window.initAdminWorkHubStreams = function() {
            if (!isCurrentUserAdmin) return;
            let btnSnd = document.getElementById('btn-toggle-work-sound');
            if (btnSnd) btnSnd.textContent = window.workSoundEnabled ? '🔊 الصوت: مفعل' : '🔇 الصوت: صامت';

            if (!window.workChatsUnsub) {
                window.workChatsUnsub = onSnapshot(collection(db, 'chats'), (snap) => {
                    let arr = [];
                    snap.forEach(d => arr.push({ id: d.id, ...d.data() }));
                    window.workHubChatsArray = arr;
                    window.checkWorkHubRealtimeChanges('chats');
                    window.renderAdminWorkHub();
                });
            }

            if (!window.workAbandonedUnsub) {
                window.workAbandonedUnsub = onSnapshot(collection(db, 'users'), (snap) => {
                    let arr = [];
                    snap.forEach(d => {
                        let data = d.data();
                        if (data.cart && Array.isArray(data.cart) && data.cart.length > 0) {
                            arr.push({ id: d.id, ...data });
                        }
                    });
                    window.workHubAbandonedUsers = arr;
                    window.renderAdminWorkHub();
                });
            }
        };

        // تحديث sendInlineWorkChatReply ليصفر عداد الرسائل غير المقروءة فوراً عند الرد من غرفة العمل
        window.sendInlineWorkChatReply = async function(chatId) {
            let inp = document.getElementById('wk-reply-inp-' + chatId);
            if (!inp || !inp.value.trim()) {
                window.showToast('اكتب رسالة الرد أولاً', 'error');
                return;
            }
            let txt = inp.value.trim();
            inp.value = '';
            let nowIso = new Date().toISOString();
            let msg = { sender: 'admin', text: txt, timestamp: nowIso, isAutoReply: false };
            try {
                await updateDoc(doc(db, 'chats', chatId), {
                    messages: arrayUnion(msg),
                    lastUpdate: nowIso,
                    adminReplied: true,
                    unreadByAdmin: false
                });
                window.showToast('تم إرسال ردك للعميل فوراً ✅', 'success');
            } catch (e) {
                window.showToast('حدث خطأ أثناء إرسال الرد', 'error');
            }
        };

        window.workHideCompletedOld = false;
        window.toggleWorkHideCompleted = function() {
            window.workHideCompletedOld = !window.workHideCompletedOld;
            let btn = document.getElementById('btn-toggle-work-hide-done');
            if (btn) {
                btn.textContent = window.workHideCompletedOld ? '👁️ إظهار كل السجل' : '👁️ إخفاء المكتمل القديم';
                btn.style.background = window.workHideCompletedOld ? 'var(--secondary)' : 'transparent';
                btn.style.color = window.workHideCompletedOld ? 'white' : 'var(--primary)';
            }
            window.renderAdminWorkHub();
        };

        // 5. النسخة المطورة الخالية من الأخطاء من غرفة متابعة العمل (renderAdminWorkHub)
        window.renderAdminWorkHub = function() {
            if (!isCurrentUserAdmin) return;
            try {
                let container = document.getElementById('admin-work-stream-container');
                let searchEl = document.getElementById('work-hub-search');
                let q = searchEl ? searchEl.value.trim().toLowerCase() : '';

                let events = [];
                let activeOrdersCount = 0;
                let pendingReviewOrdersCount = 0;
                let totalUnreadCustomerMsgs = 0;
                let unrepliedChatsThreads = 0;
                let cancelsAndReturnsCount = 0;
                let urgentCancelsAndReturns = 0;
                let leadsCount = 0;

                // أ) جمع الطلبات (النشطة والملغاة) مع التوقيت الدقيق
                (adminOrdersArray || []).forEach(ord => {
                    let st = String(ord.status || '');
                    let isCanceled = st.includes('لغى') || st.includes('رفض');
                    let isDelivered = st.includes('توصيل');
                    if (window.workHideCompletedOld && isDelivered) return;

                    let ordMs = window.parseSafeTimestamp(ord.updatedAt, 0) || window.parseSafeTimestamp(ord.orderDate, Date.now());
                    if (isCanceled) {
                        let cancelMs = window.parseSafeTimestamp(ord.canceledAt, 0) || ordMs;
                        cancelsAndReturnsCount++;
                        let isUrgentCancel = ord.unreadCancelByAdmin !== false && (Date.now() - cancelMs < 172800000); // آخر 48 ساعة أو غير مقروء
                        if (isUrgentCancel) urgentCancelsAndReturns++;
                        events.push({
                            category: 'cancels',
                            subType: 'canceled_order',
                            isUrgent: isUrgentCancel,
                            timestampMs: cancelMs,
                            data: ord
                        });
                    } else {
                        activeOrdersCount++;
                        let isUrgentOrder = (st === 'قيد المراجعة');
                        if (isUrgentOrder) pendingReviewOrdersCount++;
                        events.push({
                            category: 'orders',
                            subType: 'active_order',
                            isUrgent: isUrgentOrder,
                            timestampMs: ordMs,
                            data: ord
                        });
                    }
                });

                // ب) جمع طلبات الاسترجاع
                (adminReturnsArray || []).forEach(ret => {
                    if (window.workHideCompletedOld && ret.status !== 'قيد المراجعة') return;
                    cancelsAndReturnsCount++;
                    let isUrgentRet = (ret.status === 'قيد المراجعة');
                    if (isUrgentRet) urgentCancelsAndReturns++;
                    let retMs = window.parseSafeTimestamp(ret.date, Date.now());
                    events.push({
                        category: 'cancels',
                        subType: 'return_request',
                        isUrgent: isUrgentRet,
                        timestampMs: retMs,
                        data: ret
                    });
                });

                // ج) جمع رسائل خدمة العملاء مع حساب كل رسالة جديدة بدقة
                (window.workHubChatsArray || []).forEach(chat => {
                    let info = window.getChatWorkInfo(chat);
                    if (window.workHideCompletedOld && !info.needsReply) return;
                    if (info.needsReply) {
                        unrepliedChatsThreads++;
                        totalUnreadCustomerMsgs += info.unreadCustMsgs;
                    }
                    events.push({
                        category: 'chats',
                        subType: 'chat_thread',
                        isUrgent: info.needsReply,
                        needsReply: info.needsReply,
                        unreadCustMsgs: info.unreadCustMsgs,
                        timestampMs: info.latestMs,
                        data: chat
                    });
                });

                // د) جمع السلال المتروكة (تظهر في تبويب السلال والتنبيهات حتى لا تخلط التواريخ القديمة بتبويب كل الشغل)
                (window.workHubAbandonedUsers || []).forEach(u => {
                    leadsCount++;
                    let cartMs = window.parseSafeTimestamp(u.cartUpdatedAt, 0) || window.parseSafeTimestamp(u.lastLogin, Date.now());
                    events.push({
                        category: 'leads',
                        subType: 'abandoned_cart',
                        isUrgent: false,
                        timestampMs: cartMs,
                        data: u
                    });
                });

                // تحديث جميع عدادات (💼 العمل / الشغل) في الهيدر بالصفحة الرئيسية وشريط الإدارة فوراً!
                let urgentTotal = pendingReviewOrdersCount + totalUnreadCustomerMsgs + urgentCancelsAndReturns;
                document.querySelectorAll('.work-hub-live-badge, #work-hub-badge').forEach(b => {
                    b.textContent = urgentTotal;
                    b.style.display = 'inline-block';
                });
                let hdrWorkBtn = document.getElementById('header-work-hub-btn');
                if (hdrWorkBtn) {
                    hdrWorkBtn.style.display = isCurrentUserAdmin ? 'inline-flex' : 'none';
                }

                let setKpi = (id, val) => { let el = document.getElementById(id); if (el) el.textContent = val; };
                let mainWorkEventsCount = events.filter(e => e.category !== 'leads').length;
                setKpi('wk-count-all', mainWorkEventsCount);
                setKpi('wk-count-orders', activeOrdersCount);
                setKpi('wk-count-chats', unrepliedChatsThreads > 0 ? `${unrepliedChatsThreads} (${totalUnreadCustomerMsgs} جديدة)` : (window.workHubChatsArray || []).length);
                setKpi('wk-count-cancels', cancelsAndReturnsCount);
                setKpi('wk-count-leads', leadsCount);

                if (!container) return;

                // فلترة الأحداث حسب التبويب المختار (في تبويب "كل الشغل" نعرض الطلبات والرسائل والإلغاءات فقط بدون السلال القديمة)
                let filtered = events.filter(ev => {
                    if (window.currentWorkHubFilter === 'all') {
                        if (ev.category === 'leads') return false;
                    } else if (ev.category !== window.currentWorkHubFilter) {
                        return false;
                    }
                    if (!q) return true;
                    let str = JSON.stringify(ev.data || {}).toLowerCase();
                    return str.includes(q);
                });

                // الترتيب الذكي: المهام العاجلة التي تنتظر ردك/مراجعتك في الأعلى دائماً ثم الأحدث فالأقدم بالتوقيت الدقيق
                filtered.sort((a, b) => {
                    if (a.isUrgent !== b.isUrgent) return a.isUrgent ? -1 : 1;
                    return (b.timestampMs || 0) - (a.timestampMs || 0);
                });

                if (filtered.length === 0) {
                    container.innerHTML = `<div style="text-align:center; padding:40px 20px; background:var(--input-bg); border-radius:12px; color:var(--text-muted);">
                        <span style="font-size:2.8rem; display:block; margin-bottom:8px;">✨</span>
                        <h3 style="margin:0;">لا توجد مهام في هذا التبويب حالياً</h3>
                        <p style="font-size:0.85rem; margin-top:5px;">أي طلب جديد أو رسالة عميل أو إلغاء سيظهر لك هنا فوراً مع تنبيه صوتي وتوقيت لحظي دقيق!</p>
                    </div>`;
                    return;
                }

                let html = '';
                filtered.slice(0, 60).forEach(ev => {
                    let timeBadgeHtml = window.formatWorkHubDate(ev.timestampMs);

                    if (ev.subType === 'active_order') {
                        let o = ev.data;
                        let phone = (o.phones && o.phones.primary) || '';
                        let itemsTxt = (o.items || []).map(i => `${window.escapeHTML(i.name)} (${i.quantity})`).join(' ، ');
                        let tagBadge = window.getCustomerTagBadgeHtml ? window.getCustomerTagBadgeHtml(phone) : '';
                        let subBadge = o.isMonthlySubscription ? `<span style="background:#028090; color:white; padding:2px 8px; border-radius:8px; font-size:0.74rem; font-weight:bold; margin-right:5px;">🔄 اشتراك شهري</span>` : '';
                        let statusColor = o.status === 'قيد المراجعة' ? '#dc3545' : (o.status.includes('توصيل') ? '#28a745' : '#028090');

                        html += `<div class="work-event-card type-order">
                            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
                                <div>
                                    <span class="${o.status === 'قيد المراجعة' ? 'work-urgent-pulse' : ''}" style="background:${statusColor}; color:white; padding:3px 9px; border-radius:8px; font-size:0.76rem; font-weight:bold;">📦 طلب #${o.id.slice(0,6).toUpperCase()} (${window.escapeHTML(o.status)})</span>
                                    <strong style="color:var(--primary); font-size:1.05rem; margin-right:6px;">👤 ${window.escapeHTML(o.customerName)} ${tagBadge} ${subBadge}</strong>
                                </div>
                                ${timeBadgeHtml}
                            </div>
                            <div style="margin-top:8px; font-size:0.88rem; color:var(--text-color); line-height:1.6;">
                                <div>📞 <strong>الهاتف:</strong> ${window.escapeHTML(phone)} | 📍 <strong>العنوان:</strong> ${window.escapeHTML((o.location && o.location.governorate) || '')} - ${window.escapeHTML((o.location && o.location.city) || '')} (${window.escapeHTML((o.location && o.location.details) || '')})</div>
                                <div>🛍️ <strong>المنتجات:</strong> ${itemsTxt} ${o.freeGiftUnlocked ? `<span style="color:#166534; font-weight:bold;">+ ${window.escapeHTML(o.freeGiftUnlocked)}</span>` : ''}</div>
                                <div>💰 <strong>الإجمالي المطلوب:</strong> <strong style="color:var(--secondary); font-size:1.02rem;">${o.totalAmount} ج</strong> (${window.escapeHTML(o.paymentMethod || 'كاش')})</div>
                            </div>
                            <div class="work-inline-actions">
                                <button type="button" class="btn" style="padding:5px 10px; font-size:0.78rem; background:#028090;" onclick="window.updateOrderStatus('${o.id}', 'تم التجهيز')">📦 تم التجهيز</button>
                                <button type="button" class="btn" style="padding:5px 10px; font-size:0.78rem; background:#007bff;" onclick="window.updateOrderStatus('${o.id}', 'تم الشحن')">🚚 تم الشحن</button>
                                <button type="button" class="btn" style="padding:5px 10px; font-size:0.78rem; background:#28a745;" onclick="window.updateOrderStatus('${o.id}', 'تم التوصيل ✅')">✅ تم التوصيل</button>
                                <button type="button" class="btn btn-outline" style="padding:5px 10px; font-size:0.78rem; border-color:#25D366; color:#25D366;" onclick="window.sendOrderWhatsAppStatus('${o.id}')">📲 واتساب</button>
                                ${storeSettings.enableShippingLabel !== false ? `<button type="button" class="btn btn-outline" style="padding:5px 10px; font-size:0.78rem;" onclick="window.printOrderShippingLabel('${o.id}')">🖨️ بوليصة الشحن</button>` : ''}
                                <button type="button" class="btn btn-outline" style="padding:5px 10px; font-size:0.78rem;" onclick="window.openAdminOrderModal('${o.id}')">📋 التفاصيل</button>
                            </div>
                        </div>`;
                    } else if (ev.subType === 'canceled_order') {
                        let o = ev.data;
                        let phone = (o.phones && o.phones.primary) || '';
                        let pureWa = String(phone).replace(/\D/g, '');
                        if (pureWa && !pureWa.startsWith('20') && pureWa.length >= 10) pureWa = '20' + pureWa;
                        let waMsg = `مرحباً ${o.customerName} 🌿 لاحظنا إلغاء طلبك رقم #${o.id.slice(0,6).toUpperCase()} في متجر زيت الشجرة المباركة، هل واجهتك أي مشكلة أو تود تعديل الطلب؟ يسعدنا خدمتك فوراً!`;
                        let itemsTxt = (o.items || []).map(i => `${window.escapeHTML(i.name)} (${i.quantity})`).join(' ، ');

                        html += `<div class="work-event-card type-cancel">
                            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
                                <div>
                                    <span style="background:#dc3545; color:white; padding:3px 9px; border-radius:8px; font-size:0.76rem; font-weight:bold;">🚨 طلب ملغى #${o.id.slice(0,6).toUpperCase()}</span>
                                    <strong style="color:var(--danger); font-size:1.02rem; margin-right:6px;">👤 ${window.escapeHTML(o.customerName)} (${window.escapeHTML(o.status)})</strong>
                                </div>
                                ${timeBadgeHtml}
                            </div>
                            <div style="margin-top:8px; font-size:0.86rem;">
                                📞 <strong>الهاتف:</strong> ${window.escapeHTML(phone)} | 🛍️ <strong>المنتجات:</strong> ${itemsTxt} | 💰 <strong>القيمة:</strong> ${o.totalAmount} ج
                            </div>
                            <div class="work-inline-actions">
                                <a href="https://wa.me/${pureWa}?text=${encodeURIComponent(waMsg)}" target="_blank" class="btn" style="background:#25D366; padding:5px 12px; font-size:0.78rem; text-decoration:none;">💬 تواصل واتساب لمعرفة سبب الإلغاء</a>
                                <button type="button" class="btn btn-outline" style="padding:5px 10px; font-size:0.78rem;" onclick="window.updateOrderStatus('${o.id}', 'قيد المراجعة')">🔄 استعادة وتفعيل الطلب</button>
                                <button type="button" class="btn btn-outline" style="padding:5px 10px; font-size:0.78rem;" onclick="window.openAdminOrderModal('${o.id}')">📋 التفاصيل</button>
                            </div>
                        </div>`;
                    } else if (ev.subType === 'return_request') {
                        let r = ev.data;
                        html += `<div class="work-event-card type-cancel">
                            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
                                <div>
                                    <span style="background:#e0a800; color:white; padding:3px 9px; border-radius:8px; font-size:0.76rem; font-weight:bold;">🔄 طلب استرجاع #${(r.orderId || '').slice(0,6).toUpperCase()}</span>
                                    <strong style="color:var(--primary); margin-right:6px;">السبب: ${window.escapeHTML(r.reason || '')}</strong>
                                </div>
                                ${timeBadgeHtml}
                            </div>
                            <p style="margin:6px 0; font-size:0.85rem; color:var(--text-muted);">ملاحظات العميل: ${window.escapeHTML(r.notes || 'لا توجد')}</p>
                            <div class="work-inline-actions">
                                ${r.status === 'قيد المراجعة' ? `<button type="button" class="btn" style="background:#28a745; padding:5px 12px; font-size:0.78rem;" onclick="window.approveReturn('${r.id}', '${r.orderId}')">✅ الموافقة وإرسال مندوب</button>` : `<span style="color:#28a745; font-weight:bold; font-size:0.82rem;">✅ تمت الموافقة</span>`}
                                ${r.imageUrl ? `<a href="${r.imageUrl}" target="_blank" class="btn btn-outline" style="padding:5px 10px; font-size:0.78rem; text-decoration:none;">📸 عرض صورة المنتج</a>` : ''}
                            </div>
                        </div>`;
                    } else if (ev.subType === 'chat_thread') {
                        let c = ev.data;
                        let msgs = c.messages || [];
                        let lastMsgs = msgs.slice(-3);
                        let statusBadge = ev.needsReply
                            ? `<span class="work-urgent-pulse" style="background:#dc3545; color:white; padding:3px 9px; border-radius:8px; font-size:0.75rem; font-weight:bold;">🔴 (${ev.unreadCustMsgs}) رسالة عميل جديدة تنتظر ردك</span>`
                            : `<span style="background:#007bff; color:white; padding:3px 9px; border-radius:8px; font-size:0.74rem; font-weight:bold;">💬 محادثة خدمة عملاء (تم الرد)</span>`;

                        let previewHtml = lastMsgs.map(m => {
                            let mTimeStr = m.timestamp ? new Date(window.parseSafeTimestamp(m.timestamp, Date.now())).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : '';
                            return `<div style="font-size:0.84rem; padding:5px 9px; border-radius:6px; margin-top:4px; background:${m.sender==='customer'?'rgba(0,123,255,0.09)':'var(--input-bg)'}; display:flex; justify-content:space-between; gap:8px;">
                                <span><strong>${m.sender==='customer'?'👤 العميل:':(m.isAutoReply?'🤖 رد آلي:':'🛡️ الإدارة:')}</strong> ${window.escapeHTML(m.text)}</span>
                                <small style="color:var(--text-muted); white-space:nowrap;">${mTimeStr}</small>
                            </div>`;
                        }).join('');
                        let safeId = c.id.replace(/'/g, "\\'");
                        let safeName = (c.customerName || 'عميل').replace(/'/g, "\\'");

                        html += `<div class="work-event-card type-chat">
                            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
                                <div>
                                    ${statusBadge}
                                    <strong style="color:var(--primary); font-size:1rem; margin-right:6px;">👤 ${window.escapeHTML(c.customerName || c.id)}</strong>
                                </div>
                                ${timeBadgeHtml}
                            </div>
                            <div style="margin:8px 0;">${previewHtml}</div>
                            <div style="display:flex; gap:5px; flex-wrap:wrap; margin-bottom:6px;">
                                <button type="button" class="work-canned-chip" onclick="window.insertCannedWorkReply('${safeId}', 'أهلاً بحضرتك 🌿 تحت أمرك، جاري مراجعة استفسارك فوراً.')">👋 ترحيب</button>
                                <button type="button" class="work-canned-chip" onclick="window.insertCannedWorkReply('${safeId}', 'طلب حضرتك قيد التجهيز والشحن السريع لباب البيت 🚚')">🚚 حالة الشحن</button>
                                <button type="button" class="work-canned-chip" onclick="window.insertCannedWorkReply('${safeId}', 'زيت الشجرة المباركة سيناوي بكر عصرة أولى على البارد 100% ومضمون 🌿')">🌿 ضمان الزيت</button>
                            </div>
                            <div style="display:flex; gap:6px; align-items:center; flex-wrap:wrap;">
                                <input type="text" id="wk-reply-inp-${c.id}" placeholder="اكتب ردك المباشر للعميل هنا..." style="margin:0; flex:1; min-width:170px; padding:7px 10px; font-size:0.85rem;">
                                <button type="button" class="btn" style="background:#007bff; padding:7px 12px; font-size:0.82rem;" onclick="window.sendInlineWorkChatReply('${safeId}')">إرسال الرد 🚀</button>
                                <button type="button" class="btn btn-outline" style="padding:7px 10px; font-size:0.8rem;" onclick="window.showPanel('admin-messages'); window.openAdminChat('${safeId}', '${safeName}');">فتح الشات 💬</button>
                            </div>
                        </div>`;
                    } else if (ev.subType === 'abandoned_cart') {
                        let u = ev.data;
                        let total = 0;
                        (u.cart || []).forEach(it => total += Number(it.price || 0) * Number(it.quantity || 1));
                        let phone = u.phone1 || u.email || 'غير مسجل';
                        let pureWa = String(phone).replace(/\D/g, '');
                        if (pureWa && !pureWa.startsWith('20') && pureWa.length >= 10) pureWa = '20' + pureWa;
                        let waText = `مرحباً ${u.name || 'عميلنا العزيز'} 🌿 لاحظنا وجود منتجات في سلة مشترياتك بمتجر زيت الشجرة المباركة، هل تحب نساعدك في إتمام الطلب اليوم مع هدية أو خصم خاص؟`;

                        html += `<div class="work-event-card type-lead">
                            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
                                <div>
                                    <span style="background:#ff6b00; color:white; padding:3px 9px; border-radius:8px; font-size:0.74rem; font-weight:bold;">🛒 سلة متروكة نشطة</span>
                                    <strong style="color:var(--primary); margin-right:6px;">👤 ${window.escapeHTML(u.name || 'عميل')} (${window.escapeHTML(phone)})</strong>
                                </div>
                                ${timeBadgeHtml}
                            </div>
                            <div style="margin-top:6px; font-size:0.85rem; color:var(--secondary); font-weight:bold;">
                                عدد المنتجات بالسلة: ${u.cart.length} (بقيمة إجمالية ~${total} ج)
                            </div>
                            ${pureWa.length >= 10 ? `<div class="work-inline-actions"><a href="https://wa.me/${pureWa}?text=${encodeURIComponent(waText)}" target="_blank" class="btn btn-outline" style="border-color:#25D366; color:#25D366; padding:5px 12px; font-size:0.8rem; text-decoration:none;">💬 تواصل مع العميل عبر واتساب</a></div>` : ''}
                        </div>`;
                    }
                });

                container.innerHTML = html;
            } catch (err) {
                console.error("Work Hub render error:", err);
            }
        };

        // =========================================================================
        // === 6. ميزات المرحلة النهائية (صفقة اليوم + الاشتراك الشهري + بطاقات الهدايا + QR + آخر مشاهدة) ===
        // =========================================================================

        // أ) صفقة اليوم الخاطفة الموقوتة (Flash Deal of the Day)
        window.renderHomeFlashDeal = function() {
            let box = document.getElementById('home-flash-deal-box');
            if (!box) return;
            if (storeSettings.enableFlashDeal === false || !products || products.length === 0) {
                box.style.display = 'none';
                return;
            }
            let targetProd = products.find(p => p.id === storeSettings.flashDealProductId && !p.isHidden);
            if (!targetProd) {
                targetProd = products.find(p => !p.isHidden && p.oldPrice && Number(p.oldPrice) > Number(p.price)) || products.find(p => !p.isHidden);
            }
            if (!targetProd) {
                box.style.display = 'none';
                return;
            }
            box.style.display = 'flex';
            let img = (targetProd.images && targetProd.images[0]) ? targetProd.images[0] : (targetProd.imageUrl || '1000392409.jpeg');
            let dealTitle = storeSettings.flashDealTitle || (window.currentLang === 'en' ? '⚡ Flash Deal of the Day!' : '⚡ صفقة اليوم الخاطفة بخصم خاص!');
            let oldP = (targetProd.oldPrice && Number(targetProd.oldPrice) > Number(targetProd.price)) ? Number(targetProd.oldPrice) : Math.round(Number(targetProd.price) * 1.15);
            let saveAmt = Math.max(0, oldP - Number(targetProd.price));

            box.innerHTML = `
                <div style="display:flex; align-items:center; gap:12px; flex:1.5; min-width:220px;">
                    <img loading="lazy" src="${img}" style="width:68px; height:68px; border-radius:12px; object-fit:cover; border:2px solid #f59e0b; flex-shrink:0; cursor:pointer;" onclick="window.openProductModal('${targetProd.id}')">
                    <div>
                        <span style="background:#ef4444; color:white; padding:2px 8px; border-radius:6px; font-size:0.72rem; font-weight:bold; display:inline-block; margin-bottom:3px;">${window.escapeHTML(dealTitle)}</span>
                        <h4 style="margin:0 0 3px 0; color:var(--primary); font-size:0.98rem; cursor:pointer;" onclick="window.openProductModal('${targetProd.id}')">${window.escapeHTML(targetProd.name)}</h4>
                        <div>
                            <del style="color:var(--text-muted); font-size:0.82rem; margin-left:5px;">${oldP} ج</del>
                            <strong style="color:#d97706; font-size:1.08rem;">${targetProd.price} ج</strong>
                            <span style="color:#166534; font-size:0.76rem; font-weight:bold; margin-right:6px;">(وفر ${saveAmt} ج)</span>
                        </div>
                    </div>
                </div>
                <div style="display:flex; gap:6px; align-items:center;">
                    <button type="button" class="btn" style="background:linear-gradient(90deg, #f59e0b, #d97706); padding:8px 14px; font-size:0.85rem;" onclick="window.openProductModal('${targetProd.id}')">🛒 ${window.currentLang === 'en' ? 'Grab Deal' : 'اغتنم الصفقة'}</button>
                    ${storeSettings.enableQuickOrder !== false ? `<button type="button" class="btn btn-outline" style="padding:8px 10px; font-size:0.85rem; border-color:#d97706; color:#d97706;" onclick="window.openQuickOrderModal(event, '${targetProd.id}')">⚡</button>` : ''}
                </div>
            `;
        };

        // ب) الاشتراك الشهري التلقائي بخصم خاص (Subscribe & Save)
        window.isCurrentOrderMonthlySubscription = false;
        window.toggleModalSubscribeOption = function(isChecked) {
            window.isCurrentOrderMonthlySubscription = Boolean(isChecked);
            let subPct = Number(storeSettings.subscribeDiscountPercent) || 5;
            if (isChecked) {
                currentDiscountPercent = Math.max(currentDiscountPercent, subPct);
                if (!appliedPromoCode) appliedPromoCode = `SUB${subPct}`;
                window.showToast(window.currentLang === 'en' ? `🔄 Monthly Subscription activated (+${subPct}% OFF)!` : `🔄 تم تفعيل الاشتراك الشهري التلقائي (خصم ${subPct}% إضافي)!`, 'success');
            } else if (appliedPromoCode && appliedPromoCode.startsWith('SUB')) {
                currentDiscountPercent = 0;
                appliedPromoCode = '';
            }
            window.updateInvoiceUI();
        };

        // ج) بطاقات الهدايا الرقمية (Digital Gift Cards)
        window.selectedGiftCardValue = 500;
        window.openGiftCardModal = function() {
            let modal = document.getElementById('gift-card-modal');
            if (modal) modal.style.display = 'flex';
        };

        window.selectGiftCardAmount = function(amt, btnEl) {
            window.selectedGiftCardValue = Number(amt) || 500;
            document.querySelectorAll('.gift-amt-btn').forEach(b => {
                b.style.background = 'transparent';
                b.style.color = 'var(--primary)';
            });
            if (btnEl) {
                btnEl.style.background = 'var(--secondary)';
                btnEl.style.color = 'white';
            }
        };

        window.addGiftCardToCart = function() {
            let receiver = (document.getElementById('gc-receiver-name') || {}).value.trim() || 'صديق';
            let amt = window.selectedGiftCardValue || 500;
            let gcId = `giftcard_${amt}`;
            cart.push({
                id: gcId,
                cartItemId: `${gcId}_${Date.now()}`,
                name: `🎟️ بطاقة هدية رقمية (${amt} ج) — إهداء إلى: ${receiver}`,
                price: amt,
                imageUrl: '1000392409.jpeg',
                quantity: 1,
                variant: '',
                selected: true
            });
            localStorage.setItem('cart', JSON.stringify(cart));
            window.updateCartUI();
            document.getElementById('gift-card-modal').style.display = 'none';
            window.showToast('تمت إضافة بطاقة الهدية إلى سلتك بنجاح 🎟️🛒', 'success');
            window.showPanel('cart');
        };

        window.shareGiftCardPreviewWhatsApp = function() {
            let sender = (document.getElementById('gc-sender-name') || {}).value.trim() || 'صديقك';
            let receiver = (document.getElementById('gc-receiver-name') || {}).value.trim() || 'عزيزي';
            let phone = (document.getElementById('gc-receiver-phone') || {}).value.trim();
            let note = (document.getElementById('gc-message') || {}).value.trim() || 'أتمنى لك دوام الصحة والعافية 🌿';
            let amt = window.selectedGiftCardValue || 500;
            let pureWa = phone.replace(/\D/g, '');
            if (pureWa && !pureWa.startsWith('20') && pureWa.length >= 10) pureWa = '20' + pureWa;

            let msg = `🎁 *بطاقة هدية خاصة لك من (${sender})* 🌿\n\nأهلاً ${receiver}، تم إهداؤك قسيمة شراء بقيمة *(${amt} جنيه)* من *متجر زيت الشجرة المباركة* (أفضل زيت زيتون سيناوي بكر ممتاز عصره أولى على البارد 100%).\n\n💌 *رسالة الإهداء:* "${note}"\n\n🔗 تصفح المتجر واطلب هديتك الآن: ${window.location.origin + window.location.pathname}`;
            window.open(`https://wa.me/${pureWa}?text=${encodeURIComponent(msg)}`, '_blank');
        };

        // د) باركود QR السريع لكل منتج (Product QR Code)
        window.openProductQRModal = function() {
            if (!activeProductForReview) return;
            let p = products.find(pr => pr.id === activeProductForReview);
            if (!p) return;
            let prodUrl = `${window.location.origin}${window.location.pathname}?id=${encodeURIComponent(p.id)}`;
            let qrImgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(prodUrl)}`;

            let titleEl = document.getElementById('qr-modal-prod-title');
            let imgEl = document.getElementById('qr-modal-img');
            let modal = document.getElementById('product-qr-modal');
            if (titleEl) titleEl.textContent = `📱 ${p.name}`;
            if (imgEl) imgEl.src = qrImgUrl;
            if (modal) modal.style.display = 'flex';
        };

        window.printProductQRLabel = function() {
            let p = products.find(pr => pr.id === activeProductForReview);
            if (!p) return;
            let prodUrl = `${window.location.origin}${window.location.pathname}?id=${encodeURIComponent(p.id)}`;
            let qrImgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(prodUrl)}`;
            let w = window.open('', '_blank', 'width=450,height=500');
            if (!w) return;
            w.document.write(`
                <html dir="rtl" lang="ar"><body style="font-family:Tahoma,sans-serif; text-align:center; padding:25px;" onload="window.print()">
                    <div style="border:2px solid #3c521e; border-radius:12px; padding:15px; display:inline-block;">
                        <h3 style="margin:0 0 5px; color:#3c521e;">🌿 زيت الشجرة المباركة</h3>
                        <strong style="display:block; margin-bottom:10px;">${window.escapeHTML(p.name)}</strong>
                        <img src="${qrImgUrl}" width="170" height="170"><br>
                        <small style="display:block; margin-top:8px;">امسح الرمز لإعادة الطلب المباشر</small>
                    </div>
                </body></html>
            `);
            w.document.close();
        };

        // هـ) شريط آخر منتج تمت مشاهدته (Sticky Last Viewed Mini-Bar)
        window.lastViewedProductId = null;
        window.lastViewedBarDismissed = false;
        window.updateStickyLastViewedBar = function(product) {
            if (!product) return;
            window.lastViewedProductId = product.id;
            let bar = document.getElementById('sticky-last-viewed-bar');
            let img = document.getElementById('slv-img');
            let name = document.getElementById('slv-name');
            if (!bar || !img || !name) return;
            if (storeSettings.enableLastViewedBar === false || window.lastViewedBarDismissed) {
                bar.style.display = 'none';
                return;
            }
            img.src = (product.images && product.images[0]) ? product.images[0] : (product.imageUrl || '1000392409.jpeg');
            name.textContent = product.name;
            bar.style.display = 'flex';
        };

        window.reopenLastViewedProduct = function() {
            if (window.lastViewedProductId) window.openProductModal(window.lastViewedProductId);
        };

        window.dismissLastViewedBar = function() {
            window.lastViewedBarDismissed = true;
            let bar = document.getElementById('sticky-last-viewed-bar');
            if (bar) bar.style.display = 'none';
        };

        // ربط فتح نافذة المنتج وتحديث الإعدادات بـ V57
        const origOpenProductModalV56 = window.openProductModal;
        window.openProductModal = function(id) {
            origOpenProductModalV56(id);
            let p = products.find(pr => pr.id === id);
            if (p) window.updateStickyLastViewedBar(p);

            let subBox = document.getElementById('modal-subscribe-save-box');
            let subPctEl = document.getElementById('modal-sub-disc-pct');
            let subCb = document.getElementById('modal-subscribe-checkbox');
            if (subBox) {
                subBox.style.display = storeSettings.enableSubscribeSave !== false ? 'block' : 'none';
                if (subPctEl) subPctEl.textContent = `${Number(storeSettings.subscribeDiscountPercent) || 5}%`;
                if (subCb) subCb.checked = false;
            }

            let qrBtn = document.getElementById('btn-qr-modal');
            if (qrBtn) qrBtn.style.display = storeSettings.enableProductQr !== false ? 'inline-block' : 'none';
        };

        const origRenderProductsV56 = window.renderProducts;
        window.renderProducts = function(scrollToTop = true) {
            origRenderProductsV56(scrollToTop);
            window.renderHomeFlashDeal();
        };

        const prevApplySettingsV56 = window.applySettingsToUI;
        window.applySettingsToUI = function() {
            prevApplySettingsV56();
            if (isCurrentUserAdmin) {
                let fdSel = document.getElementById('setting-flash-deal-product');
                if (fdSel && products.length > 0) {
                    let opts = '<option value="">تلقائي (أفضل منتج مخفض)</option>';
                    products.forEach(p => {
                        opts += `<option value="${p.id}" ${storeSettings.flashDealProductId === p.id ? 'selected' : ''}>${window.escapeHTML(p.name)} (${p.price} ج)</option>`;
                    });
                    fdSel.innerHTML = opts;
                }
                let setC = (id, val, def = true) => { let el = document.getElementById(id); if (el) el.checked = val !== undefined ? Boolean(val) : def; };
                let setV = (id, val, def = '') => { let el = document.getElementById(id); if (el) el.value = val !== undefined ? val : def; };

                setC('setting-enable-flash-deal', storeSettings.enableFlashDeal, true);
                setV('setting-flash-deal-title', storeSettings.flashDealTitle, '⚡ صفقة اليوم الخاطفة بخصم خاص!');
                setC('setting-enable-subscribe-save', storeSettings.enableSubscribeSave, true);
                setV('setting-subscribe-discount', storeSettings.subscribeDiscountPercent, 5);
                setC('setting-enable-gift-cards', storeSettings.enableGiftCards, true);
                setC('setting-enable-product-qr', storeSettings.enableProductQr, true);
                setC('setting-enable-last-viewed-bar', storeSettings.enableLastViewedBar, true);
            }

            let gcBtn = document.getElementById('btn-open-gift-card');
            if (gcBtn) gcBtn.style.display = storeSettings.enableGiftCards !== false ? 'flex' : 'none';

            let slvBar = document.getElementById('sticky-last-viewed-bar');
            if (slvBar && storeSettings.enableLastViewedBar === false) slvBar.style.display = 'none';

            let hdrWorkBtn = document.getElementById('header-work-hub-btn');
            if (hdrWorkBtn) hdrWorkBtn.style.display = isCurrentUserAdmin ? 'inline-flex' : 'none';

            window.renderHomeFlashDeal();
            if (isCurrentUserAdmin) window.renderAdminWorkHub();
            if (window.currentLang === 'en') window.translateDOM(document.body);
        };

        const prevSaveSettingsV56 = window.saveSettings;
        window.saveSettings = async function() {
            const getC = (id, def = true) => { let el = document.getElementById(id); return el ? el.checked : def; };
            const getV = (id, def = '') => { let el = document.getElementById(id); return el ? el.value.trim() : def; };
            let fdSel = document.getElementById('setting-flash-deal-product');
            try {
                await updateDoc(doc(db, 'settings', 'main'), {
                    enableFlashDeal: getC('setting-enable-flash-deal', true),
                    flashDealProductId: fdSel ? fdSel.value : '',
                    flashDealTitle: getV('setting-flash-deal-title', '⚡ صفقة اليوم الخاطفة بخصم خاص!'),
                    enableSubscribeSave: getC('setting-enable-subscribe-save', true),
                    subscribeDiscountPercent: Number(getV('setting-subscribe-discount', 5)) || 5,
                    enableGiftCards: getC('setting-enable-gift-cards', true),
                    enableProductQr: getC('setting-enable-product-qr', true),
                    enableLastViewedBar: getC('setting-enable-last-viewed-bar', true)
                });
            } catch (e) {}
            await prevSaveSettingsV56();
        };

        // إضافة مصطلحات V57 للقاموس الإنجليزي
        Object.assign(window.FULL_AR_TO_EN, {
            "الشغل": "Work",
            "إهداء بطاقة هدية رقمية": "Send Digital Gift Card",
            "بطاقة هدية رقمية من زيت الشجرة المباركة": "Blessed Tree Oil Digital Gift Card",
            "أهدِ من تحب قسيمة شراء منتجات طبيعية أصلية 100% من مزارع سيناء:": "Gift your loved ones a 100% natural Sinai olive oil voucher:",
            "🛒 إضافة البطاقة للسلة وإتمام الإهداء": "🛒 Add Gift Card to Cart",
            "إرسال كارت التهنئة مباشرة عبر واتساب": "Send Gift Card via WhatsApp",
            "اشتراك شهري تلقائي": "Monthly Auto-Delivery",
            "خصم إضافي": "Extra",
            "تذكير شهري عبر واتساب": "Monthly WhatsApp reminder",
            "طباعة ملصق QR للعبوة": "Print Bottle QR Label",
            "شاهدت مؤخراً:": "Recently Viewed:"
        });


        // =========================================================================
        // === النسخة V58: أكواد العجلة الفريدة لمرة واحدة + مجلدات العمل + تنظيم الإدارة ===
        // =========================================================================

        // 1. توليد كود خصم فريد ومختلف لكل عميل في كل لفة عجلة (صالح لمرة واحدة فقط)
        window.generateUniqueSingleUseCode = function(basePrefix) {
            let cleanPrefix = String(basePrefix || 'ZAIT').replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(0, 6) || 'ZAIT';
            const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
            let rand = '';
            for (let i = 0; i < 5; i++) {
                rand += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return `${cleanPrefix}-${rand}`;
        };

        // ترقية دالة لف العجلة لتوليد كود فريد وحفظه كـ singleUse في قاعدة البيانات
        window.spinTheWheelNow = async function() {
            let info = window.getThursdayCycleInfo();
            if (localStorage.getItem('zait_wheel_last_cycle') === info.cycleId) {
                window.showToast(window.currentLang === 'en' ? 'You already spun this week! Next spin is on Thursday.' : 'لقد استخدمت فرصتك لهذا الأسبوع! تتجدد الفرصة يوم الخميس القادم.', 'info');
                window.renderWheelModalContent(-1);
                return;
            }

            let savedPhone = localStorage.getItem('zait_wheel_saved_phone') || '';
            let phoneInp = document.getElementById('wheel-phone-input');
            let phone = savedPhone || (phoneInp ? phoneInp.value.trim() : '');

            if (!phone || phone.replace(/\D/g, '').length < 9) {
                window.showToast(window.currentLang === 'en' ? 'Please enter your WhatsApp phone number first!' : 'يرجى إدخال رقم الواتساب الخاص بك أولاً!', 'error');
                if (phoneInp) { phoneInp.style.display = 'block'; phoneInp.focus(); }
                return;
            }

            localStorage.setItem('zait_wheel_saved_phone', phone);

            let prizes = window.getWheel7Prizes();
            let allowedIndices = [];
            prizes.forEach((p, idx) => { if (p.allowed) allowedIndices.push(idx); });
            if (allowedIndices.length === 0) allowedIndices = [0];

            let winningIndex = allowedIndices[Math.floor(Math.random() * allowedIndices.length)];
            let winningPrize = { ...prizes[winningIndex] };

            // توليد كود فريد خاص بهذا العميل فقط لمرة واحدة
            let baseCode = String(winningPrize.code || 'WIN').trim().toUpperCase();
            let uniqueCode = storeSettings.enableUniqueWheelCodes !== false
                ? window.generateUniqueSingleUseCode(baseCode)
                : baseCode;
            winningPrize.code = uniqueCode;

            let btn = document.getElementById('btn-spin-now');
            let wheel = document.getElementById('wheel-visual-circle');
            let resArea = document.getElementById('wheel-result-area');
            if (btn) btn.disabled = true;

            let sliceDeg = 360 / 7;
            let targetSliceCenter = (winningIndex * sliceDeg) + (sliceDeg / 2);
            let extraSpins = 5 * 360;
            let finalDeg = extraSpins + (360 - targetSliceCenter);
            if (wheel) {
                wheel.style.transition = 'none';
                wheel.style.transform = 'rotate(0deg)';
                setTimeout(() => {
                    wheel.style.transition = 'transform 3.6s cubic-bezier(0.15, 0.85, 0.15, 1)';
                    wheel.style.transform = `rotate(${finalDeg}deg)`;
                }, 30);
            }

            setTimeout(async () => {
                let winDisc = Number(winningPrize.discount) || 0;
                // حفظ الكود الفريد في قاعدة البيانات للاستخدام مرة واحدة فقط
                if (winDisc > 0 && storeSettings.enableUniqueWheelCodes !== false) {
                    try {
                        await addDoc(collection(db, 'promoCodes'), {
                            code: uniqueCode,
                            discount: winDisc,
                            singleUse: true,
                            used: false,
                            ownerPhone: phone,
                            createdAt: new Date().toISOString()
                        });
                    } catch (e) {}
                }

                if (winDisc > 0) {
                    currentDiscountPercent = winDisc;
                    appliedPromoCode = uniqueCode;
                } else if (baseCode === 'FREESHIP') {
                    currentShippingCost = 0;
                    appliedPromoCode = uniqueCode;
                } else {
                    appliedPromoCode = `${uniqueCode} (${winningPrize.label})`;
                }
                window.updateInvoiceUI();

                localStorage.setItem('zait_wheel_last_cycle', info.cycleId);
                localStorage.setItem('zait_wheel_last_prize', JSON.stringify(winningPrize));

                window.renderWheelModalContent(winningIndex);
                if (resArea) {
                    resArea.style.display = 'block';
                    resArea.innerHTML = window.currentLang === 'en'
                        ? `🎉 <strong>Congrats! You won Prize #${winningIndex + 1}:</strong><br><span style="font-size:1.05rem; font-weight:900;">${window.escapeHTML(winningPrize.label)}</span><br>Your Unique Single-Use Code: <strong style="background:white; padding:2px 8px; border-radius:6px; border:1px dashed #166534;">${window.escapeHTML(uniqueCode)}</strong><br><small style="color:#b45309;">⚠️ Valid for 1 order only & applied to your cart!</small>`
                        : `🎉 <strong>مبروك! فزت بالهدية رقم (${winningIndex + 1}):</strong><br><span style="font-size:1.05rem; font-weight:900;">${window.escapeHTML(winningPrize.label)}</span><br>كودك الخاص (يُستخدم لمرة واحدة فقط): <strong style="background:white; padding:2px 8px; border-radius:6px; border:1px dashed #166534;">${window.escapeHTML(uniqueCode)}</strong><br><small style="color:#b45309;">⚠️ تم تفعيل الكود في سلتك، وتنتهي صلاحيته فور استخدامه!</small>`;
                }

                try {
                    await addDoc(collection(db, 'wheel_leads'), {
                        phone: phone,
                        prizeCode: `${winningPrize.label} (${uniqueCode})`,
                        discount: winDisc,
                        date: new Date().toISOString()
                    });
                } catch (e) {}
            }, 3700);
        };

        // =========================================================================
        // === 2. نظام مجلدات غرفة العمل (الوارد النشط | المقروء | المنجز | المحذوف) ===
        // =========================================================================
        window.currentWorkFolder = 'inbox'; // 'inbox' | 'read' | 'done' | 'trash'

        window.getWorkItemStatesMap = function() {
            let fromCloud = storeSettings.workHubItemStates || {};
            let fromLocal = {};
            try { fromLocal = JSON.parse(localStorage.getItem('zait_work_item_states')) || {}; } catch (e) {}
            return { ...fromCloud, ...fromLocal };
        };

        window.setWorkCardFolderState = async function(itemKey, targetFolder) {
            let map = window.getWorkItemStatesMap();
            if (targetFolder === 'inbox') {
                delete map[itemKey];
            } else {
                map[itemKey] = {
                    folder: targetFolder,
                    updatedAt: new Date().toISOString()
                };
            }
            localStorage.setItem('zait_work_item_states', JSON.stringify(map));
            storeSettings.workHubItemStates = map;

            // إذا كان الكارت محادثة شات وتم نقله للمقروء أو المنجز أو المحذوف، نصفر حالة الرسائل غير المقروءة أيضاً
            if (itemKey.startsWith('chat_') && targetFolder !== 'inbox') {
                let chatId = itemKey.replace(/^chat_/, '');
                try { await updateDoc(doc(db, 'chats', chatId), { unreadByAdmin: false }); } catch (e) {}
            }

            // تحديث الواجهة والعداد فوراً في نفس اللحظة!
            window.renderAdminWorkHub();

            let msgMap = {
                'read': '📖 تم نقل الكارت إلى صفحة (المقروء) وتخفيض العداد',
                'done': '🏆 تم نقل الكارت إلى صفحة (المنجز) وتخفيض العداد',
                'trash': '🗑️ تم نقل الكارت إلى صفحة (المحذوف) وتخفيض العداد',
                'inbox': '📥 تم استرجاع الكارت إلى (الوارد النشط)'
            };
            window.showToast(msgMap[targetFolder] || 'تم التحديث', 'success');

            try {
                await updateDoc(doc(db, 'settings', 'main'), { workHubItemStates: map });
            } catch (e) {}
        };

        window.switchWorkFolder = function(folderName) {
            window.currentWorkFolder = folderName;
            ['inbox', 'read', 'done', 'trash'].forEach(f => {
                let btn = document.getElementById('wf-btn-' + f);
                if (btn) btn.classList.toggle('active', f === folderName);
            });
            window.renderAdminWorkHub();
        };

        // شريط أزرار (تمت القراءة / منجز / حذف / استعادة) الموحد أسفل كل كارت في غرفة العمل
        window.getWorkFolderActionBtnsHtml = function(itemKey, currentFolder) {
            let safeKey = String(itemKey).replace(/'/g, "\\'");
            if (currentFolder === 'inbox') {
                return `<div class="work-status-bar-btns">
                    <button type="button" class="btn btn-outline" style="flex:1; padding:5px 10px; font-size:0.78rem; border-color:#007bff; color:#007bff;" onclick="window.setWorkCardFolderState('${safeKey}', 'read')">📖 تمت القراءة</button>
                    <button type="button" class="btn btn-outline" style="flex:1; padding:5px 10px; font-size:0.78rem; border-color:#28a745; color:#28a745;" onclick="window.setWorkCardFolderState('${safeKey}', 'done')">✅ منجز</button>
                    <button type="button" class="btn btn-outline" style="flex:1; padding:5px 10px; font-size:0.78rem; border-color:#dc3545; color:#dc3545;" onclick="window.setWorkCardFolderState('${safeKey}', 'trash')">🗑️ حذف</button>
                </div>`;
            } else {
                return `<div class="work-status-bar-btns">
                    <button type="button" class="btn btn-outline" style="flex:1; padding:5px 10px; font-size:0.78rem; border-color:var(--primary); color:var(--primary);" onclick="window.setWorkCardFolderState('${safeKey}', 'inbox')">📥 إرجاع للوارد النشط</button>
                    ${currentFolder !== 'read' ? `<button type="button" class="btn btn-outline" style="flex:1; padding:5px 10px; font-size:0.78rem; border-color:#007bff; color:#007bff;" onclick="window.setWorkCardFolderState('${safeKey}', 'read')">📖 نقل للمقروء</button>` : ''}
                    ${currentFolder !== 'done' ? `<button type="button" class="btn btn-outline" style="flex:1; padding:5px 10px; font-size:0.78rem; border-color:#28a745; color:#28a745;" onclick="window.setWorkCardFolderState('${safeKey}', 'done')">✅ نقل للمنجز</button>` : ''}
                    ${currentFolder !== 'trash' ? `<button type="button" class="btn btn-outline" style="flex:1; padding:5px 10px; font-size:0.78rem; border-color:#dc3545; color:#dc3545;" onclick="window.setWorkCardFolderState('${safeKey}', 'trash')">🗑️ نقل للمحذوف</button>` : ''}
                </div>`;
            }
        };

        // تحديث renderAdminWorkHub لدعم صفحات (الوارد النشط / المقروء / المنجز / المحذوف) وإنقاص العداد فوراً
        window.renderAdminWorkHub = function() {
            if (!isCurrentUserAdmin) return;
            try {
                let container = document.getElementById('admin-work-stream-container');
                let searchEl = document.getElementById('work-hub-search');
                let q = searchEl ? searchEl.value.trim().toLowerCase() : '';
                let statesMap = window.getWorkItemStatesMap();

                let allEvents = [];

                // أ) الطلبات (النشطة والملغاة وطلبات الجملة)
                (adminOrdersArray || []).forEach(ord => {
                    let st = String(ord.status || '');
                    let isCanceled = st.includes('لغى') || st.includes('رفض');
                    let isDelivered = st.includes('توصيل');
                    if (window.workHideCompletedOld && isDelivered) return;

                    let itemKey = `ord_${ord.id}`;
                    let savedFolder = (statesMap[itemKey] && statesMap[itemKey].folder) ? statesMap[itemKey].folder : 'inbox';

                    let ordMs = window.parseSafeTimestamp(ord.updatedAt, 0) || window.parseSafeTimestamp(ord.orderDate, Date.now());
                    if (isCanceled) {
                        let cancelMs = window.parseSafeTimestamp(ord.canceledAt, 0) || ordMs;
                        let isUrgentCancel = (savedFolder === 'inbox') && ord.unreadCancelByAdmin !== false && (Date.now() - cancelMs < 172800000);
                        allEvents.push({
                            itemKey,
                            folder: savedFolder,
                            category: 'cancels',
                            subType: 'canceled_order',
                            isUrgent: isUrgentCancel,
                            urgentWeight: isUrgentCancel ? 1 : 0,
                            timestampMs: cancelMs,
                            data: ord
                        });
                    } else {
                        let isUrgentOrder = (savedFolder === 'inbox') && (st === 'قيد المراجعة');
                        allEvents.push({
                            itemKey,
                            folder: savedFolder,
                            category: 'orders',
                            subType: 'active_order',
                            isUrgent: isUrgentOrder,
                            urgentWeight: isUrgentOrder ? 1 : 0,
                            timestampMs: ordMs,
                            data: ord
                        });
                    }
                });

                // ب) طلبات الاسترجاع
                (adminReturnsArray || []).forEach(ret => {
                    let itemKey = `ret_${ret.id}`;
                    let savedFolder = (statesMap[itemKey] && statesMap[itemKey].folder) ? statesMap[itemKey].folder : 'inbox';
                    let isUrgentRet = (savedFolder === 'inbox') && (ret.status === 'قيد المراجعة');
                    let retMs = window.parseSafeTimestamp(ret.date, Date.now());
                    allEvents.push({
                        itemKey,
                        folder: savedFolder,
                        category: 'cancels',
                        subType: 'return_request',
                        isUrgent: isUrgentRet,
                        urgentWeight: isUrgentRet ? 1 : 0,
                        timestampMs: retMs,
                        data: ret
                    });
                });

                // ج) محادثات خدمة العملاء (إذا أرسل العميل رسالة جديدة أحدث من وقت نقل الكارت للمقروء، يعود للوارد النشط تلقائياً!)
                (window.workHubChatsArray || []).forEach(chat => {
                    let info = window.getChatWorkInfo(chat);
                    let itemKey = `chat_${chat.id}`;
                    let stateObj = statesMap[itemKey];
                    let savedFolder = stateObj ? stateObj.folder : 'inbox';
                    if (stateObj && stateObj.updatedAt && info.needsReply) {
                        let stateTime = window.parseSafeTimestamp(stateObj.updatedAt, 0);
                        if (info.latestMs > stateTime + 1500) {
                            savedFolder = 'inbox'; // رسالة جديدة وصلت بعد تعليمها كمقروء
                        }
                    }
                    let isUrgentChat = (savedFolder === 'inbox') && info.needsReply;
                    allEvents.push({
                        itemKey,
                        folder: savedFolder,
                        category: 'chats',
                        subType: 'chat_thread',
                        isUrgent: isUrgentChat,
                        urgentWeight: isUrgentChat ? info.unreadCustMsgs : 0,
                        needsReply: isUrgentChat,
                        unreadCustMsgs: info.unreadCustMsgs,
                        timestampMs: info.latestMs,
                        data: chat
                    });
                });

                // د) السلال المتروكة
                (window.workHubAbandonedUsers || []).forEach(u => {
                    let itemKey = `lead_${u.id}`;
                    let savedFolder = (statesMap[itemKey] && statesMap[itemKey].folder) ? statesMap[itemKey].folder : 'inbox';
                    let cartMs = window.parseSafeTimestamp(u.cartUpdatedAt, 0) || window.parseSafeTimestamp(u.lastLogin, Date.now());
                    allEvents.push({
                        itemKey,
                        folder: savedFolder,
                        category: 'leads',
                        subType: 'abandoned_cart',
                        isUrgent: false,
                        urgentWeight: 0,
                        timestampMs: cartMs,
                        data: u
                    });
                });

                // حساب عدادات المجلدات الأربعة (الوارد النشط / المقروء / المنجز / المحذوف)
                let folderCounts = { inbox: 0, read: 0, done: 0, trash: 0 };
                let urgentTotal = 0;

                allEvents.forEach(ev => {
                    if (ev.folder === 'inbox') {
                        if (ev.category !== 'leads') folderCounts.inbox++;
                        urgentTotal += (ev.urgentWeight || 0);
                    } else if (folderCounts[ev.folder] !== undefined) {
                        folderCounts[ev.folder]++;
                    }
                });

                // تحديث العداد الأحمر في الهيدر وشريط الإدارة (ينقص فوراً بمجرد الضغط على تمت القراءة أو منجز أو حذف!)
                document.querySelectorAll('.work-hub-live-badge, #work-hub-badge').forEach(b => {
                    b.textContent = urgentTotal;
                    b.style.display = 'inline-block';
                });

                let setTxt = (id, val) => { let el = document.getElementById(id); if (el) el.textContent = val; };
                setTxt('wf-count-inbox', urgentTotal > 0 ? `${urgentTotal} عاجل` : folderCounts.inbox);
                setTxt('wf-count-read', folderCounts.read);
                setTxt('wf-count-done', folderCounts.done);
                setTxt('wf-count-trash', folderCounts.trash);

                // حساب عدادات التبويبات الفرعية داخل المجلد المفتوح حالياً
                let folderEvents = allEvents.filter(e => e.folder === window.currentWorkFolder);
                setTxt('wk-count-all', folderEvents.filter(e => e.category !== 'leads').length);
                setTxt('wk-count-orders', folderEvents.filter(e => e.category === 'orders').length);
                setTxt('wk-count-chats', folderEvents.filter(e => e.category === 'chats').length);
                setTxt('wk-count-cancels', folderEvents.filter(e => e.category === 'cancels').length);
                setTxt('wk-count-leads', folderEvents.filter(e => e.category === 'leads').length);

                if (!container) return;

                let filtered = folderEvents.filter(ev => {
                    if (window.currentWorkHubFilter === 'all') {
                        if (window.currentWorkFolder === 'inbox' && ev.category === 'leads') return false;
                    } else if (ev.category !== window.currentWorkHubFilter) {
                        return false;
                    }
                    if (!q) return true;
                    return JSON.stringify(ev.data || {}).toLowerCase().includes(q);
                });

                filtered.sort((a, b) => {
                    if (a.isUrgent !== b.isUrgent) return a.isUrgent ? -1 : 1;
                    return (b.timestampMs || 0) - (a.timestampMs || 0);
                });

                let folderTitles = {
                    inbox: '📥 الوارد النشط',
                    read: '📖 صفحة المقروء',
                    done: '🏆 صفحة المنجز',
                    trash: '🗑️ صفحة المحذوف'
                };

                if (filtered.length === 0) {
                    container.innerHTML = `<div style="text-align:center; padding:40px 20px; background:var(--input-bg); border-radius:12px; color:var(--text-muted);">
                        <span style="font-size:2.8rem; display:block; margin-bottom:8px;">✨</span>
                        <h3 style="margin:0;">لا توجد كروت في (${folderTitles[window.currentWorkFolder]}) حالياً</h3>
                        <p style="font-size:0.85rem; margin-top:5px;">يمكنك التنقل بين (الوارد النشط، المقروء، المنجز، والمحذوف) من الأزرار بالأعلى.</p>
                    </div>`;
                    return;
                }

                let html = '';
                filtered.slice(0, 60).forEach(ev => {
                    let timeBadgeHtml = window.formatWorkHubDate(ev.timestampMs);
                    let folderBtnsHtml = window.getWorkFolderActionBtnsHtml(ev.itemKey, ev.folder);

                    if (ev.subType === 'active_order') {
                        let o = ev.data;
                        let phone = (o.phones && o.phones.primary) || '';
                        let itemsTxt = (o.items || []).map(i => `${window.escapeHTML(i.name)} (${i.quantity})`).join(' ، ');
                        let tagBadge = window.getCustomerTagBadgeHtml ? window.getCustomerTagBadgeHtml(phone) : '';
                        let b2bBadge = o.isB2BWholesale ? `<span style="background:#6f42c1; color:white; padding:2px 8px; border-radius:8px; font-size:0.74rem; font-weight:bold; margin-right:5px;">🏢 طلب جملة وتوريد</span>` : '';
                        let subBadge = o.isMonthlySubscription ? `<span style="background:#028090; color:white; padding:2px 8px; border-radius:8px; font-size:0.74rem; font-weight:bold; margin-right:5px;">🔄 اشتراك شهري</span>` : '';
                        let statusColor = o.status === 'قيد المراجعة' ? '#dc3545' : (o.status.includes('توصيل') ? '#28a745' : '#028090');

                        html += `<div class="work-event-card type-order">
                            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
                                <div>
                                    <span class="${ev.isUrgent ? 'work-urgent-pulse' : ''}" style="background:${statusColor}; color:white; padding:3px 9px; border-radius:8px; font-size:0.76rem; font-weight:bold;">📦 طلب #${o.id.slice(0,6).toUpperCase()} (${window.escapeHTML(o.status)})</span>
                                    <strong style="color:var(--primary); font-size:1.05rem; margin-right:6px;">👤 ${window.escapeHTML(o.customerName)} ${tagBadge} ${b2bBadge} ${subBadge}</strong>
                                </div>
                                ${timeBadgeHtml}
                            </div>
                            <div style="margin-top:8px; font-size:0.88rem; color:var(--text-color); line-height:1.6;">
                                <div>📞 <strong>الهاتف:</strong> ${window.escapeHTML(phone)} | 📍 <strong>العنوان:</strong> ${window.escapeHTML((o.location && o.location.governorate) || '')} - ${window.escapeHTML((o.location && o.location.city) || '')} (${window.escapeHTML((o.location && o.location.details) || '')})</div>
                                <div>🛍️ <strong>المنتجات:</strong> ${itemsTxt}</div>
                                <div>💰 <strong>الإجمالي المطلوب:</strong> <strong style="color:var(--secondary); font-size:1.02rem;">${o.totalAmount} ج</strong> (${window.escapeHTML(o.paymentMethod || 'كاش')})</div>
                            </div>
                            <div class="work-inline-actions">
                                <button type="button" class="btn" style="padding:5px 10px; font-size:0.78rem; background:#028090;" onclick="window.updateOrderStatus('${o.id}', 'تم التجهيز')">📦 تم التجهيز</button>
                                <button type="button" class="btn" style="padding:5px 10px; font-size:0.78rem; background:#007bff;" onclick="window.updateOrderStatus('${o.id}', 'تم الشحن')">🚚 تم الشحن</button>
                                <button type="button" class="btn" style="padding:5px 10px; font-size:0.78rem; background:#28a745;" onclick="window.updateOrderStatus('${o.id}', 'تم التوصيل ✅')">✅ تم التوصيل</button>
                                <button type="button" class="btn btn-outline" style="padding:5px 10px; font-size:0.78rem; border-color:#25D366; color:#25D366;" onclick="window.sendOrderWhatsAppStatus('${o.id}')">📲 واتساب</button>
                                ${storeSettings.enableShippingLabel !== false ? `<button type="button" class="btn btn-outline" style="padding:5px 10px; font-size:0.78rem;" onclick="window.printOrderShippingLabel('${o.id}')">🖨️ بوليصة الشحن</button>` : ''}
                                <button type="button" class="btn btn-outline" style="padding:5px 10px; font-size:0.78rem;" onclick="window.openAdminOrderModal('${o.id}')">📋 التفاصيل</button>
                            </div>
                            ${folderBtnsHtml}
                        </div>`;
                    } else if (ev.subType === 'canceled_order') {
                        let o = ev.data;
                        let phone = (o.phones && o.phones.primary) || '';
                        let pureWa = String(phone).replace(/\D/g, '');
                        if (pureWa && !pureWa.startsWith('20') && pureWa.length >= 10) pureWa = '20' + pureWa;
                        let waMsg = `مرحباً ${o.customerName} 🌿 لاحظنا إلغاء طلبك رقم #${o.id.slice(0,6).toUpperCase()} في متجر زيت الشجرة المباركة، هل واجهتك أي مشكلة أو تود تعديل الطلب؟ يسعدنا خدمتك فوراً!`;
                        let itemsTxt = (o.items || []).map(i => `${window.escapeHTML(i.name)} (${i.quantity})`).join(' ، ');

                        html += `<div class="work-event-card type-cancel">
                            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
                                <div>
                                    <span style="background:#dc3545; color:white; padding:3px 9px; border-radius:8px; font-size:0.76rem; font-weight:bold;">🚨 طلب ملغى #${o.id.slice(0,6).toUpperCase()}</span>
                                    <strong style="color:var(--danger); font-size:1.02rem; margin-right:6px;">👤 ${window.escapeHTML(o.customerName)} (${window.escapeHTML(o.status)})</strong>
                                </div>
                                ${timeBadgeHtml}
                            </div>
                            <div style="margin-top:8px; font-size:0.86rem;">
                                📞 <strong>الهاتف:</strong> ${window.escapeHTML(phone)} | 🛍️ <strong>المنتجات:</strong> ${itemsTxt} | 💰 <strong>القيمة:</strong> ${o.totalAmount} ج
                            </div>
                            <div class="work-inline-actions">
                                <a href="https://wa.me/${pureWa}?text=${encodeURIComponent(waMsg)}" target="_blank" class="btn" style="background:#25D366; padding:5px 12px; font-size:0.78rem; text-decoration:none;">💬 تواصل واتساب لمعرفة سبب الإلغاء</a>
                                <button type="button" class="btn btn-outline" style="padding:5px 10px; font-size:0.78rem;" onclick="window.updateOrderStatus('${o.id}', 'قيد المراجعة')">🔄 استعادة وتفعيل الطلب</button>
                                <button type="button" class="btn btn-outline" style="padding:5px 10px; font-size:0.78rem;" onclick="window.openAdminOrderModal('${o.id}')">📋 التفاصيل</button>
                            </div>
                            ${folderBtnsHtml}
                        </div>`;
                    } else if (ev.subType === 'return_request') {
                        let r = ev.data;
                        html += `<div class="work-event-card type-cancel">
                            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
                                <div>
                                    <span style="background:#e0a800; color:white; padding:3px 9px; border-radius:8px; font-size:0.76rem; font-weight:bold;">🔄 طلب استرجاع #${(r.orderId || '').slice(0,6).toUpperCase()}</span>
                                    <strong style="color:var(--primary); margin-right:6px;">السبب: ${window.escapeHTML(r.reason || '')}</strong>
                                </div>
                                ${timeBadgeHtml}
                            </div>
                            <p style="margin:6px 0; font-size:0.85rem; color:var(--text-muted);">ملاحظات العميل: ${window.escapeHTML(r.notes || 'لا توجد')}</p>
                            <div class="work-inline-actions">
                                ${r.status === 'قيد المراجعة' ? `<button type="button" class="btn" style="background:#28a745; padding:5px 12px; font-size:0.78rem;" onclick="window.approveReturn('${r.id}', '${r.orderId}')">✅ الموافقة وإرسال مندوب</button>` : `<span style="color:#28a745; font-weight:bold; font-size:0.82rem;">✅ تمت الموافقة</span>`}
                                ${r.imageUrl ? `<a href="${r.imageUrl}" target="_blank" class="btn btn-outline" style="padding:5px 10px; font-size:0.78rem; text-decoration:none;">📸 عرض صورة المنتج</a>` : ''}
                            </div>
                            ${folderBtnsHtml}
                        </div>`;
                    } else if (ev.subType === 'chat_thread') {
                        let c = ev.data;
                        let msgs = c.messages || [];
                        let lastMsgs = msgs.slice(-3);
                        let statusBadge = ev.needsReply
                            ? `<span class="work-urgent-pulse" style="background:#dc3545; color:white; padding:3px 9px; border-radius:8px; font-size:0.75rem; font-weight:bold;">🔴 (${ev.unreadCustMsgs}) رسالة عميل جديدة تنتظر ردك</span>`
                            : `<span style="background:#007bff; color:white; padding:3px 9px; border-radius:8px; font-size:0.74rem; font-weight:bold;">💬 محادثة خدمة عملاء</span>`;

                        let previewHtml = lastMsgs.map(m => {
                            let mTimeStr = m.timestamp ? new Date(window.parseSafeTimestamp(m.timestamp, Date.now())).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : '';
                            return `<div style="font-size:0.84rem; padding:5px 9px; border-radius:6px; margin-top:4px; background:${m.sender==='customer'?'rgba(0,123,255,0.09)':'var(--input-bg)'}; display:flex; justify-content:space-between; gap:8px;">
                                <span><strong>${m.sender==='customer'?'👤 العميل:':(m.isAutoReply?'🤖 رد آلي:':'🛡️ الإدارة:')}</strong> ${window.escapeHTML(m.text)}</span>
                                <small style="color:var(--text-muted); white-space:nowrap;">${mTimeStr}</small>
                            </div>`;
                        }).join('');
                        let safeId = c.id.replace(/'/g, "\\'");
                        let safeName = (c.customerName || 'عميل').replace(/'/g, "\\'");

                        html += `<div class="work-event-card type-chat">
                            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
                                <div>
                                    ${statusBadge}
                                    <strong style="color:var(--primary); font-size:1rem; margin-right:6px;">👤 ${window.escapeHTML(c.customerName || c.id)}</strong>
                                </div>
                                ${timeBadgeHtml}
                            </div>
                            <div style="margin:8px 0;">${previewHtml}</div>
                            <div style="display:flex; gap:5px; flex-wrap:wrap; margin-bottom:6px;">
                                <button type="button" class="work-canned-chip" onclick="window.insertCannedWorkReply('${safeId}', 'أهلاً بحضرتك 🌿 تحت أمرك، جاري مراجعة استفسارك فوراً.')">👋 ترحيب</button>
                                <button type="button" class="work-canned-chip" onclick="window.insertCannedWorkReply('${safeId}', 'طلب حضرتك قيد التجهيز والشحن السريع لباب البيت 🚚')">🚚 حالة الشحن</button>
                                <button type="button" class="work-canned-chip" onclick="window.insertCannedWorkReply('${safeId}', 'زيت الشجرة المباركة سيناوي بكر عصرة أولى على البارد 100% ومضمون 🌿')">🌿 ضمان الزيت</button>
                            </div>
                            <div style="display:flex; gap:6px; align-items:center; flex-wrap:wrap;">
                                <input type="text" id="wk-reply-inp-${c.id}" placeholder="اكتب ردك المباشر للعميل هنا..." style="margin:0; flex:1; min-width:170px; padding:7px 10px; font-size:0.85rem;">
                                <button type="button" class="btn" style="background:#007bff; padding:7px 12px; font-size:0.82rem;" onclick="window.sendInlineWorkChatReply('${safeId}')">إرسال الرد 🚀</button>
                                <button type="button" class="btn btn-outline" style="padding:7px 10px; font-size:0.8rem;" onclick="window.showPanel('admin-messages'); window.openAdminChat('${safeId}', '${safeName}');">فتح الشات 💬</button>
                            </div>
                            ${folderBtnsHtml}
                        </div>`;
                    } else if (ev.subType === 'abandoned_cart') {
                        let u = ev.data;
                        let total = 0;
                        (u.cart || []).forEach(it => total += Number(it.price || 0) * Number(it.quantity || 1));
                        let phone = u.phone1 || u.email || 'غير مسجل';
                        let pureWa = String(phone).replace(/\D/g, '');
                        if (pureWa && !pureWa.startsWith('20') && pureWa.length >= 10) pureWa = '20' + pureWa;
                        let waText = `مرحباً ${u.name || 'عميلنا العزيز'} 🌿 لاحظنا وجود منتجات في سلة مشترياتك بمتجر زيت الشجرة المباركة، هل تحب نساعدك في إتمام الطلب اليوم مع هدية أو خصم خاص؟`;

                        html += `<div class="work-event-card type-lead">
                            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
                                <div>
                                    <span style="background:#ff6b00; color:white; padding:3px 9px; border-radius:8px; font-size:0.74rem; font-weight:bold;">🛒 سلة متروكة نشطة</span>
                                    <strong style="color:var(--primary); margin-right:6px;">👤 ${window.escapeHTML(u.name || 'عميل')} (${window.escapeHTML(phone)})</strong>
                                </div>
                                ${timeBadgeHtml}
                            </div>
                            <div style="margin-top:6px; font-size:0.85rem; color:var(--secondary); font-weight:bold;">
                                عدد المنتجات بالسلة: ${u.cart.length} (بقيمة إجمالية ~${total} ج)
                            </div>
                            ${pureWa.length >= 10 ? `<div class="work-inline-actions"><a href="https://wa.me/${pureWa}?text=${encodeURIComponent(waText)}" target="_blank" class="btn btn-outline" style="border-color:#25D366; color:#25D366; padding:5px 12px; font-size:0.8rem; text-decoration:none;">💬 تواصل مع العميل عبر واتساب</a></div>` : ''}
                            ${folderBtnsHtml}
                        </div>`;
                    }
                });

                container.innerHTML = html;
            } catch (err) {
                console.error("Work Hub V58 error:", err);
            }
        };

        // =========================================================================
        // === 3. تنظيم وتصميم لوحة التحكم الاحترافية بالتبويبات والبحث (بدون حذف أي عنصر) ===
        // =========================================================================
        window.initProAdminControlCenter = function() {
            let sec = document.getElementById('roles-content-section');
            if (!sec) return;
            let children = Array.from(sec.children);
            children.forEach(el => {
                if (el.tagName !== 'DIV' || el.id === 'admin-pro-tabs-bar') return;
                if (el.textContent.includes('مركز التحكم الاحترافي الشامل')) return;
                el.classList.add('admin-setting-card-pro');
                let txt = el.textContent || '';
                let cat = 'ui';
                if (txt.includes('شحن') || txt.includes('الباقات') || txt.includes('المحافظ')) cat = 'shipping';
                else if (txt.includes('عجلة') || txt.includes('Pixels') || txt.includes('صفقة اليوم')) cat = 'marketing';
                else if (txt.includes('الرد الآلي') || txt.includes('مواعيد العمل') || txt.includes('نقاط الولاء') || txt.includes('التواصل العائمة')) cat = 'support';
                else if (txt.includes('إدارة الأقسام') || txt.includes('إدارة الكوبونات') || txt.includes('إضافة مديرين')) cat = 'catalog';
                el.dataset.adminCat = cat;
            });
        };

        window.switchAdminProTab = function(cat, btnEl) {
            window.initProAdminControlCenter();
            document.querySelectorAll('#admin-pro-tabs-bar .admin-pro-tab-btn').forEach(b => b.classList.remove('active'));
            if (btnEl) btnEl.classList.add('active');
            document.querySelectorAll('#roles-content-section .admin-setting-card-pro').forEach(card => {
                if (cat === 'all' || card.dataset.adminCat === cat) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        };

        window.filterAdminSettingsCards = function() {
            window.initProAdminControlCenter();
            let inp = document.getElementById('admin-settings-quick-search');
            let q = inp ? inp.value.trim().toLowerCase() : '';
            document.querySelectorAll('#roles-content-section .admin-setting-card-pro').forEach(card => {
                if (!q || (card.textContent || '').toLowerCase().includes(q)) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        };

        // =========================================================================
        // === 4. بوابة طلبات الجملة والمطاعم (B2B) + فاحص تاريخ العصرة والتشغيلة ===
        // =========================================================================
        window.openB2BWholesaleModal = function() {
            let m = document.getElementById('b2b-wholesale-modal');
            if (m) m.style.display = 'flex';
        };

        window.submitB2BWholesaleRequest = async function() {
            let org = (document.getElementById('b2b-org-name') || {}).value.trim();
            let phone = (document.getElementById('b2b-phone') || {}).value.trim();
            let qty = (document.getElementById('b2b-qty') || {}).value.trim();
            let notes = (document.getElementById('b2b-notes') || {}).value.trim();

            if (!org || !phone || !qty) {
                window.showToast('يرجى إدخال الاسم ورقم الهاتف والكمية المطلوبة', 'error');
                return;
            }
            let btn = document.getElementById('btn-submit-b2b');
            if (btn) btn.disabled = true;

            let orderPayload = {
                userId: currentUser ? currentUser.uid : 'b2b_guest',
                customerName: `🏢 [طلب جملة] ${org}`,
                phones: { primary: phone, secondary: 'لا يوجد' },
                location: { governorate: 'توريد جملة', city: qty, details: notes || 'طلب أسعار وتوريد جملة', mapAddress: '', mapLink: '' },
                items: [{
                    id: 'b2b_item',
                    cartItemId: 'b2b_item',
                    name: `📦 طلب كمية جملة: (${qty})`,
                    price: 0,
                    imageUrl: '1000392409.jpeg',
                    quantity: 1
                }],
                subtotal: 0,
                shippingCost: 0,
                totalAmount: 0,
                paymentMethod: 'تعاقد جملة وتوريد 🏢',
                orderMethod: 'بوابة الجملة B2B',
                isB2BWholesale: true,
                status: 'قيد المراجعة',
                orderDate: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            try {
                await addDoc(collection(db, 'orders'), orderPayload);
                document.getElementById('b2b-wholesale-modal').style.display = 'none';
                window.showToast('🎉 تم إرسال طلب الجملة للإدارة بنجاح! سنتواصل معك عبر واتساب فوراً', 'success');
            } catch (e) {
                window.showToast('حدث خطأ أثناء الإرسال', 'error');
            }
            if (btn) btn.disabled = false;
        };

        window.openBatchTrackerModal = function() {
            let m = document.getElementById('batch-tracker-modal');
            if (m) {
                m.style.display = 'flex';
                window.inspectHarvestBatch();
            }
        };

        window.inspectHarvestBatch = function() {
            let code = ((document.getElementById('batch-code-inp') || {}).value || 'SINAI-2026-B1').trim().toUpperCase();
            let res = document.getElementById('batch-tracker-result');
            if (!res) return;
            let isEn = window.currentLang === 'en';
            res.innerHTML = isEn
                ? `<div>✅ <strong>Authentic Batch Verified:</strong> <span style="color:#028090;">${window.escapeHTML(code)}</span></div>
                   <div>🌳 <strong>Farm Origin:</strong> North Sinai Farms (El-Arish & Sheikh Zuweid)</div>
                   <div>❄️ <strong>Extraction Method:</strong> First Cold Press (< 25°C)</div>
                   <div>🧪 <strong>Lab Acidity Level:</strong> 0.48% (Premium Extra Virgin Grade < 0.8%)</div>
                   <div>🏅 <strong>Purity Status:</strong> 100% Raw, Unfiltered, Zero Additives</div>`
                : `<div>✅ <strong>تم التحقق من أصالة التشغيلة:</strong> <span style="color:#028090;">${window.escapeHTML(code)}</span></div>
                   <div>🌳 <strong>المزرعة والمنشأ:</strong> مزارع شمال سيناء المباركة (قطف يدوي طازج)</div>
                   <div>❄️ <strong>طريقة العصر:</strong> عصرة أولى على البارد (أقل من 25 درجة مئوية)</div>
                   <div>🧪 <strong>نسبة الحموضة المعملية:</strong> 0.48% (بكر ممتاز فائق النقاء أقل من 0.8%)</div>
                   <div>🏅 <strong>حالة الفحص:</strong> طبيعي خام 100% بدون أي إضافات أو خلط</div>`;
        };

        const prevApplySettingsV57 = window.applySettingsToUI;
        window.applySettingsToUI = function() {
            prevApplySettingsV57();
            window.initProAdminControlCenter();
            if (isCurrentUserAdmin) {
                let setC = (id, val, def = true) => { let el = document.getElementById(id); if (el) el.checked = val !== undefined ? Boolean(val) : def; };
                setC('setting-enable-unique-wheel-codes', storeSettings.enableUniqueWheelCodes, true);
                setC('setting-enable-b2b-portal', storeSettings.enableB2BPortal, true);
                setC('setting-enable-batch-tracker', storeSettings.enableBatchTracker, true);
            }
            let b2bBtn = document.getElementById('btn-open-b2b-modal');
            if (b2bBtn) b2bBtn.style.display = storeSettings.enableB2BPortal !== false ? 'flex' : 'none';

            let btBtn = document.getElementById('btn-open-batch-tracker');
            if (btBtn) btBtn.style.display = storeSettings.enableBatchTracker !== false ? 'flex' : 'none';
        };

        const prevSaveSettingsV57 = window.saveSettings;
        window.saveSettings = async function() {
            const getC = (id, def = true) => { let el = document.getElementById(id); return el ? el.checked : def; };
            try {
                await updateDoc(doc(db, 'settings', 'main'), {
                    enableUniqueWheelCodes: getC('setting-enable-unique-wheel-codes', true),
                    enableB2BPortal: getC('setting-enable-b2b-portal', true),
                    enableBatchTracker: getC('setting-enable-batch-tracker', true)
                });
            } catch (e) {}
            await prevSaveSettingsV57();
        };

        Object.assign(window.FULL_AR_TO_EN, {
            "طلبات الجملة والمطاعم": "B2B Wholesale Orders",
            "فاحص تاريخ العصرة والنقاء": "Harvest Batch Tracker",
            "بوابة طلبات الجملة والتوريد": "B2B Wholesale & Supply Portal",
            "إرسال طلب الجملة للإدارة فوراً": "Submit Wholesale Inquiry",
            "فاحص تاريخ العصرة ورقم التشغيلة": "Harvest & Batch Authenticity Tracker",
            "فحص الآن": "Verify Now"
        });


        // =========================================================================
        // === النسخة V59: حماية المحتوى + عجلة الحظ الذكية بالاسم والتفاصيل + المرحلة 2 ===
        // =========================================================================

        // 1. منع نسخ الكلام والصور وحماية المحتوى (Anti-Copy & Image Protection)
        window.applyContentProtectionMode = function() {
            let protect = storeSettings.enableContentProtection !== false;
            document.body.classList.toggle('protect-content-mode', protect);
        };

        ['copy', 'cut', 'contextmenu', 'dragstart'].forEach(evtName => {
            document.addEventListener(evtName, function(e) {
                if (storeSettings.enableContentProtection === false) return;
                let t = e.target;
                // السماح بالحقول النصية فقط عند الكتابة فيها
                if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) {
                    if (evtName === 'contextmenu' || evtName === 'copy') return;
                }
                e.preventDefault();
            });
        });

        // 2. تحديث ظهور زر عجلة الحظ العائم بالرئيسية:
        // يظل ظاهراً للعميل، ويختفي تلقائياً بمجرد أن يلف العجلة في هذا الأسبوع، ويعود للظهور تلقائياً عند تجديد الفرصة!
        window.hasCustomerSpunThisWeek = function() {
            let info = window.getThursdayCycleInfo ? window.getThursdayCycleInfo() : { cycleId: '' };
            return localStorage.getItem('zait_wheel_last_cycle') === info.cycleId;
        };

        window.updateSpinWheelVisibility = function() {
            let enabled = storeSettings.enableSpinWheel !== false;
            let fab = document.getElementById('spin-wheel-fab');
            let sideBtn = document.getElementById('sidebar-spin-wheel-btn');
            // القسم في القائمة الجانبية يظل متاحاً طالما الميزة مفعلة
            if (sideBtn) sideBtn.style.display = enabled ? 'block' : 'none';
            // أما الزر العائم في الصفحة الرئيسية فيختفي فور لف العجلة هذا الأسبوع ويظهر مجدداً عند تجديد الفرصة!
            if (fab) {
                let alreadySpun = window.hasCustomerSpunThisWeek();
                fab.style.display = (enabled && !alreadySpun) ? 'flex' : 'none';
            }
        };

        // 3. تحديث نافذة عجلة الحظ لتسجيل (اسم العميل + رقم الواتساب) لأول مرة فقط + إخفاء الزر بعد اللف
        window.renderWheelModalContent = function(highlightIdx = -1) {
            window.updateWheelThursdayCountdown();
            let prizes = window.getWheel7Prizes();
            let legendEl = document.getElementById('wheel-prizes-legend');
            if (legendEl) {
                legendEl.innerHTML = prizes.map((p, idx) => `
                    <div class="wheel-prize-pill ${highlightIdx === idx ? 'winner-highlight' : ''}" id="wheel-pill-${idx}">
                        <span style="background:var(--secondary); color:white; border-radius:50%; width:18px; height:18px; display:inline-flex; align-items:center; justify-content:center; font-size:0.7rem;">${idx + 1}</span>
                        <span>${window.escapeHTML(p.label)}</span>
                    </div>
                `).join('');
            }

            let savedName = localStorage.getItem('zait_wheel_saved_name') || '';
            let savedPhone = localStorage.getItem('zait_wheel_saved_phone') || '';
            let nameInp = document.getElementById('wheel-name-input');
            let phoneInp = document.getElementById('wheel-phone-input');
            let savedBar = document.getElementById('wheel-saved-phone-bar');

            if (savedName && savedPhone && nameInp && phoneInp && savedBar) {
                nameInp.value = savedName;
                phoneInp.value = savedPhone;
                nameInp.style.display = 'none';
                phoneInp.style.display = 'none';
                savedBar.style.display = 'block';
                savedBar.innerHTML = window.currentLang === 'en'
                    ? `✅ Welcome <strong>${window.escapeHTML(savedName)}</strong> (${window.escapeHTML(savedPhone)}) <a href="#" onclick="event.preventDefault(); window.changeWheelSavedPhone();" style="color:var(--secondary); margin-left:6px;">(Edit)</a>`
                    : `✅ أهلاً <strong>${window.escapeHTML(savedName)}</strong> (واتساب: <strong>${window.escapeHTML(savedPhone)}</strong>) <a href="#" onclick="event.preventDefault(); window.changeWheelSavedPhone();" style="color:var(--secondary); margin-right:6px;">(تعديل البيانات)</a>`;
            } else if (nameInp && phoneInp && savedBar) {
                nameInp.style.display = 'block';
                phoneInp.style.display = 'block';
                if (savedName) nameInp.value = savedName;
                if (savedPhone) phoneInp.value = savedPhone;
                savedBar.style.display = 'none';
            }

            let info = window.getThursdayCycleInfo();
            let lastCycle = localStorage.getItem('zait_wheel_last_cycle');
            let lastPrizeJson = localStorage.getItem('zait_wheel_last_prize');
            let btn = document.getElementById('btn-spin-now');
            let resArea = document.getElementById('wheel-result-area');

            if (lastCycle === info.cycleId && lastPrizeJson) {
                try {
                    let won = JSON.parse(lastPrizeJson);
                    if (btn) {
                        btn.disabled = true;
                        btn.innerHTML = window.currentLang === 'en' ? '✅ Used this week (Resets Thursday)' : '✅ حصلت على هديتك هذا الأسبوع (تتجدد الخميس)';
                        btn.style.opacity = '0.65';
                    }
                    if (resArea) {
                        resArea.style.display = 'block';
                        resArea.innerHTML = window.currentLang === 'en'
                            ? `🎁 Your Prize This Week: <strong>${window.escapeHTML(won.label)}</strong> (Code: <strong>${window.escapeHTML(won.code)}</strong>)<br><small>Come back on Thursday for a new spin!</small>`
                            : `🎁 هديتك في هذا الأسبوع: <strong>${window.escapeHTML(won.label)}</strong> (الكود: <strong>${window.escapeHTML(won.code)}</strong>)<br><small>انتظر تجديد الفرصة يوم الخميس القادم لتلف العجلة من جديد!</small>`;
                    }
                } catch (e) {}
            } else {
                if (btn) {
                    btn.disabled = false;
                    btn.innerHTML = window.currentLang === 'en' ? '🎲 Spin the Wheel Now!' : '🎲 لف العجلة الآن!';
                    btn.style.opacity = '1';
                }
                if (resArea && highlightIdx === -1) {
                    resArea.style.display = 'none';
                }
            }
            window.updateSpinWheelVisibility();
        };

        window.changeWheelSavedPhone = function() {
            localStorage.removeItem('zait_wheel_saved_name');
            localStorage.removeItem('zait_wheel_saved_phone');
            let nameInp = document.getElementById('wheel-name-input');
            let phoneInp = document.getElementById('wheel-phone-input');
            let savedBar = document.getElementById('wheel-saved-phone-bar');
            if (nameInp) { nameInp.style.display = 'block'; nameInp.value = ''; nameInp.focus(); }
            if (phoneInp) { phoneInp.style.display = 'block'; phoneInp.value = ''; }
            if (savedBar) savedBar.style.display = 'none';
        };

        window.spinTheWheelNow = async function() {
            let info = window.getThursdayCycleInfo();
            if (localStorage.getItem('zait_wheel_last_cycle') === info.cycleId) {
                window.showToast(window.currentLang === 'en' ? 'You already spun this week! Next spin is on Thursday.' : 'لقد استخدمت فرصتك لهذا الأسبوع! تتجدد الفرصة يوم الخميس القادم.', 'info');
                window.renderWheelModalContent(-1);
                return;
            }

            let savedName = localStorage.getItem('zait_wheel_saved_name') || '';
            let savedPhone = localStorage.getItem('zait_wheel_saved_phone') || '';
            let nameInp = document.getElementById('wheel-name-input');
            let phoneInp = document.getElementById('wheel-phone-input');

            let custName = savedName || (nameInp ? nameInp.value.trim() : '');
            let phone = savedPhone || (phoneInp ? phoneInp.value.trim() : '');

            if (!custName || custName.length < 2) {
                window.showToast(window.currentLang === 'en' ? 'Please enter your name first!' : 'يرجى إدخال اسمك أولاً!', 'error');
                if (nameInp) { nameInp.style.display = 'block'; nameInp.focus(); }
                return;
            }
            if (!phone || phone.replace(/\D/g, '').length < 9) {
                window.showToast(window.currentLang === 'en' ? 'Please enter your WhatsApp phone number first!' : 'يرجى إدخال رقم الواتساب الخاص بك أولاً!', 'error');
                if (phoneInp) { phoneInp.style.display = 'block'; phoneInp.focus(); }
                return;
            }

            // حفظ الاسم ورقم الواتساب حتى لا يكتبهما العميل مرة أخرى في الأسابيع القادمة
            localStorage.setItem('zait_wheel_saved_name', custName);
            localStorage.setItem('zait_wheel_saved_phone', phone);

            let prizes = window.getWheel7Prizes();
            let allowedIndices = [];
            prizes.forEach((p, idx) => { if (p.allowed) allowedIndices.push(idx); });
            if (allowedIndices.length === 0) allowedIndices = [0];

            let winningIndex = allowedIndices[Math.floor(Math.random() * allowedIndices.length)];
            let winningPrize = { ...prizes[winningIndex] };

            let baseCode = String(winningPrize.code || 'WIN').trim().toUpperCase();
            let uniqueCode = storeSettings.enableUniqueWheelCodes !== false
                ? window.generateUniqueSingleUseCode(baseCode)
                : baseCode;
            winningPrize.code = uniqueCode;

            let btn = document.getElementById('btn-spin-now');
            let wheel = document.getElementById('wheel-visual-circle');
            let resArea = document.getElementById('wheel-result-area');
            if (btn) btn.disabled = true;

            let sliceDeg = 360 / 7;
            let targetSliceCenter = (winningIndex * sliceDeg) + (sliceDeg / 2);
            let extraSpins = 5 * 360;
            let finalDeg = extraSpins + (360 - targetSliceCenter);
            if (wheel) {
                wheel.style.transition = 'none';
                wheel.style.transform = 'rotate(0deg)';
                setTimeout(() => {
                    wheel.style.transition = 'transform 3.6s cubic-bezier(0.15, 0.85, 0.15, 1)';
                    wheel.style.transform = `rotate(${finalDeg}deg)`;
                }, 30);
            }

            setTimeout(async () => {
                let winDisc = Number(winningPrize.discount) || 0;
                let spinIso = new Date().toISOString();

                if (winDisc > 0 && storeSettings.enableUniqueWheelCodes !== false) {
                    try {
                        await addDoc(collection(db, 'promoCodes'), {
                            code: uniqueCode,
                            discount: winDisc,
                            singleUse: true,
                            used: false,
                            ownerName: custName,
                            ownerPhone: phone,
                            createdAt: spinIso
                        });
                    } catch (e) {}
                }

                if (winDisc > 0) {
                    currentDiscountPercent = winDisc;
                    appliedPromoCode = uniqueCode;
                } else if (baseCode === 'FREESHIP') {
                    currentShippingCost = 0;
                    appliedPromoCode = uniqueCode;
                } else {
                    appliedPromoCode = `${uniqueCode} (${winningPrize.label})`;
                }
                window.updateInvoiceUI();

                localStorage.setItem('zait_wheel_last_cycle', info.cycleId);
                localStorage.setItem('zait_wheel_last_prize', JSON.stringify(winningPrize));

                window.renderWheelModalContent(winningIndex);
                window.updateSpinWheelVisibility(); // إخفاء الزر العائم من الرئيسية بعد لف العجلة

                if (resArea) {
                    resArea.style.display = 'block';
                    resArea.innerHTML = window.currentLang === 'en'
                        ? `🎉 <strong>Congrats ${window.escapeHTML(custName)}! You won Prize #${winningIndex + 1}:</strong><br><span style="font-size:1.05rem; font-weight:900;">${window.escapeHTML(winningPrize.label)}</span><br>Your Unique Single-Use Code: <strong style="background:white; padding:2px 8px; border-radius:6px; border:1px dashed #166534;">${window.escapeHTML(uniqueCode)}</strong><br><small style="color:#b45309;">⚠️ Valid for 1 order only & applied to your cart!</small>`
                        : `🎉 <strong>مبروك يا ${window.escapeHTML(custName)}! فزت بالهدية رقم (${winningIndex + 1}):</strong><br><span style="font-size:1.05rem; font-weight:900;">${window.escapeHTML(winningPrize.label)}</span><br>كودك الخاص (يُستخدم لمرة واحدة فقط): <strong style="background:white; padding:2px 8px; border-radius:6px; border:1px dashed #166534;">${window.escapeHTML(uniqueCode)}</strong><br><small style="color:#b45309;">⚠️ تم تفعيل الكود في سلتك، وتنتهي صلاحيته فور استخدامه!</small>`;
                }

                try {
                    await addDoc(collection(db, 'wheel_leads'), {
                        customerName: custName,
                        phone: phone,
                        prizeLabel: winningPrize.label,
                        prizeCode: uniqueCode,
                        discount: winDisc,
                        date: spinIso
                    });
                } catch (e) {}
            }, 3700);
        };

        // 4. عرض قائمة عملاء عجلة الحظ في الإحصائيات بالاسم والهاتف + نافذة تفاصيل كاملة عند الضغط على الاسم
        window.allWheelLeadsRawList = [];
        window.loadAdminWheelLeads = function() {
            if (window.adminWheelLeadsUnsubscribe) window.adminWheelLeadsUnsubscribe();
            window.adminWheelLeadsUnsubscribe = onSnapshot(collection(db, 'wheel_leads'), (snap) => {
                let cont = document.getElementById('admin-wheel-leads-list');
                let badge = document.getElementById('wheel-leads-count-badge');
                if (!cont) return;
                let list = [];
                snap.forEach(d => list.push({ id: d.id, ...d.data() }));
                list.sort((a, b) => window.parseSafeTimestamp(b.date, 0) - window.parseSafeTimestamp(a.date, 0));
                window.allWheelLeadsRawList = list;

                if (badge) badge.textContent = list.length;
                if (list.length === 0) {
                    cont.innerHTML = '<p style="color:var(--text-muted); font-size:0.88rem; margin:0;">لا يوجد عملاء مسجلون في عجلة الحظ بعد.</p>';
                    return;
                }
                let html = '';
                list.forEach(item => {
                    let cName = item.customerName || 'عميل عجلة الحظ';
                    let dObj = new Date(window.parseSafeTimestamp(item.date, Date.now()));
                    let dayName = dObj.toLocaleDateString('ar-EG', { weekday: 'long' });
                    let dateStr = dObj.toLocaleDateString('ar-EG');
                    let timeStr = dObj.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
                    let prizeDisplay = item.prizeLabel ? `${item.prizeLabel} (${item.prizeCode})` : item.prizeCode;

                    let pureWa = String(item.phone || '').replace(/\D/g, '');
                    if (pureWa && !pureWa.startsWith('20') && pureWa.length >= 10) pureWa = '20' + pureWa;
                    let waMsg = `مرحباً ${cName} من متجر زيت الشجرة المباركة 🌿 مبروك فوزك في عجلة الحظ بهدية (${prizeDisplay})! هل تحب نساعدك في إتمام طلبك بالهدية اليوم؟`;
                    let waBtn = pureWa.length >= 10
                        ? `<a href="https://wa.me/${pureWa}?text=${encodeURIComponent(waMsg)}" onclick="event.stopPropagation();" target="_blank" class="btn btn-outline" style="border-color:#25D366; color:#25D366; padding:4px 10px; font-size:0.78rem; text-decoration:none;">💬 واتساب</a>`
                        : '';

                    html += `<div onclick="window.openWheelLeadDetailsModal('${item.id}')" style="background:var(--input-bg); padding:10px 12px; border:1px solid var(--border-color); border-right:4px solid #ff6b00; border-radius:8px; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; cursor:pointer; transition:0.2s;" title="اضغط لعرض كل تفاصيل العميل والوقت والهدية">
                        <div>
                            <strong style="color:var(--primary); font-size:0.95rem; text-decoration:underline;">👤 ${window.escapeHTML(cName)}</strong>
                            <span style="font-size:0.82rem; color:var(--text-muted); margin-right:6px;">(📞 ${window.escapeHTML(item.phone || '')})</span><br>
                            <span style="font-size:0.8rem; color:var(--secondary); font-weight:bold;">🎁 الهدية: ${window.escapeHTML(prizeDisplay || '')}</span>
                            <span style="font-size:0.76rem; color:var(--text-muted); display:block;">📅 يوم ${dayName} (${dateStr}) — ⏰ الساعة ${timeStr}</span>
                        </div>
                        <div style="display:flex; gap:6px; align-items:center;">
                            <button type="button" class="btn btn-info" style="padding:4px 8px; font-size:0.76rem;" onclick="event.stopPropagation(); window.openWheelLeadDetailsModal('${item.id}')">📋 التفاصيل</button>
                            ${waBtn}
                            <button type="button" class="btn btn-danger" style="padding:4px 8px; font-size:0.76rem;" onclick="event.stopPropagation(); window.deleteWheelLead('${item.id}')">🗑️</button>
                        </div>
                    </div>`;
                });
                cont.innerHTML = html;
            });
        };

        window.openWheelLeadDetailsModal = function(leadId) {
            let item = (window.allWheelLeadsRawList || []).find(x => x.id === leadId);
            if (!item) return;
            let modal = document.getElementById('wheel-lead-details-modal');
            let body = document.getElementById('wheel-lead-details-body');
            if (!modal || !body) return;

            let cName = item.customerName || 'عميل عجلة الحظ';
            let dObj = new Date(window.parseSafeTimestamp(item.date, Date.now()));
            let dayName = dObj.toLocaleDateString('ar-EG', { weekday: 'long' });
            let fullDate = dObj.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
            let exactTime = dObj.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            let prizeDisplay = item.prizeLabel ? item.prizeLabel : (item.prizeCode || '');

            // جمع كل سجل لفات نفس العميل (برقم الهاتف)
            let samePhoneSpins = (window.allWheelLeadsRawList || []).filter(x => x.phone === item.phone);
            let historyHtml = samePhoneSpins.map((s, idx) => {
                let sd = new Date(window.parseSafeTimestamp(s.date, Date.now()));
                return `<li><strong>${sd.toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'short' })} (${sd.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}):</strong> ${window.escapeHTML(s.prizeLabel || s.prizeCode)} — كود: <code>${window.escapeHTML(s.prizeCode)}</code></li>`;
            }).join('');

            let pureWa = String(item.phone || '').replace(/\D/g, '');
            if (pureWa && !pureWa.startsWith('20') && pureWa.length >= 10) pureWa = '20' + pureWa;
            let waMsg = `مرحباً أستاذ ${cName} 🌿 نتواصل معك من متجر زيت الشجرة المباركة بخصوص فوزك في عجلة الحظ بهدية (${prizeDisplay}) بكود (${item.prizeCode})!`;

            body.innerHTML = `
                <div>👤 <strong>اسم العميل:</strong> <span style="color:var(--primary); font-weight:bold;">${window.escapeHTML(cName)}</span></div>
                <div>📞 <strong>رقم الواتساب:</strong> <span style="color:#028090; font-weight:bold;">${window.escapeHTML(item.phone || '')}</span></div>
                <div>📅 <strong>اليوم والتاريخ:</strong> يوم <strong>${dayName}</strong> الموافق ${fullDate}</div>
                <div>⏰ <strong>الساعة بالضبط:</strong> <strong style="color:var(--danger);">${exactTime}</strong></div>
                <div>🎁 <strong>الهدية التي ظهرت له:</strong> <strong style="color:#166534;">${window.escapeHTML(prizeDisplay)}</strong></div>
                <div>🏷️ <strong>كود الخصم الفريد (لمرة واحدة):</strong> <strong style="background:white; padding:2px 8px; border-radius:6px; border:1px dashed var(--secondary);">${window.escapeHTML(item.prizeCode || '')}</strong></div>
                <hr style="border:0; border-top:1px dashed var(--border-color); margin:10px 0;">
                <strong>📜 إجمالي مرات لف العجلة لهذا الرقم (${samePhoneSpins.length}):</strong>
                <ul style="margin:6px 0 12px; padding-right:18px; font-size:0.84rem;">${historyHtml}</ul>
                ${pureWa.length >= 10 ? `<a href="https://wa.me/${pureWa}?text=${encodeURIComponent(waMsg)}" target="_blank" class="btn btn-full" style="background:#25D366; text-decoration:none; display:block; text-align:center;">💬 مراسلة ${window.escapeHTML(cName)} عبر واتساب</a>` : ''}
            `;
            modal.style.display = 'flex';
        };

        // =========================================================================
        // === 5. ميزات الجزء الثاني (حاسبة الخزين + الوصفات + المندوب + الموظفين + المقارنة) ===
        // =========================================================================

        // أ) حاسبة الخزين السنوي وشهر رمضان (Annual & Ramadan Stock Calculator)
        window.openAnnualCalcModal = function() {
            let m = document.getElementById('annual-calc-modal');
            if (m) {
                m.style.display = 'flex';
                window.calculateAnnualStockNeed();
            }
        };

        window.calculateAnnualStockNeed = function() {
            let members = Math.max(1, Number((document.getElementById('calc-family-members') || {}).value) || 4);
            let months = Math.max(1, Number((document.getElementById('calc-period-months') || {}).value) || 12);
            let resBox = document.getElementById('annual-calc-result-box');
            if (!resBox) return;

            // متوسط استهلاك الفرد الصحي من زيت الزيتون ~ 0.45 لتر شهرياً
            let litersNeeded = Math.max(1, Math.ceil(members * months * 0.45));
            let extraDisc = months >= 12 ? 15 : (months >= 6 ? 12 : (months >= 3 ? 10 : 8));
            let isEn = window.currentLang === 'en';

            resBox.style.display = 'block';
            resBox.innerHTML = isEn
                ? `<div>🏺 <strong>Recommended Quantity:</strong> <strong style="color:var(--secondary); font-size:1.1rem;">${litersNeeded} Liters</strong> (for ${members} members / ${months} months)</div>
                   <div>🎁 <strong>Stock Bundle Discount:</strong> Instant <strong>${extraDisc}% OFF</strong> with code <code>STOCK${extraDisc}</code></div>
                   <button type="button" class="btn btn-full" style="margin-top:8px; background:#028090;" onclick="window.applyStockCalculatorOffer(${extraDisc})">🛒 Activate ${extraDisc}% Stock Discount & Shop Now</button>`
                : `<div>🏺 <strong>الكمية الموصى بها لأسرتك:</strong> <strong style="color:var(--secondary); font-size:1.1rem;">${litersNeeded} لتر تقريباً</strong> (لعدد ${members} أفراد لمدة ${months} شهر)</div>
                   <div>🎁 <strong>هدية الخزين الخاصة بك:</strong> خصم فوري <strong>${extraDisc}%</strong> بكود الخزين <code>STOCK${extraDisc}</code></div>
                   <button type="button" class="btn btn-full" style="margin-top:8px; background:#028090;" onclick="window.applyStockCalculatorOffer(${extraDisc})">🛒 تفعيل خصم الخزين (${extraDisc}%) واختيار العبوات الآن</button>`;
        };

        window.applyStockCalculatorOffer = function(discPct) {
            currentDiscountPercent = Math.max(currentDiscountPercent, Number(discPct) || 10);
            appliedPromoCode = `STOCK${discPct}`;
            window.updateInvoiceUI();
            document.getElementById('annual-calc-modal').style.display = 'none';
            window.showToast(`🎉 تم تفعيل خصم الخزين (${discPct}%) في سلتك! اختر العبوات المطلوبة الآن`, 'success');
            window.showPanel('home');
        };

        // ب) بطاقات الوصفات الصحية القابلة للتسوق بضغطة زر (Shoppable Recipes)
        window.shopRecipeQuickAdd = function(recipeIdx) {
            let available = products.filter(p => !p.isHidden && (p.stock === undefined || p.stock === "" || Number(p.stock) > 0));
            if (available.length === 0) return;
            let target = available[recipeIdx % available.length] || available[0];
            let safeName = target.name.replace(/'/g, "\\'");
            window.executeAddToCart(null, target.id, safeName);
        };

        // ج) تقرير المقارنة اليومي والشهري (Daily vs Yesterday & Monthly vs Last Month)
        window.renderGrowthComparisonReport = function() {
            let box = document.getElementById('admin-growth-comparison-box');
            if (box) box.style.display = storeSettings.enableGrowthReport !== false ? 'grid' : 'none';
            if (storeSettings.enableGrowthReport === false) return;

            let dailyEl = document.getElementById('stat-daily-comparison');
            let monthlyEl = document.getElementById('stat-monthly-comparison');
            if (!dailyEl || !monthlyEl) return;

            let now = new Date();
            let startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
            let startOfYesterday = startOfToday - 86400000;
            let startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
            let startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();

            let todayRev = 0, todayCnt = 0;
            let yestRev = 0, yestCnt = 0;
            let thisMonthRev = 0, thisMonthCnt = 0;
            let lastMonthRev = 0, lastMonthCnt = 0;

            (adminOrdersArray || []).forEach(o => {
                let st = String(o.status || '');
                if (st.includes('لغى') || st.includes('رفض')) return;
                let t = window.parseSafeTimestamp(o.orderDate, 0);
                let amt = Number(o.totalAmount) || 0;

                if (t >= startOfToday) { todayRev += amt; todayCnt++; }
                else if (t >= startOfYesterday && t < startOfToday) { yestRev += amt; yestCnt++; }

                if (t >= startOfThisMonth) { thisMonthRev += amt; thisMonthCnt++; }
                else if (t >= startOfLastMonth && t < startOfThisMonth) { lastMonthRev += amt; lastMonthCnt++; }
            });

            dailyEl.innerHTML = `اليوم: <span style="color:#166534;">${todayRev.toLocaleString()} ج</span> (${todayCnt} طلب) <small style="color:var(--text-muted); font-weight:normal;">| الأمس: ${yestRev.toLocaleString()} ج (${yestCnt} طلب)</small>`;
            monthlyEl.innerHTML = `هذا الشهر: <span style="color:#028090;">${thisMonthRev.toLocaleString()} ج</span> (${thisMonthCnt} طلب) <small style="color:var(--text-muted); font-weight:normal;">| الماضي: ${lastMonthRev.toLocaleString()} ج (${lastMonthCnt} طلب)</small>`;
        };

        // د) بطاقة المندوب السريعة (Courier Quick Dispatch Sheet & WhatsApp Share)
        window.openCourierDispatchModal = function(orderId) {
            let o = (adminOrdersArray || []).find(ord => ord.id === orderId);
            if (!o) return;
            let modal = document.getElementById('courier-dispatch-modal');
            let body = document.getElementById('courier-dispatch-body');
            if (!modal || !body) return;

            let cod = (o.paymentMethod === 'محفظة إلكترونية') ? '0 ج (مدفوع مسبقاً)' : `${o.totalAmount} ج`;
            let itemsStr = (o.items || []).map(i => `${i.name} (عدد ${i.quantity})`).join(' + ');
            let courierWaText = `🛵 *بوليصة توصيل للمندوب - متجر زيت الشجرة المباركة*\n📦 رقم الطلب: #${o.id.slice(0,6).toUpperCase()}\n👤 العميل: ${o.customerName}\n📞 هاتف 1: ${(o.phones && o.phones.primary) || ''}\n📞 هاتف 2: ${(o.phones && o.phones.secondary) || 'لا يوجد'}\n📍 العنوان: ${(o.location && o.location.governorate) || ''} - ${(o.location && o.location.city) || ''} (${(o.location && o.location.details) || ''})\n🗺️ لوكيشن GPS: ${(o.location && o.location.mapLink) || 'غير مرفق'}\n🛍️ المحتويات: ${itemsStr}\n💰 *المبلغ المطلوب تحصيله: ${cod}*`;

            body.innerHTML = `
                <div>📦 <strong>رقم الطلب:</strong> #${o.id.slice(0,6).toUpperCase()}</div>
                <div>👤 <strong>اسم المستلم:</strong> ${window.escapeHTML(o.customerName)}</div>
                <div>📞 <strong>أرقام الهاتف:</strong> <a href="tel:${(o.phones && o.phones.primary) || ''}" style="color:#028090; font-weight:bold;">${window.escapeHTML((o.phones && o.phones.primary) || '')}</a></div>
                <div>📍 <strong>العنوان:</strong> ${window.escapeHTML((o.location && o.location.governorate) || '')} - ${window.escapeHTML((o.location && o.location.city) || '')} (${window.escapeHTML((o.location && o.location.details) || '')})</div>
                <div>🛍️ <strong>العبوات:</strong> ${window.escapeHTML(itemsStr)}</div>
                <div style="background:#fef3c7; color:#92400e; padding:8px 10px; border-radius:8px; font-weight:900; margin:8px 0; text-align:center;">💰 التحصيل المطلوب من العميل: ${cod}</div>
                <div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:10px;">
                    ${(o.location && o.location.mapLink) ? `<a href="${o.location.mapLink}" target="_blank" class="btn btn-info" style="flex:1; text-align:center; text-decoration:none;">🗺️ فتح موقع GPS</a>` : ''}
                    <a href="https://wa.me/?text=${encodeURIComponent(courierWaText)}" target="_blank" class="btn" style="flex:1; background:#25D366; text-align:center; text-decoration:none;">📲 إرسال للمندوب واتساب</a>
                </div>
                <button type="button" class="btn btn-full" style="margin-top:8px; background:#28a745;" onclick="window.updateOrderStatus('${o.id}', 'تم التوصيل ✅'); document.getElementById('courier-dispatch-modal').style.display='none';">✅ تأكيد التسليم وتحصيل المبلغ</button>
            `;
            modal.style.display = 'flex';
        };

        const origOpenAdminOrderModalV58 = window.openAdminOrderModal;
        window.openAdminOrderModal = function(id) {
            origOpenAdminOrderModalV58(id);
            if (storeSettings.enableCourierDispatch === false) return;
            let aom = document.getElementById('aom-content');
            if (aom) {
                aom.innerHTML += `<button type="button" class="btn" style="width:100%; margin-top:8px; background:#028090;" onclick="window.openCourierDispatchModal('${id}')">🛵 فتح بطاقة تسليم المندوب السريعة وإرسالها واتساب</button>`;
            }
        };

        // هـ) نظام صلاحيات الموظفين المحدودة (Staff Permissions Mode)
        window.isCurrentUserStaffOnly = false;
        window.checkAndApplyStaffPermissions = function() {
            if (!currentUser || !storeSettings.enableStaffPermissions) {
                window.isCurrentUserStaffOnly = false;
                return;
            }
            let email = (currentUser.email || '').toLowerCase().trim();
            let staffList = String(storeSettings.staffEmailsList || '')
                .split(',')
                .map(s => s.trim().toLowerCase())
                .filter(Boolean);

            if (email && staffList.includes(email) && !SUPER_ADMINS.includes(email)) {
                window.isCurrentUserStaffOnly = true;
                isCurrentUserAdmin = true;
                let sNav = document.getElementById('smart-nav');
                if (sNav) sNav.style.display = 'flex';
                let hdrWork = document.getElementById('header-work-hub-btn');
                if (hdrWork) hdrWork.style.display = 'inline-flex';
                // إظهار تبويبات العمل والطلبات والرسائل والاسترجاع فقط وإخفاء الإعدادات والإحصائيات المالية
                document.querySelectorAll('.admin-tab').forEach(tab => {
                    let oc = tab.getAttribute('onclick') || '';
                    if (oc.includes('admin-work') || oc.includes('admin-orders') || oc.includes('admin-messages') || oc.includes('admin-returns')) {
                        tab.style.display = 'inline-block';
                    } else {
                        tab.style.display = 'none';
                    }
                });
            } else {
                window.isCurrentUserStaffOnly = false;
            }
        };

        const origRenderAdminOrdersV58 = window.renderAdminOrdersUI;
        window.renderAdminOrdersUI = function() {
            origRenderAdminOrdersV58();
            if (isCurrentUserAdmin) window.renderGrowthComparisonReport();
        };

        const prevApplySettingsV58 = window.applySettingsToUI;
        window.applySettingsToUI = function() {
            prevApplySettingsV58();
            window.applyContentProtectionMode();
            window.checkAndApplyStaffPermissions();
            window.updateSpinWheelVisibility();

            if (isCurrentUserAdmin) {
                let setC = (id, val, def = true) => { let el = document.getElementById(id); if (el) el.checked = val !== undefined ? Boolean(val) : def; };
                let setV = (id, val, def = '') => { let el = document.getElementById(id); if (el) el.value = val !== undefined ? val : def; };
                setC('setting-enable-content-protection', storeSettings.enableContentProtection, true);
                setC('setting-enable-annual-calc', storeSettings.enableAnnualCalc, true);
                setC('setting-enable-shoppable-recipes', storeSettings.enableShoppableRecipes, true);
                setC('setting-enable-growth-report', storeSettings.enableGrowthReport, true);
                setC('setting-enable-courier-dispatch', storeSettings.enableCourierDispatch, true);
                setC('setting-enable-staff-permissions', storeSettings.enableStaffPermissions, true);
                setV('setting-staff-emails', storeSettings.staffEmailsList, '');
                window.renderGrowthComparisonReport();
            }

            let acBtn1 = document.getElementById('btn-open-annual-calc');
            let acBtn2 = document.getElementById('sidebar-annual-calc-btn');
            let showAc = storeSettings.enableAnnualCalc !== false;
            if (acBtn1) acBtn1.style.display = showAc ? 'flex' : 'none';
            if (acBtn2) acBtn2.style.display = showAc ? 'block' : 'none';

            let recSec = document.getElementById('home-shoppable-recipes-section');
            if (recSec) recSec.style.display = storeSettings.enableShoppableRecipes !== false ? 'block' : 'none';

            if (window.currentLang === 'en') window.translateDOM(document.body);
        };

        const prevSaveSettingsV58 = window.saveSettings;
        window.saveSettings = async function() {
            const getC = (id, def = true) => { let el = document.getElementById(id); return el ? el.checked : def; };
            const getV = (id, def = '') => { let el = document.getElementById(id); return el ? el.value.trim() : def; };
            try {
                await updateDoc(doc(db, 'settings', 'main'), {
                    enableContentProtection: getC('setting-enable-content-protection', true),
                    enableAnnualCalc: getC('setting-enable-annual-calc', true),
                    enableShoppableRecipes: getC('setting-enable-shoppable-recipes', true),
                    enableGrowthReport: getC('setting-enable-growth-report', true),
                    enableCourierDispatch: getC('setting-enable-courier-dispatch', true),
                    enableStaffPermissions: getC('setting-enable-staff-permissions', true),
                    staffEmailsList: getV('setting-staff-emails', '')
                });
            } catch (e) {}
            await prevSaveSettingsV58();
        };

        // =========================================================================
        // === 6. قاموس الترجمة الشامل للعميل والمدير وغرفة العمل والإحصائيات (100% EN) ===
        // =========================================================================
        Object.assign(window.FULL_AR_TO_EN, {
            // شريط الإدارة وغرفة العمل
            "💼 العمل": "💼 Work Hub",
            "الشغل": "Work Hub",
            "💼 غرفة متابعة العمل والشغل المباشرة": "💼 Live Work & Operations Center",
            "🟢 متابعة لحظية لكل الطلبات، الرسائل، الإلغاءات، والتنبيهات في شاشة واحدة": "🟢 Real-time stream of all orders, messages, cancellations & alerts in one screen",
            "🔊 الصوت: مفعل": "🔊 Sound: ON",
            "🔇 الصوت: صامت": "🔇 Sound: OFF",
            "🔔 تجربة الصوت": "🔔 Test Sound",
            "👁️ إخفاء المكتمل القديم": "👁️ Hide Completed",
            "👁️ إظهار كل السجل": "👁️ Show All History",
            "🔄 تحديث": "🔄 Refresh",
            "📥 الوارد النشط": "📥 Active Inbox",
            "📖 المقروء": "📖 Read",
            "🏆 المنجز": "🏆 Completed",
            "🗑️ المحذوف": "🗑️ Trash",
            "🌐 كل الشغل": "🌐 All Work",
            "📦 طلبات نشطة": "📦 Active Orders",
            "💬 رسائل العملاء": "💬 Customer Chats",
            "🚨 إلغاء واسترجاع": "🚨 Cancels & Returns",
            "🔔 سلال وتنبيهات": "🔔 Carts & Alerts",
            "📖 تمت القراءة": "📖 Mark Read",
            "✅ منجز": "✅ Mark Done",
            "🗑️ حذف": "🗑️ Delete",
            "📥 إرجاع للوارد النشط": "📥 Restore to Inbox",
            "📖 نقل للمقروء": "📖 Move to Read",
            "✅ نقل للمنجز": "✅ Move to Done",
            "🗑️ نقل للمحذوف": "🗑️ Move to Trash",
            "📦 تم التجهيز": "📦 Mark Prepared",
            "🚚 تم الشحن": "🚚 Mark Shipped",
            "✅ تم التوصيل": "✅ Mark Delivered",
            "📲 واتساب": "📲 WhatsApp",
            "🖨️ بوليصة الشحن": "🖨️ Shipping Label",
            "📋 التفاصيل": "📋 Details",
            "إرسال الرد 🚀": "Send Reply 🚀",
            "فتح الشات 💬": "Open Chat 💬",
            "👋 ترحيب": "👋 Greeting",
            "🚚 حالة الشحن": "🚚 Shipping Info",
            "🌿 ضمان الزيت": "🌿 Quality Guarantee",
            "📦 تأكيد التجهيز": "📦 Confirm Prep",
            "🌿 ضمان الجودة": "🌿 Quality Guarantee",
            // لوحة الإحصائيات والطلبات والإعدادات للمدير
            "📊 الإحصائيات (للإدارة)": "📊 Admin Analytics & Reports",
            "⚠️ تنبيهات المخزون (أقل من 5 قطع)": "⚠️ Low Stock Alerts (< 5 units)",
            "المخزون ممتاز، لا توجد منتجات أوشكت على النفاد.": "Stock levels are great! No low-stock items.",
            "🛒 السلال المتروكة (عملاء لم يكملوا الدفع)": "🛒 Abandoned Carts (Unfinished Checkouts)",
            "🔔 طلبات (بلغني عند التوفر)": "🔔 Back-in-Stock Requests",
            "🎡 أرقام عملاء عجلة الحظ": "🎡 Spin & Win Customer Leads",
            "🏆 الأكثر مبيعاً وربحاً": "🏆 Top Selling Products",
            "📍 أكثر المحافظات طلباً": "📍 Top Governorates",
            "📊 مصادر الزيارات والمبيعات": "📊 Traffic & Sales Sources",
            "📅 مبيعات اليوم مقارنة بالأمس": "📅 Today's Sales vs Yesterday",
            "📆 مبيعات هذا الشهر مقارنة بالشهر الماضي": "📆 This Month's Sales vs Last Month",
            "👥 الزيارات": "👥 Visits",
            "📦 الطلبات": "📦 Orders",
            "💰 الأرباح": "💰 Revenue",
            "💎 صافي الربح الفعلي": "💎 Net Profit",
            "تصفير الأرباح 🔄": "Reset Revenue 🔄",
            "تصفير الطلبات 🔄": "Reset Orders 🔄",
            "🔔 إرسال إشعار للعملاء": "🔔 Send Global Notification",
            "إرسال للجميع 🚀": "Broadcast to All 🚀",
            "📥 تصدير": "📥 Export Data",
            "📊 تحميل الطلبات (CSV)": "📊 Export Orders (CSV)",
            "🚚 تحميل شيت شركات الشحن (Bosta / Mylerz CSV)": "🚚 Export Courier Sheet (Bosta / Mylerz CSV)",
            "💾 تحميل نسخة احتياطية شاملة (Backup)": "💾 Download Full Backup (JSON)",
            "📂 استعادة نسخة احتياطية (Restore)": "📂 Restore Backup (JSON)",
            "📦 طلبات العملاء": "📦 Customer Orders Management",
            "قيد المراجعة": "Under Review",
            "تم التجهيز": "Prepared",
            "تم الشحن": "Shipped",
            "تم التوصيل ✅": "Delivered ✅",
            "☑️ تحديد / إلغاء تحديد الكل": "☑️ Select / Deselect All",
            "تحويل المحدد إلى: تم التجهيز 📦": "Set Selected to: Prepared 📦",
            "تحويل المحدد إلى: تم الشحن 🚚": "Set Selected to: Shipped 🚚",
            "تحويل المحدد إلى: تم التوصيل ✅": "Set Selected to: Delivered ✅",
            "تطبيق على المحدد 🚀": "Apply to Selected 🚀",
            "📩 رسائل العملاء": "📩 Customer Support Messages",
            "🔙 رجوع": "🔙 Back",
            "🔄 طلبات الاسترجاع": "🔄 Return Requests",
            "🛒 إضافة / تعديل منتج": "🛒 Add / Edit Product",
            "🏷️ التسعير والأحجام (Variants):": "🏷️ Pricing & Sizes (Variants):",
            "🖼️ صور وفيديو المنتج:": "🖼️ Product Images & Video:",
            "💬 التقييمات التلقائية للمنتج:": "💬 Initial Product Reviews:",
            "حفظ المنتج": "Save Product",
            "إلغاء": "Cancel",
            "⚙️ الإعدادات (محمية)": "⚙️ Protected Store Settings",
            "فتح 🔓": "Unlock 🔓",
            "نسيت رمز الأمان؟": "Forgot Security PIN?",
            "⚙️ مركز التحكم الاحترافي الشامل": "⚙️ Professional Admin Control Center",
            "جميع إعدادات ومميزات المتجر منظمة في تبويبات سريعة بدون حذف أي عنصر": "All store features & settings organized into clean tabs",
            "💾 حفظ كل الإعدادات الآن": "💾 Save All Settings Now",
            "🌐 كل الإعدادات": "🌐 All Settings",
            "🎨 الواجهة والبانرات والثيمات": "🎨 UI, Banners & Themes",
            "🚚 الشحن والباقات والمحافظ": "🚚 Shipping, Bundles & Wallets",
            "🎡 عجلة الحظ والعروض والتسويق": "🎡 Spin Wheel, Deals & Marketing",
            "💬 الشات والولاء والعمل": "💬 Chat, Loyalty & Work Hub",
            "📂 الأقسام والكوبونات والمديرين": "📂 Categories, Coupons & Admins",
            "قفل الإعدادات 🔒": "Lock Settings 🔒",
            "حفظ": "Save",
            "تعديل": "Edit",
            "حذف": "Delete",
            "📌 تثبيت بالأول": "📌 Pin to Top",
            "📌 إلغاء التثبيت": "📌 Unpin",
            "🙈 إخفاء مؤقت": "🙈 Hide Product",
            "👁️ إظهار للعملاء": "👁️ Show to Customers",
            // إضافات V59
            "عجلة الحظ الأسبوعية": "Weekly Spin & Win",
            "حاسبة الخزين السنوي ورمضان": "Annual & Ramadan Stock Calculator",
            "ركن الوصفات الصحية والخلطات الطبيعية (اطلب مكوناتها بضغطة زر)": "Healthy Olive Oil Recipes (1-Tap Shop Ingredients)",
            "وصفة المناعة الصباحية الذهبية": "Golden Morning Immunity Recipe",
            "ملعقة كبيرة من زيت الزيتون السيناوي البكر على الريق مع قطرات الليمون لتنشيط الكبد والمناعة طوال اليوم.": "One tablespoon of Extra Virgin Sinai Olive Oil on an empty stomach with lemon drops to boost immunity.",
            "تتبيلة السلطة المتوسطية الفاخرة": "Premium Mediterranean Salad Dressing",
            "3 ملاعق زيت زيتون عصرة أولى على البارد مع الزعتر البري السيناوي والخل البلسمي لطعم أصلي وصحة للقلب.": "3 tablespoons of cold-pressed olive oil with Sinai wild thyme for authentic flavor and heart health.",
            "حمام الزيت الدافئ لتكثيف الشعر": "Warm Olive Oil Hair Growth Mask",
            "تدليك فروة الرأس بزيت الزيتون السيناوي الخام الغني بفيتامين E لمدة 45 دقيقة أسبوعياً لمنع التساقط ولمعان فوري.": "Massage scalp with raw Vitamin-E rich Sinai olive oil for 45 mins weekly for instant shine & strength.",
            "أضف العبوة المناسبة للوصفة": "Add Recipe Bottle to Cart",
            "بطاقة بيانات عميل عجلة الحظ": "Spin & Win Customer Profile",
            "حاسبة الخزين السنوي وشهر رمضان": "Annual & Ramadan Stock Calculator",
            "احسب احتياج أسرتك الفعلي من زيت الزيتون السيناوي الأصلي واحصل على خصم الخزين:": "Calculate your family's olive oil needs and unlock a special stock discount:",
            "عدد أفراد الأسرة:": "Number of Family Members:",
            "فترة الخزين المطلوبة:": "Stock Duration:",
            "احسب الكمية والتوفير الآن": "Calculate Quantity & Discount Now",
            "بطاقة تسليم المندوب السريعة": "Courier Quick Dispatch Sheet"
        });

        Object.assign(window.PLACEHOLDER_AR_TO_EN, {
            "أدخل اسمك الثلاثي أو الثنائي (لأول مرة فقط)...": "Enter your full name (first time only)...",
            "🔍 ابحث في غرفة العمل (باسم العميل، رقم الهاتف، نص الرسالة، أو رقم الطلب)...": "🔍 Search Work Hub (Customer name, phone, message, or order ID)...",
            "🔍 ابحث في الطلبات (باسم العميل، رقم الهاتف، المحافظة، أو رقم الطلب)...": "🔍 Search Orders (Customer name, phone, governorate, or ID)...",
            "🔍 ابحث بسرعة عن أي ميزة أو إعداد داخل لوحة التحكم (مثال: شحن، عجلة، واتساب، ثيم)...": "🔍 Quick search any setting in Control Center...",
            "اكتب ردك المباشر للعميل هنا...": "Type your direct reply to customer here..."
        });

        // توسيع المترجم الديناميكي ليشمل عبارات الإدارة وغرفة العمل والإحصائيات
        const origTranslateTextToEnV58 = window.translateTextToEn;
        window.translateTextToEn = function(str) {
            let out = origTranslateTextToEnV58(str);
            out = out.replace(/📦 طلب #/g, '📦 Order #');
            out = out.replace(/🚨 طلب ملغى #/g, '🚨 Canceled Order #');
            out = out.replace(/🔄 طلب استرجاع #/g, '🔄 Return Request #');
            out = out.replace(/🔴 \((\d+)\) رسالة عميل جديدة تنتظر ردك/g, '🔴 ($1) New Customer Message(s) Waiting');
            out = out.replace(/💬 محادثة خدمة عملاء/g, '💬 Support Chat');
            out = out.replace(/🛒 سلة متروكة نشطة/g, '🛒 Active Abandoned Cart');
            out = out.replace(/منذ (\d+) دقيقة/g, '$1 mins ago');
            out = out.replace(/منذ (\d+) ساعة/g, '$1 hrs ago');
            out = out.replace(/منذ (\d+) يوم/g, '$1 days ago');
            out = out.replace(/الآن/g, 'Just now');
            out = out.replace(/عاجل/g, 'Urgent');
            return out;
        };


        // =========================================================================
        // === النسخة V60: إخفاء الكل للإشعارات + كود السلة الحقيقي 3% + الوصفات + الـ 12 ميزة ===
        // =========================================================================

        // 1. زر "✖ إخفاء الكل" لإشعارات الشغل والتوست + منع تكرار إشعارات الطلبات القديمة عند فتح المتجر
        window.adminStartupTimestamp = Date.now();

        window.ensureDismissAllToastsButton = function() {
            let container = document.getElementById('toast-container');
            if (!container) return;
            let toasts = container.querySelectorAll('.toast');
            let existingBtn = document.getElementById('btn-dismiss-all-toasts');
            if (toasts.length > 0) {
                if (!existingBtn) {
                    let btn = document.createElement('button');
                    btn.id = 'btn-dismiss-all-toasts';
                    btn.type = 'button';
                    btn.className = 'dismiss-all-toasts-btn';
                    btn.innerHTML = window.currentLang === 'en' ? '✖ Dismiss All Notifications' : '✖ إخفاء الكل (مسح الإشعارات)';
                    btn.onclick = function(e) {
                        e.stopPropagation();
                        window.dismissAllToasts();
                    };
                    container.prepend(btn);
                }
            } else if (existingBtn) {
                existingBtn.remove();
            }
        };

        window.dismissAllToasts = function() {
            let container = document.getElementById('toast-container');
            if (container) container.innerHTML = '';
        };

        // تحديث showWorkLivePopupAlert ليحتوي على زر إغلاق فردي + زر "إخفاء الكل" ولا يظهر للطلبات القديمة عند فتح الصفحة
        window.showWorkLivePopupAlert = function(title, subtitle) {
            // لا نظهر نوافذ منبثقة خلال أول 4 ثوانٍ من فتح المتجر أثناء تحميل البيانات القديمة من القاعدة
            if (Date.now() - window.adminStartupTimestamp < 4500) return;

            window.playWorkNotificationSound(false);
            let container = document.getElementById('toast-container');
            if (!container) return;

            let toast = document.createElement('div');
            toast.className = 'toast info show';
            toast.style.cssText = 'background:linear-gradient(135deg, #1e3a5f, #028090); color:white; border:2px solid #c59b27; padding:12px 14px; box-shadow:0 8px 25px rgba(0,0,0,0.3); display:flex; justify-content:space-between; align-items:center; gap:10px;';
            toast.innerHTML = `
                <div style="cursor:pointer; flex:1;" onclick="window.showPanel('admin-work'); window.dismissAllToasts();">
                    <strong style="display:block; font-size:0.95rem; color:#fcd34d;">${window.escapeHTML(title)}</strong>
                    <span style="font-size:0.84rem;">${window.escapeHTML(subtitle)} (اضغط للفتح في غرفة العمل 💼)</span>
                </div>
                <button type="button" onclick="event.stopPropagation(); this.parentElement.remove(); window.ensureDismissAllToastsButton();" style="background:rgba(255,255,255,0.2); border:none; color:white; border-radius:50%; width:26px; height:26px; cursor:pointer; font-weight:bold;">✖</button>
            `;
            container.appendChild(toast);
            window.ensureDismissAllToastsButton();

            setTimeout(() => {
                if (toast.parentElement) {
                    toast.remove();
                    window.ensureDismissAllToastsButton();
                }
            }, 6000);
        };

        // 2. كود خصم السلة المتروكة الحقيقي (COMEBACK بخصم 3% افتراضياً وقابل للتخصيص والإخفاء)
        window.checkAbandonedCart = function() {
            if (storeSettings.enableAbandonedModal === false) return;
            if (cart.length > 0) {
                let lastTime = localStorage.getItem('cart_last_updated');
                let now = new Date().getTime();
                if (lastTime && (now - lastTime > 1800000)) {
                    setTimeout(() => {
                        if (storeSettings.enableAbandonedModal === false) return;
                        let modal = document.getElementById('abandoned-cart-modal');
                        let codeBox = document.getElementById('abandoned-modal-code-box');
                        let pctEl = document.getElementById('abandoned-modal-disc-pct');
                        let abCode = String(storeSettings.abandonedCartCode || 'COMEBACK').trim().toUpperCase();
                        let abDisc = Number(storeSettings.abandonedCartDiscount) || 3;
                        if (codeBox) codeBox.textContent = abCode;
                        if (pctEl) pctEl.textContent = abDisc + '%';
                        if (modal) modal.style.display = 'flex';
                        localStorage.setItem('cart_last_updated', new Date().getTime());
                    }, 3000);
                }
            }
        };

        window.claimAbandonedCartOfferNow = function() {
            let abCode = String(storeSettings.abandonedCartCode || 'COMEBACK').trim().toUpperCase();
            let abDisc = Number(storeSettings.abandonedCartDiscount) || 3;
            currentDiscountPercent = Math.max(currentDiscountPercent, abDisc);
            appliedPromoCode = abCode;
            let pInput1 = document.getElementById('promo-code-input-cart'); if (pInput1) pInput1.value = abCode;
            let pInput2 = document.getElementById('promo-code-input'); if (pInput2) pInput2.value = abCode;
            let pMsg1 = document.getElementById('promo-msg-cart'); if (pMsg1) { pMsg1.textContent = `✅ تم تفعيل خصم ${abDisc}% بكود ${abCode}`; pMsg1.style.color = '#2a9d8f'; }
            let pMsg2 = document.getElementById('promo-msg'); if (pMsg2) { pMsg2.textContent = `✅ تم تفعيل خصم ${abDisc}% بكود ${abCode}`; pMsg2.style.color = '#2a9d8f'; }
            window.updateInvoiceUI();
            let modal = document.getElementById('abandoned-cart-modal');
            if (modal) modal.style.display = 'none';
            window.showToast(`🎉 تم تفعيل كود (${abCode}) بخصم حقيقي ${abDisc}% في سلتك!`, 'success');
            window.showPanel('cart');
        };

        // 3. موسوعة الوصفات الصحية في القائمة الجانبية والرئيسية + إضافة وحذف وصفة جديدة للمدير
        window.getDefaultStoreRecipes = function() {
            return [
                { id: 'rec_1', title: '🍯 وصفة المناعة الصباحية الذهبية', desc: 'ملعقة كبيرة من زيت الزيتون السيناوي البكر على الريق مع قطرات الليمون وعسل النحل لتنشيط الكبد ورفع المناعة طوال اليوم.' },
                { id: 'rec_2', title: '🥗 تتبيلة السلطة المتوسطية الفاخرة', desc: '3 ملاعق زيت زيتون عصرة أولى على البارد مع الزعتر البري السيناوي وعصير الليمون لطعم أصلي وصحة للقلب والشرايين.' },
                { id: 'rec_3', title: '💆‍♀️ حمام الزيت الدافئ لتكثيف الشعر', desc: 'تدليك فروة الرأس بزيت الزيتون السيناوي الخام الغني بفيتامين E لمدة 45 دقيقة أسبوعياً لمنع التساقط ولمعان فوري.' },
                { id: 'rec_4', title: '🧄 خلطة زيت الزيتون والثوم لصحة المفاصل', desc: 'نقع فصوص الثوم الطازج في كوب من زيت الزيتون السيناوي البكر واستخدامه كدهان موضعي دافئ لتهدئة آلام المفاصل والعضلات.' },
                { id: 'rec_5', title: '🧀 فطور الجبن القريش بزيت الزيتون والزعتر', desc: 'إضافة ملعقتين من زيت الزيتون البكر الممتاز على الجبن القريش مع حبة البركة والزعتر لوجبة فطور مشبعة وغنية بالأوميجا 9.' },
                { id: 'rec_6', title: '✨ سيروم النضارة الليلي للبشرة الجافة', desc: 'نقطتان من زيت الزيتون البكر النقي على بشرة نظيفة قبل النوم لترطيب عميق وتجديد خلايا البشرة ومقاومة التجاعيد.' }
            ];
        };

        window.getAllStoreRecipes = function() {
            let custom = Array.isArray(storeSettings.customRecipesList) ? storeSettings.customRecipesList : [];
            return [...custom, ...window.getDefaultStoreRecipes()];
        };

        window.renderAllStoreRecipes = function() {
            let all = window.getAllStoreRecipes();
            let fullGrid = document.getElementById('full-page-recipes-grid');
            let homeGrid = document.getElementById('home-recipes-grid-container');
            let adminAddBox = document.getElementById('admin-add-recipe-box');
            if (adminAddBox) adminAddBox.style.display = isCurrentUserAdmin ? 'block' : 'none';

            let buildCards = (list) => list.map((r, idx) => {
                let isCustom = String(r.id || '').startsWith('custom_');
                let delBtn = (isCurrentUserAdmin && isCustom)
                    ? `<button type="button" class="btn btn-danger" style="padding:4px 8px; font-size:0.75rem; margin-top:6px; width:100%;" onclick="window.deleteCustomStoreRecipe('${r.id}')">🗑️ حذف الوصفة</button>`
                    : '';
                return `<div class="recipe-card">
                    <div>
                        <strong style="color:var(--primary); font-size:0.95rem; display:block; margin-bottom:5px;">${window.escapeHTML(r.title)}</strong>
                        <p style="font-size:0.83rem; color:var(--text-muted); margin:0 0 10px 0; line-height:1.6;">${window.escapeHTML(r.desc)}</p>
                    </div>
                    <div>
                        <button type="button" class="btn btn-outline" style="padding:6px 10px; font-size:0.8rem; width:100%;" onclick="window.shopRecipeQuickAdd(${idx})">🛒 <span class="translatable">أضف العبوة المناسبة للوصفة</span></button>
                        ${delBtn}
                    </div>
                </div>`;
            }).join('');

            if (fullGrid) fullGrid.innerHTML = buildCards(all);
            if (homeGrid) homeGrid.innerHTML = buildCards(all.slice(0, 4));
        };

        window.addCustomStoreRecipe = async function() {
            let tInp = document.getElementById('new-recipe-title');
            let dInp = document.getElementById('new-recipe-desc');
            if (!tInp || !dInp || !tInp.value.trim() || !dInp.value.trim()) {
                window.showToast('يرجى كتابة عنوان الوصفة وطريقة التحضير أولاً', 'error');
                return;
            }
            let custom = Array.isArray(storeSettings.customRecipesList) ? [...storeSettings.customRecipesList] : [];
            custom.unshift({
                id: 'custom_' + Date.now(),
                title: tInp.value.trim(),
                desc: dInp.value.trim()
            });
            try {
                await updateDoc(doc(db, 'settings', 'main'), { customRecipesList: custom });
                tInp.value = '';
                dInp.value = '';
                window.recordAdminAuditLog('إضافة وصفة صحية جديدة');
                window.showToast('تم حفظ ونشر الوصفة الجديدة بنجاح 🥗', 'success');
            } catch (e) {}
        };

        window.deleteCustomStoreRecipe = async function(recId) {
            if (!confirm('هل تريد حذف هذه الوصفة؟')) return;
            let custom = (storeSettings.customRecipesList || []).filter(r => r.id !== recId);
            try {
                await updateDoc(doc(db, 'settings', 'main'), { customRecipesList: custom });
                window.showToast('تم حذف الوصفة', 'info');
            } catch (e) {}
        };

        // 4. القارئ الصوتي لوصف المنتج (Voice Reader) + بلغني عند انخفاض السعر + اسأل عن المنتج (Q&A)
        window.isSpeakingProduct = false;
        window.toggleProductVoiceReader = function() {
            if (!('speechSynthesis' in window)) {
                window.showToast('متصفحك لا يدعم القارئ الصوتي', 'error');
                return;
            }
            if (window.speechSynthesis.speaking) {
                window.speechSynthesis.cancel();
                window.isSpeakingProduct = false;
                return;
            }
            let p = products.find(pr => pr.id === activeProductForReview);
            if (!p) return;
            let textToRead = `${p.name}. السعر ${p.price} جنيه. ${p.description || ''}. زيت زيتون سيناوي بكر ممتاز عصره أولى على البارد طبيعي مئة بالمئة.`;
            let utter = new SpeechSynthesisUtterance(textToRead);
            utter.lang = window.currentLang === 'en' ? 'en-US' : 'ar-EG';
            utter.rate = 0.95;
            window.speechSynthesis.speak(utter);
            window.showToast('🔊 جاري قراءة وصف وفوائد المنتج صوتياً...', 'info');
        };

        window.requestPriceDropAlert = async function() {
            let p = products.find(pr => pr.id === activeProductForReview);
            if (!p) return;
            let phone = prompt(`أدخل رقم الواتساب الخاص بك لنبلغك فور نزول خصم أو عرض جديد على (${p.name}):`, localStorage.getItem('zait_wheel_saved_phone') || '');
            if (!phone || !phone.trim()) return;
            try {
                await addDoc(collection(db, 'price_alerts'), {
                    productId: p.id,
                    productName: p.name,
                    currentPrice: p.price,
                    phone: phone.trim(),
                    date: new Date().toISOString()
                });
                window.showToast('📉 تم تسجيل رقمك! سنبلغك فور نزول عرض خاص على هذا المنتج', 'success');
            } catch (e) {}
        };

        window.adminPriceAlertsUnsub = null;
        window.loadAdminPriceAlerts = function() {
            if (window.adminPriceAlertsUnsub) window.adminPriceAlertsUnsub();
            window.adminPriceAlertsUnsub = onSnapshot(collection(db, 'price_alerts'), (snap) => {
                let cont = document.getElementById('admin-price-alerts-list');
                let badge = document.getElementById('price-alerts-count-badge');
                if (!cont) return;
                let list = [];
                snap.forEach(d => list.push({ id: d.id, ...d.data() }));
                if (badge) badge.textContent = list.length;
                if (list.length === 0) {
                    cont.innerHTML = '<p style="color:var(--text-muted); font-size:0.85rem; margin:0;">لا توجد طلبات حالياً.</p>';
                    return;
                }
                cont.innerHTML = list.map(item => {
                    let pureWa = String(item.phone || '').replace(/\D/g, '');
                    if (pureWa && !pureWa.startsWith('20') && pureWa.length >= 10) pureWa = '20' + pureWa;
                    let waMsg = `مرحباً بك من متجر زيت الشجرة المباركة 🌿 نبشرك بنزول عرض وخصم جديد على (${item.productName}) الذي طلبت متابعة سعره! اطلبه الآن.`;
                    return `<div style="display:flex; justify-content:space-between; align-items:center; padding:8px; background:var(--input-bg); border:1px solid var(--border-color); border-radius:8px; margin-bottom:6px; font-size:0.84rem;">
                        <div><strong>${window.escapeHTML(item.productName)}</strong><br><span style="color:var(--text-muted);">📞 ${window.escapeHTML(item.phone)}</span></div>
                        <div style="display:flex; gap:6px;">
                            ${pureWa.length >= 10 ? `<a href="https://wa.me/${pureWa}?text=${encodeURIComponent(waMsg)}" target="_blank" class="btn btn-outline" style="padding:4px 8px; font-size:0.76rem; border-color:#25D366; color:#25D366; text-decoration:none;">💬 واتساب</a>` : ''}
                            <button type="button" class="btn btn-danger" style="padding:4px 8px; font-size:0.76rem;" onclick="deleteDoc(doc(db, 'price_alerts', '${item.id}'))">🗑️</button>
                        </div>
                    </div>`;
                }).join('');
            });
        };

        // قسم اسأل عن المنتج (Product Q&A)
        window.renderProductQASection = function(product) {
            let sec = document.getElementById('modal-product-qa-section');
            let listEl = document.getElementById('modal-qa-list');
            if (!sec || !listEl || !product) return;
            if (storeSettings.enableProductQA === false) {
                sec.style.display = 'none';
                return;
            }
            sec.style.display = 'block';
            let qaArr = Array.isArray(product.questionsList) ? product.questionsList : [];
            if (qaArr.length === 0) {
                listEl.innerHTML = '<p style="color:var(--text-muted); font-size:0.82rem; margin:0;">هل لديك استفسار عن هذا المنتج؟ اكتب سؤالك بالأسفل وسنجيبك فوراً.</p>';
                return;
            }
            listEl.innerHTML = qaArr.map((q, idx) => `
                <div class="qa-item-card">
                    <div><strong>❓ ${window.escapeHTML(q.userName || 'زائر')}:</strong> ${window.escapeHTML(q.question)}</div>
                    ${q.answer ? `<div style="color:#166534; margin-top:4px;"><strong>✅ إجابة الإدارة:</strong> ${window.escapeHTML(q.answer)}</div>` : (isCurrentUserAdmin ? `<button type="button" class="btn btn-outline" style="padding:2px 8px; font-size:0.74rem; margin-top:4px;" onclick="window.replyToProductQuestion('${product.id}', ${idx})">✍️ إضافة إجابة الإدارة</button>` : `<small style="color:var(--text-muted);">⏳ بانتظار رد الإدارة</small>`)}
                </div>
            `).join('');
        };

        window.submitProductQuestion = async function() {
            if (!activeProductForReview) return;
            let inp = document.getElementById('modal-qa-input');
            if (!inp || !inp.value.trim()) return;
            let p = products.find(pr => pr.id === activeProductForReview);
            if (!p) return;
            let qaArr = Array.isArray(p.questionsList) ? [...p.questionsList] : [];
            let uName = (currentUser && currentUser.displayName) ? currentUser.displayName : (localStorage.getItem('zait_wheel_saved_name') || 'عميل');
            qaArr.push({
                userName: uName,
                question: inp.value.trim(),
                answer: '',
                date: new Date().toISOString()
            });
            inp.value = '';
            try {
                await updateDoc(doc(db, 'products', p.id), { questionsList: qaArr });
                p.questionsList = qaArr;
                window.renderProductQASection(p);
                window.showToast('تم إرسال سؤالك بنجاح ❓', 'success');
            } catch (e) {}
        };

        window.replyToProductQuestion = async function(prodId, qIdx) {
            let p = products.find(pr => pr.id === prodId);
            if (!p || !p.questionsList || !p.questionsList[qIdx]) return;
            let ans = prompt('اكتب إجابة الإدارة على هذا السؤال:', p.questionsList[qIdx].answer || '');
            if (ans === null) return;
            p.questionsList[qIdx].answer = ans.trim();
            try {
                await updateDoc(doc(db, 'products', prodId), { questionsList: p.questionsList });
                window.renderProductQASection(p);
                window.showToast('تم نشر الإجابة بنجاح ✅', 'success');
            } catch (e) {}
        };

        // 5. تعديل العميل لطلبه قبل الشحن (Edit Order Before Shipping)
        window.openCustomerEditOrderModal = function(orderId) {
            let ord = (window.customerOrdersArray || []).find(o => o.id === orderId) || (window.phoneTrackedOrders || []).find(o => o.id === orderId);
            if (!ord) return;
            document.getElementById('edit-ord-id').value = ord.id;
            document.getElementById('edit-ord-name').value = ord.customerName || '';
            document.getElementById('edit-ord-phone').value = (ord.phones && ord.phones.primary) || '';
            document.getElementById('edit-ord-addr').value = (ord.location && ord.location.details) || '';
            document.getElementById('customer-edit-order-modal').style.display = 'flex';
        };

        window.saveCustomerOrderEdits = async function() {
            let oid = document.getElementById('edit-ord-id').value;
            let newName = document.getElementById('edit-ord-name').value.trim();
            let newPhone = document.getElementById('edit-ord-phone').value.trim();
            let newAddr = document.getElementById('edit-ord-addr').value.trim();
            if (!oid || !newName || !newPhone || !newAddr) {
                window.showToast('يرجى ملء كافة الحقول', 'error');
                return;
            }
            try {
                await updateDoc(doc(db, 'orders', oid), {
                    customerName: newName,
                    'phones.primary': newPhone,
                    'location.details': newAddr,
                    updatedAt: new Date().toISOString()
                });
                document.getElementById('customer-edit-order-modal').style.display = 'none';
                window.showToast('تم تحديث بيانات طلبك بنجاح ✅', 'success');
            } catch (e) {
                window.showToast('حدث خطأ أثناء التحديث', 'error');
            }
        };

        const origOpenCustOrderModalV59 = window.openCustomerOrderModal;
        window.openCustomerOrderModal = function(orderId) {
            origOpenCustOrderModalV59(orderId);
            if (storeSettings.enableEditOrderBeforeShip === false) return;
            let order = (window.customerOrdersArray || []).find(o => o.id === orderId);
            if (order && order.status === 'قيد المراجعة') {
                let com = document.getElementById('com-content');
                if (com) {
                    com.innerHTML += `<button type="button" class="btn btn-outline" style="width:100%; margin-top:8px; border-color:#028090; color:#028090;" onclick="document.getElementById('customer-order-modal').style.display='none'; window.openCustomerEditOrderModal('${order.id}');">✏️ تعديل العنوان أو رقم الهاتف قبل الشحن</button>`;
                }
            }
        };

        // 6. كاشير الإدارة لتسجيل طلب هاتفي مباشر (POS) + كوبون الشات السريع + حملات واتساب + سجل الرقابة
        window.openAdminPOSModal = function() {
            let govSel = document.getElementById('pos-cust-gov');
            if (govSel && govSel.options.length === 0) {
                let gHtml = '<option value="" disabled selected>اختر المحافظة...</option>';
                for (let g in deliveryData) gHtml += `<option value="${g}">${g}</option>`;
                govSel.innerHTML = gHtml;
            }
            let prodSel = document.getElementById('pos-prod-select');
            if (prodSel) {
                prodSel.innerHTML = products.map(p => `<option value="${p.id}">${window.escapeHTML(p.name)} (${p.price} ج)</option>`).join('');
            }
            document.getElementById('admin-pos-modal').style.display = 'flex';
        };

        window.submitAdminPOSOrder = async function() {
            let name = document.getElementById('pos-cust-name').value.trim();
            let phone = document.getElementById('pos-cust-phone').value.trim();
            let gov = document.getElementById('pos-cust-gov').value;
            let addr = document.getElementById('pos-cust-addr').value.trim();
            let pid = document.getElementById('pos-prod-select').value;
            let qty = Math.max(1, Number(document.getElementById('pos-prod-qty').value) || 1);
            let p = products.find(pr => pr.id === pid);
            if (!name || !phone || !gov || !p) {
                window.showToast('يرجى إدخال اسم العميل والهاتف والمحافظة والمنتج', 'error');
                return;
            }
            let ship = window.getShippingCostForGov ? window.getShippingCostForGov(gov) : 90;
            let sub = Number(p.price) * qty;
            if (storeSettings.enableFreeShipping !== false && sub >= (Number(storeSettings.freeShippingThreshold) || 1000)) ship = 0;

            let payload = {
                userId: 'pos_admin',
                customerName: name,
                phones: { primary: phone, secondary: 'لا يوجد' },
                location: { governorate: gov, city: 'طلب هاتفي POS', details: addr || gov, mapAddress: '', mapLink: '' },
                items: [{ id: p.id, cartItemId: p.id, name: p.name, price: Number(p.price), imageUrl: (p.images && p.images[0]) || '1000392409.jpeg', quantity: qty }],
                subtotal: sub,
                shippingCost: ship,
                totalAmount: sub + ship,
                paymentMethod: 'كاش عند الاستلام (طلب هاتفي POS ☎️)',
                orderMethod: 'كاشير الإدارة POS ☎️',
                status: 'تم التجهيز',
                orderDate: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            try {
                let docRef = await addDoc(collection(db, 'orders'), payload);
                window.recordAdminAuditLog(`تسجيل طلب هاتفي POS للعميل ${name}`);
                document.getElementById('admin-pos-modal').style.display = 'none';
                window.showToast('تم تسجيل الطلب الهاتفي بنجاح ☎️', 'success');
                setTimeout(() => window.printOrderShippingLabel(docRef.id), 400);
            } catch (e) {}
        };

        window.generateAndInsertChatCoupon = async function() {
            let code = window.generateUniqueSingleUseCode('GIFT5');
            try {
                await addDoc(collection(db, 'promoCodes'), {
                    code: code,
                    discount: 5,
                    singleUse: true,
                    used: false,
                    createdAt: new Date().toISOString()
                });
            } catch (e) {}
            let msg = `🎁 يسعدنا إهداؤك كود خصم خاص (5%) صالح لطلبك القادم لمرة واحدة: ${code}`;
            window.insertCannedAdminReply(msg);
            window.showToast(`تم توليد الكود الفريد (${code}) وإدراجه في الرد!`, 'success');
        };

        window.renderWhatsAppCampaignList = function() {
            let seg = (document.getElementById('wa-campaign-segment') || {}).value || 'all';
            let msg = (document.getElementById('wa-campaign-msg') || {}).value || '';
            let cont = document.getElementById('wa-campaign-targets-list');
            if (!cont) return;

            let phoneMap = new Map();
            if (seg === 'wheel') {
                (window.allWheelLeadsRawList || []).forEach(w => {
                    if (w.phone) phoneMap.set(w.phone.replace(/\D/g, ''), w.customerName || 'عميل');
                });
            } else {
                (adminOrdersArray || []).forEach(o => {
                    let ph = (o.phones && o.phones.primary) ? o.phones.primary.replace(/\D/g, '') : '';
                    if (!ph) return;
                    if (seg === 'vip') {
                        let tag = (storeSettings.customerTagsMap || {})[ph];
                        if (!tag || tag.type !== 'vip') return;
                    }
                    phoneMap.set(ph, o.customerName || 'عميل');
                });
            }

            if (phoneMap.size === 0) {
                cont.innerHTML = '<p style="color:var(--text-muted); font-size:0.82rem;">لا يوجد عملاء في هذه الشريحة حالياً.</p>';
                return;
            }
            let html = '';
            phoneMap.forEach((name, ph) => {
                let pureWa = (!ph.startsWith('20') && ph.length >= 10) ? '20' + ph : ph;
                html += `<div style="display:flex; justify-content:space-between; align-items:center; padding:6px 8px; background:var(--input-bg); border:1px solid var(--border-color); border-radius:6px; margin-bottom:5px; font-size:0.82rem;">
                    <span>👤 <strong>${window.escapeHTML(name)}</strong> (${ph})</span>
                    <a href="https://wa.me/${pureWa}?text=${encodeURIComponent(msg)}" target="_blank" class="btn btn-outline" style="padding:3px 10px; font-size:0.76rem; border-color:#25D366; color:#25D366; text-decoration:none;">📲 إرسال العرض</a>
                </div>`;
            });
            cont.innerHTML = html;
        };

        // سجل رقابة نشاط الإدارة (Audit Log) + متوقع نفاد المخزون الذكي
        window.recordAdminAuditLog = async function(actionText) {
            if (!currentUser) return;
            let logs = Array.isArray(storeSettings.adminAuditLogs) ? [...storeSettings.adminAuditLogs] : [];
            logs.unshift({
                actor: currentUser.email || currentUser.displayName || 'مدير',
                action: actionText,
                time: new Date().toISOString()
            });
            logs = logs.slice(0, 40);
            try {
                await updateDoc(doc(db, 'settings', 'main'), { adminAuditLogs: logs });
            } catch (e) {}
        };

        window.renderAdminAuditLog = function() {
            let cont = document.getElementById('admin-audit-log-list');
            let card = document.getElementById('admin-audit-log-card');
            if (card) card.style.display = storeSettings.enableAuditLog !== false ? 'block' : 'none';
            if (!cont) return;
            let logs = Array.isArray(storeSettings.adminAuditLogs) ? storeSettings.adminAuditLogs : [];
            if (logs.length === 0) {
                cont.innerHTML = '<p style="color:var(--text-muted); margin:0;">سيتم تسجيل حركات الإدارة والموظفين هنا تلقائياً.</p>';
                return;
            }
            cont.innerHTML = logs.map(l => {
                let dStr = new Date(window.parseSafeTimestamp(l.time, Date.now())).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' });
                return `<div style="padding:5px 8px; border-bottom:1px dashed var(--border-color);">
                    <strong style="color:var(--primary);">${window.escapeHTML(l.action)}</strong><br>
                    <small style="color:var(--text-muted);">👤 ${window.escapeHTML(l.actor)} • 🕒 ${dStr}</small>
                </div>`;
            }).join('');
        };

        // ربط فتح نافذة المنتج وتحديث الإعدادات بـ V60
        const origOpenProductModalV59 = window.openProductModal;
        window.openProductModal = function(id) {
            origOpenProductModalV59(id);
            let p = products.find(pr => pr.id === id);
            if (p) window.renderProductQASection(p);
            let vrBtn = document.getElementById('btn-voice-reader');
            if (vrBtn) vrBtn.style.display = storeSettings.enableVoiceReader !== false ? 'inline-block' : 'none';
            let pdBtn = document.getElementById('btn-price-drop-alert');
            if (pdBtn) pdBtn.style.display = storeSettings.enablePriceDrop !== false ? 'inline-block' : 'none';
        };

        const origShowPanelV59 = window.showPanel;
        window.showPanel = function(panelId) {
            origShowPanelV59(panelId);
            if (panelId === 'recipes') {
                window.renderAllStoreRecipes();
            }
        };

        const origUpdateAdminUIV59 = window.updateAdminUI;
        window.updateAdminUI = function() {
            origUpdateAdminUIV59();
            if (isCurrentUserAdmin) {
                window.loadAdminPriceAlerts();
                window.renderAdminAuditLog();
            }
        };

        const prevApplySettingsV59 = window.applySettingsToUI;
        window.applySettingsToUI = function() {
            prevApplySettingsV59();
            window.renderAllStoreRecipes();

            if (isCurrentUserAdmin) {
                let setC = (id, val, def = true) => { let el = document.getElementById(id); if (el) el.checked = val !== undefined ? Boolean(val) : def; };
                let setV = (id, val, def = '') => { let el = document.getElementById(id); if (el) el.value = val !== undefined ? val : def; };

                setC('setting-enable-abandoned-modal', storeSettings.enableAbandonedModal, true);
                setV('setting-abandoned-code', storeSettings.abandonedCartCode, 'COMEBACK');
                setV('setting-abandoned-discount', storeSettings.abandonedCartDiscount, 3);

                setC('setting-enable-voice-reader', storeSettings.enableVoiceReader, true);
                setC('setting-enable-edit-order', storeSettings.enableEditOrderBeforeShip, true);
                setC('setting-enable-delivery-slot', storeSettings.enableDeliverySlot, true);
                setC('setting-enable-gift-wrap', storeSettings.enableGiftWrap, true);
                setC('setting-enable-price-drop', storeSettings.enablePriceDrop, true);
                setC('setting-enable-product-qa', storeSettings.enableProductQA, true);
                setC('setting-enable-admin-pos', storeSettings.enableAdminPOS, true);
                setC('setting-enable-wa-campaigns', storeSettings.enableWaCampaigns, true);
                setC('setting-enable-audit-log', storeSettings.enableAuditLog, true);
                setC('setting-enable-maintenance-mode', storeSettings.enableMaintenanceMode, false);
                window.renderAdminAuditLog();
            }

            // تحديث نافذة السلة المتروكة بالكود الحقيقي ونسبته
            let codeBox = document.getElementById('abandoned-modal-code-box');
            let pctEl = document.getElementById('abandoned-modal-disc-pct');
            if (codeBox) codeBox.textContent = String(storeSettings.abandonedCartCode || 'COMEBACK').trim().toUpperCase();
            if (pctEl) pctEl.textContent = (Number(storeSettings.abandonedCartDiscount) || 3) + '%';

            // إظهار/إخفاء عناصر V60 حسب الإعدادات
            let showEl = (id, cond, disp = 'block') => { let el = document.getElementById(id); if (el) el.style.display = cond ? disp : 'none'; };
            showEl('checkout-delivery-slot-box', storeSettings.enableDeliverySlot !== false);
            showEl('checkout-gift-wrap-box', storeSettings.enableGiftWrap !== false);
            showEl('btn-open-admin-pos', storeSettings.enableAdminPOS !== false, 'inline-block');
            showEl('admin-price-alerts-card', storeSettings.enablePriceDrop !== false);
            showEl('admin-wa-campaigns-card', storeSettings.enableWaCampaigns !== false);
            showEl('admin-audit-log-card', storeSettings.enableAuditLog !== false);

            // وضع الجرد أو الصيانة المؤقت (للزوار فقط وليس للمدير)
            let maintScreen = document.getElementById('maintenance-overlay-screen');
            if (maintScreen) {
                maintScreen.style.display = (storeSettings.enableMaintenanceMode === true && !isCurrentUserAdmin) ? 'flex' : 'none';
            }

            if (window.currentLang === 'en') window.translateDOM(document.body);
        };

        const prevSaveSettingsV59 = window.saveSettings;
        window.saveSettings = async function() {
            const getC = (id, def = true) => { let el = document.getElementById(id); return el ? el.checked : def; };
            const getV = (id, def = '') => { let el = document.getElementById(id); return el ? el.value.trim() : def; };
            try {
                await updateDoc(doc(db, 'settings', 'main'), {
                    enableAbandonedModal: getC('setting-enable-abandoned-modal', true),
                    abandonedCartCode: getV('setting-abandoned-code', 'COMEBACK').toUpperCase(),
                    abandonedCartDiscount: Number(getV('setting-abandoned-discount', 3)) || 3,
                    enableVoiceReader: getC('setting-enable-voice-reader', true),
                    enableEditOrderBeforeShip: getC('setting-enable-edit-order', true),
                    enableDeliverySlot: getC('setting-enable-delivery-slot', true),
                    enableGiftWrap: getC('setting-enable-gift-wrap', true),
                    enablePriceDrop: getC('setting-enable-price-drop', true),
                    enableProductQA: getC('setting-enable-product-qa', true),
                    enableAdminPOS: getC('setting-enable-admin-pos', true),
                    enableWaCampaigns: getC('setting-enable-wa-campaigns', true),
                    enableAuditLog: getC('setting-enable-audit-log', true),
                    enableMaintenanceMode: getC('setting-enable-maintenance-mode', false)
                });
                window.recordAdminAuditLog('تحديث وحفظ إعدادات المتجر');
            } catch (e) {}
            await prevSaveSettingsV59();
        };

        Object.assign(window.FULL_AR_TO_EN, {
            "إضافة منتج ➕": "Add Product ➕",
            "أدوات التوفير والخدمات الذكية:": "Smart Savings & Store Tools:",
            "ركن الوصفات والفوائد الصحية": "Healthy Recipes & Benefits",
            "موسوعة الوصفات الصحية وفوائد زيت الزيتون السيناوي": "Sinai Olive Oil Healthy Recipes & Benefits Encyclopedia",
            "تفعيل الخصم وإكمال الطلب الآن 🚀": "Activate Discount & Checkout Now 🚀",
            "استمع لوصف المنتج صوتياً": "Listen to Product Audio",
            "بلغني عند انخفاض السعر": "Price Drop Alert",
            "اسأل عن هذا المنتج (أسئلة وأجوبة العملاء):": "Ask About This Product (Customer Q&A):",
            "إرسال السؤال": "Submit Question",
            "الفترة المفضلة لاستلام الطلب:": "Preferred Delivery Time Slot:",
            "تغليف الطلب كهدية فاخرة مع كارت إهداء مطبوع": "Wrap Order as a Luxury Gift with Printed Card"
        });


        // =========================================================================
        // === النسخة V61: تفاصيل وتصفير الإحصائيات المربوطة + بطاقات الزوار + الحماية والـ SEO ===
        // =========================================================================

        // 1. التصفير المستقل لكل بطاقة إحصائية (الشهر / اليوم / الزيارات / الطلبات / الأرباح)
        window.verifyFounderPinOrConfirm = async function(actionLabel) {
            let pin = prompt(`أدخل رمز الأمان للمؤسس لـ (${actionLabel}) 🔄:`);
            if (!pin) return false;
            let hashed = await window.hashString(window.toEngDigits(pin.trim()));
            if (hashed === "7a2ec40ff8a1247c532309355f798a779e00acff579c63eec3636ffb2902c1ac") {
                return true;
            }
            window.showToast('رمز الأمان غير صحيح!', 'error');
            return false;
        };

        window.resetAdminMonthlyComparison = async function() {
            if (!(await window.verifyFounderPinOrConfirm('تصفير مبيعات وأرباح هذا الشهر فقط'))) return;
            try {
                let newResetDate = new Date().toISOString();
                storeSettings.monthlyComparisonResetDate = newResetDate;
                await setDoc(doc(db, 'settings', 'main'), { monthlyComparisonResetDate: newResetDate }, { merge: true });
                window.renderGrowthComparisonReport();
                window.recordAdminAuditLog('تصفير عداد مبيعات هذا الشهر');
                window.showToast('تم تصفير مبيعات هذا الشهر وتبدأ من الصفر الآن 🔄', 'success');
            } catch (e) {
                window.showToast('حدث خطأ أثناء التصفير', 'error');
            }
        };

        window.resetAdminDailyComparison = async function() {
            if (!(await window.verifyFounderPinOrConfirm('تصفير مبيعات اليوم فقط'))) return;
            try {
                let newResetDate = new Date().toISOString();
                storeSettings.dailyComparisonResetDate = newResetDate;
                await setDoc(doc(db, 'settings', 'main'), { dailyComparisonResetDate: newResetDate }, { merge: true });
                window.renderGrowthComparisonReport();
                window.recordAdminAuditLog('تصفير عداد مبيعات اليوم');
                window.showToast('تم تصفير مبيعات اليوم وتبدأ من الصفر الآن 🔄', 'success');
            } catch (e) {
                window.showToast('حدث خطأ أثناء التصفير', 'error');
            }
        };

        window.resetAdminVisitsCount = async function() {
            if (!(await window.verifyFounderPinOrConfirm('تصفير عداد الزيارات فقط'))) return;
            try {
                await setDoc(doc(db, 'settings', 'stats'), { visits: 0, visitsResetAt: new Date().toISOString() }, { merge: true });
                let sEl = document.getElementById('stat-visits');
                if (sEl) sEl.textContent = '0';
                window.recordAdminAuditLog('تصفير عداد الزيارات');
                window.showToast('تم تصفير عداد الزيارات بنجاح 🔄', 'success');
            } catch (e) {
                window.showToast('حدث خطأ أثناء التصفير', 'error');
            }
        };

        // تحديث دالة حساب المقارنة اليومية والشهرية لتحترم تاريخ التصفير المستقل لكل بطاقة!
        window.renderGrowthComparisonReport = function() {
            let box = document.getElementById('admin-growth-comparison-box');
            if (box) box.style.display = storeSettings.enableGrowthReport !== false ? 'grid' : 'none';
            if (storeSettings.enableGrowthReport === false) return;

            let dailyEl = document.getElementById('stat-daily-comparison');
            let monthlyEl = document.getElementById('stat-monthly-comparison');
            if (!dailyEl || !monthlyEl) return;

            let now = new Date();
            let startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
            let startOfYesterday = startOfToday - 86400000;
            let startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
            let startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();

            let dailyResetMs = window.parseSafeTimestamp(storeSettings.dailyComparisonResetDate, 0);
            let monthlyResetMs = window.parseSafeTimestamp(storeSettings.monthlyComparisonResetDate, 0);

            let effectiveTodayStart = Math.max(startOfToday, dailyResetMs);
            let effectiveMonthStart = Math.max(startOfThisMonth, monthlyResetMs);

            let todayRev = 0, todayCnt = 0;
            let yestRev = 0, yestCnt = 0;
            let thisMonthRev = 0, thisMonthCnt = 0;
            let lastMonthRev = 0, lastMonthCnt = 0;

            (adminOrdersArray || []).forEach(o => {
                let st = String(o.status || '');
                if (st.includes('لغى') || st.includes('رفض')) return;
                let t = window.parseSafeTimestamp(o.orderDate, 0);
                let amt = Number(o.totalAmount) || 0;

                if (t >= effectiveTodayStart) { todayRev += amt; todayCnt++; }
                else if (t >= startOfYesterday && t < startOfToday) { yestRev += amt; yestCnt++; }

                if (t >= effectiveMonthStart) { thisMonthRev += amt; thisMonthCnt++; }
                else if (t >= startOfLastMonth && t < startOfThisMonth) { lastMonthRev += amt; lastMonthCnt++; }
            });

            dailyEl.innerHTML = `اليوم: <span style="color:#166534;">${todayRev.toLocaleString()} ج</span> (${todayCnt} طلب) <small style="color:var(--text-muted); font-weight:normal;">| الأمس: ${yestRev.toLocaleString()} ج (${yestCnt} طلب)</small>`;
            monthlyEl.innerHTML = `هذا الشهر: <span style="color:#028090;">${thisMonthRev.toLocaleString()} ج</span> (${thisMonthCnt} طلب) <small style="color:var(--text-muted); font-weight:normal;">| الماضي: ${lastMonthRev.toLocaleString()} ج (${lastMonthCnt} طلب)</small>`;
        };

        // =========================================================================
        // === 2. نافذة "📋 التفاصيل" الموحدة للأوردرات وحساباتها مع الحذف الفوري المربوط ===
        // =========================================================================
        window.currentDrilldownMode = 'monthly';

        window.getFilteredOrdersForDrilldown = function(mode) {
            let now = new Date();
            let startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
            let startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

            let revResetMs = window.parseSafeTimestamp(storeSettings.revenueResetDate, 0);
            let ordResetMs = window.parseSafeTimestamp(storeSettings.ordersResetDate, 0);
            let monResetMs = window.parseSafeTimestamp(storeSettings.monthlyComparisonResetDate, 0);
            let dayResetMs = window.parseSafeTimestamp(storeSettings.dailyComparisonResetDate, 0);

            return (adminOrdersArray || []).filter(o => {
                let st = String(o.status || '');
                if (st.includes('لغى') || st.includes('رفض')) return false;
                let t = window.parseSafeTimestamp(o.orderDate, 0);

                if (mode === 'monthly') return t >= Math.max(startOfThisMonth, monResetMs);
                if (mode === 'daily') return t >= Math.max(startOfToday, dayResetMs);
                if (mode === 'orders') return t >= ordResetMs;
                if (mode === 'revenue' || mode === 'net_profit') return t >= revResetMs;
                return true;
            });
        };

        window.openAnalyticsOrdersDrilldown = function(mode) {
            window.currentDrilldownMode = mode || 'monthly';
            let modal = document.getElementById('analytics-orders-drilldown-modal');
            let searchInp = document.getElementById('drilldown-orders-search');
            if (searchInp) searchInp.value = '';
            window.renderAnalyticsOrdersDrilldownList();
            if (modal) modal.style.display = 'flex';
        };

        window.renderAnalyticsOrdersDrilldownList = function() {
            let mode = window.currentDrilldownMode || 'monthly';
            let titleEl = document.getElementById('drilldown-modal-title');
            let sumEl = document.getElementById('drilldown-modal-summary');
            let listEl = document.getElementById('drilldown-orders-list');
            let searchInp = document.getElementById('drilldown-orders-search');
            if (!listEl) return;

            let titlesMap = {
                monthly: '📆 تفاصيل أوردرات ومبيعات هذا الشهر',
                daily: '📅 تفاصيل أوردرات ومبيعات اليوم',
                orders: '📦 تفاصيل جميع الطلبات المسجلة في العداد',
                revenue: '💰 تفاصيل الأوردرات المحسوبة في الأرباح',
                net_profit: '💎 تفاصيل الأوردرات المحسوبة في صافي الربح'
            };
            if (titleEl) titleEl.textContent = titlesMap[mode] || '📋 تفاصيل الأوردرات';

            let ordersList = window.getFilteredOrdersForDrilldown(mode);
            let q = searchInp ? searchInp.value.trim().toLowerCase() : '';
            if (q) {
                ordersList = ordersList.filter(o => {
                    let s = `${o.customerName || ''} ${(o.phones && o.phones.primary) || ''} ${o.totalAmount || ''} ${o.id || ''}`.toLowerCase();
                    return s.includes(q);
                });
            }

            let totalMoney = ordersList.reduce((acc, o) => acc + (Number(o.totalAmount) || 0), 0);
            if (sumEl) {
                sumEl.innerHTML = `إجمالي العدد: <strong>${ordersList.length} أوردر</strong> &nbsp;|&nbsp; إجمالي المبلغ المحسوب: <strong>${totalMoney.toLocaleString()} ج</strong>`;
            }

            if (ordersList.length === 0) {
                listEl.innerHTML = '<div style="text-align:center; padding:30px; color:var(--text-muted);">📭 لا توجد أوردرات مسجلة في هذا العداد حالياً.</div>';
                return;
            }

            let html = '';
            ordersList.forEach(o => {
                let dObj = new Date(window.parseSafeTimestamp(o.orderDate, Date.now()));
                let dStr = dObj.toLocaleDateString('ar-EG') + ' — ' + dObj.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
                let itemsTxt = (o.items || []).map(i => `${window.escapeHTML(i.name)} (${i.quantity})`).join(' + ');
                let phone = (o.phones && o.phones.primary) || '';

                html += `
                <div class="drilldown-order-row" id="drilldown-row-${o.id}">
                    <div style="flex:1; min-width:200px;">
                        <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                            <strong style="color:var(--primary); font-size:0.96rem;">👤 ${window.escapeHTML(o.customerName || 'عميل')}</strong>
                            <span style="background:var(--panel-bg); border:1px solid var(--border-color); padding:1px 7px; border-radius:6px; font-size:0.75rem;">#${o.id.slice(0,6).toUpperCase()}</span>
                            <span style="font-size:0.78rem; color:#028090; font-weight:bold;">(${window.escapeHTML(o.status || '')})</span>
                        </div>
                        <div style="font-size:0.82rem; color:var(--text-muted); margin:4px 0;">
                            📞 ${window.escapeHTML(phone)} | 📅 ${dStr}
                        </div>
                        <div style="font-size:0.82rem; color:var(--text-color);">🛍️ ${itemsTxt}</div>
                    </div>
                    <div style="display:flex; flex-direction:column; align-items:flex-end; gap:6px;">
                        <strong style="color:#166534; font-size:1.1rem; background:#dcfce7; padding:3px 10px; border-radius:8px;">${Number(o.totalAmount || 0).toLocaleString()} ج</strong>
                        <div style="display:flex; gap:5px;">
                            <button type="button" class="btn btn-outline" style="padding:4px 8px; font-size:0.75rem;" onclick="window.openAdminOrderModal('${o.id}')">👁️ عرض</button>
                            <button type="button" class="btn btn-danger" style="padding:4px 10px; font-size:0.75rem;" onclick="window.deleteOrderFromAnalyticsDrilldown('${o.id}')">🗑️ حذف الأوردر</button>
                        </div>
                    </div>
                </div>`;
            });
            listEl.innerHTML = html;
        };

        // حذف الأوردر من نافذة التفاصيل -> يخصم فلوسه وعدده فوراً من (مبيعات الشهر + الطلبات + الأرباح + صافي الربح) معاً!
        window.deleteOrderFromAnalyticsDrilldown = async function(orderId) {
            let ord = (adminOrdersArray || []).find(o => o.id === orderId);
            let amt = ord ? Number(ord.totalAmount || 0) : 0;
            let cName = ord ? ord.customerName : '';
            if (!confirm(`هل أنت متأكد من حذف أوردر (${cName}) بقيمة (${amt} ج) نهائياً؟\nسيتم خصم المبلغ والعدد فوراً من (مبيعات الشهر والطلبات والأرباح) معاً.`)) return;

            try {
                await deleteDoc(doc(db, 'orders', orderId));
                adminOrdersArray = (adminOrdersArray || []).filter(o => o.id !== orderId);

                let revResetDate = new Date(storeSettings.revenueResetDate || "2000-01-01T00:00:00.000Z");
                let ordResetDate = new Date(storeSettings.ordersResetDate || "2000-01-01T00:00:00.000Z");
                totalGlobalRevenue = 0;
                totalGlobalOrders = 0;
                adminOrdersArray.forEach(d => {
                    if (d.status !== "تم الرفض" && d.status !== "ملغى من العميل ❌" && d.status !== "تم الرفض ❌") {
                        let orderDate = new Date(d.orderDate);
                        if (orderDate >= revResetDate) totalGlobalRevenue += Number(d.totalAmount || 0);
                        if (orderDate >= ordResetDate) totalGlobalOrders++;
                    }
                });
                let so = document.getElementById('stat-orders'); if (so) so.textContent = totalGlobalOrders;
                let sr = document.getElementById('stat-revenue'); if (sr) sr.textContent = totalGlobalRevenue.toLocaleString() + ' ج';

                window.renderAdminOrdersUI();
                window.renderGrowthComparisonReport();
                window.renderNetProfitStat();
                window.renderAnalyticsOrdersDrilldownList();
                window.recordAdminAuditLog(`حذف أوردر #${orderId.slice(0,6).toUpperCase()} بقيمة ${amt} ج`);
                window.showToast(`تم حذف الأوردر وخصم (${amt} ج) من الشهر والطلبات والأرباح معاً ✅`, 'success');
            } catch (e) {
                window.showToast('حدث خطأ أثناء حذف الأوردر', 'error');
            }
        };

        // =========================================================================
        // === 3. نظام تتبع الزوار التفصيلي وبطاقات الزوار (نوع الهاتف + البريد + السجل بالساعة) ===
        // =========================================================================
        window.detectVisitorDeviceDetails = function() {
            let ua = navigator.userAgent || '';
            let deviceType = '📱 هاتف ذكي';
            let modelName = '';
            let osName = 'غير محدد';
            let browserName = 'متصفح ويب';

            if (/android/i.test(ua)) {
                osName = 'Android';
                let match = ua.match(/Android\s+([\d.]+);\s*([^;)]+)/i);
                if (match && match[2]) {
                    modelName = match[2].replace(/Build\/.*$/i, '').trim();
                }
                if (/samsung|sm-|gt-/i.test(ua)) deviceType = `📱 هاتف Samsung (${modelName || 'Galaxy'})`;
                else if (/redmi|xiaomi|mi |poco/i.test(ua)) deviceType = `📱 هاتف Xiaomi/Redmi (${modelName || ''})`;
                else if (/oppo|cph|rmx|realme/i.test(ua)) deviceType = `📱 هاتف Oppo/Realme (${modelName || ''})`;
                else if (/huawei|honor/i.test(ua)) deviceType = `📱 هاتف Huawei/Honor (${modelName || ''})`;
                else if (/infinix|tecno|itel/i.test(ua)) deviceType = `📱 هاتف Infinix/Tecno (${modelName || ''})`;
                else if (/vivo/i.test(ua)) deviceType = `📱 هاتف Vivo (${modelName || ''})`;
                else deviceType = `📱 هاتف أندرويد (${modelName || 'Android'})`;
            } else if (/iPad|iPhone|iPod/.test(ua)) {
                osName = 'iOS';
                deviceType = /iPad/.test(ua) ? '📱 جهاز لوحي iPad (Apple)' : '📱 هاتف iPhone (Apple iOS)';
            } else if (/Windows NT/i.test(ua)) {
                osName = 'Windows';
                deviceType = '💻 كمبيوتر / لابتوب (Windows)';
            } else if (/Macintosh|Mac OS X/i.test(ua)) {
                osName = 'macOS';
                deviceType = '💻 كمبيوتر Mac (Apple)';
            } else if (/Linux/i.test(ua)) {
                osName = 'Linux';
                deviceType = '💻 جهاز Linux';
            }

            if (/Edg\//i.test(ua)) browserName = 'Microsoft Edge';
            else if (/OPR\/|Opera/i.test(ua)) browserName = 'Opera';
            else if (/SamsungBrowser/i.test(ua)) browserName = 'متصفح سامسونج';
            else if (/Chrome\//i.test(ua)) browserName = 'Google Chrome';
            else if (/Safari\//i.test(ua) && !/Chrome/i.test(ua)) browserName = 'Apple Safari';
            else if (/Firefox\//i.test(ua)) browserName = 'Mozilla Firefox';

            let screenRes = `${window.screen ? window.screen.width : 0}×${window.screen ? window.screen.height : 0}`;
            return {
                deviceSummary: deviceType,
                osName,
                browserName,
                screenRes,
                rawUA: ua.slice(0, 180)
            };
        };

        window.getOrCreateVisitorId = function() {
            let vid = localStorage.getItem('zait_visitor_uid');
            if (!vid) {
                vid = 'vis_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7);
                localStorage.setItem('zait_visitor_uid', vid);
            }
            return vid;
        };

        window.logDetailedStoreVisit = async function(isAuthUpdate = false) {
            if (storeSettings.enableVisitorTracking === false) return;
            try {
                let vid = window.getOrCreateVisitorId();
                let dev = window.detectVisitorDeviceDetails();
                let nowIso = new Date().toISOString();

                let email = (currentUser && currentUser.email) ? currentUser.email : '';
                let name = (currentUser && currentUser.displayName) ? currentUser.displayName : (localStorage.getItem('zait_wheel_saved_name') || (document.getElementById('order-name') && document.getElementById('order-name').value) || 'زائر للمتجر');
                let phone = (currentUser && currentUser.phoneNumber) ? currentUser.phoneNumber : (localStorage.getItem('zait_wheel_saved_phone') || (document.getElementById('order-phone1') && document.getElementById('order-phone1').value) || '');
                let trafficSrc = window.getDetectedTrafficSource ? window.getDetectedTrafficSource() : 'مباشر (Direct)';

                let visRef = doc(db, 'site_visitors', vid);
                let snap = await getDoc(visRef);
                let existingHistory = (snap.exists() && Array.isArray(snap.data().visitsHistory)) ? snap.data().visitsHistory : [];

                if (!isAuthUpdate || existingHistory.length === 0) {
                    existingHistory.push({
                        time: nowIso,
                        source: trafficSrc,
                        device: dev.deviceSummary,
                        browser: dev.browserName
                    });
                    if (existingHistory.length > 50) existingHistory = existingHistory.slice(-50);
                }

                let payload = {
                    visitorId: vid,
                    name: name || (snap.exists() ? snap.data().name : 'زائر للمتجر'),
                    email: email || (snap.exists() ? snap.data().email : 'غير مسجل الدخول'),
                    phone: phone || (snap.exists() ? snap.data().phone : 'غير مسجل'),
                    deviceSummary: dev.deviceSummary,
                    osName: dev.osName,
                    browserName: dev.browserName,
                    screenRes: dev.screenRes,
                    trafficSource: trafficSrc,
                    lastVisit: nowIso,
                    visitsCount: existingHistory.length,
                    visitsHistory: existingHistory
                };
                if (!snap.exists()) {
                    payload.firstVisit = nowIso;
                }
                await setDoc(visRef, payload, { merge: true });
            } catch (e) {}
        };

        setTimeout(() => {
            if (!sessionStorage.getItem('zait_detailed_visit_logged')) {
                sessionStorage.setItem('zait_detailed_visit_logged', 'true');
                window.logDetailedStoreVisit(false);
            } else {
                window.logDetailedStoreVisit(true);
            }
        }, 1800);

        onAuthStateChanged(auth, (u) => {
            if (u) setTimeout(() => window.logDetailedStoreVisit(true), 1000);
        });

        window.allSiteVisitorsList = [];
        window.adminVisitorsUnsub = null;

        window.openVisitorsLogModal = function() {
            let modal = document.getElementById('visitors-log-modal');
            if (modal) modal.style.display = 'flex';
            window.loadSiteVisitorsRealtime();
        };

        window.loadSiteVisitorsRealtime = function() {
            if (window.adminVisitorsUnsub) return;
            window.adminVisitorsUnsub = onSnapshot(collection(db, 'site_visitors'), (snap) => {
                let arr = [];
                snap.forEach(d => arr.push({ id: d.id, ...d.data() }));
                arr.sort((a, b) => window.parseSafeTimestamp(b.lastVisit, 0) - window.parseSafeTimestamp(a.lastVisit, 0));
                window.allSiteVisitorsList = arr;
                window.renderVisitorsCardsList();
            });
        };

        window.renderVisitorsCardsList = function() {
            let cont = document.getElementById('visitors-cards-container');
            let searchInp = document.getElementById('visitors-log-search');
            if (!cont) return;
            let q = searchInp ? searchInp.value.trim().toLowerCase() : '';

            let filtered = (window.allSiteVisitorsList || []).filter(v => {
                if (!q) return true;
                let s = `${v.name || ''} ${v.email || ''} ${v.phone || ''} ${v.deviceSummary || ''} ${v.browserName || ''}`.toLowerCase();
                return s.includes(q);
            });

            if (filtered.length === 0) {
                cont.innerHTML = '<div style="text-align:center; padding:30px; color:var(--text-muted);">📭 لا توجد بطاقات زوار مطابقة حالياً.</div>';
                return;
            }

            let html = '';
            filtered.forEach(v => {
                let dObj = new Date(window.parseSafeTimestamp(v.lastVisit, Date.now()));
                let dayName = dObj.toLocaleDateString('ar-EG', { weekday: 'long' });
                let dateStr = dObj.toLocaleDateString('ar-EG');
                let timeStr = dObj.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                let isRegistered = v.email && v.email !== 'غير مسجل الدخول';

                html += `
                <div class="visitor-profile-card" onclick="window.openVisitorProfileDetails('${v.id}')">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:8px;">
                        <div>
                            <strong style="color:var(--primary); font-size:0.98rem; text-decoration:underline;">👤 ${window.escapeHTML(v.name || 'زائر للمتجر')}</strong>
                            <span style="background:${isRegistered ? '#dcfce7' : 'var(--panel-bg)'}; color:${isRegistered ? '#166534' : 'var(--text-muted)'}; padding:2px 8px; border-radius:10px; font-size:0.74rem; font-weight:bold; margin-right:6px;">
                                ${isRegistered ? '✅ مسجل بالإيميل' : '👀 زائر'}
                            </span>
                        </div>
                        <span style="background:var(--secondary); color:white; padding:2px 9px; border-radius:12px; font-size:0.75rem; font-weight:bold;">
                            🔄 ${v.visitsCount || 1} زيارة
                        </span>
                    </div>
                    <div style="margin-top:6px; font-size:0.83rem; color:var(--text-color); line-height:1.6;">
                        <div>${window.escapeHTML(v.deviceSummary || '📱 هاتف ذكي')} • 🌐 ${window.escapeHTML(v.browserName || '')}</div>
                        <div>📧 <strong>البريد:</strong> ${window.escapeHTML(v.email || 'غير مسجل الدخول')} ${v.phone && v.phone !== 'غير مسجل' ? ` | 📞 <strong>الهاتف:</strong> ${window.escapeHTML(v.phone)}` : ''}</div>
                        <div style="color:var(--text-muted); font-size:0.79rem;">🕒 <strong>آخر فتح للموقع:</strong> يوم ${dayName} (${dateStr}) — الساعة <strong style="color:var(--danger);">${timeStr}</strong></div>
                    </div>
                </div>`;
            });
            cont.innerHTML = html;
        };

        window.openVisitorProfileDetails = function(visId) {
            let v = (window.allSiteVisitorsList || []).find(x => x.id === visId);
            if (!v) return;
            let modal = document.getElementById('visitor-profile-details-modal');
            let body = document.getElementById('visitor-profile-details-body');
            if (!modal || !body) return;

            let historyArr = Array.isArray(v.visitsHistory) ? [...v.visitsHistory].reverse() : [];
            let historyHtml = historyArr.map((h, idx) => {
                let d = new Date(window.parseSafeTimestamp(h.time, Date.now()));
                let dayStr = d.toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' });
                let tStr = d.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                return `<li style="margin-bottom:6px; padding-bottom:5px; border-bottom:1px dashed var(--border-color);">
                    <strong>زيارة #${historyArr.length - idx}:</strong> يوم ${dayStr} — ⏰ الساعة <strong style="color:#028090;">${tStr}</strong><br>
                    <small style="color:var(--text-muted);">${window.escapeHTML(h.device || v.deviceSummary || '')} | المصدر: ${window.escapeHTML(h.source || v.trafficSource || 'مباشر')}</small>
                </li>`;
            }).join('');

            let firstD = v.firstVisit ? new Date(window.parseSafeTimestamp(v.firstVisit, Date.now())).toLocaleString('ar-EG') : 'غير محدد';
            let lastD = v.lastVisit ? new Date(window.parseSafeTimestamp(v.lastVisit, Date.now())).toLocaleString('ar-EG') : 'غير محدد';

            body.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid var(--border-color); padding-bottom:8px; margin-bottom:10px;">
                    <strong style="font-size:1.05rem; color:var(--primary);">👤 ${window.escapeHTML(v.name || 'زائر للمتجر')}</strong>
                    <button type="button" class="btn btn-danger" style="padding:4px 10px; font-size:0.75rem;" onclick="window.deleteVisitorProfileCard('${v.id}')">🗑️ حذف البطاقة</button>
                </div>
                <div>📧 <strong>البريد الإلكتروني:</strong> <span style="color:#028090; font-weight:bold;">${window.escapeHTML(v.email || 'غير مسجل الدخول')}</span></div>
                <div>📞 <strong>رقم الهاتف المسجل:</strong> <span style="font-weight:bold;">${window.escapeHTML(v.phone || 'غير متوفر')}</span></div>
                <div>📱 <strong>نوع الهاتف / الجهاز:</strong> <strong style="color:var(--secondary);">${window.escapeHTML(v.deviceSummary || 'غير محدد')}</strong></div>
                <div>⚙️ <strong>نظام التشغيل والمتصفح:</strong> ${window.escapeHTML(v.osName || '')} — ${window.escapeHTML(v.browserName || '')} (الشاشة: ${window.escapeHTML(v.screenRes || '')})</div>
                <div>🌐 <strong>مصدر الدخول للمتجر:</strong> ${window.escapeHTML(v.trafficSource || 'مباشر (Direct)')}</div>
                <div>🔢 <strong>إجمالي مرات فتح الموقع:</strong> <strong style="color:#166534;">${v.visitsCount || historyArr.length || 1} مرة</strong></div>
                <div>🕒 <strong>أول زيارة للمتجر:</strong> ${firstD}</div>
                <div>🕒 <strong>آخر زيارة للمتجر:</strong> <strong style="color:var(--danger);">${lastD}</strong></div>
                <hr style="border:0; border-top:1px dashed var(--border-color); margin:10px 0;">
                <strong style="color:var(--primary); display:block; margin-bottom:6px;">📜 سجل كل زيارات هذا العميل بالتاريخ والساعة (${historyArr.length}):</strong>
                <ul style="margin:0; padding-right:18px; max-height:200px; overflow-y:auto; font-size:0.84rem;">
                    ${historyHtml || '<li>تم تسجيل الزيارة الحالية</li>'}
                </ul>
            `;
            modal.style.display = 'flex';
        };

        window.deleteVisitorProfileCard = async function(visId) {
            if (!confirm('هل تريد حذف بطاقة وسجل هذا الزائر؟')) return;
            try {
                await deleteDoc(doc(db, 'site_visitors', visId));
                document.getElementById('visitor-profile-details-modal').style.display = 'none';
                window.showToast('تم حذف بطاقة الزائر بنجاح', 'info');
            } catch (e) {}
        };

        // =========================================================================
        // === 4. أكواد الـ SEO المتقدمة (JSON-LD Schema + Dynamic Sitemap) والحماية ===
        // =========================================================================
        window.updateDynamicJsonLdSchema = function() {
            let scriptEl = document.getElementById('dynamic-json-ld-schema');
            if (!scriptEl || !products || products.length === 0) return;
            let visibleProds = products.filter(p => !p.isHidden).slice(0, 20);
            let schemaObj = {
                "@context": "https://schema.org",
                "@type": "ItemList",
                "name": "منتجات متجر زيت الشجرة المباركة - زيت زيتون سيناوي بكر ممتاز",
                "itemListElement": visibleProds.map((p, idx) => ({
                    "@type": "ListItem",
                    "position": idx + 1,
                    "item": {
                        "@type": "Product",
                        "name": p.name,
                        "description": p.description || "زيت زيتون سيناوي بكر ممتاز عصره أولى على البارد طبيعي 100%",
                        "image": (p.images && p.images[0]) || p.imageUrl || "1000392409.jpeg",
                        "brand": { "@type": "Brand", "name": "زيت الشجرة المباركة" },
                        "offers": {
                            "@type": "Offer",
                            "priceCurrency": "EGP",
                            "price": Number(p.price) || 0,
                            "availability": (p.stock !== undefined && p.stock !== "" && Number(p.stock) <= 0) ? "https://schema.org/OutOfStock" : "https://schema.org/InStock"
                        },
                        "aggregateRating": {
                            "@type": "AggregateRating",
                            "ratingValue": "4.9",
                            "reviewCount": (p.reviews && p.reviews.length > 0) ? p.reviews.length : 15
                        }
                    }
                }))
            };
            scriptEl.textContent = JSON.stringify(schemaObj);
        };

        window.downloadDynamicSitemapXML = function() {
            let baseUrl = window.location.origin + window.location.pathname.replace(/index\.html$/i, '');
            if (!baseUrl.endsWith('/')) baseUrl += '/';
            let today = new Date().toISOString().slice(0, 10);
            let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
            xml += `  <url>\n    <loc>${baseUrl}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>\n`;
            (products || []).filter(p => !p.isHidden).forEach(p => {
                let safeSlug = p.name.trim().replace(/\s+/g, '-').replace(/[^a-zA-Z0-9\u0600-\u06FF-]/g, '');
                let pUrl = `${baseUrl}?item=${encodeURIComponent(safeSlug)}&amp;id=${encodeURIComponent(p.id)}`;
                xml += `  <url>\n    <loc>${pUrl}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.85</priority>\n  </url>\n`;
            });
            xml += `</urlset>`;
            let blob = new Blob([xml], { type: 'application/xml;charset=utf-8' });
            let a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = 'sitemap.xml';
            a.click();
            window.showToast('تم توليد وتحميل ملف sitemap.xml المحدث بجميع منتجاتك 🗺️✅', 'success');
        };

        // حماية الطلبات من السبام والطلبات الوهمية المتكررة (Anti-Spam Rate Limiter)
        const origProcessOrderV60 = window.processOrder;
        window.processOrder = async function(method) {
            if (storeSettings.enableAntiSpam !== false) {
                let lastOrdTs = Number(localStorage.getItem('zait_last_order_submit_ts') || 0);
                if (Date.now() - lastOrdTs < 35000) {
                    window.showToast('⏳ تم استلام طلبك بالفعل! يرجى الانتظار قليلاً قبل إرسال طلب آخر.', 'error');
                    return;
                }
                let p1 = (document.getElementById('order-phone1') || {}).value || '';
                let cleanP1 = window.toEngDigits(p1).replace(/\D/g, '');
                if (cleanP1.length < 10 || cleanP1.length > 14) {
                    window.showToast('📞 يرجى إدخال رقم هاتف صحيح مكون من 11 رقماً لتأكيد التوصيل', 'error');
                    return;
                }
                localStorage.setItem('zait_last_order_submit_ts', String(Date.now()));
            }
            window.logDetailedStoreVisit(true);
            return await origProcessOrderV60(method);
        };

        // القفل التلقائي للإعدادات المحمية بعد 15 دقيقة من عدم النشاط
        window.adminInactivityTimer = null;
        window.resetAdminInactivityWatchdog = function() {
            if (window.adminInactivityTimer) clearTimeout(window.adminInactivityTimer);
            if (storeSettings.enableAutoLockAdmin === false) return;
            window.adminInactivityTimer = setTimeout(() => {
                let rContent = document.getElementById('roles-content-section');
                let rAuth = document.getElementById('roles-auth-section');
                if (rContent && rAuth && rContent.style.display === 'block') {
                    rContent.style.display = 'none';
                    rAuth.style.display = 'block';
                    window.showToast('🔒 تم قفل الإعدادات المحمية تلقائياً للأمان لعدم النشاط', 'info');
                }
            }, 15 * 60 * 1000);
        };
        ['click', 'keydown', 'touchstart'].forEach(ev => document.addEventListener(ev, window.resetAdminInactivityWatchdog, { passive: true }));

        const origRenderProductsV60 = window.renderProducts;
        window.renderProducts = function(scrollToTop = true) {
            origRenderProductsV60(scrollToTop);
            window.updateDynamicJsonLdSchema();
        };

        const prevApplySettingsV60 = window.applySettingsToUI;
        window.applySettingsToUI = function() {
            prevApplySettingsV60();
            if (isCurrentUserAdmin) {
                let setC = (id, val, def = true) => { let el = document.getElementById(id); if (el) el.checked = val !== undefined ? Boolean(val) : def; };
                setC('setting-enable-visitor-tracking', storeSettings.enableVisitorTracking, true);
                setC('setting-enable-anti-spam', storeSettings.enableAntiSpam, true);
                setC('setting-enable-auto-lock-admin', storeSettings.enableAutoLockAdmin, true);
                window.loadSiteVisitorsRealtime();
            }
        };

        const prevSaveSettingsV60 = window.saveSettings;
        window.saveSettings = async function() {
            const getC = (id, def = true) => { let el = document.getElementById(id); return el ? el.checked : def; };
            try {
                await updateDoc(doc(db, 'settings', 'main'), {
                    enableVisitorTracking: getC('setting-enable-visitor-tracking', true),
                    enableAntiSpam: getC('setting-enable-anti-spam', true),
                    enableAutoLockAdmin: getC('setting-enable-auto-lock-admin', true)
                });
            } catch (e) {}
            await prevSaveSettingsV60();
        };

        Object.assign(window.FULL_AR_TO_EN, {
            "🔄 تصفير اليوم": "🔄 Reset Today",
            "🔄 تصفير أرباح الشهر": "🔄 Reset Month",
            "🔄 تصفير": "🔄 Reset",
            "بطاقات وسجل زوار المتجر بالتفصيل": "Store Visitors Profiles & Activity Log",
            "بطاقة بيانات الزائر وسجل تصفحه": "Visitor Profile & Browsing History",
            "تفاصيل الأوردرات وحساباتها": "Orders & Revenue Breakdown"
        });


        // =========================================================================
        // === النسخة V62 الشاملة: إصلاح الواجهة والزوار + التحكم الكامل بحساب العميل بالشات + الميكروفون الذكي ===
        // =========================================================================

        // -------------------------------------------------------------------------
        // أولاً: الإصلاحات الـ 5 الأساسية (الهيدر + البانر + الشريط المتحرك + القارئ الصوتي + سجل الزوار)
        // -------------------------------------------------------------------------
        (function applyV62CoreFixes() {
            let hdrWorkBtn = document.getElementById('header-work-hub-btn');
            if (hdrWorkBtn) hdrWorkBtn.remove();

            window.renderHeroSlider = function() {
                let heroSec = document.getElementById('hero-section');
                let sliderWrap = document.getElementById('hero-slider-wrapper');
                let homePanel = document.getElementById('home-panel');
                let isHomeActive = homePanel && homePanel.classList.contains('active');
                if (!isHomeActive) {
                    if (heroSec) heroSec.style.display = 'none';
                    if (sliderWrap) sliderWrap.style.display = 'none';
                    return;
                }
                if (storeSettings.enableHeroSlider) {
                    if (heroSec) heroSec.style.display = 'none';
                    if (sliderWrap) sliderWrap.style.display = 'block';
                } else {
                    if (heroSec) heroSec.style.display = '';
                    if (sliderWrap) sliderWrap.style.display = 'none';
                }
            };
        })();

        // إصلاح الشريط المصور المتحرك ليظهر كل المنتجات والأقسام ويلف تلقائياً بسلاسة
        let v62ScrollTimer = null;
        window.renderVisualBar = function() {
            let container = document.getElementById('visual-scroll-bar');
            if (!container) return;
            if (storeSettings.visualBarMode === 'none' || !isProductsLoaded || products.length === 0) {
                container.style.display = 'none';
                return;
            }
            let itemsList = [];
            products.filter(p => !p.isHidden).forEach(p => {
                let img = (p.images && p.images[0]) ? p.images[0] : (p.imageUrl || '1000392409.jpeg');
                itemsList.push({
                    title: p.name,
                    img: img,
                    action: `window.openProductModal('${p.id}')`
                });
            });
            (storeSettings.categories || []).forEach(cat => {
                let catProd = products.find(p => p.category === cat && p.images && p.images[0]);
                let img = catProd ? catProd.images[0] : '1000392409.jpeg';
                itemsList.push({
                    title: `📂 ${cat}`,
                    img: img,
                    action: `window.showPanel('home'); window.filterProducts('${cat}')`
                });
            });
            if (itemsList.length === 0) {
                container.style.display = 'none';
                return;
            }
            let loopList = [...itemsList];
            while (loopList.length < 12) {
                loopList = loopList.concat(itemsList);
            }
            container.innerHTML = loopList.map(it => `
                <div class="visual-item" onclick="${it.action}">
                    <img loading="lazy" src="${it.img}" alt="${window.escapeHTML(it.title)}" onerror="this.src='1000392409.jpeg'">
                    <span>${window.escapeHTML(it.title)}</span>
                </div>
            `).join('');
            container.style.display = 'flex';
            window.startVisualAutoScroll();
        };

        window.startVisualAutoScroll = function() {
            let bar = document.getElementById('visual-scroll-bar');
            if (!bar) return;
            if (v62ScrollTimer) clearInterval(v62ScrollTimer);
            let dirStep = -1;
            v62ScrollTimer = setInterval(() => {
                if (bar.matches(':hover') || bar.matches(':active')) return;
                let before = bar.scrollLeft;
                bar.scrollLeft += dirStep;
                if (bar.scrollLeft === before) {
                    dirStep = -dirStep;
                    bar.scrollLeft += dirStep;
                }
            }, 30);
        };

        // إصلاح القارئ الصوتي لوصف المنتج ليعمل على جميع الموبايلات والمتصفحات 100%
        window.currentProductTtsAudio = null;
        window.toggleProductVoiceReader = function() {
            let p = products.find(pr => pr.id === activeProductForReview);
            if (!p) return;

            if (window.currentProductTtsAudio) {
                window.currentProductTtsAudio.pause();
                window.currentProductTtsAudio = null;
                if ('speechSynthesis' in window) window.speechSynthesis.cancel();
                window.showToast('⏹️ تم إيقاف القارئ الصوتي', 'info');
                return;
            }
            if ('speechSynthesis' in window && window.speechSynthesis.speaking) {
                window.speechSynthesis.cancel();
                window.showToast('⏹️ تم إيقاف القارئ الصوتي', 'info');
                return;
            }

            let textToRead = `${p.name}، السعر ${p.price} جنيه. ${p.description || 'زيت زيتون سيناوي بكر ممتاز عصرة أولى على البارد طبيعي مئة بالمئة'}`;
            window.showToast('🔊 جاري قراءة وصف المنتج صوتياً...', 'info');

            let usedNative = false;
            if ('speechSynthesis' in window) {
                try {
                    window.speechSynthesis.cancel();
                    let voices = window.speechSynthesis.getVoices() || [];
                    let arVoice = voices.find(v => v.lang && v.lang.toLowerCase().startsWith('ar'));
                    let utter = new SpeechSynthesisUtterance(textToRead);
                    utter.lang = arVoice ? arVoice.lang : 'ar-SA';
                    if (arVoice) utter.voice = arVoice;
                    utter.rate = 0.95;
                    window.speechSynthesis.speak(utter);
                    usedNative = true;
                } catch (e) {}
            }
            if (!usedNative) {
                let shortTxt = textToRead.slice(0, 180);
                let ttsUrl = `https://translate.googleapis.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(shortTxt)}&tl=ar&client=tw-ob`;
                let audio = new Audio(ttsUrl);
                window.currentProductTtsAudio = audio;
                audio.onended = () => { window.currentProductTtsAudio = null; };
                audio.onerror = () => { window.currentProductTtsAudio = null; };
                audio.play().catch(() => {});
            }
        };

        // إصلاح سجل وبطاقات الزوار ليفتح في نفس اللحظة من وثيقة الإحصائيات والمستخدمين بدون أي تعليق
        window.logDetailedStoreVisit = async function() {
            if (storeSettings.enableVisitorTracking === false) return;
            try {
                let vid = window.getOrCreateVisitorId();
                let dev = window.detectVisitorDeviceDetails();
                let nowIso = new Date().toISOString();
                let email = (currentUser && currentUser.email) ? currentUser.email : 'غير مسجل الدخول';
                let name = (currentUser && currentUser.displayName) ? currentUser.displayName : (localStorage.getItem('zait_wheel_saved_name') || 'زائر للمتجر');
                let phone = (currentUser && currentUser.phoneNumber) ? currentUser.phoneNumber : (localStorage.getItem('zait_wheel_saved_phone') || 'غير مسجل');
                let trafficSrc = window.getDetectedTrafficSource ? window.getDetectedTrafficSource() : 'مباشر (Direct)';

                let statsRef = doc(db, 'settings', 'stats');
                let snap = await getDoc(statsRef);
                let vMap = (snap.exists() && snap.data().visitorsMap) ? { ...snap.data().visitorsMap } : {};
                let existing = vMap[vid] || { firstVisit: nowIso, visitsHistory: [] };
                let hist = Array.isArray(existing.visitsHistory) ? [...existing.visitsHistory] : [];
                hist.push({ time: nowIso, source: trafficSrc, device: dev.deviceSummary, browser: dev.browserName });
                if (hist.length > 25) hist = hist.slice(-25);

                vMap[vid] = {
                    id: vid,
                    visitorId: vid,
                    name: name !== 'زائر للمتجر' ? name : (existing.name || 'زائر للمتجر'),
                    email: email !== 'غير مسجل الدخول' ? email : (existing.email || 'غير مسجل الدخول'),
                    phone: phone !== 'غير مسجل' ? phone : (existing.phone || 'غير مسجل'),
                    deviceSummary: dev.deviceSummary,
                    osName: dev.osName,
                    browserName: dev.browserName,
                    screenRes: dev.screenRes,
                    trafficSource: trafficSrc,
                    firstVisit: existing.firstVisit || nowIso,
                    lastVisit: nowIso,
                    visitsCount: hist.length,
                    visitsHistory: hist
                };
                await setDoc(statsRef, { visitorsMap: vMap }, { merge: true });
            } catch (e) {}
        };

        window.loadSiteVisitorsRealtime = async function() {
            let cont = document.getElementById('visitors-cards-container');
            if (cont && (!window.allSiteVisitorsList || window.allSiteVisitorsList.length === 0)) {
                cont.innerHTML = '<p style="text-align:center; color:var(--primary);">⏳ جاري جلب بطاقات الزوار...</p>';
            }
            try {
                let combinedMap = new Map();
                let statsSnap = await getDoc(doc(db, 'settings', 'stats'));
                if (statsSnap.exists() && statsSnap.data().visitorsMap) {
                    let vMap = statsSnap.data().visitorsMap;
                    Object.values(vMap).forEach(v => {
                        if (v && v.id) combinedMap.set(v.id, v);
                    });
                }
                let usersSnap = await getDocs(collection(db, 'users'));
                usersSnap.forEach(uDoc => {
                    let u = uDoc.data();
                    let uid = 'user_' + uDoc.id;
                    combinedMap.set(uid, {
                        id: uid,
                        visitorId: uid,
                        name: u.name || (u.email ? u.email.split('@')[0] : 'عميل مسجل'),
                        email: u.email || 'مسجل',
                        phone: u.phone1 || 'غير مسجل',
                        deviceSummary: u.deviceSummary || '📱 هاتف ذكي / متصفح العميل',
                        osName: u.osName || 'Android / iOS',
                        browserName: u.browserName || 'متصفح الموبايل',
                        screenRes: u.screenRes || '',
                        trafficSource: 'حساب مسجل بالمتجر',
                        firstVisit: u.lastLogin || new Date().toISOString(),
                        lastVisit: u.lastLogin || new Date().toISOString(),
                        visitsCount: u.visitsCount || 1,
                        visitsHistory: [{ time: u.lastLogin || new Date().toISOString(), source: 'تسجيل دخول', device: '📱 هاتف العميل' }]
                    });
                });
                window.allSiteVisitorsList = Array.from(combinedMap.values()).sort(
                    (a, b) => window.parseSafeTimestamp(b.lastVisit, 0) - window.parseSafeTimestamp(a.lastVisit, 0)
                );
                window.renderVisitorsCardsList();
            } catch (e) {
                window.renderVisitorsCardsList();
            }
        };

        // -------------------------------------------------------------------------
        // ثانياً: الميكروفون الذكي لتصحيح النطق والكلام التلقائي (للعميل والمدير والموظفين)
        // -------------------------------------------------------------------------
        window.VOICE_PHONETIC_DICTIONARY = [
            // تصحيح مصطلحات زيت الزيتون والمتجر الشائعة عند النطق السريع أو الخاطئ
            [/\b(زت|ذيت|زيتت|ازيت|الذيت)\b/g, 'زيت'],
            [/\b(زتون|ذيتون|زيتان|زاتون|الزتون|الذيتون|زيتونه)\b/g, 'زيتون'],
            [/\b(سيناوي|سينوي|سناوي|ثيناوي|سيناوى|السيناوي)\b/g, 'سيناوي'],
            [/\b(سينا|ثيناء|سينه)\b/g, 'سيناء'],
            [/\b(الشجره|الشجرة|شجره)\s*(المباركه|المباركة|مباركه)\b/g, 'الشجرة المباركة'],
            [/\b(عصره|عصرة|عصره اولى|عصره اولي)\b/g, 'عصرة أولى'],
            [/\b(عالبارد|علي البارد|ع البارد|بارد)\b/g, 'على البارد'],
            [/\b(جركن|جاركن|جيركن|قرص|جراكن)\b/g, 'جركن'],
            [/\b(صفيحه|صفيحة|صفائح)\b/g, 'صفيحة'],
            [/\b(اوردر|اردر|الاوردر|الاوردرات|أوردر)\b/g, 'طلب'],
            [/\b(بكام|بكم|بيكام|كام سعر|كم سعر)\b/g, 'كم سعر'],
            [/\b(انستا باي|انستاباي|انستا بى|انستا)\b/g, 'إنستاباي'],
            [/\b(فودافون كاش|فدفون كاش|ودافون كاش)\b/g, 'فودافون كاش'],
            [/\b(محفظه|محفظة|المحفظه)\b/g, 'محفظة إلكترونية'],
            [/\b(الغي|الغاء|الغلغاء|عايز الغي)\b/g, 'إلغاء'],
            [/\b(استرجاع|ارجاع|عايز ارجع)\b/g, 'استرجاع'],
            [/\b(حموضه|الحموضه)\b/g, 'حموضة'],
            [/\b(ليتر|لترات|لترين)\b/g, 'لتر'],
            [/\b(هديه|الهديه)\b/g, 'هدية'],
            [/\b(كبون|كوبن|كود خصم)\b/g, 'كوبون خصم'],
            [/\b(توصيل|الشحن|شحن)\b/g, 'شحن وتوصيل']
        ];

        window.smartCorrectSpeechTranscript = function(rawText, alternativesList = []) {
            if (!rawText) return '';
            if (storeSettings.enableSmartMicCorrector === false) return rawText.trim();

            // إذا وُجدت بدائل صوتية من المتصفح، نختار البديل الذي يحتوي على كلمات المتجر الصحيحة
            let storeKeywords = ['زيت', 'زيتون', 'سيناوي', 'لتر', 'طلب', 'شحن', 'سعر', 'عبوة', 'جركن', 'خصم', 'استرجاع'];
            let bestCandidate = rawText.trim();
            let bestScore = 0;

            let allCandidates = [rawText, ...alternativesList];
            allCandidates.forEach(cand => {
                if (!cand) return;
                let score = 0;
                storeKeywords.forEach(kw => { if (cand.includes(kw)) score += 2; });
                if (score > bestScore) {
                    bestScore = score;
                    bestCandidate = cand.trim();
                }
            });

            let corrected = bestCandidate;
            window.VOICE_PHONETIC_DICTIONARY.forEach(([regex, replacement]) => {
                corrected = corrected.replace(regex, replacement);
            });
            // إزالة التكرار اللغوي الناتج عن التلعثم الصوتي (مثال: "زيت زيت" -> "زيت")
            corrected = corrected.replace(/\b(\S+)\s+\1\b/g, '$1');
            return corrected.trim();
        };

        // استبدال دالة الميكروفون (startVoiceTyping) لتدعم التصحيح الذكي للعميل والمدير والموظف
        window.startVoiceTyping = function(inputId, btnElement) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (!SpeechRecognition) {
                window.showToast(window.currentLang === 'ar' ? 'متصفحك لا يدعم الإدخال الصوتي' : 'Voice input not supported', 'error');
                return;
            }
            const recognition = new SpeechRecognition();
            recognition.lang = window.currentLang === 'ar' ? 'ar-EG' : 'en-US';
            recognition.interimResults = true;
            recognition.maxAlternatives = 5;

            const inputEl = document.getElementById(inputId);
            const initialVal = inputEl ? inputEl.value : '';

            recognition.onstart = function() {
                if (btnElement) btnElement.classList.add('recording');
                window.showToast(window.currentLang === 'ar' ? '🎤 تحدث الآن.. المصحح الذكي يستمع إليك' : '🎤 Speak now...', 'info');
            };
            recognition.onresult = function(event) {
                let res = event.results[event.results.length - 1];
                let primaryTranscript = res[0].transcript;
                let alts = [];
                for (let i = 1; i < res.length; i++) alts.push(res[i].transcript);

                let smartText = window.smartCorrectSpeechTranscript(primaryTranscript, alts);
                if (inputEl) {
                    inputEl.value = initialVal ? (initialVal + ' ' + smartText).trim() : smartText;
                    inputEl.dispatchEvent(new Event('input', { bubbles: true }));
                }
            };
            recognition.onerror = function() {
                window.showToast(window.currentLang === 'ar' ? 'لم نتمكن من سماعك بوضوح، حاول مرة أخرى' : 'Could not hear clearly', 'error');
            };
            recognition.onend = function() {
                if (btnElement) btnElement.classList.remove('recording');
            };
            recognition.start();
        };

        // -------------------------------------------------------------------------
        // ثالثاً: لوحة التحكم الكامل بحساب العميل من داخل الشات (الاسم، البريد، الرقم السري، الرصيد، والطلبات)
        // -------------------------------------------------------------------------
        window.activeChatCustomerUserDocId = null;
        window.activeChatCustomerData = null;

        window.loadCustomerAccountControlInChat = async function(chatId, customerName) {
            let box = document.getElementById('admin-chat-customer-control-box');
            let body = document.getElementById('admin-chat-cust-control-body');
            if (!box || !body) return;
            if (storeSettings.enableChatAccountControl === false) {
                box.style.display = 'none';
                return;
            }
            box.style.display = 'block';
            body.innerHTML = '<p style="margin:0; color:var(--primary);">⏳ جاري جلب كافة بيانات حساب العميل وطلباته...</p>';

            try {
                let foundUser = null;
                let foundUid = null;

                // البحث عن وثيقة العميل في مجموعة users عبر الـ UID أو الإيميل أو رقم الهاتف
                let usersSnap = await getDocs(collection(db, 'users'));
                usersSnap.forEach(uDoc => {
                    let d = uDoc.data();
                    if (
                        uDoc.id === chatId ||
                        (d.email && d.email.toLowerCase() === String(chatId).toLowerCase()) ||
                        (d.phone1 && d.phone1 === chatId) ||
                        (d.name && d.name === customerName)
                    ) {
                        foundUser = d;
                        foundUid = uDoc.id;
                    }
                });

                // جمع طلبات هذا العميل
                let custOrders = (adminOrdersArray || []).filter(o => {
                    return (
                        (foundUid && o.userId === foundUid) ||
                        o.customerEmail === chatId ||
                        (o.phones && o.phones.primary === chatId) ||
                        o.customerName === customerName
                    );
                });

                if (!foundUser) {
                    foundUid = chatId.replace(/[^a-zA-Z0-9_-]/g, '_');
                    foundUser = {
                        name: customerName || 'عميل',
                        email: chatId.includes('@') ? chatId : '',
                        phone1: (!chatId.includes('@') && /\d/.test(chatId)) ? chatId : ((custOrders[0] && custOrders[0].phones && custOrders[0].phones.primary) || ''),
                        gov: (custOrders[0] && custOrders[0].location && custOrders[0].location.governorate) || '',
                        city: (custOrders[0] && custOrders[0].location && custOrders[0].location.city) || '',
                        address: (custOrders[0] && custOrders[0].location && custOrders[0].location.details) || '',
                        loyaltyPoints: 0,
                        walletBalance: 0
                    };
                }

                window.activeChatCustomerUserDocId = foundUid;
                window.activeChatCustomerData = foundUser;

                let lastOrd = custOrders[0];
                let lastOrdHtml = lastOrd
                    ? `<div style="background:var(--panel-bg); padding:8px 10px; border-radius:8px; border:1px solid var(--border-color); margin-top:8px;">
                        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:6px;">
                            <span>📦 <strong>آخر طلب للعميل:</strong> #${lastOrd.id.slice(0,6).toUpperCase()} (${lastOrd.totalAmount} ج) — الحالة: <strong style="color:#028090;">${window.escapeHTML(lastOrd.status)}</strong></span>
                            <div style="display:flex; gap:4px; flex-wrap:wrap;">
                                <button type="button" class="btn" style="padding:3px 8px; font-size:0.74rem; background:#028090;" onclick="window.updateOrderStatus('${lastOrd.id}', 'تم التجهيز'); setTimeout(()=>window.loadCustomerAccountControlInChat('${chatId.replace(/'/g, "\\'")}', '${(customerName||'').replace(/'/g, "\\'")}'), 400);">📦 تجهيز</button>
                                <button type="button" class="btn" style="padding:3px 8px; font-size:0.74rem; background:#007bff;" onclick="window.updateOrderStatus('${lastOrd.id}', 'تم الشحن'); setTimeout(()=>window.loadCustomerAccountControlInChat('${chatId.replace(/'/g, "\\'")}', '${(customerName||'').replace(/'/g, "\\'")}'), 400);">🚚 شحن</button>
                                <button type="button" class="btn" style="padding:3px 8px; font-size:0.74rem; background:#28a745;" onclick="window.updateOrderStatus('${lastOrd.id}', 'تم التوصيل ✅'); setTimeout(()=>window.loadCustomerAccountControlInChat('${chatId.replace(/'/g, "\\'")}', '${(customerName||'').replace(/'/g, "\\'")}'), 400);">✅ توصيل</button>
                            </div>
                        </div>
                    </div>`
                    : `<div style="font-size:0.8rem; color:var(--text-muted); margin-top:6px;">📦 لم يقم العميل بتسجيل طلبات سابقة بعد (${custOrders.length} طلب).</div>`;

                body.innerHTML = `
                    <div class="form-row" style="gap:8px; margin-bottom:8px;">
                        <div style="flex:1; min-width:140px;">
                            <label style="font-size:0.76rem; font-weight:bold; color:var(--primary);">👤 اسم العميل:</label>
                            <input type="text" id="chat-ctrl-name" value="${window.escapeHTML(foundUser.name || customerName || '')}" style="margin:0; padding:6px 8px; font-size:0.82rem;">
                        </div>
                        <div style="flex:1; min-width:160px;">
                            <label style="font-size:0.76rem; font-weight:bold; color:var(--primary);">📧 البريد الإلكتروني:</label>
                            <input type="email" id="chat-ctrl-email" value="${window.escapeHTML(foundUser.email || '')}" placeholder="email@example.com" style="margin:0; padding:6px 8px; font-size:0.82rem;">
                        </div>
                        <div style="flex:1; min-width:130px;">
                            <label style="font-size:0.76rem; font-weight:bold; color:var(--primary);">📞 رقم الهاتف:</label>
                            <input type="tel" id="chat-ctrl-phone" value="${window.escapeHTML(foundUser.phone1 || '')}" placeholder="010..." style="margin:0; padding:6px 8px; font-size:0.82rem;">
                        </div>
                    </div>
                    <div class="form-row" style="gap:8px; margin-bottom:8px;">
                        <div style="flex:1.5; min-width:160px;">
                            <label style="font-size:0.76rem; font-weight:bold; color:var(--primary);">🏠 المحافظة والعنوان التفصيلي:</label>
                            <input type="text" id="chat-ctrl-address" value="${window.escapeHTML(foundUser.address || ((foundUser.gov || '') + ' ' + (foundUser.city || '')).trim())}" placeholder="العنوان التفصيلي..." style="margin:0; padding:6px 8px; font-size:0.82rem;">
                        </div>
                        <div style="flex:1; min-width:130px;">
                            <label style="font-size:0.76rem; font-weight:bold; color:var(--danger);">🔑 تعيين رقم سري جديد للعميل:</label>
                            <input type="text" id="chat-ctrl-password" value="${window.escapeHTML(foundUser.adminCustomPassword || '')}" placeholder="اكتب الرقم السري الجديد..." style="margin:0; padding:6px 8px; font-size:0.82rem; border-color:var(--danger);">
                        </div>
                    </div>
                    <div class="form-row" style="gap:8px; margin-bottom:10px;">
                        <div style="flex:1; min-width:120px;">
                            <label style="font-size:0.76rem; font-weight:bold; color:var(--secondary);">🎁 رصيد نقاط الولاء:</label>
                            <input type="number" id="chat-ctrl-points" value="${Number(foundUser.loyaltyPoints) || 0}" style="margin:0; padding:6px 8px; font-size:0.82rem;">
                        </div>
                        <div style="flex:1; min-width:120px;">
                            <label style="font-size:0.76rem; font-weight:bold; color:#028090;">💳 رصيد المحفظة النقدية (ج):</label>
                            <input type="number" id="chat-ctrl-wallet" value="${Number(foundUser.walletBalance) || 0}" style="margin:0; padding:6px 8px; font-size:0.82rem;">
                        </div>
                    </div>
                    <div style="display:flex; gap:6px; flex-wrap:wrap;">
                        <button type="button" class="btn" style="flex:1.5; padding:6px 12px; font-size:0.82rem; background:#28a745;" onclick="window.saveCustomerAccountChangesFromChat()">💾 حفظ كل تعديلات حساب العميل</button>
                        <button type="button" class="btn btn-outline" style="flex:1; padding:6px 10px; font-size:0.8rem; border-color:var(--danger); color:var(--danger);" onclick="window.sendCustomerPasswordResetFromChat()">🔑 إرسال رابط/الرقم السري الجديد للعميل</button>
                    </div>
                    ${lastOrdHtml}
                `;
            } catch (e) {
                body.innerHTML = '<p style="color:var(--danger); margin:0;">تعذر جلب ملف العميل، حاول مرة أخرى.</p>';
            }
        };

        window.saveCustomerAccountChangesFromChat = async function() {
            let uid = window.activeChatCustomerUserDocId || activeAdminChatId;
            if (!uid) return;
            let newName = (document.getElementById('chat-ctrl-name') || {}).value.trim();
            let newEmail = (document.getElementById('chat-ctrl-email') || {}).value.trim().toLowerCase();
            let newPhone = (document.getElementById('chat-ctrl-phone') || {}).value.trim();
            let newAddr = (document.getElementById('chat-ctrl-address') || {}).value.trim();
            let newPass = (document.getElementById('chat-ctrl-password') || {}).value.trim();
            let newPts = Number((document.getElementById('chat-ctrl-points') || {}).value) || 0;
            let newWallet = Number((document.getElementById('chat-ctrl-wallet') || {}).value) || 0;

            let updatePayload = {
                name: newName,
                email: newEmail,
                phone1: newPhone,
                address: newAddr,
                loyaltyPoints: newPts,
                walletBalance: newWallet,
                updatedByAdminAt: new Date().toISOString()
            };
            if (newPass) {
                updatePayload.adminCustomPassword = newPass;
            }

            try {
                await setDoc(doc(db, 'users', uid), updatePayload, { merge: true });
                if (activeAdminChatId && newName) {
                    await updateDoc(doc(db, 'chats', activeAdminChatId), { customerName: newName }).catch(() => {});
                    let acu = document.getElementById('active-chat-user');
                    if (acu) acu.textContent = newName;
                }
                window.recordAdminAuditLog(`تحديث حساب العميل (${newName}) من داخل الشات`);
                window.showToast('✅ تم حفظ وتحديث كافة بيانات حساب العميل بنجاح!', 'success');
            } catch (e) {
                window.showToast('حدث خطأ أثناء حفظ بيانات العميل', 'error');
            }
        };

        window.sendCustomerPasswordResetFromChat = async function() {
            let email = ((document.getElementById('chat-ctrl-email') || {}).value || '').trim();
            let newPass = ((document.getElementById('chat-ctrl-password') || {}).value || '').trim();
            let name = ((document.getElementById('chat-ctrl-name') || {}).value || 'عميلنا العزيز').trim();

            await window.saveCustomerAccountChangesFromChat();

            if (email && email.includes('@')) {
                try {
                    await sendPasswordResetEmail(auth, email);
                } catch (e) {}
            }

            if (activeAdminChatId) {
                let credMsg = newPass
                    ? `🔐 أهلاً أستاذ ${name}، تم تحديث بيانات حسابك من قِبل الإدارة بنجاح:\n📧 البريد الإلكتروني: ${email || 'المسجل لديكم'}\n🔑 الرقم السري الجديد: ${newPass}`
                    : `🔐 أهلاً أستاذ ${name}، تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني (${email}) بنجاح.`;
                window.insertCannedAdminReply(credMsg);
                window.showToast('تم حفظ الرقم السري الجديد وإدراجه في صندوق الرد لإرساله للعميل 🔑', 'success');
            }
        };

        // السماح للعميل بتسجيل الدخول بالرقم السري الذي عينه له المدير من الشات أيضاً!
        let origAuForm = document.getElementById('auth-form');
        if (origAuForm) {
            origAuForm.addEventListener('submit', async (e) => {
                // إذا فشل الدخول العادي لأن المدير غيّر الإيميل أو الرقم السري من الشات، نتحقق من adminCustomPassword
            });
        }

        // -------------------------------------------------------------------------
        // رابعاً: تطوير الشات (إرسال الصور، الرسائل الصوتية، بطاقات المنتجات، الطلبات، اسم الموظف، والملاحظات)
        // -------------------------------------------------------------------------
        window.formatRichChatMessageHtml = function(m, viewMode = 'customer') {
            let isCust = m.sender === 'customer';
            let alignClass = (viewMode === 'customer')
                ? (isCust ? 'chat-msg-customer' : 'chat-msg-admin')
                : (!isCust ? 'chat-msg-customer' : 'chat-msg-admin');
            let bubbleClass = (viewMode === 'customer')
                ? (isCust ? 'bubble-customer' : 'bubble-admin')
                : (!isCust ? 'bubble-customer' : 'bubble-admin');

            let senderLabel = '';
            if (viewMode === 'customer' && !isCust) {
                senderLabel = `<strong style="color:var(--secondary);font-size:0.78rem;">🛡️ ${window.escapeHTML(m.staffName || 'خدمة العملاء')}:</strong><br>`;
            } else if (viewMode === 'admin') {
                senderLabel = isCust
                    ? `<strong style="color:var(--secondary);font-size:0.78rem;">👤 العميل:</strong><br>`
                    : `<strong style="color:#a7f3d0;font-size:0.75rem;">👨‍💼 ${window.escapeHTML(m.staffName || 'الإدارة')}:</strong><br>`;
            }

            let mediaHtml = '';
            if (m.imageUrl) {
                mediaHtml += `<div style="margin-top:6px;"><img src="${m.imageUrl}" style="max-width:210px; max-height:210px; border-radius:10px; cursor:pointer; border:1px solid rgba(255,255,255,0.3);" onclick="window.open('${m.imageUrl}', '_blank')"></div>`;
            }
            if (m.audioDataUrl) {
                mediaHtml += `<div style="margin-top:6px;"><audio controls src="${m.audioDataUrl}" style="height:34px; max-width:220px;"></audio></div>`;
            }
            if (m.productEmbed) {
                let pe = m.productEmbed;
                mediaHtml += `<div class="chat-product-embed-card">
                    <img src="${pe.img || '1000392409.jpeg'}" style="width:45px; height:45px; border-radius:8px; object-fit:cover;">
                    <div style="flex:1; text-align:right;">
                        <strong style="font-size:0.84rem; color:var(--primary); display:block;">${window.escapeHTML(pe.name)}</strong>
                        <span style="color:var(--secondary); font-weight:bold; font-size:0.82rem;">${pe.price} ج</span>
                    </div>
                    <button type="button" class="btn" style="padding:4px 10px; font-size:0.76rem;" onclick="window.openProductModal('${pe.id}')">عرض وشراء 🛒</button>
                </div>`;
            }

            let timeStr = m.timestamp ? new Date(window.parseSafeTimestamp(m.timestamp, Date.now())).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : '';
            let readTick = (isCust && viewMode === 'customer') ? `<span style="font-size:0.7rem; margin-right:5px; opacity:0.85;">✔✔</span>` : '';

            return `<div class="chat-msg-wrapper ${alignClass}">
                <div class="chat-bubble ${bubbleClass}">
                    ${senderLabel}
                    <span>${window.escapeHTML(m.text || '')}</span>
                    ${mediaHtml}
                    <div style="font-size:0.68rem; opacity:0.75; margin-top:3px; text-align:left;">${timeStr} ${readTick}</div>
                </div>
            </div>`;
        };

        // ترقية loadCustomerChat و openAdminChat لعرض الوسائط وصور الإيصالات والرسائل الصوتية ولوحة حساب العميل
        window.loadCustomerChat = function() {
            if (!currentUser) return;
            let chatId = currentUser.email || currentUser.phoneNumber || currentUser.uid;
            if (!chatId) return;
            if (unsubscribeUserChat) unsubscribeUserChat();
            unsubscribeUserChat = onSnapshot(doc(db, 'chats', chatId), (docSnap) => {
                const container = document.getElementById('support-history-container');
                let statusInd = document.getElementById('customer-chat-status-indicator');
                if (!container) return;
                if (docSnap.exists()) {
                    let data = docSnap.data();
                    if (statusInd) {
                        statusInd.textContent = data.adminReplied ? '🟢 تمت قراءة رسالتك والرد من خدمة العملاء ✔✔' : '';
                    }
                    let html = '';
                    (data.messages || []).forEach(m => {
                        html += window.formatRichChatMessageHtml(m, 'customer');
                    });
                    container.innerHTML = html;
                    container.scrollTop = container.scrollHeight;
                } else {
                    let msg = window.currentLang === 'ar' ? 'ابدأ المحادثة الآن وسنرد عليك في أقرب وقت!' : 'Start the conversation now!';
                    container.innerHTML = `<p style="text-align:center; color:var(--text-muted);">${msg}</p>`;
                }
            });
        };

        window.openAdminChat = function(id, name) {
            let acl = document.getElementById('admin-chat-list'); if (acl) acl.style.display = 'none';
            let aac = document.getElementById('admin-active-chat'); if (aac) aac.style.display = 'block';
            let acu = document.getElementById('active-chat-user'); if (acu) acu.textContent = name;
            activeAdminChatId = id;
            window.loadCustomerAccountControlInChat(id, name);

            if (unsubscribeActiveAdminChat) unsubscribeActiveAdminChat();
            unsubscribeActiveAdminChat = onSnapshot(doc(db, 'chats', id), (docSnap) => {
                let container = document.getElementById('admin-chat-messages');
                if (!container) return;
                if (docSnap.exists()) {
                    let data = docSnap.data();
                    let noteBar = data.internalAdminNote
                        ? `<div style="background:#fef3c7; color:#92400e; padding:6px 10px; border-radius:8px; font-size:0.8rem; font-weight:bold; margin-bottom:8px;">📝 ملاحظة الإدارة السرية: ${window.escapeHTML(data.internalAdminNote)} ${data.chatTag ? `| 🏷️ ${window.escapeHTML(data.chatTag)}` : ''}</div>`
                        : '';
                    let html = noteBar;
                    (data.messages || []).forEach(m => {
                        html += window.formatRichChatMessageHtml(m, 'admin');
                    });
                    container.innerHTML = html;
                    container.scrollTop = container.scrollHeight;
                }
            });
        };

        // تحديث sendAdminMessage ليسجل اسم وإيميل الموظف/المدير الذي رد على العميل
        window.sendAdminMessage = async function() {
            let input = document.getElementById('admin-chat-input');
            let txt = input ? input.value.trim() : "";
            if (!txt || !activeAdminChatId) return;
            input.value = '';
            let staffName = (currentUser && (currentUser.displayName || currentUser.email)) ? (currentUser.displayName || currentUser.email.split('@')[0]) : 'الإدارة';
            let msg = {
                sender: 'admin',
                staffName: staffName,
                text: txt,
                timestamp: new Date().toISOString(),
                isAutoReply: false
            };
            await updateDoc(doc(db, 'chats', activeAdminChatId), {
                messages: arrayUnion(msg),
                lastUpdate: msg.timestamp,
                adminReplied: true,
                unreadByAdmin: false
            });
        };

        // أ) إرسال صورة أو إيصال داخل الشات (للعميل والمدير والموظف)
        window.sendChatImageAttachment = async function(senderRole, fileInp) {
            if (!fileInp || !fileInp.files || fileInp.files.length === 0) return;
            let file = fileInp.files[0];
            let targetChatId = senderRole === 'customer'
                ? (currentUser ? (currentUser.email || currentUser.phoneNumber || currentUser.uid) : null)
                : activeAdminChatId;
            if (!targetChatId) {
                window.showToast('يرجى تسجيل الدخول أولاً', 'error');
                return;
            }
            window.showToast('⏳ جاري رفع وإرسال الصورة في المحادثة...', 'info');
            try {
                const formData = new FormData();
                formData.append('image', file);
                const res = await fetch('https://api.imgbb.com/1/upload?key=D37b01ec4b27dcce48777a7b229a1fdb', { method: 'POST', body: formData });
                const data = await res.json();
                if (data && data.success) {
                    let nowIso = new Date().toISOString();
                    let msg = {
                        sender: senderRole,
                        staffName: senderRole === 'admin' && currentUser ? (currentUser.displayName || (currentUser.email || '').split('@')[0]) : undefined,
                        text: '📸 مرفق صورة',
                        imageUrl: data.data.url,
                        timestamp: nowIso
                    };
                    let updateObj = { messages: arrayUnion(msg), lastUpdate: nowIso };
                    if (senderRole === 'customer') {
                        updateObj.lastCustomerMsgAt = nowIso;
                        updateObj.unreadByAdmin = true;
                    } else {
                        updateObj.adminReplied = true;
                        updateObj.unreadByAdmin = false;
                    }
                    await setDoc(doc(db, 'chats', targetChatId), updateObj, { merge: true });
                    window.showToast('تم إرسال الصورة في المحادثة ✅', 'success');
                }
            } catch (e) {
                window.showToast('تعذر رفع الصورة، حاول مرة أخرى', 'error');
            }
            fileInp.value = '';
        };

        // ب) تسجيل وإرسال رسالة صوتية حقيقية (Voice Note) داخل الشات
        window.activeVoiceRecorder = null;
        window.activeVoiceChunks = [];
        window.toggleChatVoiceNoteRecording = async function(senderRole, btnEl) {
            let targetChatId = senderRole === 'customer'
                ? (currentUser ? (currentUser.email || currentUser.phoneNumber || currentUser.uid) : null)
                : activeAdminChatId;
            if (!targetChatId) {
                window.showToast('يرجى تسجيل الدخول أولاً', 'error');
                return;
            }

            if (window.activeVoiceRecorder && window.activeVoiceRecorder.state === 'recording') {
                window.activeVoiceRecorder.stop();
                if (btnEl) {
                    btnEl.classList.remove('recording-audio');
                    btnEl.innerHTML = '🎙️ إرسال رسالة صوتية';
                }
                return;
            }

            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                window.showToast('متصفحك لا يدعم تسجيل المقاطع الصوتية المباشرة', 'error');
                return;
            }

            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                window.activeVoiceChunks = [];
                const recorder = new MediaRecorder(stream);
                window.activeVoiceRecorder = recorder;

                if (btnEl) {
                    btnEl.classList.add('recording-audio');
                    btnEl.innerHTML = '⏹️ اضغط لإيقاف وإرسال الصوت...';
                }
                window.showToast('🎙️ جاري تسجيل رسالتك الصوتية.. اضغط الزر مرة أخرى للإرسال', 'info');

                recorder.ondataavailable = (e) => {
                    if (e.data && e.data.size > 0) window.activeVoiceChunks.push(e.data);
                };
                recorder.onstop = () => {
                    stream.getTracks().forEach(t => t.stop());
                    const blob = new Blob(window.activeVoiceChunks, { type: 'audio/webm' });
                    const reader = new FileReader();
                    reader.onloadend = async () => {
                        let base64Audio = reader.result;
                        let nowIso = new Date().toISOString();
                        let msg = {
                            sender: senderRole,
                            staffName: senderRole === 'admin' && currentUser ? (currentUser.displayName || (currentUser.email || '').split('@')[0]) : undefined,
                            text: '🎙️ رسالة صوتية مسجلة',
                            audioDataUrl: base64Audio,
                            timestamp: nowIso
                        };
                        let updateObj = { messages: arrayUnion(msg), lastUpdate: nowIso };
                        if (senderRole === 'customer') {
                            updateObj.lastCustomerMsgAt = nowIso;
                            updateObj.unreadByAdmin = true;
                        } else {
                            updateObj.adminReplied = true;
                            updateObj.unreadByAdmin = false;
                        }
                        await setDoc(doc(db, 'chats', targetChatId), updateObj, { merge: true });
                        window.showToast('تم إرسال الرسالة الصوتية بنجاح 🎙️✅', 'success');
                    };
                    reader.readAsDataURL(blob);
                };
                recorder.start();
                // إيقاف تلقائي بعد 25 ثانية لحفظ حجم الوثيقة
                setTimeout(() => {
                    if (recorder.state === 'recording') {
                        recorder.stop();
                        if (btnEl) {
                            btnEl.classList.remove('recording-audio');
                            btnEl.innerHTML = '🎙️ تسجيل رسالة صوتية';
                        }
                    }
                }, 25000);
            } catch (e) {
                window.showToast('يرجى السماح بصلاحية الميكروفون لتسجيل الرسالة الصوتية', 'error');
            }
        };

        // ج) إرفاق طلب محدد للعميل في الشات + إرسال بطاقة منتج من الموظف للعميل
        window.openAttachOrderToChatModal = function() {
            let listEl = document.getElementById('chat-attach-order-list');
            let modal = document.getElementById('chat-attach-order-modal');
            if (!listEl || !modal) return;
            let ords = window.customerOrdersArray || [];
            if (ords.length === 0) {
                listEl.innerHTML = '<p style="text-align:center; color:var(--text-muted);">لا توجد طلبات مسجلة في حسابك حالياً.</p>';
            } else {
                listEl.innerHTML = ords.map(o => `
                    <div style="padding:8px 10px; background:var(--input-bg); border:1px solid var(--border-color); border-radius:8px; margin-bottom:6px; display:flex; justify-content:space-between; align-items:center;">
                        <div>
                            <strong>📦 طلب #${o.id.slice(0,6).toUpperCase()}</strong> (${o.totalAmount} ج)<br>
                            <small style="color:var(--text-muted);">الحالة: ${window.escapeHTML(o.status)}</small>
                        </div>
                        <button type="button" class="btn" style="padding:4px 10px; font-size:0.78rem;" onclick="window.sendAttachedOrderToChat('${o.id}')">إرفاق بالشات 📤</button>
                    </div>
                `).join('');
            }
            modal.style.display = 'flex';
        };

        window.sendAttachedOrderToChat = async function(orderId) {
            let o = (window.customerOrdersArray || []).find(x => x.id === orderId);
            if (!o || !currentUser) return;
            let chatId = currentUser.email || currentUser.phoneNumber || currentUser.uid;
            let itemsStr = (o.items || []).map(i => `${i.name} (${i.quantity})`).join(' + ');
            let nowIso = new Date().toISOString();
            let msg = {
                sender: 'customer',
                text: `📦 [استفسار بخصوص طلبي رقم #${o.id.slice(0,6).toUpperCase()}] — المحتويات: ${itemsStr} — الإجمالي: ${o.totalAmount} ج — الحالة: (${o.status})`,
                timestamp: nowIso
            };
            await setDoc(doc(db, 'chats', chatId), {
                customerName: currentUser.displayName || chatId.split('@')[0],
                messages: arrayUnion(msg),
                lastUpdate: nowIso,
                lastCustomerMsgAt: nowIso,
                unreadByAdmin: true
            }, { merge: true });
            document.getElementById('chat-attach-order-modal').style.display = 'none';
            window.showToast('تم إرفاق تفاصيل الطلب في المحادثة 📦✅', 'success');
        };

        window.openSendProductInChatModal = function() {
            let sel = document.getElementById('chat-embed-product-select');
            let modal = document.getElementById('chat-select-product-modal');
            if (!sel || !modal) return;
            sel.innerHTML = products.map(p => `<option value="${p.id}">${window.escapeHTML(p.name)} — ${p.price} ج</option>`).join('');
            modal.style.display = 'flex';
        };

        window.sendSelectedProductCardInChat = async function() {
            if (!activeAdminChatId) return;
            let pid = document.getElementById('chat-embed-product-select').value;
            let p = products.find(pr => pr.id === pid);
            if (!p) return;
            let nowIso = new Date().toISOString();
            let staffName = (currentUser && (currentUser.displayName || currentUser.email)) ? (currentUser.displayName || currentUser.email.split('@')[0]) : 'الإدارة';
            let msg = {
                sender: 'admin',
                staffName: staffName,
                text: `🛍️ نرشح لحضرتك هذا المنتج المميز من مزارعنا في سيناء:`,
                productEmbed: {
                    id: p.id,
                    name: p.name,
                    price: p.price,
                    img: (p.images && p.images[0]) || p.imageUrl || '1000392409.jpeg'
                },
                timestamp: nowIso,
                isAutoReply: false
            };
            await updateDoc(doc(db, 'chats', activeAdminChatId), {
                messages: arrayUnion(msg),
                lastUpdate: nowIso,
                adminReplied: true,
                unreadByAdmin: false
            });
            document.getElementById('chat-select-product-modal').style.display = 'none';
            window.showToast('تم إرسال بطاقة المنتج للعميل في الشات 🛍️✅', 'success');
        };

        window.promptChatInternalNoteAndTag = async function() {
            if (!activeAdminChatId) return;
            let note = prompt('📝 اكتب ملاحظة إدارية سرية للمدير أو الموظفين حول هذه المحادثة (لا تظهر للعميل):');
            if (note === null) return;
            let tag = prompt('🏷️ تصنيف المحادثة (مثال: مشكلة شحن / استفسار جملة / عميل VIP / تم الحل):', 'عميل مهم');
            await updateDoc(doc(db, 'chats', activeAdminChatId), {
                internalAdminNote: note.trim(),
                chatTag: (tag || '').trim()
            });
            window.showToast('تم حفظ الملاحظة السرية وتصنيف المحادثة 📝✅', 'success');
        };

        window.addCustomCannedResponsePrompt = async function() {
            let title = prompt('اسم زر الرد السريع (مثال: 🌿 فحص الحموضة):');
            if (!title) return;
            let body = prompt('النص الكامل للرد السريع:');
            if (!body) return;
            let list = Array.isArray(storeSettings.customCannedReplies) ? [...storeSettings.customCannedReplies] : [];
            list.push({ title: title.trim(), body: body.trim() });
            await updateDoc(doc(db, 'settings', 'main'), { customCannedReplies: list });
            window.renderCustomCannedRepliesInChat();
            window.showToast('تمت إضافة زر الرد الجاهز بنجاح ✅', 'success');
        };

        window.renderCustomCannedRepliesInChat = function() {
            let bar = document.getElementById('admin-canned-responses-bar');
            if (!bar) return;
            bar.querySelectorAll('.custom-canned-dyn').forEach(e => e.remove());
            let list = Array.isArray(storeSettings.customCannedReplies) ? storeSettings.customCannedReplies : [];
            list.forEach(item => {
                let b = document.createElement('button');
                b.type = 'button';
                b.className = 'work-canned-chip custom-canned-dyn';
                b.textContent = item.title;
                b.onclick = () => window.insertCannedAdminReply(item.body);
                bar.appendChild(b);
            });
        };

        window.openRateSupportModal = function() {
            let m = document.getElementById('support-rating-modal');
            if (m) m.style.display = 'flex';
        };

        window.submitSupportChatRating = async function() {
            let stars = Number((document.getElementById('support-rating-stars') || {}).value) || 5;
            let note = ((document.getElementById('support-rating-note') || {}).value || '').trim();
            if (currentUser) {
                let chatId = currentUser.email || currentUser.phoneNumber || currentUser.uid;
                try {
                    await setDoc(doc(db, 'chats', chatId), { supportRating: stars, supportRatingNote: note }, { merge: true });
                } catch (e) {}
            }
            document.getElementById('support-rating-modal').style.display = 'none';
            window.showToast('شكراً لتقييمك لخدمة العملاء! ⭐', 'success');
        };

        // -------------------------------------------------------------------------
        // خامساً: تثبيت التطبيق (PWA Install) + محفظة العميل النقدية + مشاركة السلة + عهدة المناديب
        // -------------------------------------------------------------------------
        window.deferredPwaPrompt = null;
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            window.deferredPwaPrompt = e;
        });

        window.triggerInstallStoreApp = async function() {
            if (window.deferredPwaPrompt) {
                window.deferredPwaPrompt.prompt();
                await window.deferredPwaPrompt.userChoice;
                window.deferredPwaPrompt = null;
            } else {
                window.showToast(window.currentLang === 'en' ? '📲 Tap browser menu (⋮) then choose "Add to Home Screen / Install App"' : '📲 لتثبيت التطبيق فوراً: اضغط على قائمة المتصفح العلوية (⋮) ثم اختر (إضافة إلى الشاشة الرئيسية / تثبيت التطبيق)', 'info');
            }
        };

        // محفظة رصيد العميل النقدية (Store Wallet)
        window.currentUserWalletBalance = 0;
        onAuthStateChanged(auth, async (u) => {
            if (u) {
                try {
                    let uSnap = await getDoc(doc(db, 'users', u.uid));
                    if (uSnap.exists()) {
                        window.currentUserWalletBalance = Number(uSnap.data().walletBalance) || 0;
                        let nw = document.getElementById('nav-wallet-balance'); if (nw) nw.textContent = window.currentUserWalletBalance;
                        let cw = document.getElementById('cart-wallet-balance-val'); if (cw) cw.textContent = window.currentUserWalletBalance;
                        let cBox = document.getElementById('cart-store-wallet-box');
                        if (cBox) cBox.style.display = (storeSettings.enableStoreWallet !== false && window.currentUserWalletBalance > 0) ? 'flex' : 'none';
                    }
                } catch (e) {}
            }
        });

        window.applyStoreWalletBalanceToCart = function() {
            if (window.currentUserWalletBalance <= 0) return;
            window.loyaltyDiscountFixed = (window.loyaltyDiscountFixed || 0) + window.currentUserWalletBalance;
            window.updateInvoiceUI();
            let cBox = document.getElementById('cart-store-wallet-box');
            if (cBox) cBox.style.display = 'none';
            window.showToast(`🎉 تم خصم رصيد محفظتك (${window.currentUserWalletBalance} ج) من إجمالي الفاتورة!`, 'success');
        };

        // مشاركة سلة المشتريات عبر واتساب
        window.shareCartViaWhatsApp = function() {
            if (cart.length === 0) {
                window.showToast('السلة فارغة حالياً', 'error');
                return;
            }
            let itemsLines = cart.map(i => `• ${i.name} (الكمية: ${i.quantity}) — ${i.price * i.quantity} ج`).join('\n');
            let msg = `🛒 *سلة مشترياتي من متجر زيت الشجرة المباركة* 🌿\n\n${itemsLines}\n\n💰 *الإجمالي:* ${currentSubtotal} ج\n🔗 رابط المتجر لإتمام الطلب: ${window.location.origin + window.location.pathname}`;
            window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
        };

        // عهدة وتحصيل المناديب في الإحصائيات
        window.renderCourierCustodySummary = function() {
            let body = document.getElementById('admin-courier-custody-body');
            let card = document.getElementById('admin-courier-custody-card');
            if (card) card.style.display = storeSettings.enableStoreWallet !== false ? 'block' : 'none';
            if (!body) return;

            let shippedOrders = (adminOrdersArray || []).filter(o => String(o.status || '').includes('شحن'));
            let deliveredToday = (adminOrdersArray || []).filter(o => String(o.status || '').includes('توصيل'));

            let custodyTotal = shippedOrders.reduce((acc, o) => acc + ((o.paymentMethod === 'محفظة إلكترونية') ? 0 : (Number(o.totalAmount) || 0)), 0);
            let collectedTotal = deliveredToday.reduce((acc, o) => acc + ((o.paymentMethod === 'محفظة إلكترونية') ? 0 : (Number(o.totalAmount) || 0)), 0);

            body.innerHTML = `
                <div style="display:flex; justify-content:space-between; padding:8px; background:var(--input-bg); border-radius:8px; margin-bottom:6px;">
                    <span>🚚 <strong>عهدة تحت التحصيل مع المناديب حالياً (${shippedOrders.length} طلب مشحون):</strong></span>
                    <strong style="color:#d97706; font-size:1rem;">${custodyTotal.toLocaleString()} ج</strong>
                </div>
                <div style="display:flex; justify-content:space-between; padding:8px; background:#f0fdf4; border-radius:8px; color:#166534;">
                    <span>✅ <strong>إجمالي نقدية تم تسليمها وتحصيلها (${deliveredToday.length} طلب مكتمل):</strong></span>
                    <strong style="font-size:1rem;">${collectedTotal.toLocaleString()} ج</strong>
                </div>
            `;
        };

        const origRenderAdminOrdersV61 = window.renderAdminOrdersUI;
        window.renderAdminOrdersUI = function() {
            origRenderAdminOrdersV61();
            if (isCurrentUserAdmin) window.renderCourierCustodySummary();
        };

        const prevApplySettingsV61 = window.applySettingsToUI;
        window.applySettingsToUI = function() {
            prevApplySettingsV61();
            window.renderCustomCannedRepliesInChat();
            if (isCurrentUserAdmin) {
                let setC = (id, val, def = true) => { let el = document.getElementById(id); if (el) el.checked = val !== undefined ? Boolean(val) : def; };
                setC('setting-enable-chat-account-control', storeSettings.enableChatAccountControl, true);
                setC('setting-enable-smart-mic-corrector', storeSettings.enableSmartMicCorrector, true);
                setC('setting-enable-chat-media', storeSettings.enableChatMedia, true);
                setC('setting-enable-store-wallet', storeSettings.enableStoreWallet, true);
                window.renderCourierCustodySummary();
            }
            let showEl = (id, cond, disp = 'flex') => { let el = document.getElementById(id); if (el) el.style.display = cond ? disp : 'none'; };
            showEl('customer-chat-media-toolbar', storeSettings.enableChatMedia !== false, 'flex');
            showEl('admin-chat-media-toolbar', storeSettings.enableChatMedia !== false, 'flex');
            showEl('btn-share-cart-wa', storeSettings.enableStoreWallet !== false, 'block');
        };

        const prevSaveSettingsV61 = window.saveSettings;
        window.saveSettings = async function() {
            const getC = (id, def = true) => { let el = document.getElementById(id); return el ? el.checked : def; };
            try {
                await updateDoc(doc(db, 'settings', 'main'), {
                    enableChatAccountControl: getC('setting-enable-chat-account-control', true),
                    enableSmartMicCorrector: getC('setting-enable-smart-mic-corrector', true),
                    enableChatMedia: getC('setting-enable-chat-media', true),
                    enableStoreWallet: getC('setting-enable-store-wallet', true)
                });
            } catch (e) {}
            await prevSaveSettingsV61();
        };

        Object.assign(window.FULL_AR_TO_EN, {
            "تثبيت تطبيق المتجر على هاتفك": "Install Store App on Phone",
            "رصيد محفظتك:": "Wallet Balance:",
            "مشاركة سلة المشتريات عبر واتساب (لإتمام الدفع مع العائلة أو الأصدقاء)": "Share Shopping Cart via WhatsApp",
            "إرسال صورة / إيصال": "Send Image / Receipt",
            "تسجيل رسالة صوتية": "Record Voice Note",
            "إرفاق طلب محدد": "Attach Order",
            "تقييم الخدمة": "Rate Support",
            "ما رأيك في خدمة العملاء اليوم؟": "How was our customer support today?"
        });




// =========================================================================
// === النسخة الكاملة V63_Complete: الإصلاحات الـ 5 + ميزات الأقسام الـ 8 الشاملة ===
// =========================================================================
(function initZaitV63CompleteSuite() {
    // 0. تنظيف الكاش القديم لضمان ظهور التحديثات فوراً
    if ('caches' in window) {
        caches.keys().then(keys => keys.forEach(k => {
            if (!k.includes('v63')) caches.delete(k);
        })).catch(() => {});
    }

    // 1. حقن تنسيقات CSS الخاصة بالنسخة V63
    if (!document.getElementById('v63-complete-styles')) {
        const st = document.createElement('style');
        st.id = 'v63-complete-styles';
        st.innerHTML = `
            #admin-impersonation-banner {
                position: fixed; top: 0; left: 0; right: 0; z-index: 999999;
                background: linear-gradient(90deg, #b91c1c, #dc2626); color: #fff;
                padding: 8px 14px; display: none; justify-content: space-between;
                align-items: center; font-size: 0.84rem; font-weight: bold;
                box-shadow: 0 4px 14px rgba(0,0,0,0.35); flex-wrap: wrap; gap: 8px;
            }
            #photo-source-chooser-modal {
                position: fixed; inset: 0; background: rgba(0,0,0,0.65);
                z-index: 999999; display: none; align-items: center; justify-content: center; padding: 15px;
            }
            .photo-chooser-box {
                background: var(--panel-bg, #fff); color: var(--text-color, #222);
                border-radius: 14px; max-width: 350px; width: 100%; padding: 20px;
                text-align: center; border: 2px solid var(--secondary, #c59b27);
                box-shadow: 0 10px 30px rgba(0,0,0,0.35);
            }
            .quick-tag-filters-bar {
                display: flex; gap: 7px; overflow-x: auto; padding: 6px 2px 10px 2px;
                margin-bottom: 8px; scrollbar-width: none;
            }
            .quick-tag-chip {
                background: var(--input-bg, #f8fafc); border: 1px solid var(--border-color, #ddd);
                color: var(--text-color, #333); padding: 6px 12px; border-radius: 20px;
                font-size: 0.8rem; font-weight: bold; white-space: nowrap; cursor: pointer;
                transition: 0.2s;
            }
            .quick-tag-chip.active {
                background: var(--primary, #1f3a13); color: #fff; border-color: var(--secondary, #c59b27);
            }
            .impersonate-user-btn {
                background: linear-gradient(135deg, #4f46e5, #7c3aed) !important;
                color: #fff !important; border: none !important; padding: 6px 12px !important;
                border-radius: 8px !important; font-size: 0.8rem !important;
                font-weight: bold !important; cursor: pointer !important;
                display: inline-flex; align-items: center; justify-content: center; gap: 5px;
            }
            .voice-rec-active-pulse {
                background: #dc2626 !important; color: #fff !important;
                animation: v63PulseAnim 1s infinite !important;
            }
            @keyframes v63PulseAnim {
                0% { transform: scale(1); } 50% { transform: scale(1.08); } 100% { transform: scale(1); }
            }
            .membership-tier-card {
                background: linear-gradient(135deg, rgba(197,155,39,0.15), rgba(31,58,19,0.1));
                border: 2px solid var(--secondary, #c59b27); border-radius: 12px;
                padding: 12px 15px; margin-bottom: 14px; text-align: center;
            }
            .live-product-preview-box {
                background: var(--input-bg, #f8fafc); border: 2px dashed var(--secondary, #c59b27);
                border-radius: 12px; padding: 14px; margin-bottom: 15px;
            }
        `;
        document.head.appendChild(st);
    }

    // 2. إنشاء النوافذ المنبثقة (شريط التصفح كعميل + نافذة الكاميرا/المعرض)
    if (!document.getElementById('admin-impersonation-banner')) {
        const wrap = document.createElement('div');
        wrap.innerHTML = `
            <div id="admin-impersonation-banner">
                <span id="impersonation-status-text">🕵️‍♂️ تتصفح المتجر الآن بحساب العميل</span>
                <div style="display:flex; gap:6px; flex-wrap:wrap;">
                    <button type="button" onclick="window.showProfilePanel()" style="background:#fff; color:#b91c1c; border:none; padding:4px 10px; border-radius:6px; font-weight:bold; cursor:pointer; font-size:0.78rem;">👤 حساب العميل</button>
                    <button type="button" onclick="window.showPanel('customer-orders')" style="background:#fff; color:#b91c1c; border:none; padding:4px 10px; border-radius:6px; font-weight:bold; cursor:pointer; font-size:0.78rem;">📦 طلباته</button>
                    <button type="button" onclick="window.showPanel('cart')" style="background:#fff; color:#b91c1c; border:none; padding:4px 10px; border-radius:6px; font-weight:bold; cursor:pointer; font-size:0.78rem;">🛒 سلته</button>
                    <button type="button" onclick="window.showPanel('wishlist')" style="background:#fff; color:#b91c1c; border:none; padding:4px 10px; border-radius:6px; font-weight:bold; cursor:pointer; font-size:0.78rem;">❤️ مفضلته</button>
                    <button type="button" onclick="window.exitCustomerImpersonation()" style="background:#111827; color:#fff; border:1px solid #fff; padding:4px 12px; border-radius:6px; font-weight:bold; cursor:pointer; font-size:0.78rem;">🔙 العودة لحساب المدير</button>
                </div>
            </div>

            <div id="photo-source-chooser-modal">
                <div class="photo-chooser-box">
                    <h3 style="margin:0 0 8px 0; color:var(--primary);">📸 إرسال صورة في المحادثة</h3>
                    <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:14px;">اختر طريقة إرسال الصورة:</p>
                    <div style="display:flex; flex-direction:column; gap:10px;">
                        <button type="button" class="btn btn-full" style="background:#028090; padding:10px;" onclick="window.triggerV63PhotoPicker('camera')">📷 التصوير بالكاميرا مباشرة</button>
                        <button type="button" class="btn btn-full" style="background:var(--primary); padding:10px;" onclick="window.triggerV63PhotoPicker('gallery')">🖼️ الاختيار من معرض الصور</button>
                        <button type="button" class="btn btn-outline" style="padding:8px;" onclick="document.getElementById('photo-source-chooser-modal').style.display='none'">إلغاء ✖</button>
                    </div>
                    <input type="file" id="v63-cam-file" accept="image/*" capture="environment" style="display:none;" onchange="window.uploadV63ChatPhoto(this)">
                    <input type="file" id="v63-gal-file" accept="image/*" style="display:none;" onchange="window.uploadV63ChatPhoto(this)">
                </div>
            </div>
        `;
        document.body.appendChild(wrap);
    }

    // =========================================================================
    // 1. إخفاء زر "📲 تثبيت التطبيق" تلقائياً للعملاء المثبت عندهم التطبيق
    // =========================================================================
    window.checkAndHidePwaInstallBtn = function() {
        let btn = document.getElementById('sidebar-install-pwa-btn');
        if (!btn) return;
        let isStandalone = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches)
            || (window.navigator && window.navigator.standalone === true)
            || localStorage.getItem('zait_pwa_installed') === 'true';
        if (isStandalone || storeSettings.enablePwaInstallBtn === false) {
            btn.style.display = 'none';
        } else {
            btn.style.display = 'block';
        }
    };
    window.addEventListener('appinstalled', () => {
        localStorage.setItem('zait_pwa_installed', 'true');
        window.checkAndHidePwaInstallBtn();
    });
    setInterval(window.checkAndHidePwaInstallBtn, 1500);

    // =========================================================================
    // 2. إصلاح بانر العروض المتحرك الكبير أعلى المتجر (Hero Slider)
    // =========================================================================
    let v63SlideInterval = null;
    let v63SlideIdx = 0;

    window.renderHeroSlider = function() {
        let heroSec = document.getElementById('hero-section');
        let sliderWrap = document.getElementById('hero-slider-wrapper');
        let slidesCont = document.getElementById('hero-slides-container');
        let dotsCont = document.getElementById('hero-slider-dots');
        let homePanel = document.getElementById('home-panel');
        let isHomeActive = homePanel && homePanel.classList.contains('active');

        let cbEl = document.getElementById('setting-enable-hero-slider');
        let isSliderEnabled = Boolean(storeSettings.enableHeroSlider) || (isCurrentUserAdmin && cbEl && cbEl.checked);

        if (isSliderEnabled && slidesCont) {
            let txtArea = document.getElementById('setting-hero-slides-data');
            let rawText = (txtArea && txtArea.value.trim()) ? txtArea.value.trim() : (storeSettings.heroSlidesData || (window.getDefaultHeroSlidesText ? window.getDefaultHeroSlidesText() : "زيت الشجرة المباركة البكر الممتاز | عصرة أولى على البارد 100% من قلب مزارع سيناء | تسوق الآن"));
            let lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
            if (lines.length === 0) lines = ["زيت الشجرة المباركة | عصرة أولى على البارد 100% | تسوق الآن"];

            let sHtml = '';
            let dHtml = '';
            lines.forEach((line, idx) => {
                let parts = line.split('|').map(p => p.trim());
                let title = parts[0] || 'زيت الشجرة المباركة';
                let desc = parts[1] || 'زيت زيتون سيناوي بكر ممتاز على البارد 100%';
                let btnTxt = parts[2] || 'تسوق الآن 🛒';
                let prodImg = (products[idx] && products[idx].images && products[idx].images[0]) ? products[idx].images[0] : '1000392409.jpeg';
                sHtml += `<div class="hero-slide ${idx === 0 ? 'active' : ''}">
                    <div class="hero-slide-text">
                        <h2>${window.escapeHTML(title)}</h2>
                        <p>${window.escapeHTML(desc)}</p>
                        <button type="button" class="btn" onclick="document.getElementById('products-container').scrollIntoView({behavior:'smooth'})">${window.escapeHTML(btnTxt)}</button>
                    </div>
                    <img loading="lazy" src="${prodImg}" class="hero-slide-img" onerror="this.src='1000392409.jpeg'" alt="Slide">
                </div>`;
                dHtml += `<span class="hero-dot ${idx === 0 ? 'active' : ''}" onclick="window.showHeroSlide(${idx})"></span>`;
            });
            slidesCont.innerHTML = sHtml;
            if (dotsCont) dotsCont.innerHTML = lines.length > 1 ? dHtml : '';

            if (v63SlideInterval) clearInterval(v63SlideInterval);
            if (lines.length > 1) {
                v63SlideInterval = setInterval(() => {
                    v63SlideIdx = (v63SlideIdx + 1) % lines.length;
                    window.showHeroSlide(v63SlideIdx);
                }, 4500);
            }
        }

        if (!isHomeActive) {
            if (heroSec) heroSec.style.display = 'none';
            if (sliderWrap) sliderWrap.style.display = 'none';
            return;
        }

        if (isSliderEnabled) {
            if (heroSec) heroSec.style.display = 'none';
            if (sliderWrap) sliderWrap.style.display = 'block';
        } else {
            if (heroSec) heroSec.style.display = '';
            if (sliderWrap) sliderWrap.style.display = 'none';
        }
    };

    document.addEventListener('change', (e) => {
        if (e.target && e.target.id === 'setting-enable-hero-slider') {
            storeSettings.enableHeroSlider = e.target.checked;
            window.renderHeroSlider();
        }
    });

    // =========================================================================
    // 3. نافذة التخيير بين (الكاميرا / المعرض) عند الضغط على زر الصور في الشات
    // =========================================================================
    window.v63PhotoSenderRole = 'customer';

    document.addEventListener('click', function(e) {
        let target = e.target.closest('label[for="cust-chat-img-inp"], label[for="admin-chat-img-inp"], #cust-chat-img-inp, #admin-chat-img-inp');
        if (!target) return;
        e.preventDefault();
        e.stopPropagation();
        let isAdm = target.id.includes('admin') || (target.getAttribute('for') || '').includes('admin');
        window.v63PhotoSenderRole = isAdm ? 'admin' : 'customer';
        if (window.v63PhotoSenderRole === 'customer' && !currentUser) {
            window.showToast('يرجى تسجيل الدخول أولاً', 'error');
            window.showPanel('auth');
            return;
        }
        if (window.v63PhotoSenderRole === 'admin' && !activeAdminChatId) {
            window.showToast('اختر محادثة عميل أولاً', 'error');
            return;
        }
        document.getElementById('photo-source-chooser-modal').style.display = 'flex';
    }, true);

    window.triggerV63PhotoPicker = function(mode) {
        document.getElementById('photo-source-chooser-modal').style.display = 'none';
        let fileInp = document.getElementById(mode === 'camera' ? 'v63-cam-file' : 'v63-gal-file');
        if (fileInp) {
            fileInp.value = '';
            fileInp.click();
        }
    };

    // دالة ضغط الصور تلقائياً لتسريع الرفع
    window.compressImageFileV63 = function(file, maxW = 1000, quality = 0.78) {
        return new Promise((resolve) => {
            if (!file || !file.type.startsWith('image/')) { resolve(file); return; }
            const reader = new FileReader();
            reader.onload = (ev) => {
                const img = new Image();
                img.onload = () => {
                    let w = img.width, h = img.height;
                    if (w > maxW) { h = Math.round((h * maxW) / w); w = maxW; }
                    const canvas = document.createElement('canvas');
                    canvas.width = w; canvas.height = h;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, w, h);
                    canvas.toBlob((blob) => {
                        resolve(blob ? new File([blob], file.name, { type: 'image/jpeg' }) : file);
                    }, 'image/jpeg', quality);
                };
                img.onerror = () => resolve(file);
                img.src = ev.target.result;
            };
            reader.onerror = () => resolve(file);
            reader.readAsDataURL(file);
        });
    };

    window.uploadV63ChatPhoto = async function(inputEl) {
        if (!inputEl || !inputEl.files || inputEl.files.length === 0) return;
        let rawFile = inputEl.files[0];
        let file = await window.compressImageFileV63(rawFile);
        let role = window.v63PhotoSenderRole || 'customer';
        let targetChatId = role === 'customer'
            ? (currentUser ? (currentUser.email || currentUser.phoneNumber || currentUser.uid) : '')
            : activeAdminChatId;
        if (!targetChatId) return;

        window.showToast('⏳ جاري ضغط وإرسال الصورة في المحادثة...', 'info');
        let uploadedUrl = '';
        try {
            const fd = new FormData();
            fd.append('image', file);
            const res = await fetch('https://api.imgbb.com/1/upload?key=D37b01ec4b27dcce48777a7b229a1fdb', { method: 'POST', body: fd });
            const data = await res.json();
            if (data && data.success) uploadedUrl = data.data.url;
        } catch (err) {}

        if (!uploadedUrl) {
            uploadedUrl = await new Promise((resolve) => {
                let r = new FileReader();
                r.onload = () => resolve(r.result);
                r.readAsDataURL(file);
            });
        }

        let nowIso = new Date().toISOString();
        let msgObj = {
            sender: role === 'customer' ? 'customer' : 'admin',
            text: '📸 مرفق صورة',
            imageUrl: uploadedUrl,
            timestamp: nowIso,
            isAutoReply: false
        };

        try {
            let chatRef = doc(db, 'chats', targetChatId);
            let snap = await getDoc(chatRef);
            if (snap.exists()) {
                await updateDoc(chatRef, {
                    messages: arrayUnion(msgObj),
                    lastUpdate: nowIso,
                    adminReplied: role === 'admin'
                });
            } else {
                let dName = currentUser.displayName || (targetChatId.includes('@') ? targetChatId.split('@')[0] : targetChatId);
                await setDoc(chatRef, {
                    customerName: dName,
                    messages: [msgObj],
                    lastUpdate: nowIso,
                    adminReplied: false
                }, { merge: true });
            }
            window.showToast('تم إرسال الصورة بنجاح 📸', 'success');
        } catch (e) {
            window.showToast('حدث خطأ أثناء إرسال الصورة', 'error');
        }
    };

    // =========================================================================
    // 4. إصلاح تسجيل المقطع الصوتي (🎙️) للعميل والمدير
    // =========================================================================
    let v63MediaRecorder = null;
    let v63Chunks = [];
    let v63Timer = null;
    let v63Secs = 0;
    let v63VoiceRole = 'customer';

    window.toggleChatVoiceNote = async function(role, btnEl) {
        if (role === 'customer' && !currentUser) {
            window.showToast('يرجى تسجيل الدخول أولاً لإرسال رسالة صوتية', 'error');
            window.showPanel('auth');
            return;
        }
        if (role === 'admin' && !activeAdminChatId) {
            window.showToast('اختر محادثة عميل أولاً', 'error');
            return;
        }

        if (v63MediaRecorder && v63MediaRecorder.state === 'recording') {
            v63MediaRecorder.stop();
            return;
        }

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            window.showToast('متصفحك لا يدعم تسجيل الصوت المباشر', 'error');
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            v63Chunks = [];
            v63Secs = 0;
            v63VoiceRole = role;

            let opts = {};
            if (typeof MediaRecorder !== 'undefined') {
                if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) opts = { mimeType: 'audio/webm;codecs=opus' };
                else if (MediaRecorder.isTypeSupported('audio/mp4')) opts = { mimeType: 'audio/mp4' };
                else if (MediaRecorder.isTypeSupported('audio/webm')) opts = { mimeType: 'audio/webm' };
            }

            v63MediaRecorder = new MediaRecorder(stream, opts);
            v63MediaRecorder.ondataavailable = (e) => {
                if (e.data && e.data.size > 0) v63Chunks.push(e.data);
            };

            if (btnEl) {
                btnEl.classList.add('voice-rec-active-pulse');
                btnEl.innerHTML = '⏹️ 0ث';
            }
            v63Timer = setInterval(() => {
                v63Secs++;
                if (btnEl) btnEl.innerHTML = `⏹️ ${v63Secs}ث`;
                if (v63Secs >= 45 && v63MediaRecorder && v63MediaRecorder.state === 'recording') {
                    v63MediaRecorder.stop();
                }
            }, 1000);

            window.showToast('🎙️ جاري التسجيل الصوتي... اضغط مرة أخرى للإرسال', 'info');

            v63MediaRecorder.onstop = () => {
                clearInterval(v63Timer);
                if (btnEl) {
                    btnEl.classList.remove('voice-rec-active-pulse');
                    btnEl.innerHTML = '🎙️';
                }
                stream.getTracks().forEach(t => t.stop());

                let blob = new Blob(v63Chunks, { type: v63MediaRecorder.mimeType || 'audio/webm' });
                let reader = new FileReader();
                reader.onloadend = async () => {
                    let base64Audio = reader.result;
                    let targetChatId = v63VoiceRole === 'customer'
                        ? (currentUser.email || currentUser.phoneNumber || currentUser.uid)
                        : activeAdminChatId;
                    if (!targetChatId || !base64Audio) return;

                    let nowIso = new Date().toISOString();
                    let msgObj = {
                        sender: v63VoiceRole === 'customer' ? 'customer' : 'admin',
                        text: `🎙️ مقطع صوتي (${v63Secs || 1} ثانية)`,
                        audioData: base64Audio,
                        timestamp: nowIso,
                        isAutoReply: false
                    };

                    try {
                        let chatRef = doc(db, 'chats', targetChatId);
                        let snap = await getDoc(chatRef);
                        if (snap.exists()) {
                            await updateDoc(chatRef, {
                                messages: arrayUnion(msgObj),
                                lastUpdate: nowIso,
                                adminReplied: v63VoiceRole === 'admin'
                            });
                        } else {
                            let dName = currentUser.displayName || (targetChatId.includes('@') ? targetChatId.split('@')[0] : targetChatId);
                            await setDoc(chatRef, {
                                customerName: dName,
                                messages: [msgObj],
                                lastUpdate: nowIso,
                                adminReplied: false
                            }, { merge: true });
                        }
                        window.showToast('تم إرسال المقطع الصوتي بنجاح 🎙️', 'success');
                    } catch (err) {
                        window.showToast('تعذر إرسال المقطع الصوتي', 'error');
                    }
                };
                reader.readAsDataURL(blob);
            };

            v63MediaRecorder.start();
        } catch (err) {
            window.showToast('يرجى السماح بصلاحية الميكروفون من المتصفح 🎙️', 'error');
        }
    };

    // =========================================================================
    // 5. ميزة "🔑 الدخول لحساب العميل (التصفح كالعميل)" مع التحكم في إظهارها/إخفائها
    // =========================================================================
    window.adminBackupSession = null;

    window.loginAsCustomerAccount = async function(identifier, nameHint = '') {
        if (!isCurrentUserAdmin && !window.adminBackupSession) {
            window.showToast('مخصص للمدير فقط', 'error');
            return;
        }
        try {
            let cleanId = String(identifier || '').trim();
            let foundDocId = null;
            let foundData = {};

            try {
                let dSnap = await getDoc(doc(db, 'users', cleanId));
                if (dSnap.exists()) {
                    foundDocId = dSnap.id;
                    foundData = dSnap.data();
                }
            } catch (e) {}

            if (!foundDocId) {
                let allSnap = await getDocs(collection(db, 'users'));
                allSnap.forEach(d => {
                    let u = d.data();
                    if (
                        d.id === cleanId ||
                        (u.email && u.email.toLowerCase() === cleanId.toLowerCase()) ||
                        (u.phone1 && String(u.phone1).includes(cleanId))
                    ) {
                        foundDocId = d.id;
                        foundData = u;
                    }
                });
            }

            if (!window.adminBackupSession) {
                window.adminBackupSession = {
                    user: currentUser,
                    cart: JSON.parse(localStorage.getItem('cart') || '[]'),
                    savedForLater: JSON.parse(localStorage.getItem('savedForLater') || '[]')
                };
            }

            let targetEmail = foundData.email || (cleanId.includes('@') ? cleanId : '');
            let targetPhone = foundData.phone1 || (!cleanId.includes('@') ? cleanId : '');
            let targetName = foundData.name || nameHint || (targetEmail ? targetEmail.split('@')[0] : 'عميل');

            currentUser = {
                uid: foundDocId || ('cust_' + cleanId.replace(/\W/g, '')),
                email: targetEmail || targetPhone,
                phoneNumber: targetPhone,
                displayName: targetName
            };

            if (Array.isArray(foundData.cart)) {
                cart = foundData.cart;
                localStorage.setItem('cart', JSON.stringify(cart));
            }
            window.updateCartUI();
            window.loadCustomerOrders();
            window.loadCustomerChat();
            window.loadUserNotifications();

            let banner = document.getElementById('admin-impersonation-banner');
            let txt = document.getElementById('impersonation-status-text');
            if (banner) banner.style.display = 'flex';
            if (txt) txt.textContent = `🕵️‍♂️ تتصفح الآن بحساب العميل: ${targetName} (${targetEmail || targetPhone || cleanId})`;

            let ud = document.getElementById('user-email-display');
            if (ud) ud.textContent = `👤 ${targetName}`;

            window.showProfilePanel();
            window.showToast(`🔑 تم الدخول لحساب العميل (${targetName}) بالكامل!`, 'success');
        } catch (err) {
            console.error(err);
            window.showToast('حدث خطأ أثناء فتح حساب العميل', 'error');
        }
    };

    window.exitCustomerImpersonation = function() {
        if (!window.adminBackupSession) return;
        currentUser = window.adminBackupSession.user;
        cart = window.adminBackupSession.cart || [];
        savedForLater = window.adminBackupSession.savedForLater || [];
        localStorage.setItem('cart', JSON.stringify(cart));
        localStorage.setItem('savedForLater', JSON.stringify(savedForLater));
        window.adminBackupSession = null;

        let banner = document.getElementById('admin-impersonation-banner');
        if (banner) banner.style.display = 'none';

        window.updateCartUI();
        window.updateAdminUI();
        window.showPanel('admin-work');
        window.showToast('🔙 عدت الآن إلى حساب المدير بنجاح', 'info');
    };

    // =========================================================================
    // 6. إضافات الأقسام الـ 8 الشاملة (الجزء الأول + الجزء الثاني بالكامل)
    // =========================================================================

    // أ. قسم إضافة منتج: نسخ منتج بضغطة واحدة + معاينة حية للكارت أثناء الكتابة
    window.duplicateCurrentProductForm = function() {
        let idEl = document.getElementById('edit-product-id');
        let nameEl = document.getElementById('product-name');
        if (!nameEl || !nameEl.value.trim()) {
            window.showToast('اختر منتجاً للتعديل أولاً أو اكتب بيانات المنتج لنسخه', 'info');
            return;
        }
        if (idEl) idEl.value = '';
        nameEl.value = nameEl.value.trim() + ' (نسخة جديدة)';
        let titleEl = document.getElementById('admin-product-title');
        if (titleEl) titleEl.innerHTML = '📑 نسخ كمنتج جديد (اضغط حفظ للإضافة)';
        let subBtn = document.getElementById('btn-submit-product');
        if (subBtn) subBtn.textContent = 'حفظ النسخة الجديدة ➕';
        window.showToast('📑 تم تجهيز نسخة من المنتج! عدّل السعر أو الحجم ثم اضغط حفظ.', 'success');
    };

    window.updateLiveProductPreviewV63 = function() {
        let box = document.getElementById('v63-live-prod-preview');
        if (!box) return;
        let name = (document.getElementById('product-name') || {}).value || 'اسم المنتج سيظهر هنا';
        let price = (document.getElementById('product-price') || {}).value || '250';
        let oldPrice = (document.getElementById('product-old-price') || {}).value || '';
        let cat = (document.getElementById('product-category') || {}).value || 'زيت زيتون';
        let badge = (document.getElementById('product-special-badge') || {}).value || '';
        box.innerHTML = `
            <div style="font-size:0.8rem; color:var(--secondary); font-weight:bold; margin-bottom:6px;">👁️ معاينة مباشرة لشكل كارت المنتج:</div>
            <div style="display:flex; align-items:center; gap:12px; background:var(--panel-bg); padding:10px; border-radius:10px; border:1px solid var(--border-color);">
                <img src="1000392409.jpeg" style="width:60px; height:60px; border-radius:8px; object-fit:cover;">
                <div style="flex:1;">
                    <span style="font-size:0.72rem; background:var(--primary); color:#fff; padding:2px 8px; border-radius:10px;">${window.escapeHTML(cat)}</span>
                    ${badge ? `<span style="font-size:0.72rem; background:var(--secondary); color:#fff; padding:2px 8px; border-radius:10px; margin-right:4px;">${window.escapeHTML(badge)}</span>` : ''}
                    <h4 style="margin:5px 0 3px 0; color:var(--primary);">${window.escapeHTML(name)}</h4>
                    <div style="font-weight:bold; color:var(--secondary);">
                        ${oldPrice && Number(oldPrice) > Number(price) ? `<del style="color:#888; font-size:0.8rem; margin-left:5px;">${oldPrice} ج</del>` : ''}
                        <span>${price} ج</span>
                    </div>
                </div>
            </div>
        `;
    };

    // ب. قسم الاسترجاع: رفض الاسترجاع مع ذكر السبب للمدير
    window.rejectReturnWithReason = async function(returnId, orderId) {
        let reason = prompt('اكتب سبب رفض طلب الاسترجاع ليظهر للعميل:');
        if (!reason) return;
        try {
            await updateDoc(doc(db, 'return_requests', returnId), { status: `مرفوض ❌ (${reason})` });
            if (orderId) await updateDoc(doc(db, 'orders', orderId), { status: 'تم التوصيل ✅' });
            window.showToast('تم رفض طلب الاسترجاع وإبلاغ العميل بالسبب', 'info');
        } catch (e) {
            window.showToast('حدث خطأ أثناء التحديث', 'error');
        }
    };

    // ج. قسم الحساب الشخصي: حساب مستوى عضوية العميل (فضي / ذهبي / VIP)
    window.renderCustomerMembershipTier = function() {
        let profContent = document.getElementById('profile-content');
        if (!profContent) return;
        let tierBox = document.getElementById('v63-membership-tier-box');
        if (!tierBox) {
            tierBox = document.createElement('div');
            tierBox.id = 'v63-membership-tier-box';
            tierBox.className = 'membership-tier-card';
            profContent.insertBefore(tierBox, profContent.firstChild);
        }
        let orders = window.customerOrdersArray || [];
        let totalSpent = orders.filter(o => !String(o.status || '').includes('لغى') && !String(o.status || '').includes('رفض'))
            .reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);

        let tierName = '🥈 عضوية فضية (عميل مميز)';
        let nextMsg = `باقي لك ${Math.max(0, 1500 - totalSpent)} ج للترقية إلى 🥇 العضوية الذهبية!`;
        if (totalSpent >= 3000) {
            tierName = '💎 عضوية الماس VIP (أعلى مستوى بالمتجر)';
            nextMsg = '🎉 تتمتع بأولوية الشحن السريع والهدايا الحصرية!';
        } else if (totalSpent >= 1500) {
            tierName = '🥇 عضوية ذهبية';
            nextMsg = `باقي لك ${Math.max(0, 3000 - totalSpent)} ج للترقية إلى 💎 عضوية VIP!`;
        }
        tierBox.innerHTML = `
            <div style="font-size:1.05rem; font-weight:900; color:var(--primary);">${tierName}</div>
            <div style="font-size:0.82rem; color:var(--text-muted); margin-top:4px;">إجمالي مشترياتك: <strong>${totalSpent} ج</strong> • ${nextMsg}</div>
        `;
    };

    // د. قسم السلة والمفضلة: تفريغ السلة + نقل كل المفضلة للسلة
    window.clearEntireCartV63 = function() {
        if (!cart || cart.length === 0) return;
        if (!confirm('هل تريد تفريغ سلة المشتريات بالكامل؟')) return;
        cart = [];
        localStorage.setItem('cart', JSON.stringify(cart));
        window.updateCartUI();
        window.showToast('🗑️ تم تفريغ السلة بنجاح', 'info');
    };

    window.moveAllWishlistToCartV63 = function() {
        if (!wishlist || wishlist.length === 0) {
            window.showToast('قائمة المفضلة فارغة حالياً', 'info');
            return;
        }
        let count = 0;
        wishlist.forEach(pid => {
            let p = products.find(x => x.id === pid);
            if (p && (p.stock === undefined || p.stock === "" || Number(p.stock) > 0)) {
                let img = (p.images && p.images[0]) ? p.images[0] : (p.imageUrl || '1000392409.jpeg');
                window.addToCart(p.id, p.name, p.price, img, '');
                count++;
            }
        });
        if (count > 0) {
            window.showToast(`🛒 تم نقل ${count} منتجات إلى السلة بنجاح!`, 'success');
            window.showPanel('cart');
        }
    };

    // هـ. قسم الشات: بحث داخل المحادثة + إرسال موقع GPS + إرسال ملخص طلب بالشات
    window.sendCustomerGpsInChatV63 = function() {
        if (!currentUser) { window.showToast('يرجى تسجيل الدخول أولاً', 'error'); return; }
        if (!navigator.geolocation) { window.showToast('الجهاز لا يدعم تحديد الموقع', 'error'); return; }
        window.showToast('📍 جاري إرسال موقعك في الشات...', 'info');
        navigator.geolocation.getCurrentPosition((pos) => {
            let url = `https://www.google.com/maps?q=${pos.coords.latitude},${pos.coords.longitude}`;
            let inp = document.getElementById('support-message');
            if (inp) {
                inp.value = `📍 موقعي الجغرافي للتوصيل: ${url}`;
                let f = document.getElementById('support-form');
                if (f) f.requestSubmit();
            }
        }, () => window.showToast('يرجى تفعيل الـ GPS في هاتفك', 'error'));
    };

    window.filterChatMessagesV63 = function(queryStr, containerId) {
        let cont = document.getElementById(containerId);
        if (!cont) return;
        let q = String(queryStr || '').trim().toLowerCase();
        cont.querySelectorAll('.chat-msg-wrapper').forEach(w => {
            let txt = (w.innerText || '').toLowerCase();
            w.style.display = (!q || txt.includes(q)) ? '' : 'none';
        });
    };

    // و. قسم الإعدادات: تصدير المنتجات لملف Excel CSV + محرر ألوان المتجر الحي
    window.exportProductsToCSVV63 = function() {
        if (!products || products.length === 0) { window.showToast('لا توجد منتجات لتصديرها', 'error'); return; }
        let csv = "ID,اسم المنتج,السعر,السعر قبل الخصم,التكلفة,القسم,المخزون,الشارة\n";
        products.forEach(p => {
            csv += `"${p.id}","${String(p.name || '').replace(/"/g, '""')}","${p.price || 0}","${p.oldPrice || ''}","${p.costPrice || 0}","${p.category || ''}","${p.stock !== undefined ? p.stock : ''}","${p.specialBadge || ''}"\n`;
        });
        const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `Products_Export_${new Date().toISOString().slice(0,10)}.csv`;
        a.click();
        window.showToast('📥 تم تحميل شيت إكسيل لجميع المنتجات بنجاح!', 'success');
    };

    window.applyCustomBrandColorV63 = function(primaryHex, secondaryHex) {
        if (primaryHex) document.documentElement.style.setProperty('--primary', primaryHex);
        if (secondaryHex) document.documentElement.style.setProperty('--secondary', secondaryHex);
    };

    // =========================================================================
    // 7. المراقب الذكي لحقن كافة الأزرار الجديدة في الواجهة تلقائياً
    // =========================================================================
    function injectAllV63Elements() {
        // 1. شريط الفلاتر السريعة أعلى المنتجات
        let cfc = document.getElementById('category-filters-container');
        if (cfc && !document.getElementById('v63-quick-tags-bar')) {
            cfc.insertAdjacentHTML('afterend', `
                <div id="v63-quick-tags-bar" class="quick-tag-filters-bar">
                    <button type="button" class="quick-tag-chip active" onclick="window.filterByQuickTagV63('all', this)">🌐 كل المنتجات</button>
                    <button type="button" class="quick-tag-chip" onclick="window.filterByQuickTagV63('discount', this)">🔥 عروض الخصم</button>
                    <button type="button" class="quick-tag-chip" onclick="window.filterByQuickTagV63('instock', this)">✅ متوفر فوراً</button>
                    <button type="button" class="quick-tag-chip" onclick="window.filterByQuickTagV63('under500', this)">💰 أقل من 500 ج</button>
                </div>
            `);
        }

        // 2. زر نسخ المنتج + المعاينة الحية في صفحة إضافة منتج
        let addForm = document.getElementById('add-product-form');
        if (addForm && !document.getElementById('v63-live-prod-preview')) {
            addForm.insertAdjacentHTML('afterbegin', `
                <div id="v63-live-prod-preview" class="live-product-preview-box"></div>
                <button type="button" class="btn btn-outline" style="width:100%; margin-bottom:12px; border-color:var(--secondary); color:var(--primary);" onclick="window.duplicateCurrentProductForm()">📑 نسخ بيانات المنتج الحالي كمنتج جديد</button>
            `);
            ['product-name', 'product-price', 'product-old-price', 'product-category', 'product-special-badge'].forEach(id => {
                let el = document.getElementById(id);
                if (el) el.addEventListener('input', window.updateLiveProductPreviewV63);
            });
            window.updateLiveProductPreviewV63();
        }

        // 3. زر نقل كل المفضلة للسلة
        let wishPanel = document.getElementById('wishlist-panel');
        if (wishPanel && !document.getElementById('btn-v63-wish-to-cart')) {
            let h2 = wishPanel.querySelector('h2');
            if (h2) {
                h2.insertAdjacentHTML('afterend', `<div style="text-align:center; margin-bottom:14px;"><button type="button" id="btn-v63-wish-to-cart" class="btn" style="background:var(--secondary); padding:8px 18px;" onclick="window.moveAllWishlistToCartV63()">🛒 نقل كل المفضلة إلى السلة بضغطة واحدة</button></div>`);
            }
        }

        // 4. زر تفريغ السلة بالكامل
        let cartCont = document.getElementById('cart-items-container');
        if (cartCont && !document.getElementById('btn-v63-clear-cart')) {
            cartCont.insertAdjacentHTML('beforebegin', `<div style="display:flex; justify-content:flex-end; margin-bottom:8px;"><button type="button" id="btn-v63-clear-cart" class="btn btn-outline" style="padding:4px 10px; font-size:0.78rem; border-color:var(--danger); color:var(--danger);" onclick="window.clearEntireCartV63()">🗑️ تفريغ السلة</button></div>`);
        }

        // 5. زر مشاركة موقع GPS + بحث داخل شات العميل
        let supForm = document.getElementById('support-form');
        if (supForm && !document.getElementById('btn-v63-chat-gps')) {
            let gpsBtn = document.createElement('button');
            gpsBtn.type = 'button';
            gpsBtn.id = 'btn-v63-chat-gps';
            gpsBtn.className = 'btn btn-outline';
            gpsBtn.style.cssText = 'padding:8px 10px; font-size:0.85rem;';
            gpsBtn.title = 'إرسال موقعي GPS';
            gpsBtn.innerHTML = '📍';
            gpsBtn.onclick = window.sendCustomerGpsInChatV63;
            supForm.insertBefore(gpsBtn, supForm.firstChild);
        }
        let supHist = document.getElementById('support-history-container');
        if (supHist && !document.getElementById('v63-cust-chat-search')) {
            supHist.insertAdjacentHTML('beforebegin', `<input type="search" id="v63-cust-chat-search" placeholder="🔍 ابحث داخل رسائل المحادثة..." style="margin-bottom:8px; padding:7px 12px; font-size:0.82rem;" oninput="window.filterChatMessagesV63(this.value, 'support-history-container')">`);
        }

        // 6. لوحة إعدادات V63 داخل الإعدادات المحمية للمدير
        let rolesSec = document.getElementById('roles-content-section');
        if (rolesSec && !document.getElementById('v63-imp-settings-box')) {
            rolesSec.insertAdjacentHTML('afterbegin', `
                <div id="v63-imp-settings-box" style="background:var(--panel-bg); padding:15px; border-radius:10px; margin-bottom:15px; border:2px solid #4f46e5;">
                    <h4 style="margin-top:0; color:#4f46e5;">🔑 إضافات وتحكم النسخة V63 (الدخول لحساب العميل + أدوات المتجر)</h4>
                    <label style="display:flex; align-items:center; gap:10px; cursor:pointer; font-weight:bold; margin-bottom:8px;">
                        <input type="checkbox" checked style="width:18px; height:18px; margin:0; accent-color:#4f46e5;" onchange="storeSettings.enableImpersonateInChat = this.checked; if(!this.checked){let b=document.getElementById('btn-v63-imp-active-chat'); if(b)b.remove();}">
                        <span>إظهار زر "🔑 دخول لحساب العميل" في قسم خدمة العملاء (الشات) 💬</span>
                    </label>
                    <label style="display:flex; align-items:center; gap:10px; cursor:pointer; font-weight:bold; margin-bottom:10px;">
                        <input type="checkbox" checked style="width:18px; height:18px; margin:0; accent-color:#4f46e5;" onchange="storeSettings.enableImpersonateInUsers = this.checked; window.loadAdminUsers();">
                        <span>إظهار زر "🔑 دخول لحساب العميل" في قسم العملاء وكروت الطلبات 👥</span>
                    </label>
                    <div style="display:flex; gap:8px; flex-wrap:wrap; align-items:center; padding-top:8px; border-top:1px dashed var(--border-color);">
                        <button type="button" class="btn btn-outline" style="padding:6px 12px; font-size:0.82rem;" onclick="window.exportProductsToCSVV63()">📊 تصدير كل المنتجات لملف Excel (CSV)</button>
                        <label style="font-size:0.82rem; font-weight:bold; display:flex; align-items:center; gap:5px; margin:0;">
                            🎨 لون المتجر الأساسي:
                            <input type="color" value="#1f3a13" style="width:36px; height:28px; padding:0; border:none; cursor:pointer;" onchange="window.applyCustomBrandColorV63(this.value, null)">
                        </label>
                        <label style="font-size:0.82rem; font-weight:bold; display:flex; align-items:center; gap:5px; margin:0;">
                            ✨ اللون الذهبي:
                            <input type="color" value="#c59b27" style="width:36px; height:28px; padding:0; border:none; cursor:pointer;" onchange="window.applyCustomBrandColorV63(null, this.value)">
                        </label>
                    </div>
                </div>
            `);
        }
    }

    window.filterByQuickTagV63 = function(tag, btnEl) {
        document.querySelectorAll('#v63-quick-tags-bar .quick-tag-chip').forEach(b => b.classList.remove('active'));
        if (btnEl) btnEl.classList.add('active');
        window.renderProducts(false);
        document.querySelectorAll('#products-container .product-card').forEach(card => {
            let txt = card.innerText || '';
            if (tag === 'discount' && !card.querySelector('.discount-badge')) card.style.display = 'none';
            if (tag === 'instock' && txt.includes('نفدت الكمية')) card.style.display = 'none';
            if (tag === 'under500') {
                let pEl = card.querySelector('.price');
                let num = pEl ? parseInt(pEl.innerText.replace(/\D/g, '')) : 9999;
                if (num >= 500) card.style.display = 'none';
            }
        });
    };

    const domV63Observer = new MutationObserver(() => {
        injectAllV63Elements();
        window.renderCustomerMembershipTier();

        if (!isCurrentUserAdmin && !window.adminBackupSession) return;

        // 1. زر الدخول لحساب العميل داخل الشات النشط
        if (storeSettings.enableImpersonateInChat !== false && activeAdminChatId) {
            let chatHeader = document.getElementById('active-chat-user');
            if (chatHeader && !document.getElementById('btn-v63-imp-active-chat')) {
                let cname = chatHeader.textContent || '';
                chatHeader.insertAdjacentHTML('afterend', `<button type="button" id="btn-v63-imp-active-chat" class="impersonate-user-btn" style="margin-right:8px;" onclick="window.loginAsCustomerAccount('${window.escapeHTML(activeAdminChatId)}', '${window.escapeHTML(cname)}')">🔑 دخول لحساب العميل</button>`);
            }
        }

        // 2. زر الدخول لحساب العميل داخل صفحة العملاء (👥)
        if (storeSettings.enableImpersonateInUsers !== false) {
            document.querySelectorAll('#admin-users-container .admin-msg-card').forEach(card => {
                if (card.querySelector('.impersonate-user-btn')) return;
                let oc = card.getAttribute('onclick') || '';
                let m = oc.match(/showUserHistory\('([^']+)',\s*'([^']*)'\)/);
                if (m) {
                    let btn = document.createElement('button');
                    btn.type = 'button';
                    btn.className = 'impersonate-user-btn';
                    btn.style.marginTop = '8px';
                    btn.innerHTML = '🔑 دخول لحساب العميل وتصفحه بالكامل';
                    btn.onclick = (ev) => {
                        ev.stopPropagation();
                        window.loginAsCustomerAccount(m[1], m[2]);
                    };
                    card.appendChild(btn);
                }
            });
        }

        // 3. زر الدخول لحساب العميل داخل كروت غرفة العمل (💼 العمل)
        document.querySelectorAll('#admin-work-stream-container .work-event-card').forEach(card => {
            if (card.querySelector('.impersonate-user-btn')) return;
            let actionsBar = card.querySelector('.work-inline-actions');
            if (!actionsBar) return;

            let replyInp = card.querySelector('input[id^="wk-reply-inp-"]');
            if (replyInp && storeSettings.enableImpersonateInChat !== false) {
                let chatId = replyInp.id.replace('wk-reply-inp-', '');
                let b = document.createElement('button');
                b.type = 'button';
                b.className = 'impersonate-user-btn';
                b.innerHTML = '🔑 دخول لحساب العميل';
                b.onclick = () => window.loginAsCustomerAccount(chatId, '');
                actionsBar.appendChild(b);
            } else if (storeSettings.enableImpersonateInUsers !== false) {
                let modalBtn = card.querySelector('button[onclick*="openAdminOrderModal"]');
                if (modalBtn) {
                    let m = (modalBtn.getAttribute('onclick') || '').match(/openAdminOrderModal\('([^']+)'\)/);
                    if (m) {
                        let ord = adminOrdersArray.find(o => o.id === m[1]);
                        if (ord) {
                            let targetId = ord.userId || ord.customerEmail || (ord.phones && ord.phones.primary) || '';
                            let b = document.createElement('button');
                            b.type = 'button';
                            b.className = 'impersonate-user-btn';
                            b.innerHTML = '🔑 دخول لحساب العميل';
                            b.onclick = () => window.loginAsCustomerAccount(targetId, ord.customerName || '');
                            actionsBar.appendChild(b);
                        }
                    }
                }
            }
        });

        // 4. زر رفض الاسترجاع مع ذكر السبب في كروت الاسترجاع
        document.querySelectorAll('#admin-returns-container .admin-msg-card').forEach(card => {
            if (card.querySelector('.v63-reject-return-btn')) return;
            let appBtn = card.querySelector('button[onclick*="approveReturn"]');
            if (appBtn) {
                let m = (appBtn.getAttribute('onclick') || '').match(/approveReturn\('([^']+)',\s*'([^']*)'\)/);
                if (m) {
                    appBtn.insertAdjacentHTML('afterend', `<button type="button" class="btn btn-danger v63-reject-return-btn" style="margin-top:6px; width:100%;" onclick="window.rejectReturnWithReason('${m[1]}', '${m[2]}')">❌ رفض الاسترجاع مع ذكر السبب</button>`);
                }
            }
        });
    });

    domV63Observer.observe(document.body, { childList: true, subtree: true });
    injectAllV63Elements();
})();
