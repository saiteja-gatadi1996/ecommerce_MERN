import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

function Header() {
  const { isAuthenticated, user, logout } = useAuth();
  const { items } = useCart();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link className="brand" to="/">
          ShopSphere
        </Link>

        <nav className="nav-links">
          <NavLink to="/">Home</NavLink>
          {isAuthenticated && <NavLink to="/orders">Orders</NavLink>}
          <NavLink to="/checkout">Cart ({items.length})</NavLink>
        </nav>

        <div className="header-actions">
          {isAuthenticated ? (
            <>
              <span className="user-greeting">Hi, {user?.name}</span>
              <button className="button button--secondary" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link className="button button--secondary" to="/login">
                Login
              </Link>
              <Link className="button" to="/signup">
                Signup
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
