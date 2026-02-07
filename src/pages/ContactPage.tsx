import { FormEvent, useState } from "react";

export function ContactPage(): JSX.Element {
  const [status, setStatus] = useState("");

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("Thanks for reaching out. Your message has been captured on this device for now. For guaranteed delivery, email contact@hits93.com.");
    event.currentTarget.reset();
  };

  return (
    <div className="container">
      <section className="page-section contact-page">
        <h2>Contact Us</h2>
        <p>
          Hits 93 Toronto is always open to hearing from listeners, artists, and anyone who wants to connect. This includes musicians who would like to share their music for possible consideration, as well as listeners with feedback, ideas, or general questions.
        </p>
        <p>
          If you would like to get in touch directly, email <a href="mailto:contact@hits93.com">contact@hits93.com</a>. This is the best option for music submissions, media inquiries, or longer messages.
        </p>
        <p>
          You can also reach out through social media: X at @Hits93Toronto, Facebook at @Hits93TO, and Instagram at @Hits93Toronto.
        </p>
        <p>
          Next Up and Next Wave rely on artists and bands submitting new music for possible feature. FLAC is preferred for music submissions.
        </p>

        <form className="contact-form" onSubmit={onSubmit}>
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

          <label className="field" htmlFor="contact-message">
            <span>Message</span>
            <textarea id="contact-message" name="message" rows={5} required />
          </label>

          <button type="submit" className="control-pill">Send message</button>
          {status && <p className="status-inline">{status}</p>}
        </form>
      </section>
    </div>
  );
}
