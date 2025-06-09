import { sendEmail } from "./sendMail.js" // // تأكد من الم

export const subscribeUser = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    await sendEmail({
      to: email,
      subject: "Welcome to Elsafwa LMS!",
      text: "Thanks for subscribing to Elsafwa LMS updates! We'll keep you in the loop. And we promise to keep your data secure.",
      html: `<h2>Welcome!</h2><p>Thanks for subscribing to <strong>Elsafwa LMS</strong>. Stay tuned for updates!</p>`,
    });

    res.status(200).json({ message: "Subscription successful" });
  } catch (error) {
    console.error("Email error:", error);
    res.status(500).json({ message: "Email sending failed" });
  }
};


import nodemailer from "nodemailer";

export const sendContactMessage = async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ message: "All fields are required." });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.MAIL_ID,
        pass: process.env.PASS_MAIL,
      },
    });

    const mailOptions = {
      from: `"${name}" <${email}>`,
      to: process.env.MAIL_ID,
      subject: `New Contact Message from ${name}`,
      text: message,
      html: `<p>${message}</p><p>From: ${name} - ${email}</p>`,
    };

    await transporter.sendMail(mailOptions);

    res.json({ message: "Message sent successfully!" });
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({ message: "Failed to send message." });
  }
};
