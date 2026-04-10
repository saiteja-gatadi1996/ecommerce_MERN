import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../lib/api';

function OrdersPage() {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);

  async function loadOrders() {
    const data = await apiRequest('/api/orders/mine', { token });
    setOrders(data);
  }

  useEffect(() => {
    loadOrders();
    const timer = setInterval(loadOrders, 2500);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="page-section">
      <h1>Your Orders</h1>
      <p className="muted-text">
        This page auto-refreshes so you can see the async payment → order → inventory flow.
      </p>

      <div className="orders-list">
        {orders.map((order) => (
          <article className="card order-card" key={order._id}>
            <div className="order-header">
              <div>
                <h3>Order #{order._id.slice(-6)}</h3>
                <p className="muted-text">Status: {order.status}</p>
              </div>
              <strong>₹{order.totalAmount}</strong>
            </div>

            <div className="order-items">
              {order.items.map((item) => (
                <div className="order-item" key={item.productId}>
                  <span>{item.name}</span>
                  <span>
                    {item.quantity} × ₹{item.price}
                  </span>
                </div>
              ))}
            </div>
          </article>
        ))}

        {orders.length === 0 && <p>No orders yet.</p>}
      </div>
    </section>
  );
}

export default OrdersPage;
