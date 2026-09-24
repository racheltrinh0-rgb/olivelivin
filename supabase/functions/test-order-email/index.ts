import nodemailer from "npm:nodemailer@^7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const smtpUser = Deno.env.get("ORDER_SMTP_USER");
    const smtpPassword = Deno.env.get("ORDER_SMTP_PASSWORD");

    if (!smtpUser || !smtpPassword) {
      throw new Error("ORDER_SMTP_USER or ORDER_SMTP_PASSWORD is missing");
    }

    const body = await req.json().catch(() => ({}));
    const to = body.to || smtpUser;

    const transporter = nodemailer.createTransport({
      host: "ng-shost103.tenten.vn",
      port: 465,
      secure: true,
      auth: {
        user: smtpUser,
        pass: smtpPassword,
      },
    });

    await transporter.sendMail({
      from: `"Olive Living" <${smtpUser}>`,
      to,
      subject: "Test email - Olive Living",
      html: `
        <div style="font-family:Arial,sans-serif;padding:30px">
          <h2>Olive Living</h2>
          <p>Đây là email test từ hệ thống đơn hàng.</p>
          <p><strong>SMTP: orders@olivelivingvn.com</strong></p>
          <p>Nếu bạn nhận được email này thì SMTP hoạt động bình thường.</p>
        </div>
      `,
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: `Test email sent to ${to}`,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  } catch (error) {
    console.error("TEST EMAIL ERROR:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  }
});
