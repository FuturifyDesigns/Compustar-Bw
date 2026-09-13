import React from 'react';

const updated = '13 September 2026';
const controllerEmail = 'compustarbw@gmail.com';
const whatsappDisplay = '+267 7600 4665';

function go(path) {
  window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

function LegalShell({ eyebrow, title, lead, children }) {
  return (
    <section className="section legal-section">
      <article className="legal-card">
        <p className="kicker">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="account-lead">{lead}</p>
        <p className="legal-meta">Last updated: {updated}</p>
        <div className="legal-body">{children}</div>
        <div className="legal-nav">
          <button type="button" className="button ghost-dark" onClick={() => go('/Privacy')}>Privacy Policy</button>
          <button type="button" className="button ghost-dark" onClick={() => go('/Terms')}>Terms of Use</button>
          <button type="button" className="button dark" onClick={() => go('/Contact')}>Contact us</button>
        </div>
      </article>
    </section>
  );
}

export function PrivacyPage() {
  return (
    <LegalShell
      eyebrow="Privacy"
      title="Privacy Policy"
      lead="This notice explains how Compustar Botswana collects, uses, stores, and shares personal data when you use compustar.co.bw, create an account, or submit an order request."
    >
      <p>
        Compustar Botswana (“Compustar”, “we”, “us”) processes personal data in line with the
        {' '}<strong>Data Protection Act, 2024 (Act No. 18 of 2024)</strong> of the Republic of Botswana,
        which commenced on <strong>14 January 2025</strong>, and is overseen by the
        {' '}<strong>Information and Data Protection Commission (IDPC)</strong>.
      </p>

      <h2>1. Who is the data controller?</h2>
      <p>
        Compustar Botswana is the data controller for personal data processed through this website and related
        customer communications.
      </p>
      <ul>
        <li>Email: <a href={`mailto:${controllerEmail}`}>{controllerEmail}</a></li>
        <li>WhatsApp / mobile: <a href="https://wa.me/26776004665">{whatsappDisplay}</a></li>
        <li>Stores: Game City Mall (Shop 6U, Upstairs) and G-West Industrial (Plot 27576/4, Aga House), Gaborone, Botswana</li>
        <li>Website: <a href="https://compustar.co.bw">compustar.co.bw</a></li>
      </ul>
      <p>
        For privacy requests, write to <a href={`mailto:${controllerEmail}?subject=Data%20protection%20request`}>{controllerEmail}</a> with the subject “Data protection request”.
        Where a Data Protection Officer is appointed under the Act, those contact details will be published here.
      </p>

      <h2>2. Personal data we collect</h2>
      <p>Depending on how you use the site, we may process:</p>
      <ul>
        <li><strong>Identity & contact data</strong> — full name, email address, phone number</li>
        <li><strong>Account data</strong> — login credentials (passwords are stored in hashed form by our auth provider), verification status</li>
        <li><strong>Order-request data</strong> — product selections, quantities, pickup/delivery preference, delivery address, notes, and order reference</li>
        <li><strong>Communication data</strong> — messages you send by email, WhatsApp, or website forms</li>
        <li><strong>Technical data</strong> — basic device/browser information, IP address, and cookies or local storage needed for site function (for example, cart contents and signed-in session)</li>
      </ul>
      <p>We do not intentionally collect special-category (sensitive) personal data through this website.</p>

      <h2>3. Why we process your data (purposes & legal bases)</h2>
      <p>Under the Data Protection Act, 2024, we process personal data only where a lawful basis applies, including:</p>
      <ul>
        <li><strong>Contract / pre-contract steps</strong> — to create your account, receive and respond to order requests, confirm availability, and arrange pickup or delivery</li>
        <li><strong>Consent</strong> — where you opt in to account creation, marketing messages, or optional communications; you may withdraw consent at any time</li>
        <li><strong>Legitimate interests</strong> — to secure the website, prevent abuse, improve our services, and keep business records, balanced against your rights</li>
        <li><strong>Legal obligation</strong> — where Botswana law requires us to retain or disclose information</li>
      </ul>

      <h2>4. Who we share data with</h2>
      <p>We share personal data only as needed to operate the service:</p>
      <ul>
        <li><strong>Compustar staff</strong> — to process enquiries and order requests</li>
        <li><strong>Service providers (processors)</strong> — for example hosting/auth/database providers (such as Supabase) and email delivery (such as Brevo) acting on our instructions</li>
        <li><strong>Messaging platforms</strong> — if you open a WhatsApp share link, Meta/WhatsApp processes the message content according to their terms</li>
        <li><strong>Authorities</strong> — where required by law or a lawful order</li>
      </ul>
      <p>We do not sell your personal data.</p>

      <h2>5. International transfers</h2>
      <p>
        Some processors may store or process data outside Botswana. Where personal data is transferred to a third country
        or international organisation, we take steps consistent with the Data Protection Act, 2024 — including using
        appropriate contractual and security safeguards — and keep a copy of transferred personal data available in Botswana
        for the period of processing where the Act requires this.
      </p>

      <h2>6. How long we keep data</h2>
      <ul>
        <li><strong>Account data</strong> — while your account remains active, and for a reasonable period afterwards if needed for security or disputes</li>
        <li><strong>Order requests</strong> — for as long as needed to fulfil the request and keep normal business records (typically up to 24 months, unless a longer period is required)</li>
        <li><strong>Enquiries</strong> — until resolved and for a short follow-up period</li>
      </ul>
      <p>When data is no longer needed, we delete or anonymise it where practicable.</p>

      <h2>7. Security</h2>
      <p>
        We apply appropriate technical and organisational measures under the Act, including access controls, encrypted
        connections (HTTPS), and processor security practices. No online service is completely risk-free; please use a
        strong unique password for your account.
      </p>

      <h2>8. Your rights under the Data Protection Act, 2024</h2>
      <p>Subject to the Act’s conditions and exceptions, you may request:</p>
      <ul>
        <li>Access to your personal data</li>
        <li>Rectification of inaccurate or incomplete data</li>
        <li>Erasure (“right to be forgotten”) in applicable cases</li>
        <li>Restriction of processing</li>
        <li>Data portability, where technically feasible and the Act applies</li>
        <li>Objection to certain processing, including direct marketing</li>
        <li>Not to be subject to solely automated decision-making with legal or similarly significant effects (we do not use such decision-making on this site)</li>
        <li>Withdrawal of consent where processing is based on consent</li>
      </ul>
      <p>
        To exercise these rights, email <a href={`mailto:${controllerEmail}?subject=Data%20protection%20request`}>{controllerEmail}</a>.
        We may need to verify your identity before responding. We aim to respond within the timeframes required by law.
      </p>

      <h2>9. Children</h2>
      <p>
        This website and order-request service are intended for customers aged 16 or older (or with valid parental/guardian
        authority where required). If you believe a child has provided personal data inappropriately, contact us to delete it.
      </p>

      <h2>10. Personal data breaches</h2>
      <p>
        If a personal data breach occurs that is likely to result in a risk to individuals, we will assess it promptly and,
        where required by the Act, notify the Information and Data Protection Commission without undue delay and, where
        feasible, within 72 hours, and communicate high-risk breaches to affected individuals.
      </p>

      <h2>11. Complaints</h2>
      <p>
        If you are unhappy with how we handle your personal data, please contact us first so we can try to resolve it.
        You also have the right to lodge a complaint with the <strong>Information and Data Protection Commission (IDPC)</strong>,
        Botswana’s supervisory authority under the Data Protection Act, 2024. Official IDPC contact channels are published
        by the Commission as they become available (see government and IDPC announcements).
      </p>

      <h2>12. Cookies and local storage</h2>
      <p>
        We use essential cookies/local storage for signed-in sessions and your request cart. These are necessary for the
        site to work. We do not use third-party advertising trackers on this site at present. If that changes, we will update
        this notice.
      </p>

      <h2>13. Changes to this notice</h2>
      <p>
        We may update this Privacy Policy to reflect legal or operational changes. The “Last updated” date above will change
        when we do. Continued use of the site after updates means you should review the revised notice.
      </p>

      <p className="legal-footnote">
        This notice is provided to help you understand our practices and to meet transparency duties under Botswana’s
        Data Protection Act, 2024. It is not formal legal advice. For complex matters, seek independent legal counsel.
      </p>
    </LegalShell>
  );
}

export function TermsPage() {
  return (
    <LegalShell
      eyebrow="Terms"
      title="Terms of Use"
      lead="These terms govern your use of the Compustar Botswana website and related order-request features."
    >
      <p>
        By accessing compustar.co.bw or creating an account, you agree to these Terms of Use and our
        {' '}<button type="button" className="legal-inline-link" onClick={() => go('/Privacy')}>Privacy Policy</button>.
        If you do not agree, please do not use the site.
      </p>

      <h2>1. About Compustar</h2>
      <p>
        Compustar Botswana sells technology products and related services from our Gaborone locations and through this
        website. Contact: <a href={`mailto:${controllerEmail}`}>{controllerEmail}</a>, WhatsApp {whatsappDisplay}.
      </p>

      <h2>2. Website use</h2>
      <ul>
        <li>Use the site lawfully and in good faith</li>
        <li>Do not attempt to disrupt, scrape abusively, or gain unauthorised access to systems or other users’ data</li>
        <li>Account credentials are personal — keep them confidential and tell us if you suspect misuse</li>
        <li>Product images, prices, and descriptions are for information and may change without notice</li>
      </ul>

      <h2>3. Accounts</h2>
      <p>
        You must provide accurate information when registering. You are responsible for activity under your account.
        We may suspend or close accounts that appear abusive, fraudulent, or in breach of these terms.
      </p>

      <h2>4. Order requests (not online checkout payment)</h2>
      <p>
        The cart and checkout on this site create an <strong>order request</strong> for Compustar to confirm availability
        and follow up. Submitting a request does <strong>not</strong> by itself create a completed sale or require online
        payment on this website.
      </p>
      <ul>
        <li>Prices shown are indicative where provided and may be confirmed or adjusted before sale</li>
        <li>Stock is not reserved until Compustar confirms</li>
        <li>Pickup times and delivery details you provide must be accurate</li>
        <li>We may contact you by phone, email, or WhatsApp using the details you supply</li>
      </ul>

      <h2>5. Repairs and enquiries</h2>
      <p>
        Repair and service enquiries are assessed case by case. Diagnostics, timelines, and costs are confirmed by Compustar
        after inspection where needed. Leaving a device with us may involve a separate workshop agreement or receipt.
      </p>

      <h2>6. Intellectual property</h2>
      <p>
        Site content, branding, and materials belong to Compustar or our licensors. You may not copy or reuse them for
        commercial purposes without permission.
      </p>

      <h2>7. Third-party services</h2>
      <p>
        The site may link to WhatsApp, social media, maps, or other third-party tools. Their terms and privacy practices
        apply when you use those services.
      </p>

      <h2>8. Limitation of liability</h2>
      <p>
        To the fullest extent permitted by Botswana law, Compustar is not liable for indirect or consequential loss arising
        from website use, temporary unavailability, or reliance on content that later changes. Nothing in these terms
        limits liability that cannot be limited under applicable law.
      </p>

      <h2>9. Privacy and data protection</h2>
      <p>
        Personal data is handled as described in our Privacy Policy and in accordance with the Data Protection Act, 2024
        (Act No. 18 of 2024). By creating an account or submitting an order request, you acknowledge that notice.
      </p>

      <h2>10. Governing law</h2>
      <p>
        These terms are governed by the laws of the Republic of Botswana. Courts in Botswana have jurisdiction, without
        prejudice to any mandatory consumer protections that apply.
      </p>

      <h2>11. Changes</h2>
      <p>
        We may update these terms from time to time. The “Last updated” date will change when we do. Continued use of the
        site after changes means you accept the revised terms.
      </p>

      <h2>12. Contact</h2>
      <p>
        Questions about these terms: <a href={`mailto:${controllerEmail}`}>{controllerEmail}</a> or WhatsApp {whatsappDisplay}.
      </p>

      <p className="legal-footnote">
        These terms are a practical website agreement for Compustar customers. They are not a substitute for tailored legal advice.
      </p>
    </LegalShell>
  );
}
