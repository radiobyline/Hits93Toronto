import { CONTACT_FORM_ENDPOINT } from "../config/constants";

export interface ContactSubmissionInput {
  name: string;
  email: string;
  topic: string;
  message: string;
  file?: File | null;
  company?: string;
}

interface ContactResponse {
  success?: string;
  message?: string;
}

export async function submitContactForm(input: ContactSubmissionInput): Promise<string> {
  const formData = new FormData();
  formData.set("name", input.name.trim());
  formData.set("email", input.email.trim());
  formData.set("topic", input.topic);
  formData.set("message", input.message.trim());
  formData.set("_subject", `Hits 93 Toronto Contact: ${input.topic}`);
  formData.set("_template", "table");
  formData.set("_captcha", "true");
  formData.set("_replyto", input.email.trim());

  if (input.company) {
    formData.set("company", input.company);
  }

  if (input.file) {
    formData.set("file", input.file);
  }

  const response = await fetch(CONTACT_FORM_ENDPOINT, {
    method: "POST",
    headers: {
      Accept: "application/json"
    },
    body: formData
  });

  let payload: ContactResponse = {};
  try {
    payload = (await response.json()) as ContactResponse;
  } catch {
    payload = {};
  }

  if (!response.ok) {
    throw new Error(payload.message || "Unable to send your message right now.");
  }

  if (payload.success === "true" || payload.message) {
    return payload.message || "Message sent successfully.";
  }

  return "Message sent successfully.";
}
