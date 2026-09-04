import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';

const url = 'https://fuenxerwefmwiaonrxkc.supabase.co';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!serviceKey) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');

const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

const email = process.env.CMS_ADMIN_EMAIL || 'compustarbw@gmail.com';
const password = process.env.CMS_ADMIN_PASSWORD;
if (!password) throw new Error('Missing CMS_ADMIN_PASSWORD');

const { data: listed } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
let user = listed?.users?.find((u) => u.email === email);
if (!user) {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { role: 'admin', name: 'Compustar Admin' }
  });
  if (error) throw error;
  user = data.user;
  console.log('Created admin user', user.id);
} else {
  const { error } = await admin.auth.admin.updateUserById(user.id, { password, email_confirm: true });
  if (error) throw error;
  console.log('Updated existing admin password', user.id);
}

const products = JSON.parse(readFileSync(new URL('../src/products.json', import.meta.url), 'utf8'));
const { count } = await admin.from('products').select('*', { count: 'exact', head: true });
if (!count) {
  const rows = products.map((p, index) => ({
    title: '',
    category: p.category || 'General',
    price: null,
    currency: 'BWP',
    image_url: `/products/${p.file.replace(/\.(jpe?g|png)$/i, '.webp')}`,
    description: '',
    sort_order: index,
    active: true
  }));
  for (let i = 0; i < rows.length; i += 40) {
    const chunk = rows.slice(i, i + 40);
    const { error } = await admin.from('products').insert(chunk);
    if (error) throw error;
  }
  console.log(`Seeded ${rows.length} products`);
} else {
  console.log(`Products already seeded (${count})`);
}

const adverts = [
  { file: 'pos-solutions.webp', title: 'POS Solutions', text: 'Smart business. Seamless sales. Point of sale systems that power your business.' },
  { file: 'digital-partner.webp', title: 'Your Digital Partner', text: 'Innovative technology, quality products and reliable solutions for every customer.' },
  { file: 'new-location-aga.webp', title: 'New Location — Aga House', text: 'Better service, closer to you at G-West Industrial, Plot 27576/4.' },
  { file: 'new-location-announcement.webp', title: 'New Location Announcement', text: 'Wider range, better service and the same Compustar commitment.' },
  { file: 'laptops.webp', title: 'Laptops for Work, Study & Play', text: 'Power your potential with everyday, business, gaming and creator laptops.' },
  { file: 'gaming-computers.webp', title: 'Gaming Computers', text: 'Game on. Perform big. Ready-made and custom builds for every level.' },
  { file: 'new-location-commitment.webp', title: 'Same Commitment, New Location', text: 'Visit Compustar at Aga House — easy to find, easy to reach.' },
  { file: 'accessories.webp', title: 'Accessories & Gear', text: 'Every accessory. Every possibility. Cables, storage, peripherals and more.' },
  { file: 'hilook-surveillance.webp', title: 'HiLook Surveillance', text: 'Smart security powered by Hikvision — clearer vision, stronger protection.' },
  { file: 'new-location-tech-destination.webp', title: 'Your Tech Destination', text: 'New location at G-West Industrial with the full Compustar product range.' }
];

const { count: advertCount } = await admin.from('adverts').select('*', { count: 'exact', head: true });
if (!advertCount) {
  const rows = adverts.map((item, index) => ({
    title: item.title,
    text: item.text,
    image_url: `/adverts/${item.file}`,
    sort_order: index,
    active: true
  }));
  const { error } = await admin.from('adverts').insert(rows);
  if (error) throw error;
  console.log(`Seeded ${rows.length} adverts`);
} else {
  console.log(`Adverts already seeded (${advertCount})`);
}

const defaults = {
  'home.hero.kicker': 'Compustar Botswana',
  'home.hero.title': 'Technology products, repairs, and IT support.',
  'home.hero.text': 'Browse featured products, request availability, and get help with computers, printers, surveillance systems, networking, and repairs.',
  'contact.hero.title': 'Let’s find the right technology for you.',
  'contact.hero.text': 'Reach Compustar for availability, quotations, repairs, and bulk supply. A clear enquiry helps the team respond quickly.',
  'site.email': 'compustarbw@gmail.com',
  'site.phone_display': '+267 760 04665',
  'site.tel_display': '+267 311 1542',
  'site.mobile_display': '+267 752 94155'
};

for (const [key, value] of Object.entries(defaults)) {
  await admin.from('site_content').upsert({ key, value, updated_at: new Date().toISOString() });
}
console.log('Seeded site_content defaults');
console.log('Setup complete');
