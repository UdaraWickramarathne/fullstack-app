import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../services/api.js';
import './Products.css';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    gender: searchParams.get('gender') || '',
    sort: searchParams.get('sort') || ''
  });

  useEffect(() => {
    fetchProducts();
  }, [filters]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.category) params.append('category', filters.category);
      if (filters.gender) params.append('gender', filters.gender);
      if (filters.sort) params.append('sort', filters.sort);
      
      const { data } = await api.get(`/products?${params.toString()}`);
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    
    const params = new URLSearchParams();
    Object.entries(newFilters).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    setSearchParams(params);
  };

  const categories = ['Casual Wear', 'Streetwear', 'Essentials', 'Limited Edition'];

  return (
    <div className="products-page">
      <div className="container">
        <div className="page-header">
          <h1>Shop Collection</h1>
          <p>Discover sustainable fashion that speaks to your values</p>
        </div>

        <div className="products-layout">
          {/* Filters Sidebar */}
          <aside className="filters-sidebar">
            <div className="filter-group">
              <h3>Gender</h3>
              <div className="filter-options">
                <button 
                  className={`filter-btn ${filters.gender === '' ? 'active' : ''}`}
                  onClick={() => handleFilterChange('gender', '')}
                >
                  All
                </button>
                <button 
                  className={`filter-btn ${filters.gender === 'Men' ? 'active' : ''}`}
                  onClick={() => handleFilterChange('gender', 'Men')}
                >
                  Men
                </button>
                <button 
                  className={`filter-btn ${filters.gender === 'Women' ? 'active' : ''}`}
                  onClick={() => handleFilterChange('gender', 'Women')}
                >
                  Women
                </button>
                <button 
                  className={`filter-btn ${filters.gender === 'Unisex' ? 'active' : ''}`}
                  onClick={() => handleFilterChange('gender', 'Unisex')}
                >
                  Unisex
                </button>
              </div>
            </div>

            <div className="filter-group">
              <h3>Category</h3>
              <div className="filter-options">
                <button 
                  className={`filter-btn ${filters.category === '' ? 'active' : ''}`}
                  onClick={() => handleFilterChange('category', '')}
                >
                  All
                </button>
                {categories.map(cat => (
                  <button 
                    key={cat}
                    className={`filter-btn ${filters.category === cat ? 'active' : ''}`}
                    onClick={() => handleFilterChange('category', cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="filter-group">
              <h3>Sort By</h3>
              <select 
                value={filters.sort} 
                onChange={(e) => handleFilterChange('sort', e.target.value)}
                className="sort-select"
              >
                <option value="">Latest</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="newest">Newest First</option>
              </select>
            </div>
          </aside>

          {/* Products Grid */}
          <div className="products-content">
            {loading ? (
              <div className="spinner"></div>
            ) : products.length === 0 ? (
              <div className="no-products">
                <h3>No products found</h3>
                <p>Try adjusting your filters</p>
              </div>
            ) : (
              <div className="products-grid">
                {products.map(product => (
                  <Link key={product._id} to={`/products/${product._id}`} className="product-card card">
                    <div className="product-image">
                      <img 
                        src={product.images?.[0] || 'https://via.placeholder.com/400x500/E8E2D6/1C1C1C?text=Product'} 
                        alt={product.name} 
                      />
                      {product.isNewArrival && <span className="badge badge-new">New</span>}
                      {product.stock === 0 && <span className="badge badge-sold">Sold Out</span>}
                    </div>
                    <div className="product-info">
                      <h3>{product.name}</h3>
                      <p className="product-category">{product.category}</p>
                      <div className="product-footer">
                        <span className="product-price">${product.price}</span>
                        <span className="product-gender">{product.gender}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Products;
