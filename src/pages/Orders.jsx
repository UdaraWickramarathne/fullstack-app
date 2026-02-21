import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api.js';
import './Orders.css';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data } = await api.get('/orders/myorders');
      setOrders(data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'Processing': '#f39c12',
      'Shipped': '#3498db',
      'Delivered': '#27ae60',
      'Cancelled': '#e74c3c'
    };
    return colors[status] || '#95a5a6';
  };

  if (loading) return <div className="spinner"></div>;

  return (
    <div className="orders-page">
      <div className="container">
        <h1 className="page-title">My Orders</h1>

        {orders.length === 0 ? (
          <div className="no-orders card">
            <h3>No orders yet</h3>
            <p>Start shopping to see your orders here</p>
            <Link to="/products" className="btn btn-primary">Shop Now</Link>
          </div>
        ) : (
          <div className="orders-list">
            {orders.map(order => (
              <div key={order._id} className="order-card card">
                <div className="order-header">
                  <div className="order-info">
                    <h3>Order #{order._id.slice(-8).toUpperCase()}</h3>
                    <p>Placed on {new Date(order.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="order-status" style={{ color: getStatusColor(order.orderStatus) }}>
                    <span className="status-badge" style={{ backgroundColor: getStatusColor(order.orderStatus) }}>
                      {order.orderStatus}
                    </span>
                  </div>
                </div>

                <div className="order-items">
                  {order.orderItems.map((item, index) => (
                    <div key={index} className="order-item">
                      <img 
                        src={item.image || 'https://placehold.co/80/E8E2D6/1C1C1C?text=Product'} 
                        alt={item.name} 
                      />
                      <div className="item-details">
                        <h4>{item.name}</h4>
                        <p>Size: {item.size} | Color: {item.color}</p>
                        <p>Quantity: {item.quantity}</p>
                      </div>
                      <div className="item-price">${item.price}</div>
                    </div>
                  ))}
                </div>

                <div className="order-footer">
                  <div className="order-address">
                    <strong>Shipping Address:</strong>
                    <p>
                      {order.shippingAddress.street}, {order.shippingAddress.city}, 
                      {order.shippingAddress.state} {order.shippingAddress.zipCode}, 
                      {order.shippingAddress.country}
                    </p>
                  </div>
                  <div className="order-total">
                    <strong>Total:</strong> ${order.totalPrice.toFixed(2)}
                  </div>
                </div>

                <div className="order-meta">
                  <span>Payment: {order.paymentStatus}</span>
                  <span>Method: {order.paymentMethod}</span>
                  {order.deliveredAt && (
                    <span>Delivered: {new Date(order.deliveredAt).toLocaleDateString()}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;
