import { Link } from "react-router-dom";

export function ContactPage(): JSX.Element {
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
          action="mailto:contact@hits93.com"
          method="post"
          encType="multipart/form-data"
        >
          <label className="field" htmlFor="contact-name">
            <span>Name</span>
            <input id="contact-name" name="name" type="text" required />
          </label>

          <label className="field" htmlFor="contact-email">
            <span>Email</span>
            <input id="contact-email" name="email" type="email" required />
          </label>

          <label className="field" htmlFor="contact-topic">
            <span>Topic</span>
            <select id="contact-topic" name="topic" required>
              <option value="">Choose one</option>
              <option value="general">General feedback</option>
              <option value="music">Music submission (FLAC preferred)</option>
              <option value="media">Media inquiry</option>
              <option value="technical">Technical issue</option>
            </select>
          </label>

          <label className="field" htmlFor="contact-file">
            <span>File upload (optional)</span>
            <input id="contact-file" name="file" type="file" accept=".flac,.wav,.aiff,.mp3,.m4a,.zip" />
          </label>

          <label className="field" htmlFor="contact-message">
            <span>Message</span>
            <textarea id="contact-message" name="message" rows={5} required />
          </label>

          <button type="submit" className="control-pill">Send Message</button>
          <p className="status-inline">
            Submissions are addressed to <a href="mailto:contact@hits93.com">contact@hits93.com</a>.
          </p>
        </form>
      </section>
    </div>
  );
}
