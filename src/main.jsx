import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowUpRight, Cable, Cpu, Mail, MapPin, Monitor, MousePointer2, Printer, Search, ShieldCheck, Sparkles, Wrench } from 'lucide-react';
import products from './products.json';
import './styles.css';

gsap.registerPlugin(ScrollTrigger);

const email = 'compustarbw@gmail.com';
const categories = ['All', 'Computers', 'Printers', 'Networking', 'Accessories', 'Screenshots'];

function getCategory(name) {
  const value = name.toLowerCase();
  if (value.includes('printer') || value.includes('toner') || value.includes('ink')) return 'Printers';
  if (value.includes('cat') || value.includes('cable') || value.includes('router') || value.includes('network')) return 'Networking';
  if (value.includes('laptop') || value.includes('desktop') || value.includes('monitor') || value.includes('computer')) return 'Computers';
  if (value.includes('screenshot')) return 'Screenshots';
  return 'Accessories';
}

function cleanTitle(file) {
  const base = file.replace(/\.[^.]+$/, '').replace(/^Screenshot \((\d+)\)$/i, 'Product enquiry $1');
  return base.replace(/^ZA-/i, '').replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim();
}

const productList = products.map((item) => ({
  ...item,
  title: cleanTitle(item.original || item.file),
  category: getCategory(item.original || item.file)
}));

function App() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [visibleCount, setVisibleCount] = useState(18);

  const filteredProducts = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return productList.filter((product) => {
      const matchesCategory = category === 'All' || product.category === category;
      const matchesQuery = !needle || product.title.toLowerCase().includes(needle) || product.category.toLowerCase().includes(needle);
      return matchesCategory && matchesQuery;
    });
  }, [category, query]);

  const visibleProducts = filteredProducts.slice(0, visibleCount);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('[data-hero]', { autoAlpha: 0, y: 34, duration: 0.9, stagger: 0.09, ease: 'power3.out' });
      gsap.utils.toArray('[data-reveal]').forEach((element) => {
        gsap.from(element, {
          autoAlpha: 0,
          y: 28,
          duration: 0.65,
          ease: 'power2.out',
          scrollTrigger: { trigger: element, start: 'top 86%' }
        });
      });
    });
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    setVisibleCount(18);
  }, [category, query]);

  return (
    <>
      <Header />
      <main>
        <Hero />
        <TrustStrip />
        <ProductSection
          category={category}
          filteredProducts={filteredProducts}
          query={query}
          setCategory={setCategory}
          setQuery={setQuery}
          setVisibleCount={setVisibleCount}
          visibleCount={visibleCount}
          visibleProducts={visibleProducts}
        />
        <Services />
        <Contact />
      </main>
      <Footer />
    </>
  );
}

function Header() {
  return (
    <header className="site-header">
      <a className="brand" href="#top" aria-label="Compustar home">
        <img src="/logo.jpg" alt="Compustar logo" />
        <span>COMPUSTAR<small>Your Digital Partner</small></span>
      </a>
      <nav>
        <a href="#products">Products</a>
        <a href="#services">Services</a>
        <a href="#contact">Contact</a>
      </nav>
    </header>
  );
}

function Hero() {
  return (
    <section className="hero" id="top">
      <div className="hero-copy">
        <p className="kicker" data-hero>Gaborone computer supply & support</p>
        <h1 data-hero>Computer products, repairs, and practical IT help.</h1>
        <p data-hero>Browse available products, ask about stock, or contact Compustar for repairs, setup, and office technology support.</p>
        <div className="hero-actions" data-hero>
          <a className="button primary" href="#products">View Products</a>
          <a className="button secondary" href={`mailto:${email}?subject=Compustar%20Enquiry`}>Email Enquiry</a>
        </div>
      </div>
      <div className="hero-card" data-hero>
        <img src="/logo.jpg" alt="Compustar logo" />
        <div className="hero-card-grid">
          <span><Monitor size={18} /> Sales</span>
          <span><Wrench size={18} /> Repairs</span>
          <span><Cable size={18} /> Networking</span>
        </div>
      </div>
    </section>
  );
}

function TrustStrip() {
  const items = [
    ['Product enquiries', 'Ask about availability before visiting the store.'],
    ['Repair support', 'Send the model and issue so the team can advise.'],
    ['Office setup', 'Get help with devices, printers, and connectivity.']
  ];

  return (
    <section className="trust-strip" data-reveal>
      {items.map(([title, text]) => (
        <article key={title}>
          <Sparkles size={18} />
          <strong>{title}</strong>
          <p>{text}</p>
        </article>
      ))}
    </section>
  );
}

function ProductSection({ category, filteredProducts, query, setCategory, setQuery, setVisibleCount, visibleCount, visibleProducts }) {
  return (
    <section className="section products-section" id="products">
      <div className="section-heading" data-reveal>
        <p className="kicker">Product catalogue</p>
        <h2>Browse products and send an enquiry.</h2>
        <p>This is an advertisement catalogue. Customers can check what Compustar carries, then visit the store or contact the team for availability.</p>
      </div>
      <div className="catalog-toolbar" data-reveal>
        <label className="search-box">
          <Search size={18} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search products..." />
        </label>
        <div className="category-tabs">
          {categories.map((item) => (
            <button className={category === item ? 'active' : ''} key={item} onClick={() => setCategory(item)}>{item}</button>
          ))}
        </div>
      </div>
      <div className="product-grid">
        {visibleProducts.map((product) => (
          <ProductCard key={product.file} product={product} />
        ))}
      </div>
      {visibleCount < filteredProducts.length && (
        <button className="load-more" onClick={() => setVisibleCount((count) => count + 18)}>
          Show more products
        </button>
      )}
    </section>
  );
}

function ProductCard({ product }) {
  const subject = encodeURIComponent(`Product enquiry: ${product.title}`);
  const body = encodeURIComponent(`Hi Compustar,\n\nI would like to enquire about ${product.title}.\n\nPlease confirm availability and details.\n`);

  return (
    <article className="product-card" data-reveal>
      <div className="product-image">
        <img src={`/products/${product.file}`} alt={product.title} loading="lazy" />
      </div>
      <div className="product-body">
        <span>{product.category}</span>
        <h3>{product.title}</h3>
        <a href={`mailto:${email}?subject=${subject}&body=${body}`}>Enquire <ArrowUpRight size={16} /></a>
      </div>
    </article>
  );
}

function Services() {
  const services = [
    { icon: Cpu, title: 'Computer Sales', text: 'Laptops, desktops, components, monitors, peripherals, and everyday tech essentials.' },
    { icon: Wrench, title: 'Repairs & Upgrades', text: 'Diagnostics, software support, memory and storage upgrades, cleanup, and setup help.' },
    { icon: Printer, title: 'Printers & Supplies', text: 'Printers, consumables, cables, and support for home and office printing needs.' },
    { icon: ShieldCheck, title: 'Office IT Support', text: 'Small-office device setup, Wi-Fi, cabling, email setup, and practical buying advice.' }
  ];

  return (
    <section className="section services" id="services">
      <div className="section-heading" data-reveal>
        <p className="kicker">Services</p>
        <h2>Support for the technology people rely on daily.</h2>
      </div>
      <div className="service-grid">
        {services.map(({ icon: Icon, title, text }) => (
          <article className="service-card" key={title} data-reveal>
            <Icon />
            <h3>{title}</h3>
            <p>{text}</p>
            <MousePointer2 className="corner-icon" />
          </article>
        ))}
      </div>
    </section>
  );
}

function Contact() {
  return (
    <section className="contact" id="contact">
      <div data-reveal>
        <p className="kicker">Contact Compustar</p>
        <h2>Ask about stock, repairs, or office support.</h2>
        <p>Send the product name, device model, issue, or budget. The team can confirm availability and guide you before you visit the store.</p>
      </div>
      <div className="contact-card" data-reveal>
        <a href={`mailto:${email}?subject=Compustar%20Website%20Enquiry`}><Mail /> {email}</a>
        <p><MapPin /> Botswana</p>
        <a className="button primary" href={`mailto:${email}?subject=Compustar%20Website%20Enquiry`}>Send Enquiry</a>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer>
      <span>COMPUSTAR</span>
      <p>Computer products, repairs, and IT support.</p>
    </footer>
  );
}

createRoot(document.getElementById('root')).render(<App />);
