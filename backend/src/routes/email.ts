import { Router } from "express";
import { sendEmail } from "../utils/emailService.js";

const router = Router();

// Default recipients (always included)
//const DEFAULT_RECIPIENTS = ["reception@hotel.com", "manager@hotel.com"];
const DEFAULT_RECIPIENTS = ["sandton.exclusive@gmail.com", "keithsolo.sav@gmail.com"];

router.post("/send-email", async (req, res) => {
  try {
    let { to, subject, html, attachments } = req.body;

    // Normalize 'to' into an array
    if (!to) {
      to = []; // no recipients from frontend
    } else if (!Array.isArray(to)) {
      to = [to];
    }

    // Always include default recipients
    const allRecipients = Array.from(new Set([...DEFAULT_RECIPIENTS, ...to]));

    await sendEmail(
      allRecipients,
      subject || "Guest Registration",
      html || "",
      attachments || []
    );

    res.status(200).json({ success: true, recipients: allRecipients });
  } catch (err: any) {
    console.error("Email error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
