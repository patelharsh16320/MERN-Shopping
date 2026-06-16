import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { productAPI, categoryAPI } from '../utils/api';
import ProductCard from '../components/ProductCard';
import { SkeletonCard } from '../components/Loader';
import { initPublicSocket } from '../utils/socket';
import './Products.css';
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

  // Auto-refresh when products are updated (import, create, update) without page reload
  useEffect(() => {
    const socket = initPublicSocket();
    const onUpdated = () => fetchProducts();
    socket.on('products_updated', onUpdated);
    return () => socket.off('products_updated', onUpdated);
  }, [fetchProducts]);

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
          <p className="products-hero-subtitle">
            {total > 0 ? `Showing ${total} products` : 'Discover our curated collection'}
          </p>
        </div>
      </div>

      <div className="container products-page-body">
        <button className="filter-toggle-btn" onClick={() => setFilterOpen(v => !v)}>
          <span>🔍 Filters {Object.values(filters).some(Boolean) ? '(active)' : ''}</span>
          <span>{filterOpen ? '▲' : '▼'}</span>
        </button>

        <div className="layout-sidebar">

          {/* Filters Sidebar */}
          <div className={`filter-sidebar animate-left${filterOpen ? ' filter-open' : ''}`}>
            <div className="products-filter-header">
              <h3 className="filter-title products-filter-title">🔍 Filters</h3>
              <button onClick={clearFilters} className="products-clear-btn">Clear All</button>
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
                  <span className="products-cat-count">{cat.productCount}</span>
                </div>
              ))}
              {categories.filter(c => c.productCount === 0).map(cat => (
                <div key={cat._id} className="products-cat-disabled">
                  <input type="checkbox" disabled className="products-cat-disabled-checkbox" />
                  {cat.icon} {cat.name}
                  <span className="products-cat-count">0</span>
                </div>
              ))}
            </div>

            {/* Price Range */}
            <div className="filter-group">
              <div className="filter-group-title">Price Range</div>
              <div className="products-price-grid">
                <input className="form-input products-price-input" placeholder="Min ₹" type="number" value={filters.minPrice} onChange={e => { setFilters(f => ({ ...f, minPrice: e.target.value })); setPage(1); }} />
                <input className="form-input products-price-input" placeholder="Max ₹" type="number" value={filters.maxPrice} onChange={e => { setFilters(f => ({ ...f, maxPrice: e.target.value })); setPage(1); }} />
              </div>
              {[499, 999, 1499].map(p => (
                <button key={p} onClick={() => { setFilters(f => ({ ...f, maxPrice: String(p) })); setPage(1); }}
                  className={`products-price-preset ${filters.maxPrice === String(p) ? 'active' : ''}`}>
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
            <div className="products-search-row">
              <div className="nav-search products-search-box">
                <span>🔍</span>
                <input placeholder="Search products..." value={filters.search}
                  onChange={e => { setFilters(f => ({ ...f, search: e.target.value })); setPage(1); }}
                  className="products-search-input" />
              </div>
              {filters.category && <span className="badge badge-shipped products-active-cat-badge">{filters.category} ✕</span>}
            </div>

            {loading ? (
              <div className="products-grid">{Array(12).fill(0).map((_, i) => <SkeletonCard key={i} />)}</div>
            ) : products.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">🛍️</div>
                <h3>No products found</h3>
                <p>Try adjusting your filters</p>
                <button className="btn btn-primary products-empty-clear-btn" onClick={clearFilters}>Clear Filters</button>
              </div>
            ) : (
              <>
                <div className="products-grid">
                  {products.map((p) => (
                    <div key={p._id} className="products-card-wrap">
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
