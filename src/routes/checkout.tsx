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
  const [summaryOpen, setSummaryOpen] = useState(true);
  const [voucherOpen, setVoucherOpen] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [policyOpen, setPolicyOpen] = useState<
  "exchange" | "shipping" | "contact" | "payment" | null
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

  const baseShipping = getShippingFee(cityValue);

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
      shipping: baseShipping,
      totalDiscount: 0,
    });

  const shipping = baseShipping;

  const discountVoucher = voucherSummary.discountVoucher;
  const shippingVoucher = voucherSummary.shippingVoucher;

  const total =
    subtotal +
    baseShipping -
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
  shipping_fee: baseShipping,
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
  shipping: baseShipping,

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
      <div className="mx-auto w-full max-w-[1180px] px-4 pb-10 pt-5 sm:px-6 sm:pt-8 lg:px-8 lg:pb-16">
        <header className="mb-5 sm:mb-8">
          <Link
            to="/"
            className="inline-flex items-center text-[11px] font-medium uppercase tracking-[0.2em] text-[#667653] transition hover:opacity-70"
          >
            OLIVE LIVING
          </Link>
          <div className="mt-5 sm:mt-7">
            <p className="text-[9px] font-semibold uppercase tracking-[0.28em] text-[#8B8E84]">
              CHECKOUT
            </p>
            <h1 className="mt-1.5 font-display text-[30px] leading-none tracking-[-0.02em] sm:text-4xl">
              Thanh toán
            </h1>
            <p className="mt-2 max-w-xl text-[12px] leading-5 text-[#777B72] sm:text-sm">
              Hoàn tất thông tin để Olive Living giao sản phẩm đến bạn.
            </p>
          </div>
        </header>

        <div className="mb-5 flex items-center sm:mb-8">
          <Step number="1" label="Giỏ hàng" active />
          <div className="mx-2 h-px flex-1 bg-[#D9DAD4] sm:mx-4 sm:max-w-20" />
          <Step number="2" label="Thông tin" active />
          <div className="mx-2 h-px flex-1 bg-[#D9DAD4] sm:mx-4 sm:max-w-20" />
          <Step number="3" label="Hoàn tất" />
        </div>

        <form
          onSubmit={onSubmit}
          className="grid w-full min-w-0 max-w-full gap-5 overflow-x-clip lg:grid-cols-[minmax(0,1fr)_370px] lg:items-start lg:gap-8"
        >
          <input type="hidden" name="payment_method" value={paymentMethod} />
          <div className="order-2 min-w-0 w-full max-w-full space-y-4 overflow-hidden lg:order-1 lg:space-y-5">
            <section className="rounded-2xl border border-[#E0E1DB] bg-white p-4 sm:p-6">
              <SectionTitle
                icon={<UserRound className="h-4 w-4" strokeWidth={1.7} />}
                eyebrow="CONTACT"
                title="Thông tin liên hệ"
                description="Thông tin dùng để xác nhận đơn hàng."
              />
              <div className="mt-3 space-y-2">
                <Field name="full_name" label="Họ và tên" required />
                <label className="block">
                  <span className="mb-0.5 block text-[10px] font-medium text-[#666666]">
                    Số điện thoại *
                  </span>
                  <input
                    name="phone"
                    required
                    value={phoneValue}
                    onChange={(e) => setPhoneValue(e.target.value)}
                    inputMode="tel"
                    placeholder="Ví dụ: 0901234567"
                    className="h-9 w-full rounded-lg border border-[#DCDDD7] bg-white px-3 text-[11px] text-[#222222] outline-none transition focus:border-[#8A8A8A] focus:ring-2 focus:ring-[#667653]/10 placeholder:text-[#AAAAAA]"
                  />
                </label>
                <Field name="email" label="Email" defaultValue="" />
              </div>
            </section>

            <section className="rounded-2xl border border-[#E0E1DB] bg-white p-4 sm:p-6">
              <SectionTitle
                icon={<MapPin className="h-4 w-4" strokeWidth={1.7} />}
                eyebrow="DELIVERY"
                title="Địa chỉ giao hàng"
                description="Đơn hàng sẽ được giao đến địa chỉ này."
              />
              <div className="mt-3 space-y-2">
                <Field name="address" label="Địa chỉ" required />

                <label className="block">
                  <span className="mb-0.5 block text-[10px] font-medium text-[#666666]">
                    Tỉnh / Thành phố *
                  </span>
                  <Popover open={cityOpen} onOpenChange={setCityOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        role="combobox"
                        className="h-9 w-full justify-between rounded-lg border-[#DCDDD7] bg-white px-3 text-[11px] font-normal text-[#444444]"
                      >
                        {cityValue || "Ví dụ: Hồ Chí Minh"}
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
                  <span className="mb-0.5 block text-[10px] font-medium text-[#666666]">
                    Quận / Huyện *
                  </span>
                  <Popover open={districtOpen} onOpenChange={setDistrictOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        role="combobox"
                        className="h-9 w-full justify-between rounded-lg border-[#DCDDD7] bg-white px-3 text-[11px] font-normal text-[#444444]"
                        onClick={() => {
                          if (!cityValue) {
                            toast.error("Vui lòng chọn Tỉnh / Thành phố trước.");
                            return;
                          }
                          setDistrictOpen(true);
                        }}
                      >
                        {districtValue || "Ví dụ: Quận 1"}
                        <ChevronsUpDown className="h-3.5 w-3.5 opacity-40" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] p-0">
                      <Command>
                        <CommandInput placeholder="Tìm Quận / Huyện..." />
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
                  <span className="mb-0.5 block text-[10px] font-medium text-[#666666]">
                    Phường / Xã
                  </span>
                  <Popover open={wardOpen} onOpenChange={setWardOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        role="combobox"
                        disabled={!districtValue}
                        className="h-9 w-full justify-between rounded-lg border-[#DCDDD7] bg-white px-3 text-[11px] font-normal text-[#444444]"
                      >
                        {wardValue || "Ví dụ: Phường Bến Thành"}
                        <ChevronsUpDown className="h-3.5 w-3.5 opacity-40" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] p-0">
                      <Command>
                        <CommandInput placeholder="Tìm phường..." />
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

                <Field name="notes" label="Ghi chú đơn hàng (tuỳ chọn)" textarea />
              </div>
            </section>
          </div>

          <aside className="order-1 min-w-0 w-full max-w-full h-fit overflow-hidden lg:order-2">
            <div className="w-full min-w-0 max-w-full overflow-hidden lg:sticky lg:top-6">

              {/* ================= ORDER SUMMARY — GIỮ NGUYÊN VỊ TRÍ ================= */}
              <section className="overflow-hidden rounded-2xl border border-[#DCDDD7] bg-white">
                <button
                  type="button"
                  onClick={() => setSummaryOpen((v) => !v)}
                  className="flex w-full items-center justify-between gap-3 px-3.5 py-3 text-left sm:px-5 sm:py-4"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F2F2F2] text-[#111111]">
                      <ShoppingBag className="h-3.5 w-3.5" strokeWidth={1.6} />
                    </div>
                    <div>
                      <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#8A8A8A]">
                        ORDER SUMMARY
                      </p>
                      <p className="mt-0.5 text-[13px] font-semibold text-[#111111]">
                        Đơn hàng · {count} sản phẩm
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <span className="shrink-0 whitespace-nowrap text-[14px] font-semibold text-[#111111]">
                      {formatVND(total)}
                    </span>
                    {summaryOpen ? (
                      <ChevronUp className="h-4 w-4 text-[#555555]" strokeWidth={1.6} />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-[#555555]" strokeWidth={1.6} />
                    )}
                  </div>
                </button>

                {summaryOpen && (
                  <div className="border-t border-[#E9E9E9] px-3.5 py-4 sm:px-5">
                    <div className="space-y-2.5">
                      {items.map((i) => (
                        <div key={i.id} className="flex items-center gap-2.5">
                          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-[#DCDDD7] bg-[#F5F4EF]">
                            {i.image && (
                              <img
                                src={i.image}
                                alt={i.name}
                                className="h-full w-full object-cover"
                              />
                            )}
                            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#111111] px-1 text-[8px] font-semibold text-white">
                              {i.quantity}
                            </span>
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="line-clamp-1 text-[11px] font-medium leading-4 text-[#303030]">
                              {i.name}
                            </p>
                            {i.colorName && (
                              <p className="mt-0.5 text-[9px] text-[#888888]">
                                {i.colorName}
                              </p>
                            )}
                          </div>

                          <p className="shrink-0 text-[11px] font-medium text-[#222222]">
                            {formatVND(i.price * i.quantity)}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-3 border-t border-[#E9E9E9] pt-3">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-[10.5px]">
                          <span className="text-[#777777]">
                            Tạm tính
                          </span>
                          <span className="font-medium text-[#333333]">
                            {formatVND(subtotal)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[10.5px]">
                          <span className="text-[#777777]">
                            Phí vận chuyển
                          </span>
                          <span className="font-medium text-[#333333]">
                            {baseShipping > 0
                              ? formatVND(baseShipping)
                              : "Miễn phí"}
                          </span>
                        </div>

                        <div className="flex items-center justify-between border-t border-[#EEEEEB] pt-2">
                          <div className="min-w-0">
                            <p className="text-[11px] font-semibold text-[#222222]">
                              Tổng đơn hàng
                            </p>
                            <p className="mt-0.5 text-[9px] text-[#888888]">
                              {count} sản phẩm
                            </p>
                          </div>

                          <p className="shrink-0 text-[17px] font-bold text-[#111111]">
                            {formatVND(subtotal + baseShipping)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </section>

              {/* ================= VOUCHER — SAU ĐƠN HÀNG ================= */}
              <section className="mt-3 overflow-hidden rounded-2xl border border-[#DCDDD7] bg-white">
                <button
                  type="button"
                  onClick={() => setVoucherOpen((v) => !v)}
                  className="flex w-full items-center justify-between gap-3 px-3.5 py-3 text-left sm:px-5"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F2F2F2] text-[#111111]">
                      <Tag className="h-3.5 w-3.5" strokeWidth={1.7} />
                    </div>

                    <div className="min-w-0">
                      <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#8A8A8A]">
                        DISCOUNT
                      </p>
                      <p className="mt-0.5 text-[13px] font-semibold text-[#111111]">
                        Giảm giá & ưu đãi
                      </p>

                      {(discountVoucher || shippingVoucher) ? (
                        <p className="mt-0.5 truncate text-[9px] text-[#777777]">
                          {[discountVoucher?.code, shippingVoucher?.code]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      ) : (
                        <p className="mt-0.5 text-[9px] text-[#888888]">
                          Nhập mã giảm giá hoặc chọn ưu đãi
                        </p>
                      )}
                    </div>
                  </div>

                  {voucherOpen ? (
                    <ChevronUp className="h-4 w-4 shrink-0 text-[#555555]" strokeWidth={1.7} />
                  ) : (
                    <ChevronDown className="h-4 w-4 shrink-0 text-[#555555]" strokeWidth={1.7} />
                  )}
                </button>

                {voucherOpen && (
                  <div className="border-t border-[#E9E9E9] px-2.5 py-2.5 sm:px-4 sm:py-3">
                    <div
                      id="checkout-voucher-compact"
                      className="w-full min-w-0 max-w-full overflow-hidden"
                    >
                      <div
                        className="w-full min-w-0 max-w-full overflow-hidden [&_*]:max-w-full [&_*]:min-w-0"
                        style={{ zoom: 0.78 }}
                      >
                        <CheckoutVoucher
                          subtotal={subtotal}
                          shippingFee={baseShipping}
                          phone={phoneValue}
                          cartItems={items}
                          onChange={setVoucherSummary}
                        />
                      </div>
                    </div>

                    <style>{`
                      /* Compact voucher: flatten the nested component so it reads
                         as one checkout section, not a stack of cards. */
                      #checkout-voucher-compact,
                      #checkout-voucher-compact > div {
                        width: 100% !important;
                        max-width: 100% !important;
                      }

                      #checkout-voucher-compact {
                        overflow: hidden !important;
                      }

                      #checkout-voucher-compact [class*="rounded-2xl"],
                      #checkout-voucher-compact [class*="rounded-xl"],
                      #checkout-voucher-compact [class*="rounded-lg"] {
                        border-radius: 8px !important;
                        box-shadow: none !important;
                      }

                      #checkout-voucher-compact [class*="shadow"] {
                        box-shadow: none !important;
                      }

                      #checkout-voucher-compact [class*="border"] {
                        border-color: #E6E6E6 !important;
                      }

                      /* Remove decorative background blocks and keep the page
                         palette black / white / neutral gray. */
                      #checkout-voucher-compact [class*="bg-emerald-50"],
                      #checkout-voucher-compact [class*="bg-green-50"],
                      #checkout-voucher-compact [class*="bg-primary\/5"],
                      #checkout-voucher-compact [class*="bg-primary\/10"] {
                        background: #F7F7F7 !important;
                      }

                      #checkout-voucher-compact [class*="text-emerald-"],
                      #checkout-voucher-compact [class*="text-green-"],
                      #checkout-voucher-compact [class*="text-primary"] {
                        color: #222222 !important;
                      }

                      /* Smaller hierarchy: especially the total amount. */
                      #checkout-voucher-compact [class*="text-3xl"],
                      #checkout-voucher-compact [class*="text-2xl"] {
                        font-size: 20px !important;
                        line-height: 1.15 !important;
                        letter-spacing: -0.02em !important;
                      }

                      #checkout-voucher-compact [class*="text-xl"] {
                        font-size: 18px !important;
                        line-height: 1.2 !important;
                      }

                      /* Reduce vertical density without touching functionality. */
                      #checkout-voucher-compact [class*="p-5"],
                      #checkout-voucher-compact [class*="p-4"] {
                        padding: 10px !important;
                      }

                      #checkout-voucher-compact [class*="p-3"] {
                        padding: 8px !important;
                      }

                      #checkout-voucher-compact [class*="mt-6"],
                      #checkout-voucher-compact [class*="mt-5"] {
                        margin-top: 8px !important;
                      }

                      #checkout-voucher-compact [class*="mt-4"] {
                        margin-top: 7px !important;
                      }

                      #checkout-voucher-compact [class*="gap-4"] {
                        gap: 8px !important;
                      }

                      #checkout-voucher-compact [class*="gap-3"] {
                        gap: 7px !important;
                      }

                      /* Compact fields/buttons, consistent with the rest of checkout. */
                      #checkout-voucher-compact input {
                        min-height: 38px !important;
                        height: 38px !important;
                        border-radius: 8px !important;
                        font-size: 11px !important;
                      }

                      #checkout-voucher-compact button {
                        min-height: 36px !important;
                        border-radius: 8px !important;
                        font-size: 10px !important;
                      }

                      /* Make voucher discount values neutral black instead of
                         bright green. */
                      #checkout-voucher-compact [class*="text-emerald-600"],
                      #checkout-voucher-compact [class*="text-emerald-700"],
                      #checkout-voucher-compact [class*="text-green-600"],
                      #checkout-voucher-compact [class*="text-green-700"] {
                        color: #222222 !important;
                      }
                    `}</style>
                  </div>
                )}
              </section>

              {/* ================= PAYMENT ================= */}
              <section className="mt-3 overflow-hidden rounded-2xl border border-[#DCDDD7] bg-white">
                <div className="px-3.5 py-4 sm:px-5 sm:py-5">
                  <div className="mb-3 text-center">
                    <p className="text-[10px] font-medium tracking-[0.02em] text-[#8A8A8A]">
                      Express Checkout
                    </p>
                  </div>

                  <div className="grid gap-2">
  {/* COD */}
  <button
    type="button"
    onClick={() => setPaymentMethod("cod")}
    className={`flex h-11 w-full items-center justify-center gap-2 rounded-xl border text-[13px] font-semibold transition-all duration-200 ${
      paymentMethod === "cod"
        ? "border-[#FF4D00] bg-[#FFF1EB] text-[#D94100] shadow-sm"
        : "border-[#FFD2C2] bg-[#FFF8F5] text-[#333333] hover:border-[#FF4D00] hover:bg-[#FFF1EB] hover:text-[#D94100]"
    }`}
  >
    <Truck
      className="h-4 w-4"
      strokeWidth={1.8}
    />

    COD · Thanh toán khi nhận hàng
  </button>

  {/* CHUYỂN KHOẢN */}
  <button
    type="button"
    onClick={() => setPaymentMethod("transfer")}
    className={`flex h-11 w-full items-center justify-center gap-2 rounded-xl border text-[13px] font-semibold transition-all duration-200 ${
      paymentMethod === "transfer"
        ? "border-[#3B82F6] bg-[#EFF6FF] text-[#2563EB] shadow-sm"
        : "border-[#CFE2FF] bg-[#F7FAFF] text-[#333333] hover:border-[#3B82F6] hover:bg-[#EFF6FF] hover:text-[#2563EB]"
    }`}
  >
    <Building2
      className="h-3.5 w-3.5"
      strokeWidth={1.8}
    />

    Chuyển khoản
  </button>
</div>

                  {paymentMethod === "transfer" && (
                    <div className="mt-3 rounded-xl border border-[#E1E1E1] bg-[#FAFAFA] p-3">
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] font-semibold text-[#111111]">
                          Thông tin chuyển khoản
                        </p>
                        <span className="text-[8px] font-medium uppercase tracking-wide text-[#777777]">
                          QR Banking
                        </span>
                      </div>

                      <div className="mt-2 space-y-1 text-[10px] leading-4 text-[#666666]">
                        <p>
                          <span className="font-medium text-[#222222]">ACB Bank</span>{" "}
                          · NGUYEN THI BICH HUYEN
                        </p>
                        <p>
                          <span className="font-medium text-[#222222]">STK:</span>{" "}
                          27775487 ·{" "}
                          <span className="font-medium text-[#222222]">Nội dung:</span>{" "}
                          OLIVE-{Math.floor(total)}
                        </p>
                      </div>

                      <div className="mt-2 flex justify-center rounded-lg bg-white p-1.5">
                        <img
                          src="/qr-bank.png"
                          alt="QR chuyển khoản"
                          className="w-32 rounded-lg border border-[#E4E4E4]"
                        />
                      </div>
                    </div>
                  )}

                  {/* PAYPAL OFFICIAL BUTTONS */}
                  <div className="mt-3 space-y-2.5">
                    <p className="text-center text-[9px] font-medium uppercase tracking-[0.12em] text-[#999999]">
                      Thanh toán online
                    </p>

                    <PayPalScriptProvider options={paypalOptions}>
                      {/* Official PayPal button */}
                      <div className="overflow-hidden rounded-xl">
                        <PayPalButtons
                          fundingSource={FUNDING.PAYPAL}
                          style={{
                            layout: "vertical",
                            color: "gold",
                            shape: "rect",
                            label: "paypal",
                            height: 42,
                          }}
                          disabled={submitting}
                          createOrder={async () => {
                            setPaymentMethod("paypal");

                            const { data, error } =
                              await supabase.functions.invoke(
                                "paypal-create-order",
                                {
                                  body: {
                                    amount: paypalAmountUSD,
                                    currency: "USD",
                                  },
                                },
                              );

                            if (error) {
                              console.error(
                                "PAYPAL CREATE ORDER ERROR:",
                                error,
                              );
                              throw new Error(
                                "Không thể tạo đơn PayPal.",
                              );
                            }

                            if (!data?.success || !data?.orderId) {
                              console.error(
                                "PAYPAL CREATE ORDER RESPONSE:",
                                data,
                              );
                              throw new Error(
                                "PayPal không thể tạo đơn.",
                              );
                            }

                            return data.orderId;
                          }}
                          onApprove={async (data) => {
                            try {
                              setSubmitting(true);

                              const {
                                data: captureData,
                                error,
                              } = await supabase.functions.invoke(
                                "paypal-capture-order",
                                {
                                  body: {
                                    orderId: data.orderID,
                                  },
                                },
                              );

                              if (error) {
                                console.error(
                                  "PAYPAL CAPTURE ERROR:",
                                  error,
                                );
                                throw new Error(
                                  "Không thể xác nhận thanh toán PayPal.",
                                );
                              }

                              if (
                                !captureData?.success ||
                                captureData?.status !== "COMPLETED"
                              ) {
                                throw new Error(
                                  "Thanh toán PayPal chưa hoàn tất.",
                                );
                              }

                              const form =
                                document.querySelector("form");

                              if (form) {
                                form.requestSubmit();
                              }
                            } catch (error) {
                              console.error(
                                "PAYPAL PAYMENT ERROR:",
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
                        />
                      </div>

                      {/* Official PayPal card / debit card button */}
                      <div className="overflow-hidden rounded-xl">
                        <PayPalButtons
                          fundingSource={FUNDING.CARD}
                          style={{
                            layout: "vertical",
                            color: "gold",
                            shape: "rect",
                            height: 42,
                          }}
                          disabled={submitting}
                          createOrder={async () => {
                            setPaymentMethod("card");

                            const { data, error } =
                              await supabase.functions.invoke(
                                "paypal-create-order",
                                {
                                  body: {
                                    amount: paypalAmountUSD,
                                    currency: "USD",
                                  },
                                },
                              );

                            if (error) {
                              console.error(
                                "PAYPAL CARD CREATE ORDER ERROR:",
                                error,
                              );
                              throw new Error(
                                "Không thể tạo thanh toán bằng thẻ.",
                              );
                            }

                            if (!data?.success || !data?.orderId) {
                              console.error(
                                "PAYPAL CARD CREATE ORDER RESPONSE:",
                                data,
                              );
                              throw new Error(
                                "PayPal không thể tạo giao dịch thẻ.",
                              );
                            }

                            return data.orderId;
                          }}
                          onApprove={async (data) => {
                            try {
                              setSubmitting(true);

                              const {
                                data: captureData,
                                error,
                              } = await supabase.functions.invoke(
                                "paypal-capture-order",
                                {
                                  body: {
                                    orderId: data.orderID,
                                  },
                                },
                              );

                              if (error) {
                                console.error(
                                  "PAYPAL CARD CAPTURE ERROR:",
                                  error,
                                );
                                throw new Error(
                                  "Không thể xác nhận thanh toán bằng thẻ.",
                                );
                              }

                              if (
                                !captureData?.success ||
                                captureData?.status !== "COMPLETED"
                              ) {
                                throw new Error(
                                  "Thanh toán bằng thẻ chưa hoàn tất.",
                                );
                              }

                              const form =
                                document.querySelector("form");

                              if (form) {
                                form.requestSubmit();
                              }
                            } catch (error) {
                              console.error(
                                "PAYPAL CARD PAYMENT ERROR:",
                                error,
                              );

                              alert(
                                error instanceof Error
                                  ? error.message
                                  : "Thanh toán bằng thẻ thất bại.",
                              );

                              setSubmitting(false);
                            }
                          }}
                        />
                      </div>
                    </PayPalScriptProvider>
                  </div>

                  {/* PAYMENT STATUS + GUIDE */}
                  <div className="mt-3 flex items-center justify-center gap-3 border-t border-[#EEEEEB] pt-2.5">
                    <p className="text-center text-[9px] leading-4 text-[#969696]">
                      {paymentMethod === "cod"
                        ? "Thanh toán khi nhận hàng."
                        : paymentMethod === "transfer"
                          ? "Đơn hàng được xác nhận sau khi kiểm tra giao dịch."
                          : paymentMethod === "card"
                            ? "Thanh toán bằng thẻ qua PayPal."
                            : "Thanh toán an toàn qua PayPal."}
                    </p>

                    <span className="h-3.5 w-px shrink-0 bg-[#DCDDD7]" />

                    <button
                      type="button"
                      onClick={() => setPolicyOpen("payment")}
                      className="inline-flex shrink-0 items-center gap-1.5 text-[9px] font-medium text-[#555853] underline underline-offset-2 transition-colors hover:text-[#111111]"
                    >
                      <span className="flex h-4 w-4 items-center justify-center rounded-full border border-[#BFC1BA] text-[9px] font-semibold text-[#555853]">
                        ?
                      </span>
                      Hướng dẫn thanh toán
                      <span className="text-[12px] leading-none">›</span>
                    </button>
                  </div>
                </div>
              </section>
            </div>
          </aside>
          <section className="order-3 min-w-0 w-full max-w-full overflow-hidden rounded-2xl border border-[#E0E1DB] bg-white p-4 sm:p-5 lg:col-span-2">
            <div className="flex items-center justify-between gap-4 border-b border-[#ECECE7] pb-3">
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#8B8E84]">YOUR ORDER</p>
                <p className="mt-0.5 text-[14px] font-semibold text-[#292C25]">Tổng đơn hàng</p>
              </div>
              <p className="text-[18px] font-bold text-[#292C25]">{formatVND(total)}</p>
            </div>

            <div className="mt-3 flex items-center gap-3">
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-[#DCDDD7] bg-[#F5F4EF]">
                {items[0]?.image && (
                  <img src={items[0].image} alt={items[0].name} className="h-full w-full object-cover" />
                )}
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#252820] px-1 text-[8px] font-semibold text-white">
                  {count}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[11px] font-medium text-[#30342C]">{items[0]?.name}</p>
                <p className="mt-0.5 text-[9px] text-[#888C82]">{count} sản phẩm</p>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-[#ECECE7] pt-3">
              <div>
                <p className="text-[11px] font-medium text-[#777B72]">Tổng thanh toán</p>
                {voucherSummary.totalDiscount > 0 && (
                  <p className="mt-0.5 text-[9px] text-[#667653]">Tiết kiệm {formatVND(voucherSummary.totalDiscount)}</p>
                )}
              </div>
              <p className="text-[22px] font-bold tracking-[-0.02em] text-[#292C25]">{formatVND(total)}</p>
            </div>

            {paymentMethod !== "paypal" && paymentMethod !== "card" ? (
              <button
                type="submit"
                disabled={submitting}
                className="mt-4 flex h-12 w-full items-center justify-center rounded-xl bg-[#111111] px-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-[#222222] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Đang xử lý..." : "Đặt hàng"}
              </button>
            ) : (
              <div className="mt-4 rounded-xl bg-[#F6F7F3] px-3 py-2.5 text-center text-[9px] leading-4 text-[#777B72]">
                Hoàn tất thanh toán online ở phía trên.
              </div>
            )}



          {/* CHECKOUT POLICIES */}
          <div className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-t border-[#ECECE7] pt-3">
            <button
              type="button"
              onClick={() => setPolicyOpen("exchange")}
              className="text-[9px] font-medium text-[#999B96] transition-colors hover:text-[#333333]"
            >
              Chính sách đổi hàng
            </button>
            <span className="text-[9px] text-[#D5D5D1]">•</span>
            <button
              type="button"
              onClick={() => setPolicyOpen("shipping")}
              className="text-[9px] font-medium text-[#999B96] transition-colors hover:text-[#333333]"
            >
              Shipping
            </button>
            <span className="text-[9px] text-[#D5D5D1]">•</span>
            <button
              type="button"
              onClick={() => setPolicyOpen("contact")}
              className="text-[9px] font-medium text-[#999B96] transition-colors hover:text-[#333333]"
            >
              Liên hệ
            </button>
            <span className="text-[9px] text-[#D5D5D1]">•</span>
            <button
              type="button"
              onClick={() => setPolicyOpen("payment")}
              className="text-[9px] font-medium text-[#999B96] transition-colors hover:text-[#333333]"
            >
              Thanh toán
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
