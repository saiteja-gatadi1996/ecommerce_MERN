import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { request } from '../lib/api';

function saveCart(cart) {
  localStorage.setItem('mf_cart', JSON.stringify(cart));
  localStorage.setItem('mf_cart_count', String(cart.reduce((sum, item) => sum + item.quantity, 0)));
  window.dispatchEvent(new Event('storage'));
}

function getCart() {
  try { return JSON.parse(localStorage.getItem('mf_cart') || '[]'); }
  catch (error) { return []; }
}

function addToCart(product) {
  const current = getCart();
  const existing = current.find((item) => item.productId === product._id);
  if (existing) existing.quantity += 1;
  else current.push({ productId: product._id, title: product.title, price: product.price, quantity: 1 });
  saveCart([...current]);
}

function ProductCard({ product }) {
  return (
    <article className="card" style={{ padding: 18, display: 'grid', gap: 12 }}>
      <div>
        <h3 style={{ margin: '0 0 8px' }}>{product.title}</h3>
        <div style={{ color: 'var(--muted)', minHeight: 48 }}>{product.description}</div>
      </div>
      <div className="inline" style={{ justifyContent: 'space-between' }}>
        <strong>₹{product.price}</strong>
        <span style={{ color: 'var(--muted)' }}>Stock: {product.stock}</span>
      </div>
      <div className="inline">
        <Link className="btn secondary" to={`/products/${product._id}`}>Details</Link>
        <button className="btn" onClick={() => addToCart(product)}>Add to cart</button>
      </div>
    </article>
  );
}

function ListView() {
  const [products, setProducts] = useState([]);
  const [message, setMessage] = useState('');
  useEffect(() => { request('/api/products').then(setProducts).catch((error) => setMessage(error.message)); }, []);
  return (
    <div className="stack">
      {message && <div className="message error">{message}</div>}
      <div className="inline" style={{ justifyContent: 'space-between' }}>
        <p className="section-subtitle" style={{ margin: 0 }}>Browse products from the product-service through the gateway.</p>
        <button className="btn secondary" onClick={async () => { await request('/api/products/seed', { method: 'POST' }); const data = await request('/api/products'); setProducts(data); }}>Seed products</button>
      </div>
      <div className="tile-grid">{products.map((product) => <ProductCard key={product._id} product={product} />)}</div>
    </div>
  );
}

function DetailView() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [message, setMessage] = useState('');
  useEffect(() => { request(`/api/products/${id}`).then(setProduct).catch((error) => setMessage(error.message)); }, [id]);
  const content = useMemo(() => {
    if (message) return <div className="message error">{message}</div>;
    if (!product) return <div className="card" style={{ padding: 24 }}>Loading product...</div>;
    return (
      <section className="card" style={{ padding: 24, display: 'grid', gap: 18 }}>
        <div>
          <h2 style={{ marginTop: 0 }}>{product.title}</h2>
          <p style={{ color: 'var(--muted)', lineHeight: 1.7 }}>{product.description}</p>
        </div>
        <div className="inline">
          <strong style={{ fontSize: 22 }}>₹{product.price}</strong>
          <span style={{ color: 'var(--muted)' }}>Stock: {product.stock}</span>
        </div>
        <div className="inline">
          <button className="btn" onClick={() => addToCart(product)}>Add to cart</button>
          <Link className="btn secondary" to="/">Back to catalog</Link>
        </div>
      </section>
    );
  }, [product, message]);
  return content;
}

export default function App() {
  const { id } = useParams();
  return id ? <DetailView /> : <ListView />;
}
