import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import './Navbar.css';

const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const { getCartCount } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
  };

  const navigateAndClose = (path) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="container">
        <div className="navbar-content">
          <Link to="/" className="logo">Velora Wear</Link>
          
          <div className={`nav-links ${mobileMenuOpen ? 'active' : ''}`}>
            <Link to="/products" onClick={() => setMobileMenuOpen(false)}>Shop</Link>
            <Link to="/products?filter=new" onClick={() => setMobileMenuOpen(false)}>New Arrivals</Link>
            <Link to="/#story" onClick={() => setMobileMenuOpen(false)}>Our Story</Link>
            <Link to="/#contact" onClick={() => setMobileMenuOpen(false)}>Contact</Link>
          </div>

          <div className="nav-actions">
            {user ? (
              <>
                {isAdmin && (
                  <Link to="/admin/dashboard" className="nav-link">Admin</Link>
                )}
                <Link to="/profile" className="nav-link">{user.name}</Link>
                <button onClick={handleLogout} className="nav-link btn-link">Logout</button>
              </>
            ) : (
              <Link to="/login" className="nav-link">Login</Link>
            )}
            
            <Link to="/cart" className="cart-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {getCartCount() > 0 && (
                <span className="cart-badge">{getCartCount()}</span>
              )}
            </Link>

            <button 
              className="mobile-menu-btn" 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
