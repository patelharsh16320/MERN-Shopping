import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { toast } from 'react-toastify';
import './Compare.css';

const COMPARE_KEY = 'compare_list';

export default function Compare() {
  const [products, setProducts] = useState([]);
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const load = () => {
    try { setProducts(JSON.parse(localStorage.getItem(COMPARE_KEY) || '[]')); } catch { setProducts([]); }
  };

  useEffect(() => {
    load();
    window.addEventListener('compare_updated', load);
    return () => window.removeEventListener('compare_updated', load);
  }, []);

  const remove = (id) => {
    const updated = products.filter(p => p._id !== id);
    setProducts(updated);
    localStorage.setItem(COMPARE_KEY, JSON.stringify(updated));
  };

  const clearAll = () => {
    setProducts([]);
    localStorage.setItem(COMPARE_KEY, '[]');
  };

  if (products.length === 0) {
    return (
      <div style={{ maxWidth: 600, margin: '60px auto', textAlign: 'center', padding: '0 20px' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>⚖️</div>
        <h2 style={{ fontWeight: 800, fontSize: 24, marginBottom: 8 }}>No Products to Compare</h2>
        <p style={{ color: '#636e72', marginBottom: 24 }}>Add up to 3 products using the ⚖️ Compare button on any product card.</p>
        <Link to="/products" className="btn btn-primary">🌸 Browse Products</Link>
      </div>
    );
  }

  const rows = [
    { label: 'Image', render: (p) => <img src={p.images?.[0] || 'https://images.unsplash.com/photo-1520412099551-62b6bafeb5bb?w=200'} alt={p.name} style={{ width: '100%', maxHeight: 160, objectFit: 'cover', borderRadius: 12 }} onError={e => e.target.src = 'https://images.unsplash.com/photo-1520412099551-62b6bafeb5bb?w=200'} /> },
    { label: 'Category', render: (p) => <span style={{ color: '#6c63ff', fontWeight: 600, fontSize: 13 }}>{p.category}</span> },
    { label: 'Price', render: (p) => <div><span style={{ fontWeight: 800, fontSize: 18, color: '#2d3436' }}>₹{p.price}</span>{p.originalPrice > p.price && <span style={{ textDecoration: 'line-through', color: '#9e9e9e', marginLeft: 8, fontSize: 13 }}>₹{p.originalPrice}</span>}</div> },
    { label: 'Discount', render: (p) => p.discount > 0 ? <span style={{ background: '#e8fff5', color: '#00b894', padding: '3px 10px', borderRadius: 20, fontWeight: 700, fontSize: 13 }}>{p.discount}% off</span> : <span style={{ color: '#bdbdbd' }}>—</span> },
    { label: 'Rating', render: (p) => <div>{'⭐'.repeat(Math.round(p.rating || 0))}<span style={{ color: '#636e72', fontSize: 12, marginLeft: 6 }}>({p.numReviews || 0})</span></div> },
    { label: 'Stock', render: (p) => p.stock > 0 ? <span style={{ color: '#00b894', fontWeight: 600 }}>✅ {p.stock} units</span> : <span style={{ color: '#d63031', fontWeight: 600 }}>❌ Out of stock</span> },
    { label: 'Actions', render: (p) => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button className="btn btn-primary btn-sm" onClick={() => { addToCart(p, 1); toast.success(`🛒 ${p.name} added!`, { autoClose: 1500 }); }} disabled={p.stock === 0}>🛒 Add to Cart</button>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate(p.slug ? `/products/${p.slug}` : `/products/${p._id}`)}>View Details</button>
      </div>
    )},
  ];

  return (
    <div style={{ padding: '20px 0 60px' }}>
      <div className="page-hero">
        <div className="container">
          <h1 className="section-title gradient-text">⚖️ Compare Products</h1>
          <p style={{ color: '#636e72' }}>Comparing {products.length} product{products.length > 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="container" style={{ marginTop: 32 }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 400 }}>
            <thead>
              <tr>
                <th style={{ width: 120, padding: '12px 16px', textAlign: 'left', color: '#636e72', fontWeight: 600, fontSize: 13 }}>Feature</th>
                {products.map(p => (
                  <th key={p._id} style={{ padding: '12px 16px', textAlign: 'center', minWidth: 180 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>{p.name}</div>
                    <button onClick={() => remove(p._id)} style={{ background: '#fff0f0', border: 'none', color: '#d63031', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>✕ Remove</button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={row.label} style={{ background: i % 2 === 0 ? '#fafafa' : 'white' }}>
                  <td style={{ padding: '14px 16px', fontWeight: 700, fontSize: 13, color: '#2d3436', borderRight: '2px solid #f0f0f0' }}>{row.label}</td>
                  {products.map(p => (
                    <td key={p._id} style={{ padding: '14px 16px', textAlign: 'center', verticalAlign: 'middle' }}>{row.render(p)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: 24, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <button onClick={clearAll} style={{ background: '#fff0f0', border: '2px solid #ffcdd2', color: '#d63031', borderRadius: 20, padding: '8px 20px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>🗑 Clear All</button>
          <Link to="/products" style={{ color: '#6c63ff', fontWeight: 600, fontSize: 14, textDecoration: 'none' }}>← Add More Products</Link>
        </div>
      </div>
    </div>
  );
}
