import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight, Building2, Camera, CheckCircle2, Cpu, GraduationCap, Handshake, HeartHandshake, Instagram, Lightbulb, Mail, MapPin, Menu, MessageCircle, Monitor, Network, PackageSearch, Phone, Printer, ShieldCheck, ShoppingCart, Sparkles, Store, Target, Users, Wrench, X } from 'lucide-react';
import products from './products.json';
import './styles.css';

gsap.registerPlugin(ScrollTrigger);

const email = 'compustarbw@gmail.com';
const phone = '76004665';
const displayPhone = '+267 76004665';
const telPhone = '3111542';
const displayTelPhone = '+267 3111542';
const mobilePhone = '75294155';
const displayMobilePhone = '+267 75294155';
const whatsappPhone = '26776004665';
const whatsappUrl = `https://wa.me/${whatsappPhone}`;
const instagramUrl = 'https://www.instagram.com/compustarbw';
const locations = [
  {
    title: 'Game City Mall',
    address: 'Shop No. 6U, Upstairs, Game City Mall, Gaborone, Botswana',
    phones: `Tel: ${displayTelPhone} | Mobile: ${displayPhone}`,
    mapQuery: 'Compustar Shop 6U Game City Mall Gaborone Botswana'
  },
  {
    title: 'G-West Industrial',
    address: 'Plot 27576/4, Aga House, G-West Industrial, Gaborone, Botswana',
    phones: `Tel: ${displayTelPhone} | Mobile: ${displayMobilePhone}`,
    mapQuery: 'G-West Industrial Plot 27576/4 Aga House Gaborone Botswana'
  }
];
const pages = ['Home', 'About', 'Products', 'Services', 'Repairs', 'Location', 'Contact'];
const featuredProducts = products.slice(0, 14);
const seo = {
  Home: ['Compustar Botswana | Computer Sales, Repairs & IT Support', 'Computers, printers, surveillance, networking, accessories, repairs, and IT support from Game City Mall in Gaborone.'],
  About: ['About Compustar Botswana | Your Digital Partner', 'Learn about Compustar Botswana — a technology and electronics partner providing practical products and solutions for individuals, businesses, and institutions.'],
  Products: ['Products | Compustar Botswana', 'Browse computer, networking, surveillance, power, and technology products available for enquiry from Compustar Botswana.'],
  Services: ['Technology Services | Compustar Botswana', 'Computer sales, printer support, networking, surveillance systems, and practical technology guidance in Gaborone.'],
  Repairs: ['Computer Repairs | Compustar Botswana', 'Ask Compustar Botswana about computer diagnostics, upgrades, setup issues, replacement parts, and repair support.'],
  Location: ['Compustar Location | Game City Mall, Gaborone', 'Visit Compustar at Shop 6U upstairs in Game City Mall, Gaborone, Botswana.'],
  Contact: ['Contact Compustar Botswana', 'Contact Compustar Botswana about product availability, prices, repairs, quotes, and technology support.']
};

function App() {
  const [page, setPage] = useState(getInitialPage);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const redirectedPath = new URLSearchParams(window.location.search).get('path');
    if (redirectedPath) {
      window.history.replaceState({}, '', redirectedPath);
      resetPageScroll('auto');
      setPage(getInitialPage());
    }
    const onRouteChange = () => {
      resetPageScroll('auto');
      setPage(getInitialPage());
    };
    window.addEventListener('popstate', onRouteChange);
    return () => window.removeEventListener('popstate', onRouteChange);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [page]);

  useRevealAnimations(page);
  usePageSeo(page);

  return (
    <>
      <Header menuOpen={menuOpen} page={page} setMenuOpen={setMenuOpen} />
      <main>
        {page === 'Home' && <HomePage />}
        {page === 'About' && <AboutPage />}
        {page === 'Products' && <ProductsPage />}
        {page === 'Services' && <ServicesPage />}
        {page === 'Repairs' && <RepairsPage />}
        {page === 'Location' && <LocationPage />}
        {page === 'Contact' && <ContactPage />}
      </main>
      <Footer />
      <a className="whatsapp-fab" href={whatsappUrl} target="_blank" rel="noreferrer" aria-label="Chat on WhatsApp">
        <MessageCircle size={26} />
      </a>
    </>
  );
}

function usePageSeo(page) {
  useEffect(() => {
    const [title, description] = seo[page];
    const pageUrl = `https://compustar.co.bw${route(page)}`;
    document.title = title;
    document.querySelector('meta[name="description"]')?.setAttribute('content', description);
    document.querySelector('link[rel="canonical"]')?.setAttribute('href', pageUrl);
    document.querySelector('meta[property="og:url"]')?.setAttribute('content', pageUrl);
    document.querySelector('meta[property="og:title"]')?.setAttribute('content', title);
    document.querySelector('meta[property="og:description"]')?.setAttribute('content', description);
    document.querySelector('meta[name="twitter:title"]')?.setAttribute('content', title);
    document.querySelector('meta[name="twitter:description"]')?.setAttribute('content', description);
  }, [page]);
}

function getInitialPage() {
  const value = window.location.pathname.replace(/^\/+/, '').replace(/\/+$/, '');
  return pages.includes(value) ? value : 'Home';
}

function route(page) {
  return page === 'Home' ? '/' : `/${page}`;
}

function resetPageScroll(behavior = 'smooth') {
  window.scrollTo({ top: 0, left: 0, behavior });
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
}

function goToPage(event, page) {
  event.preventDefault();
  resetPageScroll('auto');
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
      gsap.utils.toArray('[data-stagger]').forEach((group) => {
        const items = group.querySelectorAll('[data-stagger-item]');
        gsap.fromTo(items, { autoAlpha: 0, y: 36 }, {
          autoAlpha: 1,
          y: 0,
          duration: 0.62,
          stagger: 0.08,
          ease: 'power3.out',
          clearProps: 'visibility,opacity,transform',
          scrollTrigger: { trigger: group, start: 'top 86%', once: true }
        });
      });
      gsap.utils.toArray('[data-approach-step]').forEach((step, index) => {
        gsap.fromTo(step, { autoAlpha: 0, x: index % 2 === 0 ? -28 : 28 }, {
          autoAlpha: 1,
          x: 0,
          duration: 0.7,
          ease: 'power3.out',
          clearProps: 'visibility,opacity,transform',
          scrollTrigger: { trigger: step, start: 'top 90%', once: true }
        });
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

function AboutPage() {
  const approach = ['Understanding', 'Recommending', 'Supplying', 'Supporting', 'Building Long-Term Relationships'];
  const productsList = [
    'Laptops & Desktop Computers',
    'Gaming Computers & Accessories',
    'Printers & Office Equipment',
    'Monitors & Displays',
    'Keyboards, Mice & Computer Peripherals',
    'Networking Equipment & Accessories',
    'CCTV & Security Solutions',
    'POS Systems & Business Accessories',
    'Storage Devices & Memory Solutions',
    'Chargers, Cables & Adapters',
    'Power Banks & Power Solutions',
    'Audio Equipment & Accessories',
    'Laptop Bags & Protective Accessories',
    'Other ICT & Electronic Equipment'
  ];
  const institutions = [
    'Government departments and public institutions',
    'Private companies and SMEs',
    'Banks and financial institutions',
    'Schools, colleges and universities',
    'Hospitals and healthcare organisations',
    'NGOs and development organisations',
    'Mining and industrial companies',
    'Construction companies',
    'Hotels and hospitality businesses',
    'Retail and commercial businesses',
    'Churches and other organisations'
  ];
  const businessJourney = ['Starting a business', 'Expanding an office', 'Replacing equipment', 'Upgrading infrastructure', 'Equipping a new site'];
  const commitments = [
    [ShieldCheck, 'Professional Service', 'We treat every customer and organisation with professionalism and respect.'],
    [Target, 'Practical Solutions', 'We focus on understanding the requirement and identifying technology that fits the intended use.'],
    [Sparkles, 'Competitive Value', 'We strive to provide competitive quotations based on requirements and current market conditions.'],
    [HeartHandshake, 'Responsiveness', 'We understand that customers often need quick answers and aim to respond promptly.'],
    [Handshake, 'Long-Term Relationships', 'We want customers to return to Compustar whenever they have another technology requirement.']
  ];
  const values = [
    [ShieldCheck, 'Integrity', 'We conduct our business honestly and professionally.'],
    [Users, 'Customer Focus', 'Our customers are at the centre of what we do.'],
    [CheckCircle2, 'Reliability', 'We strive to deliver dependable products and service.'],
    [Building2, 'Professionalism', 'We maintain high standards in how we communicate and conduct business.'],
    [Lightbulb, 'Innovation', 'We embrace technology and continuously look for better ways to serve our customers.'],
    [Handshake, 'Partnership', 'We seek to build long-term relationships rather than one-time transactions.']
  ];
  const focusAreas = [
    [Building2, 'Technology for Business', 'Businesses depend on technology every day. Compustar helps businesses access technology products required for daily operations — making procurement simpler, more convenient and more responsive.'],
    [GraduationCap, 'Education & Student Technology', 'Compustar supports students, educators and educational institutions with products ranging from personal laptops and accessories to computers, printers, networking equipment and other ICT requirements.'],
    [Camera, 'CCTV & Security Solutions', 'From smaller installations to larger multi-camera requirements, our team can assist customers in identifying suitable surveillance equipment and solutions for their premises.'],
    [ShoppingCart, 'POS & Business Technology', 'Compustar supplies POS equipment and related accessories for retailers and businesses handling daily transactions — whether establishing a new business, opening a branch or upgrading equipment.']
  ];

  return (
    <>
      <PageHero eyebrow="About Us" title="Your Digital Partner." text="Compustar is a Botswana-based technology and electronics company dedicated to providing reliable, practical and accessible technology solutions." />

      <section className="section about-intro">
        <div className="about-intro-grid">
          <div className="about-copy" data-reveal>
            <p className="kicker">About Compustar</p>
            <h2>Technology that supports how organisations operate and grow.</h2>
            <p>We understand that technology is no longer simply an accessory to business — it is an essential part of how organisations operate, communicate, serve customers, manage information and grow.</p>
            <p>Our role is to help our customers access the right technology products and solutions to support these needs.</p>
            <p>From an individual purchasing a laptop or accessory to a business equipping an entire office, a school establishing a computer laboratory, a hospital strengthening its ICT infrastructure, or an organisation requiring technology equipment in bulk, Compustar is positioned to provide solutions tailored to different requirements and budgets.</p>
          </div>
          <aside className="about-highlight" data-reveal>
            <p className="kicker">Who we serve</p>
            <ul>
              <li><CheckCircle2 /> Individuals & households</li>
              <li><CheckCircle2 /> Businesses & SMEs</li>
              <li><CheckCircle2 /> Schools & institutions</li>
              <li><CheckCircle2 /> Hospitals & NGOs</li>
              <li><CheckCircle2 /> Corporate & bulk buyers</li>
            </ul>
            <a className="button primary" href={route('Contact')} onClick={(event) => goToPage(event, 'Contact')}>Talk to Compustar <ArrowRight size={16} /></a>
          </aside>
        </div>
      </section>

      <section className="section about-approach">
        <SectionIntro eyebrow="Our Approach" title="More than supplying products." text="Selling technology is about understanding the customer's requirement, recommending the appropriate solution, delivering professionally and building a relationship that continues beyond the initial purchase." />
        <div className="approach-flow">
          {approach.map((step, index) => (
            <article className="approach-step" data-approach-step key={step}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <h3>{step}</h3>
              {index < approach.length - 1 && <ArrowRight className="approach-arrow" size={18} />}
            </article>
          ))}
        </div>
        <p className="about-note" data-reveal>We work with customers to understand what they need before recommending suitable products and solutions. This allows us to provide practical options rather than simply selling equipment.</p>
      </section>

      <section className="section about-products">
        <SectionIntro eyebrow="Our Products & Solutions" title="A broad range of technology products." text="Product availability, specifications and brands may vary according to current stock and customer requirements." />
        <div className="about-product-grid" data-stagger>
          {productsList.map((item) => (
            <article className="about-product-item" data-stagger-item key={item}>
              <PackageSearch size={18} />
              <span>{item}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="section about-corporate">
        <div className="about-corporate-grid">
          <div className="about-copy" data-reveal>
            <p className="kicker">Corporate & Institutional Solutions</p>
            <h2>Technology procurement for organisations.</h2>
            <p>Compustar is developing a strong Corporate and Institutional Supply Division designed to serve organisations with their technology procurement requirements.</p>
            <p>Organisations often need more than a single product — multiple computers, printers, networking equipment, CCTV systems, POS equipment, accessories and other technology products as part of a project, office setup, expansion or replacement programme.</p>
            <p>We welcome opportunities involving supplier registration, RFQs, quotations, bulk purchases, institutional requirements, tenders and recurring supply arrangements, subject to applicable procurement procedures.</p>
          </div>
          <div className="institution-list" data-stagger>
            <p className="kicker">Designed to support</p>
            {institutions.map((item) => (
              <article data-stagger-item key={item}><Building2 size={16} /><span>{item}</span></article>
            ))}
          </div>
        </div>
      </section>

      <section className="section about-focus">
        <SectionIntro eyebrow="Specialist Areas" title="Practical support across key sectors." text="From business operations to education, security and point-of-sale technology — Compustar helps customers find the right fit." />
        <div className="about-focus-grid" data-stagger>
          {focusAreas.map(([Icon, title, text]) => (
            <article className="about-focus-card" data-stagger-item key={title}>
              <Icon />
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
        <div className="business-journey" data-stagger>
          {businessJourney.map((item) => (
            <span data-stagger-item key={item}>{item}</span>
          ))}
        </div>
      </section>

      <section className="section about-commitment">
        <SectionIntro eyebrow="Our Commitment" title="Provide the right technology. Deliver professional service. Build lasting relationships." text="We aim to achieve this through clear standards that guide every enquiry and every project." />
        <div className="commitment-grid" data-stagger>
          {commitments.map(([Icon, title, text]) => (
            <article data-stagger-item key={title}><Icon /><h3>{title}</h3><p>{text}</p></article>
          ))}
        </div>
      </section>

      <section className="section about-mission">
        <div className="mission-grid" data-stagger>
          <article className="mission-card vision" data-stagger-item>
            <Target />
            <p className="kicker">Our Vision</p>
            <h3>Trusted technology partner for Botswana.</h3>
            <p>To become one of Botswana's trusted technology and electronics partners, recognised for reliable products, professional service, responsive customer support and practical technology solutions.</p>
          </article>
          <article className="mission-card mission" data-stagger-item>
            <Sparkles />
            <p className="kicker">Our Mission</p>
            <h3>Make technology accessible and practical.</h3>
            <p>To make technology accessible, reliable and practical by providing quality products, responsive service and technology solutions that help individuals, businesses and institutions achieve their objectives.</p>
          </article>
        </div>
      </section>

      <section className="section about-values">
        <SectionIntro eyebrow="Our Values" title="How we work with every customer." text="These principles shape the way Compustar communicates, supplies and supports." />
        <div className="values-grid" data-stagger>
          {values.map(([Icon, title, text]) => (
            <article data-stagger-item key={title}><Icon /><h3>{title}</h3><p>{text}</p></article>
          ))}
        </div>
      </section>

      <section className="section about-why">
        <div className="why-panel" data-reveal>
          <p className="kicker">Why Compustar?</p>
          <h2>Because your technology requirements deserve more than a product catalogue.</h2>
          <p>They deserve a partner who listens, understands your requirements and helps you find practical solutions.</p>
          <p>Whether you need one laptop, accessories for your business, a complete office setup, CCTV equipment, POS solutions, networking equipment or technology products in bulk, Compustar is ready to assist.</p>
          <p className="why-tagline">From individual customers to large organisations, we are ready to be your Digital Partner.</p>
          <div className="hero-actions">
            <a className="button primary" href={route('Contact')} onClick={(event) => goToPage(event, 'Contact')}>Get in touch <ArrowRight size={16} /></a>
            <a className="button secondary" href={route('Products')} onClick={(event) => goToPage(event, 'Products')}>Browse products</a>
          </div>
        </div>
      </section>

      <section className="section about-locations">
        <SectionIntro eyebrow="Visit Us" title="Compustar — Your Digital Partner." text="Find us at Game City Mall and G-West Industrial in Gaborone." />
        <div className="about-location-grid" data-stagger>
          {locations.map((item) => (
            <article data-stagger-item key={item.title}>
              <Store />
              <h3>{item.title}</h3>
              <p><MapPin size={16} /> {item.address}</p>
              <p><Phone size={16} /> {item.phones}</p>
              <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.mapQuery)}`} target="_blank" rel="noreferrer">Open map <ArrowRight size={15} /></a>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}

function ProductsPage() {
  const [visible, setVisible] = useState(24);
  return <><PageHero eyebrow="Products" title="A clean product gallery for quick enquiries." text="Browse the product photos and contact Compustar to confirm availability, pricing, or suitable alternatives." /><section className="section catalogue-section"><ProductGrid products={products.slice(0, visible)} />{visible < products.length && <div className="center-row"><button className="button dark" onClick={() => setVisible((count) => count + 24)}>Show more products</button></div>}</section></>;
}

function ServicesPage() {
  const services = [[Cpu, 'Computer Sales', 'Laptops, desktops, monitors, accessories, and straightforward buying guidance.', '/context/service-computers.png'], [Printer, 'Printer Support', 'Printers, consumables, setup cables, and everyday office printing support.', '/context/service-printers.png'], [Network, 'Networking', 'Routers, CAT cables, Wi-Fi, printer sharing, and tidy connectivity planning.', '/context/service-networking.png'], [Camera, 'Surveillance Systems', 'Camera kits, recorders, GPS trackers, and security product enquiries.', '/context/service-security.png']];
  const slides = [...services, ...services];
  return <><PageHero eyebrow="Services" title="Practical technology support for homes and businesses." text="Compustar helps customers choose equipment, set it up correctly, and keep everyday systems working." /><section className="section"><div className="horizontal-showcase auto-showcase service-slider">{slides.map(([Icon, title, text, image], index) => <article className="service-card visual-card" key={`${title}-${index}`} data-reveal><img src={image} alt="" loading="lazy" /><div><Icon /><h3>{title}</h3><p>{text}</p></div></article>)}</div></section></>;
}

function RepairsPage() {
  const steps = [['01', 'Describe the problem', 'Send the device type, model, issue, and when it started.', '/context/repair-diagnose.png'], ['02', 'Get clear guidance', 'The team can advise whether it needs inspection, setup, or replacement parts.', '/context/repair-advise.png'], ['03', 'Visit the store', 'Bring the device or product details for final confirmation and support.', '/context/repair-visit.png']];
  const slides = [...steps, ...steps];
  return <><PageHero eyebrow="Repairs" title="A simple repair path from enquiry to support." text="Customers can send the issue first, then visit the store with the right details instead of guessing what to bring." /><section className="section repair-story repair-story-full"><div className="horizontal-showcase auto-showcase repair-steps">{slides.map(([step, title, text, image], index) => <article className="repair-step" key={`${step}-${index}`} data-reveal><img src={image} alt="" loading="lazy" /><div><span>{step}</span><h3>{title}</h3><p>{text}</p><a className="button dark" href={route('Contact')} onClick={(event) => goToPage(event, 'Contact')}>Ask about repairs</a></div></article>)}</div></section></>;
}

function LocationPage() {
  const mapQuery = encodeURIComponent(locations[0].mapQuery);
  return <><PageHero eyebrow="Location" title="Visit Compustar in Gaborone." text="Find Compustar for product enquiries, repairs, accessories, and practical technology support." /><section className="location-page section"><div className="location-card" data-reveal><p className="kicker">Store Locations</p><h2>Gaborone support points.</h2><div className="location-list">{locations.map((item) => <article key={item.title}><strong>{item.title}</strong><p><MapPin /> {item.address}</p><a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.mapQuery)}`} target="_blank" rel="noreferrer">Open this location <ArrowRight size={15} /></a></article>)}</div><p><Phone /> {displayPhone}</p><p><Phone /> Tel: {displayTelPhone}</p><p><Phone /> Mobile: {displayMobilePhone}</p><p><Mail /> {email}</p><a className="button whatsapp" href={whatsappUrl} target="_blank" rel="noreferrer"><MessageCircle size={17} /> WhatsApp Compustar</a></div><MapFrame mapQuery={mapQuery} /></section></>;
}

function MapFrame({ mapQuery }) {
  return <div className="map-shell" data-reveal><iframe title="Compustar location map" loading="lazy" referrerPolicy="no-referrer-when-downgrade" src={`https://www.google.com/maps?q=${mapQuery}&z=17&output=embed`}></iframe></div>;
}

function ContactPage() {
  return <><PageHero eyebrow="Contact" title="Ask about products, repairs, or support." text="Use the contact details below for availability, quotes, device issues, and general store enquiries." /><section className="contact-page section"><div className="contact-panel" data-reveal><h2>Send a clear enquiry.</h2><p>Include the product name, budget, device model, or support issue. That gives the team enough context to respond properly.</p><ul><li><CheckCircle2 /> Product name or category</li><li><CheckCircle2 /> Device model if it is a repair</li><li><CheckCircle2 /> Phone number or preferred contact method</li></ul></div><div className="contact-card" data-reveal><a href={`mailto:${email}?subject=Compustar%20Website%20Enquiry`}><Mail /> {email}</a><a href={`tel:${phone}`}><Phone /> {displayPhone}</a><a href={`tel:${telPhone}`}><Phone /> Tel: {displayTelPhone}</a><a href={`tel:${mobilePhone}`}><Phone /> Mobile: {displayMobilePhone}</a>{locations.map((item) => <p key={item.title}><MapPin /> {item.address}</p>)}<a className="button whatsapp" href={whatsappUrl} target="_blank" rel="noreferrer"><MessageCircle size={17} /> WhatsApp Compustar</a><a className="button primary" href={`mailto:${email}?subject=Compustar%20Website%20Enquiry`}>Email Compustar</a></div></section></>;
}

function PageHero({ eyebrow, title, text }) { return <section className="page-hero"><p className="kicker" data-hero>{eyebrow}</p><h1 data-hero>{title}</h1><p data-hero>{text}</p></section>; }
function SectionIntro({ eyebrow, title, text }) { return <div className="section-intro" data-reveal><div><p className="kicker">{eyebrow}</p><h2>{title}</h2></div><p>{text}</p></div>; }
function ProductGrid({ products: list }) { return <div className="product-grid gallery-grid">{list.map((product) => <ProductCard key={product.file} product={product} />)}</div>; }
function ProductCarousel({ products: list }) { const slides = [...list, ...list]; return <div className="product-slider" data-reveal><div className="product-track">{slides.map((product, index) => <ProductCard key={`${product.file}-${index}`} product={product} />)}</div></div>; }
function ProductCard({ product }) { return <article className="product-card gallery-card" data-reveal><div className="product-image"><img src={`/products/${product.file}`} alt="Compustar product" loading="lazy" /></div><div className="product-overlay"><a href={route('Contact')} onClick={(event) => goToPage(event, 'Contact')}>Enquire <ArrowRight size={16} /></a></div></article>; }
function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-brand">
        <img src="/logo.png" alt="Compustar logo" />
        <p>Computer products, repairs, security, networking, and IT support across Gaborone.</p>
        <a className="footer-social" href={instagramUrl} target="_blank" rel="noreferrer" aria-label="Compustar on Instagram">
          <Instagram size={18} /> @compustarbw
        </a>
      </div>
      <nav className="footer-links" aria-label="Footer navigation">
        <strong>Explore</strong>
        {pages.map((item) => <a href={route(item)} onClick={(event) => goToPage(event, item)} key={item}>{item}</a>)}
      </nav>
      <section className="footer-contact">
        <strong>Contact</strong>
        <a href={`mailto:${email}?subject=Compustar%20Website%20Enquiry`}><Mail /> {email}</a>
        <a href={`tel:${phone}`}><Phone /> {displayPhone}</a>
        <a href={`tel:${telPhone}`}><Phone /> Tel: {displayTelPhone}</a>
        <a href={`tel:${mobilePhone}`}><Phone /> Mobile: {displayMobilePhone}</a>
        {locations.map((item) => <span key={item.title}><Store /> {item.address}</span>)}
      </section>
      <div className="footer-bottom">
        <span>@ Compustar {new Date().getFullYear()}. All rights reserved.</span>
        <a href="https://futurifydesigns.com" target="_blank" rel="noreferrer">Built by Futurify Designs</a>
      </div>
    </footer>
  );
}

createRoot(document.getElementById('root')).render(<App />);
