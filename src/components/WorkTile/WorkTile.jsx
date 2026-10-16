import { Link } from 'react-router-dom';
import BrushButton from '../BrushButton/BrushButton.jsx';
import './WorkTile.css';

/**
 * One category on the Work page: a torn-paper photo with its orange button, linking to the gallery.
 *   cover: { src, alt } set from the admin page; until then the category's painted icon stands in.
 */
export default function WorkTile({ category, cover, index = 0 }) {
  const edge = (index % 3) + 1; // three torn-edge shapes, so neighbouring tiles don't match

  return (
    <Link to={`/work/${category.slug}`} className={`work-tile work-tile--edge-${edge}`} style={{ '--i': index }}>
      <span className="work-tile__frame">
        {cover?.src ? (
          <img className="work-tile__photo" src={cover.src} alt={cover.alt || ''} loading="lazy" decoding="async" />
        ) : (
          <span className="work-tile__placeholder" aria-hidden="true">
            {category.placeholderArt && <img src={category.placeholderArt} alt="" decoding="async" />}
          </span>
        )}
      </span>
      <BrushButton as="span" className="work-tile__button">
        {category.title}
      </BrushButton>
    </Link>
  );
}
