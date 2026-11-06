/**
 * A post's caption. With a link, the caption is the link (this site's own pages open in the same tab,
 * other websites in a new one). A link with no caption shows the website's name instead.
 */
export default function PostCaption({ item, className }) {
  if (!item.caption && !item.link) return null;
  if (!item.link) return <p className={className}>{item.caption}</p>;

  let url;
  try {
    url = new URL(item.link);
  } catch {
    return item.caption ? <p className={className}>{item.caption}</p> : null;
  }
  const ours = /(^|\.)ospreyvisuals\.com$/i.test(url.hostname);
  const text = item.caption || url.hostname.replace(/^www\./, '');
  return (
    <p className={className}>
      <a href={url.href} {...(ours ? {} : { target: '_blank', rel: 'noopener noreferrer' })}>
        {text}
        {!ours && <span className="visually-hidden"> (opens in a new tab)</span>}
      </a>
    </p>
  );
}
