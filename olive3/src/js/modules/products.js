/**
 * Products Module
 * Handles product loading, filtering, rendering, and management
 */

import { db } from '../firebase.js';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, deleteDoc, getDoc, setDoc, increment, arrayUnion } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { state } from '../state.js';
import { escapeHTML, fuzzyMatch, formatCurrency, generateId } from '../utils.js';
import { showToast } from '../utils.js';

let productsUnsubscribe = null;

/**
 * Load products from Firestore with real-time updates
 */
export function loadProducts() {
  if (productsUnsubscribe) {
    productsUnsubscribe();
  }

  productsUnsubscribe = onSnapshot(
    query(collection(db, 'products'), orderBy('createdAt', 'desc')),
    (snapshot) => {
      state.products = [];
      snapshot.forEach(doc => state.products.push({ id: doc.id, ...doc.data() }));
      state.isProductsLoaded = true;
      renderProducts(false);
      renderVisualBar();

      // Update wishlist panel if active
      const wishlistPanel = document.getElementById('wishlist-panel');
      if (wishlistPanel && wishlistPanel.classList.contains('active')) {
        renderWishlist();
      }
    },
    (error) => {
      console.error('Error loading products:', error);
      showToast('خطأ في تحميل المنتجات', 'error');
    }
  );
}

/**
 * Get filtered products count
 * @returns {number} Count of filtered products
 */
export function getFilteredProductsCount() {
  const { products, currentCategoryFilter, searchQuery, storeSettings, isCurrentUserAdmin } = state;
  const minPrice = Number(document.getElementById('min-price')?.value) || 0;
  const maxPriceEl = document.getElementById('max-price');
  const maxPrice = maxPriceEl ? (Number(maxPriceEl.value) || Infinity) : Infinity;

  return products.filter(p => {
    if (p.isHidden && !isCurrentUserAdmin) return false;
    const inCategory = (currentCategoryFilter === 'الكل' || (p.category || 'أخرى') === currentCategoryFilter);
    const inSearch = fuzzyMatch(p.name, searchQuery);
    const inPrice = p.price >= minPrice && p.price <= maxPrice;
    return inCategory && inSearch && inPrice;
  }).length;
}

/**
 * Render products to the grid
 * @param {boolean} scrollToTop - Whether to scroll to top
 */
export function renderProducts(scrollToTop = true) {
  const container = document.getElementById('products-container');
  if (!container) return;

  if (!state.isProductsLoaded) {
    const skeletonHtml = `<div class="skeleton-card"><div class="skeleton-img"></div><div class="skeleton-text"></div><div class="skeleton-text short"></div><div class="skeleton-btn"></div></div>`.repeat(8);
    container.innerHTML = skeletonHtml;
    return;
  }

  const sortOption = document.getElementById('sort-options')?.value || 'default';
  const minPrice = Number(document.getElementById('min-price')?.value) || 0;
  const maxPriceEl = document.getElementById('max-price');
  const maxPrice = maxPriceEl ? (Number(maxPriceEl.value) || Infinity) : Infinity;

  let filteredProducts = state.products.filter(p => {
    if (p.isHidden && !state.isCurrentUserAdmin) return false;
    const inCategory = (state.currentCategoryFilter === 'الكل' || (p.category || 'أخرى') === state.currentCategoryFilter);
    const inSearch = fuzzyMatch(p.name, state.searchQuery);
    const inPrice = p.price >= minPrice && p.price <= maxPrice;
    return inCategory && inSearch && inPrice;
  });

  // Apply variant stock and discount logic
  if (state.storeSettings.enableVariantStock !== false) {
    const nowMs = Date.now();
    filteredProducts.forEach(p => {
      if (p.discountEndsAt && Date.parse(p.discountEndsAt) < nowMs && p.oldPrice && Number(p.oldPrice) > Number(p.price)) {
        p.price = Number(p.oldPrice);
        p.oldPrice = '';
      }
    });
    filteredProducts.sort((a, b) => (Number(a.sortOrder ?? 999)) - (Number(b.sortOrder ?? 999)));
  }

  if (state.storeSettings.enablePinHideProducts !== false) {
    filteredProducts.sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));
  }

  // Apply sorting
  switch (sortOption) {
    case 'price-asc':
      filteredProducts.sort((a, b) => a.price - b.price);
      break;
    case 'price-desc':
      filteredProducts.sort((a, b) => b.price - a.price);
      break;
    case 'rating-desc':
      filteredProducts.sort((a, b) => {
        const rA = a.reviews && a.reviews.length > 0 ? a.reviews.reduce((acc, r) => acc + r.rating, 0) / a.reviews.length : 0;
        const rB = b.reviews && b.reviews.length > 0 ? b.reviews.reduce((acc, r) => acc + r.rating, 0) / b.reviews.length : 0;
        return rB - rA;
      });
      break;
  }

  if (filteredProducts.length === 0) {
    const msg = state.currentLang === 'ar' ? 'لا توجد منتجات مطابقة للبحث أو الفلتر.' : 'No products match your search or filter.';
    container.innerHTML = `<h3 style="text-align: center; grid-column: 1 / -1; color: var(--text-muted);">${msg}</h3>`;
    return;
  }

  const paginatedProducts = filteredProducts.slice(0, state.currentRenderedProducts);
  let htmlContent = '';

  paginatedProducts.forEach(product => {
    const safeName = product.name.replace(/'/g, "\\'");
    const categoryLabel = product.category || 'أخرى';
    let avgRating = 5;
    if (product.reviews && product.reviews.length > 0) {
      let total = 0;
      product.reviews.forEach(r => total += r.rating);
      avgRating = (total / product.reviews.length).toFixed(1);
    }

    const pinHideBtns = (state.currentUser && state.isCurrentUserAdmin && state.storeSettings.enablePinHideProducts !== false)
      ? `<div style="display:flex; gap:5px; padding:0 10px; margin-top:5px;">
          <button type="button" class="btn btn-outline" style="flex:1; font-size:0.78rem; padding:4px;" onclick="event.stopPropagation(); window.togglePinProduct('${product.id}', ${Boolean(product.isPinned)})">
            ${product.isPinned ? '📌 إلغاء التثبيت' : '📌 تثبيت بالأول'}
          </button>
          <button type="button" class="btn btn-outline" style="flex:1; font-size:0.78rem; padding:4px; border-color:var(--danger); color:var(--danger);" onclick="event.stopPropagation(); window.toggleHideProduct('${product.id}', ${Boolean(product.isHidden)})">
            ${product.isHidden ? '👁️ إظهار للعملاء' : '🙈 إخفاء مؤقت'}
          </button>
        </div>`
      : '';

    const adminBtns = state.currentUser && state.isCurrentUserAdmin
      ? `<div style="display:flex; gap:5px; padding: 0 10px; margin-top:5px;">
          <button type="button" class="btn btn-info" style="flex:1; font-size:0.9rem; padding:5px;" onclick="event.stopPropagation(); window.editProduct('${product.id}')">تعديل</button>
          <button type="button" class="btn btn-danger" style="flex:1; font-size:0.9rem; padding:5px;" onclick="event.stopPropagation(); window.deleteProduct('${product.id}')">حذف</button>
        </div>${pinHideBtns}`
      : '';

    const vArr = product.variantsData ? product.variantsData : [];
    let displayPriceText = `${product.price} ج`;
    if (vArr.length > 0) displayPriceText = `يبدأ من ${vArr[0].price} ج`;

    let discountBadge = '';
    const addTxt = state.currentLang === 'ar' ? 'إضافة 🛒' : 'Add 🛒';
    const selTxt = state.currentLang === 'ar' ? 'اختر الحجم 🛒' : 'Select 🛒';
    const discTxt = state.currentLang === 'ar' ? 'خصم' : 'Off';

    if (product.oldPrice && Number(product.oldPrice) > Number(product.price)) {
      const discountPercent = Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100);
      discountBadge = `<span class="discount-badge">${discTxt} ${discountPercent}%</span>`;
      displayPriceText = `<del style="color:var(--text-muted); font-size:0.82rem; margin-left:4px; font-weight:normal;">${product.oldPrice}</del> ` + displayPriceText;
    }

    let priceHtml = `<div class="price">${displayPriceText}</div>`;
    if (state.isCurrentUserAdmin && vArr.length === 0) {
      priceHtml = `<div class="price"><span class="inline-edit-price" contenteditable="true" onclick="event.stopPropagation();" onblur="window.updateProductPriceAdmin('${product.id}', this)">${product.price}</span> ج ✏️</div>`;
    }

    const isWished = state.wishlist.includes(product.id) ? 'active' : '';
    const wishBtnHtml = `<button type="button" class="wishlist-btn ${isWished}" onclick="window.toggleWishlist(event, '${product.id}')">❤</button>`;

    const isOutOfStock = (product.stock !== undefined && product.stock !== "" && Number(product.stock) <= 0);
    const stockBadge = isOutOfStock ? `<div style="color:var(--danger); font-weight:bold; font-size:0.8rem; margin-bottom:4px;">${state.currentLang === 'en' ? 'Out of Stock ❌' : 'نفدت الكمية ❌'}</div>` : '';
    const notifyTxt = state.currentLang === 'en' ? '🔔 Notify Me' : '🔔 بلغني عند التوفر';

    const addBtnState = isOutOfStock
      ? (state.storeSettings.enableBackInStock !== false
        ? `style="background:#e0a800; color:white; padding: 7px 10px; font-size:0.88rem; border-radius:8px;" onclick="window.requestBackInStock(event, '${product.id}', '${safeName}');"`
        : `disabled style="background:var(--border-color); cursor:not-allowed; padding: 7px 10px; font-size:0.92rem; border-radius:8px;"`)
      : `style="padding: 7px 10px; font-size:0.92rem; border-radius:8px;" onclick="window.executeAddToCart(event, '${product.id}', '${safeName}');"`;

    const primaryImage = (product.images && product.images.length > 0) ? product.images[0] : (product.imageUrl || 'https://via.placeholder.com/300');
    const videoIcon = product.videoUrl ? `<div style="position:absolute; bottom:8px; right:8px; background:rgba(0,0,0,0.7); padding:4px 6px; border-radius:50%; color:white; font-size:0.75rem; z-index:2;">▶️</div>` : '';
    const specialBadgeHtml = (state.storeSettings.enableProductBadges !== false && product.specialBadge) ? `<span class="special-product-badge">${escapeHTML(product.specialBadge)}</span>` : '';
    const pinnedBadgeHtml = (state.storeSettings.enablePinHideProducts !== false && product.isPinned) ? `<span class="pinned-product-badge">📌 مثبت</span>` : '';
    const hiddenClass = product.isHidden ? 'hidden-product-card' : '';

    htmlContent += `
      <div class="product-card ${hiddenClass}" onclick="window.openProductModal('${product.id}')">
        <div class="product-card-media">
          ${wishBtnHtml}
          ${state.storeSettings.enableProductCompare !== false
            ? `<button type="button" class="compare-btn-mini ${(state.compareProductIds || []).includes(product.id) ? 'active' : ''}" title="مقارنة" onclick="window.toggleCompareProduct(event, '${product.id}')">⚖️</button>`
            : ''}
          <span class="category-badge">${categoryLabel}</span>
          ${pinnedBadgeHtml}
          <img loading="lazy" src="${primaryImage}" onerror="this.src='https://via.placeholder.com/300x250?text=صورة'">
          ${discountBadge}
          ${specialBadgeHtml}
          ${videoIcon}
        </div>
        <div class="product-card-body">
          <div>
            <h3>${escapeHTML(product.name)}</h3>
            <div class="rating-stars">⭐ ${avgRating}</div>
          </div>
          <div>
            ${priceHtml}
            ${window.getScarcityBarHtml ? window.getScarcityBarHtml(product) : ''}
            ${stockBadge}
            <div style="display:flex; gap:5px; align-items:center;">
              <button type="button" class="btn btn-full" style="flex:1;" ${addBtnState}>
                ${isOutOfStock && state.storeSettings.enableBackInStock !== false ? notifyTxt : (vArr.length > 0 ? selTxt : addTxt)}
              </button>
              ${(!isOutOfStock && state.storeSettings.enableQuickOrder !== false)
                ? `<button type="button" class="btn btn-outline" style="padding:7px 9px; font-size:0.82rem; border-radius:8px; border-color:var(--secondary); color:var(--primary); white-space:nowrap;" title="طلب فوري سريع" onclick="window.openQuickOrderModal(event, '${product.id}')">⚡</button>`
                : ''}
            </div>
          </div>
        </div>
        ${adminBtns}
      </div>`;
  });

  container.innerHTML = htmlContent;

  if (scrollToTop) window.scrollTo(0, 0);
  if (state.isCurrentUserAdmin && window.renderLowStockAlerts) window.renderLowStockAlerts();
}

/**
 * Filter products by category
 * @param {string} category - Category to filter by
 */
export function filterProducts(category) {
  state.currentCategoryFilter = category;
  document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
  if (event && event.target && event.target.classList) event.target.classList.add('active');
  state.currentRenderedProducts = state.productsPerPage;
  renderProducts();
}

/**
 * Render wishlist panel
 */
export async function renderWishlist() {
  const container = document.getElementById('wishlist-container');
  const favProducts = state.products.filter(p => state.wishlist.includes(p.id));

  if (favProducts.length === 0) {
    const msg = state.currentLang === 'ar' ? 'لم تقم بإضافة منتجات للمفضلة بعد.' : 'No products in your wishlist yet.';
    container.innerHTML = `<h3 style="text-align: center; grid-column: 1 / -1; color: var(--text-muted);">${msg}</h3>`;
    return;
  }

  let htmlContent = '';
  favProducts.forEach(product => {
    const isWished = 'active';
    const wishBtnHtml = `<button type="button" class="wishlist-btn ${isWished}" onclick="window.toggleWishlist(event, '${product.id}')">❤</button>`;
    const primaryImage = (product.images && product.images.length > 0) ? product.images[0] : (product.imageUrl || 'https://via.placeholder.com/300');
    const detTxt = state.currentLang === 'ar' ? 'عرض التفاصيل' : 'View Details';

    htmlContent += `
      <div class="product-card" onclick="window.openProductModal('${product.id}')">
        ${wishBtnHtml}
        <img loading="lazy" src="${primaryImage}" onerror="this.src='https://via.placeholder.com/300x250?text=صورة'">
        <div style="padding: 0 10px;">
          <h3>${escapeHTML(product.name)}</h3>
          <div class="price">${product.price} ج</div>
          <button type="button" class="btn btn-full" style="padding: 8px; font-size:1rem;">${detTxt}</button>
        </div>
      </div>`;
  });
  container.innerHTML = htmlContent;
}

/**
 * Toggle product pin status
 * @param {string} productId - Product ID
 * @param {boolean} currentPinned - Current pinned status
 */
export async function togglePinProduct(productId, currentPinned) {
  try {
    await updateDoc(doc(db, 'products', productId), { isPinned: !currentPinned });
    showToast(currentPinned ? 'تم إلغاء التثبيت' : 'تم التثبيت في الأول', 'success');
  } catch (e) {
    showToast('حدث خطأ', 'error');
  }
}

/**
 * Toggle product hide status
 * @param {string} productId - Product ID
 * @param {boolean} currentHidden - Current hidden status
 */
export async function toggleHideProduct(productId, currentHidden) {
  try {
    await updateDoc(doc(db, 'products', productId), { isHidden: !currentHidden });
    showToast(currentHidden ? 'تم الإظهار للعملاء' : 'تم الإخفاء المؤقت', 'success');
  } catch (e) {
    showToast('حدث خطأ', 'error');
  }
}

/**
 * Delete a product
 * @param {string} productId - Product ID
 */
export async function deleteProduct(productId) {
  if (!confirm('حذف المنتج نهائياً؟')) return;
  try {
    await deleteDoc(doc(db, 'products', productId));
    showToast('تم الحذف', 'success');
  } catch (e) {
    showToast('حدث خطأ', 'error');
  }
}

/**
 * Update product price (admin inline edit)
 * @param {string} productId - Product ID
 * @param {HTMLElement} element - Edited element
 */
export async function updateProductPriceAdmin(productId, element) {
  const newPrice = Number(element.textContent);
  if (isNaN(newPrice) || newPrice < 0) {
    showToast('سعر غير صالح', 'error');
    renderProducts(false);
    return;
  }
  try {
    await updateDoc(doc(db, 'products', productId), { price: newPrice });
    showToast('تم تحديث السعر', 'success');
  } catch (e) {
    showToast('فشل التحديث', 'error');
    renderProducts(false);
  }
}

/**
 * Open product modal
 * @param {string} id - Product ID
 */
export function openProductModal(id) {
  const product = state.products.find(p => p.id === id);
  if (!product) return;
  state.activeProductForReview = product.id;

  const safeSlug = product.name.trim().replace(/\s+/g, '-').replace(/[^a-zA-Z0-9؀-ۿ-]/g, '');
  const newUrl = '?item=' + encodeURIComponent(safeSlug) + '&id=' + id;
  if (window.location.search !== newUrl) {
    window.history.pushState({ productId: id }, '', newUrl);
  }

  const safeName = product.name.replace(/'/g, "\\'");
  // Add to recently viewed (import from UI module)
  if (window.addRecentlyViewed) window.addRecentlyViewed(product);

  const imgs = product.images && product.images.length > 0 ? product.images : (product.imageUrl ? [product.imageUrl] : []);
  const mim = document.getElementById('modal-img-main');
  if (mim) mim.src = imgs[0] || 'https://via.placeholder.com/300';

  let galleryHtml = '';
  if (product.videoUrl) {
    galleryHtml += `<div style="width:50px; height:50px; background:#000; color:white; display:flex; align-items:center; justify-content:center; border-radius:8px; cursor:pointer; opacity:0.8; font-size:1.5rem;" onclick="window.open('${product.videoUrl}', '_blank')">▶️</div>`;
  }
  if (imgs.length > 1) {
    imgs.forEach((url, i) => {
      galleryHtml += `<img loading="lazy" src="${url}" class="${i === 0 ? 'active' : ''}" onclick="window.changeMainImg('${url}', this)">`;
    });
  }
  const mgc = document.getElementById('modal-gallery-container');
  if (mgc) mgc.innerHTML = galleryHtml;

  const viewersCount = Math.floor(Math.random() * (80 - 20 + 1)) + 20;
  const viewersEl = document.getElementById('live-viewers-count');
  if (viewersEl) viewersEl.innerText = viewersCount;

  const mc = document.getElementById('modal-category');
  if (mc) mc.textContent = product.category || 'أخرى';
  const mt = document.getElementById('modal-title');
  if (mt) mt.textContent = product.name;
  const st = document.getElementById('sticky-title');
  if (st) st.textContent = product.name;

  state.activeVariantForCart = null;
  const vArr = product.variantsData ? product.variantsData : [];
  const variantContainer = document.getElementById('modal-variants-container');
  const variantSelect = document.getElementById('modal-variant-select');

  if (vArr.length > 0) {
    if (variantContainer) variantContainer.style.display = 'block';
    let opts = '';
    vArr.forEach((v, idx) => { opts += `<option value="${idx}">${v.name} - ${v.price} ج</option>`; });
    if (variantSelect) variantSelect.innerHTML = opts;
    state.activeVariantForCart = { name: vArr[0].name, price: vArr[0].price };
    const mp = document.getElementById('modal-price');
    if (mp) mp.innerHTML = `<span>${vArr[0].price} ج</span>`;
    const spr = document.getElementById('sticky-price');
    if (spr) spr.innerHTML = `${vArr[0].price} ج`;
  } else {
    if (variantContainer) variantContainer.style.display = 'none';
    const mp = document.getElementById('modal-price');
    if (mp) {
      if (product.oldPrice && Number(product.oldPrice) > Number(product.price)) {
        mp.innerHTML = `<del style="color:var(--text-muted); font-size:1.1rem;">${product.oldPrice} ج</del> <span>${product.price} ج</span>`;
      } else {
        mp.innerHTML = `<span>${product.price} ج</span>`;
      }
    }
    const spr = document.getElementById('sticky-price');
    if (spr) spr.innerHTML = `${product.price} ج`;
  }

  const ms = document.getElementById('modal-stock');
  if (ms) {
    if (product.stock !== undefined && product.stock !== "") {
      const avTxt = state.currentLang === 'ar' ? 'الكمية المتاحة:' : 'In stock:';
      const outTxt = state.currentLang === 'ar' ? 'نفدت الكمية ❌' : 'Out of stock ❌';
      if (Number(product.stock) > 0) ms.textContent = `${avTxt} ${product.stock}`;
      else ms.textContent = outTxt;
    } else {
      ms.textContent = '';
    }
  }

  const md = document.getElementById('modal-desc');
  if (md) md.textContent = product.description || '';

  let avgRating = 5;
  let reviewsHtml = '';
  if (product.reviews && product.reviews.length > 0) {
    let total = 0;
    product.reviews.forEach((r, idx) => {
      total += r.rating;
      const revImgHtml = r.imageUrl ? `<br><img loading="lazy" src="${r.imageUrl}" class="review-img" onclick="window.open('${r.imageUrl}', '_blank')">` : '';
      const delBtn = (state.currentUser && state.isCurrentUserAdmin)
        ? `<button onclick="window.deleteReview('${product.id}', ${idx})" style="float:left; background:transparent; border:none; color:var(--danger); font-size:1.2rem; cursor:pointer;" title="حذف التقييم">🗑️</button>`
        : '';
      reviewsHtml += `<div class="review-box">${delBtn}<strong style="color:var(--primary);">${escapeHTML(r.userName)}</strong><br>${'⭐'.repeat(r.rating)}<br><span style="color:var(--text-color); font-size:0.95rem;">${escapeHTML(r.comment)}</span>${revImgHtml}</div>`;
    });
    avgRating = (total / product.reviews.length).toFixed(1);
  } else {
    const noR = state.currentLang === 'ar' ? 'كن أول من يقيّم المنتج!' : 'Be the first to review!';
    reviewsHtml = `<p style="color:var(--text-muted); text-align:center;">${noR}</p>`;
  }

  const mra = document.getElementById('modal-rating-avg');
  if (mra) mra.innerHTML = `⭐ ${avgRating} / 5.0`;
  const mrl = document.getElementById('modal-reviews-list');
  if (mrl) mrl.innerHTML = reviewsHtml;

  // Cross-sell
  const crossSellSec = document.getElementById('modal-cross-sell-section');
  if (crossSellSec && state.storeSettings.enableCrossSell) {
    const crossSellList = document.getElementById('modal-cross-sell-list');
    let related = state.products.filter(p => p.id !== product.id && p.category === product.category).slice(0, 4);
    if (related.length === 0) related = state.products.filter(p => p.id !== product.id).slice(0, 4);
    if (related.length > 0) {
      crossSellSec.style.display = 'block';
      let csHtml = '';
      related.forEach(r => {
        const rImg = (r.images && r.images.length > 0) ? r.images[0] : (r.imageUrl || 'https://via.placeholder.com/150');
        csHtml += `<div style="min-width:120px; max-width:120px; background:var(--input-bg); border:1px solid var(--border-color); border-radius:8px; padding:8px; cursor:pointer;" onclick="window.openProductModal('${r.id}')">
          <img loading="lazy" src="${rImg}" style="width:100%; height:80px; object-fit:cover; border-radius:6px;">
          <div style="font-size:0.8rem; font-weight:bold; color:var(--primary); margin-top:5px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHTML(r.name)}</div>
          <div style="font-size:0.9rem; color:var(--secondary); font-weight:bold;">${r.price} ج</div>
        </div>`;
      });
      if (crossSellList) crossSellList.innerHTML = csHtml;
    } else {
      crossSellSec.style.display = 'none';
    }
  } else if (crossSellSec) {
    crossSellSec.style.display = 'none';
  }

  const isModalOut = (product.stock !== undefined && product.stock !== "" && Number(product.stock) <= 0);
  const addBtnState = isModalOut
    ? (state.storeSettings.enableBackInStock !== false
      ? `style="background:#e0a800; color:white; padding: 8px 15px; font-size:0.95rem;" onclick="window.requestBackInStock(event, '${product.id}', '${safeName}');"`
      : `disabled style="background:var(--border-color); cursor:not-allowed; padding: 8px 15px; font-size:1rem;"`)
    : `style="padding: 8px 15px; font-size:1rem;" onclick="window.executeAddToCart(event, '${product.id}', '${safeName}');"`;
  const addTxt = isModalOut && state.storeSettings.enableBackInStock !== false
    ? (state.currentLang === 'ar' ? '🔔 بلغني عند التوفر' : '🔔 Notify When Available')
    : (state.currentLang === 'ar' ? 'أضف للسلة 🛒' : 'Add to Cart 🛒');
  const sab = document.getElementById('sticky-action-btn');
  if (sab) sab.innerHTML = `<button type="button" class="btn" ${addBtnState}>${addTxt}</button>`;

  // Track event
  if (window.trackEvent) {
    window.trackEvent('ViewContent', {
      content_name: product.name,
      content_category: product.category,
      value: product.price,
      currency: 'EGP'
    });
  }

  const waBtnContainer = document.getElementById('modal-wa-btn-container');
  if (waBtnContainer) {
    waBtnContainer.innerHTML = `<button type="button" class="btn btn-outline" style="width:100%; border-color:#25D366; color:#25D366; display:flex; align-items:center; justify-content:center; gap:8px;" onclick="window.askProductWa('${product.id}')">💬 ${state.currentLang === 'ar' ? 'استفسار عن المنتج عبر واتساب' : 'Inquire on WhatsApp'}</button>`;
  }

  const btnBuyNow = document.getElementById('btn-buy-now');
  if (btnBuyNow) btnBuyNow.style.display = 'block';
  const pm = document.getElementById('product-modal');
  if (pm) pm.style.display = 'flex';
}

/**
 * Close product modal
 */
export function closeProductModal() {
  const pm = document.getElementById('product-modal');
  if (pm) pm.style.display = 'none';
  state.activeProductForReview = null;
  window.history.pushState(null, '', window.location.pathname);
  state.activeVariantForCart = null;
}

/**
 * Change main image in modal
 * @param {string} url - Image URL
 * @param {HTMLElement} el - Clicked thumbnail
 */
export function changeMainImg(url, el) {
  const mim = document.getElementById('modal-img-main');
  if (mim) mim.src = url;
  document.querySelectorAll('.modal-gallery img').forEach(img => img.classList.remove('active'));
  if (el && el.classList) el.classList.add('active');
}

/**
 * Update modal variant price
 */
export function updateModalVariantPrice() {
  if (!state.activeProductForReview) return;
  const product = state.products.find(p => p.id === state.activeProductForReview);
  const ms = document.getElementById('modal-variant-select');
  const idx = ms ? ms.value : 0;
  if (!product || !product.variantsData || !product.variantsData[idx]) return;
  const selectedVar = product.variantsData[idx];
  state.activeVariantForCart = selectedVar;
  const mp = document.getElementById('modal-price');
  if (mp) mp.innerHTML = `<span>${selectedVar.price} ج</span>`;
  const spr = document.getElementById('sticky-price');
  if (spr) spr.innerHTML = `${selectedVar.price} ج`;
}

/**
 * Execute add to cart from modal
 * @param {Event} event - Click event
 * @param {string} id - Product ID
 * @param {string} name - Product name
 */
export function executeAddToCart(event, id, name) {
  if (event) event.stopPropagation();
  const p = state.products.find(x => x.id === id);
  if (!p) return;
  let priceToUse = p.price;
  let finalName = name;
  let variantSuffix = "";
  const img = (p.images && p.images.length > 0) ? p.images[0] : (p.imageUrl || 'https://via.placeholder.com/300');
  if (state.activeVariantForCart) {
    priceToUse = state.activeVariantForCart.price;
    finalName = `${name} (${state.activeVariantForCart.name})`;
    variantSuffix = state.activeVariantForCart.name;
  }
  addToCart(id, finalName, priceToUse, img, variantSuffix);
  closeProductModal();
}

/**
 * Add product to cart
 * @param {string} id - Product ID
 * @param {string} name - Product name
 * @param {number} price - Product price
 * @param {string} imageUrl - Product image URL
 * @param {string} variantSuffix - Variant suffix
 */
export function addToCart(id, name, price, imageUrl, variantSuffix = "") {
  try {
    const product = state.products.find(p => p.id === id);
    const cartItemId = variantSuffix ? `${id}_${variantSuffix}` : id;
    const existingItem = state.cart.find(item => item.cartItemId === cartItemId);

    if (product && product.stock !== undefined && product.stock !== "") {
      const currentQtyInCart = existingItem ? existingItem.quantity : 0;
      if (currentQtyInCart >= Number(product.stock)) {
        showToast(`الكمية المتاحة في المخزن (${product.stock}) فقط!`, 'error');
        return;
      }
    }

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      state.cart.push({
        id: id,
        cartItemId: cartItemId,
        name: name,
        price: Number(price),
        imageUrl: imageUrl,
        quantity: 1,
        variant: variantSuffix,
        selected: true
      });
    }

    localStorage.setItem('cart', JSON.stringify(state.cart));
    localStorage.setItem('cart_last_updated', new Date().getTime());
    updateCartUI();
    showToast('تمت الإضافة للسلة', 'success');
  } catch (e) {
    console.error(e);
  }
}

/**
 * Update cart item quantity
 * @param {string} cartItemId - Cart item ID
 * @param {number} change - Quantity change (+1 or -1)
 */
export function updateQuantity(cartItemId, change) {
  try {
    const itemIndex = state.cart.findIndex(item => item.cartItemId === cartItemId);
    if (itemIndex > -1) {
      const product = state.products.find(p => p.id === state.cart[itemIndex].id);
      const newQty = state.cart[itemIndex].quantity + change;
      if (change > 0 && product && product.stock !== undefined && product.stock !== "") {
        if (newQty > Number(product.stock)) {
          showToast(`الكمية المتاحة (${product.stock}) فقط!`, 'error');
          return;
        }
      }
      state.cart[itemIndex].quantity = newQty;
      if (state.cart[itemIndex].quantity <= 0) state.cart.splice(itemIndex, 1);
      localStorage.setItem('cart', JSON.stringify(state.cart));
      localStorage.setItem('cart_last_updated', new Date().getTime());
      updateCartUI();
    }
  } catch (e) {
    console.error(e);
  }
}

/**
 * Update cart UI
 */
export function updateCartUI() {
  let totalItems = 0;
  state.currentSubtotal = 0;
  let htmlContent = '';

  state.cart.forEach(item => {
    totalItems += item.quantity;
    const isChecked = item.selected !== false;
    if (isChecked) {
      state.currentSubtotal += (item.price * item.quantity);
    }
    const checkAttr = isChecked ? 'checked' : '';

    htmlContent += `
      <div class="cart-item" style="opacity: ${isChecked ? '1' : '0.6'}">
        <input type="checkbox" class="cart-item-checkbox" ${checkAttr} onchange="window.toggleCartItemSelection('${item.cartItemId}', this.checked)">
        <div class="cart-item-info">
          <img loading="lazy" src="${item.imageUrl}">
          <div>
            <strong style="display:block; color:var(--primary); font-size:1.05rem;">${escapeHTML(item.name)}</strong>
            <span style="color:var(--text-muted); font-size:0.9rem;">السعر: ${item.price} ج</span>
            <br><button type="button" class="save-for-later-btn" onclick="window.saveForLater('${item.cartItemId}')"><span class="translatable">حفظ لوقت لاحق</span></button>
            ${state.storeSettings.enableCartItemNotes !== false
              ? `<input type="text" class="cart-item-note-inp" placeholder="📝 ملاحظة خاصة على هذه العبوة (اختياري)..." value="${escapeHTML(item.customNote || '')}" onchange="window.updateCartItemCustomNote('${item.cartItemId}', this.value)">`
              : ''}
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

  const cic = document.getElementById('cart-items-container');
  const mtMsg = state.currentLang === 'ar' ? 'سلتك فارغة.' : 'Your cart is empty.';
  if (cic) cic.innerHTML = htmlContent || `<p style="text-align:center; color:var(--text-muted);">${mtMsg}</p>`;

  const cc = document.getElementById('cart-count');
  if (cc) cc.textContent = totalItems;
  const bcb = document.getElementById('bottom-cart-badge');
  if (bcb) bcb.textContent = totalItems;
  const ct = document.getElementById('cart-total');
  if (ct) ct.textContent = state.currentSubtotal;

  // Saved for later section
  const sflSection = document.getElementById('saved-for-later-section');
  const sflContainer = document.getElementById('saved-for-later-container');
  if (sflSection && sflContainer) {
    if (state.savedForLater.length > 0) {
      sflSection.style.display = 'block';
      let sflHtml = '';
      state.savedForLater.forEach(item => {
        sflHtml += `
          <div class="saved-item-box">
            <div style="display:flex; align-items:center; gap:10px;">
              <img loading="lazy" src="${item.imageUrl}" style="width:50px; height:50px; border-radius:6px; object-fit:cover;">
              <div><strong style="color:var(--primary); font-size:0.95rem;">${escapeHTML(item.name)}</strong><br><span style="color:var(--secondary); font-weight:bold;">${item.price} ج</span></div>
            </div>
            <button type="button" class="btn btn-outline" style="padding:6px 12px; font-size:0.85rem;" onclick="window.moveToCart('${item.cartItemId}')"><span class="translatable">نقل إلى السلة</span></button>
          </div>`;
      });
      sflContainer.innerHTML = sflHtml;
    } else {
      sflSection.style.display = 'none';
    }
  }

  updateInvoiceUI();

  // Free shipping progress
  const freeShippingBox = document.getElementById('free-shipping-box');
  const freeShippingBar = document.getElementById('free-shipping-bar');
  const freeShippingMsg = document.getElementById('free-shipping-msg');
  const targetAmount = (state.storeSettings && state.storeSettings.freeShippingThreshold) ? state.storeSettings.freeShippingThreshold : 1000;
  if (freeShippingBox && freeShippingBar && freeShippingMsg) {
    freeShippingBox.style.display = 'block';
    if (state.currentSubtotal >= targetAmount) {
      freeShippingBar.style.width = '100%';
      freeShippingBar.style.backgroundColor = '#28a745';
      freeShippingMsg.innerHTML = '🎉 مبروك! لقد حصلت على شحن مجاني';
    } else {
      const progress = (state.currentSubtotal / targetAmount) * 100;
      freeShippingBar.style.width = progress + '%';
      freeShippingBar.style.backgroundColor = 'var(--secondary)';
      const remaining = targetAmount - state.currentSubtotal;
      freeShippingMsg.innerHTML = `<span class="translatable">أضف منتجات بقيمة</span> <strong>${remaining} ج</strong> <span class="translatable">لتحصل على شحن مجاني! 🚚</span>`;
    }
  }

  // Sync to cloud
  if (window.syncCartToCloud) window.syncCartToCloud();

  // Translate
  document.querySelectorAll('.translatable').forEach(el => {
    // Translation handled by language module
  });
}

/**
 * Update invoice UI
 */
export function updateInvoiceUI() {
  const discountVal = Math.round(state.currentSubtotal * (state.currentDiscountPercent / 100)) + state.loyaltyDiscountFixed;
  const targetAmount = (state.storeSettings && state.storeSettings.freeShippingThreshold) ? state.storeSettings.freeShippingThreshold : 1000;
  let finalShipping = state.currentShippingCost;
  if (state.currentSubtotal >= targetAmount) finalShipping = 0;
  let finalTot = (state.currentSubtotal - discountVal) + finalShipping;
  if (finalTot < 0) finalTot = 0;

  document.querySelectorAll('#invoice-subtotal, .invoice-subtotal-val').forEach(el => el.textContent = state.currentSubtotal);
  document.querySelectorAll('#invoice-discount, .invoice-discount-val').forEach(el => el.textContent = discountVal);
  document.querySelectorAll('#invoice-shipping, .invoice-shipping-val').forEach(el => el.textContent = finalShipping);
  document.querySelectorAll('#invoice-total, .invoice-total-val, #cart-total').forEach(el => el.textContent = finalTot);

  document.querySelectorAll('#discount-row, .discount-row-val').forEach(dr => {
    if (discountVal > 0) {
      dr.style.display = 'flex';
      let desc = [];
      if (state.currentDiscountPercent > 0) desc.push(`كوبون (${state.appliedPromoCode})`);
      if (state.loyaltyDiscountFixed > 0) desc.push("نقاط الولاء");
      dr.innerHTML = `<span class="translatable discount-desc" style="color:var(--danger); font-weight:bold;">خصم (${desc.join(' + ')}):</span><span style="color:var(--danger); font-weight:bold;">-<span class="invoice-discount-val">${discountVal}</span> ج</span>`;
    } else {
      dr.style.display = 'none';
    }
  });

  const btnCnlPromo = document.getElementById('btn-cancel-promo');
  if (btnCnlPromo) btnCnlPromo.style.display = state.currentDiscountPercent > 0 ? 'block' : 'none';

  const btnRdmLoyalty = document.getElementById('btn-redeem-loyalty');
  const btnCnlLoyalty = document.getElementById('btn-cancel-loyalty');
  if (btnRdmLoyalty && btnCnlLoyalty) {
    if (state.loyaltyPointsUsedTemp > 0) {
      btnRdmLoyalty.style.display = 'none';
      btnCnlLoyalty.style.display = 'inline-block';
    } else {
      btnRdmLoyalty.style.display = 'inline-block';
      btnCnlLoyalty.style.display = 'none';
    }
  }
}

// Make functions available globally for backward compatibility
if (typeof window !== 'undefined') {
  window.loadProducts = loadProducts;
  window.getFilteredProductsCount = getFilteredProductsCount;
  window.renderProducts = renderProducts;
  window.filterProducts = filterProducts;
  window.renderWishlist = renderWishlist;
  window.togglePinProduct = togglePinProduct;
  window.toggleHideProduct = toggleHideProduct;
  window.deleteProduct = deleteProduct;
  window.updateProductPriceAdmin = updateProductPriceAdmin;
  window.openProductModal = openProductModal;
  window.closeProductModal = closeProductModal;
  window.changeMainImg = changeMainImg;
  window.updateModalVariantPrice = updateModalVariantPrice;
  window.executeAddToCart = executeAddToCart;
  window.addToCart = addToCart;
  window.updateQuantity = updateQuantity;
  window.updateCartUI = updateCartUI;
  window.updateInvoiceUI = updateInvoiceUI;
}

export default {
  loadProducts,
  getFilteredProductsCount,
  renderProducts,
  filterProducts,
  renderWishlist,
  togglePinProduct,
  toggleHideProduct,
  deleteProduct,
  updateProductPriceAdmin,
  openProductModal,
  closeProductModal,
  changeMainImg,
  updateModalVariantPrice,
  executeAddToCart,
  addToCart,
  updateQuantity,
  updateCartUI,
  updateInvoiceUI
};