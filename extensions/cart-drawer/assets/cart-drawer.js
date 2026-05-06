(function () {
  'use strict';

  // Configuration
  const CONFIG = {
    endpoint: window.location.origin,
    shopDomain: window.Shopify?.shop || '',
    currency: window.Shopify?.currency?.active || 'USD',
    cartApiVersion: '2024-01',
  };

  // State
  let cartState = null;
  let settings = null;
  let isOpen = false;
  let containerEl = null;
  let overlayEl = null;

  // DOM Elements cache
  const domCache = {};

  // Initialize
  function init() {
    if (!CONFIG.shopDomain) {
      console.warn('Cart Drawer: Shopify shop domain not found');
      return;
    }

    // Create container
    createDrawerHTML();

    // Bind events
    bindEvents();

    // Load initial cart
    refreshCart();

    // Load settings
    loadSettings();

    console.log('Cart Drawer initialized');
  }

  // Create drawer DOM structure
  function createDrawerHTML() {
    // Overlay
    overlayEl = document.createElement('div');
    overlayEl.id = 'cart-drawer-overlay';
    overlayEl.addEventListener('click', closeDrawer);
    document.body.appendChild(overlayEl);

    // Container
    containerEl = document.createElement('div');
    containerEl.id = 'cart-drawer-container';
    containerEl.className = 'position-right';

    containerEl.innerHTML = `
      <div class="cart-drawer-header">
        <h2 class="cart-drawer-title">Your Cart (<span class="cart-count">0</span>)</h2>
        <button class="cart-drawer-close" aria-label="Close cart">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      <div class="cart-drawer-body">
        <div class="cart-drawer-banners"></div>
        <div class="cart-drawer-content">
          <div class="cart-drawer-loading">
            <div class="cart-drawer-spinner"></div>
          </div>
        </div>
        <div class="cart-drawer-upsells"></div>
      </div>
      <div class="cart-drawer-footer">
        <div class="cart-drawer-totals"></div>
        <button class="cart-drawer-checkout-btn" disabled>Checkout</button>
        <a href="#" class="cart-drawer-continue-shopping">Continue Shopping</a>
      </div>
    `;

    document.body.appendChild(containerEl);

    // Cache DOM elements
    domCache.closeBtn = containerEl.querySelector('.cart-drawer-close');
    domCache.body = containerEl.querySelector('.cart-drawer-body');
    domCache.content = containerEl.querySelector('.cart-drawer-content');
    domCache.footer = containerEl.querySelector('.cart-drawer-footer');
    domCache.checkoutBtn = containerEl.querySelector('.cart-drawer-checkout-btn');
    domCache.continueShopping = containerEl.querySelector('.cart-drawer-continue-shopping');
    domCache.banners = containerEl.querySelector('.cart-drawer-banners');
    domCache.upsells = containerEl.querySelector('.cart-drawer-upsells');
    domCache.cartCount = containerEl.querySelector('.cart-count');
  }

  // Bind events
  function bindEvents() {
    // Close button
    domCache.closeBtn?.addEventListener('click', closeDrawer);

    // Continue shopping
    domCache.continueShopping?.addEventListener('click', (e) => {
      e.preventDefault();
      closeDrawer();
    });

    // Checkout button
    domCache.checkoutBtn?.addEventListener('click', handleCheckout);

    // Intercept add to cart buttons
    document.addEventListener('click', (e) => {
      const addToCartBtn = e.target.closest('[data-add-to-cart], [type="submit"], .add-to-cart, .ajax-add-to-cart');
      if (addToCartBtn) {
        const form = addToCartBtn.closest('form[action*="/cart/add"]');
        if (form) {
          e.preventDefault();
          handleAddToCart(form);
        }
      }

      // Cart icon clicks
      const cartLink = e.target.closest('a[href="/cart"], .cart-link, .cart-icon, [data-cart-trigger]');
      if (cartLink) {
        e.preventDefault();
        openDrawer();
      }
    });

    // Update quantity
    containerEl.addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;

      if (btn.dataset.action === 'increase') {
        const line = btn.dataset.line;
        updateQuantity(line, parseInt(btn.dataset.qty) + 1);
      } else if (btn.dataset.action === 'decrease') {
        const line = btn.dataset.line;
        const newQty = parseInt(btn.dataset.qty) - 1;
        if (newQty > 0) {
          updateQuantity(line, newQty);
        }
      } else if (btn.dataset.action === 'remove') {
        updateQuantity(btn.dataset.line, 0);
      } else if (btn.dataset.action === 'remove-coupon') {
        removeCoupon();
      }
    });

    // Quantity input change
    containerEl.addEventListener('change', (e) => {
      if (e.target.classList.contains('qty-input')) {
        const line = e.target.dataset.line;
        const qty = parseInt(e.target.value);
        if (qty > 0) {
          updateQuantity(line, qty);
        }
      }
    });

    // Coupon form
    containerEl.addEventListener('submit', (e) => {
      if (e.target.classList.contains('coupon-form')) {
        e.preventDefault();
        const input = e.target.querySelector('input[name="coupon"]');
        if (input.value.trim()) {
          applyCoupon(input.value.trim());
        }
      }
    });

    // Upsell click
    containerEl.addEventListener('click', (e) => {
      const upsellCard = e.target.closest('.cart-drawer-upsell-card');
      if (upsellCard) {
        const variantId = upsellCard.dataset.variantId;
        const discount = upsellCard.dataset.discount;
        addUpsellToCart(variantId, discount);
      }
    });

    // Toggle sections
    containerEl.addEventListener('click', (e) => {
      const toggle = e.target.closest('.cart-drawer-coupon-toggle, .cart-drawer-notes-toggle');
      if (toggle) {
        const target = toggle.nextElementSibling;
        if (target) {
          target.style.display = target.style.display === 'none' ? 'block' : 'none';
          toggle.querySelector('svg')?.classList.toggle('rotated');
        }
      }
    });

    // Keyboard
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isOpen) {
        closeDrawer();
      }
    });

    // Listen for Shopify cart updates
    document.addEventListener('cart:updated', () => {
      refreshCart();
    });
  }

  // Open drawer
  function openDrawer() {
    if (!containerEl || !overlayEl) return;
    isOpen = true;
    containerEl.classList.add('active');
    overlayEl.classList.add('active');
    document.body.style.overflow = 'hidden';
    refreshCart();
  }

  // Close drawer
  function closeDrawer() {
    if (!containerEl || !overlayEl) return;
    isOpen = false;
    containerEl.classList.remove('active');
    overlayEl.classList.remove('active');
    document.body.style.overflow = '';
  }

  // Refresh cart data
  async function refreshCart() {
    try {
      const response = await fetch('/cart.js', {
        credentials: 'same-origin',
        headers: {
          'Accept': 'application/json',
        }
      });

      if (!response.ok) throw new Error('Failed to fetch cart');

      cartState = await response.json();
      renderCart();
    } catch (error) {
      console.error('Cart refresh error:', error);
      renderError('Failed to load cart');
    }
  }

  // Load settings
  async function loadSettings() {
    try {
      const response = await fetch(`/apps/cart-drawer/api/settings?shop=${CONFIG.shopDomain}`, {
        credentials: 'same-origin',
      });
      if (response.ok) {
        settings = await response.json();
        applySettings();
      }
    } catch (error) {
      console.error('Settings load error:', error);
    }
  }

  // Apply settings to UI
  function applySettings() {
    if (!settings) return;

    // Position
    if (settings.drawerPosition === 'left') {
      containerEl.classList.remove('position-right');
      containerEl.classList.add('position-left');
    }

    // Primary color
    if (settings.primaryColor) {
      const style = document.createElement('style');
      style.textContent = `
        .cart-drawer-checkout-btn { background: ${settings.primaryColor} !important; }
        .cart-drawer-checkout-btn:hover { background: ${adjustBrightness(settings.primaryColor, -20)} !important; }
      `;
      document.head.appendChild(style);
    }
  }

  // Render cart content
  function renderCart() {
    if (!cartState) return;

    // Update count
    if (domCache.cartCount) {
      domCache.cartCount.textContent = cartState.item_count;
    }

    // Render items or empty state
    if (cartState.items.length === 0) {
      domCache.content.innerHTML = renderEmptyState();
      domCache.footer.style.display = 'none';
    } else {
      domCache.content.innerHTML = renderCartItems();
      domCache.footer.style.display = 'block';
      renderTotals();
      renderBanners();
      renderUpsells();
      renderCouponSection();
    }
  }

  // Render empty state
  function renderEmptyState() {
    return `
      <div class="cart-drawer-empty">
        <svg class="cart-drawer-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="9" cy="21" r="1"></circle>
          <circle cx="20" cy="21" r="1"></circle>
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
        </svg>
        <p class="cart-drawer-empty-text">Your cart is empty</p>
        <button class="cart-drawer-checkout-btn" onclick="CartDrawer.close()">Continue Shopping</button>
      </div>
    `;
  }

  // Render cart items
  function renderCartItems() {
    return `
      <div class="cart-drawer-items">
        ${cartState.items.map((item, index) => renderCartItem(item, index)).join('')}
      </div>
    `;
  }

  // Render single cart item
  function renderCartItem(item, index) {
    const line = index + 1;
    const isGift = item.properties?._gift === 'true';
    const isLocked = item.properties?._locked === 'true';

    return `
      <div class="cart-drawer-item ${isGift ? 'is-gift' : ''} ${isLocked ? 'locked' : ''}" data-line="${line}">
        <div class="cart-drawer-item-image">
          <img src="${item.image || '/no-image.jpg'}" alt="${escapeHtml(item.product_title)}" loading="lazy">
        </div>
        <div class="cart-drawer-item-details">
          <h3 class="cart-drawer-item-title">${escapeHtml(item.product_title)}</h3>
          ${item.variant_title ? `<p class="cart-drawer-item-variant">${escapeHtml(item.variant_title)}</p>` : ''}
          ${isGift ? '<span class="cart-drawer-gift-badge">🎁 Free Gift</span>' : ''}
          <span class="cart-drawer-item-price">
            ${formatMoney(item.final_line_price)}
            ${item.original_line_price > item.final_line_price ? `<span class="cart-drawer-item-original-price">${formatMoney(item.original_line_price)}</span>` : ''}
          </span>
        </div>
        <div class="cart-drawer-item-actions">
          ${!isLocked ? `
            <div class="cart-drawer-quantity">
              <button data-action="decrease" data-line="${line}" data-qty="${item.quantity}">−</button>
              <input type="number" class="qty-input" value="${item.quantity}" min="1" data-line="${line}">
              <button data-action="increase" data-line="${line}" data-qty="${item.quantity}">+</button>
            </div>
            <button class="cart-drawer-remove" data-action="remove" data-line="${line}">Remove</button>
          ` : '<span class="cart-drawer-gift-badge">Free Gift</span>'}
        </div>
      </div>
    `;
  }

  // Render totals
  function renderTotals() {
    const totalsHtml = `
      <div class="cart-drawer-subtotal">
        <span class="cart-drawer-subtotal-label">Subtotal</span>
        <span class="cart-drawer-subtotal-value">${formatMoney(cartState.total_price)}</span>
      </div>
      ${cartState.total_discount > 0 ? `
        <div class="cart-drawer-discount">
          <span>Discount</span>
          <span>-${formatMoney(cartState.total_discount)}</span>
        </div>
      ` : ''}
      <p class="cart-drawer-shipping-note">Shipping & taxes calculated at checkout</p>
    `;

    const totalsContainer = domCache.footer.querySelector('.cart-drawer-totals');
    if (totalsContainer) {
      totalsContainer.innerHTML = totalsHtml;
    }

    // Enable checkout button
    if (domCache.checkoutBtn) {
      domCache.checkoutBtn.disabled = cartState.items.length === 0;
    }
  }

  // Render banners
  function renderBanners() {
    // This will be populated by API call
    fetchBanners().then(banners => {
      if (!banners || banners.length === 0) {
        domCache.banners.innerHTML = '';
        return;
      }

      const cartValue = cartState.total_price / 100;

      domCache.banners.innerHTML = banners.map(banner => {
        let content = banner.content;

        // Replace progress placeholder
        if (banner.displayType === 'cart_value_progress' && banner.targetValue) {
          const remaining = Math.max(0, banner.targetValue - cartValue);
          const progress = Math.min(100, (cartValue / banner.targetValue) * 100);
          content = content.replace('{{remaining}}', formatMoney(remaining * 100));

          return `
            <div class="cart-drawer-banner" style="background-color: ${banner.bgColor}; color: ${banner.textColor};">
              <span class="cart-drawer-banner-icon">${banner.icon || '📦'}</span>
              <div style="flex: 1;">
                <div>${content}</div>
                <div class="cart-drawer-progress-bar">
                  <div class="cart-drawer-progress-fill" style="width: ${progress}%"></div>
                </div>
              </div>
            </div>
          `;
        }

        return `
          <div class="cart-drawer-banner" style="background-color: ${banner.bgColor}; color: ${banner.textColor};">
            <span class="cart-drawer-banner-icon">${banner.icon || '🎁'}</span>
            <span>${content}</span>
          </div>
        `;
      }).join('');
    });
  }

  // Render upsells
  function renderUpsells() {
    if (!settings?.showRecommendations) {
      domCache.upsells.innerHTML = '';
      return;
    }

    // Fetch upsell recommendations
    fetchUpsells().then(upsells => {
      if (!upsells || upsells.length === 0) {
        domCache.upsells.innerHTML = '';
        return;
      }

      const upsellsToShow = upsells.slice(0, settings.maxRecommendations || 3);

      domCache.upsells.innerHTML = `
        <h4 class="cart-drawer-upsells-title">You may also like</h4>
        <div class="cart-drawer-upsell-grid">
          ${upsellsToShow.map(product => renderUpsellCard(product)).join('')}
        </div>
      `;
    });
  }

  // Render upsell card
  function renderUpsellCard(product) {
    const hasDiscount = product.discountPercent > 0;
    const discountedPrice = hasDiscount
      ? product.price * (1 - product.discountPercent / 100)
      : product.price;

    return `
      <div class="cart-drawer-upsell-card" data-variant-id="${product.variantId}" data-discount="${product.discountPercent || 0}">
        <img class="cart-drawer-upsell-image" src="${product.image}" alt="${escapeHtml(product.title)}" loading="lazy">
        <h5 class="cart-drawer-upsell-title">${escapeHtml(product.title)}</h5>
        <div class="cart-drawer-upsell-price">
          <span class="cart-drawer-upsell-current">${formatMoney(discountedPrice)}</span>
          ${hasDiscount ? `<span class="cart-drawer-upsell-original">${formatMoney(product.price)}</span>` : ''}
          ${hasDiscount ? `<span class="cart-drawer-upsell-discount">-${product.discountPercent}%</span>` : ''}
        </div>
      </div>
    `;
  }

  // Render coupon section
  function renderCouponSection() {
    if (!settings?.enableCoupons) return;

    const hasCoupon = cartState.cart_level_discount_applications?.length > 0;
    const couponSection = document.createElement('div');
    couponSection.className = 'cart-drawer-coupon';

    if (hasCoupon) {
      const coupon = cartState.cart_level_discount_applications[0];
      couponSection.innerHTML = `
        <div class="cart-drawer-coupon-applied">
          <span class="cart-drawer-coupon-code">🏷️ ${coupon.title}</span>
          <button class="cart-drawer-coupon-remove" data-action="remove-coupon">Remove</button>
        </div>
      `;
    } else {
      couponSection.innerHTML = `
        <div class="cart-drawer-coupon-toggle">
          <span>Have a promo code?</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>
        <form class="cart-drawer-coupon-form" style="display: none;">
          <input type="text" name="coupon" placeholder="Enter code" autocomplete="off">
          <button type="submit">Apply</button>
        </form>
      `;
    }

    // Insert before footer or after items
    const existingCoupon = containerEl.querySelector('.cart-drawer-coupon');
    if (existingCoupon) {
      existingCoupon.replaceWith(couponSection);
    } else {
      domCache.footer.before(couponSection);
    }
  }

  // Handle add to cart
  async function handleAddToCart(form) {
    const formData = new FormData(form);
    const data = {};

    formData.forEach((value, key) => {
      if (key.includes('[')) {
        const matches = key.match(/(.+)\[(.+)\]/);
        if (matches) {
          data[matches[1]] = data[matches[1]] || {};
          data[matches[1]][matches[2]] = value;
        }
      } else {
        data[key] = value;
      }
    });

    try {
      showLoading();

      const response = await fetch('/cart/add.js', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.description || 'Failed to add item');
      }

      // Refresh and open
      await refreshCart();
      openDrawer();

      // Dispatch event for other scripts
      document.dispatchEvent(new CustomEvent('product:added', {
        detail: { product: data }
      }));

    } catch (error) {
      alert(error.message || 'Failed to add item to cart');
    } finally {
      hideLoading();
    }
  }

  // Update quantity
  async function updateQuantity(line, quantity) {
    try {
      showLoading();

      const response = await fetch('/cart/change.js', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ line, quantity }),
      });

      if (!response.ok) throw new Error('Failed to update cart');

      cartState = await response.json();
      renderCart();

      document.dispatchEvent(new CustomEvent('cart:updated', {
        detail: { cart: cartState }
      }));

    } catch (error) {
      console.error('Update error:', error);
    } finally {
      hideLoading();
    }
  }

  // Add upsell to cart
  async function addUpsellToCart(variantId, discount) {
    try {
      showLoading();

      const properties = {};
      if (discount > 0) {
        properties._discount = `${discount}%`;
      }

      const response = await fetch('/cart/add.js', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: [{
            id: variantId,
            quantity: 1,
            properties
          }]
        }),
      });

      if (!response.ok) throw new Error('Failed to add upsell');

      await refreshCart();

    } catch (error) {
      console.error('Upsell error:', error);
    } finally {
      hideLoading();
    }
  }

  // Apply coupon
  async function applyCoupon(code) {
    try {
      showLoading();

      const response = await fetch('/discount/' + code, {
        method: 'POST',
        credentials: 'same-origin',
      });

      // Shopify redirects on coupon apply, so we check cart
      await refreshCart();

    } catch (error) {
      console.error('Coupon error:', error);
    } finally {
      hideLoading();
    }
  }

  // Remove coupon
  async function removeCoupon() {
    try {
      showLoading();

      // Clear discount by going to checkout and back (Shopify limitation)
      await fetch('/checkout?discount=REMOVE', {
        credentials: 'same-origin',
      });

      await refreshCart();

    } catch (error) {
      console.error('Remove coupon error:', error);
    } finally {
      hideLoading();
    }
  }

  // Handle checkout
  function handleCheckout() {
    if (!cartState || cartState.items.length === 0) return;

    // Redirect to checkout
    window.location.href = '/checkout';
  }

  // Fetch banners
  async function fetchBanners() {
    try {
      const response = await fetch(`/apps/cart-drawer/api/banners?shop=${CONFIG.shopDomain}`, {
        credentials: 'same-origin',
      });
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Banners fetch error:', error);
    }
    return [];
  }

  // Fetch upsells
  async function fetchUpsells() {
    try {
      const productIds = cartState.items.map(item => item.product_id).join(',');
      const response = await fetch(
        `/apps/cart-drawer/api/upsells?shop=${CONFIG.shopDomain}&products=${productIds}&cartValue=${cartState.total_price}`,
        { credentials: 'same-origin' }
      );
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Upsells fetch error:', error);
    }
    return [];
  }

  // Utility: Format money
  function formatMoney(cents) {
    const amount = cents / 100;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: CONFIG.currency,
    }).format(amount);
  }

  // Utility: Escape HTML
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Utility: Adjust brightness
  function adjustBrightness(hex, percent) {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max(0, Math.min(255, (num >> 16) + amt));
    const G = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amt));
    const B = Math.max(0, Math.min(255, (num & 0x0000FF) + amt));
    return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
  }

  // Show loading
  function showLoading() {
    domCache.checkoutBtn?.classList.add('loading');
  }

  // Hide loading
  function hideLoading() {
    domCache.checkoutBtn?.classList.remove('loading');
  }

  // Render error
  function renderError(message) {
    domCache.content.innerHTML = `
      <div class="cart-drawer-empty">
        <p class="cart-drawer-empty-text">${message}</p>
        <button class="cart-drawer-checkout-btn" onclick="location.reload()">Retry</button>
      </div>
    `;
  }

  // Expose public API
  window.CartDrawer = {
    open: openDrawer,
    close: closeDrawer,
    refresh: refreshCart,
    getCart: () => cartState,
    isOpen: () => isOpen,
  };

  // Auto-init
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
