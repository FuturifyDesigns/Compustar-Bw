import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight, Cable, Camera, CheckCircle2, Cpu, Mail, MapPin, Menu, Monitor, PackageSearch, Phone, Printer, Search, ShieldCheck, Wrench, X } from 'lucide-react';
import products from './products.json';
import './styles.css';

gsap.registerPlugin(ScrollTrigger);

const email = 'compustarbw@gmail.com';
const phone = '76004665';
const location = 'Shop 6U (Upstairs), Game City Mall, Gaborone, Botswana';
const pages = ['Home', 'Products', 'Services', 'Repairs', 'Location', 'Contact'];
const categories = ['All', ...Array.from(new Set(products.map((product) => product.category)))];
const featuredProducts = products.slice(0, 6);

function App() {
  const [page, setPage] = useState(getInitialPage);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onHashChange = () => setPage(getInitialPage());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setMenuOpen(false);
  }, [page]);

  useRevealAnimations(page);

  return (
    <>
      <Header menuOpen={menuOpen} page={page} setMenuOpen={setMenuOpen} />
      <main>
        {page === 'Home' && <HomePage />}
        {page === 'Products' && <ProductsPage />}
        {page === 'Services' && <ServicesPage />}
        {page === 'Repairs' && <RepairsPage />}
        {page === 'Location' && <LocationPage />}
        {page === 'Contact' && <ContactPage />}
      </main>
      <Footer />
    </>
  );
}

function getInitialPage() {
  const value = window.location.hash.replace('#/', '').replace('#', '');
  return pages.includes(value) ? value : 'Home';
}

function route(page) {
  return page === 'Home' ? '#/' : `#/${page}`;
}

function useRevealAnimations(page) {
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('[data-hero]', { autoAlpha: 0, y: 34, duration: 0.85, stagger: 0.08, ease: 'power3.out' });
      gsap.utils.toArray('[data-reveal]').forEach((element) => {
        gsap.from(element, { autoAlpha: 0, y: 26, duration: 0.65, ease: 'power2.out', scrollTrigger: { trigger: element, start: 'top 86%' } });
      });
    });
    return () => ctx.revert();
  }, [page]);
}

function Header({ menuOpen, page, setMenuOpen }) {
  return (
    <header className="site-header">
      <a className="brand" href={route('Home')} aria-label="Compustar home"><img src="/logo.png" alt="Compustar logo" /></a>
      <button className="menu-button" onClick={() => setMenuOpen((open) => !open)} aria-label="Toggle menu">{menuOpen ? <X /> : <Menu />}</button>
      <nav className={menuOpen ? 'open' : ''}>{pages.map((item) => <a className={page === item ? 'active' : ''} href={route(item)} key={item}>{item}</a>)}</nav>
    </header>
  );
}

function HomePage() {
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <p className="kicker" data-hero>Compustar Botswana</p>
          <h1 data-hero>Technology products and support customers can actually ask about.</h1>
          <p data-hero>Browse featured products, request availability, and get help with computers, printers, surveillance systems, networking, and repairs.</p>
          <div className="hero-actions" data-hero><a className="button primary" href={route('Products')}>Browse Products <ArrowRight size={18} /></a><a className="button secondary" href={route('Location')}>Find the Store</a></div>
        </div>
        <div className="hero-showcase" data-hero><img src="/logo.png" alt="Compustar logo" /><div><span><Camera /> Surveillance</span><span><Monitor /> Computers</span><span><Cable /> Networking</span></div></div>
      </section>
      <section className="quick-paths">
        {[[PackageSearch, 'Product Enquiries', 'Browse standalone product photos and ask about current availability.'], [Wrench, 'Repairs & Upgrades', 'Support for slow computers, setup issues, upgrades, and diagnostics.'], [ShieldCheck, 'Security & Networking', 'Camera systems, GPS trackers, network cables, and office connectivity.']].map(([Icon, title, text]) => <article key={title} data-reveal><Icon /><h3>{title}</h3><p>{text}</p></article>)}
      </section>
      <section className="section"><SectionIntro eyebrow="Featured products" title="Clean product cards, no screenshot clutter." text="Visitors see real product photos as standalone cards, then contact Compustar to confirm availability or visit the store." /><ProductGrid products={featuredProducts} compact /><div className="center-row" data-reveal><a className="button dark" href={route('Products')}>View full catalogue <ArrowRight size={18} /></a></div></section>
    </>
  );
}

function ProductsPage() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [visible, setVisible] = useState(24);
  const filtered = useMemo(() => products.filter((product) => (category === 'All' || product.category === category) && (!query.trim() || `${product.title} ${product.category}`.toLowerCase().includes(query.trim().toLowerCase()))), [category, query]);
  useEffect(() => setVisible(24), [category, query]);
  return <><PageHero eyebrow="Products" title="Standalone catalogue for store enquiries." text="Browse product photos, filter by category, and send an enquiry for availability, pricing, or advice." /><section className="section catalogue-section"><div className="catalogue-tools" data-reveal><label className="search-box"><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search products..." /></label><div className="category-tabs">{categories.map((item) => <button className={category === item ? 'active' : ''} key={item} onClick={() => setCategory(item)}>{item}</button>)}</div></div><ProductGrid products={filtered.slice(0, visible)} />{visible < filtered.length && <div className="center-row"><button className="button dark" onClick={() => setVisible((count) => count + 24)}>Show more products</button></div>}</section></>;
}

function ServicesPage() {
  const services = [[Cpu, 'Computer Sales', 'Laptops, desktops, screens, accessories, and practical buying guidance.'], [Printer, 'Printer Support', 'Printers, consumables, cable help, and office printing support.'], [Cable, 'Networking', 'Routers, CAT cables, Wi-Fi, printer sharing, and connectivity planning.'], [Camera, 'Surveillance Systems', 'Camera kits, recorders, GPS trackers, and security product enquiries.']];
  return <><PageHero eyebrow="Services" title="Practical technology support for homes and businesses." text="Compustar helps customers choose equipment, set it up correctly, and keep everyday systems working." /><section className="section service-page-grid">{services.map(([Icon, title, text]) => <article className="service-card" key={title} data-reveal><Icon /><h3>{title}</h3><p>{text}</p></article>)}</section></>;
}

function RepairsPage() {
  return <><PageHero eyebrow="Repairs" title="Clear repair enquiries before customers bring devices in." text="Customers can send the model, issue, and symptoms first so the team can advise on the next best step." /><section className="section repair-flow">{[['01', 'Describe the problem', 'Send the device type, model, issue, and when it started.'], ['02', 'Get guidance', 'The team can advise whether it needs inspection, setup, or replacement parts.'], ['03', 'Visit the store', 'Bring the device or product details for final confirmation and support.']].map(([step, title, text]) => <article key={step} data-reveal><span>{step}</span><h3>{title}</h3><p>{text}</p></article>)}</section></>;
}

function LocationPage() {
  const mapQuery = encodeURIComponent(location);
  return <><PageHero eyebrow="Location" title="Visit Compustar at Game City Mall." text="Find the store upstairs at Game City Mall in Gaborone for product enquiries, repairs, accessories, and practical technology support." /><section className="location-page section"><div className="location-card" data-reveal><p className="kicker">Store Location</p><h2>Shop 6U, upstairs.</h2><p><MapPin /> {location}</p><p><Phone /> {phone}</p><p><Mail /> {email}</p><a className="button dark" href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`} target="_blank" rel="noreferrer">Open in Google Maps <ArrowRight size={16} /></a></div><div className="map-shell" data-reveal><iframe title="Compustar location map" loading="lazy" referrerPolicy="no-referrer-when-downgrade" src={`https://www.google.com/maps?q=${mapQuery}&output=embed`}></iframe></div></section></>;
}

function ContactPage() {
  return <><PageHero eyebrow="Contact" title="Ask about products, repairs, or support." text="Use the contact details below for availability, quotes, device issues, and general store enquiries." /><section className="contact-page section"><div className="contact-panel" data-reveal><h2>Send a clear enquiry.</h2><p>Include the product name, budget, device model, or support issue. That gives the team enough context to respond properly.</p><ul><li><CheckCircle2 /> Product name or category</li><li><CheckCircle2 /> Device model if it is a repair</li><li><CheckCircle2 /> Phone number or preferred contact method</li></ul></div><div className="contact-card" data-reveal><a href={`mailto:${email}?subject=Compustar%20Website%20Enquiry`}><Mail /> {email}</a><a href={`tel:${phone}`}><Phone /> {phone}</a><p><MapPin /> {location}</p><a className="button primary" href={`mailto:${email}?subject=Compustar%20Website%20Enquiry`}>Email Compustar</a></div></section></>;
}

function PageHero({ eyebrow, title, text }) { return <section className="page-hero"><p className="kicker" data-hero>{eyebrow}</p><h1 data-hero>{title}</h1><p data-hero>{text}</p></section>; }
function SectionIntro({ eyebrow, title, text }) { return <div className="section-intro" data-reveal><div><p className="kicker">{eyebrow}</p><h2>{title}</h2></div><p>{text}</p></div>; }
function ProductGrid({ compact = false, products: list }) { return <div className={compact ? 'product-grid compact' : 'product-grid'}>{list.map((product) => <ProductCard key={product.file} product={product} />)}</div>; }
function ProductCard({ product }) { const subject = encodeURIComponent(`Product enquiry: ${product.title}`); const body = encodeURIComponent(`Hi Compustar,\n\nI would like to enquire about ${product.title}.\n\nPlease confirm availability and details.\n`); return <article className="product-card" data-reveal><div className="product-image"><img src={`/products/${product.file}`} alt={product.title} loading="lazy" /></div><div className="product-body"><span>{product.category}</span><h3>{product.title}</h3><a href={`mailto:${email}?subject=${subject}&body=${body}`}>Enquire <ArrowRight size={16} /></a></div></article>; }
function Footer() {
  return <footer className="site-footer"><div><img src="/logo.png" alt="Compustar logo" /><p>Computer products, repairs, security, networking, and IT support from Game City Mall, Gaborone.</p></div><nav aria-label="Footer navigation">{pages.map((item) => <a href={route(item)} key={item}>{item}</a>)}</nav><section><strong>Contact</strong><a href={`mailto:${email}?subject=Compustar%20Website%20Enquiry`}>{email}</a><a href={`tel:${phone}`}>{phone}</a><span>{location}</span></section></footer>;
}

createRoot(document.getElementById('root')).render(<App />);
