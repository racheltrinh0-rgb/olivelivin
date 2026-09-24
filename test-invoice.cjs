const fs = require("fs");
const nodemailer = require("nodemailer");
const { PDFDocument, rgb } = require("pdf-lib");
const fontkit = require("@pdf-lib/fontkit");

async function main() {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  const regularFontBytes = fs.readFileSync(
    "./supabase/functions/send-order-confirmation/NotoSans-Regular.ttf"
  );

  const boldFontBytes = fs.readFileSync(
    "./supabase/functions/send-order-confirmation/NotoSans-Bold.ttf"
  );

  const font = await pdfDoc.embedFont(regularFontBytes);
  const boldFont = await pdfDoc.embedFont(boldFontBytes);

  const page = pdfDoc.addPage([595.28, 841.89]);

  const black = rgb(0.08, 0.08, 0.08);
  const gray = rgb(0.42, 0.42, 0.42);
  const lightGray = rgb(0.92, 0.92, 0.92);

  const order = {
    id: "TEST-OLV-001",
    created_at: new Date().toISOString(),
    full_name: "Rachel Trinh",
    email: "racheltrinh0@gmail.com",
    phone: "0901234567",
    address: "123 Nguyễn Huệ",
    ward: "Phường Bến Nghé",
    district: "Quận 1",
    city: "TP. Hồ Chí Minh",
    payment_method: "cod",
    subtotal: 1299000,
    shipping_fee: 30000,
    shipping_discount: 30000,
    discount_amount: 39000,
    total: 1299000,
  };

  const items = [
    {
      product_name: "Olive Living Premium Product",
      color_name: "Đen",
      unit_price: 899000,
      quantity: 1,
    },
    {
      product_name: "Olive Living Accessories",
      color_name: "Nâu",
      unit_price: 400000,
      quantity: 1,
    },
  ];

  let y = 785;

  page.drawText("OLIVE LIVING", {
    x: 40,
    y,
    size: 22,
    font: boldFont,
    color: black,
  });

  page.drawText("XÁC NHẬN ĐƠN HÀNG", {
    x: 40,
    y: y - 22,
    size: 9,
    font,
    color: gray,
  });

  page.drawText("OLV-TEST-001", {
    x: 445,
    y,
    size: 12,
    font: boldFont,
    color: black,
  });

  page.drawText("06/09/2026", {
    x: 445,
    y: y - 18,
    size: 9,
    font,
    color: gray,
  });

  y -= 70;

  page.drawLine({
    start: { x: 40, y },
    end: { x: 555, y },
    thickness: 1,
    color: lightGray,
  });

  y -= 30;

  page.drawText("THÔNG TIN KHÁCH HÀNG", {
    x: 40,
    y,
    size: 10,
    font: boldFont,
    color: black,
  });

  y -= 20;

  const customerLines = [
    `Họ tên: ${order.full_name}`,
    `Email: ${order.email}`,
    `Điện thoại: ${order.phone}`,
    `Địa chỉ: ${order.address}, ${order.ward}, ${order.district}, ${order.city}`,
  ];

  for (const line of customerLines) {
    page.drawText(line, {
      x: 40,
      y,
      size: 9,
      font,
      color: gray,
    });
    y -= 16;
  }

  y -= 15;

  page.drawText("SẢN PHẨM", {
    x: 40,
    y,
    size: 10,
    font: boldFont,
    color: black,
  });

  y -= 24;

  page.drawText("Sản phẩm", {
    x: 40,
    y,
    size: 8,
    font: boldFont,
  });

  page.drawText("SL", {
    x: 365,
    y,
    size: 8,
    font: boldFont,
  });

  page.drawText("Đơn giá", {
    x: 405,
    y,
    size: 8,
    font: boldFont,
  });

  page.drawText("Thành tiền", {
    x: 485,
    y,
    size: 8,
    font: boldFont,
  });

  y -= 30;

  for (const item of items) {
    const lineTotal = item.unit_price * item.quantity;

    page.drawText(`${item.product_name} - ${item.color_name}`, {
      x: 40,
      y,
      size: 8.5,
      font,
      color: black,
    });

    page.drawText(String(item.quantity), {
      x: 365,
      y,
      size: 8.5,
      font,
    });

    page.drawText(
      `${item.unit_price.toLocaleString("vi-VN")}đ`,
      {
        x: 405,
        y,
        size: 8.5,
        font,
      },
    );

    page.drawText(
      `${lineTotal.toLocaleString("vi-VN")}đ`,
      {
        x: 485,
        y,
        size: 8.5,
        font,
      },
    );

    y -= 22;
  }

  y -= 10;

  page.drawLine({
    start: { x: 350, y },
    end: { x: 555, y },
    thickness: 0.7,
    color: lightGray,
  });

  y -= 22;

  const summary = [
    ["Tạm tính", order.subtotal],
    ["Phí vận chuyển", order.shipping_fee],
    ["Giảm phí vận chuyển", -order.shipping_discount],
    ["Giảm giá", -order.discount_amount],
  ];

  for (const [label, value] of summary) {
    page.drawText(label, {
      x: 350,
      y,
      size: 8.5,
      font,
      color: gray,
    });

    page.drawText(
      `${Number(value).toLocaleString("vi-VN")}đ`,
      {
        x: 485,
        y,
        size: 8.5,
        font,
      },
    );

    y -= 18;
  }

  y -= 5;

  page.drawLine({
    start: { x: 350, y },
    end: { x: 555, y },
    thickness: 1,
    color: black,
  });

  y -= 25;

  page.drawText("TỔNG THANH TOÁN", {
    x: 350,
    y,
    size: 10,
    font: boldFont,
    color: black,
  });

  page.drawText(
    `${order.total.toLocaleString("vi-VN")}đ`,
    {
      x: 470,
      y,
      size: 12,
      font: boldFont,
      color: black,
    },
  );

  y -= 40;

  page.drawText("PHƯƠNG THỨC THANH TOÁN", {
    x: 40,
    y,
    size: 9,
    font: boldFont,
    color: black,
  });

  y -= 18;

  page.drawText("Thanh toán khi nhận hàng", {
    x: 40,
    y,
    size: 9,
    font,
    color: gray,
  });

  y -= 45;

  page.drawText("Cảm ơn bạn đã mua sắm tại Olive Living.", {
    x: 40,
    y,
    size: 9,
    font,
    color: gray,
  });

  page.drawText("www.olivelivingvn.com", {
    x: 40,
    y: y - 16,
    size: 8,
    font,
    color: gray,
  });

  const pdfBytes = await pdfDoc.save();

  fs.writeFileSync("./Invoice-OLV-TEST-001.pdf", pdfBytes);

  const transporter = nodemailer.createTransport({
    host: "ng-shost103.tenten.vn",
    port: 465,
    secure: true,
    auth: {
      user: "orders@olivelivingvn.com",
      pass: process.env.ORDER_SMTP_PASSWORD,
    },
  });

  const info = await transporter.sendMail({
    from: '"Olive Living" <orders@olivelivingvn.com>',
    to: "racheltrinh0@gmail.com",
    subject: "Test Invoice PDF - Olive Living",
    html: `
      <div style="font-family:Arial,sans-serif;padding:30px">
        <h2>OLIVE LIVING</h2>
        <p>Đây là email test invoice.</p>
        <p><strong>Mã đơn:</strong> OLV-TEST-001</p>
        <p>File PDF invoice được đính kèm.</p>
      </div>
    `,
    attachments: [
      {
        filename: "Invoice-OLV-TEST-001.pdf",
        content: pdfBytes,
        contentType: "application/pdf",
      },
    ],
  });

  console.log("PDF CREATED: Invoice-OLV-TEST-001.pdf");
  console.log("EMAIL SENT:", info.messageId);
}

main().catch((error) => {
  console.error("TEST ERROR:", error);
});
