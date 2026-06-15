// Taste of Lahore E-Commerce JS Engine

document.addEventListener('DOMContentLoaded', () => {
    // App State
    let menuItems = [];
    let cart = [];
    let currentCategory = 'all';

    // DOM Elements
    const menuContainer = document.getElementById('menu-container');
    const filterTabs = document.querySelectorAll('.filter-tab');
    const cartItemsContainer = document.getElementById('cart-items-container');
    const cartSummary = document.getElementById('cart-summary');
    const cartSubtotalSpan = document.getElementById('cart-subtotal');
    const cartDeliverySpan = document.getElementById('cart-delivery');
    const cartTotalSpan = document.getElementById('cart-total');
    
    // Form Elements
    const orderForm = document.getElementById('order-form');
    const custNameInput = document.getElementById('cust-name');
    const custPhoneInput = document.getElementById('cust-phone');
    const custAddressInput = document.getElementById('cust-address');
    const deliveryDateInput = document.getElementById('delivery-date');
    const deliveryTimeSelect = document.getElementById('delivery-time');
    const spiceLevelSelect = document.getElementById('spice-level');
    const specialInstructionsInput = document.getElementById('special-instructions');
    const btnSubmitOrder = document.getElementById('btn-submit-order');

    const DELIVERY_FEE = 150;
    const CHEF_WHATSAPP_NUMBER = '923001234567'; // Customize with actual cook's mobile number

    // Set Date input to tomorrow's date minimum (24h pre-order requirement)
    function initializeDatePicker() {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const yyyy = tomorrow.getFullYear();
        const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
        const dd = String(tomorrow.getDate()).padStart(2, '0');
        
        deliveryDateInput.min = `${yyyy}-${mm}-${dd}`;
        deliveryDateInput.value = `${yyyy}-${mm}-${dd}`;
    }

    // Fetch Menu items from Flask API
    async function fetchMenu() {
        try {
            const response = await fetch('/api/menu');
            const data = await response.json();
            
            if (data.success) {
                menuItems = data.menu;
                renderMenu();
            } else {
                renderMenuError('Failed to parse signature menu data.');
            }
        } catch (error) {
            console.error('Menu load error:', error);
            renderMenuError('Unable to connect to Lahore kitchen backend.');
        }
    }

    function renderMenuError(msg) {
        menuContainer.innerHTML = `
            <div class="menu-loading">
                <i class="fa-solid fa-triangle-exclamation" style="font-size: 2.5rem; color: var(--primary-spice);"></i>
                <p style="margin-top: 1rem;">${msg}</p>
            </div>
        `;
    }

    // Render Menu Items
    function renderMenu() {
        // Filter menu
        const filtered = menuItems.filter(item => {
            return currentCategory === 'all' || item.category === currentCategory;
        });

        if (filtered.length === 0) {
            menuContainer.innerHTML = `
                <div class="menu-loading">
                    <i class="fa-solid fa-carrot" style="font-size: 2rem;"></i>
                    <p style="margin-top: 1rem;">No items currently available in this category.</p>
                </div>
            `;
            return;
        }

        let html = '';
        filtered.forEach(item => {
            // Find if item is in card quantity cache
            html += `
                <div class="food-card" data-id="${item.id}">
                    <div class="food-card-img-wrapper">
                        <img src="${item.image}" alt="${item.name}" class="food-card-img">
                        <span class="food-card-price-tag">Rs. ${item.price}</span>
                    </div>
                    <div class="food-card-content">
                        <h3 class="food-card-title">${item.name}</h3>
                        <p class="food-card-desc">${item.description}</p>
                        
                        <div class="food-card-action">
                            <div class="qty-control">
                                <button class="qty-btn btn-minus" data-id="${item.id}">-</button>
                                <span class="qty-val" id="qty-val-${item.id}">1</span>
                                <button class="qty-btn btn-plus" data-id="${item.id}">+</button>
                            </div>
                            <button class="btn-add-card" data-id="${item.id}">
                                <i class="fa-solid fa-cart-plus"></i> Add to Cart
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });

        menuContainer.innerHTML = html;

        // Bind Card Event Listeners
        document.querySelectorAll('.btn-plus').forEach(btn => {
            btn.addEventListener('click', () => adjustCardQuantity(btn.getAttribute('data-id'), 1));
        });

        document.querySelectorAll('.btn-minus').forEach(btn => {
            btn.addEventListener('click', () => adjustCardQuantity(btn.getAttribute('data-id'), -1));
        });

        document.querySelectorAll('.btn-add-card').forEach(btn => {
            btn.addEventListener('click', () => {
                const itemId = btn.getAttribute('data-id');
                const qtyValSpan = document.getElementById(`qty-val-${itemId}`);
                const qty = parseInt(qtyValSpan.textContent);
                addToCart(itemId, qty);
                
                // Reset card counter back to 1
                qtyValSpan.textContent = 1;
            });
        });
    }

    // Adjust card quantity before adding to cart
    function adjustCardQuantity(itemId, step) {
        const qtyValSpan = document.getElementById(`qty-val-${itemId}`);
        let currentQty = parseInt(qtyValSpan.textContent);
        currentQty += step;
        if (currentQty < 1) currentQty = 1;
        if (currentQty > 10) currentQty = 10; // Sensible max quantity per item
        qtyValSpan.textContent = currentQty;
    }

    // Add item to Cart
    function addToCart(itemId, qty) {
        const item = menuItems.find(i => i.id === itemId);
        if (!item) return;

        const cartIndex = cart.findIndex(c => c.item.id === itemId);
        if (cartIndex > -1) {
            cart[cartIndex].quantity += qty;
        } else {
            cart.push({
                item: item,
                quantity: qty
            });
        }
        renderCart();
    }

    // Adjust item quantity directly in the cart
    function adjustCartItemQty(itemId, step) {
        const cartIndex = cart.findIndex(c => c.item.id === itemId);
        if (cartIndex === -1) return;

        cart[cartIndex].quantity += step;
        if (cart[cartIndex].quantity <= 0) {
            cart.splice(cartIndex, 1);
        }
        renderCart();
    }

    // Remove item from cart completely
    function removeCartItem(itemId) {
        const cartIndex = cart.findIndex(c => c.item.id === itemId);
        if (cartIndex > -1) {
            cart.splice(cartIndex, 1);
            renderCart();
        }
    }

    // Render Cart Details
    function renderCart() {
        if (cart.length === 0) {
            cartItemsContainer.innerHTML = `
                <div class="cart-empty">
                    <i class="fa-solid fa-kitchen-set empty-cart-icon"></i>
                    <p>Your cart is empty.</p>
                    <span>Browse our menu above and add dishes to start cooking your order!</span>
                </div>
            `;
            cartSummary.classList.add('hidden');
            btnSubmitOrder.disabled = true;
            return;
        }

        cartSummary.classList.remove('hidden');
        btnSubmitOrder.disabled = false;

        let html = '';
        let subtotal = 0;

        cart.forEach(cartItem => {
            const itemTotal = cartItem.item.price * cartItem.quantity;
            subtotal += itemTotal;

            html += `
                <div class="cart-item">
                    <div class="cart-item-info">
                        <div class="cart-item-name">${cartItem.item.name}</div>
                        <div class="cart-item-price">Rs. ${cartItem.item.price} each</div>
                    </div>
                    <div class="cart-item-controls">
                        <div class="qty-control">
                            <button class="qty-btn btn-cart-minus" data-id="${cartItem.item.id}">-</button>
                            <span class="qty-val">${cartItem.quantity}</span>
                            <button class="qty-btn btn-cart-plus" data-id="${cartItem.item.id}">+</button>
                        </div>
                        <button class="btn-cart-remove" data-id="${cartItem.item.id}" title="Remove Item">
                            <i class="fa-regular fa-trash-can"></i>
                        </button>
                    </div>
                </div>
            `;
        });

        cartItemsContainer.innerHTML = html;

        // Update Financials
        const total = subtotal + DELIVERY_FEE;
        cartSubtotalSpan.textContent = `Rs. ${subtotal}`;
        cartTotalSpan.textContent = `Rs. ${total}`;

        // Bind Cart Controls
        document.querySelectorAll('.btn-cart-plus').forEach(btn => {
            btn.addEventListener('click', () => adjustCartItemQty(btn.getAttribute('data-id'), 1));
        });

        document.querySelectorAll('.btn-cart-minus').forEach(btn => {
            btn.addEventListener('click', () => adjustCartItemQty(btn.getAttribute('data-id'), -1));
        });

        document.querySelectorAll('.btn-cart-remove').forEach(btn => {
            btn.addEventListener('click', () => removeCartItem(btn.getAttribute('data-id')));
        });
    }

    // Handle Order Submission & WhatsApp generation
    orderForm.addEventListener('submit', (e) => {
        e.preventDefault();

        if (cart.length === 0) return;

        // Collect Form details
        const name = custNameInput.value.trim();
        const phone = custPhoneInput.value.trim();
        const address = custAddressInput.value.trim();
        const date = deliveryDateInput.value;
        const time = deliveryTimeSelect.value;
        const spice = spiceLevelSelect.value;
        const notes = specialInstructionsInput.value.trim();

        // Calculate pricing
        let subtotal = 0;
        let itemsListText = '';
        
        cart.forEach(cartItem => {
            const linePrice = cartItem.item.price * cartItem.quantity;
            subtotal += linePrice;
            itemsListText += `• ${cartItem.quantity}x ${cartItem.item.name} (Rs. ${cartItem.item.price} each)\n`;
        });
        
        const total = subtotal + DELIVERY_FEE;

        // Format date beautifully
        const formattedDate = new Date(date).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });

        // Construct message
        let waMessage = `*Taste of Lahore - New Order Request* 🍽️\n`;
        waMessage += `----------------------------------------------\n\n`;
        waMessage += `*👤 Customer Profile:*\n`;
        waMessage += `• *Name:* ${name}\n`;
        waMessage += `• *Phone:* ${phone}\n`;
        waMessage += `• *Delivery Address:* ${address}\n\n`;
        
        waMessage += `*📅 Dispatch Slot:*\n`;
        waMessage += `• *Date:* ${formattedDate}\n`;
        waMessage += `• *Time Window:* ${time}\n`;
        waMessage += `• *Preferred Heat Level:* ${spice}\n\n`;

        waMessage += `*🥘 Order Summary:*\n`;
        waMessage += itemsListText;
        waMessage += `\n`;

        waMessage += `*💳 Invoice Details:*\n`;
        waMessage += `• *Subtotal:* Rs. ${subtotal}\n`;
        waMessage += `• *Delivery Fee:* Rs. ${DELIVERY_FEE}\n`;
        waMessage += `• *Total Payable:* *Rs. ${total}*\n\n`;

        if (notes) {
            waMessage += `*✏️ Chef Notes:*\n`;
            waMessage += `"${notes}"\n\n`;
        }

        waMessage += `----------------------------------------------\n`;
        waMessage += `Thank you! Please confirm availability and cooking slot.`;

        // Encode and dispatch WhatsApp window
        const waUrl = `https://wa.me/${CHEF_WHATSAPP_NUMBER}?text=${encodeURIComponent(waMessage)}`;
        window.open(waUrl, '_blank', 'noopener,noreferrer');
    });

    // Menu category filter click handlers
    filterTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            filterTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            currentCategory = tab.getAttribute('data-category');
            renderMenu();
        });
    });

    // Run Initialisations
    initializeDatePicker();
    fetchMenu();
});
