const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "ng-shost103.tenten.vn",
  port: 465,
  secure: true,
  auth: {
    user: "orders@olivelivingvn.com",
    pass: process.env.ORDER_SMTP_PASSWORD,
  },
});

transporter.sendMail({
  from: '"Olive Living" <orders@olivelivingvn.com>',
  to: "racheltrinh0@gmail.com",
  subject: "Test email - Olive Living",
  html: `
    <div style="font-family:Arial,sans-serif;padding:30px">
      <h2>Olive Living</h2>
      <p>Đây là email test từ hệ thống đơn hàng.</p>
      <p><strong>orders@olivelivingvn.com</strong></p>
      <p>Nếu bạn nhận được email này thì SMTP hoạt động bình thường.</p>
    </div>
  `,
})
.then((info) => {
  console.log("EMAIL SENT:", info.messageId);
})
.catch((error) => {
  console.error("EMAIL ERROR:", error);
});
