import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@^2";
import nodemailer from "npm:nodemailer@^7";
import {
  PDFDocument,
  rgb,
} from "npm:pdf-lib@^1.17.1";
import fontkit from "npm:@pdf-lib/fontkit@^1.1.1";

import {
  NOTO_SANS_REGULAR_BASE64,
  NOTO_SANS_BOLD_BASE64,
} from "./fonts.ts";

/* =========================================================
   TYPES
========================================================= */

type OrderItem = {
  id?: string;
  product_name?: string;
  product_image?: string | null;
  color_name?: string | null;
  color_hex?: string | null;
  unit_price?: number;
  quantity?: number;
};

type Order = {
  id: string;
  created_at?: string;

  full_name?: string;
  email?: string;
  phone?: string;

  address?: string;
  ward?: string;
  district?: string;
  city?: string;

  payment_method?: string;

  subtotal?: number;
  shipping_fee?: number;
  shipping_discount?: number;

  discount_amount?: number;

  discount_voucher_code?: string | null;
  discount_voucher_name?: string | null;

  shipping_voucher_code?: string | null;
  shipping_voucher_name?: string | null;
  shipping_voucher_value?: number;

  total?: number;
};

type RequestBody = {
  order_id: string;
};

/* =========================================================
   HELPERS
========================================================= */

function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);

  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes;
}

function formatMoney(value?: number | null): string {
  const number = Number(value ?? 0);

  return new Intl.NumberFormat("vi-VN").format(number) + "đ";
}

function formatDateVi(dateString?: string): string {
  if (!dateString) return "";

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(date);
}

function createOrderNumber(id: string): string {
  return `OLV-${id.replace(/-/g, "").slice(0, 8).toUpperCase()}`;
}

function normalizeImageUrl(url: string): string {
  return url
    .trim()
    .replace(/^https\\:\/\//, "https://")
    .replace(/^http\\:\/\//, "http://");
}

/* =========================================================
   FETCH PRODUCT IMAGE
========================================================= */

type ImageResult = {
  bytes: Uint8Array;
  type: "jpg" | "png";
};

async function fetchProductImage(
  url?: string | null,
): Promise<ImageResult | null> {
  if (!url) {
    return null;
  }

  try {
    const imageUrl = normalizeImageUrl(url);

    console.log("FETCH PRODUCT IMAGE:", imageUrl);

    const response = await fetch(imageUrl, {
      method: "GET",
      redirect: "follow",
    });

    if (!response.ok) {
      console.error(
        "PRODUCT IMAGE FETCH FAILED:",
        response.status,
        response.statusText,
      );

      return null;
    }

    const contentType =
      response.headers.get("content-type")?.toLowerCase() ?? "";

    const bytes = new Uint8Array(
      await response.arrayBuffer(),
    );

    if (
      contentType.includes("jpeg") ||
      contentType.includes("jpg") ||
      imageUrl.toLowerCase().split("?")[0].endsWith(".jpg") ||
      imageUrl.toLowerCase().split("?")[0].endsWith(".jpeg")
    ) {
      return {
        bytes,
        type: "jpg",
      };
    }

    if (
      contentType.includes("png") ||
      imageUrl.toLowerCase().split("?")[0].endsWith(".png")
    ) {
      return {
        bytes,
        type: "png",
      };
    }

    console.error(
      "UNSUPPORTED PRODUCT IMAGE TYPE:",
      contentType,
      imageUrl,
    );

    return null;
  } catch (error) {
    console.error(
      "PRODUCT IMAGE FETCH ERROR:",
      error,
    );

    return null;
  }
}

/* =========================================================
   DRAW HELPERS
========================================================= */

function drawText(
  page: any,
  text: string,
  x: number,
  y: number,
  options: {
    font: any;
    size?: number;
    color?: any;
  },
) {
  page.drawText(String(text ?? ""), {
    x,
    y,
    font: options.font,
    size: options.size ?? 9,
    color: options.color ?? rgb(0.15, 0.15, 0.15),
  });
}

function truncateText(
  text: string,
  maxLength: number,
): string {
  if (text.length <= maxLength) {
    return text;
  }

  return text.slice(0, maxLength - 3) + "...";
}

function drawRightText(
  page: any,
  text: string,
  rightX: number,
  y: number,
  options: {
    font: any;
    size?: number;
    color?: any;
  },
) {
  const width = options.font.widthOfTextAtSize(
    String(text),
    options.size ?? 9,
  );

  drawText(
    page,
    text,
    rightX - width,
    y,
    options,
  );
}

/* =========================================================
   INVOICE PDF
========================================================= */

async function createInvoicePdf(
  order: Order,
  items: OrderItem[],
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();

  pdfDoc.registerFontkit(fontkit);

  const regularFont = await pdfDoc.embedFont(
    base64ToUint8Array(
      NOTO_SANS_REGULAR_BASE64,
    ),
    {
      subset: true,
    },
  );

  const boldFont = await pdfDoc.embedFont(
    base64ToUint8Array(
      NOTO_SANS_BOLD_BASE64,
    ),
    {
      subset: true,
    },
  );

  const PAGE_WIDTH = 595.28;
  const PAGE_HEIGHT = 841.89;

  const MARGIN = 40;

  const black = rgb(
    0.12,
    0.12,
    0.12,
  );

  const gray = rgb(
    0.42,
    0.42,
    0.42,
  );

  const lightGray = rgb(
    0.94,
    0.94,
    0.94,
  );

  const borderGray = rgb(
    0.84,
    0.84,
    0.84,
  );

  const accent = rgb(
    0.58,
    0.45,
    0.25,
  );

  const pages: any[] = [];

  let page = pdfDoc.addPage([
    PAGE_WIDTH,
    PAGE_HEIGHT,
  ]);

  pages.push(page);

  let y = PAGE_HEIGHT - MARGIN;

  /* =======================================================
     HEADER
  ======================================================= */

  drawText(
    page,
    "OLIVE LIVING",
    MARGIN,
    y,
    {
      font: boldFont,
      size: 23,
      color: black,
    },
  );

  drawText(
    page,
    "Nội thất & ánh sáng cho không gian sống",
    MARGIN,
    y - 20,
    {
      font: regularFont,
      size: 8,
      color: gray,
    },
  );

  drawRightText(
    page,
    "HÓA ĐƠN / INVOICE",
    PAGE_WIDTH - MARGIN,
    y,
    {
      font: boldFont,
      size: 15,
      color: black,
    },
  );

  const orderNumber = createOrderNumber(
    order.id,
  );

  drawRightText(
    page,
    orderNumber,
    PAGE_WIDTH - MARGIN,
    y - 20,
    {
      font: regularFont,
      size: 9,
      color: gray,
    },
  );

  drawRightText(
    page,
    formatDateVi(order.created_at),
    PAGE_WIDTH - MARGIN,
    y - 34,
    {
      font: regularFont,
      size: 8,
      color: gray,
    },
  );

  y -= 70;

  page.drawLine({
    start: {
      x: MARGIN,
      y,
    },
    end: {
      x: PAGE_WIDTH - MARGIN,
      y,
    },
    thickness: 1,
    color: borderGray,
  });

  y -= 25;

  /* =======================================================
     CUSTOMER
  ======================================================= */

  drawText(
    page,
    "THÔNG TIN KHÁCH HÀNG",
    MARGIN,
    y,
    {
      font: boldFont,
      size: 9,
      color: black,
    },
  );

  y -= 18;

  drawText(
    page,
    order.full_name || "",
    MARGIN,
    y,
    {
      font: boldFont,
      size: 10,
      color: black,
    },
  );

  y -= 15;

  drawText(
    page,
    `Email: ${order.email || ""}`,
    MARGIN,
    y,
    {
      font: regularFont,
      size: 8,
      color: gray,
    },
  );

  y -= 14;

  drawText(
    page,
    `Điện thoại: ${order.phone || ""}`,
    MARGIN,
    y,
    {
      font: regularFont,
      size: 8,
      color: gray,
    },
  );

  y -= 14;

  const address = [
    order.address,
    order.ward,
    order.district,
    order.city,
  ]
    .filter(Boolean)
    .join(", ");

  drawText(
    page,
    `Địa chỉ: ${truncateText(address, 90)}`,
    MARGIN,
    y,
    {
      font: regularFont,
      size: 8,
      color: gray,
    },
  );

  y -= 35;

  /* =======================================================
     PRODUCT TABLE HEADER
  ======================================================= */

  const tableLeft = MARGIN;
  const tableRight = PAGE_WIDTH - MARGIN;

  const imageX = tableLeft;
  const imageWidth = 65;

  const productX = imageX + imageWidth + 10;

  const quantityX = 375;
  const priceRightX = 465;
  const totalRightX = tableRight;

  page.drawRectangle({
    x: tableLeft,
    y: y - 20,
    width: tableRight - tableLeft,
    height: 22,
    color: lightGray,
  });

  drawText(
    page,
    "SẢN PHẨM",
    productX,
    y - 13,
    {
      font: boldFont,
      size: 7.5,
      color: gray,
    },
  );

  drawText(
    page,
    "SL",
    quantityX,
    y - 13,
    {
      font: boldFont,
      size: 7.5,
      color: gray,
    },
  );

  drawRightText(
    page,
    "ĐƠN GIÁ",
    priceRightX,
    y - 13,
    {
      font: boldFont,
      size: 7.5,
      color: gray,
    },
  );

  drawRightText(
    page,
    "THÀNH TIỀN",
    totalRightX,
    y - 13,
    {
      font: boldFont,
      size: 7.5,
      color: gray,
    },
  );

  y -= 28;

  /* =======================================================
     PRODUCT ROWS
  ======================================================= */

  for (const item of items) {
    const rowHeight = 82;

    if (y - rowHeight < 170) {
      page = pdfDoc.addPage([
        PAGE_WIDTH,
        PAGE_HEIGHT,
      ]);

      pages.push(page);

      y = PAGE_HEIGHT - MARGIN;

      drawText(
        page,
        "OLIVE LIVING",
        MARGIN,
        y,
        {
          font: boldFont,
          size: 15,
          color: black,
        },
      );

      drawRightText(
        page,
        `HÓA ĐƠN ${orderNumber}`,
        tableRight,
        y,
        {
          font: boldFont,
          size: 9,
          color: gray,
        },
      );

      y -= 35;

      page.drawLine({
        start: {
          x: MARGIN,
          y,
        },
        end: {
          x: tableRight,
          y,
        },
        thickness: 1,
        color: borderGray,
      });

      y -= 20;
    }

    const rowTop = y;

    page.drawLine({
      start: {
        x: tableLeft,
        y: rowTop - rowHeight,
      },
      end: {
        x: tableRight,
        y: rowTop - rowHeight,
      },
      thickness: 0.6,
      color: borderGray,
    });

    /* -------------------------------------------------------
       PRODUCT IMAGE
    ------------------------------------------------------- */

    const imageResult = await fetchProductImage(
      item.product_image,
    );

    if (imageResult) {
      try {
        const embeddedImage =
          imageResult.type === "jpg"
            ? await pdfDoc.embedJpg(
                imageResult.bytes,
              )
            : await pdfDoc.embedPng(
                imageResult.bytes,
              );

        const imageBox = 58;

        const scale =
          Math.min(
            imageBox / embeddedImage.width,
            imageBox / embeddedImage.height,
          );

        const drawWidth =
          embeddedImage.width * scale;

        const drawHeight =
          embeddedImage.height * scale;

        page.drawImage(
          embeddedImage,
          {
            x:
              imageX +
              (imageBox - drawWidth) / 2,
            y:
              rowTop -
              10 -
              drawHeight,
            width: drawWidth,
            height: drawHeight,
          },
        );
      } catch (imageError) {
        console.error(
          "EMBED IMAGE ERROR:",
          imageError,
        );

        page.drawRectangle({
          x: imageX,
          y: rowTop - 68,
          width: 58,
          height: 58,
          borderWidth: 0.5,
          borderColor: borderGray,
          color: lightGray,
        });
      }
    } else {
      page.drawRectangle({
        x: imageX,
        y: rowTop - 68,
        width: 58,
        height: 58,
        borderWidth: 0.5,
        borderColor: borderGray,
        color: lightGray,
      });

      drawText(
        page,
        "No image",
        imageX + 8,
        rowTop - 39,
        {
          font: regularFont,
          size: 6,
          color: gray,
        },
      );
    }

    /* -------------------------------------------------------
       PRODUCT NAME
    ------------------------------------------------------- */

    const productName =
      item.product_name || "Sản phẩm";

    const firstLine =
      truncateText(productName, 46);

    drawText(
      page,
      firstLine,
      productX,
      rowTop - 18,
      {
        font: boldFont,
        size: 8.5,
        color: black,
      },
    );

    if (item.color_name) {
      drawText(
        page,
        `Màu: ${item.color_name}`,
        productX,
        rowTop - 34,
        {
          font: regularFont,
          size: 7.5,
          color: gray,
        },
      );
    }

    if (item.product_image) {
      drawText(
        page,
        "Ảnh sản phẩm thực tế",
        productX,
        rowTop - 50,
        {
          font: regularFont,
          size: 6.5,
          color: gray,
        },
      );
    }

    /* -------------------------------------------------------
       QUANTITY
    ------------------------------------------------------- */

    drawText(
      page,
      String(item.quantity ?? 0),
      quantityX,
      rowTop - 22,
      {
        font: regularFont,
        size: 8,
        color: black,
      },
    );

    /* -------------------------------------------------------
       UNIT PRICE
    ------------------------------------------------------- */

    const unitPrice = formatMoney(
      item.unit_price,
    );

    drawRightText(
      page,
      unitPrice,
      priceRightX,
      rowTop - 22,
      {
        font: regularFont,
        size: 8,
        color: black,
      },
    );

    /* -------------------------------------------------------
       LINE TOTAL
    ------------------------------------------------------- */

    const lineTotal =
      Number(item.unit_price ?? 0) *
      Number(item.quantity ?? 0);

    drawRightText(
      page,
      formatMoney(lineTotal),
      totalRightX,
      rowTop - 22,
      {
        font: boldFont,
        size: 8,
        color: black,
      },
    );

    y -= rowHeight;
  }

  /* =======================================================
     SUMMARY
  ======================================================= */

  if (y < 220) {
    page = pdfDoc.addPage([
      PAGE_WIDTH,
      PAGE_HEIGHT,
    ]);

    pages.push(page);

    y = PAGE_HEIGHT - MARGIN;

    drawText(
      page,
      "OLIVE LIVING",
      MARGIN,
      y,
      {
        font: boldFont,
        size: 15,
        color: black,
      },
    );

    y -= 40;
  }

  y -= 20;

  const summaryX = 320;
  const summaryRight = tableRight;

  drawText(
    page,
    "Tạm tính",
    summaryX,
    y,
    {
      font: regularFont,
      size: 9,
      color: gray,
    },
  );

  drawRightText(
    page,
    formatMoney(order.subtotal),
    summaryRight,
    y,
    {
      font: regularFont,
      size: 9,
      color: black,
    },
  );

  y -= 20;

  drawText(
    page,
    "Phí vận chuyển",
    summaryX,
    y,
    {
      font: regularFont,
      size: 9,
      color: gray,
    },
  );

  drawRightText(
    page,
    formatMoney(order.shipping_fee),
    summaryRight,
    y,
    {
      font: regularFont,
      size: 9,
      color: black,
    },
  );

  /* =======================================================
     VOUCHERS
  ======================================================= */

  const hasDiscountVoucher =
    Boolean(order.discount_voucher_code) &&
    Number(order.discount_amount ?? 0) > 0;

  const hasShippingVoucher =
    Boolean(order.shipping_voucher_code) &&
    Number(
      order.shipping_discount ??
        order.shipping_voucher_value ??
        0,
    ) > 0;

  if (
    hasDiscountVoucher ||
    hasShippingVoucher
  ) {
    y -= 28;

    drawText(
      page,
      "ƯU ĐÃI",
      summaryX,
      y,
      {
        font: boldFont,
        size: 8,
        color: accent,
      },
    );

    y -= 18;

    if (hasDiscountVoucher) {
      drawText(
        page,
        order.discount_voucher_code!,
        summaryX,
        y,
        {
          font: boldFont,
          size: 8,
          color: black,
        },
      );

      if (order.discount_voucher_name) {
        drawText(
          page,
          ` · ${truncateText(
            order.discount_voucher_name,
            28,
          )}`,
          summaryX + 65,
          y,
          {
            font: regularFont,
            size: 7,
            color: gray,
          },
        );
      }

      drawRightText(
        page,
        `-${formatMoney(
          order.discount_amount,
        )}`,
        summaryRight,
        y,
        {
          font: regularFont,
          size: 9,
          color: black,
        },
      );

      y -= 18;
    }

    if (hasShippingVoucher) {
      const shippingDiscount =
        Number(
          order.shipping_discount ??
            order.shipping_voucher_value ??
            0,
        );

      drawText(
        page,
        order.shipping_voucher_code!,
        summaryX,
        y,
        {
          font: boldFont,
          size: 8,
          color: black,
        },
      );

      if (order.shipping_voucher_name) {
        drawText(
          page,
          ` · ${truncateText(
            order.shipping_voucher_name,
            28,
          )}`,
          summaryX + 65,
          y,
          {
            font: regularFont,
            size: 7,
            color: gray,
          },
        );
      }

      drawRightText(
        page,
        `-${formatMoney(
          shippingDiscount,
        )}`,
        summaryRight,
        y,
        {
          font: regularFont,
          size: 9,
          color: black,
        },
      );

      y -= 18;
    }

    const totalVoucherDiscount =
      Number(order.discount_amount ?? 0) +
      Number(
        order.shipping_discount ??
          order.shipping_voucher_value ??
          0,
      );

    y -= 4;

    page.drawLine({
      start: {
        x: summaryX,
        y,
      },
      end: {
        x: summaryRight,
        y,
      },
      thickness: 0.7,
      color: borderGray,
    });

    y -= 18;

    drawText(
      page,
      "Tổng ưu đãi",
      summaryX,
      y,
      {
        font: boldFont,
        size: 8.5,
        color: gray,
      },
    );

    drawRightText(
      page,
      `-${formatMoney(
        totalVoucherDiscount,
      )}`,
      summaryRight,
      y,
      {
        font: boldFont,
        size: 9,
        color: black,
      },
    );
  }

  /* =======================================================
     TOTAL
  ======================================================= */

  y -= 32;

  page.drawRectangle({
    x: summaryX - 10,
    y: y - 15,
    width:
      summaryRight -
      summaryX +
      10,
    height: 45,
    color: lightGray,
  });

  drawText(
    page,
    "TỔNG THANH TOÁN",
    summaryX,
    y,
    {
      font: boldFont,
      size: 9,
      color: black,
    },
  );

  drawRightText(
    page,
    formatMoney(order.total),
    summaryRight,
    y,
    {
      font: boldFont,
      size: 14,
      color: black,
    },
  );

  /* =======================================================
     PAYMENT
  ======================================================= */

  y -= 55;

  drawText(
    page,
    "PHƯƠNG THỨC THANH TOÁN",
    MARGIN,
    y,
    {
      font: boldFont,
      size: 8,
      color: gray,
    },
  );

  y -= 16;

  const paymentMap: Record<string, string> = {
    cod: "Thanh toán khi nhận hàng (COD)",
    bank_transfer: "Chuyển khoản ngân hàng",
    transfer: "Chuyển khoản ngân hàng",
    momo: "MoMo",
    zalopay: "ZaloPay",
  };

  drawText(
    page,
    paymentMap[
      order.payment_method || ""
    ] ||
      order.payment_method ||
      "Chưa xác định",
    MARGIN,
    y,
    {
      font: regularFont,
      size: 8.5,
      color: black,
    },
  );

  /* =======================================================
     FOOTER
  ======================================================= */

  for (const currentPage of pages) {
    currentPage.drawLine({
      start: {
        x: MARGIN,
        y: 48,
      },
      end: {
        x: PAGE_WIDTH - MARGIN,
        y: 48,
      },
      thickness: 0.6,
      color: borderGray,
    });

    drawText(
      currentPage,
      "Cảm ơn bạn đã mua sắm tại Olive Living.",
      MARGIN,
      31,
      {
        font: regularFont,
        size: 7,
        color: gray,
      },
    );

    drawRightText(
      currentPage,
      "olivelivingvn.com",
      PAGE_WIDTH - MARGIN,
      31,
      {
        font: regularFont,
        size: 7,
        color: gray,
      },
    );
  }

  return await pdfDoc.save();
}

/* =========================================================
   EMAIL HTML
========================================================= */

function buildEmailHtml(
  order: Order,
  items: OrderItem[],
): string {
  const orderNumber =
    createOrderNumber(order.id);

  const productRows = items
    .map((item) => {
      const quantity =
        Number(item.quantity ?? 0);

      const unitPrice =
        Number(item.unit_price ?? 0);

      const lineTotal =
        quantity * unitPrice;

      return `
        <tr>
          <td style="
            padding:12px 0;
            border-bottom:1px solid #eeeeee;
          ">
            <div style="
              font-size:14px;
              font-weight:600;
              color:#222;
            ">
              ${escapeHtml(
                item.product_name ||
                  "Sản phẩm",
              )}
            </div>

            ${
              item.color_name
                ? `
                  <div style="
                    margin-top:4px;
                    font-size:12px;
                    color:#777;
                  ">
                    Màu: ${escapeHtml(
                      item.color_name,
                    )}
                  </div>
                `
                : ""
            }

            <div style="
              margin-top:4px;
              font-size:12px;
              color:#777;
            ">
              SL: ${quantity}
            </div>
          </td>

          <td style="
            padding:12px 0;
            text-align:right;
            border-bottom:1px solid #eeeeee;
            white-space:nowrap;
          ">
            ${formatMoney(lineTotal)}
          </td>
        </tr>
      `;
    })
    .join("");

  const discountVoucher =
    order.discount_voucher_code &&
    Number(order.discount_amount ?? 0) > 0
      ? `
        <tr>
          <td style="padding:5px 0;color:#777;">
            Voucher ${escapeHtml(
              order.discount_voucher_code,
            )}
          </td>
          <td style="
            padding:5px 0;
            text-align:right;
          ">
            -${formatMoney(
              order.discount_amount,
            )}
          </td>
        </tr>
      `
      : "";

  const shippingVoucher =
    order.shipping_voucher_code &&
    Number(
      order.shipping_discount ??
        order.shipping_voucher_value ??
        0,
    ) > 0
      ? `
        <tr>
          <td style="padding:5px 0;color:#777;">
            Voucher ${escapeHtml(
              order.shipping_voucher_code,
            )}
          </td>
          <td style="
            padding:5px 0;
            text-align:right;
          ">
            -${formatMoney(
              order.shipping_discount ??
                order.shipping_voucher_value ??
                0,
            )}
          </td>
        </tr>
      `
      : "";

  return `
<!doctype html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<meta name="viewport"
content="width=device-width, initial-scale=1.0">
</head>

<body style="
  margin:0;
  padding:0;
  background:#f7f7f5;
  font-family:Arial,sans-serif;
  color:#222;
">

<div style="
  max-width:640px;
  margin:0 auto;
  padding:30px 16px;
">

  <div style="
    background:#ffffff;
    padding:34px;
    border-radius:12px;
  ">

    <div style="
      font-size:22px;
      font-weight:700;
      letter-spacing:1px;
      margin-bottom:6px;
    ">
      OLIVE LIVING
    </div>

    <div style="
      font-size:12px;
      color:#777;
      margin-bottom:30px;
    ">
      Xác nhận đơn hàng
    </div>

    <h1 style="
      font-size:22px;
      margin:0 0 10px;
    ">
      Cảm ơn ${escapeHtml(
        order.full_name || "",
      )}!
    </h1>

    <p style="
      font-size:14px;
      line-height:1.7;
      color:#555;
      margin-top:0;
    ">
      Đơn hàng của bạn đã được tiếp nhận
      thành công.
    </p>

    <div style="
      background:#f6f6f3;
      border-radius:8px;
      padding:16px;
      margin:24px 0;
    ">
      <div style="
        font-size:12px;
        color:#777;
      ">
        MÃ ĐƠN HÀNG
      </div>

      <div style="
        margin-top:5px;
        font-size:18px;
        font-weight:700;
      ">
        ${orderNumber}
      </div>

      <div style="
        margin-top:8px;
        font-size:12px;
        color:#777;
      ">
        ${formatDateVi(
          order.created_at,
        )}
      </div>
    </div>

    <h2 style="
      font-size:15px;
      margin:28px 0 10px;
    ">
      Sản phẩm
    </h2>

    <table style="
      width:100%;
      border-collapse:collapse;
    ">
      ${productRows}
    </table>

    <table style="
      width:100%;
      border-collapse:collapse;
      margin-top:20px;
      font-size:13px;
    ">

      <tr>
        <td style="
          padding:5px 0;
          color:#777;
        ">
          Tạm tính
        </td>

        <td style="
          padding:5px 0;
          text-align:right;
        ">
          ${formatMoney(
            order.subtotal,
          )}
        </td>
      </tr>

      <tr>
        <td style="
          padding:5px 0;
          color:#777;
        ">
          Phí vận chuyển
        </td>

        <td style="
          padding:5px 0;
          text-align:right;
        ">
          ${formatMoney(
            order.shipping_fee,
          )}
        </td>
      </tr>

      ${discountVoucher}
      ${shippingVoucher}

      <tr>
        <td style="
          padding-top:16px;
          border-top:1px solid #ddd;
          font-size:15px;
          font-weight:700;
        ">
          TỔNG THANH TOÁN
        </td>

        <td style="
          padding-top:16px;
          border-top:1px solid #ddd;
          text-align:right;
          font-size:17px;
          font-weight:700;
        ">
          ${formatMoney(order.total)}
        </td>
      </tr>

    </table>

    <div style="
      margin-top:30px;
      padding-top:20px;
      border-top:1px solid #eee;
    ">

      <div style="
        font-size:12px;
        color:#777;
        margin-bottom:5px;
      ">
        Địa chỉ giao hàng
      </div>

      <div style="
        font-size:13px;
        line-height:1.6;
      ">
        ${escapeHtml(
          [
            order.full_name,
            order.phone,
            order.address,
            order.ward,
            order.district,
            order.city,
          ]
            .filter(Boolean)
            .join(", "),
        )}
      </div>

    </div>

    <div style="
      margin-top:30px;
      text-align:center;
      font-size:12px;
      line-height:1.7;
      color:#888;
    ">
      Hóa đơn điện tử được đính kèm
      trong email này.<br>
      Cảm ơn bạn đã lựa chọn Olive Living.
    </div>

  </div>

  <div style="
    text-align:center;
    padding:20px 0;
    font-size:11px;
    color:#999;
  ">
    olivelivingvn.com
  </div>

</div>

</body>
</html>
`;
}

/* =========================================================
   HTML ESCAPE
========================================================= */

function escapeHtml(
  value: string,
): string {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/* =========================================================
   MAIN
========================================================= */

const supabaseUrl =
  Deno.env.get("SUPABASE_URL");

const serviceRoleKey =
  Deno.env.get(
    "SUPABASE_SERVICE_ROLE_KEY",
  );

if (
  !supabaseUrl ||
  !serviceRoleKey
) {
  throw new Error(
    "SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing",
  );
}

const supabaseAdmin =
  createClient(
    supabaseUrl,
    serviceRoleKey,
  );

serve(async (req) => {
  try {
    if (req.method === "OPTIONS") {
      return new Response(
        "ok",
        {
          headers: {
            "Access-Control-Allow-Origin":
              "*",
            "Access-Control-Allow-Headers":
              "authorization, x-client-info, apikey, content-type",
            "Access-Control-Allow-Methods":
              "POST, OPTIONS",
          },
        },
      );
    }

    const body =
      (await req.json()) as RequestBody;

    if (!body.order_id) {
      throw new Error(
        "Missing order_id",
      );
    }

    console.log(
      "SEND ORDER CONFIRMATION:",
      body.order_id,
    );

    /* =====================================================
       LOAD ORDER
    ===================================================== */

    const {
      data: order,
      error: orderError,
    } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("id", body.order_id)
      .single();

    if (orderError) {
      throw new Error(
        `Failed to load order: ${orderError.message}`,
      );
    }

    if (!order) {
      throw new Error(
        "Order not found",
      );
    }

    if (!order.email) {
      throw new Error(
        "Customer email is missing",
      );
    }

    /* =====================================================
       LOAD ORDER ITEMS
    ===================================================== */

    const {
      data: items,
      error: itemsError,
    } = await supabaseAdmin
      .from("order_items")
      .select("*")
      .eq(
        "order_id",
        body.order_id,
      );

    if (itemsError) {
      throw new Error(
        `Failed to load order items: ${itemsError.message}`,
      );
    }

    const orderItems =
      (items ?? []) as OrderItem[];

    console.log(
      "ORDER ITEMS:",
      JSON.stringify(
        orderItems,
        null,
        2,
      ),
    );

    /* =====================================================
       SMTP
    ===================================================== */

    const smtpUser =
      Deno.env.get(
        "ORDER_SMTP_USER",
      );

    const smtpPassword =
      Deno.env.get(
        "ORDER_SMTP_PASSWORD",
      );

    if (
      !smtpUser ||
      !smtpPassword
    ) {
      throw new Error(
        "ORDER_SMTP_USER or ORDER_SMTP_PASSWORD is missing",
      );
    }

    /* =====================================================
       CREATE PDF
    ===================================================== */

    console.log(
      "CREATING INVOICE PDF...",
    );

    const pdfBytes =
      await createInvoicePdf(
        order as Order,
        orderItems,
      );

    console.log(
      "INVOICE PDF CREATED:",
      pdfBytes.length,
      "bytes",
    );

    /* =====================================================
       SMTP TRANSPORT
    ===================================================== */

    const transporter =
      nodemailer.createTransport({
        host: "ng-shost103.tenten.vn",
        port: 465,
        secure: true,

        auth: {
          user: smtpUser,
          pass: smtpPassword,
        },
      });

    await transporter.verify();

    console.log(
      "ORDER SMTP OK",
    );

    /* =====================================================
       SEND EMAIL
    ===================================================== */

    const orderNumber =
      createOrderNumber(
        order.id,
      );

    await transporter.sendMail({
      from: `"Olive Living" <${smtpUser}>`,

      to: order.email,

      subject:
        `Xác nhận đơn hàng ${orderNumber} - Olive Living`,

      html:
        buildEmailHtml(
          order as Order,
          orderItems,
        ),

      attachments: [
        {
          filename:
            `Invoice-${orderNumber}.pdf`,

          content:
            pdfBytes,

          contentType:
            "application/pdf",
        },
      ],
    });

    console.log(
      "ORDER CONFIRMATION EMAIL SENT:",
      order.email,
    );

    return new Response(
      JSON.stringify({
        success: true,
        order_id: order.id,
        order_number: orderNumber,
        email: order.email,
      }),
      {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin":
            "*",
          "Content-Type":
            "application/json",
        },
      },
    );
  } catch (error) {
    console.error(
      "SEND ORDER CONFIRMATION ERROR:",
      error,
    );

    return new Response(
      JSON.stringify({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : String(error),
      }),
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin":
            "*",
          "Content-Type":
            "application/json",
        },
      },
    );
  }
});