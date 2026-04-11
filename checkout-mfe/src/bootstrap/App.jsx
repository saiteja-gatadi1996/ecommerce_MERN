import React, { useEffect, useMemo, useState } from 'react';
import '../styles/checkout.css';

function getCart() {
  const raw = localStorage.getItem('mf_cart');
  return raw ? JSON.parse(raw) : [];
}

function setCart(cart) {
  localStorage.setItem('mf_cart', JSON.stringify(cart));
  localStorage.setItem(
    'mf_cart_count',
    String(cart.reduce((sum, item) => sum + item.quantity, 0))
  );
  window.dispatchEvent(new Event('mf-cart-changed'));
}

function getStoredAuth() {
  const raw = localStorage.getItem('mf_auth');
  return raw ? JSON.parse(raw) : null;
}

function getTotal(cart) {
  return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

export default function App({ apiBaseUrl }) {
  const [cart, setCartState] = useState(getCart());
  const [productsMap, setProductsMap] = useState({});
  const [message, setMessage] = useState('');
  const [placingOrder, setPlacingOrder] = useState(false);
  const [loadingStock, setLoadingStock] = useState(true);

  useEffect(() => {
    const syncCart = () => setCartState(getCart());
    window.addEventListener('mf-cart-changed', syncCart);
    return () => window.removeEventListener('mf-cart-changed', syncCart);
  }, []);

  useEffect(() => {
    let active = true;

    async function loadProducts() {
      try {
        setLoadingStock(true);
        const response = await fetch(`${apiBaseUrl}/api/products`);
        const data = await response.json();

        if (!active || !Array.isArray(data)) return;

        const map = {};
        data.forEach((product) => {
          map[product._id] = product;
        });

        setProductsMap(map);
      } finally {
        if (active) {
          setLoadingStock(false);
        }
      }
    }

    loadProducts();

    return () => {
      active = false;
    };
  }, [apiBaseUrl]);

  const enrichedCart = useMemo(() => {
    return cart.map((item) => {
      const product = productsMap[item.productId];
      return {
        ...item,
        stock: product?.stock ?? null,
        image: product?.image || '',
        title: product?.title || item.name,
      };
    });
  }, [cart, productsMap]);

  const total = useMemo(() => getTotal(cart), [cart]);

  function updateQuantity(productId, nextQty) {
    const nextCart = getCart()
      .map((item) => {
        if (item.productId !== productId) return item;

        const availableStock = productsMap[productId]?.stock ?? item.quantity;
        const safeQty = Math.max(1, Math.min(nextQty, availableStock || 1));

        return {
          ...item,
          quantity: safeQty,
        };
      })
      .filter((item) => item.quantity > 0);

    setCart(nextCart);
    setCartState(nextCart);
  }

  function removeItem(productId) {
    const nextCart = getCart().filter((item) => item.productId !== productId);
    setCart(nextCart);
    setCartState(nextCart);
  }

  function validateCart() {
    for (const item of enrichedCart) {
      if (item.stock === 0) {
        return `Product "${item.title}" is out of stock.`;
      }

      if (item.stock !== null && item.quantity > item.stock) {
        return `Only ${item.stock} item(s) available for ${item.title}.`;
      }
    }

    return '';
  }

  async function placeOrder() {
    const auth = getStoredAuth();

    if (!auth?.token) {
      setMessage('Please login to continue.');
      return;
    }

    if (!cart.length) {
      setMessage('Cart is empty.');
      return;
    }

    const validationError = validateCart();
    if (validationError) {
      setMessage(validationError);
      return;
    }

    setMessage('');
    setPlacingOrder(true);

    try {
      const response = await fetch(`${apiBaseUrl}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify({
          items: cart,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data?.message || 'Unable to place order.');
        return;
      }

      localStorage.removeItem('mf_cart');
      localStorage.setItem('mf_cart_count', '0');
      window.dispatchEvent(new Event('mf-cart-changed'));
      window.location.href = '/orders';
    } catch (error) {
      setMessage('Unable to place order.');
    } finally {
      setPlacingOrder(false);
    }
  }

  return (
    <section className='checkout-layout'>
      <div className='checkout-left page-card'>
        <h1 className='page-title'>Checkout</h1>
        <p className='page-subtitle'>Review your cart and place the order.</p>

        {!cart.length ? (
          <p>Your cart is empty.</p>
        ) : (
          <div className='checkout-items'>
            {enrichedCart.map((item) => {
              const isOutOfStock = item.stock === 0;
              const hasLowStock =
                item.stock !== null && item.stock > 0 && item.stock <= 3;

              return (
                <article key={item.productId} className='checkout-item'>
                  <div className='checkout-item__info'>
                    <div className='checkout-item__name'>{item.title}</div>

                    <div className='checkout-item__stock'>
                      {isOutOfStock ? (
                        <span className='stock-badge stock-badge--out'>
                          Out of stock
                        </span>
                      ) : hasLowStock ? (
                        <span className='stock-badge stock-badge--low'>
                          Only {item.stock} left
                        </span>
                      ) : (
                        <span className='stock-badge stock-badge--in'>
                          In stock
                        </span>
                      )}
                    </div>

                    <div className='checkout-item__meta'>₹{item.price}</div>
                  </div>

                  <div className='checkout-item__controls'>
                    <button
                      type='button'
                      className='qty-btn'
                      onClick={() =>
                        updateQuantity(item.productId, item.quantity - 1)
                      }
                    >
                      -
                    </button>
                    <span className='qty-value'>{item.quantity}</span>
                    <button
                      type='button'
                      className='qty-btn'
                      onClick={() =>
                        updateQuantity(item.productId, item.quantity + 1)
                      }
                      disabled={
                        item.stock !== null && item.quantity >= item.stock
                      }
                    >
                      +
                    </button>
                  </div>

                  <div className='checkout-item__price'>
                    ₹{item.quantity * item.price}
                  </div>

                  <button
                    type='button'
                    className='checkout-item__remove'
                    onClick={() => removeItem(item.productId)}
                  >
                    Remove
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </div>

      <aside className='checkout-right page-card'>
        <h2 className='checkout-summary__title'>Price Details</h2>

        <div className='checkout-summary__row'>
          <span>Total Items</span>
          <span>{cart.reduce((sum, item) => sum + item.quantity, 0)}</span>
        </div>

        <div className='checkout-summary__row'>
          <span>Total Amount</span>
          <span>₹{total}</span>
        </div>

        <div className='checkout-summary__divider' />

        <div className='checkout-summary__row checkout-summary__row--highlight'>
          <span>Payable</span>
          <span>₹{total}</span>
        </div>

        {loadingStock ? (
          <div className='checkout-note'>Checking latest stock...</div>
        ) : null}

        {message ? (
          <div className='message message-error'>{message}</div>
        ) : null}

        <button
          type='button'
          className='btn btn-primary checkout-place-order'
          onClick={placeOrder}
          disabled={placingOrder || !cart.length || loadingStock}
        >
          {placingOrder ? 'Processing...' : 'Place Order'}
        </button>
      </aside>
    </section>
  );
}
