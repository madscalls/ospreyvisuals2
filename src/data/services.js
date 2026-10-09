import brandingIcon from '../assets/images/icons/branding-design.webp';
import wrapsIcon from '../assets/images/icons/wraps-signage.webp';
import digitalIcon from '../assets/images/icons/digital-solutions.webp';
import businessIcon from '../assets/images/icons/business-solutions.webp';
import printIcon from '../assets/images/icons/print-promo.webp';

// icon: null leaves an empty space the same size as an icon, so all six titles stay lined up (Custom Creations has no icon by design)
export const SERVICES = [
  { id: 'branding', title: 'Branding & Design', blurb: 'Thoughtful design that builds strong, memorable brands.', icon: brandingIcon },
  { id: 'wraps', title: 'Wraps & Signage', blurb: 'High-impact wraps and signage that get you noticed.', icon: wrapsIcon },
  { id: 'print', title: 'Print & Promo', blurb: 'Print materials and promotional products that leave an impression.', icon: printIcon },
  { id: 'digital', title: 'Digital Solutions', blurb: 'Web, social, and digital graphics that connect and convert.', icon: digitalIcon },
  { id: 'business', title: 'Business Solutions', blurb: 'Tailored business solutions that elevate your presence & bring your brand to life.', icon: businessIcon },
  { id: 'custom', title: 'Custom Creations', blurb: '3D printing, engraving, and custom builds made for you.', icon: null },
];
