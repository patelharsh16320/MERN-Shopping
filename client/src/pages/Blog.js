import React, { useState, useEffect, useRef } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';

function useInView(threshold = 0.12) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

export const blogPosts = [
  {
    slug: 'morning-skincare-routine-2026',
    category: 'Skincare',
    emoji: '✨',
    title: 'The Perfect Morning Skincare Routine for 2026',
    subtitle: 'Science-backed steps for a radiant, protected complexion every single morning.',
    author: { name: 'Anjali Mehta', role: 'Head of Curation', emoji: '✨' },
    date: 'June 5, 2026',
    readTime: '5 min read',
    coverColor: '#fff0f5',
    tags: ['Skincare', 'Morning Routine', 'SPF'],
    excerpt: 'A well-structured morning skincare routine can transform your complexion in as little as 4 weeks. Here\'s what our experts swear by.',
    body: [
      { type: 'paragraph', text: 'Your morning routine sets the tone for your entire skin day. After 8 hours of sleep, your skin has repaired and regenerated — and needs the right products in the right order to lock in that overnight work.' },
      { type: 'heading', text: 'Step 1: Gentle Cleanser' },
      { type: 'paragraph', text: 'Start with a sulphate-free foaming cleanser to remove overnight sebum without stripping moisture. Our Rose Glow Face Wash uses aloe vera and salicylic acid for a balanced, fresh start.' },
      { type: 'tip', text: 'Use lukewarm (never hot) water. Hot water breaks down the skin\'s lipid barrier, leading to dryness and sensitivity.' },
      { type: 'heading', text: 'Step 2: Vitamin C Serum' },
      { type: 'paragraph', text: 'Vitamin C is your morning superhero — it neutralises free radicals from pollution and UV exposure, brightens dark spots, and boosts collagen. Apply 3-4 drops to damp skin for maximum absorption.' },
      { type: 'heading', text: 'Step 3: Moisturiser' },
      { type: 'paragraph', text: 'While your serum is still slightly damp, apply a lightweight moisturiser. Look for hyaluronic acid to lock in hydration and niacinamide to regulate sebum. Your skin should feel plump, not greasy.' },
      { type: 'heading', text: 'Step 4: SPF 50 (Non-Negotiable)' },
      { type: 'paragraph', text: 'Sunscreen is the single most impactful anti-ageing product available. Apply generously every morning — including overcast days and when working indoors near windows. UVA rays penetrate glass.' },
      { type: 'tip', text: 'If you\'re reapplying during the day, use an SPF setting spray over makeup. It\'s just as effective and far more convenient.' },
    ]
  },
  {
    slug: 'clean-beauty-guide-beginners',
    category: 'Beauty',
    emoji: '🌿',
    title: 'Clean Beauty: The Beginner\'s Complete Guide',
    subtitle: 'What "clean beauty" really means, which ingredients to avoid, and how to make the switch without overwhelming your routine.',
    author: { name: 'Priya Sharma', role: 'Founder & CEO', emoji: '💗' },
    date: 'June 1, 2026',
    readTime: '7 min read',
    coverColor: '#fce4ec',
    tags: ['Clean Beauty', 'Ingredients', 'Cruelty-Free'],
    excerpt: 'The clean beauty movement is more than a trend — it\'s a shift in how we think about what we put on our bodies. Here\'s how to navigate it.',
    body: [
      { type: 'paragraph', text: 'Clean beauty means different things to different people, but at Women HubClub we define it as: products free from ingredients that are potentially harmful to human health or the environment, and that have been formulated with transparency.' },
      { type: 'heading', text: 'The Dirty Dozen — Ingredients to Avoid' },
      { type: 'paragraph', text: 'When reading labels, watch for parabens (methylparaben, propylparaben), sodium lauryl sulphate (SLS), formaldehyde-releasing preservatives, synthetic fragrances (listed as "parfum" or "fragrance"), and oxybenzone in sunscreens.' },
      { type: 'tip', text: 'Download the INCI Decoder app. Scan any product barcode and it will flag potentially harmful ingredients in plain language.' },
      { type: 'heading', text: 'Cruelty-Free vs Vegan: What\'s the Difference?' },
      { type: 'paragraph', text: 'Cruelty-free means no animal testing at any stage of production. Vegan means no animal-derived ingredients. A product can be cruelty-free but not vegan (e.g., it contains beeswax). At Women HubClub, we clearly label both attributes on every product page.' },
      { type: 'heading', text: 'Making the Switch Without a Full Overhaul' },
      { type: 'paragraph', text: 'You don\'t need to throw out everything overnight. The most effective approach: as each product runs out, replace it with a clean alternative. Start with leave-on products (moisturisers, serums) since they have more skin exposure time than rinse-off products.' },
    ]
  },
  {
    slug: 'yoga-for-glowing-skin',
    category: 'Wellness',
    emoji: '🧘',
    title: '7 Yoga Poses for Glowing Skin',
    subtitle: 'Increase circulation, reduce stress hormones, and unlock your natural radiance with these daily poses.',
    author: { name: 'Kavya Nair', role: 'Community Manager', emoji: '💪' },
    date: 'May 28, 2026',
    readTime: '4 min read',
    coverColor: '#fff8fb',
    tags: ['Wellness', 'Yoga', 'Fitness'],
    excerpt: 'The gut-skin axis, stress-cortisol connection, and improved circulation all make yoga one of the most underrated skincare tools available.',
    body: [
      { type: 'paragraph', text: 'Glowing skin isn\'t just built in a jar. Physical movement — especially yoga — directly impacts skin health through improved circulation, reduced cortisol, and better lymphatic drainage.' },
      { type: 'heading', text: 'Why Yoga Works for Skin' },
      { type: 'paragraph', text: 'Cortisol (your stress hormone) breaks down collagen and triggers sebum overproduction, leading to breakouts and premature ageing. A regular yoga practice reduces cortisol significantly within 8 weeks.' },
      { type: 'tip', text: 'Even 15 minutes of yoga before your skincare routine increases blood flow to facial skin, making your serums and moisturisers more effective.' },
      { type: 'heading', text: 'Top 7 Poses' },
      { type: 'paragraph', text: '1. Downward Dog (Adho Mukha Svanasana) — increases blood flow to the face. 2. Fish Pose (Matsyasana) — opens chest and throat, stimulating thyroid. 3. Spinal Twist — aids digestion and detox. 4. Child\'s Pose — reduces stress immediately. 5. Plow Pose — stimulates thyroid. 6. Camel Pose — opens chest, boosts energy. 7. Legs Up the Wall — drains lymph and reduces puffiness.' },
      { type: 'heading', text: 'The Routine' },
      { type: 'paragraph', text: 'Hold each pose for 30-60 seconds. Practice this sequence 3-4 times per week. Combined with a consistent skincare routine and adequate hydration, most people notice visible improvements in skin texture within 3-4 weeks.' },
    ]
  },
  {
    slug: 'hair-care-monsoon-season',
    category: 'Hair Care',
    emoji: '💆',
    title: 'Monsoon Hair Care: Protect Your Hair This Season',
    subtitle: 'Everything you need to know about keeping your hair strong, frizz-free, and healthy through the rains.',
    author: { name: 'Anjali Mehta', role: 'Head of Curation', emoji: '✨' },
    date: 'May 22, 2026',
    readTime: '6 min read',
    coverColor: '#e8f5e9',
    tags: ['Hair Care', 'Monsoon', 'Frizz'],
    excerpt: 'High humidity, fungal build-up, and weakened hair from constant wetting make monsoon the toughest season for hair. Here\'s your survival guide.',
    body: [
      { type: 'paragraph', text: 'The monsoon season brings high humidity — sometimes 80-90% in coastal cities — which causes the hair shaft to swell and the cuticle to lift. The result: frizz, breakage, scalp infections, and dull hair.' },
      { type: 'heading', text: 'Scalp Health First' },
      { type: 'paragraph', text: 'Monsoon creates ideal conditions for fungal and bacterial growth on the scalp. Wash your hair 3-4 times per week using an antifungal shampoo with ketoconazole or zinc pyrithione. Avoid going to bed with wet hair.' },
      { type: 'tip', text: 'Apply a few drops of tea tree oil mixed with coconut carrier oil to your scalp 30 minutes before washing. It\'s a natural antifungal.' },
      { type: 'heading', text: 'The Frizz Solution' },
      { type: 'paragraph', text: 'The key to monsoon frizz control is sealing the cuticle. Use a leave-in conditioner with humectants (glycerin, aloe vera) and then a light oil (argan or camellia) to seal. Apply to damp, not dripping wet, hair.' },
      { type: 'heading', text: 'Weekly Deep Conditioning' },
      { type: 'paragraph', text: 'Once a week, apply a protein-rich hair mask for 20-30 minutes under a shower cap. Protein fills in weakened spots on the hair shaft, dramatically reducing breakage. Follow with a moisture mask the next week to keep the protein-moisture balance right.' },
    ]
  },
  {
    slug: 'self-care-sunday-routine',
    category: 'Wellness',
    emoji: '💅',
    title: 'The Ultimate Self-Care Sunday Routine',
    subtitle: 'Reclaim your Sundays with a rejuvenating full-body ritual that sets you up for the week ahead.',
    author: { name: 'Priya Sharma', role: 'Founder & CEO', emoji: '💗' },
    date: 'May 18, 2026',
    readTime: '5 min read',
    coverColor: '#fff0f5',
    tags: ['Self-Care', 'Wellness', 'Mental Health'],
    excerpt: 'Sunday self-care isn\'t a luxury — it\'s a strategic investment in your mental and physical wellbeing for the week ahead.',
    body: [
      { type: 'paragraph', text: 'In our always-on culture, carving out intentional self-care time is not selfish — it\'s essential. A structured Sunday routine can reduce anxiety, improve sleep quality, and make Monday feel manageable.' },
      { type: 'heading', text: 'Morning (8-10 AM): Body & Mind Reset' },
      { type: 'paragraph', text: 'Start with 20 minutes of yoga or stretching, followed by a 10-minute meditation. Brew herbal tea and sit without your phone for at least 15 minutes. This cortisol-clearing window sets a calm tone for the day.' },
      { type: 'tip', text: 'Leave your phone on airplane mode until 10 AM. Research shows that morning phone use activates the brain\'s anxiety pathways before it\'s ready.' },
      { type: 'heading', text: 'Midday (11 AM-1 PM): Skin & Hair Ritual' },
      { type: 'paragraph', text: 'Apply a hair mask, then do your full skincare ritual — double cleanse, exfoliate (AHA/BHA), face mask, then your serum, moisturiser and facial massage. This is the perfect time for any at-home treatments that need to sit longer.' },
      { type: 'heading', text: 'Afternoon (2-4 PM): Nourish & Move' },
      { type: 'paragraph', text: 'Cook a nourishing meal with skin-loving ingredients (leafy greens, fatty fish, nuts). Then go for a 30-minute walk in nature — even a local park counts. Natural light exposure in the afternoon regulates your circadian rhythm.' },
    ]
  },
  {
    slug: 'gut-health-skin-connection',
    category: 'Nutrition',
    emoji: '🌱',
    title: 'Your Gut is Your Skin\'s Best Friend',
    subtitle: 'Understanding the gut-skin axis and what to eat for a clear, glowing complexion from the inside out.',
    author: { name: 'Kavya Nair', role: 'Community Manager', emoji: '💪' },
    date: 'May 12, 2026',
    readTime: '8 min read',
    coverColor: '#fce4ec',
    tags: ['Nutrition', 'Gut Health', 'Clear Skin'],
    excerpt: 'Emerging research shows that your microbiome directly influences skin conditions from acne to eczema. Here\'s what the science says.',
    body: [
      { type: 'paragraph', text: 'The gut-skin axis is one of the most exciting areas of dermatological research. Your intestinal microbiome — the trillions of bacteria living in your gut — communicates directly with your skin via inflammatory pathways, the immune system, and hormonal signals.' },
      { type: 'heading', text: 'How Gut Inflammation Shows on Skin' },
      { type: 'paragraph', text: 'When the gut lining is compromised (a condition called increased intestinal permeability or "leaky gut"), bacterial byproducts enter the bloodstream and trigger systemic inflammation. This manifests on skin as acne, rosacea, eczema, or accelerated ageing.' },
      { type: 'tip', text: 'A 2021 study found that people with acne had significantly different gut microbiome compositions compared to clear-skin controls. Probiotic supplementation improved acne severity in 12 weeks.' },
      { type: 'heading', text: 'Foods That Transform Your Skin' },
      { type: 'paragraph', text: 'Fermented foods (yogurt, kefir, kimchi, miso) feed beneficial bacteria. Prebiotic foods (garlic, onion, oats, banana) feed those bacteria. Omega-3 fats (fatty fish, flaxseed, walnuts) reduce inflammation. Polyphenols (berries, dark chocolate, green tea) act as antioxidants that reach the skin.' },
      { type: 'heading', text: 'The 30-Day Gut Reset Protocol' },
      { type: 'paragraph', text: 'Remove: refined sugar, seed oils (sunflower, canola), ultra-processed food. Restore: add 1 fermented food per day. Reinoculate: take a high-CFU multi-strain probiotic. Repair: add bone broth, collagen peptides, and zinc. Most people notice skin improvements within 3-4 weeks.' },
    ]
  },
];

const categories = ['All', 'Skincare', 'Beauty', 'Wellness', 'Hair Care', 'Nutrition'];

/* ────── Blog List ────── */
export function BlogList() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [heroRef, heroVisible] = useInView(0.1);

  const filtered = blogPosts.filter(p =>
    (filter === 'All' || p.category === filter) &&
    (!search || p.title.toLowerCase().includes(search.toLowerCase()) || p.tags.some(t => t.toLowerCase().includes(search.toLowerCase())))
  );

  return (
    <div>
      {/* Hero */}
      <div className="page-hero" style={{ textAlign: 'center', padding: '72px 24px', background: 'linear-gradient(135deg,#fff0f5,#fce4ec)' }}>
        <div className="container" ref={heroRef}>
          <div style={{ fontSize: 52, marginBottom: 14, animation: 'bounceIn 0.7s ease' }}>📝</div>
          <h1 className="section-title" style={{ fontSize: 42, color: 'var(--primary)', marginBottom: 12, opacity: heroVisible ? 1 : 0, transform: heroVisible ? 'none' : 'translateY(20px)', transition: 'all 0.7s ease' }}>
            Women HubClub Blog
          </h1>
          <p style={{ color: '#757575', fontSize: 16, maxWidth: 560, margin: '0 auto 28px', lineHeight: 1.8, opacity: heroVisible ? 1 : 0, transition: 'all 0.7s 0.15s ease' }}>
            Expert-curated beauty, wellness and lifestyle content for the modern woman.
          </p>

          {/* Search */}
          <div style={{ maxWidth: 440, margin: '0 auto', opacity: heroVisible ? 1 : 0, transition: 'all 0.7s 0.3s ease' }}>
            <div className="nav-search" style={{ background: 'white', border: '2px solid #fce4ec', borderRadius: 50, padding: '8px 20px' }}>
              <span>🔍</span>
              <input placeholder="Search articles…" value={search} onChange={e => setSearch(e.target.value)} style={{ width: '100%', background: 'none', border: 'none', outline: 'none', fontFamily: 'Poppins', fontSize: 14, padding: '4px 0' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Category pills */}
      <div style={{ background: 'white', borderBottom: '1px solid #fce4ec', padding: '14px 24px' }}>
        <div className="container" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
          {categories.map(cat => (
            <button key={cat} onClick={() => setFilter(cat)}
              style={{ padding: '7px 20px', borderRadius: 20, border: `2px solid ${filter === cat ? 'var(--primary)' : '#fce4ec'}`, background: filter === cat ? 'var(--primary)' : 'white', color: filter === cat ? 'white' : '#555', fontWeight: 600, cursor: 'pointer', fontSize: 13, fontFamily: 'Poppins', transition: 'all 0.2s' }}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="container" style={{ paddingTop: 48, paddingBottom: 72 }}>
        {/* Featured post */}
        {filter === 'All' && !search && (
          <div style={{ marginBottom: 48 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>✨ Featured Post</div>
            <div onClick={() => navigate(`/blog/${blogPosts[0].slug}`)}
              style={{ background: blogPosts[0].coverColor, borderRadius: 24, padding: '40px 36px', cursor: 'pointer', border: '1px solid #fce4ec', display: 'grid', gridTemplateColumns: '1fr auto', gap: 28, alignItems: 'center', transition: 'all 0.25s' }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 12px 36px rgba(194,24,91,0.14)'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}>
              <div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                  <span style={{ background: 'var(--primary)', color: 'white', borderRadius: 20, padding: '3px 12px', fontSize: 11, fontWeight: 700 }}>{blogPosts[0].category}</span>
                  <span style={{ background: 'white', color: '#757575', borderRadius: 20, padding: '3px 12px', fontSize: 11 }}>⏱ {blogPosts[0].readTime}</span>
                </div>
                <h2 style={{ fontWeight: 800, fontSize: 26, color: '#212121', marginBottom: 10, lineHeight: 1.3 }}>{blogPosts[0].title}</h2>
                <p style={{ color: '#757575', fontSize: 14, lineHeight: 1.7, marginBottom: 16, maxWidth: 560 }}>{blogPosts[0].excerpt}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#c2185b,#f06292)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{blogPosts[0].author.emoji}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{blogPosts[0].author.name}</div>
                    <div style={{ fontSize: 11, color: '#9e9e9e' }}>{blogPosts[0].date}</div>
                  </div>
                </div>
              </div>
              <div style={{ fontSize: 96, opacity: 0.4, flexShrink: 0 }}>{blogPosts[0].emoji}</div>
            </div>
          </div>
        )}

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📝</div>
            <h3>No articles found</h3>
            <p>Try a different search or category</p>
            <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => { setFilter('All'); setSearch(''); }}>Show All Articles</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
            {(filter === 'All' && !search ? filtered.slice(1) : filtered).map((post, i) => (
              <div key={post.slug}
                style={{ background: post.coverColor, borderRadius: 20, padding: '28px 24px', cursor: 'pointer', border: '1px solid #fce4ec', transition: 'all 0.25s', animation: `fadeIn ${0.2 + i * 0.08}s ease` }}
                onClick={() => navigate(`/blog/${post.slug}`)}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 10px 28px rgba(194,24,91,0.12)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}>
                <div style={{ fontSize: 44, marginBottom: 16 }}>{post.emoji}</div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                  <span style={{ background: 'var(--primary)', color: 'white', borderRadius: 20, padding: '2px 10px', fontSize: 10, fontWeight: 700 }}>{post.category}</span>
                  <span style={{ background: 'white', color: '#757575', borderRadius: 20, padding: '2px 10px', fontSize: 10 }}>⏱ {post.readTime}</span>
                </div>
                <h3 style={{ fontWeight: 800, fontSize: 17, marginBottom: 10, lineHeight: 1.35, color: '#212121' }}>{post.title}</h3>
                <p style={{ color: '#757575', fontSize: 13, lineHeight: 1.7, marginBottom: 16 }}>{post.excerpt}</p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg,#c2185b,#f06292)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>{post.author.emoji}</div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 12 }}>{post.author.name}</div>
                      <div style={{ fontSize: 11, color: '#9e9e9e' }}>{post.date}</div>
                    </div>
                  </div>
                  <span style={{ color: 'var(--primary)', fontWeight: 700, fontSize: 13 }}>Read →</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Newsletter */}
      <div style={{ background: 'linear-gradient(135deg,#c2185b,#880e4f)', padding: '56px 24px', textAlign: 'center' }}>
        <div className="container">
          <div style={{ fontSize: 36, marginBottom: 10 }}>💌</div>
          <h2 style={{ color: 'white', fontWeight: 800, fontSize: 26, marginBottom: 10 }}>Never Miss a Beauty Tip</h2>
          <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: 24, fontSize: 14 }}>New articles every week. Zero spam.</p>
          <div style={{ display: 'flex', maxWidth: 400, margin: '0 auto', borderRadius: 50, overflow: 'hidden', boxShadow: '0 8px 30px rgba(0,0,0,0.2)' }}>
            <input placeholder="your@email.com" style={{ flex: 1, padding: '14px 20px', border: 'none', outline: 'none', fontFamily: 'Poppins', fontSize: 14, minWidth: 0 }} />
            <button className="btn btn-primary" style={{ borderRadius: 0, padding: '14px 22px', flexShrink: 0, background: 'white', color: 'var(--primary)', fontWeight: 700 }}>Subscribe</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ────── Blog Post ────── */
export function BlogPost() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const post = blogPosts.find(p => p.slug === slug);
  const related = blogPosts.filter(p => p.slug !== slug && p.category === post?.category).slice(0, 2);
  const [contentRef, contentVisible] = useInView(0.05);

  if (!post) {
    return (
      <div className="empty-state" style={{ minHeight: '60vh' }}>
        <div className="empty-state-icon">📝</div>
        <h3>Article not found</h3>
        <Link to="/blog" className="btn btn-primary" style={{ marginTop: 16 }}>← Back to Blog</Link>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ background: post.coverColor, padding: '56px 24px 40px', borderBottom: '1px solid #fce4ec' }}>
        <div className="container" style={{ maxWidth: 760 }}>
          <button className="btn btn-secondary btn-sm" style={{ marginBottom: 20 }} onClick={() => navigate('/blog')}>← Back to Blog</button>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            <span style={{ background: 'var(--primary)', color: 'white', borderRadius: 20, padding: '4px 14px', fontSize: 12, fontWeight: 700 }}>{post.category}</span>
            <span style={{ background: 'white', color: '#757575', borderRadius: 20, padding: '4px 14px', fontSize: 12 }}>⏱ {post.readTime}</span>
            <span style={{ background: 'white', color: '#757575', borderRadius: 20, padding: '4px 14px', fontSize: 12 }}>📅 {post.date}</span>
          </div>
          <h1 style={{ fontWeight: 800, fontSize: 'clamp(24px,4vw,36px)', lineHeight: 1.25, marginBottom: 14, color: '#212121' }}>{post.title}</h1>
          <p style={{ color: '#757575', fontSize: 16, lineHeight: 1.7, marginBottom: 24 }}>{post.subtitle}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg,#c2185b,#f06292)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{post.author.emoji}</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{post.author.name}</div>
              <div style={{ fontSize: 12, color: '#9e9e9e' }}>{post.author.role}</div>
            </div>
            <div style={{ fontSize: 60, marginLeft: 'auto', opacity: 0.25 }}>{post.emoji}</div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="container" style={{ maxWidth: 760, paddingTop: 40, paddingBottom: 60 }}>
        <div ref={contentRef} style={{ opacity: contentVisible ? 1 : 0, transform: contentVisible ? 'none' : 'translateY(20px)', transition: 'all 0.7s ease' }}>
          {post.body.map((block, i) => {
            if (block.type === 'paragraph') return <p key={i} style={{ color: '#424242', fontSize: 16, lineHeight: 1.9, marginBottom: 20 }}>{block.text}</p>;
            if (block.type === 'heading') return <h2 key={i} style={{ fontWeight: 800, fontSize: 20, color: 'var(--primary)', marginTop: 32, marginBottom: 12 }}>{block.text}</h2>;
            if (block.type === 'tip') return (
              <div key={i} style={{ background: '#fff0f5', borderLeft: '4px solid var(--primary)', borderRadius: '0 12px 12px 0', padding: '16px 20px', margin: '24px 0', display: 'flex', gap: 12 }}>
                <span style={{ fontSize: 20, flexShrink: 0 }}>💡</span>
                <p style={{ color: '#555', fontSize: 14, lineHeight: 1.7, margin: 0 }}>{block.text}</p>
              </div>
            );
            return null;
          })}
        </div>

        {/* Tags */}
        <div style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: '#9e9e9e', marginBottom: 10 }}>Tagged in:</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {post.tags.map(tag => <span key={tag} className="tag">#{tag}</span>)}
          </div>
        </div>

        {/* Author card */}
        <div style={{ background: '#fff8fb', borderRadius: 20, padding: 28, border: '1px solid #fce4ec', marginTop: 32, display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg,#c2185b,#f06292)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, flexShrink: 0 }}>{post.author.emoji}</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 17, marginBottom: 3 }}>{post.author.name}</div>
            <div style={{ color: 'var(--primary)', fontWeight: 600, fontSize: 13, marginBottom: 6 }}>{post.author.role}, Women HubClub</div>
            <p style={{ color: '#757575', fontSize: 13, lineHeight: 1.7 }}>Our expert team tests and curates every tip and product recommendation on this blog to ensure it meets our clean beauty standards.</p>
          </div>
        </div>

        {/* Related posts */}
        {related.length > 0 && (
          <div style={{ marginTop: 48 }}>
            <h3 style={{ fontWeight: 800, fontSize: 20, marginBottom: 20, color: '#212121' }}>You Might Also Like</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
              {related.map(rel => (
                <div key={rel.slug} onClick={() => navigate(`/blog/${rel.slug}`)}
                  style={{ background: rel.coverColor, borderRadius: 16, padding: '22px 20px', cursor: 'pointer', border: '1px solid #fce4ec', transition: 'all 0.25s' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(194,24,91,0.12)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}>
                  <div style={{ fontSize: 36, marginBottom: 12 }}>{rel.emoji}</div>
                  <span style={{ background: 'var(--primary)', color: 'white', borderRadius: 20, padding: '2px 10px', fontSize: 10, fontWeight: 700 }}>{rel.category}</span>
                  <h4 style={{ fontWeight: 700, fontSize: 14, marginTop: 10, marginBottom: 6, lineHeight: 1.35, color: '#212121' }}>{rel.title}</h4>
                  <span style={{ color: 'var(--primary)', fontWeight: 700, fontSize: 13 }}>Read →</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default BlogList;
