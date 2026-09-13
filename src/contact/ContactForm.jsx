import React, { useState } from 'react';
import { supabase, supabaseConfigured } from '../lib/supabase';

const staffNotifyEmails = ['compustarbw@gmail.com'];

export function ContactForm() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  function update(field) {
    return (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }));
  }

  async function onSubmit(event) {
    event.preventDefault();
    setError('');
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setError('Please fill in your name, email, and message.');
      return;
    }
    if (!supabaseConfigured || !supabase) {
      setError('The contact form is temporarily unavailable. Please email or WhatsApp us instead.');
      return;
    }

    setBusy(true);
    try {
      const { data, error: invokeError } = await supabase.functions.invoke('notify-contact', {
        body: {
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          subject: form.subject.trim() || 'Website enquiry',
          message: form.message.trim(),
          adminEmails: staffNotifyEmails
        }
      });
      if (invokeError) throw invokeError;
      if (data?.ok === false) throw new Error(data.error || 'Could not send message');
      setDone(true);
      setForm({ name: '', email: '', phone: '', subject: '', message: '' });
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
      <p className="contact-form-lead">Tell us what you need. Your message goes straight to our team email.</p>
      <div className="contact-form-row">
        <label>
          Full name <span className="req">*</span>
          <input value={form.name} onChange={update('name')} required autoComplete="name" />
        </label>
        <label>
          Phone
          <input value={form.phone} onChange={update('phone')} inputMode="tel" autoComplete="tel" placeholder="+267…" />
        </label>
      </div>
      <label>
        Email <span className="req">*</span>
        <input type="email" value={form.email} onChange={update('email')} required autoComplete="email" />
      </label>
      <label>
        Subject
        <input value={form.subject} onChange={update('subject')} placeholder="Availability, quote, repair…" />
      </label>
      <label>
        Message <span className="req">*</span>
        <textarea value={form.message} onChange={update('message')} required rows={5} placeholder="Include product names, quantities, or device details if relevant." />
      </label>
      {error ? <p className="cms-error">{error}</p> : null}
      <button className="button dark" type="submit" disabled={busy}>
        {busy ? 'Sending…' : 'Send message'}
      </button>
    </form>
  );
}
