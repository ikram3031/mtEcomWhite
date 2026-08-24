import { sendContactEmails } from "../utils/contactEmailDelivery.js";

// POST /api/v1/contact
export const submitContact = async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ success: false, message: "Name, email, and message are required." });
    }

    // Send emails asynchronously (don't block the response)
    sendContactEmails({ name, email, phone, message });

    return res.status(200).json({ success: true, message: "Your message has been sent successfully!" });
  } catch (error) {
    console.error("Error submitting contact form:", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
};
