import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productService, paymentService, chatService, wishlistService } from '../services';
import { useAuth } from '../context/AuthContext';
import ProductCard from '../components/ProductCard';
import MockPaymentModal from '../components/MockPaymentModal';
import toast from 'react-hot-toast';
import { FiHeart, FiMessageCircle, FiShoppingBag, FiUser, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

const PLATFORM_FEE = 5;

const ProductDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [images, setImages] = useState([]);
  const [similar, setSimilar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [buyLoading, setBuyLoading] = useState(false);
  const [showBuyModal, setShowBuyModal] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    setLoading(true);
    productService.getById(id)
      .then(({ data }) => {
        setProduct(data.data.product);
        setImages(data.data.product.images || []);
        setSimilar(data.data.similar || []);
      })
      .catch(() => { toast.error('Product not found'); navigate('/home'); })
      .finally(() => setLoading(false));

    if (user) {
      wishlistService.check(id)
        .then(({ data }) => setIsWishlisted(data.data.isWishlisted))
        .catch(() => {});
    }
  }, [id, user, navigate]);

  const handleWishlist = async () => {
    if (!user) { toast.error('Please login'); return; }
    try {
      if (isWishlisted) {
        await wishlistService.remove(id);
        setIsWishlisted(false);
        toast.success('Removed from wishlist');
      } else {
        await wishlistService.add(id);
        setIsWishlisted(true);
        toast.success('Added to wishlist ❤️');
      }
    } catch { toast.error('Failed'); }
  };

  const handleChat = async () => {
    if (!user) { toast.error('Please login'); return; }
    if (user.id === product.seller_id) { toast.error("You can't chat with yourself"); return; }
    try {
      const { data } = await chatService.createConversation({ seller_id: product.seller_id, product_id: product.id });
      navigate(`/chat/${data.data.conversation.id}`);
    } catch { toast.error('Failed to start chat'); }
  };

  const handleBuy = async () => {
    if (!user) { toast.error('Please login to purchase'); return; }
    if (user.id === product.seller_id) { toast.error("You can't buy your own item"); return; }
    setShowBuyModal(true);
  };

  const handlePurchaseSuccess = async () => {
    setShowBuyModal(false);
    setBuyLoading(true);
    try {
      const mockPayId = `pay_demo_${Date.now()}`;
      await paymentService.purchase({
        productId: product.id,
        mock_payment_id: mockPayId,
      });
      toast.success('🎉 Purchase successful!');
      navigate('/orders');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Purchase failed');
    } finally {
      setBuyLoading(false);
    }
  };


  if (loading) return (
    <div className="page-container">
      <div className="row g-4">
        <div className="col-md-6"><div className="skeleton" style={{ height: 400, borderRadius: 'var(--radius-md)' }} /></div>
        <div className="col-md-6">
          {[200, 24, 40, 120, 60].map((h, i) => (
            <div key={i} className="skeleton mb-3" style={{ height: h, borderRadius: 8 }} />
          ))}
        </div>
      </div>
    </div>
  );

  if (!product) return null;
  const displayImages = images.length ? images : [{ image_url: '' }];

  return (
    <div className="page-container">
      {/* Mock Payment Modal for purchase */}
      {showBuyModal && product && (
        <MockPaymentModal
          amount={Number(product.price)}
          title={`Buy: ${product.title}`}
          onSuccess={handlePurchaseSuccess}
          onClose={() => setShowBuyModal(false)}
        />
      )}

      <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 600, cursor: 'pointer', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 4 }}>
        <FiChevronLeft /> Back
      </button>

      <div className="row g-4">
        {/* Images */}
        <div className="col-md-6">
          <div style={{ position: 'relative', borderRadius: 'var(--radius-md)', overflow: 'hidden', background: 'var(--surface-container)' }}>
            <img
              src={displayImages[activeImg]?.image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(product.title)}&background=c2e8ff&color=005674&size=400`}
              alt={product.title}
              style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block' }}
            />
            {displayImages.length > 1 && (
              <>
                <button onClick={() => setActiveImg((i) => (i - 1 + displayImages.length) % displayImages.length)}
                  style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '50%', width: 36, height: 36, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FiChevronLeft />
                </button>
                <button onClick={() => setActiveImg((i) => (i + 1) % displayImages.length)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '50%', width: 36, height: 36, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FiChevronRight />
                </button>
              </>
            )}
          </div>
          {/* Thumbnails */}
          {displayImages.length > 1 && (
            <div style={{ display: 'flex', gap: 8, marginTop: 12, overflowX: 'auto' }}>
              {displayImages.map((img, i) => (
                <img key={i} src={img.image_url} alt="" onClick={() => setActiveImg(i)}
                  style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 10, cursor: 'pointer', border: activeImg === i ? '2px solid var(--primary)' : '2px solid transparent', opacity: activeImg === i ? 1 : 0.65, transition: 'all 0.2s' }} />
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="col-md-6">
          <span className="condition-badge mb-2 d-inline-block">{product.condition_type}</span>
          <div style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>{product.category_name}</div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--on-surface)', marginBottom: 12, lineHeight: 1.3 }}>{product.title}</h1>

          {/* Price */}
          <div className="sm-card p-3 mb-3">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ color: 'var(--outline)', fontSize: 14 }}>Product Price</span>
              <span style={{ fontWeight: 700, fontSize: 18 }}>₹{Number(product.price).toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, paddingBottom: 8, borderBottom: '1px solid var(--outline-variant)' }}>
              <span style={{ color: 'var(--outline)', fontSize: 14 }}>Platform Fee</span>
              <span style={{ fontWeight: 600, fontSize: 14 }}>₹{PLATFORM_FEE}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 700 }}>Total</span>
              <span style={{ fontWeight: 800, fontSize: 22, color: 'var(--primary)' }}>
                ₹{(Number(product.price) + PLATFORM_FEE).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Actions */}
          {user?.id !== product.seller_id && (
            <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
              <button onClick={handleWishlist}
                style={{ width: 48, height: 48, borderRadius: '50%', border: '1.5px solid var(--outline-variant)', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <FiHeart fill={isWishlisted ? '#e53935' : 'none'} color={isWishlisted ? '#e53935' : 'var(--outline)'} size={20} />
              </button>
              <button onClick={handleChat}
                style={{ flex: 1, background: 'var(--surface-container)', color: 'var(--primary)', border: '1.5px solid var(--primary)', borderRadius: 9999, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'var(--font)' }}>
                <FiMessageCircle /> Chat with Seller
              </button>
              <button onClick={handleBuy} disabled={buyLoading || product.status === 'sold'}
                style={{ flex: 1, background: product.status === 'sold' ? 'var(--outline-variant)' : 'var(--primary)', color: '#fff', border: 'none', borderRadius: 9999, fontWeight: 700, cursor: product.status === 'sold' ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'var(--font)', opacity: buyLoading ? 0.75 : 1 }}>
                <FiShoppingBag /> {product.status === 'sold' ? 'Sold Out' : buyLoading ? 'Processing...' : 'Buy Now'}
              </button>
            </div>
          )}

          {/* Description */}
          <div className="sm-card p-3 mb-3">
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 10 }}>Description</h3>
            <p style={{ fontSize: 14, color: 'var(--on-surface-variant)', lineHeight: 1.7, margin: 0 }}>{product.description}</p>
          </div>

          {/* Seller */}
          <div className="sm-card p-3">
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 10 }}>Seller</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--primary-container)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {product.seller_avatar
                  ? <img src={product.seller_avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <FiUser color="var(--primary)" size={22} />
                }
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{product.seller_name}</div>
                <div style={{ fontSize: 12, color: 'var(--outline)' }}>{product.seller_college}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Similar Products */}
      {similar.length > 0 && (
        <div style={{ marginTop: 40 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 16 }}>Similar Items</h2>
          <div className="row g-3">
            {similar.map((p) => (
              <div key={p.id} className="col-6 col-md-4 col-lg-3">
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetailPage;
