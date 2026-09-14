import React from 'react';

const MAP_URL_RE = /(https?:\/\/(?:www\.)?(?:google\.[^\s/]+\/maps[^\s]*|maps\.google\.[^\s]+|maps\.app\.goo\.gl\/[^\s]+))/gi;

export function DeliveryDetails({ address }) {
  const text = String(address || '').trim();
  if (!text) return '—';

  const parts = text.split(MAP_URL_RE);
  return (
    <>
      {parts.map((part, index) => {
        if (/^https?:\/\//i.test(part)) {
          return (
            <a
              key={`map-${index}`}
              className="order-map-link"
              href={part}
              target="_blank"
              rel="noreferrer"
            >
              Open pinned map
            </a>
          );
        }
        return <span key={`txt-${index}`}>{part}</span>;
      })}
    </>
  );
}
