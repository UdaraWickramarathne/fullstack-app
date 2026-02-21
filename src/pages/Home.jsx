import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api.js';
import './Home.css';

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [productsRes, reviewsRes] = await Promise.all([
        api.get('/products?featured=true'),
        api.get('/reviews')
      ]);
      setFeaturedProducts(productsRes.data.slice(0, 4));
      setReviews(reviewsRes.data.slice(0, 3));
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { name: 'Casual Wear', image: 'https://via.placeholder.com/400x500/E8E2D6/1C1C1C?text=Casual+Wear' },
    { name: 'Streetwear', image: 'https://via.placeholder.com/400x500/E8E2D6/1C1C1C?text=Streetwear' },
    { name: 'Essentials', image: 'https://via.placeholder.com/400x500/E8E2D6/1C1C1C?text=Essentials' },
    { name: 'Limited Edition', image: 'https://via.placeholder.com/400x500/E8E2D6/1C1C1C?text=Limited+Edition' }
  ];

  return (
    <div className="home">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1 className="hero-title">Wear Your Values</h1>
          <p className="hero-subtitle">
            Discover timeless fashion crafted with care for people and planet. 
            Every piece tells a story of ethical sourcing and sustainable craftsmanship.
          </p>
          <Link to="/products" className="btn btn-primary">Shop the Collection</Link>
        </div>
        <div className="hero-image">
          <img src="https://via.placeholder.com/800x600/E8E2D6/1C1C1C?text=Sustainable+Fashion" alt="Sustainable Fashion" />
        </div>
      </section>

      {/* Featured Categories */}
      <section className="categories-section">
        <div className="container">
          <h2 className="section-title">Explore Collections</h2>
          <p className="section-subtitle">Find your style in our curated categories</p>
          
          <div className="categories-grid">
            {categories.map((category, index) => (
              <Link 
                key={index} 
                to={`/products?category=${encodeURIComponent(category.name)}`} 
                className="category-card card"
              >
                <img src={category.image} alt={category.name} />
                <div className="category-overlay">
                  <h3>{category.name}</h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="featured-products">
        <div className="container">
          <h2 className="section-title">Featured Products</h2>
          <p className="section-subtitle">Handpicked pieces from our latest collection</p>
          
          {loading ? (
            <div className="spinner"></div>
          ) : (
            <div className="products-grid">
              {featuredProducts.map(product => (
                <Link key={product._id} to={`/products/${product._id}`} className="product-card card">
                  <div className="product-image">
                    <img 
                      src={product.images?.[0] || 'https://via.placeholder.com/400x500/E8E2D6/1C1C1C?text=Product'} 
                      alt={product.name} 
                    />
                  </div>
                  <div className="product-info">
                    <h3>{product.name}</h3>
                    <p className="product-price">${product.price}</p>
                    <button className="btn btn-outline btn-small">Quick View</button>
                  </div>
                </Link>
              ))}
            </div>
          )}

          <div className="section-cta">
            <Link to="/products" className="btn btn-secondary">View All Products</Link>
          </div>
        </div>
      </section>

      {/* Sustainability Section */}
      <section id="sustainability" className="sustainability-section">
        <div className="container">
          <div className="sustainability-content">
            <div className="sustainability-text">
              <h2 className="section-title">Our Commitment</h2>
              <div className="sustainability-points">
                <div className="point">
                  <div className="point-icon">🌱</div>
                  <div>
                    <h4>Ethical Sourcing</h4>
                    <p>We partner with fair-trade certified suppliers who share our values for ethical labor practices.</p>
                  </div>
                </div>
                <div className="point">
                  <div className="point-icon">♻️</div>
                  <div>
                    <h4>Eco-Friendly Materials</h4>
                    <p>Organic cotton, recycled fabrics, and biodegradable packaging for a gentler footprint.</p>
                  </div>
                </div>
                <div className="point">
                  <div className="point-icon">🤍</div>
                  <div>
                    <h4>Slow Fashion Philosophy</h4>
                    <p>Quality over quantity. Timeless designs meant to last seasons, not weeks.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="sustainability-image">
              <img src="https://via.placeholder.com/600x700/E8E2D6/1C1C1C?text=Sustainability" alt="Sustainability" />
            </div>
          </div>
        </div>
      </section>

      {/* Customer Reviews */}
      <section className="reviews-section">
        <div className="container">
          <h2 className="section-title">What Our Community Says</h2>
          <p className="section-subtitle">Trusted by thousands of conscious consumers</p>
          
          <div className="reviews-grid">
            {reviews.map(review => (
              <div key={review._id} className="review-card card">
                <div className="review-header">
                  <img 
                    src={review.image || 'https://via.placeholder.com/80/E8E2D6/1C1C1C?text=👤'} 
                    alt={review.name} 
                    className="review-avatar"
                  />
                  <div>
                    <h4>{review.name}</h4>
                    <div className="review-rating">
                      {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                    </div>
                  </div>
                </div>
                <p className="review-text">{review.comment}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>Join the Movement</h2>
            <p>Be part of a community that chooses style with substance</p>
            <Link to="/products" className="btn btn-primary">Discover More</Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
