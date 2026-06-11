import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { productAPI, categoryAPI } from '../utils/api';
import ProductCard from '../components/ProductCard';
import { SkeletonCard } from '../components/Loader';
const sortOptions = [
  { label: 'Featured', value: '' },
  { label: 'Price: Low to High', value: 'price_asc' },
  { label: 'Price: High to Low', value: 'price_desc' },
  { label: 'Top Rated', value: 'rating' },
  { label: 'Newest', value: 'newest' },
];

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [categories, setCategories] = useState([]);
  const [filterOpen, setFilterOpen] = useState(false);

  useEffect(() => {
    categoryAPI.getAll().then(({ data }) => setCategories(data.filter(c => c.isActive))).catch(() => {});
  }, []);

  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    sort: '',
    minPrice: '',
    maxPrice: '',
    rating: '',
    search: searchParams.get('search') || '',
  });

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 12, ...filters };
      Object.keys(params).forEach(k => !params[k] && delete params[k]);
      const { data } = await productAPI.getAll(params);
      setProducts(data.products);
      setTotal(data.total);
      setTotalPages(data.pages);
    } catch { }
    setLoading(false);
  }, [filters, page]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  useEffect(() => {
    const cat = searchParams.get('category') || '';
    const search = searchParams.get('search') || '';
    setFilters(f => ({ ...f, category: cat, search }));
  }, [searchParams]);

  const updateFilter = (key, value) => {
    setFilters(f => ({ ...f, [key]: f[key] === value ? '' : value }));
    setPage(1);
  };

  const clearFilters = () => { setFilters({ category: '', sort: '', minPrice: '', maxPrice: '', rating: '', search: '' }); setPage(1); setSearchParams({}); };

  return (
    <div>
      <div className="page-hero">
        <div className="container">
          <h1 className="section-title gradient-text">✨ Shop Women HubClub</h1>
          <p style={{ color: '#636e72', fontSize: 16 }}>
            {total > 0 ? `Showing ${total} products` : 'Discover our curated collection'}
          </p>
        </div>
      </div>

      <div className="container" style={{ paddingBottom: 60 }}>
        <button className="filter-toggle-btn" onClick={() => setFilterOpen(v => !v)}>
          <span>🔍 Filters {Object.values(filters).some(Boolean) ? '(active)' : ''}</span>
          <span>{filterOpen ? '▲' : '▼'}</span>
        </button>

        <div className="layout-sidebar">

          {/* Filters Sidebar */}
          <div className={`filter-sidebar animate-left${filterOpen ? ' filter-open' : ''}`}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 className="filter-title" style={{ marginBottom: 0 }}>🔍 Filters</h3>
              <button onClick={clearFilters} style={{ fontSize: 12, color: '#6c63ff', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Clear All</button>
            </div>

            {/* Sort */}
            <div className="filter-group">
              <div className="filter-group-title">Sort By</div>
              <select className="form-select" value={filters.sort} onChange={e => { setFilters(f => ({ ...f, sort: e.target.value })); setPage(1); }}>
                {sortOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            {/* Category */}
            <div className="filter-group">
              <div className="filter-group-title">Category</div>
              {categories.filter(c => c.productCount > 0).map(cat => (
                <div key={cat._id} className={`filter-option ${filters.category === cat.name ? 'active' : ''}`} onClick={() => updateFilter('category', cat.name)}>
                  <input type="checkbox" checked={filters.category === cat.name} readOnly />
                  {cat.icon} {cat.name}
                  <span style={{ marginLeft: 'auto', fontSize: 11, color: '#9e9e9e' }}>{cat.productCount}</span>
                </div>
              ))}
              {categories.filter(c => c.productCount === 0).map(cat => (
                <div key={cat._id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 8, color: '#c8c8c8', fontSize: 13, cursor: 'not-allowed', userSelect: 'none' }}>
                  <input type="checkbox" disabled style={{ opacity: 0.3 }} />
                  {cat.icon} {cat.name}
                  <span style={{ marginLeft: 'auto', fontSize: 11 }}>0</span>
                </div>
              ))}
            </div>

            {/* Price Range */}
            <div className="filter-group">
              <div className="filter-group-title">Price Range</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <input className="form-input" placeholder="Min ₹" type="number" value={filters.minPrice} onChange={e => { setFilters(f => ({ ...f, minPrice: e.target.value })); setPage(1); }} style={{ padding: '8px 12px', fontSize: 13 }} />
                <input className="form-input" placeholder="Max ₹" type="number" value={filters.maxPrice} onChange={e => { setFilters(f => ({ ...f, maxPrice: e.target.value })); setPage(1); }} style={{ padding: '8px 12px', fontSize: 13 }} />
              </div>
              {[499, 999, 1499].map(p => (
                <button key={p} onClick={() => { setFilters(f => ({ ...f, maxPrice: String(p) })); setPage(1); }}
                  style={{ display: 'block', width: '100%', textAlign: 'left', background: filters.maxPrice === String(p) ? '#f0f0ff' : 'none', border: 'none', borderRadius: 10, padding: '8px 12px', cursor: 'pointer', fontSize: 13, marginBottom: 4, color: filters.maxPrice === String(p) ? '#6c63ff' : '#2d3436', fontFamily: 'Poppins' }}>
                  Under ₹{p}
                </button>
              ))}
            </div>

            {/* Rating */}
            <div className="filter-group">
              <div className="filter-group-title">Min Rating</div>
              {[4, 3, 2].map(r => (
                <div key={r} className={`filter-option ${filters.rating === String(r) ? 'active' : ''}`} onClick={() => updateFilter('rating', String(r))}>
                  {'⭐'.repeat(r)} & above
                </div>
              ))}
            </div>
          </div>

          {/* Products Grid */}
          <div className="animate-right">
            {/* Search Bar */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 24, alignItems: 'center' }}>
              <div className="nav-search" style={{ flex: 1, background: 'white', border: '2px solid #e0e0f0' }}>
                <span>🔍</span>
                <input placeholder="Search products..." value={filters.search}
                  onChange={e => { setFilters(f => ({ ...f, search: e.target.value })); setPage(1); }}
                  style={{ width: '100%', padding: '4px 0' }} />
              </div>
              {filters.category && <span className="badge badge-shipped" style={{ padding: '8px 16px' }}>{filters.category} ✕</span>}
            </div>

            {loading ? (
              <div className="products-grid">{Array(12).fill(0).map((_, i) => <SkeletonCard key={i} />)}</div>
            ) : products.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">🛍️</div>
                <h3>No products found</h3>
                <p>Try adjusting your filters</p>
                <button className="btn btn-primary" onClick={clearFilters} style={{ marginTop: 16 }}>Clear Filters</button>
              </div>
            ) : (
              <>
                <div className="products-grid">
                  {products.map((p, i) => (
                    <div key={p._id} style={{ animation: `fadeIn ${0.2 + i * 0.05}s ease` }}>
                      <ProductCard product={p} />
                    </div>
                  ))}
                </div>
                {totalPages > 1 && (
                  <div className="pagination">
                    <button className="page-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>←</button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                      <button key={p} className={`page-btn ${page === p ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
                    ))}
                    <button className="page-btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>→</button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
