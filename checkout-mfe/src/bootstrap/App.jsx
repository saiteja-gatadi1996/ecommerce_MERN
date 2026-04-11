import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authHeaders, getStoredAuth, request } from '../lib/api';

function readCart() {
  try { return JSON.parse(localStorage.getItem('mf_cart') || '[]'); }
  catch (error) { return []; }
}

function writeCart(cart) {
  localStorage.setItem('mf_cart', JSON.stringify(cart));
  localStorage.setItem('mf_cart_count', String(cart.reduce((sum, item) => sum + item.quantity, 0)));
}

export default function App() {
  const navigate = useNavigate();
  const [cart, setCart] = useState(readCart());
  const [paymentMethod, setPaymentMethod] = useState('mock-card');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const totalAmount = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.quantity, 0), [cart]);

  function updateQuantity(productId, nextQuantity) {
    const next = cart.map((item) => (item.productId === productId ? { ...item, quantity: Math.max(1, nextQuantity) } : item));
    setCart(next);
    writeCart(next);
  }

  async function checkout() {
    const auth = getStoredAuth();
    if (!auth?.token) {
      setMessage('Please login before checkout.');
      navigate('/login');
      return;
    }
    if (!cart.length) {
      setMessage('Your cart is empty.');
      return;
    }
    setLoading(true);
    setMessage('');
    try {
      const payload = { items: cart.map((item) => ({ productId: item.productId, quantity: item.quantity })), paymentMethod };
      await request('/api/orders', { method: 'POST', headers: { ...authHeaders() }, body: JSON.stringify(payload) });
      writeCart([]);
      setCart([]);
      setMessage('Order created. Redirecting to orders...');
      setTimeout(() => navigate('/orders'), 800);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="stack">
      <section className="card" style={{ padding: 24 }}>
        <h2 style={{ marginTop: 0 }}>Cart summary</h2>
        {!cart.length && <p style={{ color: 'var(--muted)' }}>Add products from the catalog before checkout.</p>}
        <div className="stack">
          {cart.map((item) => (
            <article key={item.productId} className="card" style={{ padding: 16, background: 'rgba(2,6,23,0.6)', borderRadius: 14 }}>
              <div className="inline" style={{ justifyContent: 'space-between' }}>
                <strong>{item.title}</strong>
                <span>₹{item.price * item.quantity}</span>
              </div>
              <div className="inline">
                <button className="btn secondary" onClick={() => updateQuantity(item.productId, item.quantity - 1)}>-</button>
                <span>Qty: {item.quantity}</span>
                <button className="btn secondary" onClick={() => updateQuantity(item.productId, item.quantity + 1)}>+</button>
              </div>
            </article>
          ))}
        </div>
      </section>
      <section className="card" style={{ padding: 24 }}>
        <h2 style={{ marginTop: 0 }}>Payment</h2>
        <div className="form-grid">
          <select className="select" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
            <option value="mock-card">Mock Card</option>
            <option value="mock-upi">Mock UPI</option>
            <option value="mock-wallet">Mock Wallet</option>
          </select>
          <div className="inline" style={{ justifyContent: 'space-between' }}>
            <strong>Total</strong>
            <strong>₹{totalAmount}</strong>
          </div>
          {message && <div className={message.includes('created') ? 'message success' : 'message error'}>{message}</div>}
          <button className="btn success" disabled={loading || !cart.length} onClick={checkout}>{loading ? 'Creating order...' : 'Place order'}</button>
        </div>
      </section>
    </div>
  );
}
