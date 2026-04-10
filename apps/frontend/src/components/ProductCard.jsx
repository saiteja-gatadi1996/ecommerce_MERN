import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

function ProductCard({ product }) {
  const { addToCart } = useCart();

  return (
    <article className="card product-card">
      <Link to={`/products/${product._id}`} className="product-card__image-link">
        <img src={product.image} alt={product.name} className="product-card__image" />
      </Link>

      <div className="product-card__content">
        <h3>{product.name}</h3>
        <p className="muted-text">{product.description}</p>
        <p className="price">₹{product.price}</p>
        <p className="stock-text">In stock: {product.stock}</p>
        <div className="card-actions">
          <Link className="button button--secondary" to={`/products/${product._id}`}>
            View
          </Link>
          <button className="button" onClick={() => addToCart(product, 1)}>
            Add to Cart
          </button>
        </div>
      </div>
    </article>
  );
}

export default ProductCard;
