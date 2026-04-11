import React, { useEffect, useMemo, useState } from 'react';
import '../styles/checkout.css';

function getCart() {
  const raw = localStorage.getItem('mf_cart');
  return raw ? JSON.parse(raw) : [];
}

function getStoredAuth() {
  const raw = localStorage.getItem('mf_auth');
  return raw ? JSON.parse(raw) : null;
}

function getTotal(cart) {
  return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

export default function App({ apiBaseUrl }) {
  const [cart, setCart] = useState(getCart());
  const [message, setMessage] = useState('');
  const [placingOrder, setPlacingOrder] = useState(false);

  useEffect(() => {
    const syncCart = () => setCart(getCart());
    window.addEventListener('mf-cart-changed', syncCart);
    return () => window.removeEventListener('mf-cart-changed', syncCart);
  }, []);

  const total = useMemo(() => getTotal(cart), [cart]);

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
            {cart.map((item) => (
              <article key={item.productId} className='checkout-item'>
                <div className='checkout-item__name'>{item.name}</div>
                <div className='checkout-item__meta'>
                  {item.quantity} × ₹{item.price}
                </div>
                <div className='checkout-item__price'>
                  ₹{item.quantity * item.price}
                </div>
              </article>
            ))}
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

        {message ? (
          <div className='message message-error'>{message}</div>
        ) : null}

        <button
          type='button'
          className='btn btn-primary checkout-place-order'
          onClick={placeOrder}
          disabled={placingOrder || !cart.length}
        >
          {placingOrder ? 'Processing...' : 'Place Order'}
        </button>
      </aside>
    </section>
  );
}
