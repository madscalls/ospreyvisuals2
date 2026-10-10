import { CONTACT } from '../../data/contact';
import callIcon from '../../assets/images/contact/icon-call.svg';
import emailIcon from '../../assets/images/contact/icon-email.svg';
import visitIcon from '../../assets/images/contact/icon-visit.svg';
import './ContactInfo.css';

export default function ContactInfo() {
  const items = [
    { icon: callIcon, label: 'Call Us', value: CONTACT.phone, href: CONTACT.phoneHref },
    { icon: emailIcon, label: 'Email Us', value: CONTACT.email, href: `mailto:${CONTACT.email}` },
    { icon: visitIcon, label: 'Visit Us', value: CONTACT.visit },
  ];
  return (
    <ul className="contact-info" aria-label="Other ways to reach us">
      {items.map((it) => {
        const body = (
          <>
            <img className="contact-info__icon" src={it.icon} alt="" aria-hidden="true" />
            <span className="contact-info__text">
              <span className="contact-info__label">{it.label}</span>
              <span className="contact-info__value">{it.value}</span>
            </span>
          </>
        );
        return (
          <li key={it.label} className="contact-info__item">
            {it.href ? <a className="contact-info__link" href={it.href}>{body}</a> : <span className="contact-info__link">{body}</span>}
          </li>
        );
      })}
    </ul>
  );
}
