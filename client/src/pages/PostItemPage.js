import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { productService, paymentService } from '../services';
import MockPaymentModal from '../components/MockPaymentModal';
import toast from 'react-hot-toast';
import { FiUpload, FiX, FiDollarSign } from 'react-icons/fi';

const CONDITIONS = ['Like New', 'Good', 'Fair', 'Poor'];
const POSTING_FEE = 5;

const PostItemPage = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [form, setForm] = useState({
    title: '', description: '', category_id: '', price: '',
    original_price: '', condition_type: 'Good', location: '', is_negotiable: true,
  });
  const [step, setStep] = useState('form'); // 'form' | 'payment' | 'done'
  const [posting, setPosting] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPayModal, setShowPayModal] = useState(false);
  const [pendingPaymentDbId, setPendingPaymentDbId] = useState(null);

  useEffect(() => {
    productService.getCategories()
      .then(({ data }) => setCategories(data.data.categories))
      .catch(() => {});
  }, []);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleImages = (e) => {
    const files = Array.from(e.target.files).slice(0, 5 - images.length);
    setImages((prev) => [...prev, ...files]);
    files.forEach((f) => {
      const reader = new FileReader();
      reader.onload = (ev) => setImagePreviews((prev) => [...prev, ev.target.result]);
      reader.readAsDataURL(f);
    });
  };

  const removeImage = (i) => {
    setImages((prev) => prev.filter((_, idx) => idx !== i));
    setImagePreviews((prev) => prev.filter((_, idx) => idx !== i));
  };

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = 'Title is required';
    if (!form.description.trim()) e.description = 'Description is required';
    if (!form.category_id) e.category_id = 'Select a category';
    if (!form.price || Number(form.price) <= 0) e.price = 'Valid price required';
    if (!images.length) e.images = 'At least one image required';
    setErrors(e);
    return !Object.keys(e).length;
  };

  // Step 1: Validate → create payment session → open mock modal
  const handlePayPosting = async () => {
    if (!validate()) { toast.error('Please fill all required fields'); return; }
    try {
      const { data } = await paymentService.createOrder({ amount: POSTING_FEE, payment_type: 'posting_fee' });
      setPendingPaymentDbId(data.data.paymentDbId);
      setShowPayModal(true);
    } catch {
      toast.error('Failed to initiate payment');
    }
  };

  // Step 2: Called by MockPaymentModal on success → verify + publish
  const handlePaymentSuccess = async () => {
    setShowPayModal(false);
    try {
      const mockPayId = `pay_demo_${Date.now()}`;
      const { data: verifyData } = await paymentService.verify({
        payment_db_id: pendingPaymentDbId,
        mock_payment_id: mockPayId,
      });
      toast.success('Fee paid! Publishing your listing...');
      await handleSubmit(verifyData.data.paymentId);
    } catch {
      toast.error('Payment verification failed');
    }
  };

  // Step 3: Submit the product listing
  const handleSubmit = async (pmtId) => {
    setPosting(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => formData.append(k, v));
      formData.append('payment_id', pmtId);
      images.forEach((img) => formData.append('images', img));

      await productService.create(formData);
      setStep('done');
      toast.success('🎉 Your item is now listed!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to publish listing');
    } finally {
      setPosting(false);
    }
  };

  if (step === 'done') return (
    <div className="page-container text-center" style={{ paddingTop: 80 }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
      <h2 style={{ fontWeight: 800, color: 'var(--primary)', marginBottom: 8 }}>Item Listed Successfully!</h2>
      <p style={{ color: 'var(--outline)', marginBottom: 32 }}>Your item is now visible to all students on StudentMart.</p>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
        <button className="btn-primary-sm" onClick={() => navigate('/home')}>Browse Listings</button>
        <button className="btn-outline-sm" onClick={() => {
          setStep('form'); setImages([]); setImagePreviews([]);
          setForm({ title: '', description: '', category_id: '', price: '', original_price: '', condition_type: 'Good', location: '', is_negotiable: true });
        }}>Post Another</button>
      </div>
    </div>
  );

  return (
    <div className="page-container" style={{ maxWidth: 680 }}>
      {/* Mock Payment Modal */}
      {showPayModal && (
        <MockPaymentModal
          amount={POSTING_FEE}
          title="Product Listing Fee"
          onSuccess={handlePaymentSuccess}
          onClose={() => setShowPayModal(false)}
        />
      )}

      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Post an Item</h1>
      <p style={{ color: 'var(--outline)', fontSize: 14, marginBottom: 24 }}>
        A small ₹{POSTING_FEE} listing fee is required to publish your item
      </p>

      {/* Fee banner */}
      <div style={{ background: 'linear-gradient(135deg, #e8f4fd, #f7fafd)', border: '1px solid var(--primary-container)', borderRadius: 'var(--radius)', padding: '12px 16px', marginBottom: 24, display: 'flex', gap: 12, alignItems: 'center' }}>
        <FiDollarSign size={20} color="var(--primary)" />
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--primary)' }}>Listing Fee: ₹{POSTING_FEE}</div>
          <div style={{ fontSize: 12, color: 'var(--outline)' }}>Paid once via secure card payment before publishing</div>
        </div>
      </div>

      {/* Images */}
      <div className="mb-4">
        <label className="sm-label">Product Images * (Max 5)</label>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {imagePreviews.map((src, i) => (
            <div key={i} style={{ position: 'relative', width: 90, height: 90 }}>
              <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 10, border: '1.5px solid var(--outline-variant)' }} />
              <button onClick={() => removeImage(i)} style={{ position: 'absolute', top: -8, right: -8, background: 'var(--error)', color: '#fff', border: 'none', borderRadius: '50%', width: 22, height: 22, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}><FiX /></button>
            </div>
          ))}
          {images.length < 5 && (
            <label style={{ width: 90, height: 90, border: '2px dashed var(--outline-variant)', borderRadius: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--outline)', fontSize: 12, gap: 4 }}>
              <FiUpload size={20} />
              <span>Add Photo</span>
              <input type="file" accept="image/*" multiple hidden onChange={handleImages} />
            </label>
          )}
        </div>
        {errors.images && <div style={{ color: 'var(--error)', fontSize: 12, marginTop: 6 }}>{errors.images}</div>}
      </div>

      {/* Form fields */}
      <div className="row g-3">
        <div className="col-12">
          <label className="sm-label">Product Title *</label>
          <input className={`sm-input${errors.title ? ' error' : ''}`} placeholder="e.g. Engineering Mathematics Textbook"
            value={form.title} onChange={(e) => set('title', e.target.value)} />
          {errors.title && <div style={{ color: 'var(--error)', fontSize: 12, marginTop: 4 }}>{errors.title}</div>}
        </div>
        <div className="col-md-6">
          <label className="sm-label">Category *</label>
          <select className={`sm-input${errors.category_id ? ' error' : ''}`} value={form.category_id} onChange={(e) => set('category_id', e.target.value)}>
            <option value="">Select Category</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
          </select>
          {errors.category_id && <div style={{ color: 'var(--error)', fontSize: 12, marginTop: 4 }}>{errors.category_id}</div>}
        </div>
        <div className="col-md-6">
          <label className="sm-label">Condition *</label>
          <select className="sm-input" value={form.condition_type} onChange={(e) => set('condition_type', e.target.value)}>
            {CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="col-md-6">
          <label className="sm-label">Your Price (₹) *</label>
          <input type="number" className={`sm-input${errors.price ? ' error' : ''}`} placeholder="500"
            value={form.price} onChange={(e) => set('price', e.target.value)} />
          {errors.price && <div style={{ color: 'var(--error)', fontSize: 12, marginTop: 4 }}>{errors.price}</div>}
        </div>
        <div className="col-md-6">
          <label className="sm-label">Original Price (₹) <span style={{ color: 'var(--outline)' }}>(optional)</span></label>
          <input type="number" className="sm-input" placeholder="1200"
            value={form.original_price} onChange={(e) => set('original_price', e.target.value)} />
        </div>
        <div className="col-12">
          <label className="sm-label">Description *</label>
          <textarea className={`sm-input${errors.description ? ' error' : ''}`} rows={4} placeholder="Describe your item — condition, usage, any damage..."
            value={form.description} onChange={(e) => set('description', e.target.value)} style={{ resize: 'vertical' }} />
          {errors.description && <div style={{ color: 'var(--error)', fontSize: 12, marginTop: 4 }}>{errors.description}</div>}
        </div>
        <div className="col-md-8">
          <label className="sm-label">Location <span style={{ color: 'var(--outline)' }}>(optional)</span></label>
          <input className="sm-input" placeholder="e.g. Hostel Block A, Library" value={form.location} onChange={(e) => set('location', e.target.value)} />
        </div>
        <div className="col-md-4 d-flex align-items-center gap-2" style={{ marginTop: 24 }}>
          <input type="checkbox" id="negotiable" checked={form.is_negotiable}
            onChange={(e) => set('is_negotiable', e.target.checked)} style={{ width: 18, height: 18, accentColor: 'var(--primary)' }} />
          <label htmlFor="negotiable" style={{ fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Price Negotiable</label>
        </div>
      </div>

      <button onClick={handlePayPosting} disabled={posting}
        style={{ width: '100%', marginTop: 28, background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 9999, padding: '16px', fontSize: 16, fontWeight: 700, cursor: posting ? 'not-allowed' : 'pointer', opacity: posting ? 0.75 : 1, fontFamily: 'var(--font)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        {posting ? 'Publishing...' : `Pay ₹${POSTING_FEE} & Publish Listing`}
      </button>
    </div>
  );
};

export default PostItemPage;
