/** Google Maps embed. Uses the Maps Embed API when a key is set, otherwise the keyless embed. */
export function GoogleMap({ query, title = 'Map', className = 'h-[380px]' }: { query: string; title?: string; className?: string }) {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  const q = encodeURIComponent(query);
  const src = key
    ? `https://www.google.com/maps/embed/v1/place?key=${key}&q=${q}&zoom=16`
    : `https://maps.google.com/maps?q=${q}&z=16&output=embed`;
  return (
    <iframe
      title={title}
      src={src}
      className={`w-full border-0 ${className}`}
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
      allowFullScreen
    />
  );
}
