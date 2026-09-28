import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const PAYPAL_BASE_URL =
  "https://api-m.sandbox.paypal.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods":
    "POST, OPTIONS",
};

interface CreateOrderPayload {
  amount?: number | string;
  currency?: string;
}

function jsonResponse(
  data: unknown,
  status = 200,
) {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    },
  );
}

async function getPayPalAccessToken(): Promise<string> {
  const clientId =
    Deno.env.get("PAYPAL_CLIENT_ID");

  const clientSecret =
    Deno.env.get("PAYPAL_CLIENT_SECRET");

  console.log(
    "PAYPAL CREDENTIAL CHECK:",
    {
      hasClientId: Boolean(clientId),
      hasClientSecret: Boolean(clientSecret),
    },
  );

  if (!clientId || !clientSecret) {
    throw new Error(
      "PAYPAL_CREDENTIALS_MISSING",
    );
  }

  const credentials = btoa(
    `${clientId}:${clientSecret}`,
  );

  const response = await fetch(
    `${PAYPAL_BASE_URL}/v1/oauth2/token`,
    {
      method: "POST",
      headers: {
        Authorization:
          `Basic ${credentials}`,
        "Content-Type":
          "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body:
        "grant_type=client_credentials",
    },
  );

  const rawText =
    await response.text();

  let data: any;

  try {
    data = JSON.parse(rawText);
  } catch {
    data = {
      raw: rawText,
    };
  }

  console.log(
    "PAYPAL AUTH STATUS:",
    response.status,
  );

  if (
    !response.ok ||
    !data?.access_token
  ) {
    console.error(
      "PAYPAL AUTH ERROR:",
      data,
    );

    throw new Error(
      data?.error_description ||
        data?.error ||
        "PAYPAL_AUTHENTICATION_FAILED",
    );
  }

  return data.access_token;
}

Deno.serve(async (req) => {
  console.log(
    "====================================",
  );

  console.log(
    "PAYPAL CREATE ORDER REQUEST:",
    req.method,
    req.url,
  );

  console.log(
    "====================================",
  );

  if (req.method === "OPTIONS") {
    console.log(
      "PAYPAL CORS PREFLIGHT",
    );

    return new Response("ok", {
      status: 200,
      headers: corsHeaders,
    });
  }

  if (req.method !== "POST") {
    return jsonResponse(
      {
        success: false,
        error: "METHOD_NOT_ALLOWED",
      },
      405,
    );
  }

  try {
    let body: CreateOrderPayload;

    try {
      body = await req.json();
    } catch (error) {
      console.error(
        "PAYPAL JSON ERROR:",
        error,
      );

      return jsonResponse(
        {
          success: false,
          error: "INVALID_JSON",
        },
        400,
      );
    }

    console.log(
      "PAYPAL REQUEST BODY:",
      {
        amount: body?.amount,
        currency: body?.currency,
      },
    );

    const rawAmount =
      body?.amount;

    const amount =
      typeof rawAmount === "string"
        ? Number(rawAmount)
        : rawAmount;

    const currency = String(
      body?.currency || "USD",
    ).toUpperCase();

    console.log(
      "PAYPAL NORMALIZED:",
      {
        amount,
        currency,
      },
    );

    if (
      typeof amount !== "number" ||
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      console.error(
        "PAYPAL INVALID AMOUNT:",
        rawAmount,
      );

      return jsonResponse(
        {
          success: false,
          error: "INVALID_AMOUNT",
          received: rawAmount,
        },
        400,
      );
    }

    if (currency !== "USD") {
      console.error(
        "PAYPAL INVALID CURRENCY:",
        currency,
      );

      return jsonResponse(
        {
          success: false,
          error: "INVALID_CURRENCY",
          received: currency,
        },
        400,
      );
    }

    const paypalAmount =
      Number(amount.toFixed(2));

    console.log(
      "PAYPAL FINAL AMOUNT:",
      paypalAmount,
      currency,
    );

    const accessToken =
      await getPayPalAccessToken();

    console.log(
      "PAYPAL ACCESS TOKEN: OK",
    );

    const paypalResponse =
      await fetch(
        `${PAYPAL_BASE_URL}/v2/checkout/orders`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
            Accept:
              "application/json",
            Authorization:
              `Bearer ${accessToken}`,
            "PayPal-Request-Id":
              crypto.randomUUID(),
          },
          body: JSON.stringify({
            intent: "CAPTURE",
            purchase_units: [
              {
                amount: {
                  currency_code:
                    currency,
                  value:
                    paypalAmount.toFixed(2),
                },
              },
            ],
          }),
        },
      );

    const rawPaypalText =
      await paypalResponse.text();

    let paypalData: any;

    try {
      paypalData =
        JSON.parse(rawPaypalText);
    } catch {
      paypalData = {
        raw: rawPaypalText,
      };
    }

    console.log(
      "PAYPAL CREATE ORDER STATUS:",
      paypalResponse.status,
    );

    console.log(
      "PAYPAL CREATE ORDER RESPONSE:",
      paypalData,
    );

    if (!paypalResponse.ok) {
      console.error(
        "PAYPAL CREATE ORDER FAILED:",
        paypalData,
      );

      return jsonResponse(
        {
          success: false,
          error:
            "PAYPAL_CREATE_ORDER_FAILED",
          paypalStatus:
            paypalResponse.status,
          details:
            paypalData,
        },
        paypalResponse.status,
      );
    }

    const orderId =
      paypalData?.id;

    if (!orderId) {
      console.error(
        "PAYPAL ORDER ID MISSING:",
        paypalData,
      );

      return jsonResponse(
        {
          success: false,
          error:
            "PAYPAL_ORDER_ID_MISSING",
          details:
            paypalData,
        },
        500,
      );
    }

    console.log(
      "====================================",
    );

    console.log(
      "PAYPAL ORDER CREATED SUCCESSFULLY",
    );

    console.log(
      "ORDER ID:",
      orderId,
    );

    console.log(
      "STATUS:",
      paypalData?.status,
    );

    console.log(
      "AMOUNT:",
      paypalData
        ?.purchase_units?.[0]
        ?.amount,
    );

    console.log(
      "====================================",
    );

    return jsonResponse(
      {
        success: true,
        orderId,
        status:
          paypalData?.status ||
          "CREATED",
        amount:
          paypalAmount,
        currency,
        environment:
          "sandbox",
      },
      200,
    );
  } catch (error) {
    console.error(
      "====================================",
    );

    console.error(
      "PAYPAL CREATE ORDER FUNCTION ERROR:",
      error,
    );

    console.error(
      "====================================",
    );

    return jsonResponse(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "UNKNOWN_ERROR",
      },
      500,
    );
  }
});