import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../lib/api';

function CheckoutPage() {
  const { items, total, updateQuantity, clearCart } = useCart();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [address, setAddress] = useState({
    fullName: '',
    line1: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India'
  });
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  async function handlePlaceOrder() {
    setError('');
    setStatus('Placing order and initiating payment...');

    try {
      await apiRequest('/api/orders', {
        method: 'POST',
        token,
        body: {
          items: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity
          })),
          shippingAddress: address
        }
      });

      clearCart();
      setStatus('Order placed. Payment is being processed asynchronously.');
      setTimeout(() => navigate('/orders'), 1500);
    } catch (err) {
      setError(err.message);
      setStatus('');
    }
  }

  return (
    <section className="page-section checkout-layout">
      <div className="card checkout-card">
        <h1>Checkout</h1>

        {items.length === 0 ? (
          <p>Your cart is empty.</p>
        ) : (
          <div className="cart-list">
            {items.map((item) => (
              <div className="cart-row" key={item.productId}>
                <div>
                  <h3>{item.name}</h3>
                  <p className="muted-text">₹{item.price}</p>
                </div>
                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(event) =>
                    updateQuantity(item.productId, Number(event.target.value))
                  }
                />
              </div>
            ))}
            <div className="checkout-total">Total: ₹{total}</div>
          </div>
        )}
      </div>

      <div className="card checkout-card">
        <h2>Shipping Address</h2>

        {['fullName', 'line1', 'city', 'state', 'postalCode', 'country'].map((field) => (
          <div className="field-group" key={field}>
            <label>{field}</label>
            <input
              value={address[field]}
              onChange={(event) =>
                setAddress((current) => ({ ...current, [field]: event.target.value }))
              }
            />
          </div>
        ))}

        {error && <p className="error-text">{error}</p>}
        {status && <p className="success-text">{status}</p>}

        <button className="button" disabled={items.length === 0} onClick={handlePlaceOrder}>
          Place Order
        </button>
      </div>
    </section>
  );
}

export default CheckoutPage;
