export default function Avatar({ src, size = 40, className = '', alt = 'avatar' }) {
  const isImage =
    typeof src === 'string' &&
    (src.startsWith('/') || src.startsWith('http') || /\.(png|jpe?g|webp|svg|gif)$/i.test(src));

  if (isImage) {
    return (
      <img
        src={src}
        alt={alt}
        className={`rounded-full object-cover ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }
  // Secours : ancien avatar emoji (ex. 🦁)
  return (
    <span className={className} style={{ fontSize: size * 0.8, lineHeight: 1 }}>
      {src || '🦁'}
    </span>
  );
}