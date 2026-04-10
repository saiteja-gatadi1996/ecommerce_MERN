import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiRequest } from '../lib/api';
import { useCart } from '../context/CartContext';

function ProductPage() {
  const { id } = useParams();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    apiRequest(`/api/products/${id}`).then(setProduct);
  }, [id]);

  if (!product) {
    return <p className="page-section">Loading product...</p>;
  }

  return (
    <section className="page-section product-view">
      <img className="product-view__image" src={product.image} alt={product.name} />
      <div className="product-view__content">
        <h1>{product.name}</h1>
        <p className="muted-text">{product.description}</p>
        <p className="price">₹{product.price}</p>
        <p>Category: {product.category}</p>
        <p>Available stock: {product.stock}</p>

        <div className="quantity-row">
          <label htmlFor="qty">Quantity</label>
          <input
            id="qty"
            type="number"
            min="1"
            max={product.stock}
            value={quantity}
            onChange={(event) => setQuantity(Number(event.target.value))}
          />
        </div>

        <button className="button" onClick={() => addToCart(product, quantity)}>
          Add to Cart
        </button>
      </div>
    </section>
  );
}

export default ProductPage;
