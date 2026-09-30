import {
  PayPalScriptProvider,
  PayPalButtons,
  FUNDING,
} from "@paypal/react-paypal-js";
import { createFileRoute, useNavigate, Link, redirect } from "@tanstack/react-router";
import { getShippingFee } from "@/lib/shipping";
import { WARDS } from "@/data/wards";
import React, {
  useEffect,
  useState,
  type FormEvent,
} from "react";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { formatVND } from "@/lib/format";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import {
  trackInitiateCheckout,
  trackPurchase,
} from "@/lib/meta";

import CheckoutVoucher from "@/components/checkout/CheckoutVoucher";

import type {
  VoucherSummary,
} from "@/components/checkout/voucher.types";

import {
  Check,
  ChevronsUpDown,
  ShoppingBag,
  MapPin,
  UserRound,
  ArrowRight,
  Truck,
  ShieldCheck,
  Building2,
  ChevronDown,
  ChevronUp,
  Tag,
  Clock3,
  RefreshCcw,
  ShieldAlert,
} from "lucide-react";

import { provinces } from "@/lib/address";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { Button } from "@/components/ui/button";

import { cn } from "@/lib/utils";

import { VIETNAM_CITIES } from "@/lib/vietnam-cities";

import {
  getDistricts,
  getWards,
} from "@/lib/address";


export const Route = createFileRoute("/checkout")({
  validateSearch: (search: Record<string, unknown>) => ({
    policy:
      search.policy === "exchange" ||
      search.policy === "shipping" ||
      search.policy === "contact" ||
      search.policy === "payment"
        ? search.policy
        : undefined,
  }),

  head: () => ({
    meta: [{ title: "Thanh toán — NHÀ" }],
  }),

  component: CheckoutPage,
});



const schema = z.object({
  full_name: z.string().trim().min(2, "Vui lòng nhập họ tên").max(120),
  phone: z.string().trim().min(8, "Số điện thoại không hợp lệ").max(20),
  email: z
  .string()
  .trim()
  .optional()
  .or(z.literal(""))
  .refine(
    (v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
    "Email không hợp lệ"
  ),
  address: z.string().trim().min(5, "Vui lòng nhập địa chỉ").max(300),
  city: z.string().trim().min(2).max(120),

district: z.string().trim().min(2, "Vui lòng chọn Quận / Huyện"),

ward: z.string().optional(),

notes: z.string().max(500).optional(),
  payment_method: z.enum(["cod", "transfer", "paypal", "card"]),
});

function CheckoutPage() {
  const paypalOptions = {
    "client-id": import.meta.env.VITE_PAYPAL_CLIENT_ID,
    currency: "USD",
    intent: "capture",
    components: "buttons,funding-eligibility",
  };

  const { items, subtotal, clear, count } = useCart();

  const navigate = useNavigate();
  const { policy } = Route.useSearch();

  const [submitting, setSubmitting] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [voucherOpen, setVoucherOpen] = useState(true);
  const [reviewOpen, setReviewOpen] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [shippingMethod, setShippingMethod] = useState<"standard" | "express">("standard");
  const [policyOpen, setPolicyOpen] = useState<
  "exchange" | "shipping" | "shipping_fee" | "contact" | "payment" | null
>(null);
useEffect(() => {
  if (policy) {
    setPolicyOpen(policy);
  }
}, [policy]);

  const [phoneValue, setPhoneValue] = useState("");
  const [cityValue, setCityValue] = useState("");

  const [districtValue, setDistrictValue] = useState("");
const [wardValue, setWardValue] = useState("");

const [districtOpen, setDistrictOpen] = useState(false);



const [wardOpen, setWardOpen] = useState(false);

  const [cityOpen, setCityOpen] = useState(false);

  // =========================================================
  // SHIPPING
  // Standard: giữ nguyên logic hiện tại.
  // Express: lấy giá từ shipping_zones + express_shipping_rules.
  //
  // Logic:
  // - Lấy zone theo Quận/Huyện.
  // - Lấy category của toàn bộ sản phẩm trong cart.
  // - Nếu có ít nhất 1 category MAX -> dùng rule MAX.
  // - Nếu tất cả đều MIN -> dùng rule MIN.
  // - Quantity không nhân phí ship.
  // =========================================================

  const baseShipping = getShippingFee(cityValue);

  const [expressShipping, setExpressShipping] = useState(0);
  const [expressLoading, setExpressLoading] = useState(false);
  const [expressError, setExpressError] = useState<string | null>(null);

  const getExpressZoneCode = (
    district: string,
    ward: string,
  ): string | null => {
    const value = district
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .trim();

    if (!value) return null;

    if (value.includes("binh chanh")) return "HCM_BINH_CHANH_BINH_HUNG";
    if (value.includes("binh tan")) return "HCM_BINH_TAN";
    if (value.includes("binh thanh")) return "HCM_BINH_THANH";
    if (value.includes("go vap")) return "HCM_GO_VAP";
    if (value.includes("phu nhuan")) return "HCM_PHU_NHUAN";

    if (
      value === "quan 1" ||
      value === "q1" ||
      value.includes("quan 1 ")
    ) return "HCM_Q1";

    const wardValueNormalized = ward
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .trim();

    if (
      value === "quan 2" ||
      value === "q2" ||
      value.includes("thao dien") ||
      value.includes("quan 2/") ||
      wardValueNormalized.includes("thao dien")
    ) return "HCM_Q2_THAO_DIEN";

    if (
      value === "quan 3" ||
      value === "q3"
    ) return "HCM_Q3";

    if (
      value === "quan 4" ||
      value === "q4"
    ) return "HCM_Q4";

    if (
      value === "quan 5" ||
      value === "q5"
    ) return "HCM_Q5";

    if (
      value === "quan 6" ||
      value === "q6"
    ) return "HCM_Q6";

    if (
      value === "quan 7" ||
      value === "q7" ||
      value.includes("tan quy") ||
      value.includes("tan phong")
    ) {
      if (
        wardValueNormalized.includes("phu my") ||
        wardValueNormalized.includes("tan phu")
      ) {
        return "HCM_Q7_PHU_MY_HUNG";
      }

      return "HCM_Q7_TAN_QUY_TAN_PHONG";
    }

    if (
      value.includes("phu my hung") ||
      value.includes("phu my")
    ) {
      return "HCM_Q7_PHU_MY_HUNG";
    }

    if (
      value === "quan 8" ||
      value === "q8"
    ) return "HCM_Q8";

    if (
      value === "quan 10" ||
      value === "q10"
    ) return "HCM_Q10";

    if (
      value === "quan 11" ||
      value === "q11"
    ) return "HCM_Q11";

    if (value.includes("tan binh")) return "HCM_TAN_BINH";
    if (value.includes("tan phu")) return "HCM_TAN_PHU";

    if (
      value.includes("thu duc") ||
      value.includes("thanh pho thu duc") ||
      value.includes("tp thu duc")
    ) return "HCM_THU_DUC";

    return null;
  };

  useEffect(() => {
    let cancelled = false;

    async function calculateExpressShipping() {
      if (!cityValue || !districtValue || items.length === 0) {
        setExpressShipping(0);
        setExpressError(null);
        setExpressLoading(false);
        return;
      }

      // Express rules hiện tại chỉ được cấu hình cho HCM.
      const zoneCode =
        cityValue.toLowerCase().includes("ho chi minh") ||
        cityValue.toLowerCase().includes("hồ chí minh") ||
        cityValue.toLowerCase().includes("tphcm") ||
        cityValue.toLowerCase().includes("tp.hcm")
          ? getExpressZoneCode(districtValue, wardValue)
          : null;

      if (!zoneCode) {
        setExpressShipping(0);
        setExpressError("Khu vực này chưa hỗ trợ giao hàng hỏa tốc.");
        setExpressLoading(false);
        return;
      }

      setExpressLoading(true);
      setExpressError(null);

      try {
        // 1. Lấy zone theo code.
        const { data: zone, error: zoneError } = await supabase
          .from("shipping_zones")
          .select("id, code, name, estimated_min_price, estimated_max_price")
          .eq("code", zoneCode)
          .maybeSingle();

        if (zoneError) throw zoneError;

        if (!zone) {
          throw new Error("Không tìm thấy khu vực giao hàng hỏa tốc.");
        }

        // 2. Lấy category_id của các sản phẩm trong cart.
        const productIds = [...new Set(items.map((item) => item.id))];

        const { data: productsData, error: productsError } = await supabase
          .from("products")
          .select("id, category_id, express_available")
          .in("id", productIds);

        if (productsError) throw productsError;

        // Express chỉ được phép khi TẤT CẢ sản phẩm trong giỏ
        // đều được bật express_available = true ở Admin sản phẩm.
        const productRows = productsData ?? [];
        const missingProduct = productIds.find(
          (productId) => !productRows.some((product) => product.id === productId),
        );

        if (missingProduct) {
          throw new Error(
            "Không thể kiểm tra trạng thái giao hàng hỏa tốc của sản phẩm trong giỏ hàng.",
          );
        }

        const nonExpressProduct = productRows.find(
          (product) => product.express_available !== true,
        );

        if (nonExpressProduct) {
          throw new Error(
            "Có sản phẩm trong giỏ hàng không hỗ trợ giao hàng hỏa tốc.",
          );
        }

        const categoryIds = [
          ...new Set(
            (productsData ?? [])
              .map((product) => product.category_id)
              .filter(Boolean)
          ),
        ];

        if (categoryIds.length === 0) {
          throw new Error(
            "Sản phẩm trong giỏ hàng chưa được gán danh mục vận chuyển."
          );
        }

        // 3. Lấy MIN/MAX mode của các category.
        const { data: categoriesData, error: categoriesError } =
          await supabase
            .from("categories")
            .select("id, shipping_fee_mode")
            .in("id", categoryIds);

        if (categoriesError) throw categoriesError;

        const hasMaxCategory = (categoriesData ?? []).some(
          (category) => category.shipping_fee_mode === "MAX"
        );

        const selectedMode = hasMaxCategory ? "MAX" : "MIN";

        // 4. Lấy rule tương ứng với zone + category.
        const { data: rulesData, error: rulesError } = await supabase
          .from("express_shipping_rules")
          .select("price, product_category_id, active")
          .eq("shipping_zone_id", zone.id)
          .eq("active", true)
          .in("product_category_id", categoryIds);

        if (rulesError) throw rulesError;

        const modeCategoryIds = new Set(
          (categoriesData ?? [])
            .filter(
              (category) => category.shipping_fee_mode === selectedMode
            )
            .map((category) => category.id)
        );

        const matchingRule = (rulesData ?? []).find((rule) =>
          modeCategoryIds.has(rule.product_category_id)
        );

        if (!matchingRule || matchingRule.price == null) {
          throw new Error(
            `Chưa có bảng giá hỏa tốc ${selectedMode} cho khu vực này.`
          );
        }

        if (!cancelled) {
          setExpressShipping(Number(matchingRule.price));
          setExpressError(null);
        }
      } catch (error) {
        console.error("EXPRESS SHIPPING ERROR:", error);

        if (!cancelled) {
          setExpressShipping(0);
          setExpressError(
            error instanceof Error
              ? error.message
              : "Không thể tính phí giao hàng hỏa tốc."
          );
        }
      } finally {
        if (!cancelled) {
          setExpressLoading(false);
        }
      }
    }

    void calculateExpressShipping();

    return () => {
      cancelled = true;
    };
  }, [cityValue, districtValue, wardValue, items.map((item) => item.id).join(",")]);

  useEffect(() => {
    if (shippingMethod === "express" && expressShipping <= 0) {
      setShippingMethod("standard");
    }
  }, [expressShipping, shippingMethod]);

  const shippingFee =
    shippingMethod === "express" ? expressShipping : baseShipping;

  const districts = getDistricts(cityValue);

const wards = districtValue
  ? getWards(cityValue, districtValue).filter(
      (ward) =>
        ward &&
        typeof ward === "object" &&
        ward.Name &&
        ward.Name !== districtValue
    )
  : [];
  const [voucherSummary, setVoucherSummary] =
    useState<VoucherSummary>({
      discountVoucher: null,
      shippingVoucher: null,
      discountAmount: 0,
      shippingDiscount: 0,
      shipping: shippingFee,
      totalDiscount: 0,
    });

  const shipping = shippingFee;

  const discountVoucher = voucherSummary.discountVoucher;
  const shippingVoucher = voucherSummary.shippingVoucher;

  const total =
    subtotal +
    shippingFee -
    voucherSummary.discountAmount -
    voucherSummary.shippingDiscount;

  const PAYPAL_VND_PER_USD = 26000;
  const paypalAmountUSD = Number(
    (Math.max(0, total) / PAYPAL_VND_PER_USD).toFixed(2),
  );

  useEffect(() => {
    if (items.length === 0) return;

    trackInitiateCheckout(
      subtotal,
      items.reduce((sum, item) => sum + item.quantity, 0)
    );
  }, []);

  if (count === 0) {
    return (
      <div className="min-h-screen bg-[#F7F7F3] text-[#252820]">
        <div className="mx-auto max-w-[1180px] px-4 py-20 text-center">
          <ShoppingBag className="mx-auto h-9 w-9 text-[#8B8E84]" strokeWidth={1.5} />
          <p className="mt-5 font-display text-3xl text-[#252820]">Giỏ hàng trống</p>
          <p className="mt-2 text-sm text-[#777B72]">Hãy thêm sản phẩm trước khi thanh toán.</p>
          <Link
            to="/shop"
            className="mt-6 inline-flex h-11 items-center rounded-xl bg-[#111111] px-6 text-sm font-semibold text-white transition hover:bg-[#222222]"
          >
            Đến cửa hàng
          </Link>
        </div>
      </div>
    );
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
  
    const fd = new FormData(e.currentTarget);
    const parsed = schema.safeParse(Object.fromEntries(fd));
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setSubmitting(true);

    console.log({
  cityValue,
  districtValue,
  wardValue,
});
    
const payload = {
  status: "pending",

  // Thông tin khách hàng
  ...parsed.data,

  payment_method: paymentMethod,

  payment_status: paymentMethod === "paypal" || paymentMethod === "card" ? "paid" : "pending",

  district: districtValue,

   ward: wardValue,

  // Tiền hàng
  subtotal,

  // Ship
  shipping_method: shippingMethod,
  shipping_fee: shippingFee,
  shipping_discount: voucherSummary.shippingDiscount,

// ===== Voucher =====

discount_amount:
  voucherSummary.discountAmount,

discount_voucher_code:
  discountVoucher?.code ?? null,

discount_voucher_name:
  discountVoucher?.title ?? null,

shipping_voucher_code:
  shippingVoucher?.code ?? null,

shipping_voucher_name:
  shippingVoucher?.title ?? null,

shipping_voucher_value:
  voucherSummary.shippingVoucher?.value ?? 0,

  // Tổng tiền
  total,
};

console.log("===== ORDER PAYLOAD =====");
console.log(payload);
console.table(payload);



let result: any = null;
let order: any = null;

try {
  result = await supabase
    .from("orders")
    .insert(payload)
    .select("*");

  console.log("FULL RESULT =", result);

  if (result.error) {
    throw result.error;
  }

  order = result.data?.[0];

  if (!order) {
    throw new Error("Order not created");
  }

  console.log("ORDER =", order);

} catch (e) {
  console.error("CATCH =", e);
  alert(JSON.stringify(e, null, 2));
  setSubmitting(false);
  return;
}


console.log("Items before insert:", items);

console.log("CART ITEMS", JSON.stringify(items, null, 2));

const orderItemsPayload = items.map((i) => ({
  order_id: order.id,
  product_id: i.id,
  product_name: i.name,
  product_image: i.image,

  product_color_id: i.productColorId,
  color_name: i.colorName,
  color_hex: i.colorHex,

  unit_price: i.price,
  quantity: i.quantity,
}));

console.log("ORDER ITEMS PAYLOAD", orderItemsPayload);

const { data: insertedItems, error: itemsError } = await supabase
  .from("order_items")
  .insert(orderItemsPayload)
  .select();

if (itemsError) {
  console.error("ORDER ITEMS ERROR", itemsError);
  alert(itemsError.message);
  setSubmitting(false);
  return;
}

console.log(
  "INSERTED ITEMS",
  JSON.stringify(insertedItems, null, 2)
);

// ===== Background tasks =====
// Đơn đã được tạo thành công nên không bắt khách hàng chờ email/voucher.
void (async () => {
  // ===== Send Order Confirmation Email =====
  try {
    const { data: emailResult, error: emailError } =
      await supabase.functions.invoke("send-order-confirmation", {
        body: {
          order_id: order.id,
        },
      });

    if (emailError) {
      console.error("ORDER CONFIRMATION EMAIL ERROR:", emailError);
    } else {
      console.log(
        "ORDER CONFIRMATION EMAIL SENT:",
        emailResult,
      );
    }
  } catch (emailException) {
    console.error(
      "ORDER CONFIRMATION EMAIL EXCEPTION:",
      emailException,
    );
  }

  // ===== Voucher Usage =====
  const voucherUsages = [];

  if (discountVoucher) {
    voucherUsages.push({
      voucher_id: discountVoucher.id,
      voucher_code: discountVoucher.code,
      order_id: order.id,
      customer_name: parsed.data.full_name,
      phone: parsed.data.phone,
      discount_amount: voucherSummary.discountAmount,
      shipping_discount: 0,
      subtotal,
      status: "used",
      used_at: new Date().toISOString(),
    });
  }

  if (shippingVoucher) {
    voucherUsages.push({
      voucher_id: shippingVoucher.id,
      voucher_code: shippingVoucher.code,
      order_id: order.id,
      customer_name: parsed.data.full_name,
      phone: parsed.data.phone,
      discount_amount: 0,
      shipping_discount: voucherSummary.shippingDiscount,
      subtotal,
      status: "used",
      used_at: new Date().toISOString(),
    });
  }

  if (voucherUsages.length > 0) {
    const { error } = await supabase
      .from("voucher_usage")
      .insert(voucherUsages);

    if (error) {
      console.error("VOUCHER USAGE ERROR", error);
    }
  }

  // ===== Increase Voucher Used =====
  const vouchersToUpdate = [
    discountVoucher,
    shippingVoucher,
  ].filter(Boolean);

  if (vouchersToUpdate.length > 0) {
    await Promise.all(
      vouchersToUpdate.map(async (voucher) => {
        const { error } = await supabase
          .from("vouchers")
          .update({
            used: (voucher!.used ?? 0) + 1,
          })
          .eq("id", voucher!.id);

        if (error) {
          console.error("VOUCHER UPDATE ERROR", error);
        }
      })
    );
  }
})();

const orderSuccess = {
  id: order.id,
  created_at: new Date().toISOString(),

  full_name: parsed.data.full_name,
  phone: parsed.data.phone,
  email: parsed.data.email,

  address: parsed.data.address,

  ward: wardValue,

  district: districtValue,

  city: parsed.data.city,

  payment_method: paymentMethod,

  subtotal,
  shippingMethod,
  shipping: shippingFee,

  total,

discountVoucher:
  discountVoucher,

shippingVoucher:
  shippingVoucher,

discountAmount:
  voucherSummary.discountAmount,

shippingDiscount:
  voucherSummary.shippingDiscount,

  items: insertedItems ?? [],
};

localStorage.setItem(
  "olive_last_order",
  JSON.stringify(orderSuccess)
);

trackPurchase(
  order.id,
  total
);

clear();

setSubmitting(false);

navigate({
  to: "/order-success",
});

return;

  }

  return (
    <div className="min-h-screen bg-[#F7F7F3] text-[#252820]">
      <div className="mx-auto w-full max-w-[980px] px-3.5 pb-12 pt-4 sm:px-6 sm:pb-16 sm:pt-7 lg:px-8">
        {/* HEADER */}
        <header className="mb-5 sm:mb-7">
          <Link
            to="/"
            className="inline-flex items-center text-[10px] font-semibold uppercase tracking-[0.22em] text-[#667653] transition hover:opacity-70"
          >
            OLIVE LIVING
          </Link>

          <div className="mt-4 sm:mt-5">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.24em] text-[#92958D]">
                  CHECKOUT
                </p>
                <h1 className="mt-1 text-[28px] font-semibold leading-none tracking-[-0.03em] text-[#22251F] sm:text-[34px]">
                  Thanh toán
                </h1>
                <p className="mt-2 max-w-xl text-[11px] leading-5 text-[#777B72] sm:text-[12px]">
                  Hoàn tất thông tin để Olive Living chuẩn bị và giao đơn hàng đến bạn.
                </p>
              </div>
            </div>
          </div>

          {/* STEPS */}
          <div className="mt-5 flex items-center rounded-xl border border-[#E2E3DE] bg-white px-3 py-2.5 sm:mt-6 sm:px-4">
            <Step number="1" label="Giỏ hàng" active />
            <div className="mx-2 h-px flex-1 bg-[#DCDDD7] sm:mx-4" />
            <Step number="2" label="Thông tin" active />
            <div className="mx-2 h-px flex-1 bg-[#DCDDD7] sm:mx-4" />
            <Step number="3" label="Hoàn tất" />
          </div>
        </header>

        <form onSubmit={onSubmit} className="space-y-3.5 sm:space-y-4">
          <input type="hidden" name="payment_method" value={paymentMethod} />

          {/* =========================================================
              EXPRESS CHECKOUT
              2 lựa chọn nhanh trước Order Summary.
          ========================================================== */}
          <section className="overflow-hidden rounded-2xl border border-[#DCDDD7] bg-white">
            <div className="px-4 py-3.5 sm:px-5">
              <div className="mb-2.5 flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#8A8D84]">
                    EXPRESS CHECKOUT
                  </p>
                  <p className="mt-0.5 text-[12px] font-medium text-[#33352F]">
                    Thanh toán nhanh
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPolicyOpen("payment")}
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#E1E2DC] bg-white px-2.5 text-[9px] font-medium text-[#555853] transition hover:border-[#BFC2B8] hover:bg-[#F8F8F5]"
                  >
                    <span className="flex h-4 w-4 items-center justify-center rounded-full border border-[#BFC1BA] text-[9px] font-semibold">?</span>
                    Hướng dẫn thanh toán
                  </button>
                  <ShieldCheck className="h-4 w-4 text-[#A0A39B]" strokeWidth={1.7} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 lg:grid-cols-3">
                <div className="col-span-2 min-w-0 overflow-visible rounded-xl lg:col-span-1">

                  <PayPalScriptProvider options={paypalOptions}>
  <PayPalButtons
    fundingSource={FUNDING.PAYPAL}

    style={{
      layout: "horizontal",
      color: "gold",
      shape: "rect",
      label: "paypal",
      height: 44,
    }}

    disabled={submitting}

    createOrder={async () => {
      console.log("===== PAYPAL CREATE ORDER START =====");

      setPaymentMethod("paypal");

      console.log("PAYPAL AMOUNT USD:", paypalAmountUSD);

      try {
        const {
          data,
          error,
        } = await supabase.functions.invoke(
          "paypal-create-order",
          {
            body: {
              amount: paypalAmountUSD,
              currency: "USD",
            },
          },
        );

        console.log(
          "PAYPAL CREATE ORDER DATA:",
          data,
        );

        console.log(
          "PAYPAL CREATE ORDER ERROR:",
          error,
        );

        // Supabase function lỗi
        if (error) {
          throw new Error(
            error.message ||
              "Supabase Edge Function paypal-create-order bị lỗi.",
          );
        }

        // Edge Function trả về lỗi
        if (!data?.success) {
          console.error(
            "PAYPAL CREATE ORDER FUNCTION RESPONSE:",
            data,
          );

          throw new Error(
            data?.error ||
              "PayPal Create Order thất bại.",
          );
        }

        // Không có Order ID
        if (!data?.orderId) {
          console.error(
            "PAYPAL ORDER ID MISSING:",
            data,
          );

          throw new Error(
            "PayPal không trả về Order ID.",
          );
        }

        console.log(
          "PAYPAL ORDER CREATED SUCCESSFULLY:",
          data.orderId,
        );

        console.log(
          "PAYPAL ORDER STATUS:",
          data.status,
        );

        console.log(
          "PAYPAL ORDER AMOUNT:",
          data.amount,
          data.currency,
        );

        return data.orderId;
      } catch (error) {
        console.error(
          "===== PAYPAL CREATE ORDER FAILED =====",
          error,
        );

        throw error instanceof Error
          ? error
          : new Error(
              "Không thể tạo đơn PayPal.",
            );
      }
    }}

    onApprove={async (data) => {
      console.log(
        "===== PAYPAL APPROVED =====",
      );

      console.log(
        "PAYPAL ORDER ID:",
        data.orderID,
      );

      try {
        setSubmitting(true);

        const {
          data: captureData,
          error,
        } =
          await supabase.functions.invoke(
            "paypal-capture-order",
            {
              body: {
                orderId: data.orderID,
              },
            },
          );

        console.log(
          "PAYPAL CAPTURE DATA:",
          captureData,
        );

        console.log(
          "PAYPAL CAPTURE ERROR:",
          error,
        );

        if (error) {
          throw new Error(
            error.message ||
              "Không thể xác nhận thanh toán PayPal.",
          );
        }

        if (
          !captureData?.success
        ) {
          console.error(
            "PAYPAL CAPTURE FUNCTION RESPONSE:",
            captureData,
          );

          throw new Error(
            captureData?.error ||
              "PayPal Capture thất bại.",
          );
        }

        if (
          captureData?.status !==
          "COMPLETED"
        ) {
          console.error(
            "PAYPAL PAYMENT STATUS:",
            captureData?.status,
          );

          throw new Error(
            `Thanh toán PayPal chưa hoàn tất. Trạng thái: ${
              captureData?.status ||
              "UNKNOWN"
            }`,
          );
        }

        console.log(
          "===== PAYPAL PAYMENT COMPLETED =====",
        );

        console.log(
          "PAYPAL CAPTURE ID:",
          captureData?.captureId,
        );

        /*
         * Thanh toán PayPal thành công.
         * Tiếp tục submit form để tạo order trong Supabase.
         */
        const form =
          document.querySelector("form");

        if (form) {
          form.requestSubmit();
        } else {
          throw new Error(
            "Không tìm thấy checkout form.",
          );
        }
      } catch (error) {
        console.error(
          "===== PAYPAL PAYMENT FAILED =====",
          error,
        );

        alert(
          error instanceof Error
            ? error.message
            : "Thanh toán PayPal thất bại.",
        );

        setSubmitting(false);
      }
    }}

    onError={(error) => {
      console.error(
        "===== PAYPAL BUTTON ERROR =====",
        error,
      );

      alert(
        "PayPal xảy ra lỗi. Hãy mở Console để xem chi tiết.",
      );

      setSubmitting(false);
    }}

    onCancel={(data) => {
      console.log(
        "PAYPAL PAYMENT CANCELLED:",
        data,
      );

      setSubmitting(false);
    }}
  />
</PayPalScriptProvider>

                </div>

                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethod("cod");
                  }}
                  className={cn(
                    "flex h-11 min-w-0 items-center justify-center gap-2 rounded-xl border px-3 text-[11px] font-semibold transition whitespace-nowrap",
                    paymentMethod === "cod"
                      ? "border-[#FF4D00] bg-[#FFF4EF] text-[#D94100] ring-1 ring-[#FF4D00]/10"
                      : "border-[#E5E5E0] bg-white text-[#333333] hover:border-[#FFB49A] hover:bg-[#FFF8F5]"
                  )}
                >
                  <Truck className="h-4 w-4" strokeWidth={1.8} />
                  COD
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethod("transfer");
                  }}
                  className={cn(
                    "flex h-11 min-w-0 items-center justify-center gap-1.5 rounded-xl border px-2 text-[10px] font-semibold transition whitespace-nowrap sm:gap-2 sm:px-3 sm:text-[11px]",
                    paymentMethod === "transfer"
                      ? "border-[#2563EB] bg-[#EFF6FF] text-[#2563EB] ring-1 ring-[#2563EB]/10"
                      : "border-[#DCE7F8] bg-white text-[#333333] hover:border-[#93B8F2] hover:bg-[#F7FAFF]"
                  )}
                >
                  <Building2 className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" strokeWidth={1.8} />
                  <span className="truncate">Chuyển khoản</span>
                </button>
              </div>

              <p className="mt-2 text-center text-[8.5px] leading-4 text-[#999C95]">
                Chọn nhanh PayPal, COD hoặc chuyển khoản ngân hàng. Hướng dẫn thanh toán có sẵn ở phía trên.
              </p>
            </div>
          </section>

          {/* =========================================================
              BANK TRANSFER DETAILS
              Hiển thị lại ngay khi khách chọn Chuyển khoản.
          ========================================================== */}
          {paymentMethod === "transfer" && (
            <section
              id="checkout-bank-transfer"
              className="overflow-hidden rounded-2xl border border-[#CFE2FF] bg-white"
            >
              <div className="border-b border-[#E4ECF8] bg-[#F7FAFF] px-4 py-3.5 sm:px-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#EAF3FF] text-[#2563EB]">
                      <Building2 className="h-4 w-4" strokeWidth={1.8} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#7A8494]">
                        BANK TRANSFER
                      </p>
                      <p className="mt-0.5 text-[13px] font-semibold text-[#222222]">
                        Thông tin chuyển khoản
                      </p>
                    </div>
                  </div>
                  <span className="shrink-0 rounded-full bg-white px-2 py-1 text-[8px] font-semibold uppercase tracking-[0.08em] text-[#2563EB] ring-1 ring-[#D7E5FA]">
                    QR Banking
                  </span>
                </div>
              </div>

              <div className="grid gap-4 p-4 sm:grid-cols-[minmax(0,1fr)_170px] sm:p-5">
                <div className="min-w-0">
                  <div className="rounded-xl border border-[#E1E6EE] bg-[#FAFBFD] p-3.5">
                    <div className="space-y-2 text-[10.5px] leading-4 text-[#666A63]">
                      <div className="flex items-start justify-between gap-4">
                        <span>Ngân hàng</span>
                        <span className="text-right font-semibold text-[#222222]">ACB Bank</span>
                      </div>
                      <div className="flex items-start justify-between gap-4">
                        <span>Chủ tài khoản</span>
                        <span className="text-right font-semibold text-[#222222]">NGUYEN THI BICH HUYEN</span>
                      </div>
                      <div className="flex items-start justify-between gap-4">
                        <span>Số tài khoản</span>
                        <span className="text-right font-semibold tracking-[0.04em] text-[#222222]">27775487</span>
                      </div>
                      <div className="border-t border-[#E5E7EB] pt-2">
                        <div className="flex items-start justify-between gap-4">
                          <span>Nội dung chuyển khoản</span>
                          <span className="text-right font-semibold text-[#2563EB]">OLIVE-{Math.floor(total)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-2.5 rounded-xl bg-[#F4F5F7] px-3.5 py-2.5">
                    <p className="text-[9.5px] leading-4 text-[#666A63]">
                      Vui lòng chuyển đúng số tiền và ghi đúng nội dung để Olive Living đối soát đơn hàng nhanh hơn.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center rounded-xl border border-[#E1E6EE] bg-white p-3">
                  <p className="mb-2 text-[8px] font-semibold uppercase tracking-[0.14em] text-[#8B8E84]">
                    Quét mã để thanh toán
                  </p>
                  <div className="w-full max-w-[150px] overflow-hidden rounded-lg border border-[#E1E6EE] bg-white p-1.5">
                    <img
                      src="/qr-bank.png"
                      alt="QR chuyển khoản ngân hàng Olive Living"
                      className="block aspect-square h-auto w-full object-contain"
                    />
                  </div>
                  <p className="mt-2 text-center text-[8.5px] leading-4 text-[#8A8D84]">
                    Sau khi chuyển khoản, Olive Living sẽ kiểm tra và xác nhận đơn hàng.
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* =========================================================
              01 — ORDER SUMMARY
              Có thể thu gọn / xem đầy đủ để checkout gọn hơn trên mobile.
          ========================================================== */}
          <section className="overflow-hidden rounded-2xl border border-[#DCDDD7] bg-white">
            <button
              type="button"
              onClick={() => setSummaryOpen((v) => !v)}
              aria-expanded={summaryOpen}
              className="flex w-full items-center justify-between gap-4 px-4 py-3.5 text-left transition hover:bg-[#FAFAF8] sm:px-5"
            >
              <div className="min-w-0">
                <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#8A8D84]">
                  ORDER SUMMARY
                </p>
                <p className="mt-0.5 text-[14px] font-semibold tracking-[-0.02em] text-[#22251F]">
                  Tóm tắt đơn hàng
                </p>
                {!summaryOpen && (
                  <p className="mt-0.5 text-[9px] text-[#999C95]">
                    {count} sản phẩm · Nhấn để xem chi tiết
                  </p>
                )}
              </div>

              <div className="flex shrink-0 items-center gap-2.5">
                <div className="text-right">
                  <p className="text-[8.5px] text-[#999C95]">{count} sản phẩm</p>
                  <p className="mt-0.5 text-[18px] font-bold tracking-[-0.03em] text-[#111111] sm:text-[20px]">
                    {formatVND(total)}
                  </p>
                </div>
                {summaryOpen ? (
                  <ChevronUp className="h-4 w-4 text-[#555853]" strokeWidth={1.7} />
                ) : (
                  <ChevronDown className="h-4 w-4 text-[#555853]" strokeWidth={1.7} />
                )}
              </div>
            </button>

            {summaryOpen && (
              <div className="border-t border-[#ECECE7] px-4 py-4 sm:px-6 sm:py-5">
                <div className="space-y-3">
                  {items.map((i) => (
                    <div key={i.id} className="flex items-center gap-3">
                      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-[#E1E1DC] bg-[#F5F4EF] sm:h-16 sm:w-16">
                        {i.image && (
                          <img src={i.image} alt={i.name} className="h-full w-full object-cover" />
                        )}
                        <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#111111] px-1 text-[8px] font-semibold text-white">
                          {i.quantity}
                        </span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-[12px] font-semibold leading-4 text-[#30342C] sm:text-[13px]">
                          {i.name}
                        </p>
                        {i.colorName && (
                          <p className="mt-1 text-[9px] text-[#8A8D84]">{i.colorName}</p>
                        )}
                        <p className="mt-1 text-[9px] text-[#A0A39B]">
                          {i.quantity} × {formatVND(i.price)}
                        </p>
                      </div>

                      <p className="shrink-0 text-[11px] font-semibold text-[#222222] sm:text-[12px]">
                        {formatVND(i.price * i.quantity)}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 border-t border-[#ECECE7] pt-3.5">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[#777B72]">Tạm tính</span>
                      <span className="font-medium text-[#333333]">{formatVND(subtotal)}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[#777B72]">Phí vận chuyển</span>
                      <span className="font-medium text-[#333333]">
                        {shippingFee > 0 ? formatVND(shippingFee) : "Miễn phí"}
                      </span>
                    </div>
                    {voucherSummary.totalDiscount > 0 && (
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-[#777B72]">Ưu đãi</span>
                        <span className="font-medium text-[#667653]">
                          -{formatVND(voucherSummary.totalDiscount)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 flex items-end justify-between border-t border-[#ECECE7] pt-3">
                    <div>
                      <p className="text-[12px] font-semibold text-[#22251F]">Tổng thanh toán</p>
                      <p className="mt-0.5 text-[9px] text-[#999C95]">Đã bao gồm các ưu đãi hiện có</p>
                    </div>
                    <p className="text-[22px] font-bold tracking-[-0.03em] text-[#111111]">
                      {formatVND(total)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* =========================================================
              02 — VOUCHER
              Tạm thời ẩn UI voucher theo yêu cầu.
              Logic voucher trong onSubmit vẫn được giữ nguyên để có thể bật lại sau.
          ========================================================== */}

          {/* =========================================================
              03 — CONTACT
          ========================================================== */}
          <section className="rounded-2xl border border-[#DCDDD7] bg-white p-4 sm:p-6">
            <SectionTitle
              icon={<UserRound className="h-4 w-4" strokeWidth={1.7} />}
              eyebrow="01 · CONTACT"
              title="Thông tin liên hệ"
              description="Thông tin để xác nhận đơn hàng và gửi cập nhật giao hàng."
            />
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Field name="full_name" label="Họ và tên" required />
              <label className="block">
                <span className="mb-1 block text-[10px] font-medium text-[#666666]">Số điện thoại *</span>
                <input
                  name="phone"
                  required
                  value={phoneValue}
                  onChange={(e) => setPhoneValue(e.target.value)}
                  inputMode="tel"
                  placeholder="090 123 4567"
                  className="h-10 w-full rounded-xl border border-[#DCDDD7] bg-white px-3 text-[11px] text-[#222222] outline-none transition focus:border-[#8A8A8A] focus:ring-2 focus:ring-[#667653]/10 placeholder:text-[#AAAAAA]"
                />
              </label>
              <div className="sm:col-span-2">
                <Field name="email" label="Email" defaultValue="" />
              </div>
            </div>
          </section>

          {/* =========================================================
              04 — DELIVERY
          ========================================================== */}
          <section className="rounded-2xl border border-[#DCDDD7] bg-white p-4 sm:p-6">
            <SectionTitle
              icon={<MapPin className="h-4 w-4" strokeWidth={1.7} />}
              eyebrow="02 · DELIVERY"
              title="Địa chỉ nhận hàng"
              description="Nhập địa chỉ tại Việt Nam để Olive Living tính phí vận chuyển phù hợp."
            />

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Field name="address" label="Địa chỉ / Số nhà / Tên đường" required />
              </div>

              <label className="block">
                <span className="mb-1 block text-[10px] font-medium text-[#666666]">Tỉnh / Thành phố *</span>
                <Popover open={cityOpen} onOpenChange={setCityOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      className="h-10 w-full justify-between rounded-xl border-[#DCDDD7] bg-white px-3 text-[11px] font-normal text-[#444444]"
                    >
                      {cityValue || "Chọn tỉnh / thành phố"}
                      <ChevronsUpDown className="h-3.5 w-3.5 opacity-40" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] p-0">
                    <Command>
                      <CommandInput placeholder="Tìm tỉnh / thành..." />
                      <CommandList className="max-h-72">
                        <CommandEmpty>Không tìm thấy.</CommandEmpty>
                        <CommandGroup>
                          {provinces.map((city) => (
                            <CommandItem
                              key={city.Id}
                              value={city.Name}
                              onSelect={() => {
                                setCityValue(city.Name);
                                setDistrictValue("");
                                setWardValue("");
                                setCityOpen(false);
                              }}
                            >
                              <Check className={cn("mr-2 h-4 w-4", cityValue === city.Name ? "opacity-100" : "opacity-0")} />
                              {city.Name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <input type="hidden" name="city" value={cityValue} />
              </label>

              <label className="block">
                <span className="mb-1 block text-[10px] font-medium text-[#666666]">Quận / Huyện *</span>
                <Popover open={districtOpen} onOpenChange={setDistrictOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      className="h-10 w-full justify-between rounded-xl border-[#DCDDD7] bg-white px-3 text-[11px] font-normal text-[#444444]"
                      onClick={() => {
                        if (!cityValue) {
                          toast.error("Vui lòng chọn Tỉnh / Thành phố trước.");
                          return;
                        }
                        setDistrictOpen(true);
                      }}
                    >
                      {districtValue || "Chọn quận / huyện"}
                      <ChevronsUpDown className="h-3.5 w-3.5 opacity-40" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] p-0">
                    <Command>
                      <CommandInput placeholder="Tìm quận / huyện..." />
                      <CommandList className="max-h-72">
                        <CommandEmpty>Không tìm thấy.</CommandEmpty>
                        <CommandGroup>
                          {districts.map((district) => (
                            <CommandItem
                              key={district.Name}
                              value={district.Name}
                              onSelect={() => {
                                setDistrictValue(district.Name);
                                setWardValue("");
                                setDistrictOpen(false);
                              }}
                            >
                              <Check className={cn("mr-2 h-4 w-4", districtValue === district.Name ? "opacity-100" : "opacity-0")} />
                              {district.Name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <input type="hidden" name="district" value={districtValue} />
              </label>

              <label className="block">
                <span className="mb-1 block text-[10px] font-medium text-[#666666]">Phường / Xã</span>
                <Popover open={wardOpen} onOpenChange={setWardOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={!districtValue}
                      className="h-10 w-full justify-between rounded-xl border-[#DCDDD7] bg-white px-3 text-[11px] font-normal text-[#444444]"
                    >
                      {wardValue || "Chọn phường / xã"}
                      <ChevronsUpDown className="h-3.5 w-3.5 opacity-40" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] p-0">
                    <Command>
                      <CommandInput placeholder="Tìm phường / xã..." />
                      <CommandList className="max-h-72">
                        <CommandEmpty>Không tìm thấy.</CommandEmpty>
                        <CommandGroup>
                          {wards.map((ward) => (
                            <CommandItem
                              key={ward.Id}
                              value={ward.Name}
                              onSelect={() => {
                                setWardValue(ward.Name);
                                setWardOpen(false);
                              }}
                            >
                              <Check className={cn("mr-2 h-4 w-4", wardValue === ward.Name ? "opacity-100" : "opacity-0")} />
                              {ward.Name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <input type="hidden" name="ward" value={wardValue} />
              </label>

              <div className="sm:col-span-2">
                <Field name="notes" label="Ghi chú đơn hàng (tuỳ chọn)" textarea />
              </div>
            </div>
          </section>

          {/* =========================================================
              05 — SHIPPING
          ========================================================== */}
          <section className="rounded-2xl border border-[#DCDDD7] bg-white p-4 sm:p-6">
            <SectionTitle
              icon={<Truck className="h-4 w-4" strokeWidth={1.7} />}
              eyebrow="03 · SHIPPING"
              title="Phương thức vận chuyển"
              description="Chọn hình thức giao hàng phù hợp với khu vực của bạn."
            />

            <div className="mt-4 overflow-hidden rounded-xl border border-[#DCDDD7]">
              <ShippingMethodOption
                selected={shippingMethod === "standard"}
                onClick={() => setShippingMethod("standard")}
                title="Giao hàng tiêu chuẩn"
                description="Phí tính theo khu vực · Thời gian giao dự kiến 2–5 ngày"
                price={baseShipping > 0 ? formatVND(baseShipping) : "Miễn phí"}
                badge={baseShipping === 0 ? "FREESHIP" : undefined}
              />
              <ShippingMethodOption
                selected={shippingMethod === "express"}
                onClick={() => {
                  if (expressShipping > 0 && !expressLoading && !expressError) {
                    setShippingMethod("express");
                  }
                }}
                title="Giao hàng hỏa tốc"
                description={
                  expressLoading
                    ? "Đang tính phí theo khu vực và sản phẩm..."
                    : expressError
                      ? expressError
                      : "Phí tự động theo khu vực và nhóm sản phẩm"
                }
                price={
                  expressLoading
                    ? "Đang tính..."
                    : expressShipping > 0
                      ? formatVND(expressShipping)
                      : "Chưa hỗ trợ"
                }
                badge={expressShipping > 0 ? "EXPRESS" : undefined}
                bordered
                disabled={expressLoading || expressShipping <= 0 || Boolean(expressError)}
              />
            </div>

            <div className="mt-3 flex items-start gap-2 rounded-xl bg-[#F5F6F2] px-3.5 py-3">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#667653]" strokeWidth={1.8} />
              <p className="text-[9.5px] leading-4 text-[#70746B]">
                Phí hỏa tốc được tính tự động theo khu vực nhận hàng và nhóm sản phẩm.
                
              </p>
            </div>
          </section>

          {/* =========================================================
              07 — REVIEW & CONFIRM
              Nằm ngay dưới Shipping. Order Summary phía trên giữ nguyên.
              Có thể thu gọn / Show all.
          ========================================================== */}
          <section id="checkout-confirm" className="overflow-hidden rounded-2xl border border-[#DCDDD7] bg-white">
            <button
              type="button"
              onClick={() => setReviewOpen((v) => !v)}
              aria-expanded={reviewOpen}
              className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left transition hover:bg-[#FAFAF8] sm:px-6"
            >
              <div className="min-w-0">
                <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#8B8E84]">
                  REVIEW & CONFIRM
                </p>
                <p className="mt-1 text-[13px] font-semibold text-[#292C25]">
                  Kiểm tra & xác nhận đơn hàng
                </p>
                {!reviewOpen && (
                  <p className="mt-1 text-[9px] text-[#999C95]">
                    {count} sản phẩm · {voucherSummary.totalDiscount > 0
                      ? `Đang áp dụng ưu đãi · Tiết kiệm ${formatVND(voucherSummary.totalDiscount)}`
                      : "Kiểm tra sản phẩm và thanh toán"}
                  </p>
                )}
              </div>

              <div className="flex shrink-0 items-center gap-2.5">
                <div className="text-right">
                  <p className="text-[8.5px] text-[#999C95]">
                    {count} sản phẩm
                  </p>
                  <p className="mt-0.5 text-[20px] font-bold tracking-[-0.03em] text-[#111111] sm:text-[24px]">
                    {formatVND(total)}
                  </p>
                </div>
                {reviewOpen ? (
                  <ChevronUp className="h-4 w-4 text-[#555853]" strokeWidth={1.7} />
                ) : (
                  <ChevronDown className="h-4 w-4 text-[#555853]" strokeWidth={1.7} />
                )}
              </div>
            </button>

            {reviewOpen && (
              <div className="border-t border-[#ECECE7] px-4 py-3.5 sm:px-5 sm:py-4">
                {/* PRODUCTS — compact */}
                <div className="space-y-2.5">
                  {items.map((i) => (
                    <div key={i.id} className="flex items-center gap-2.5">
                      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-[#E5E5E0] bg-[#F5F4EF]">
                        {i.image ? (
                          <img
                            src={i.image}
                            alt={i.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[8px] text-[#A0A39B]">
                            —
                          </div>
                        )}
                        <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#111111] px-1 text-[7px] font-semibold text-white">
                          {i.quantity}
                        </span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-1 text-[11px] font-semibold leading-4 text-[#30342C]">
                          {i.name}
                        </p>
                        <p className="mt-0.5 text-[8.5px] text-[#999C95]">
                          {i.colorName ? `${i.colorName} · ` : ""}{i.quantity} × {formatVND(i.price)}
                        </p>
                      </div>

                      <p className="shrink-0 text-[10px] font-semibold text-[#222222]">
                        {formatVND(i.price * i.quantity)}
                      </p>
                    </div>
                  ))}
                </div>

                {/* VOUCHER — keep existing voucher engine, but remove extra wrapper/header */}
                <div
                  id="checkout-review-voucher"
                  className="mt-3 border-t border-[#ECECE7] pt-3"
                >
                  <CheckoutVoucher
                    subtotal={subtotal}
                    shippingFee={shippingFee}
                    shippingMethod={shippingMethod}
                    phone={phoneValue}
                    cartItems={items}
                    onChange={setVoucherSummary}
                  />
                </div>

                {/* CTA */}
                {paymentMethod !== "paypal" && paymentMethod !== "card" ? (
                  <button
                    type="submit"
                    disabled={submitting}
                    className="mt-3 flex h-11 w-full items-center justify-center rounded-xl bg-[#111111] px-4 text-[10px] font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-[#222222] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting ? "Đang xử lý..." : "Xác nhận & đặt hàng"}
                    {!submitting && (
                      <ArrowRight className="ml-2 h-3.5 w-3.5" strokeWidth={1.8} />
                    )}
                  </button>
                ) : (
                  <div className="mt-3 rounded-lg bg-[#F5F6F2] px-3 py-2.5 text-center text-[8.5px] leading-4 text-[#777B72]">
                    Hoàn tất thanh toán online bằng PayPal ở phần trên.
                  </div>
                )}

                <div className="mt-2.5 flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 border-t border-[#ECECE7] pt-2.5">
                  <button
                    type="button"
                    onClick={() => setPolicyOpen("exchange")}
                    className="text-[8px] font-medium text-[#999B96] hover:text-[#333333]"
                  >
                    Đổi hàng
                  </button>
                  <span className="text-[8px] text-[#D5D5D1]">•</span>
                  <button
                    type="button"
                    onClick={() => setPolicyOpen("shipping")}
                    className="text-[8px] font-medium text-[#999B96] hover:text-[#333333]"
                  >
                    Giao hàng
                  </button>
                  <span className="text-[8px] text-[#D5D5D1]">•</span>
                  <button
                    type="button"
                    onClick={() => setPolicyOpen("contact")}
                    className="text-[8px] font-medium text-[#999B96] hover:text-[#333333]"
                  >
                    Liên hệ
                  </button>
                </div>
              </div>
            )}
          </section>


          {/* =========================================================
              08 — HELP
          ========================================================== */}
          <section className="overflow-hidden rounded-2xl border border-[#DCDDD7] bg-white">
            <div className="border-b border-[#ECECE7] px-4 py-4 sm:px-6">
              <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#8B8E84]">
                HELP & DELIVERY
              </p>
             
            </div>

            <div className="divide-y divide-[#ECECE7]">
              <button type="button" onClick={() => setPolicyOpen("shipping")} className="flex w-full items-center justify-between px-4 py-3.5 text-left sm:px-6">
                <span className="flex min-w-0 items-center gap-3 text-[11px] font-semibold text-[#30342C]">
                  <Clock3 className="h-4 w-4 shrink-0 text-[#8B9185]" strokeWidth={1.7} />
                  <span>Khi nào đơn hàng sẽ được giao?</span>
                </span>
                <ChevronDown className="h-4 w-4 shrink-0 text-[#888C82]" strokeWidth={1.6} />
              </button>
              <button type="button" onClick={() => setPolicyOpen("shipping_fee")} className="flex w-full items-center justify-between px-4 py-3.5 text-left sm:px-6">
                <span className="flex min-w-0 items-center gap-3 text-[11px] font-semibold text-[#30342C]">
                  <Truck className="h-4 w-4 shrink-0 text-[#8B9185]" strokeWidth={1.7} />
                  <span>Phí vận chuyển được tính như thế nào?</span>
                </span>
                <ChevronDown className="h-4 w-4 shrink-0 text-[#888C82]" strokeWidth={1.6} />
              </button>
              <button type="button" onClick={() => setPolicyOpen("exchange")} className="flex w-full items-center justify-between px-4 py-3.5 text-left sm:px-6">
                <span className="flex min-w-0 items-center gap-3 text-[11px] font-semibold text-[#30342C]">
                  <RefreshCcw className="h-4 w-4 shrink-0 text-[#8B9185]" strokeWidth={1.7} />
                  <span>Tôi có thể đổi / trả sản phẩm không?</span>
                </span>
                <ChevronDown className="h-4 w-4 shrink-0 text-[#888C82]" strokeWidth={1.6} />
              </button>
              <button type="button" onClick={() => setPolicyOpen("contact")} className="flex w-full items-center justify-between px-4 py-3.5 text-left sm:px-6">
                <span className="flex min-w-0 items-center gap-3 text-[11px] font-semibold text-[#30342C]">
                  <ShieldAlert className="h-4 w-4 shrink-0 text-[#8B9185]" strokeWidth={1.7} />
                  <span>Nếu sản phẩm có vấn đề thì sao?</span>
                </span>
                <ChevronDown className="h-4 w-4 shrink-0 text-[#888C82]" strokeWidth={1.6} />
              </button>
            </div>
          </section>

{policyOpen && (
            <div
              className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
              onClick={() => setPolicyOpen(null)}
            >
              <div
                role="dialog"
                aria-modal="true"
                className="flex max-h-[88vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="flex shrink-0 items-center justify-between border-b border-[#E8E8E4] px-5 py-4">
                  <div>
                    <p className="text-[8px] font-semibold uppercase tracking-[0.18em] text-[#999B96]">
                      OLIVE LIVING
                    </p>
                    <h3 className="mt-1 text-[16px] font-semibold text-[#222222]">
                      {policyOpen === "exchange"
                        ? "Chính sách đổi hàng"
                        : policyOpen === "shipping"
                          ? "Shipping"
                          : policyOpen === "shipping_fee"
                            ? "Phí vận chuyển"
                            : policyOpen === "contact"
                              ? "Contact Us"
                              : "Thanh toán"}
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={() => setPolicyOpen(null)}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F3F3F1] text-[#555555]"
                    aria-label="Đóng"
                  >
                    <span className="text-[18px] leading-none">×</span>
                  </button>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
                  {policyOpen === "exchange" && (
                    <div className="space-y-6">
                      <div>
                        <p className="text-[11px] leading-5 text-[#555853]">
                          Olive Living luôn mong muốn khách hàng nhận được sản phẩm
                          nội thất và đèn trang trí trong tình trạng hoàn hảo.
                        </p>
                        <p className="mt-2 text-[11px] leading-5 text-[#555853]">
                          Nếu sản phẩm gặp lỗi từ{" "}
                          <strong className="text-[#333333]">
                            nhà sản xuất hoặc trong quá trình vận chuyển
                          </strong>
                          , Olive Living sẽ hỗ trợ đổi sản phẩm theo chính sách
                          dưới đây.
                        </p>
                      </div>

                      <section>
                        <h4 className="text-[12px] font-semibold text-[#222222]">
                          1. Điều kiện đổi hàng
                        </h4>
                        <ul className="mt-2 space-y-2 text-[10.5px] leading-[1.6] text-[#5F625C]">
                          <li>• Sản phẩm bị <strong>lỗi kỹ thuật hoặc lỗi sản xuất</strong> từ nhà sản xuất.</li>
                          <li>• Sản phẩm bị <strong>bể, vỡ hoặc hư hỏng trong quá trình vận chuyển</strong>.</li>
                          <li>• Sản phẩm <strong>chưa qua sử dụng</strong>.</li>
                          <li>• Sản phẩm còn <strong>đầy đủ hộp, bao bì và phụ kiện</strong> đi kèm.</li>
                          <li>• Khách hàng thông báo khi phát hiện vấn đề và cung cấp hình ảnh/video để kiểm tra.</li>
                        </ul>
                      </section>

                      <section>
                        <h4 className="text-[12px] font-semibold text-[#222222]">
                          2. Các trường hợp không được hỗ trợ đổi hàng
                        </h4>
                        <ul className="mt-2 space-y-2 text-[10.5px] leading-[1.6] text-[#5F625C]">
                          <li>• Sản phẩm đã qua sử dụng và phát sinh hao mòn trong quá trình sử dụng.</li>
                          <li>• Sản phẩm bị bể, nứt, móp hoặc hư hỏng do tác động vật lý từ phía khách hàng.</li>
                          <li>• Hư hỏng do sử dụng, lắp đặt hoặc bảo quản không đúng hướng dẫn.</li>
                          <li>• Sản phẩm không còn đầy đủ hộp, bao bì hoặc phụ kiện trong trường hợp việc thiếu các thành phần này ảnh hưởng đến quá trình kiểm tra và đổi hàng.</li>
                        </ul>
                      </section>

                      <section>
                        <h4 className="text-[12px] font-semibold text-[#222222]">
                          3. Quy trình xử lý khi sản phẩm bị lỗi
                        </h4>
                        <p className="mt-2 text-[10.5px] leading-[1.6] text-[#5F625C]">
                          Khi nhận được sản phẩm có lỗi, khách hàng vui lòng{" "}
                          <strong>liên hệ Olive Living</strong> và cung cấp hình ảnh/video
                          tình trạng sản phẩm.
                        </p>
                        <div className="mt-3 rounded-xl bg-[#F4F5F2] p-3.5 text-[10px] font-semibold leading-5 text-[#3F483C]">
                          Khách hàng liên hệ → Olive xác nhận lỗi → Gửi sản phẩm mới → Bàn giao sản phẩm lỗi
                        </div>
                        <ul className="mt-3 space-y-2 text-[10.5px] leading-[1.6] text-[#5F625C]">
                          <li>• Olive Living sẽ <strong>gửi sản phẩm mới</strong> đến khách hàng.</li>
                          <li>• Khách hàng <strong>không phải chịu phí vận chuyển đổi hàng</strong>.</li>
                          <li>• Sản phẩm lỗi được bàn giao lại cho shipper/đơn vị vận chuyển theo hướng dẫn.</li>
                        </ul>
                      </section>

                      <section>
                        <h4 className="text-[12px] font-semibold text-[#222222]">
                          4. Trường hợp sản phẩm tạm hết hàng
                        </h4>
                        <p className="mt-2 text-[10.5px] leading-[1.6] text-[#5F625C]">
                          Nếu sản phẩm cần đổi không còn sẵn trong kho, Olive Living
                          sẽ tiến hành đặt hàng mới cho khách hàng.
                        </p>
                        <div className="mt-3 rounded-xl border border-[#E1E5DE] bg-[#F7F8F5] px-3.5 py-3">
                          <p className="text-[10px] font-semibold text-[#4F604E]">
                            Thời gian dự kiến: 07–10 ngày
                          </p>
                          <p className="mt-1 text-[9.5px] text-[#777B72]">
                            Tính từ thời điểm Olive Living xác nhận đổi hàng.
                          </p>
                        </div>
                        <p className="mt-2 text-[10.5px] leading-[1.6] text-[#5F625C]">
                          Sau khi sản phẩm mới về kho, Olive Living sẽ liên hệ và
                          sắp xếp giao hàng đến khách hàng.
                        </p>
                      </section>

                      <section>
                        <h4 className="text-[12px] font-semibold text-[#222222]">
                          5. Lưu ý
                        </h4>
                        <p className="mt-2 text-[10.5px] leading-[1.6] text-[#5F625C]">
                          Khách hàng nên <strong>kiểm tra tình trạng sản phẩm ngay khi nhận hàng</strong>,
                          đặc biệt đối với sản phẩm bằng kính, đèn và đồ nội thất.
                        </p>
                        <p className="mt-2 text-[10.5px] font-medium leading-[1.6] text-[#4F604E]">
                          Olive Living cam kết hỗ trợ khách hàng xử lý nhanh chóng
                          đối với các trường hợp lỗi thuộc trách nhiệm của nhà sản xuất
                          hoặc đơn vị vận chuyển.
                        </p>
                      </section>
                    </div>
                  )}

                  {policyOpen === "shipping" && (
                    <div className="space-y-6">
                      <p className="text-[11px] leading-5 text-[#555853]">
                        Olive Living sử dụng <strong>GHN (Giao Hàng Nhanh)</strong>
                        {" "}làm đơn vị vận chuyển cho các đơn hàng.
                      </p>

                      <section>
                        <h4 className="text-[12px] font-semibold text-[#222222]">
                          Thời gian giao hàng dự kiến
                        </h4>
                        <div className="mt-3 space-y-2">
                          <div className="flex items-center justify-between rounded-lg bg-[#F5F6F3] px-3 py-2.5">
                            <span className="text-[10.5px] text-[#555853]">Nội thành Hồ Chí Minh</span>
                            <span className="text-[10.5px] font-semibold text-[#4F604E]">1–2 ngày</span>
                          </div>
                          <div className="flex items-center justify-between rounded-lg bg-[#F5F6F3] px-3 py-2.5">
                            <span className="text-[10.5px] text-[#555853]">Ngoại thành</span>
                            <span className="text-[10.5px] font-semibold text-[#4F604E]">2–3 ngày</span>
                          </div>
                        </div>
                        <p className="mt-3 text-[10.5px] leading-[1.6] text-[#777B72]">
                          Thời gian trên là thời gian dự kiến và có thể thay đổi tùy
                          tình hình vận chuyển thực tế.
                        </p>
                      </section>

                      <section>
                        <h4 className="text-[12px] font-semibold text-[#222222]">
                          Giao hàng hỏa tốc
                        </h4>

                        <div className="mt-3 space-y-2">
                          <div className="flex items-start justify-between gap-4 rounded-lg bg-[#F5F6F3] px-3 py-2.5">
                            <span className="text-[10.5px] text-[#555853]">
                              Đặt trước 17:00
                            </span>
                            <span className="max-w-[65%] text-right text-[10.5px] font-semibold leading-4 text-[#4F604E]">
                              Xử lý và giao trong ngày
                            </span>
                          </div>

                          <div className="flex items-start justify-between gap-4 rounded-lg bg-[#F5F6F3] px-3 py-2.5">
                            <span className="text-[10.5px] text-[#555853]">
                              Đặt sau 17:00
                            </span>
                            <span className="max-w-[65%] text-right text-[10.5px] font-semibold leading-4 text-[#4F604E]">
                              Chuyển sang xử lý từ 09:00 ngày hôm sau
                            </span>
                          </div>

                          <div className="flex items-start justify-between gap-4 rounded-lg bg-[#F5F6F3] px-3 py-2.5">
                            <span className="text-[10.5px] text-[#555853]">
                              Thời gian giao
                            </span>
                            <span className="max-w-[65%] text-right text-[10.5px] font-semibold leading-4 text-[#4F604E]">
                              Trong vòng 2 giờ kể từ khi Olive Living xác nhận đơn hàng
                            </span>
                          </div>
                        </div>

                        <p className="mt-3 text-[10.5px] leading-[1.6] text-[#777B72]">
                          Thời gian giao hỏa tốc có thể thay đổi tùy khu vực,
                          tình trạng vận chuyển và thời điểm đơn hàng được xác nhận.
                        </p>
                      </section>

                      <section>
                        <h4 className="text-[12px] font-semibold text-[#222222]">
                          Trường hợp giao hàng chậm
                        </h4>
                        <p className="mt-2 text-[10.5px] leading-[1.6] text-[#5F625C]">
                          Trong trường hợp phát sinh các yếu tố ngoài khả năng kiểm soát
                          như <strong>mưa bão, thời tiết xấu, quá tải hoặc đơn hàng bị lưu giữ
                          tại đơn vị vận chuyển</strong>, thời gian giao hàng có thể chậm thêm
                          khoảng <strong>1–2 ngày</strong>.
                        </p>
                      </section>

                      <section>
                        <h4 className="text-[12px] font-semibold text-[#222222]">
                          Tra cứu đơn hàng
                        </h4>
                        <p className="mt-2 text-[10.5px] leading-[1.6] text-[#5F625C]">
                          Quý khách có thể <strong>liên hệ Olive Living để nhận mã tracking</strong>
                          {" "}và theo dõi tình trạng đơn hàng.
                        </p>
                      </section>

                      <section>
                        <h4 className="text-[12px] font-semibold text-[#222222]">
                          Thay đổi địa chỉ nhận hàng
                        </h4>
                        <p className="mt-2 text-[10.5px] leading-[1.6] text-[#5F625C]">
                          Nếu muốn thay đổi địa chỉ sau khi đơn hàng đã được bàn giao
                          cho đơn vị vận chuyển, vui lòng liên hệ Olive Living sớm nhất
                          có thể.
                        </p>
                        <p className="mt-2 text-[10.5px] leading-[1.6] text-[#5F625C]">
                          Chúng tôi sẽ kiểm tra tình trạng đơn hàng và hỗ trợ xử lý với
                          đơn vị vận chuyển tùy theo khả năng điều chỉnh tại thời điểm yêu cầu.
                        </p>
                      </section>
                    </div>
                  )}

                  {policyOpen === "shipping_fee" && (
                    <div className="space-y-5">
                      <div>
                        <p className="text-[11px] leading-5 text-[#555853]">
                          Phí giao hàng hỏa tốc được tính theo <strong>khu vực nhận hàng</strong> và
                          <strong> loại sản phẩm</strong>. Bảng dưới đây là mức phí áp dụng tại TP. Hồ Chí Minh.
                        </p>
                      </div>

                      <section>
                        <h4 className="text-[12px] font-semibold text-[#222222]">
                          Bảng phí giao hàng hỏa tốc tại TP. Hồ Chí Minh
                        </h4>
                        <div className="mt-3 overflow-hidden rounded-xl border border-[#E1E4DD]">
                          <div className="grid grid-cols-[1fr_112px_112px] bg-[#F5F6F2] px-3 py-2.5 text-[8.5px] font-semibold leading-4 text-[#666B62] sm:grid-cols-[1fr_150px_150px]">
                            <span>Khu vực</span>
                            <span className="text-right">Đèn bàn · Đèn thả · Đèn tường · Đèn không dây</span>
                            <span className="text-right">Đèn đứng · Nội thất &amp; Decor</span>
                          </div>
                          <div className="divide-y divide-[#ECEDE8]">
                            {[
                              ["Bình Chánh – Bình Hưng", "15.709đ", "30.436đ"],
                              ["Bình Tân", "52.036đ", "79.036đ"],
                              ["Bình Thạnh", "73.636đ", "89.836đ"],
                              ["Gò Vấp", "89.836đ", "111.436đ"],
                              ["Phú Nhuận", "68.236đ", "84.436đ"],
                              ["Quận 1", "57.436đ", "73.636đ"],
                              ["Quận 10", "52.036đ", "68.236đ"],
                              ["Quận 11", "57.436đ", "73.636đ"],
                              ["Quận 2 / Thảo Điền", "73.636đ", "89.836đ"],
                              ["Quận 3", "57.436đ", "73.636đ"],
                              ["Quận 4", "46.636đ", "57.436đ"],
                              ["Quận 5", "46.636đ", "62.836đ"],
                              ["Quận 6", "46.636đ", "68.236đ"],
                              ["Quận 7 – Phú Mỹ Hưng", "41.236đ", "57.436đ"],
                              ["Quận 7 – Tân Quy / Tân Phong", "30.436đ", "46.636đ"],
                              ["Quận 8", "25.036đ", "46.636đ"],
                              ["Tân Bình", "73.636đ", "89.836đ"],
                              ["Tân Phú", "79.036đ", "100.636đ"],
                              ["TP. Thủ Đức", "100.636đ", "138.436đ"],
                            ].map(([zone, standard, bulky]) => (
                              <div key={zone} className="grid grid-cols-[1fr_112px_112px] items-center px-3 py-2.5 text-[10px] sm:grid-cols-[1fr_150px_150px]">
                                <span className="pr-2 leading-4 text-[#555853]">{zone}</span>
                                <span className="text-right font-medium text-[#4F604E]">{standard}</span>
                                <span className="text-right font-semibold text-[#30342C]">{bulky}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </section>

                      <div className="rounded-xl border border-[#E5E7E1] bg-[#FAFBF8] px-3.5 py-3">
                        <p className="text-[9.5px] leading-4 text-[#777B72]">
                          Phí vận chuyển được hệ thống tự động xác định dựa trên địa chỉ nhận hàng và sản phẩm trong giỏ hàng.
                        </p>
                      </div>
                    </div>
                  )}

                  {policyOpen === "payment" && (
                    <div className="space-y-5">

                      <div>
                        <p className="text-[11px] leading-5 text-[#555853]">
                          Olive Living hiện hỗ trợ <strong>3 phương thức thanh toán</strong>.
                          Quý khách có thể lựa chọn phương thức phù hợp khi đặt hàng.
                        </p>
                      </div>

                      {/* ================= COD ================= */}
                      <section className="rounded-xl border border-[#FFD2C2] bg-[#FFF8F5] p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FFF0E9] text-[#FF4D00]">
                            <Truck className="h-4 w-4" strokeWidth={1.8} />
                          </div>

                          <div>
                            <h4 className="text-[12px] font-semibold text-[#222222]">
                              1. COD · Thanh toán khi nhận hàng
                            </h4>

                            <p className="mt-1.5 text-[10.5px] leading-[1.6] text-[#666A63]">
                              Quý khách đặt hàng và <strong>không cần thanh toán trước</strong>.
                              Khi đơn hàng được giao đến, quý khách kiểm tra và
                              thanh toán tiền cho đơn vị vận chuyển.
                            </p>

                            <div className="mt-2 rounded-lg bg-white px-3 py-2 text-[10px] font-medium leading-4 text-[#555853]">
                              Đặt hàng → Olive Living xác nhận → Giao hàng → Thanh toán khi nhận hàng
                            </div>
                          </div>
                        </div>
                      </section>

                      {/* ================= BANK TRANSFER ================= */}
                      <section className="rounded-xl border border-[#CFE2FF] bg-[#F7FAFF] p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EAF3FF] text-[#2563EB]">
                            <Building2 className="h-4 w-4" strokeWidth={1.8} />
                          </div>

                          <div>
                            <h4 className="text-[12px] font-semibold text-[#222222]">
                              2. Chuyển khoản ngân hàng
                            </h4>

                            <p className="mt-1.5 text-[10.5px] leading-[1.6] text-[#666A63]">
                              Quý khách có thể thanh toán trước bằng hình thức
                              <strong> chuyển khoản ngân hàng</strong>.
                              Thông tin tài khoản và mã đơn hàng sẽ được hiển thị
                              trong quá trình đặt hàng.
                            </p>

                            <div className="mt-2 rounded-lg bg-white px-3 py-2 text-[10px] leading-4 text-[#555853]">
                              Chuyển khoản → Olive Living xác nhận thanh toán →
                              Chuẩn bị đơn hàng → Giao hàng
                            </div>
                          </div>
                        </div>
                      </section>

                      {/* ================= PAYPAL ================= */}
                      <section className="rounded-xl border border-[#E7D69A] bg-[#FFFDF3] p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FFF3C4] text-[#003087]">
                            <span className="text-[14px] font-bold italic">
                              P
                            </span>
                          </div>

                          <div className="min-w-0">
                            <h4 className="text-[12px] font-semibold text-[#222222]">
                              3. Thanh toán qua PayPal
                            </h4>

                            <p className="mt-1.5 text-[10.5px] leading-[1.6] text-[#666A63]">
                              Quý khách có thể thanh toán trực tuyến thông qua
                              <strong> PayPal</strong>. Giao dịch thanh toán được
                              xử lý thông qua hệ thống PayPal.
                            </p>

                            <div className="mt-3 rounded-lg bg-white p-3">
                              <p className="text-[10px] font-semibold text-[#333333]">
                                Thanh toán bằng thẻ tín dụng / thẻ ghi nợ
                              </p>

                              <p className="mt-1.5 text-[10px] leading-[1.6] text-[#666A63]">
                                Nếu quý khách không có tài khoản PayPal, trong trường hợp
                                PayPal hiển thị tùy chọn thanh toán bằng thẻ cho giao dịch,
                                quý khách có thể chọn <strong>Credit Card / Debit Card</strong>
                                và nhập thông tin thẻ theo hướng dẫn của PayPal.
                              </p>

                              <div className="mt-3 rounded-lg border border-dashed border-[#D8D8D2] bg-[#FAFAF8] px-3 py-2.5">
                                <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[#999B96]">
                                  Hướng dẫn
                                </p>

                                <ol className="mt-2 space-y-1.5 text-[10px] leading-[1.6] text-[#666A63]">
                                  <li>
                                    <strong>1.</strong> Chọn phương thức thanh toán PayPal.
                                  </li>
                                  <li>
                                    <strong>2.</strong> Chọn tùy chọn thanh toán bằng thẻ
                                    nếu PayPal hiển thị lựa chọn này.
                                  </li>
                                  <li>
                                    <strong>3.</strong> Nhập thông tin thẻ theo hướng dẫn
                                    của PayPal.
                                  </li>
                                  <li>
                                    <strong>4.</strong> Xác nhận thanh toán và hoàn tất đơn hàng.
                                  </li>
                                </ol>
                              </div>

                              {/* ================= PAYPAL CARD GUIDE ================= */}
                              <div className="mt-3 overflow-hidden rounded-lg border border-[#E1E1DC] bg-[#FAFAF8]">
                                <div className="border-b border-[#E5E5E0] px-3 py-2.5">
                                  <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[#777B72]">
                                    Hướng dẫn thanh toán bằng thẻ
                                  </p>
                                  <p className="mt-1 text-[9px] leading-4 text-[#999B96]">
                                    Làm theo các bước bên dưới để thanh toán bằng thẻ qua PayPal.
                                  </p>
                                </div>

                                {/* STEP 1 */}
                                <div className="p-3">
                                  <div className="mb-2 flex items-center gap-2">
                                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#111111] text-[9px] font-semibold text-white">
                                      1
                                    </span>
                                    <p className="text-[9.5px] font-semibold text-[#333333]">
                                      Chọn thanh toán bằng thẻ
                                    </p>
                                  </div>

                                  <div className="overflow-hidden rounded-lg border border-[#E1E1DC] bg-white">
                                    <img
                                      src="/paypal-guide/paypal-card-step-1.png"
                                      alt="PayPal thanh toán bằng thẻ - bước 1"
                                      className="block h-auto w-full"
                                    />
                                  </div>
                                </div>

                                {/* STEP 2 */}
                                <div className="px-3 pb-3">
                                  <div className="mb-2 flex items-center gap-2">
                                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#111111] text-[9px] font-semibold text-white">
                                      2
                                    </span>
                                    <p className="text-[9.5px] font-semibold text-[#333333]">
                                      Nhập thông tin thẻ và hoàn tất thanh toán
                                    </p>
                                  </div>

                                  <div className="overflow-hidden rounded-lg border border-[#E1E1DC] bg-white">
                                    <img
                                      src="/paypal-guide/paypal-card-step-2.png"
                                      alt="PayPal thanh toán bằng thẻ - bước 2"
                                      className="block h-auto w-full"
                                    />
                                  </div>
                                </div>

                                <div className="border-t border-[#E5E5E0] bg-[#F4F4F1] px-3 py-2.5">
                                  <p className="text-[9px] leading-4 text-[#777B72]">
                                    Tùy theo khu vực và giao diện PayPal, các bước hiển thị
                                    có thể hơi khác nhau.
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </section>

                      <div className="rounded-xl bg-[#F4F5F2] px-4 py-3">
                        <p className="text-[10px] leading-5 text-[#666A63]">
                          Lưu ý: tùy theo khu vực, loại thẻ, tài khoản và điều kiện
                          của PayPal, tùy chọn thanh toán bằng thẻ có thể được PayPal
                          hiển thị hoặc không hiển thị.
                        </p>
                      </div>

                    </div>
                  )}

                  {policyOpen === "contact" && (
                    <div className="space-y-5">
                      <p className="text-[11px] leading-5 text-[#555853]">
                        Nếu quý khách cần hỗ trợ về <strong>đơn hàng, vận chuyển,
                        đổi hàng hoặc sản phẩm</strong>, vui lòng liên hệ Olive Living
                        qua các kênh dưới đây.
                      </p>

                      <div className="space-y-2.5">
                        <a
                          href="mailto:hello@olivelivingvn.com"
                          className="flex items-center justify-between rounded-xl border border-[#E3E4DF] bg-white px-4 py-3 transition hover:bg-[#F7F8F5]"
                        >
                          <div>
                            <p className="text-[9px] font-medium uppercase tracking-[0.12em] text-[#999B96]">
                              EMAIL
                            </p>
                            <p className="mt-1 text-[11px] font-semibold text-[#333333]">
                              hello@olivelivingvn.com
                            </p>
                          </div>
                          <span className="text-[14px] text-[#777B72]">→</span>
                        </a>

                        <div className="flex items-center justify-between rounded-xl border border-[#E3E4DF] bg-white px-4 py-3">
                          <div>
                            <p className="text-[9px] font-medium uppercase tracking-[0.12em] text-[#999B96]">
                              FANPAGE
                            </p>
                            <p className="mt-1 text-[11px] font-semibold text-[#333333]">
                              Olive Living
                            </p>
                          </div>
                        </div>

                        <a
                          href="tel:0799379179"
                          className="flex items-center justify-between rounded-xl border border-[#E3E4DF] bg-white px-4 py-3 transition hover:bg-[#F7F8F5]"
                        >
                          <div>
                            <p className="text-[9px] font-medium uppercase tracking-[0.12em] text-[#999B96]">
                              ZALO
                            </p>
                            <p className="mt-1 text-[11px] font-semibold text-[#333333]">
                              0799 379 179
                            </p>
                          </div>
                          <span className="text-[14px] text-[#777B72]">→</span>
                        </a>
                      </div>

                      <div className="rounded-xl bg-[#F4F5F2] px-4 py-3">
                        <p className="text-[10px] leading-5 text-[#666A63]">
                          Olive Living sẽ tiếp nhận và hỗ trợ quý khách trong thời gian sớm nhất.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="shrink-0 border-t border-[#ECECE7] px-5 py-3">
                  <button
                    type="button"
                    onClick={() => setPolicyOpen(null)}
                    className="w-full rounded-lg bg-[#111111] py-2.5 text-[10px] font-semibold text-white transition hover:bg-[#222222]"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          )}

        </form>
      </div>
    </div>
  );
}

function Step({
  number,
  label,
  active,
}: {
  number: string;
  label: string;
  active?: boolean;
}) {
  return (
    <div className="flex shrink-0 items-center gap-2">
      <span
        className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold ${
          active ? "bg-[#252820] text-white" : "border border-[#C9CBC4] bg-white text-[#8C9087]"
        }`}
      >
        {number}
      </span>
      <span className={`hidden text-[10px] font-medium sm:inline ${active ? "text-[#30342C]" : "text-[#999D94]"}`}>
        {label}
      </span>
    </div>
  );
}

function SectionTitle({
  icon,
  eyebrow,
  title,
  description,
}: {
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EEF1E9] text-[#667653]">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#8B8E84]">{eyebrow}</p>
        <h2 className="mt-1 text-[16px] font-semibold text-[#292C25]">{title}</h2>
        <p className="mt-1 text-[11px] leading-4 text-[#777B72]">{description}</p>
      </div>
    </div>
  );
}


function ShippingMethodOption({
  selected,
  onClick,
  title,
  description,
  price,
  badge,
  bordered,
  disabled = false,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  description: string;
  price: string;
  badge?: string;
  bordered?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex w-full items-center gap-3 px-3.5 py-3.5 text-left transition sm:px-4",
        bordered && "border-t border-[#ECECE7]",
        disabled
          ? "cursor-not-allowed bg-[#FAFAF8] opacity-60"
          : selected
            ? "bg-[#F4F7F1]"
            : "bg-white hover:bg-[#FAFAF8]"
      )}
    >
      <span className={cn(
        "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
        selected ? "border-[#667653]" : "border-[#C9CBC4]"
      )}>
        {selected && <span className="h-2.5 w-2.5 rounded-full bg-[#667653]" />}
      </span>

      <Truck className={cn("h-4 w-4 shrink-0", selected ? "text-[#667653]" : "text-[#8A8D84]")} strokeWidth={1.7} />

      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-[#30342C] sm:text-[12px]">{title}</span>
          {badge && (
            <span className="rounded-full bg-[#EEF2EA] px-1.5 py-0.5 text-[7px] font-bold uppercase tracking-[0.08em] text-[#667653]">
              {badge}
            </span>
          )}
        </span>
        <span className="mt-0.5 block text-[9px] leading-4 text-[#888C82] sm:text-[10px]">
          {description}
        </span>
      </span>

      <span className="shrink-0 text-[11px] font-semibold text-[#222222] sm:text-[12px]">
        {price}
      </span>
    </button>
  );
}

function PaymentOption({
  selected,
  onClick,
  icon,
  title,
  description,
}: {
  selected: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition ${
        selected
          ? "border-[#667653] bg-[#F3F6F0] ring-1 ring-[#667653]/10"
          : "border-[#E0E1DB] bg-white hover:border-[#B9C2B0]"
      }`}
    >
      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
        selected ? "bg-[#667653] text-white" : "bg-[#F2F2EE] text-[#6E7269]"
      }`}>
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[12px] font-semibold text-[#30342C]">{title}</span>
        <span className="mt-0.5 block text-[10px] leading-4 text-[#858980]">{description}</span>
      </span>
      <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
        selected ? "border-[#667653] bg-[#667653]" : "border-[#C9CBC4] bg-white"
      }`}>
        {selected && <Check className="h-2.5 w-2.5 text-white" strokeWidth={2.5} />}
      </span>
    </button>
  );
}

function Field({
  name,
  label,
  required,
  defaultValue,
  textarea,
}: {
  name: string;
  label: string;
  required?: boolean;
  defaultValue?: string;
  textarea?: boolean;
}) {
  const placeholders: Record<string, string> = {
    full_name: "Ví dụ: Nguyễn Văn An",
    email: "Ví dụ: hello@email.com",
    address: "Ví dụ: 123 Nguyễn Trãi, P. Bến Thành",
    notes: "Ví dụ: Giao giờ hành chính, gọi trước khi giao",
  };

  return (
    <label className="block">
      <span className="mb-0.5 block text-[10px] font-medium text-[#666666]">
        {label}{required && " *"}
      </span>

      {textarea ? (
        <textarea
          name={name}
          defaultValue={defaultValue}
          rows={2}
          placeholder={placeholders[name] ?? "Nhập thông tin..."}
          className="h-9 w-full resize-none rounded-lg border border-[#DCDDD7] bg-white px-3 py-2 text-[11px] text-[#222222] outline-none transition focus:border-[#8A8A8A] focus:ring-2 focus:ring-[#667653]/10 placeholder:text-[#AAAAAA]"
        />
      ) : (
        <input
          name={name}
          required={required ?? false}
          defaultValue={defaultValue}
          placeholder={placeholders[name] ?? "Nhập thông tin..."}
          onChange={(e) => {
            if (name === "full_name") {
              e.target.value = e.target.value.toUpperCase();
            }
          }}
          className="h-9 w-full rounded-lg border border-[#DCDDD7] bg-white px-3 text-[11px] text-[#222222] outline-none transition focus:border-[#8A8A8A] focus:ring-2 focus:ring-[#667653]/10 placeholder:text-[#AAAAAA]"
        />
      )}
    </label>
  );
}
