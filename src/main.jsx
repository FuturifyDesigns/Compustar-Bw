import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import L from 'leaflet';
import {
  ArrowRight,
  Buildings,
  Camera,
  CaretLeft,
  CaretRight,
  CheckCircle,
  Cpu,
  EnvelopeSimple,
  GraduationCap,
  Handshake,
  Lightbulb,
  List,
  MagnifyingGlass,
  MapPin,
  Monitor,
  Pause,
  Phone,
  Play,
  Printer,
  SealCheck,
  ShoppingCart,
  Sparkle,
  Storefront,
  Target,
  Users,
  WifiHigh,
  Wrench,
  X
} from '@phosphor-icons/react';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import productsJson from './products.json';
import { AdminProvider, useAdmin } from './cms/AdminContext';
import { AdminBar, AdminPage, AdvertEditorButton, CMSText, EditableText, ProductEditorButton } from './cms/AdminUI';
import './styles.css';

gsap.registerPlugin(ScrollTrigger);

if (import.meta.env.PROD) {
  import('virtual:pwa-register').then(({ registerSW }) => {
    registerSW({
      immediate: true,
      onRegisteredSW(_url, registration) {
        if (!registration) return;
        const checkForUpdates = () => registration.update();
        window.setInterval(checkForUpdates, 30 * 60 * 1000);
        window.addEventListener('focus', checkForUpdates);
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') checkForUpdates();
        });
      }
    });
  });
}

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow
});

const iconProps = { size: 22, weight: 'fill' };
const email = 'compustarbw@gmail.com';
const phone = '76004665';
const displayPhone = '+267 760 04665';
const telPhone = '3111542';
const displayTelPhone = '+267 311 1542';
const mobilePhone = '75294155';
const displayMobilePhone = '+267 752 94155';
const whatsappPhone = '26776004665';
const whatsappUrl = `https://wa.me/${whatsappPhone}`;
const instagramUrl = 'https://www.instagram.com/compustarbw';
const facebookUrl = 'https://www.facebook.com/share/1FeVt4ccKB/';
const locations = [
  {
    title: 'Game City Mall',
    address: 'Shop No. 6U, Upstairs, Game City Mall, Gaborone, Botswana',
    tel: displayTelPhone,
    mobile: displayPhone,
    mobileTel: phone,
    mapQuery: 'Compustar Shop 6U Game City Mall Gaborone Botswana',
    coords: [-24.6864, 25.8772]
  },
  {
    title: 'G-West Industrial',
    address: 'Plot 27576/4, Aga House, G-West Industrial, Gaborone, Botswana',
    tel: displayTelPhone,
    mobile: displayMobilePhone,
    mobileTel: mobilePhone,
    mapQuery: 'G-West Industrial Plot 27576/4 Aga House Gaborone Botswana',
    coords: [-24.6747, 25.8964]
  }
];
const pages = ['Home', 'About', 'Products', 'Adverts', 'Services', 'Repairs', 'Location', 'Contact'];
const fallbackProducts = productsJson.map((item) => ({
  ...item,
  title: '',
  category: '',
  image_url: `/products/${item.file.replace(/\.(jpe?g|png)$/i, '.webp')}`
}));
const advertSlideMs = 8000;
const fallbackAdverts = [
  { file: '/adverts/pos-solutions.webp', title: 'POS Solutions', text: 'Smart business. Seamless sales. Point of sale systems that power your business.' },
  { file: '/adverts/digital-partner.webp', title: 'Your Digital Partner', text: 'Innovative technology, quality products and reliable solutions for every customer.' },
  { file: '/adverts/new-location-aga.webp', title: 'New Location — Aga House', text: 'Better service, closer to you at G-West Industrial, Plot 27576/4.' },
  { file: '/adverts/new-location-announcement.webp', title: 'New Location Announcement', text: 'Wider range, better service and the same Compustar commitment.' },
  { file: '/adverts/laptops.webp', title: 'Laptops for Work, Study & Play', text: 'Power your potential with everyday, business, gaming and creator laptops.' },
  { file: '/adverts/gaming-computers.webp', title: 'Gaming Computers', text: 'Game on. Perform big. Ready-made and custom builds for every level.' },
  { file: '/adverts/new-location-commitment.webp', title: 'Same Commitment, New Location', text: 'Visit Compustar at Aga House — easy to find, easy to reach.' },
  { file: '/adverts/accessories.webp', title: 'Accessories & Gear', text: 'Every accessory. Every possibility. Cables, storage, peripherals and more.' },
  { file: '/adverts/hilook-surveillance.webp', title: 'HiLook Surveillance', text: 'Smart security powered by Hikvision — clearer vision, stronger protection.' },
  { file: '/adverts/new-location-tech-destination.webp', title: 'Your Tech Destination', text: 'New location at G-West Industrial with the full Compustar product range.' }
];
const seo = {
  Home: ['Compustar Botswana | Computer Sales, Repairs & IT Support', 'Computers, printers, surveillance, networking, accessories, repairs, and IT support from Game City Mall in Gaborone.'],
  About: ['About Compustar Botswana | Your Digital Partner', 'Learn about Compustar Botswana — a technology and electronics partner providing practical products and solutions for individuals, businesses, and institutions.'],
  Products: ['Products | Compustar Botswana', 'Browse computer, networking, surveillance, power, and technology products available for enquiry from Compustar Botswana.'],
  Adverts: ['Adverts | Compustar Botswana', 'Browse Compustar promotional adverts for POS, laptops, gaming PCs, accessories, surveillance, and new store locations in Gaborone.'],
  Services: ['Technology Services | Compustar Botswana', 'Computer sales, printer support, networking, surveillance systems, and practical technology guidance in Gaborone.'],
  Repairs: ['Computer Repairs | Compustar Botswana', 'Ask Compustar Botswana about computer diagnostics, upgrades, setup issues, replacement parts, and repair support.'],
  Location: ['Compustar Location | Game City Mall, Gaborone', 'Visit Compustar at Shop 6U upstairs in Game City Mall, Gaborone, Botswana.'],
  Contact: ['Contact Compustar Botswana', 'Contact Compustar Botswana about product availability, prices, repairs, quotes, and technology support.'],
  Admin: ['Admin | Compustar Botswana', 'Compustar site studio sign in.']
};

function toWebp(src) {
  if (!src || src.startsWith('http') || src.endsWith('.webp')) return src;
  return src.replace(/\.(jpe?g|png)$/i, '.webp');
}

function mediaSrc(item) {
  const src = item?.image_url || item?.file || '';
  if (!src) return '';
  if (src.startsWith('http') || src.startsWith('/')) return src;
  return `/products/${src}`;
}

function SmartImage({ src, alt, className, loading = 'lazy', fetchPriority = 'low', ...props }) {
  const webp = toWebp(src);
  const usePicture = webp && webp !== src && !src.startsWith('http');
  if (!usePicture) {
    return <img src={src} alt={alt} className={className} loading={loading} decoding="async" fetchPriority={fetchPriority} {...props} />;
  }
  return (
    <picture>
      <source srcSet={webp} type="image/webp" />
      <img src={src} alt={alt} className={className} loading={loading} decoding="async" fetchPriority={fetchPriority} {...props} />
    </picture>
  );
}

function WhatsAppIcon({ size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function InstagramIcon({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  );
}

function FacebookIcon({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047v-2.66c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.49 0-1.956.93-1.956 1.886v2.265h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
    </svg>
  );
}

function App() {
  return (
    <AdminProvider fallbackProducts={fallbackProducts} fallbackAdverts={fallbackAdverts}>
      <AppShell />
    </AdminProvider>
  );
}

function AppShell() {
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

  if (page === 'Admin') {
    return (
      <>
        <AdminBar />
        <AdminPage onEnterSite={() => goToPage({ preventDefault() {} }, 'Home')} />
      </>
    );
  }

  return (
    <>
      <AdminBar />
      <Header menuOpen={menuOpen} page={page} setMenuOpen={setMenuOpen} />
      <main>
        {page === 'Home' && <HomePage />}
        {page === 'About' && <AboutPage />}
        {page === 'Products' && <ProductsPage />}
        {page === 'Adverts' && <AdvertsPage />}
        {page === 'Services' && <ServicesPage />}
        {page === 'Repairs' && <RepairsPage />}
        {page === 'Location' && <LocationPage />}
        {page === 'Contact' && <ContactPage />}
      </main>
      <Footer />
      <OfflineNotice />
      <a className="whatsapp-fab" href={whatsappUrl} target="_blank" rel="noreferrer" aria-label="Chat on WhatsApp">
        <WhatsAppIcon size={28} />
      </a>
    </>
  );
}

function OfflineNotice() {
  const [offline, setOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const goOffline = () => setOffline(true);
    const goOnline = () => setOffline(false);
    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);
    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online', goOnline);
    };
  }, []);

  if (!offline) return null;
  return <div className="offline-banner" role="status">You are offline. Browsing saved Compustar pages and images.</div>;
}

function usePageSeo(page) {
  useEffect(() => {
    const [title, description] = seo[page] || seo.Home;
    const pageUrl = `https://compustar.co.bw${route(page)}`;
    document.title = title;
    document.querySelector('meta[name="description"]')?.setAttribute('content', description);
    document.querySelector('link[rel="canonical"]')?.setAttribute('href', pageUrl);
    document.querySelector('meta[property="og:url"]')?.setAttribute('content', pageUrl);
    document.querySelector('meta[property="og:title"]')?.setAttribute('content', title);
    document.querySelector('meta[property="og:description"]')?.setAttribute('content', description);
    document.querySelector('meta[name="twitter:title"]')?.setAttribute('content', title);
    document.querySelector('meta[name="twitter:description"]')?.setAttribute('content', description);
    let robots = document.querySelector('meta[name="robots"]');
    if (page === 'Admin') {
      if (!robots) {
        robots = document.createElement('meta');
        robots.name = 'robots';
        document.head.appendChild(robots);
      }
      robots.setAttribute('content', 'noindex, nofollow');
    } else if (robots) {
      robots.setAttribute('content', 'index, follow');
    }
  }, [page]);
}

function getInitialPage() {
  const value = window.location.pathname.replace(/^\/+/, '').replace(/\/+$/, '');
  if (value.toLowerCase() === 'admin') return 'Admin';
  return pages.includes(value) ? value : 'Home';
}

function route(page) {
  if (page === 'Home') return '/';
  if (page === 'Admin') return '/admin';
  return `/${page}`;
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
      <a className="brand" href={route('Home')} onClick={(event) => goToPage(event, 'Home')} aria-label="Compustar home"><SmartImage src="/logo.png" alt="Compustar logo" loading="eager" fetchPriority="high" /></a>
      <button className="menu-button" onClick={() => setMenuOpen((open) => !open)} aria-label="Toggle menu">{menuOpen ? <X {...iconProps} /> : <List {...iconProps} />}</button>
      <nav className={menuOpen ? 'open' : ''}>{pages.map((item) => <a className={page === item ? 'active' : ''} href={route(item)} onClick={(event) => goToPage(event, item)} key={item}>{item}</a>)}</nav>
    </header>
  );
}

function HomePage() {
  const { products, getContent } = useAdmin();
  const featuredProducts = products.slice(0, 14);
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <EditableText as="p" className="kicker" contentKey="home.hero.kicker" value={getContent('home.hero.kicker', 'Compustar Botswana')} />
          <EditableText as="h1" contentKey="home.hero.title" value={getContent('home.hero.title', 'Technology products, repairs, and IT support.')} />
          <EditableText as="p" multiline contentKey="home.hero.text" value={getContent('home.hero.text', 'Browse featured products, request availability, and get help with computers, printers, surveillance systems, networking, and repairs.')} />
          <div className="hero-actions" data-hero>
            <a className="button primary" href={route('Products')} onClick={(event) => goToPage(event, 'Products')}>Browse Products <ArrowRight size={18} weight="bold" /></a>
            <a className="button secondary" href={route('Location')} onClick={(event) => goToPage(event, 'Location')}>Find the Store</a>
          </div>
        </div>
        <div className="hero-showcase" data-hero>
          <video src="/hero-logo.mp4" poster="/logo.webp" muted loop autoPlay playsInline preload="metadata" aria-label="Compustar logo animation"></video>
          <div>
            <span><Camera {...iconProps} /> Surveillance</span>
            <span><Monitor {...iconProps} /> Computers</span>
            <span><WifiHigh {...iconProps} /> Networking</span>
          </div>
        </div>
      </section>
      <section className="quick-paths">
        {[
          [MagnifyingGlass, 'Product Enquiries', 'Browse standalone product photos and ask about current availability.'],
          [Wrench, 'Repairs & Upgrades', 'Support for slow computers, setup issues, upgrades, and diagnostics.'],
          [WifiHigh, 'Security & Networking', 'Camera systems, GPS trackers, network cables, and office connectivity.']
        ].map(([Icon, title, text], index) => (
          <article key={title} data-reveal>
            <Icon {...iconProps} size={26} />
            <h3><EditableText contentKey={`home.quick.${index}.title`} value={getContent(`home.quick.${index}.title`, title)} /></h3>
            <p><EditableText multiline contentKey={`home.quick.${index}.text`} value={getContent(`home.quick.${index}.text`, text)} /></p>
          </article>
        ))}
      </section>
      <section className="section product-showcase-section">
        <SectionIntro contentPrefix="home.gallery" eyebrow="Product gallery" title="A quick look at what customers can ask about." text="A visual showcase of products available for enquiries at the store." />
        <ProductCarousel products={featuredProducts} />
        <div className="center-row" data-reveal>
          <a className="button dark" href={route('Products')} onClick={(event) => goToPage(event, 'Products')}>View full gallery <ArrowRight size={18} weight="bold" /></a>
        </div>
      </section>
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
    [SealCheck, 'Professional Service', 'We treat every customer and organisation with professionalism and respect.'],
    [Target, 'Practical Solutions', 'We focus on understanding the requirement and identifying technology that fits the intended use.'],
    [Sparkle, 'Competitive Value', "We strive to provide competitive quotations based on the customer's requirements and current market conditions."],
    [Phone, 'Responsiveness', 'We understand that customers often need quick answers. We aim to respond promptly to enquiries, quotations and product requests.'],
    [Handshake, 'Long-Term Relationships', 'We want customers to return to Compustar whenever they have another technology requirement.']
  ];
  const values = [
    [SealCheck, 'Integrity', 'We conduct our business honestly and professionally.'],
    [Users, 'Customer Focus', 'Our customers are at the centre of what we do.'],
    [CheckCircle, 'Reliability', 'We strive to deliver dependable products and service.'],
    [Buildings, 'Professionalism', 'We maintain high standards in how we communicate and conduct business.'],
    [Lightbulb, 'Innovation', 'We embrace technology and continuously look for better ways to serve our customers.'],
    [Handshake, 'Partnership', 'We seek to build long-term relationships rather than one-time transactions.']
  ];
  const focusAreas = [
    [Buildings, 'Technology for Business', [
      'Businesses depend on technology every day.',
      'A computer that fails, a printer that stops working, inadequate networking or outdated equipment can affect productivity and customer service.',
      'Compustar helps businesses access technology products required for their daily operations, whether they are starting a business, expanding an office, replacing equipment, upgrading infrastructure or equipping a new site.',
      'Our objective is to make technology procurement simpler, more convenient and more responsive.'
    ]],
    [GraduationCap, 'Education & Student Technology', [
      'Technology plays an increasingly important role in education.',
      'Compustar supports students, educators and educational institutions with technology products ranging from personal laptops and accessories to computers, printers, networking equipment and other ICT requirements.',
      'For institutions, we can engage on bulk requirements and equipment procurement, while students and individual customers can access practical technology options for learning, research, assignments, online education and everyday computing.'
    ]],
    [Camera, 'CCTV & Security Solutions', [
      'Security is an important consideration for businesses, institutions, homes and commercial premises.',
      'Compustar provides access to CCTV and security technology solutions, helping customers explore surveillance options appropriate to their premises and requirements.',
      'From smaller installations to larger multi-camera requirements, our team can assist customers in identifying suitable equipment and solutions, subject to site requirements and product availability.'
    ]],
    [ShoppingCart, 'POS & Business Technology', [
      'For retailers and businesses handling daily transactions, reliable technology is essential.',
      'Compustar supplies POS equipment and related accessories designed to support businesses with their point-of-sale requirements.',
      'Whether you are establishing a new business, opening a new branch or upgrading existing equipment, we can assist with identifying appropriate technology requirements.'
    ]]
  ];

  return (
    <>
      <PageHero contentPrefix="about.hero" eyebrow="About Us" title="About Compustar — Your Digital Partner." text="Compustar is a Botswana-based technology and electronics company dedicated to providing reliable, practical and accessible technology solutions to individuals, businesses, institutions and organisations." />

      <section className="section about-intro">
        <div className="about-intro-grid">
          <div className="about-copy" data-reveal>
            <CMSText as="p" className="kicker" contentKey="about.intro.kicker" fallback="About Compustar" />
            <CMSText as="h2" contentKey="about.intro.title" fallback="Your Digital Partner." />
            <CMSText as="p" multiline contentKey="about.intro.p1" fallback="Compustar is a Botswana-based technology and electronics company dedicated to providing reliable, practical and accessible technology solutions to individuals, businesses, institutions and organisations." />
            <CMSText as="p" multiline contentKey="about.intro.p2" fallback="We understand that technology is no longer simply an accessory to business — it is an essential part of how organisations operate, communicate, serve customers, manage information and grow." />
            <CMSText as="p" multiline contentKey="about.intro.p3" fallback="Our role is to help our customers access the right technology products and solutions to support these needs." />
            <CMSText as="p" multiline contentKey="about.intro.p4" fallback="From an individual purchasing a laptop or accessory to a business equipping an entire office, a school establishing a computer laboratory, a hospital strengthening its ICT infrastructure, or an organisation requiring technology equipment in bulk, Compustar is positioned to provide solutions tailored to different requirements and budgets." />
          </div>
          <aside className="about-highlight" data-reveal>
            <CMSText as="p" className="kicker" contentKey="about.serve.kicker" fallback="Who we serve" />
            <ul>
              {['Individuals & households', 'Businesses & SMEs', 'Schools & institutions', 'Hospitals & NGOs', 'Corporate & bulk buyers'].map((item, index) => (
                <li key={item}>
                  <CheckCircle {...iconProps} />
                  <CMSText contentKey={`about.serve.item.${index}`} fallback={item} />
                </li>
              ))}
            </ul>
            <a className="button primary" href={route('Contact')} onClick={(event) => goToPage(event, 'Contact')}>Talk to Compustar <ArrowRight size={16} weight="bold" /></a>
          </aside>
        </div>
      </section>

      <section className="section about-approach">
        <SectionIntro contentPrefix="about.approach" eyebrow="Our Approach" title="More than supplying products." text="At Compustar, we believe that selling technology is about more than simply supplying products. It is about understanding the customer's requirement, recommending the appropriate solution, delivering professionally and building a relationship that continues beyond the initial purchase. Our approach is built around:" />
        <div className="approach-flow">
          {approach.map((step, index) => (
            <article className="approach-step" data-approach-step key={step}>
              <span className="approach-step-num">{String(index + 1).padStart(2, '0')}</span>
              <h3><CMSText contentKey={`about.approach.step.${index}`} fallback={step} /></h3>
              {index < approach.length - 1 && <ArrowRight className="approach-arrow" size={18} weight="bold" />}
            </article>
          ))}
        </div>
        <p className="about-note" data-reveal>
          <CMSText multiline contentKey="about.approach.note" fallback="We work with customers to understand what they need before recommending suitable products and solutions. This allows us to provide practical options rather than simply selling equipment." as="span" />
        </p>
      </section>

      <section className="section about-products">
        <SectionIntro contentPrefix="about.products" eyebrow="Our Products & Solutions" title="A broad range of technology products." text="Compustar provides access to a broad range of technology products and solutions, including the categories below. Product availability, specifications and brands may vary according to current stock and customer requirements." />
        <div className="about-product-grid" data-stagger>
          {productsList.map((item, index) => (
            <article className="about-product-item" data-stagger-item key={item}>
              <MagnifyingGlass size={18} weight="fill" />
              <span><CMSText contentKey={`about.products.item.${index}`} fallback={item} /></span>
            </article>
          ))}
        </div>
      </section>

      <section className="section about-corporate">
        <div className="about-corporate-grid">
          <div className="about-copy" data-reveal>
            <CMSText as="p" className="kicker" contentKey="about.corporate.kicker" fallback="Corporate & Institutional Solutions" />
            <CMSText as="h2" contentKey="about.corporate.title" fallback="Technology procurement for organisations." />
            <CMSText as="p" multiline contentKey="about.corporate.p1" fallback="Compustar is developing a strong Corporate and Institutional Supply Division designed to serve organisations with their technology procurement requirements." />
            <CMSText as="p" multiline contentKey="about.corporate.p2" fallback="We understand that organisations often require more than a single product. They may need multiple computers, printers, networking equipment, CCTV systems, POS equipment, accessories and other technology products as part of a project, office setup, expansion or replacement programme." />
            <CMSText as="p" multiline contentKey="about.corporate.p3" fallback="Our corporate and institutional offering is therefore designed to support the organisations listed here." />
            <CMSText as="p" multiline contentKey="about.corporate.p4" fallback="We welcome opportunities involving supplier registration, RFQs, quotations, bulk purchases, institutional requirements, tenders and recurring supply arrangements, subject to applicable procurement procedures." />
          </div>
          <div className="institution-list" data-stagger>
            <CMSText as="p" className="kicker" contentKey="about.institutions.kicker" fallback="Designed to support" />
            {institutions.map((item, index) => (
              <article data-stagger-item key={item}>
                <Buildings size={16} weight="fill" />
                <span><CMSText contentKey={`about.institutions.item.${index}`} fallback={item} /></span>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section about-focus">
        <SectionIntro contentPrefix="about.focus" eyebrow="Specialist Areas" title="Practical support across key sectors." text="From business operations to education, security and point-of-sale technology — Compustar helps customers find the right fit." />
        <div className="about-focus-grid" data-stagger>
          {focusAreas.map(([Icon, title, paragraphs], index) => (
            <article className="about-focus-card" data-stagger-item key={title}>
              <Icon {...iconProps} size={28} />
              <h3><CMSText contentKey={`about.focus.${index}.title`} fallback={title} /></h3>
              {paragraphs.map((paragraph, pIndex) => (
                <CMSText as="p" multiline key={`${title}-${pIndex}`} contentKey={`about.focus.${index}.p${pIndex}`} fallback={paragraph} />
              ))}
            </article>
          ))}
        </div>
        <div className="business-journey" data-stagger>
          {businessJourney.map((item, index) => (
            <span className="business-journey-item" data-stagger-item key={item}>
              <CMSText contentKey={`about.journey.${index}`} fallback={item} />
            </span>
          ))}
        </div>
      </section>

      <section className="section about-commitment">
        <SectionIntro contentPrefix="about.commitment" eyebrow="Our Commitment to Customers" title="Our commitment is simple." text="Provide the right technology. Deliver professional service. Build lasting relationships. We aim to achieve this through:" />
        <div className="commitment-grid" data-stagger>
          {commitments.map(([Icon, title, text], index) => (
            <article data-stagger-item key={title}>
              <Icon {...iconProps} size={26} />
              <h3><CMSText contentKey={`about.commitment.${index}.title`} fallback={title} /></h3>
              <CMSText as="p" multiline contentKey={`about.commitment.${index}.text`} fallback={text} />
            </article>
          ))}
        </div>
      </section>

      <section className="section about-mission">
        <div className="mission-grid" data-stagger>
          <article className="mission-card vision" data-stagger-item>
            <Target {...iconProps} size={28} />
            <CMSText as="p" className="kicker" contentKey="about.vision.kicker" fallback="Our Vision" />
            <h3><CMSText contentKey="about.vision.title" fallback="Trusted technology partner for Botswana." /></h3>
            <CMSText as="p" multiline contentKey="about.vision.text" fallback="To become one of Botswana's trusted technology and electronics partners, recognised for reliable products, professional service, responsive customer support and practical technology solutions." />
          </article>
          <article className="mission-card mission" data-stagger-item>
            <Sparkle {...iconProps} size={28} />
            <CMSText as="p" className="kicker" contentKey="about.mission.kicker" fallback="Our Mission" />
            <h3><CMSText contentKey="about.mission.title" fallback="Make technology accessible and practical." /></h3>
            <CMSText as="p" multiline contentKey="about.mission.text" fallback="To make technology accessible, reliable and practical by providing quality products, responsive service and technology solutions that help individuals, businesses and institutions achieve their objectives." />
          </article>
        </div>
      </section>

      <section className="section about-values">
        <SectionIntro contentPrefix="about.values" eyebrow="Our Values" title="How we work with every customer." text="These principles shape the way Compustar communicates, supplies and supports." />
        <div className="values-grid" data-stagger>
          {values.map(([Icon, title, text], index) => (
            <article data-stagger-item key={title}>
              <Icon {...iconProps} size={26} />
              <h3><CMSText contentKey={`about.values.${index}.title`} fallback={title} /></h3>
              <CMSText as="p" multiline contentKey={`about.values.${index}.text`} fallback={text} />
            </article>
          ))}
        </div>
      </section>

      <section className="section about-why">
        <div className="why-panel" data-reveal>
          <CMSText as="p" className="kicker" contentKey="about.why.kicker" fallback="Why Compustar?" />
          <CMSText as="h2" contentKey="about.why.title" fallback="Because your technology requirements deserve more than a product catalogue." />
          <CMSText as="p" multiline contentKey="about.why.p1" fallback="They deserve a partner who listens, understands your requirements and helps you find practical solutions." />
          <CMSText as="p" multiline contentKey="about.why.p2" fallback="Whether you need one laptop, accessories for your business, a complete office setup, CCTV equipment, POS solutions, networking equipment or technology products in bulk, Compustar is ready to assist." />
          <p className="why-tagline"><CMSText contentKey="about.why.tagline" fallback="From individual customers to large organisations, we are ready to be your Digital Partner." as="span" /></p>
          <p className="why-close"><CMSText contentKey="about.why.close" fallback="Compustar. Your Digital Partner." as="span" /></p>
          <div className="hero-actions">
            <a className="button primary" href={route('Contact')} onClick={(event) => goToPage(event, 'Contact')}>Get in touch <ArrowRight size={16} weight="bold" /></a>
            <a className="button secondary" href={route('Products')} onClick={(event) => goToPage(event, 'Products')}>Browse products</a>
          </div>
        </div>
      </section>

      <section className="section about-locations">
        <SectionIntro contentPrefix="about.locations" eyebrow="Visit Us" title="Compustar — Your Digital Partner." text="Find us at Game City Mall and G-West Industrial in Gaborone." />
        <div className="about-location-grid" data-stagger>
          {locations.map((item, index) => (
            <article data-stagger-item key={item.title}>
              <Storefront {...iconProps} size={26} />
              <h3><CMSText contentKey={`footer.location.${index === 0 ? 'gamecity' : 'gwest'}.title`} fallback={item.title} /></h3>
              <p><MapPin size={16} weight="fill" /> <CMSText contentKey={`footer.location.${index === 0 ? 'gamecity' : 'gwest'}.address`} fallback={item.address} /></p>
              <p><Phone size={16} weight="fill" /> Tel: <CMSText contentKey="site.tel_display" fallback={item.tel} /></p>
              <p><Phone size={16} weight="fill" /> Mobile: <CMSText contentKey={index === 0 ? 'site.phone_display' : 'site.mobile_display'} fallback={item.mobile} /></p>
              <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.mapQuery)}`} target="_blank" rel="noreferrer">Open map <ArrowRight size={15} weight="bold" /></a>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}

function ProductsPage() {
  const { products } = useAdmin();
  const [visible, setVisible] = useState(24);
  return (
    <>
      <PageHero contentPrefix="products.hero" eyebrow="Products" title="A clean product gallery for quick enquiries." text="Browse the product photos and contact Compustar to confirm availability, pricing, or suitable alternatives." />
      <section className="section catalogue-section">
        <div className="cms-toolbar"><ProductEditorButton onAdd /></div>
        <ProductGrid products={products.slice(0, visible)} />
        {visible < products.length && (
          <div className="center-row">
            <button className="button dark" onClick={() => setVisible((count) => count + 24)}>Show more products</button>
          </div>
        )}
      </section>
    </>
  );
}

function advertThumb(item) {
  const src = mediaSrc(item);
  if (!src || src.startsWith('http')) return src;
  const name = src.split('/').pop();
  if (src.includes('/adverts/') && !src.includes('/thumbs/')) return `/adverts/thumbs/${toWebp(name)}`;
  return src;
}

function AdvertsPage() {
  const { adverts, editMode, isAdmin } = useAdmin();
  const editing = isAdmin && editMode;
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const stageRef = useRef(null);
  const safeIndex = adverts.length ? index % adverts.length : 0;
  const current = adverts[safeIndex];

  useEffect(() => {
    if (editing) setPlaying(false);
  }, [editing]);

  useEffect(() => {
    if (editing || !playing || adverts.length < 2) return undefined;
    setProgress(0);
    const started = performance.now();
    let frame = 0;
    const loop = (now) => {
      const nextProgress = Math.min(1, (now - started) / advertSlideMs);
      setProgress(nextProgress);
      if (nextProgress >= 1) {
        setIndex((value) => (value + 1) % adverts.length);
        return;
      }
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [safeIndex, playing, adverts.length, editing]);

  useEffect(() => {
    if (!stageRef.current || !current) return undefined;
    const image = stageRef.current.querySelector('.advert-slide');
    const copy = stageRef.current.querySelector('.advert-copy');
    const targets = [image, copy].filter(Boolean);
    if (!targets.length) return undefined;
    if (editing) {
      gsap.set(targets, { autoAlpha: 1, y: 0, clearProps: 'visibility,opacity,transform' });
      return undefined;
    }
    const animation = gsap.fromTo(targets, { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 0.55, stagger: 0.06, ease: 'power3.out', clearProps: 'visibility,opacity,transform' });
    return () => animation.kill();
  }, [safeIndex, current, editing]);

  useEffect(() => {
    if (adverts.length < 2) return undefined;
    const next = adverts[(safeIndex + 1) % adverts.length];
    const href = mediaSrc(next);
    if (!href) return undefined;
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.as = 'image';
    link.href = href;
    document.head.appendChild(link);
    return () => link.remove();
  }, [safeIndex, adverts]);

  const goTo = (nextIndex) => {
    if (!adverts.length) return;
    setIndex((nextIndex + adverts.length) % adverts.length);
    setProgress(0);
  };

  return (
    <>
      <PageHero
        contentPrefix="adverts.hero"
        eyebrow="Adverts"
        title="Campaign showcase."
        text="Browse Compustar promotional adverts in an auto-playing showcase — POS, laptops, gaming, accessories, surveillance, and new location announcements."
      />
      <section className="section adverts-section">
        <div className="cms-toolbar"><AdvertEditorButton onAdd /></div>
        {!current ? (
          <p className="cms-empty">No adverts yet. Sign in as admin to add one.</p>
        ) : (
          <div className={`advert-showcase${editing ? ' is-editing' : ''}`} data-reveal ref={stageRef}>
            <div className="advert-stage">
              <SmartImage className="advert-blur" src={mediaSrc(current)} alt="" aria-hidden="true" loading="eager" fetchPriority="high" />
              <SmartImage className="advert-slide" src={mediaSrc(current)} alt={current.title || 'Advert'} loading="eager" fetchPriority="high" />
              <div className="advert-progress" aria-hidden="true"><span style={{ transform: `scaleX(${progress})` }} /></div>
              <AdvertEditorButton advert={current} />
            </div>
            <div className="advert-meta">
              <div className="advert-copy">
                <p className="kicker">Advert {safeIndex + 1} of {adverts.length}</p>
                <h2>{current.title || 'Untitled advert'}</h2>
                <p>{current.text}</p>
              </div>
              <div className="advert-controls">
                <button type="button" className="advert-nav" onClick={() => goTo(safeIndex - 1)} aria-label="Previous advert"><CaretLeft size={22} weight="bold" /></button>
                <button type="button" className="advert-nav" onClick={() => setPlaying((value) => !value)} aria-label={playing ? 'Pause slideshow' : 'Play slideshow'}>
                  {playing ? <Pause size={20} weight="fill" /> : <Play size={20} weight="fill" />}
                </button>
                <button type="button" className="advert-nav" onClick={() => goTo(safeIndex + 1)} aria-label="Next advert"><CaretRight size={22} weight="bold" /></button>
              </div>
            </div>
            <div className="advert-thumbs" role="tablist" aria-label="Advert thumbnails">
              {adverts.map((item, itemIndex) => (
                <button
                  type="button"
                  key={item.id || item.file || itemIndex}
                  className={itemIndex === safeIndex ? 'active' : ''}
                  onClick={() => goTo(itemIndex)}
                  aria-label={`Show ${item.title || 'advert'}`}
                  aria-selected={itemIndex === safeIndex}
                >
                  <SmartImage src={advertThumb(item)} alt="" loading="lazy" />
                </button>
              ))}
            </div>
          </div>
        )}
      </section>
    </>
  );
}

function ServicesPage() {
  const services = [
    [Cpu, 'Computer Sales', 'Laptops, desktops, monitors, accessories, and straightforward buying guidance.', '/context/service-computers.png'],
    [Printer, 'Printer Support', 'Printers, consumables, setup cables, and everyday office printing support.', '/context/service-printers.png'],
    [WifiHigh, 'Networking', 'Routers, CAT cables, Wi-Fi, printer sharing, and tidy connectivity planning.', '/context/service-networking.png'],
    [Camera, 'Surveillance Systems', 'Camera kits, recorders, GPS trackers, and security product enquiries.', '/context/service-security.png']
  ];
  const slides = [...services, ...services];
  return (
    <>
      <PageHero contentPrefix="services.hero" eyebrow="Services" title="Practical technology support for homes and businesses." text="Compustar helps customers choose equipment, set it up correctly, and keep everyday systems working." />
      <section className="section">
        <div className="horizontal-showcase auto-showcase service-slider">
          {slides.map(([Icon, title, text, image], index) => {
            const sourceIndex = index % services.length;
            return (
              <article className="service-card visual-card" key={`${title}-${index}`} data-reveal>
                <SmartImage src={image} alt="" loading="lazy" />
                <div>
                  <Icon {...iconProps} size={26} />
                  <h3><CMSText contentKey={`services.card.${sourceIndex}.title`} fallback={title} /></h3>
                  <CMSText as="p" multiline contentKey={`services.card.${sourceIndex}.text`} fallback={text} />
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </>
  );
}

function RepairsPage() {
  const steps = [
    ['01', 'Describe the problem', 'Send the device type, model, issue, and when it started.', '/context/repair-diagnose.png'],
    ['02', 'Get clear guidance', 'The team can advise whether it needs inspection, setup, or replacement parts.', '/context/repair-advise.png'],
    ['03', 'Visit the store', 'Bring the device or product details for final confirmation and support.', '/context/repair-visit.png']
  ];
  const slides = [...steps, ...steps];
  return (
    <>
      <PageHero contentPrefix="repairs.hero" eyebrow="Repairs" title="A simple repair path from enquiry to support." text="Customers can send the issue first, then visit the store with the right details instead of guessing what to bring." />
      <section className="section repair-story repair-story-full">
        <div className="horizontal-showcase auto-showcase repair-steps">
          {slides.map(([step, title, text, image], index) => {
            const sourceIndex = index % steps.length;
            return (
              <article className="repair-step" key={`${step}-${index}`} data-reveal>
                <SmartImage src={image} alt="" loading="lazy" />
                <div>
                  <span className="repair-step-num">{step}</span>
                  <h3><CMSText contentKey={`repairs.step.${sourceIndex}.title`} fallback={title} /></h3>
                  <CMSText as="p" multiline contentKey={`repairs.step.${sourceIndex}.text`} fallback={text} />
                  <a className="button dark" href={route('Contact')} onClick={(event) => goToPage(event, 'Contact')}>Ask about repairs</a>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </>
  );
}

function LocationPage() {
  return (
    <>
      <PageHero contentPrefix="location.hero" eyebrow="Location" title="Visit Compustar in Gaborone." text="Find Compustar for product enquiries, repairs, accessories, and practical technology support." />
      <section className="location-page section">
        <div className="location-card" data-reveal>
          <CMSText as="p" className="kicker" contentKey="location.card.kicker" fallback="Store Locations" />
          <CMSText as="h2" contentKey="location.card.title" fallback="Gaborone support points." />
          <div className="location-list">
            {locations.map((item, index) => {
              const key = index === 0 ? 'gamecity' : 'gwest';
              return (
                <article key={item.title}>
                  <strong><CMSText contentKey={`footer.location.${key}.title`} fallback={item.title} /></strong>
                  <p><MapPin weight="fill" /> <CMSText contentKey={`footer.location.${key}.address`} fallback={item.address} /></p>
                  <p><Phone weight="fill" /> Tel: <CMSText contentKey="site.tel_display" fallback={item.tel} /></p>
                  <p><Phone weight="fill" /> Mobile: <CMSText contentKey={index === 0 ? 'site.phone_display' : 'site.mobile_display'} fallback={item.mobile} /></p>
                  <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.mapQuery)}`} target="_blank" rel="noreferrer">
                    Open this location <ArrowRight size={15} weight="bold" />
                  </a>
                </article>
              );
            })}
          </div>
          <div className="contact-lines">
            <p><EnvelopeSimple weight="fill" /> <CMSText contentKey="site.email" fallback={email} /></p>
            <p><Phone weight="fill" /> Tel: <CMSText contentKey="site.tel_display" fallback={displayTelPhone} /></p>
          </div>
        </div>
        <LocationsMap />
      </section>
    </>
  );
}

function LocationsMap() {
  const containerRef = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      scrollWheelZoom: false,
      zoomControl: true
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    const bounds = L.latLngBounds([]);
    locations.forEach((item) => {
      const marker = L.marker(item.coords).addTo(map);
      marker.bindPopup(`<strong>${item.title}</strong><br>${item.address}<br>Tel: ${item.tel}<br>Mobile: ${item.mobile}`);
      bounds.extend(item.coords);
    });

    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 13 });
    mapRef.current = map;

    const resize = () => map.invalidateSize();
    window.addEventListener('resize', resize);
    requestAnimationFrame(resize);

    return () => {
      window.removeEventListener('resize', resize);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  return (
    <div className="map-shell" data-reveal>
      <div ref={containerRef} className="leaflet-map" role="img" aria-label="Map showing both Compustar locations in Gaborone" />
    </div>
  );
}

function ContactPage() {
  const { getContent } = useAdmin();
  const contactEmail = getContent('site.email', email);
  const contactTel = getContent('site.tel_display', displayTelPhone);
  const contactPhone = getContent('site.phone_display', displayPhone);
  const contactMobile = getContent('site.mobile_display', displayMobilePhone);
  const methods = [
    [EnvelopeSimple, 'Email', 'contact.method.email', 'Email', 'site.email', contactEmail, `mailto:${contactEmail}?subject=Compustar%20Website%20Enquiry`],
    [Phone, 'Telephone', 'contact.method.tel', 'Telephone', 'site.tel_display', contactTel, `tel:${contactTel.replace(/\D/g, '')}`],
    [Phone, 'Game City mobile', 'contact.method.gamecity', 'Game City mobile', 'site.phone_display', contactPhone, `tel:${contactPhone.replace(/\D/g, '')}`],
    [Phone, 'G-West mobile', 'contact.method.gwest', 'G-West mobile', 'site.mobile_display', contactMobile, `tel:${contactMobile.replace(/\D/g, '')}`]
  ];
  const tips = [
    'Product name, category or quantity',
    'Device model if it is a repair',
    'Budget or intended use, if known',
    'Your phone number or preferred contact method'
  ];

  return (
    <>
      <PageHero contentPrefix="contact.hero" eyebrow="Contact" title="Let’s find the right technology for you." text="Reach Compustar for availability, quotations, repairs, and bulk supply. A clear enquiry helps the team respond quickly." />
      <section className="contact-wrap">
        <div className="contact-layout">
          <article className="contact-intro" data-reveal>
            <CMSText as="p" className="kicker" contentKey="contact.intro.kicker" fallback="How to enquire" />
            <CMSText as="h2" contentKey="contact.intro.title" fallback="Send details we can act on." />
            <CMSText as="p" multiline contentKey="contact.intro.text" fallback="Tell us what you need and how to reach you. We will come back with availability, a quotation, or repair guidance." />
            <ol className="contact-tips">
              {tips.map((tip, index) => (
                <li key={tip}>
                  <span className="contact-tips-num">{String(index + 1).padStart(2, '0')}</span>
                  <CMSText contentKey={`contact.tip.${index}`} fallback={tip} />
                </li>
              ))}
            </ol>
            <div className="contact-socials">
              <a href={instagramUrl} target="_blank" rel="noreferrer" aria-label="Instagram"><InstagramIcon size={18} /></a>
              <a href={facebookUrl} target="_blank" rel="noreferrer" aria-label="Facebook"><FacebookIcon size={18} /></a>
            </div>
          </article>
          <article className="contact-sheet" data-reveal>
            <CMSText as="p" className="kicker" contentKey="contact.sheet.kicker" fallback="Direct lines" />
            <CMSText as="h2" contentKey="contact.sheet.title" fallback="Get in touch." />
            <div className="contact-rows">
              {methods.map(([Icon, key, labelKey, labelFallback, valueKey, value, href]) => (
                <a className="contact-row" href={href} key={key}>
                  <span className="contact-row-icon"><Icon size={20} weight="fill" /></span>
                  <span>
                    <em><CMSText contentKey={labelKey} fallback={labelFallback} /></em>
                    <strong><CMSText contentKey={valueKey} fallback={value} /></strong>
                  </span>
                  <ArrowRight size={16} weight="bold" />
                </a>
              ))}
            </div>
            <a className="button whatsapp contact-whatsapp" href={whatsappUrl} target="_blank" rel="noreferrer">
              <WhatsAppIcon size={18} /> <CMSText contentKey="contact.whatsapp" fallback="Chat on WhatsApp" />
            </a>
            <a className="contact-store-link" href={route('Location')} onClick={(event) => goToPage(event, 'Location')}>
              <CMSText contentKey="contact.store_link" fallback="Store addresses and map" /> <ArrowRight size={15} weight="bold" />
            </a>
          </article>
        </div>
      </section>
    </>
  );
}

function PageHero({ eyebrow, title, text, contentPrefix }) {
  const { getContent } = useAdmin();
  const eyebrowValue = contentPrefix ? getContent(`${contentPrefix}.eyebrow`, eyebrow) : eyebrow;
  const titleValue = contentPrefix ? getContent(`${contentPrefix}.title`, title) : title;
  const textValue = contentPrefix ? getContent(`${contentPrefix}.text`, text) : text;
  return (
    <section className="page-hero">
      {contentPrefix
        ? <EditableText as="p" className="kicker" contentKey={`${contentPrefix}.eyebrow`} value={eyebrowValue} />
        : <p className="kicker" data-hero>{eyebrow}</p>}
      {contentPrefix
        ? <EditableText as="h1" contentKey={`${contentPrefix}.title`} value={titleValue} />
        : <h1 data-hero>{title}</h1>}
      {contentPrefix
        ? <EditableText as="p" multiline contentKey={`${contentPrefix}.text`} value={textValue} />
        : <p data-hero>{text}</p>}
    </section>
  );
}

function SectionIntro({ eyebrow, title, text, contentPrefix }) {
  const { getContent } = useAdmin();
  const eyebrowValue = contentPrefix ? getContent(`${contentPrefix}.eyebrow`, eyebrow) : eyebrow;
  const titleValue = contentPrefix ? getContent(`${contentPrefix}.title`, title) : title;
  const textValue = contentPrefix ? getContent(`${contentPrefix}.text`, text) : text;
  return (
    <div className="section-intro" data-reveal>
      <div>
        {contentPrefix
          ? <EditableText as="p" className="kicker" contentKey={`${contentPrefix}.eyebrow`} value={eyebrowValue} />
          : <p className="kicker">{eyebrow}</p>}
        {contentPrefix
          ? <EditableText as="h2" contentKey={`${contentPrefix}.title`} value={titleValue} />
          : <h2>{title}</h2>}
      </div>
      {contentPrefix
        ? <EditableText as="p" multiline contentKey={`${contentPrefix}.text`} value={textValue} />
        : <p>{text}</p>}
    </div>
  );
}

function ProductGrid({ products: list }) {
  return (
    <div className="product-grid gallery-grid">
        {list.map((product, index) => <ProductCard key={product.id || product.file || index} product={product} priority={index < 8} />)}
    </div>
  );
}

function ProductCarousel({ products: list }) {
  const slides = [...list, ...list];
  return (
    <div className="product-slider" data-reveal>
      <div className="product-track">
        {slides.map((product, index) => <ProductCard key={`${product.id || product.file}-${index}`} product={product} priority={index < 6} />)}
      </div>
    </div>
  );
}

function ProductCard({ product, priority = false }) {
  const src = mediaSrc(product);
  const title = (product.title || product.name || '').trim();
  const category = (product.category || '').trim();
  const description = (product.description || '').trim();
  const hasPrice = product.price != null && product.price !== '';
  const hasMeta = title || category || description || hasPrice;
  return (
    <article className="product-card gallery-card" data-reveal>
      <div className="product-image">
        <SmartImage src={src} alt={title || 'Compustar product'} loading={priority ? 'eager' : 'lazy'} fetchPriority={priority ? 'high' : 'low'} />
        <ProductEditorButton product={product} />
      </div>
      {hasMeta && (
        <div className="product-meta">
          {category ? <span className="product-category">{category}</span> : null}
          {title ? <strong>{title}</strong> : null}
          {hasPrice && (
            <span className="product-price">{product.currency || 'BWP'} {Number(product.price).toLocaleString()}</span>
          )}
          {description ? <p className="product-description">{description}</p> : null}
        </div>
      )}
      <div className="product-overlay">
        <a href={route('Contact')} onClick={(event) => goToPage(event, 'Contact')}>
          Enquire <ArrowRight size={16} weight="bold" />
        </a>
      </div>
    </article>
  );
}

function Footer() {
  const { getContent } = useAdmin();
  const footerEmail = getContent('site.email', email);
  const footerTel = getContent('site.tel_display', displayTelPhone);
  const footerPhone = getContent('site.phone_display', displayPhone);
  const footerMobile = getContent('site.mobile_display', displayMobilePhone);
  const blurb = getContent('footer.blurb', 'Computer products, repairs, security, networking, and IT support across Gaborone.');
  const gameCityAddress = getContent('footer.location.gamecity.address', locations[0].address);
  const gwestAddress = getContent('footer.location.gwest.address', locations[1].address);
  const gameCityTitle = getContent('footer.location.gamecity.title', locations[0].title);
  const gwestTitle = getContent('footer.location.gwest.title', locations[1].title);

  return (
    <footer className="site-footer">
      <div className="footer-brand">
        <SmartImage src="/logo.webp" alt="Compustar logo" loading="lazy" />
        <p>
          <EditableText multiline contentKey="footer.blurb" value={blurb} as="span" />
        </p>
        <div className="footer-socials">
          <strong>
            <EditableText contentKey="footer.socials.label" value={getContent('footer.socials.label', 'Social media')} as="span" />
          </strong>
          <div className="footer-social-row">
            <a className="footer-social" href={instagramUrl} target="_blank" rel="noreferrer" aria-label="Compustar on Instagram">
              <InstagramIcon size={20} />
            </a>
            <a className="footer-social" href={facebookUrl} target="_blank" rel="noreferrer" aria-label="Compustar on Facebook">
              <FacebookIcon size={20} />
            </a>
          </div>
        </div>
      </div>
      <nav className="footer-links" aria-label="Footer navigation">
        <strong>
          <EditableText contentKey="footer.explore.label" value={getContent('footer.explore.label', 'Explore')} as="span" />
        </strong>
        {pages.map((item) => (
          <a href={route(item)} onClick={(event) => goToPage(event, item)} key={item}>{item}</a>
        ))}
      </nav>
      <section className="footer-contact">
        <strong>
          <EditableText contentKey="footer.contact.label" value={getContent('footer.contact.label', 'Contact')} as="span" />
        </strong>
        <a href={`mailto:${footerEmail}?subject=Compustar%20Website%20Enquiry`}>
          <EnvelopeSimple weight="fill" size={18} />
          <span>
            <em><EditableText contentKey="footer.contact.email_label" value={getContent('footer.contact.email_label', 'Email')} as="span" /></em>
            <EditableText contentKey="site.email" value={footerEmail} as="span" />
          </span>
        </a>
        <a href={`tel:${footerTel.replace(/\D/g, '')}`}>
          <Phone weight="fill" size={18} />
          <span>
            <em><EditableText contentKey="footer.contact.tel_label" value={getContent('footer.contact.tel_label', 'Tel')} as="span" /></em>
            <EditableText contentKey="site.tel_display" value={footerTel} as="span" />
          </span>
        </a>
        <a href={`tel:${footerPhone.replace(/\D/g, '')}`}>
          <Phone weight="fill" size={18} />
          <span>
            <em><EditableText contentKey="footer.contact.gamecity_label" value={getContent('footer.contact.gamecity_label', 'Game City Mobile')} as="span" /></em>
            <EditableText contentKey="site.phone_display" value={footerPhone} as="span" />
          </span>
        </a>
        <a href={`tel:${footerMobile.replace(/\D/g, '')}`}>
          <Phone weight="fill" size={18} />
          <span>
            <em><EditableText contentKey="footer.contact.gwest_label" value={getContent('footer.contact.gwest_label', 'G-West Mobile')} as="span" /></em>
            <EditableText contentKey="site.mobile_display" value={footerMobile} as="span" />
          </span>
        </a>
        <span>
          <MapPin weight="fill" size={18} />
          <span>
            <em><EditableText contentKey="footer.location.gamecity.title" value={gameCityTitle} as="span" /></em>
            <EditableText multiline contentKey="footer.location.gamecity.address" value={gameCityAddress} as="span" />
          </span>
        </span>
        <span>
          <MapPin weight="fill" size={18} />
          <span>
            <em><EditableText contentKey="footer.location.gwest.title" value={gwestTitle} as="span" /></em>
            <EditableText multiline contentKey="footer.location.gwest.address" value={gwestAddress} as="span" />
          </span>
        </span>
      </section>
      <div className="footer-bottom">
        <span>
          <EditableText
            contentKey="footer.copyright"
            value={getContent('footer.copyright', `© Compustar ${new Date().getFullYear()}. All rights reserved.`)}
            as="span"
          />
        </span>
        <a href="https://futurifydesigns.com" target="_blank" rel="noreferrer">Built by Futurify Designs</a>
      </div>
    </footer>
  );
}

createRoot(document.getElementById('root')).render(<App />);
