/** Service catalogue — images can be added later under public/services/{slug}/ */
export const services = [
  {
    slug: 'computers',
    title: 'Computers',
    summary: 'Desktops, all-in-ones, components, and everyday computing setups.',
    description: 'Browse computers and related hardware available for enquiry or order request at Compustar.',
    image: '/generated/service-computers.webp',
    icon: 'Cpu'
  },
  {
    slug: 'audio-video',
    title: 'Audio & Video',
    summary: 'Speakers, headphones, soundbars, and media accessories.',
    description: 'Audio and video products for home, office, and entertainment setups.',
    image: '/generated/service-audio-video.webp',
    icon: 'SpeakerHigh'
  },
  {
    slug: 'gaming',
    title: 'Gaming',
    summary: 'Consoles, gaming gear, monitors, and performance accessories.',
    description: 'Gaming hardware and accessories for play, study, and competitive setups.',
    image: '/generated/service-gaming.webp',
    icon: 'GameController'
  },
  {
    slug: 'laptops-accessories',
    title: 'Laptops & Accessories',
    summary: 'Laptops, bags, chargers, RAM, and portable computing extras.',
    description: 'Laptops and accessories for work, school, and travel.',
    image: '/generated/service-laptops-accessories.webp',
    icon: 'Laptop'
  },
  {
    slug: 'mobile-tablet-accessories',
    title: 'Mobile & Tablet Accessories',
    summary: 'Cables, protectors, power banks, mounts, and tablet extras.',
    description: 'Accessories that keep phones and tablets charged, protected, and ready.',
    image: '/generated/service-mobile-tablet-accessories.webp',
    icon: 'DeviceMobile'
  },
  {
    slug: 'networking',
    title: 'Networking',
    summary: 'Routers, cables, switches, Wi-Fi, and connectivity planning.',
    description: 'Networking equipment and guidance for homes and small offices.',
    image: '/generated/service-networking.webp',
    icon: 'WifiHigh'
  },
  {
    slug: 'office-stationery',
    title: 'Office & Stationery',
    summary: 'Office supplies, till rolls, labels, and workplace essentials.',
    description: 'Practical office and stationery products for day-to-day business use.',
    image: '/generated/service-office-stationery.webp',
    icon: 'Briefcase'
  },
  {
    slug: 'printers',
    title: 'Printers',
    summary: 'Printers, ink, toner, and everyday print support.',
    description: 'Printers and consumables with setup guidance when you need it.',
    image: '/generated/service-printers.webp',
    icon: 'Printer'
  },
  {
    slug: 'security-surveillance',
    title: 'Security & Surveillance',
    summary: 'Cameras, recorders, kits, and security product enquiries.',
    description: 'Surveillance and security products for homes and businesses.',
    image: '/generated/service-security-surveillance.webp',
    icon: 'Camera'
  },
  {
    slug: 'batteries-chargers',
    title: 'Batteries & Chargers',
    summary: 'Power banks, UPS, chargers, and backup power options.',
    description: 'Batteries, chargers, and power accessories to keep devices running.',
    image: '/generated/service-batteries-chargers.webp',
    icon: 'BatteryCharging'
  }
];

export function getServiceBySlug(slug) {
  return services.find((item) => item.slug === slug) || null;
}
