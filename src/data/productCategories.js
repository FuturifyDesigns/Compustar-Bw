import { services } from './services';

/** Canonical product categories = service catalogue titles. */
export const PRODUCT_CATEGORIES = services.map((service) => ({
  slug: service.slug,
  title: service.title
}));

/** Map older free-text categories onto a service slug. */
const CATEGORY_ALIASES = {
  accessories: 'laptops-accessories',
  audio: 'audio-video',
  batteries: 'batteries-chargers',
  chargers: 'batteries-chargers',
  computers: 'computers',
  gaming: 'gaming',
  laptops: 'laptops-accessories',
  mobile: 'mobile-tablet-accessories',
  networking: 'networking',
  office: 'office-stationery',
  printer: 'printers',
  printers: 'printers',
  printing: 'printers',
  security: 'security-surveillance',
  stationery: 'office-stationery',
  surveillance: 'security-surveillance',
  tablet: 'mobile-tablet-accessories',
  tracking: 'security-surveillance',
  video: 'audio-video'
};

export function normalizeProductCategory(category) {
  const raw = String(category || '').trim();
  if (!raw) return null;

  const lower = raw.toLowerCase();
  const byTitle = services.find((service) => service.title.toLowerCase() === lower);
  if (byTitle) return byTitle;

  const bySlug = services.find((service) => service.slug === lower);
  if (bySlug) return bySlug;

  const aliasSlug = CATEGORY_ALIASES[lower];
  if (aliasSlug) return services.find((service) => service.slug === aliasSlug) || null;

  return (
    services.find((service) => {
      const title = service.title.toLowerCase();
      return title.includes(lower) || lower.includes(title.split(/[&/]/)[0].trim());
    }) || null
  );
}

export function canonicalCategoryTitle(category) {
  return normalizeProductCategory(category)?.title || String(category || '').trim();
}

export function productMatchesService(product, service) {
  if (!service) return false;
  const resolved = normalizeProductCategory(product?.category);
  return resolved?.slug === service.slug;
}
