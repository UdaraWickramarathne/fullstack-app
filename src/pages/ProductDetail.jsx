import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import api from '../services/api.js';
import './ProductDetail.css';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const { data } = await api.get(`/products/${id}`);
      setProduct(data);
      if (data.sizes?.length > 0) setSelectedSize(data.sizes[0]);
      if (data.colors?.length > 0) setSelectedColor(data.colors[0]);
    } catch (error) {
      console.error('Error fetching product:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (!selectedSize || !selectedColor) {
      alert('Please select size and color');
      return;
    }

    addToCart(product, quantity, selectedSize, selectedColor);
    alert('Added to cart!');
  };

  if (loading) return <div className="spinner"></div>;
  if (!product) return <div className="container"><p>Product not found</p></div>;

  return (
    <div className="product-detail-page">
      <div className="container">
        <button onClick={() => navigate(-1)} className="back-btn">
          ← Back
        </button>

        <div className="product-detail">
          <div className="product-images">
            <div className="main-image">
              <img 
                src={product.images?.[0] || 'https://via.placeholder.com/600x700/E8E2D6/1C1C1C?text=Product'} 
                alt={product.name} 
              />
            </div>
            {product.images?.length > 1 && (
              <div className="thumbnail-images">
                {product.images.map((img, index) => (
                  <img key={index} src={img} alt={`${product.name} ${index + 1}`} />
                ))}
              </div>
            )}
          </div>

          <div className="product-details-content">
            <h1>{product.name}</h1>
            <p className="product-price">${product.price}</p>
            
            <div className="product-meta">
              <span className="meta-item">Category: {product.category}</span>
              <span className="meta-item">Gender: {product.gender}</span>
              {product.stock > 0 ? (
                <span className="meta-item in-stock">In Stock ({product.stock})</span>
              ) : (
                <span className="meta-item out-stock">Out of Stock</span>
              )}
            </div>

            <p className="product-description">{product.description}</p>

            {product.stock > 0 && (
              <div className="product-options">
                <div className="option-group">
                  <label>Size</label>
                  <div className="size-options">
                    {product.sizes?.map(size => (
                      <button
                        key={size}
                        className={`size-btn ${selectedSize === size ? 'active' : ''}`}
                        onClick={() => setSelectedSize(size)}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="option-group">
                  <label>Color</label>
                  <div className="color-options">
                    {product.colors?.map(color => (
                      <button
                        key={color}
                        className={`color-btn ${selectedColor === color ? 'active' : ''}`}
                        onClick={() => setSelectedColor(color)}
                        style={{ 
                          backgroundColor: color.toLowerCase(),
                          border: selectedColor === color ? '3px solid var(--charcoal-black)' : '1px solid #ddd'
                        }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>

                <div className="option-group">
                  <label>Quantity</label>
                  <div className="quantity-selector">
                    <button 
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                    >
                      -
                    </button>
                    <span>{quantity}</span>
                    <button 
                      onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                      disabled={quantity >= product.stock}
                    >
                      +
                    </button>
                  </div>
                </div>

                <button onClick={handleAddToCart} className="btn btn-primary btn-large">
                  Add to Cart
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
