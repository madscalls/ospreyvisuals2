import PageHeading from '../../components/PageHeading/PageHeading.jsx';
import BrushButton from '../../components/BrushButton/BrushButton.jsx';
import { FAQ_HEADING, FAQS } from '../../data/faq';
import { CONTACT } from '../../data/contact';
import './Faq.css';

/**
 * /faq: collapsible questions (native <details>, so they open without JavaScript and every answer is
 * in the page for search engines). Several can be open at once.
 */
export default function Faq() {
  return (
    <div className="page-faq">
      <PageHeading id="faq-title" eyebrow={FAQ_HEADING.eyebrow} title={FAQ_HEADING.title} accent={FAQ_HEADING.accent}>
        <p>{FAQ_HEADING.intro}</p>
      </PageHeading>

      <section className="page-faq__list" aria-labelledby="faq-title">
        {FAQS.map((item, i) => (
          <details key={item.q} className="faq-item" id={`q${i + 1}`}>
            <summary className="faq-item__q">
              <span>{item.q}</span>
              <svg className="faq-item__icon" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </summary>
            <p className="faq-item__a">{item.a}</p>
          </details>
        ))}
      </section>

      <aside className="page-faq__cta">
        <p>
          Still have a question? Call <a href={CONTACT.phoneHref}>{CONTACT.phone}</a> or send us your project details.
        </p>
        <BrushButton to="/contact">Get a quote</BrushButton>
      </aside>
    </div>
  );
}
