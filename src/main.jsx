import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight, Camera, CheckCircle2, Cpu, Mail, MapPin, Menu, Monitor, Network, PackageSearch, Phone, Printer, ShieldCheck, Store, Wrench, X } from 'lucide-react';
import products from './products.json';
import './styles.css';

gsap.registerPlugin(ScrollTrigger);

const email = 'compustarbw@gmail.com';
const phone = '76004665';
const displayPhone = '+267 76004665';
const location = 'Shop 6U (Upstairs), Game City Mall, Gaborone, Botswana';
const pages = ['Home', 'Products', 'Services', 'Repairs', 'Location', 'Contact'];
const featuredProducts = products.slice(0, 14);

function App() {
  const [page, setPage] = useState(getInitialPage);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const redirectedPath = new URLSearchParams(window.location.search).get('path');
    if (redirectedPath) {
      window.history.replaceState({}, '', redirectedPath);
      setPage(getInitialPage());
    }
    const onRouteChange = () => setPage(getInitialPage());
    window.addEventListener('popstate', onRouteChange);
    return () => window.removeEventListener('popstate', onRouteChange);
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
  const value = window.location.pathname.replace(/^\/+/, '').replace(/\/+$/, '');
  return pages.includes(value) ? value : 'Home';
}

function route(page) {
  return page === 'Home' ? '/' : `/${page}`;
}

function goToPage(event, page) {
  event.preventDefault();
  window.history.pushState({}, '', route(page));
  window.dispatchEvent(new PopStateEvent('popstate'));
}

function useRevealAnimations(page) {
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('[data-hero]', { autoAlpha: 0, y: 26 }, { autoAlpha: 1, y: 0, duration: 0.72, stagger: 0.06, ease: 'power3.out', clearProps: 'visibility,opacity,transform' });
      gsap.utils.toArray('[data-reveal]').forEach((element) => {
        gsap.fromTo(element, { autoAlpha: 0, y: 30, scale: 0.985 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.68, ease: 'power3.out', clearProps: 'visibility,opacity,transform', scrollTrigger: { trigger: element, start: 'top 88%', once: true } });
      });
      requestAnimationFrame(() => ScrollTrigger.refresh());
    });
    return () => ctx.revert();
  }, [page]);
}

function Header({ menuOpen, page, setMenuOpen }) {
  return (
    <header className="site-header">
      <a className="brand" href={route('Home')} onClick={(event) => goToPage(event, 'Home')} aria-label="Compustar home"><img src="/logo.png" alt="Compustar logo" /></a>
      <button className="menu-button" onClick={() => setMenuOpen((open) => !open)} aria-label="Toggle menu">{menuOpen ? <X /> : <Menu />}</button>
      <nav className={menuOpen ? 'open' : ''}>{pages.map((item) => <a className={page === item ? 'active' : ''} href={route(item)} onClick={(event) => goToPage(event, item)} key={item}>{item}</a>)}</nav>
    </header>
  );
}

function HomePage() {
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <p className="kicker" data-hero>Compustar Botswana</p>
          <h1 data-hero>Technology products, repairs, and IT support.</h1>
          <p data-hero>Browse featured products, request availability, and get help with computers, printers, surveillance systems, networking, and repairs.</p>
          <div className="hero-actions" data-hero><a className="button primary" href={route('Products')} onClick={(event) => goToPage(event, 'Products')}>Browse Products <ArrowRight size={18} /></a><a className="button secondary" href={route('Location')} onClick={(event) => goToPage(event, 'Location')}>Find the Store</a></div>
        </div>
        <div className="hero-showcase" data-hero><video src="/hero-logo.mp4" poster="/logo.png" muted loop autoPlay playsInline aria-label="Compustar logo animation"></video><div><span><Camera /> Surveillance</span><span><Monitor /> Computers</span><span><Network /> Networking</span></div></div>
      </section>
      <section className="quick-paths">
        {[[PackageSearch, 'Product Enquiries', 'Browse standalone product photos and ask about current availability.'], [Wrench, 'Repairs & Upgrades', 'Support for slow computers, setup issues, upgrades, and diagnostics.'], [Network, 'Security & Networking', 'Camera systems, GPS trackers, network cables, and office connectivity.']].map(([Icon, title, text]) => <article key={title} data-reveal><Icon /><h3>{title}</h3><p>{text}</p></article>)}
      </section>
      <section className="section product-showcase-section"><SectionIntro eyebrow="Product gallery" title="A quick look at what customers can ask about." text="A visual showcase of products available for enquiries at the store." /><ProductCarousel products={featuredProducts} /><div className="center-row" data-reveal><a className="button dark" href={route('Products')} onClick={(event) => goToPage(event, 'Products')}>View full gallery <ArrowRight size={18} /></a></div></section>
    </>
  );
}

function ProductsPage() {
  const [visible, setVisible] = useState(24);
  return <><PageHero eyebrow="Products" title="A clean product gallery for quick enquiries." text="Browse the product photos and contact Compustar to confirm availability, pricing, or suitable alternatives." /><section className="section catalogue-section"><ProductGrid products={products.slice(0, visible)} />{visible < products.length && <div className="center-row"><button className="button dark" onClick={() => setVisible((count) => count + 24)}>Show more products</button></div>}</section></>;
}

function ServicesPage() {
  const services = [[Cpu, 'Computer Sales', 'Laptops, desktops, monitors, accessories, and straightforward buying guidance.', '/context/service-computers.png'], [Printer, 'Printer Support', 'Printers, consumables, setup cables, and everyday office printing support.', '/context/service-printers.png'], [Network, 'Networking', 'Routers, CAT cables, Wi-Fi, printer sharing, and tidy connectivity planning.', '/context/service-networking.png'], [Camera, 'Surveillance Systems', 'Camera kits, recorders, GPS trackers, and security product enquiries.', '/context/service-security.png']];
  return <><PageHero eyebrow="Services" title="Practical technology support for homes and businesses." text="Compustar helps customers choose equipment, set it up correctly, and keep everyday systems working." /><section className="section"><div className="horizontal-showcase service-slider">{services.map(([Icon, title, text, image]) => <article className="service-card visual-card" key={title} data-reveal><img src={image} alt="" loading="lazy" /><div><Icon /><h3>{title}</h3><p>{text}</p></div></article>)}</div></section></>;
}

function RepairsPage() {
  const steps = [['01', 'Describe the problem', 'Send the device type, model, issue, and when it started.', '/context/repair-diagnose.png'], ['02', 'Get clear guidance', 'The team can advise whether it needs inspection, setup, or replacement parts.', '/context/repair-advise.png'], ['03', 'Visit the store', 'Bring the device or product details for final confirmation and support.', '/context/repair-visit.png']];
  return <><PageHero eyebrow="Repairs" title="A simple repair path from enquiry to support." text="Customers can send the issue first, then visit the store with the right details instead of guessing what to bring." /><section className="section repair-story repair-story-full"><div className="horizontal-showcase repair-steps">{steps.map(([step, title, text, image]) => <article className="repair-step" key={step} data-reveal><img src={image} alt="" loading="lazy" /><div><span>{step}</span><h3>{title}</h3><p>{text}</p><a className="button dark" href={route('Contact')} onClick={(event) => goToPage(event, 'Contact')}>Ask about repairs</a></div></article>)}</div></section></>;
}

function LocationPage() {
  const mapQuery = encodeURIComponent('Compustar Shop 6U Game City Mall Gaborone Botswana');
  return <><PageHero eyebrow="Location" title="Visit Compustar at Game City Mall." text="Find the store upstairs at Game City Mall in Gaborone for product enquiries, repairs, accessories, and practical technology support." /><section className="location-page section"><div className="location-card" data-reveal><p className="kicker">Store Location</p><h2>Shop 6U, upstairs.</h2><p><MapPin /> {location}</p><p><Phone /> {displayPhone}</p><p><Mail /> {email}</p><a className="button dark" href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`} target="_blank" rel="noreferrer">Open in Google Maps <ArrowRight size={16} /></a></div><MapFrame mapQuery={mapQuery} /></section></>;
}

function MapFrame({ mapQuery }) {
  const [loaded, setLoaded] = useState(false);
  return <div className="map-shell" data-reveal>{loaded ? <iframe title="Compustar location map" loading="lazy" referrerPolicy="no-referrer-when-downgrade" src={`https://www.google.com/maps?q=${mapQuery}&z=17&output=embed`}></iframe> : <button className="map-placeholder" onClick={() => setLoaded(true)}><MapPin /><strong>Game City Mall, Gaborone</strong><span>Tap to load the map pin</span></button>}</div>;
}

function ContactPage() {
  return <><PageHero eyebrow="Contact" title="Ask about products, repairs, or support." text="Use the contact details below for availability, quotes, device issues, and general store enquiries." /><section className="contact-page section"><div className="contact-panel" data-reveal><h2>Send a clear enquiry.</h2><p>Include the product name, budget, device model, or support issue. That gives the team enough context to respond properly.</p><ul><li><CheckCircle2 /> Product name or category</li><li><CheckCircle2 /> Device model if it is a repair</li><li><CheckCircle2 /> Phone number or preferred contact method</li></ul></div><div className="contact-card" data-reveal><a href={`mailto:${email}?subject=Compustar%20Website%20Enquiry`}><Mail /> {email}</a><a href={`tel:${phone}`}><Phone /> {displayPhone}</a><p><MapPin /> {location}</p><a className="button primary" href={`mailto:${email}?subject=Compustar%20Website%20Enquiry`}>Email Compustar</a></div></section></>;
}

function PageHero({ eyebrow, title, text }) { return <section className="page-hero"><p className="kicker" data-hero>{eyebrow}</p><h1 data-hero>{title}</h1><p data-hero>{text}</p></section>; }
function SectionIntro({ eyebrow, title, text }) { return <div className="section-intro" data-reveal><div><p className="kicker">{eyebrow}</p><h2>{title}</h2></div><p>{text}</p></div>; }
function ProductGrid({ products: list }) { return <div className="product-grid gallery-grid">{list.map((product) => <ProductCard key={product.file} product={product} />)}</div>; }
function ProductCarousel({ products: list }) { const slides = [...list, ...list]; return <div className="product-slider" data-reveal><div className="product-track">{slides.map((product, index) => <ProductCard key={`${product.file}-${index}`} product={product} />)}</div></div>; }
function ProductCard({ product }) { return <article className="product-card gallery-card" data-reveal><div className="product-image"><img src={`/products/${product.file}`} alt="Compustar product" loading="lazy" /></div><div className="product-overlay"><a href={route('Contact')} onClick={(event) => goToPage(event, 'Contact')}>Enquire <ArrowRight size={16} /></a></div></article>; }
function Footer() {
  return <footer className="site-footer"><div className="footer-brand"><img src="/logo.png" alt="Compustar logo" /><p>Computer products, repairs, security, networking, and IT support from Game City Mall, Gaborone.</p></div><nav className="footer-links" aria-label="Footer navigation"><strong>Explore</strong>{pages.map((item) => <a href={route(item)} onClick={(event) => goToPage(event, item)} key={item}>{item}</a>)}</nav><section className="footer-contact"><strong>Contact</strong><a href={`mailto:${email}?subject=Compustar%20Website%20Enquiry`}><Mail /> {email}</a><a href={`tel:${phone}`}><Phone /> {displayPhone}</a><span><Store /> {location}</span></section><div className="footer-bottom"><span>@ Compustar {new Date().getFullYear()}. All rights reserved.</span><a href="https://futurifydesigns.com" target="_blank" rel="noreferrer">Built by Futurify Designs</a></div></footer>;
}

createRoot(document.getElementById('root')).render(<App />);
