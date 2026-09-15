import React, { useEffect, useState } from 'react';
import { supabase, supabaseConfigured } from '../lib/supabase';
import { assertClientCooldown } from '../lib/clientSecurity';

const ENQUIRE_KEY = 'compustar-enquire';

export function buildEnquireDraft(product = {}) {
  const title = String(product.title || product.name || '').trim() || 'Selected product';
  const category = String(product.category || '').trim() || 'Not specified';
  const description = String(product.description || '').trim();
  const hasPrice = product.price != null && product.price !== '';
  const priceLine = hasPrice
    ? `${product.currency || 'BWP'} ${Number(product.price).toLocaleString()}`
    : 'Price on request';
  const image = String(product.image_url || product.file || '').trim();

  return {
    subject: `Product enquiry: ${title}`,
    message: [
      'Hi Compustar,',
      '',
      'I would like to enquire about this product:',
      `• Name: ${title}`,
      `• Category: ${category}`,
      `• Price: ${priceLine}`,
      description ? `• Details: ${description}` : '• Details: Please confirm full product details and availability.',
      '',
      'Please let me know the next steps. Thank you.'
    ].join('\n'),
    product: {
      title,
      category,
      priceLine,
      image
    }
  };
}

export function stashEnquireProduct(product) {
  try {
    sessionStorage.setItem(ENQUIRE_KEY, JSON.stringify({
      title: product?.title || product?.name || '',
      category: product?.category || '',
      description: product?.description || '',
      price: product?.price ?? '',
      currency: product?.currency || 'BWP',
      id: product?.id || '',
      image_url: product?.image_url || product?.file || ''
    }));
  } catch {
    /* ignore storage failures */
  }
}

function readEnquireDraft() {
  try {
    const raw = sessionStorage.getItem(ENQUIRE_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(ENQUIRE_KEY);
    return buildEnquireDraft(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function ContactForm() {
  const [enquireMeta] = useState(() => {
    const draft = readEnquireDraft();
    return draft
      ? { draft, product: draft.product || null, active: true }
      : { draft: null, product: null, active: false };
  });
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    subject: enquireMeta.draft?.subject || '',
    message: enquireMeta.draft?.message || '',
    website: ''
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [hasEnquiry, setHasEnquiry] = useState(enquireMeta.active);

  useEffect(() => {
    if (!enquireMeta.active) return;
    const formEl = document.querySelector('.contact-form');
    formEl?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [enquireMeta.active]);

  function update(field) {
    return (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }));
  }

  async function onSubmit(event) {
    event.preventDefault();
    setError('');
    if (form.website.trim()) {
      setDone(true);
      return;
    }
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setError('Please fill in your name, email, and message.');
      return;
    }
    if (form.message.trim().length > 4000) {
      setError('Message is too long.');
      return;
    }
    const cooldown = assertClientCooldown('contact', 60_000);
    if (!cooldown.ok) {
      setError(cooldown.error);
      return;
    }
    if (!supabaseConfigured || !supabase) {
      setError('The contact form is temporarily unavailable. Please email or WhatsApp us instead.');
      return;
    }

    setBusy(true);
    try {
      const rawImage = enquireMeta.product?.image || '';
      const productImage = /^https?:\/\//i.test(rawImage)
        ? rawImage
        : rawImage.startsWith('/')
          ? `https://compustar.co.bw${rawImage}`
          : '';
      const { data, error: invokeError } = await supabase.functions.invoke('notify-contact', {
        body: {
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          subject: form.subject.trim() || 'Website enquiry',
          message: form.message.trim(),
          website: form.website,
          productImage,
          productTitle: enquireMeta.product?.title || '',
          productCategory: enquireMeta.product?.category || '',
          productPrice: enquireMeta.product?.priceLine || ''
        }
      });
      if (invokeError) throw invokeError;
      if (data?.ok === false) throw new Error(data.error || 'Could not send message');
      setDone(true);
      setHasEnquiry(false);
      setForm({ name: '', email: '', phone: '', subject: '', message: '', website: '' });
    } catch (err) {
      setError(err.message || 'Could not send your message. Please try WhatsApp or email.');
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="contact-form contact-form--done">
        <p className="kicker">Message sent</p>
        <h3>Thanks — we’ll get back to you.</h3>
        <p>Your enquiry was emailed to Compustar. Check your inbox for a confirmation copy.</p>
        <button type="button" className="button dark" onClick={() => setDone(false)}>Send another message</button>
      </div>
    );
  }

  return (
    <form className="contact-form" onSubmit={onSubmit} noValidate>
      <p className="kicker">Send a message</p>
      <h3>Contact Compustar</h3>
      <p className="contact-form-lead">
        {hasEnquiry
          ? 'Product details were added below. Complete your contact info and send.'
          : 'Tell us what you need. Your message goes straight to our team email.'}
      </p>
      {hasEnquiry ? (
        <div className="contact-enquire-card">
          {enquireMeta.product?.image ? (
            <img src={enquireMeta.product.image} alt={enquireMeta.product.title || 'Selected product'} />
          ) : (
            <div className="contact-enquire-fallback" aria-hidden="true" />
          )}
          <div>
            <p className="contact-enquire-note">Product enquiry ready</p>
            <strong>{enquireMeta.product?.title || 'Selected product'}</strong>
            <span>
              {[enquireMeta.product?.category, enquireMeta.product?.priceLine].filter(Boolean).join(' · ')}
            </span>
          </div>
        </div>
      ) : null}
      <div className="hp-field" aria-hidden="true">
        <label>
          Website
          <input
            tabIndex={-1}
            autoComplete="off"
            value={form.website}
            onChange={update('website')}
          />
        </label>
      </div>
      <div className="contact-form-row">
        <label>
          Full name <span className="req">*</span>
          <input value={form.name} onChange={update('name')} required autoComplete="name" maxLength={120} />
        </label>
        <label>
          Phone
          <input value={form.phone} onChange={update('phone')} inputMode="tel" autoComplete="tel" placeholder="+267…" maxLength={40} />
        </label>
      </div>
      <label>
        Email <span className="req">*</span>
        <input type="email" value={form.email} onChange={update('email')} required autoComplete="email" maxLength={254} />
      </label>
      <label>
        Subject
        <input value={form.subject} onChange={update('subject')} placeholder="Availability, quote, repair…" maxLength={140} />
      </label>
      <label>
        Message <span className="req">*</span>
        <textarea value={form.message} onChange={update('message')} required rows={hasEnquiry ? 8 : 5} maxLength={4000} placeholder="Include product names, quantities, or device details if relevant." />
      </label>
      {error ? <p className="cms-error">{error}</p> : null}
      <button className="button dark" type="submit" disabled={busy}>
        {busy ? 'Sending…' : 'Send message'}
      </button>
    </form>
  );
}
