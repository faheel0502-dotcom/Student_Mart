import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiHeart } from 'react-icons/fi';
import { wishlistService } from '../services';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const ProductCard = ({ product, wishlisted = false, onWishlistToggle }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isWishlisted, setIsWishlisted] = useState(wishlisted);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  const handleWishlist = async (e) => {
    e.stopPropagation();
    if (!user) { toast.error('Please login to save items'); return; }
    setWishlistLoading(true);
    try {
      if (isWishlisted) {
        await wishlistService.remove(product.id || product.product_id);
        setIsWishlisted(false);
        toast.success('Removed from wishlist');
      } else {
        await wishlistService.add(product.id || product.product_id);
        setIsWishlisted(true);
        toast.success('Added to wishlist ❤️');
      }
      if (onWishlistToggle) onWishlistToggle(product.id);
    } catch (err) {
      if (err.response?.status === 409) {
        setIsWishlisted(true);
      } else {
        toast.error('Failed to update wishlist');
      }
    } finally {
      setWishlistLoading(false);
    }
  };

  const image = product.primary_image || product.image_url || '/placeholder.jpg';
  const price = product.price || product.product_price;
  const title = product.title || product.product_title;
  const condition = product.condition_type;
  const sellerName = product.seller_name;
  const categoryName = product.category_name;

  return (
    <div className="product-card" onClick={() => navigate(`/product/${product.id || product.product_id}`)}>
      {/* Image */}
      <div style={{ position: 'relative', overflow: 'hidden' }}>
        <img
          src={image}
          alt={title}
          className="product-card-img"
          onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(title)}&background=c2e8ff&color=005674&size=200&bold=true`; }}
        />
        {/* Wishlist btn */}
        <button
          className={`wishlist-btn${isWishlisted ? ' active' : ''}`}
          onClick={handleWishlist}
          disabled={wishlistLoading}
          aria-label="Add to wishlist"
        >
          <FiHeart
            size={16}
            fill={isWishlisted ? '#e53935' : 'none'}
            color={isWishlisted ? '#e53935' : 'var(--outline)'}
          />
        </button>
        {/* Condition badge */}
        {condition && (
          <div style={{ position: 'absolute', bottom: 8, left: 8 }}>
            <span className="condition-badge">{condition}</span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="product-card-body">
        {categoryName && (
          <div style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 700, letterSpacing: '0.04em', marginBottom: 4, textTransform: 'uppercase' }}>
            {categoryName}
          </div>
        )}
        <div className="product-card-title">{title}</div>
        <div className="product-card-price">₹{Number(price).toLocaleString()}</div>
        {sellerName && (
          <div className="product-card-meta">by {sellerName}</div>
        )}
      </div>
    </div>
  );
};

export default ProductCard;
