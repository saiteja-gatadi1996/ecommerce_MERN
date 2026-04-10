import { useEffect, useState } from 'react';
import ProductCard from '../components/ProductCard';
import { apiRequest } from '../lib/api';

function HomePage() {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        await apiRequest('/api/products/seed', { method: 'POST' });
        const data = await apiRequest('/api/products');
        setProducts(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return (
    <section className="page-section">
      <div className="hero">
        <div>
          <h1>Production-style E-Commerce Starter</h1>
          <p>
            Full MERN microservices flow with auth, products, cart, orders, payments, inventory,
            and event-driven updates.
          </p>
        </div>
      </div>

      {loading && <p>Loading products...</p>}
      {error && <p className="error-text">{error}</p>}

      <div className="product-grid">
        {products.map((product) => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>
    </section>
  );
}

export default HomePage;
