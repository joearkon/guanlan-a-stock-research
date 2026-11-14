/** A historical close is not an intraday tape. Show only dated sampled events. */
export function relayTimeline(feed, events) {
  if (feed?.status === 'historical') return [];
  const day = String(feed?.session?.day || feed?.asof || '').replace(/\D/g, '');
  if (!day) return [];
  return (Array.isArray(events) ? events : [])
    .filter(event => String(event.time || '').replace(/\D/g, '').slice(0, 8) === day)
    .slice().sort((a, b) => String(b.time || '').localeCompare(String(a.time || '')));
}
