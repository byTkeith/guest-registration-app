import dotenv from "dotenv";
dotenv.config();

import nodemailer from "nodemailer";

type Attachment = { name: string; content: string };

export async function sendEmail(to: string[], subject: string, html: string, attachments: Attachment[]) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error("Missing EMAIL_USER or EMAIL_PASS in environment");
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
  });

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to:`hpstobookings@gmail.com, hpbookings@icloud, hydroparkfm@gmail.com hydroparkrecepyion@gmail.com, vishaun.b.maharaj@icloud.com`,
    subject,
    html,
    attachments: attachments?.map((file) => ({
      filename: file.name,
      content: file.content,
      encoding: "base64",
    })),
  });
}
