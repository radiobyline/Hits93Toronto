import { useState } from "react";
import { Link } from "react-router-dom";
import { submitContactForm } from "../services/contactService";

const MAX_UPLOAD_SIZE_BYTES = 25 * 1024 * 1024;

export function ContactPage(): JSX.Element {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState("");
  const [message, setMessage] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [company, setCompany] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [statusError, setStatusError] = useState(false);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (file && file.size > MAX_UPLOAD_SIZE_BYTES) {
      setStatus("Please upload a file smaller than 25 MB.");
      setStatusError(true);
      return;
    }

    setSubmitting(true);
    setStatus(null);
    setStatusError(false);

    try {
      const responseMessage = await submitContactForm({
        name,
        email,
        topic,
        message,
        file,
        company
      });
      setStatus(responseMessage || "Thanks, your message has been sent.");
      setStatusError(false);
      setMessage("");
      setFile(null);
      setCompany("");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to send your message right now.");
      setStatusError(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container">
      <section className="page-section contact-page">
        <h2>Contact Us</h2>
        <p>
          Hits 93 Toronto welcomes messages from listeners, artists, and anyone who wants to connect. Artists
          are encouraged to submit music for consideration, and listeners are welcome to share feedback, ideas,
          or general questions.
        </p>
        <p>
          For direct contact, email <a href="mailto:contact@hits93.com">contact@hits93.com</a>. This is the
          preferred option for music submissions, media inquiries, and longer messages.
        </p>
        <p>
          You can also connect with us on social media:{" "}
          <a href="https://x.com/Hits93Toronto" target="_blank" rel="noreferrer">
            X <strong>@Hits93Toronto</strong>
          </a>
          ,{" "}
          <a href="https://facebook.com/Hits93TO" target="_blank" rel="noreferrer">
            Facebook <strong>@Hits93TO</strong>
          </a>
          , and{" "}
          <a href="https://instagram.com/Hits93Toronto" target="_blank" rel="noreferrer">
            Instagram <strong>@Hits93Toronto</strong>
          </a>
          .
        </p>
        <p>
          <Link to="/schedule/programmes/next-up">
            <em>Next Up</em>
          </Link>{" "}
          and{" "}
          <Link to="/schedule/programmes/next-wave">
            <em>Next Wave</em>
          </Link>{" "}
          feature new music submitted directly by artists and bands. FLAC files are preferred for submissions.
        </p>

        <form
          className="contact-form"
          method="post"
          encType="multipart/form-data"
          onSubmit={onSubmit}
        >
          <label className="field" htmlFor="contact-name">
            <span>Name</span>
            <input
              id="contact-name"
              name="name"
              type="text"
              required
              value={name}
              onChange={(event) => {
                setName(event.target.value);
              }}
            />
          </label>

          <label className="field" htmlFor="contact-email">
            <span>Email</span>
            <input
              id="contact-email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
              }}
            />
          </label>

          <label className="field" htmlFor="contact-topic">
            <span>Topic</span>
            <select
              id="contact-topic"
              name="topic"
              required
              value={topic}
              onChange={(event) => {
                setTopic(event.target.value);
              }}
            >
              <option value="">Choose one</option>
              <option value="general">General feedback</option>
              <option value="music">Music submission (FLAC preferred)</option>
              <option value="media">Media inquiry</option>
              <option value="technical">Technical issue</option>
            </select>
          </label>

          <label className="field" htmlFor="contact-file">
            <span>File upload (optional)</span>
            <input
              id="contact-file"
              name="file"
              type="file"
              accept=".flac,.wav,.aiff,.mp3,.m4a,.zip"
              onChange={(event) => {
                setFile(event.target.files?.[0] ?? null);
              }}
            />
          </label>

          <label className="field sr-only" htmlFor="contact-company">
            <span>Company</span>
            <input
              id="contact-company"
              name="company"
              type="text"
              autoComplete="off"
              tabIndex={-1}
              value={company}
              onChange={(event) => {
                setCompany(event.target.value);
              }}
            />
          </label>

          <label className="field" htmlFor="contact-message">
            <span>Message</span>
            <textarea
              id="contact-message"
              name="message"
              rows={5}
              required
              value={message}
              onChange={(event) => {
                setMessage(event.target.value);
              }}
            />
          </label>

          <button type="submit" className="control-pill" disabled={submitting}>
            {submitting ? "Sending..." : "Send Message"}
          </button>
          <p className="status-inline">
            Secure submission over HTTPS with optional file upload. Messages go to{" "}
            <a href="mailto:contact@hits93.com">contact@hits93.com</a>.
          </p>
          {status && <p className={`status-inline ${statusError ? "status-inline--error" : ""}`}>{status}</p>}
        </form>
      </section>
    </div>
  );
}
