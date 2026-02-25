import React, { useState, useEffect } from 'react';
import api from '../../services/api.js';
import './AdminOrders.css';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data } = await api.get('/orders');
      setOrders(data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await api.put(`/orders/${orderId}/status`, { status: newStatus });
      alert('Order status updated!');
      fetchOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Failed to update order status');
    }
  };

  const handlePaymentStatusChange = async (orderId, newStatus) => {
    try {
      await api.put(`/orders/${orderId}/payment`, { status: newStatus });
      alert('Payment status updated!');
      fetchOrders();
    } catch (error) {
      console.error('Error updating payment status:', error);
      alert('Failed to update payment status');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'Processing': '#f39c12',
      'Shipped': '#3498db',
      'Delivered': '#27ae60',
      'Cancelled': '#e74c3c',
      'Pending': '#f39c12',
      'Paid': '#27ae60',
      'Failed': '#e74c3c'
    };
    return colors[status] || '#95a5a6';
  };

  if (loading) return <div className="spinner"></div>;

  return (
    <div className="admin-orders">
      <div className="container">
        <div className="page-header">
          <h1>Order Management</h1>
          <p>Total Orders: {orders.length}</p>
        </div>

        {orders.length === 0 ? (
          <div className="no-orders card">
            <h3>No orders yet</h3>
          </div>
        ) : (
          <div className="orders-list">
            {orders.map(order => (
              <div key={order._id} className="order-card card">
                <div className="order-header">
                  <div className="order-info">
                    <h3>Order #{order._id.slice(-8).toUpperCase()}</h3>
                    <p>Customer: {order.user?.name} ({order.user?.email})</p>
                    <p>Placed: {new Date(order.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="order-total">
                    <strong>${order.totalPrice.toFixed(2)}</strong>
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
                        <p>Size: {item.size} | Color: {item.color} | Qty: {item.quantity}</p>
                      </div>
                      <div className="item-price">${(item.price * item.quantity).toFixed(2)}</div>
                    </div>
                  ))}
                </div>

                <div className="order-address">
                  <strong>Shipping Address:</strong>
                  <p>
                    {order.shippingAddress.street}, {order.shippingAddress.city}, 
                    {order.shippingAddress.state} {order.shippingAddress.zipCode}, 
                    {order.shippingAddress.country}
                  </p>
                </div>

                <div className="order-controls">
                  <div className="control-group">
                    <label>Order Status:</label>
                    <select 
                      value={order.orderStatus} 
                      onChange={(e) => handleStatusChange(order._id, e.target.value)}
                      style={{ borderColor: getStatusColor(order.orderStatus) }}
                    >
                      <option value="Processing">Processing</option>
                      <option value="Shipped">Shipped</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>

                  <div className="control-group">
                    <label>Payment Status:</label>
                    <select 
                      value={order.paymentStatus} 
                      onChange={(e) => handlePaymentStatusChange(order._id, e.target.value)}
                      style={{ borderColor: getStatusColor(order.paymentStatus) }}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Paid">Paid</option>
                      <option value="Failed">Failed</option>
                    </select>
                  </div>

                  <div className="control-group">
                    <label>Payment Method:</label>
                    <p>{order.paymentMethod}</p>
                  </div>
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
