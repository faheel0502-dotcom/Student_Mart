import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { productService } from '../services';
import ProductCard from '../components/ProductCard';
import { FiFilter, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';

const CONDITIONS = ['Like New', 'Good', 'Fair', 'Poor'];
const SORTS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
];

const SkeletonCard = () => (
  <div className="product-card">
    <div className="skeleton" style={{ height: 200, borderRadius: 0 }} />
    <div style={{ padding: 12 }}>
      <div className="skeleton" style={{ height: 14, marginBottom: 8, borderRadius: 6 }} />
      <div className="skeleton" style={{ height: 14, width: '60%', marginBottom: 8, borderRadius: 6 }} />
      <div className="skeleton" style={{ height: 20, width: '40%', borderRadius: 6 }} />
    </div>
  </div>
);

const HomePage = () => {
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category: '',
    condition: '',
    sort: 'newest',
    page: 1,
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    productService.getCategories()
      .then(({ data }) => setCategories(data.data.categories))
      .catch(() => {});
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await productService.getAll({ ...filters, limit: 12 });
      setProducts(data.data.products);
      setPagination(data.data.pagination);
    } catch {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  useEffect(() => {
    const q = searchParams.get('search');
    if (q) setFilters((f) => ({ ...f, search: q }));
  }, [searchParams]);

  const setFilter = (k, v) => setFilters((f) => ({ ...f, [k]: v, page: 1 }));
  const clearFilters = () => setFilters({ search: '', category: '', condition: '', sort: 'newest', page: 1 });

  const hasActiveFilters = filters.category || filters.condition || filters.search;

  return (
    <div className="page-container">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--on-surface)', marginBottom: 2 }}>
            {filters.search ? `Results for "${filters.search}"` : 'All Listings'}
          </h1>
          {pagination.total !== undefined && (
            <p style={{ fontSize: 13, color: 'var(--outline)', margin: 0 }}>
              {pagination.total} items found
            </p>
          )}
        </div>
        <div className="d-flex gap-2">
          <select
            className="sm-input" style={{ padding: '8px 12px', width: 'auto', fontSize: 13 }}
            value={filters.sort} onChange={(e) => setFilter('sort', e.target.value)}
          >
            {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <button
            className="btn btn-light btn-sm rounded-pill d-flex align-items-center gap-1"
            onClick={() => setShowFilters(!showFilters)}
            style={{ fontWeight: 600, fontSize: 13 }}
          >
            <FiFilter size={13} /> Filter
            {hasActiveFilters && <span className="badge bg-primary ms-1" style={{ borderRadius: 9999 }}>!</span>}
          </button>
        </div>
      </div>

      {/* Category Chips */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8, marginBottom: 16, scrollbarWidth: 'none' }}>
        <button
          className={`category-chip${!filters.category ? ' active' : ''}`}
          onClick={() => setFilter('category', '')}
        >
          All
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            className={`category-chip${filters.category === c.slug ? ' active' : ''}`}
            onClick={() => setFilter('category', filters.category === c.slug ? '' : c.slug)}
          >
            {c.icon} {c.name}
          </button>
        ))}
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="sm-card p-3 mb-4">
          <div className="row g-3 align-items-end">
            <div className="col-md-4">
              <label className="sm-label">Condition</label>
              <select className="sm-input" style={{ padding: '10px 12px' }}
                value={filters.condition} onChange={(e) => setFilter('condition', e.target.value)}>
                <option value="">Any Condition</option>
                {CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="col-md-4">
              <label className="sm-label">Search</label>
              <input className="sm-input" placeholder="Search..." value={filters.search}
                onChange={(e) => setFilter('search', e.target.value)} />
            </div>
            <div className="col-md-4">
              {hasActiveFilters && (
                <button className="btn-outline-sm w-100 d-flex align-items-center justify-content-center gap-2"
                  onClick={clearFilters}>
                  <FiX /> Clear All
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Products Grid */}
      <div className="row g-3">
        {loading
          ? Array(12).fill(0).map((_, i) => (
            <div key={i} className="col-6 col-md-4 col-lg-3"><SkeletonCard /></div>
          ))
          : products.length === 0
            ? (
              <div className="col-12 text-center py-5">
                <div style={{ fontSize: 48, marginBottom: 12 }}>🛍️</div>
                <h3 style={{ color: 'var(--outline)', fontWeight: 700 }}>No products found</h3>
                <p style={{ color: 'var(--outline)', fontSize: 14 }}>Try different filters or search terms</p>
                <button className="btn-outline-sm mt-3" onClick={clearFilters}>Clear Filters</button>
              </div>
            )
            : products.map((p) => (
              <div key={p.id} className="col-6 col-md-4 col-lg-3">
                <ProductCard product={p} />
              </div>
            ))
        }
      </div>

      {/* Pagination */}
      {!loading && pagination.pages > 1 && (
        <div className="d-flex justify-content-center gap-2 mt-4">
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
            <button key={p}
              onClick={() => setFilters((f) => ({ ...f, page: p }))}
              style={{
                width: 36, height: 36, borderRadius: '50%', border: 'none',
                background: filters.page === p ? 'var(--primary)' : 'var(--surface-container)',
                color: filters.page === p ? '#fff' : 'var(--on-surface)',
                fontWeight: 700, cursor: 'pointer', fontSize: 13,
              }}
            >{p}</button>
          ))}
        </div>
      )}
    </div>
  );
};

export default HomePage;
