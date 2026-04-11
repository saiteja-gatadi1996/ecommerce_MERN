import React, { useEffect, useState } from 'react';
import { authHeaders, request } from '../lib/api';

export default function App() {
  const [orders, setOrders] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const data = await request('/api/orders', { headers: { ...authHeaders() } });
        if (active) {
          setOrders(data);
          setMessage('');
        }
      } catch (error) {
        if (active) setMessage(error.message);
      }
    }

    load();
    const id = window.setInterval(load, 3500);
    return () => {
      active = false;
      window.clearInterval(id);
    };
  }, []);

  return (
    <div className="stack">
      <p className="section-subtitle">This page auto-refreshes so you can see the async payment → order → inventory flow.</p>
      {message && <div className="message error">{message}</div>}
      <div className="stack">
        {orders.map((order) => (
          <section key={order._id} className="card" style={{ padding: 24 }}>
            <div className="inline" style={{ justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ margin: 0 }}>Order #{String(order._id).slice(-6)}</h3>
                <p style={{ color: 'var(--muted)' }}>Status: {order.status}</p>
              </div>
              <strong style={{ fontSize: 20 }}>₹{order.totalAmount}</strong>
            </div>
            <div className="stack">
              {order.items?.map((item) => (
                <article key={item.productId} className="inline" style={{ justifyContent: 'space-between' }}>
                  <span>{item.title || item.productName || item.productId}</span>
                  <span>{item.quantity} × ₹{item.price}</span>
                </article>
              ))}
            </div>
          </section>
        ))}
        {!orders.length && !message && <div className="card" style={{ padding: 24 }}>No orders yet.</div>}
      </div>
    </div>
  );
}
