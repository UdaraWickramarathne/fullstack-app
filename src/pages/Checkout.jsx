import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../services/api.js';
import './Checkout.css';

const Checkout = () => {
  const { cartItems, getCartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    street: user?.address?.street || '',
    city: user?.address?.city || '',
    state: user?.address?.state || '',
    zipCode: user?.address?.zipCode || '',
    country: user?.address?.country || 'USA',
    paymentMethod: 'Card'
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const orderData = {
        orderItems: cartItems.map(item => ({
          product: item.product._id,
          name: item.product.name,
          quantity: item.quantity,
          size: item.size,
          color: item.color,
          price: item.product.price,
          image: item.product.images?.[0]
        })),
        shippingAddress: {
          street: formData.street,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          country: formData.country
        },
        paymentMethod: formData.paymentMethod,
        itemsPrice: getCartTotal(),
        shippingPrice: 10,
        taxPrice: getCartTotal() * 0.08,
        totalPrice: getCartTotal() + 10 + (getCartTotal() * 0.08)
      };

      const { data } = await api.post('/orders', orderData);
      clearCart();
      alert('Order placed successfully!');
      navigate(`/orders`);
    } catch (error) {
      console.error('Error placing order:', error);
      alert('Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const subtotal = getCartTotal();
  const shipping = 10;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  return (
    <div className="checkout-page">
      <div className="container">
        <h1 className="page-title">Checkout</h1>

        <div className="checkout-layout">
          <form onSubmit={handleSubmit} className="checkout-form">
            <div className="form-section card">
              <h3>Shipping Address</h3>
              
              <div className="form-group">
                <label>Street Address *</label>
                <input
                  type="text"
                  name="street"
                  value={formData.street}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>City *</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>State *</label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>ZIP Code *</label>
                  <input
                    type="text"
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Country *</label>
                  <input
                    type="text"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="form-section card">
              <h3>Payment Method</h3>
              
              <div className="payment-options">
                <label className="payment-option">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="Card"
                    checked={formData.paymentMethod === 'Card'}
                    onChange={handleChange}
                  />
                  <span>Credit/Debit Card</span>
                </label>

                <label className="payment-option">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="PayPal"
                    checked={formData.paymentMethod === 'PayPal'}
                    onChange={handleChange}
                  />
                  <span>PayPal</span>
                </label>

                <label className="payment-option">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="Cash on Delivery"
                    checked={formData.paymentMethod === 'Cash on Delivery'}
                    onChange={handleChange}
                  />
                  <span>Cash on Delivery</span>
                </label>
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-large" disabled={loading}>
              {loading ? 'Processing...' : 'Place Order'}
            </button>
          </form>

          <div className="order-summary card">
            <h3>Order Summary</h3>

            <div className="summary-items">
              {cartItems.map(item => (
                <div key={`${item.product._id}-${item.size}-${item.color}`} className="summary-item">
                  <img 
                    src={item.product.images?.[0] || 'https://placehold.co/80/E8E2D6/1C1C1C?text=Product'} 
                    alt={item.product.name} 
                  />
                  <div className="item-details">
                    <h4>{item.product.name}</h4>
                    <p>{item.size} | {item.color} | Qty: {item.quantity}</p>
                  </div>
                  <span className="item-price">${(item.product.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="summary-calculations">
              <div className="calc-row">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="calc-row">
                <span>Shipping</span>
                <span>${shipping.toFixed(2)}</span>
              </div>
              <div className="calc-row">
                <span>Tax (8%)</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div className="calc-row total">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
