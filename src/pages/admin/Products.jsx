import React, { useState, useEffect } from 'react';
import api from '../../services/api.js';
import './AdminProducts.css';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'Casual Wear',
    gender: 'Unisex',
    sizes: ['S', 'M', 'L'],
    colors: ['Black', 'White'],
    images: ['https://via.placeholder.com/400x500/E8E2D6/1C1C1C?text=Product'],
    stock: 0,
    isFeatured: false,
    isNewArrival: false
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data } = await api.get('/products');
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleArrayChange = (e, field) => {
    const values = e.target.value.split(',').map(v => v.trim());
    setFormData({ ...formData, [field]: values });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await api.put(`/products/${editingProduct._id}`, formData);
        alert('Product updated successfully!');
      } else {
        await api.post('/products', formData);
        alert('Product created successfully!');
      }
      setShowModal(false);
      setEditingProduct(null);
      resetForm();
      fetchProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Failed to save product');
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price,
      category: product.category,
      gender: product.gender,
      sizes: product.sizes,
      colors: product.colors,
      images: product.images,
      stock: product.stock,
      isFeatured: product.isFeatured,
      isNewArrival: product.isNewArrival
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    
    try {
      await api.delete(`/products/${id}`);
      alert('Product deleted successfully!');
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Failed to delete product');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      category: 'Casual Wear',
      gender: 'Unisex',
      sizes: ['S', 'M', 'L'],
      colors: ['Black', 'White'],
      images: ['https://via.placeholder.com/400x500/E8E2D6/1C1C1C?text=Product'],
      stock: 0,
      isFeatured: false,
      isNewArrival: false
    });
  };

  const openCreateModal = () => {
    resetForm();
    setEditingProduct(null);
    setShowModal(true);
  };

  if (loading) return <div className="spinner"></div>;

  return (
    <div className="admin-products">
      <div className="container">
        <div className="page-header">
          <h1>Product Management</h1>
          <button onClick={openCreateModal} className="btn btn-primary">
            + Add Product
          </button>
        </div>

        <div className="products-grid">
          {products.map(product => (
            <div key={product._id} className="product-card card">
              <img 
                src={product.images?.[0] || 'https://via.placeholder.com/300/E8E2D6/1C1C1C?text=Product'} 
                alt={product.name} 
              />
              <div className="product-details">
                <h3>{product.name}</h3>
                <p className="product-category">{product.category} - {product.gender}</p>
                <p className="product-price">${product.price}</p>
                <p className="product-stock">Stock: {product.stock}</p>
                <div className="product-badges">
                  {product.isFeatured && <span className="badge">Featured</span>}
                  {product.isNewArrival && <span className="badge">New</span>}
                </div>
                <div className="product-actions">
                  <button onClick={() => handleEdit(product)} className="btn btn-outline btn-sm">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(product._id)} className="btn btn-danger btn-sm">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content card" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{editingProduct ? 'Edit Product' : 'Create Product'}</h2>
                <button onClick={() => setShowModal(false)} className="close-btn">×</button>
              </div>

              <form onSubmit={handleSubmit} className="product-form">
                <div className="form-group">
                  <label>Product Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Description *</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="3"
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Price *</label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleChange}
                      required
                      min="0"
                      step="0.01"
                    />
                  </div>

                  <div className="form-group">
                    <label>Stock *</label>
                    <input
                      type="number"
                      name="stock"
                      value={formData.stock}
                      onChange={handleChange}
                      required
                      min="0"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Category *</label>
                    <select name="category" value={formData.category} onChange={handleChange} required>
                      <option value="Casual Wear">Casual Wear</option>
                      <option value="Streetwear">Streetwear</option>
                      <option value="Essentials">Essentials</option>
                      <option value="Limited Edition">Limited Edition</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Gender *</label>
                    <select name="gender" value={formData.gender} onChange={handleChange} required>
                      <option value="Men">Men</option>
                      <option value="Women">Women</option>
                      <option value="Unisex">Unisex</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Sizes (comma-separated)</label>
                  <input
                    type="text"
                    value={formData.sizes.join(', ')}
                    onChange={(e) => handleArrayChange(e, 'sizes')}
                    placeholder="XS, S, M, L, XL"
                  />
                </div>

                <div className="form-group">
                  <label>Colors (comma-separated)</label>
                  <input
                    type="text"
                    value={formData.colors.join(', ')}
                    onChange={(e) => handleArrayChange(e, 'colors')}
                    placeholder="Black, White, Gray"
                  />
                </div>

                <div className="form-group">
                  <label>Image URLs (comma-separated)</label>
                  <input
                    type="text"
                    value={formData.images.join(', ')}
                    onChange={(e) => handleArrayChange(e, 'images')}
                    placeholder="URL1, URL2"
                  />
                </div>

                <div className="form-checkboxes">
                  <label>
                    <input
                      type="checkbox"
                      name="isFeatured"
                      checked={formData.isFeatured}
                      onChange={handleChange}
                    />
                    <span>Featured Product</span>
                  </label>

                  <label>
                    <input
                      type="checkbox"
                      name="isNewArrival"
                      checked={formData.isNewArrival}
                      onChange={handleChange}
                    />
                    <span>New Arrival</span>
                  </label>
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn btn-primary">
                    {editingProduct ? 'Update' : 'Create'} Product
                  </button>
                  <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;
