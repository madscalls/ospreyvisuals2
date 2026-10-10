import { useRef, useState } from 'react';
import { PROJECT_TYPES, TIMELINES, UPLOAD, CONTACT } from '../../data/contact';
import { sendContactForm, UPLOADS_ENABLED } from '../../services/contactForm';
import birdDivider from '../../assets/images/ui/divider-bird-small.svg';
// Bright orange version of the Send art, to match the home page Get a Quote button
import sendArt from '../../assets/images/contact/send-button-bright.svg';
import './ContactForm.css';

const fmtSize = (b) => (b > 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);
const allowedExt = UPLOAD.accept.split(',');
const extOf = (name) => (name.match(/\.[^.]+$/) || [''])[0].toLowerCase();

export default function ContactForm() {
  const formRef = useRef(null);
  const fileRef = useRef(null);
  const [files, setFiles] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const [status, setStatus] = useState('idle'); // idle | sending | sent | error
  const [message, setMessage] = useState('');
  const [showErrors, setShowErrors] = useState(false);

  function addFiles(list) {
    const incoming = Array.from(list);
    const bad = incoming.filter((f) => !allowedExt.includes(extOf(f.name)));
    const good = incoming.filter((f) => allowedExt.includes(extOf(f.name)));
    const next = [...files, ...good];
    const total = next.reduce((n, f) => n + f.size, 0);
    if (total > UPLOAD.maxBytes) {
      setMessage(`Files can be up to ${UPLOAD.maxLabel} in total. Try fewer or smaller files, or email them to ${CONTACT.email}.`);
      return;
    }
    setFiles(next);
    setMessage(bad.length ? `Skipped ${bad.map((f) => f.name).join(', ')}: accepted types are ${UPLOAD.label}.` : '');
  }

  function removeFile(i) {
    setFiles((f) => f.filter((_, idx) => idx !== i));
  }

  async function onSubmit(e) {
    e.preventDefault();
    const form = formRef.current;
    if (!form.checkValidity()) {
      setShowErrors(true);
      setMessage('Please fill in the highlighted fields.');
      form.querySelector(':invalid')?.focus();
      return;
    }
    const data = new FormData(form);
    data.delete('files');
    if (UPLOADS_ENABLED) files.forEach((f) => data.append('attachment', f, f.name));

    setStatus('sending');
    setMessage('');
    try {
      await sendContactForm(data);
      setStatus('sent');
    } catch {
      setStatus('error');
      setMessage(`Sorry, your message didn't send. Please call ${CONTACT.phone} or email ${CONTACT.email}.`);
    }
  }

  if (status === 'sent') {
    return (
      <div className="contact-form contact-form--sent" role="status">
        <p className="contact-form__thanks">Thanks, we got it.</p>
        <p>We'll get back to you as soon as possible, usually within one business day.</p>
        <button type="button" className="contact-form__again" onClick={() => { setStatus('idle'); setFiles([]); setShowErrors(false); }}>
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form
      ref={formRef}
      className={`contact-form${showErrors ? ' contact-form--show-errors' : ''}`}
      onSubmit={onSubmit}
      noValidate
      aria-label="Contact form"
    >
      <div className="contact-form__grid">
        <Field id="cf-name" name="name" label="Full Name*" required autoComplete="name" />
        <Field id="cf-business" name="business" label="Business Name (Optional)" autoComplete="organization" />
        <Field id="cf-email" name="email" type="email" label="Email*" required autoComplete="email" />
        <Field id="cf-phone" name="phone" type="tel" label="Phone Number*" required autoComplete="tel" />
        <Select id="cf-type" name="projectType" label="Project Type*" options={PROJECT_TYPES} />
        <Select id="cf-timeline" name="timeline" label="Preferred Timeline*" options={TIMELINES} />

        <div className="contact-form__field contact-form__field--wide">
          <label htmlFor="cf-details" className="contact-form__textarea-label">Project Details*</label>
          <textarea
            id="cf-details"
            name="details"
            required
            placeholder="Tell us about your project, ideas, quantities, sizes, or any other details that will help us provide the best solution."
          />
        </div>
      </div>

      {/* Spam trap: hidden from people; bots that fill it in are ignored by Web3Forms */}
      <input type="checkbox" name="botcheck" className="contact-form__botcheck" tabIndex={-1} autoComplete="off" aria-hidden="true" />

      <div className={`contact-form__row${UPLOADS_ENABLED ? '' : ' contact-form__row--no-upload'}`}>
        {UPLOADS_ENABLED && (
        <div className="contact-form__upload">
          <span className="contact-form__upload-title" id="cf-upload-title">File Upload (Optional)</span>
          <label
            className={`contact-form__drop${dragOver ? ' is-over' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
          >
            <input
              ref={fileRef}
              type="file"
              name="files"
              multiple
              accept={UPLOAD.accept}
              aria-labelledby="cf-upload-title"
              onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }}
            />
            <svg className="contact-form__upload-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 16V4m0 0-4.5 4.5M12 4l4.5 4.5M4 15v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {files.length ? (
              <span className="contact-form__files">
                {files.map((f, i) => (
                  <span className="contact-form__file" key={`${f.name}-${i}`}>
                    {f.name} <small>{fmtSize(f.size)}</small>
                    <button type="button" aria-label={`Remove ${f.name}`} onClick={(e) => { e.preventDefault(); removeFile(i); }}>×</button>
                  </span>
                ))}
              </span>
            ) : (
              <span className="contact-form__drop-text">
                Drag &amp; drop files here or click to browse
                <small>Accepted files: {UPLOAD.label} (max {UPLOAD.maxLabel})</small>
              </span>
            )}
          </label>
        </div>
        )}

        <label className="contact-form__agree">
          <input type="checkbox" name="agree" required />
          <span>
            By checking this box and signing below, you agree that any artwork provided may not be print ready and may require design work.
            Additional design fees may apply.
          </span>
        </label>
      </div>

      <div className="contact-form__actions">
        <button type="submit" className="contact-form__send" disabled={status === 'sending'}>
          <img className="contact-form__send-art" src={sendArt} alt="" aria-hidden="true" />
          <span className="contact-form__send-label">
            {status === 'sending' ? 'Sending…' : 'Send Message'} <span aria-hidden="true">→</span>
          </span>
        </button>
        <img className="contact-form__bird" src={birdDivider} alt="" aria-hidden="true" />
        {/* Agreement signature: the box beside Send in the design */}
        <div className="contact-form__sign">
          <label htmlFor="cf-signature" className="visually-hidden">Type your full name to agree to the artwork terms</label>
          <input
            id="cf-signature"
            name="agreement_signature"
            type="text"
            required
            autoComplete="name"
            placeholder="Type your name to agree*"
          />
        </div>
        <p className="contact-form__message" role="alert" aria-live="polite">{message}</p>
      </div>
    </form>
  );
}

function Field({ id, label, type = 'text', ...rest }) {
  return (
    <div className="contact-form__field">
      <label htmlFor={id} className="visually-hidden">{label}</label>
      <input id={id} type={type} placeholder={label} {...rest} />
    </div>
  );
}

function Select({ id, name, label, options }) {
  return (
    <div className="contact-form__field">
      <label htmlFor={id} className="visually-hidden">{label}</label>
      <select id={id} name={name} required defaultValue="">
        <option value="" disabled>{label}</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}
