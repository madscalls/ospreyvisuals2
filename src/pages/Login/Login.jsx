import PageHeading from '../../components/PageHeading/PageHeading.jsx';
import BrushButton from '../../components/BrushButton/BrushButton.jsx';
import './Login.css';

// What customer accounts will offer (shown as "coming soon" until they're built)
const COMING = ['Reorder past orders', 'Order history and billing', 'Download past invoices', 'Newsletter and email preferences'];

/**
 * /login: customer accounts aren't built yet, so this says what's coming and offers a quote meanwhile.
 * Staff get a small link to the admin (a full page load, so Cloudflare Access can ask for their email code).
 */
export default function Login() {
  return (
    <div className="page-login">
      <PageHeading id="login-title" eyebrow="Your account" title="Customer" accent="login.">
        <p>Customer accounts are coming soon. You'll be able to sign in here to:</p>
      </PageHeading>

      <ul className="page-login__list">
        {COMING.map((c) => (
          <li key={c}>{c}</li>
        ))}
      </ul>

      <p className="page-login__meanwhile">In the meantime, we're happy to help with anything you need.</p>
      <BrushButton to="/contact">Get in touch</BrushButton>

      <p className="page-login__staff">
        Osprey Visuals team? <a href="/admin">Staff sign in</a>
      </p>
    </div>
  );
}
