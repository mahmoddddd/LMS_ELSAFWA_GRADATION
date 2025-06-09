import nodemailer from "nodemailer";

export const sendEmail = async (data) => {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    service: "gmail",
    auth: {
      user: process.env.MAIL_ID,
      pass: process.env.PASS_MAIL,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  const info = await transporter.sendMail({
    from: `"Hey😊" <${process.env.MAIL_ID}>`,
    to: data.to,
    subject: data.subject,
    text: data.text,
    html: data.html,
  });

  console.log("Email sent: " + info.response);
};
