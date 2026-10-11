
import { useEffect, useState } from "react";
import {
  Gift,
  Truck,
  Ticket,
  Percent,
  Copy,
  Check,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Voucher = {
  id: string;
  code: string;
  title: string | null;
  description?: string | null;
  type: string;
  value: number | null;
  min_order: number | null;
  max_discount?: number | null;
  active: boolean;
  start_at?: string | null;
  end_at?: string | null;
};

function formatVND(value: number | null | undefined) {
  return `${new Intl.NumberFormat("vi-VN").format(
    Number(value ?? 0)
  )}đ`;
}

function getNormalizedType(type: string) {
  const value = String(type ?? "").toLowerCase();

  if (
    value === "freeship" ||
    value === "free_shipping" ||
    value === "shipping"
  ) {
    return "freeship";
  }

  return value;
}

function getVoucherIcon(type: string) {
  switch (getNormalizedType(type)) {
    case "freeship":
      return Truck;
    case "percent":
      return Percent;
    case "fixed":
      return Gift;
    default:
      return Ticket;
  }
}

function getVoucherTitle(voucher: Voucher) {
  const value = Number(voucher.value ?? 0);

  switch (getNormalizedType(voucher.type)) {
    case "freeship":
      return "Miễn phí vận chuyển";
    case "percent":
      return `Giảm ${value}%`;
    case "fixed":
      return `Giảm ${formatVND(value)}`;
    default:
      return voucher.title || "Ưu đãi đặc biệt";
  }
}

function getVoucherDescription(voucher: Voucher) {
  const minOrder = Number(voucher.min_order ?? 0);

  if (minOrder > 0) {
    return `Đơn từ ${formatVND(minOrder)}`;
  }

  return voucher.description || "Áp dụng cho đơn hàng";
}

function saveVoucher(voucher: Voucher) {
  try {
    const raw = localStorage.getItem("olive_saved_vouchers");
    const savedVouchers = raw ? JSON.parse(raw) : [];

    if (
      savedVouchers.some(
        (item: { code: string }) => item.code === voucher.code
      )
    ) {
      return false;
    }

    savedVouchers.push({
      id: voucher.id,
      code: voucher.code,
      title: getVoucherTitle(voucher),
      value: Number(voucher.value ?? 0),
      type: voucher.type,
      minOrder: Number(voucher.min_order ?? 0),
      maxDiscount: Number(voucher.max_discount ?? 0),
    });

    localStorage.setItem(
      "olive_saved_vouchers",
      JSON.stringify(savedVouchers)
    );

    return true;
  } catch (error) {
    console.error("Save voucher error:", error);
    return false;
  }
}

export default function FlashSaleVoucher() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadVouchers() {
      setLoading(true);

      try {
        const { data, error } = await supabase
          .from("vouchers")
          .select("*")
          .eq("active", true)
          .eq("is_personal", false)
          .order("created_at", { ascending: false });

        if (error) throw error;

        const now = Date.now();

        const validVouchers = (data ?? []).filter(
          (voucher: Voucher) => {
            const startAt = voucher.start_at
              ? new Date(voucher.start_at).getTime()
              : null;

            const endAt = voucher.end_at
              ? new Date(voucher.end_at).getTime()
              : null;

            if (startAt !== null && now < startAt) return false;
            if (endAt !== null && now > endAt) return false;

            return true;
          }
        );

        if (!cancelled) {
          setVouchers(validVouchers as Voucher[]);
        }
      } catch (error) {
        console.error("Load Flash Sale vouchers error:", error);
        if (!cancelled) setVouchers([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadVouchers();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSaveVoucher(voucher: Voucher) {
    saveVoucher(voucher);

    try {
      await navigator.clipboard.writeText(voucher.code);
    } catch {
      // Voucher vẫn được lưu nếu clipboard không khả dụng.
    }

    setCopiedCode(voucher.code);
    window.setTimeout(() => setCopiedCode(null), 2000);
  }

  const visibleVouchers = showAll ? vouchers : vouchers.slice(0, 2);
  const remainingCount = Math.max(0, vouchers.length - 2);

  if (loading) {
    return (
      <section className="mt-5 sm:mt-10">
        <div className="mb-3 h-6 w-40 animate-pulse rounded-lg bg-neutral-100 sm:mb-5 sm:h-7 sm:w-48" />
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">
          {[1, 2].map((item) => (
            <div
              key={item}
              className="h-[94px] animate-pulse rounded-xl bg-neutral-100 sm:h-[150px] sm:rounded-2xl"
            />
          ))}
        </div>
      </section>
    );
  }

  if (vouchers.length === 0) {
    return (
      <section className="mt-5 sm:mt-10">
        <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#D45A2A] sm:text-[10px]">
          Special Offers
        </p>

        <h2 className="mt-1 font-display text-xl text-[#25231F] sm:text-3xl">
          Voucher độc quyền
        </h2>

        <p className="mt-1 text-xs text-neutral-500 sm:text-sm">
          Lưu mã để sử dụng khi thanh toán.
        </p>

        <div className="mt-3 rounded-xl border border-dashed border-[#E8DCCF] bg-[#FFFAF5] px-4 py-6 text-center sm:mt-5 sm:rounded-2xl sm:px-5 sm:py-8">
          <Ticket className="mx-auto h-6 w-6 text-[#C7A78E]" />
          <p className="mt-2 text-xs text-neutral-500 sm:text-sm">
            Hiện chưa có voucher khả dụng.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="mt-5 sm:mt-10">
      <div
        className="
          relative isolate overflow-hidden
          rounded-[18px] sm:rounded-[26px]
          border border-[#F1DFCE]
          bg-gradient-to-br from-[#FFF8F0] via-[#FFF0E2] to-[#FFE5D0]
          p-3 sm:p-6 lg:p-7
          shadow-[0_8px_30px_rgba(120,75,40,0.06)]
        "
      >
        {/* BACKGROUND PATTERNS */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
        >
          {/* Ánh sáng mềm phía trên */}
          <div className="absolute -right-16 -top-20 h-48 w-48 rounded-full bg-white/70 blur-3xl sm:h-64 sm:w-64" />

          {/* Vệt màu ấm phía dưới */}
          <div className="absolute -bottom-20 -left-12 h-48 w-48 rounded-full bg-[#FFB66B]/25 blur-3xl sm:h-64 sm:w-64" />

          {/* Họa tiết chấm nhỏ ở góc trái dưới */}
          <div
            className="absolute bottom-3 left-3 h-16 w-16 opacity-[0.18] sm:bottom-6 sm:left-6 sm:h-24 sm:w-24"
            style={{
              backgroundImage:
                "radial-gradient(circle, #D97945 1px, transparent 1.2px)",
              backgroundSize: "9px 9px",
            }}
          />

          {/* Đường cong trang trí ở góc phải */}
          <svg
            viewBox="0 0 240 240"
            className="absolute -right-14 -top-12 h-44 w-44 text-[#E8753C]/10 sm:-right-8 sm:-top-10 sm:h-64 sm:w-64"
            fill="none"
          >
            <circle cx="160" cy="80" r="52" stroke="currentColor" strokeWidth="1.2" />
            <circle cx="160" cy="80" r="70" stroke="currentColor" strokeWidth="1.2" />
            <circle cx="160" cy="80" r="88" stroke="currentColor" strokeWidth="1.2" />
            <circle cx="160" cy="80" r="106" stroke="currentColor" strokeWidth="1.2" />
          </svg>

          {/* Họa tiết voucher chìm */}
          <div className="absolute -bottom-7 right-2 rotate-[-16deg] text-[#D97945]/10 sm:bottom-0 sm:right-8">
            <Ticket
              className="h-24 w-24 sm:h-36 sm:w-36"
              strokeWidth={0.8}
            />
          </div>

          {/* Sparkles nhỏ */}
          <Sparkles className="absolute right-5 top-5 h-4 w-4 text-[#E8753C]/25 sm:right-10 sm:top-8 sm:h-6 sm:w-6" />
          <Sparkles className="absolute bottom-12 right-20 h-3 w-3 text-[#E8753C]/20 sm:bottom-10 sm:right-36 sm:h-4 sm:w-4" />
        </div>

        {/* DECORATIVE VOUCHER — DESKTOP */}
        <div className="pointer-events-none absolute right-10 top-6 hidden select-none sm:block">
          <div className="relative rotate-[9deg]">
            <div className="flex h-[76px] w-[96px] items-center justify-center rounded-[18px] border border-white/70 bg-gradient-to-br from-[#FF9B43] to-[#F36A20] shadow-[0_12px_25px_rgba(222,99,32,0.2)]">
              <Percent
                className="h-12 w-12 text-white"
                strokeWidth={2.5}
              />
            </div>
            <Sparkles className="absolute -right-4 -top-4 h-5 w-5 text-[#FF8B2D]" />
            <Gift className="absolute -bottom-6 -right-4 h-10 w-10 text-[#E8753C]" />
          </div>
        </div>

        {/* HEADING */}
        <div className="relative z-10 flex items-end justify-between gap-2 sm:pr-32">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-[#C45125]">
              <Sparkles size={11} strokeWidth={1.8} />
              <p className="text-[8px] font-semibold uppercase tracking-[0.18em] sm:text-[10px] sm:tracking-[0.2em]">
                Special Offers
              </p>
            </div>

            <h2 className="mt-1 font-display text-[22px] leading-tight tracking-[-0.035em] text-[#29251F] sm:text-[31px]">
              Voucher độc quyền
            </h2>

            <p className="mt-1 text-[10px] leading-4 text-[#82766A] sm:text-[13px] sm:leading-5">
              Lưu mã để sử dụng khi thanh toán.
            </p>
          </div>

          <span className="shrink-0 pb-1 text-[9px] text-[#8C8177] sm:text-[10px]">
            {vouchers.length} ưu đãi
          </span>
        </div>

        {/* VOUCHER CARDS */}
        <div className="relative z-10 mt-3 grid grid-cols-1 gap-2 sm:mt-5 sm:grid-cols-2 sm:gap-3">
          {visibleVouchers.map((voucher) => {
            const Icon = getVoucherIcon(voucher.type);
            const isCopied = copiedCode === voucher.code;
            const isFreeShip =
              getNormalizedType(voucher.type) === "freeship";

            return (
              <article
                key={voucher.id}
                className="
                  group relative min-w-0 overflow-hidden
                  rounded-xl sm:rounded-[17px]
                  border border-white/90 bg-white/95
                  shadow-[0_3px_10px_rgba(105,73,45,0.05)]
                  transition duration-300
                  hover:border-[#F4C5A7]
                  hover:shadow-[0_8px_20px_rgba(105,73,45,0.08)]
                "
              >
                {/* Main information */}
                <div className="flex items-center gap-2.5 p-2.5 sm:gap-3 sm:p-3.5">
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl sm:h-11 sm:w-11 ${
                      isFreeShip
                        ? "bg-[#FFF0E3] text-[#E8753C]"
                        : "bg-[#F8F0E7] text-[#A66B45]"
                    }`}
                  >
                    <Icon size={19} strokeWidth={1.7} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                      <p className="truncate font-mono text-[9px] font-semibold text-[#34312D] sm:text-[11px]">
                        {voucher.code}
                      </p>

                      <span className="shrink-0 rounded-full bg-[#EEF2E9] px-1.5 py-[2px] text-[7px] font-semibold uppercase text-[#5B6B54] sm:py-[3px] sm:text-[8px]">
                        {isFreeShip ? "Free ship" : "Offer"}
                      </span>
                    </div>

                    <h3 className="mt-0.5 truncate text-[11px] font-semibold text-[#302B26] sm:mt-1 sm:text-[13px]">
                      {getVoucherTitle(voucher)}
                    </h3>

                    <p className="mt-0.5 truncate text-[9px] text-[#8B8178] sm:text-[11px]">
                      {getVoucherDescription(voucher)}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSaveVoucher(voucher)}
                    aria-label={`Lưu voucher ${voucher.code}`}
                    className={`inline-flex h-7 shrink-0 items-center justify-center gap-1 rounded-full px-2.5 text-[9px] font-semibold transition active:scale-[0.97] sm:h-9 sm:gap-1.5 sm:px-4 sm:text-[11px] ${
                      isCopied
                        ? "bg-[#EEF3E9] text-[#566C50]"
                        : "bg-[#F36B21] text-white shadow-sm hover:bg-[#DF5D19]"
                    }`}
                  >
                    {isCopied ? (
                      <>
                        <Check size={11} strokeWidth={2} />
                        <span>Đã lưu</span>
                      </>
                    ) : (
                      <>
                        <Copy size={11} strokeWidth={1.9} />
                        <span>Lưu mã</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Ticket separator */}
                <div className="relative mx-2.5 border-t border-dashed border-[#EAD9C9] sm:mx-3.5">
                  <span className="absolute -left-[17px] -top-[6px] h-3 w-3 rounded-full bg-[#FFF0E2]" />
                  <span className="absolute -right-[17px] -top-[6px] h-3 w-3 rounded-full bg-[#FFF0E2]" />
                </div>

                {/* Condition */}
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3.5 sm:py-2">
                  <span className="shrink-0 text-[8px] font-semibold uppercase tracking-[0.06em] text-[#C17A50] sm:text-[9px]">
                    Điều kiện
                  </span>
                  <span className="truncate text-[9px] text-[#776B60] sm:text-[11px]">
                    {getVoucherDescription(voucher)}
                  </span>
                </div>
              </article>
            );
          })}
        </div>

        {/* SHOW MORE */}
        {vouchers.length > 2 && (
          <div className="relative z-10 mt-3 flex justify-center sm:mt-5">
            <button
              type="button"
              onClick={() => setShowAll((current) => !current)}
              className="inline-flex h-8 items-center justify-center gap-1.5 rounded-full border border-[#F0CDB5] bg-white/85 px-4 text-[10px] font-medium text-[#55483D] transition hover:border-[#E8753C] hover:bg-white active:scale-[0.98] sm:h-9 sm:gap-2 sm:px-5 sm:text-[11px]"
            >
              {showAll
                ? "Thu gọn"
                : `Xem thêm ${remainingCount} voucher`}

              <ChevronDown
                className={`h-3 w-3 text-[#C66A3C] transition-transform duration-200 sm:h-3.5 sm:w-3.5 ${
                  showAll ? "rotate-180" : ""
                }`}
                strokeWidth={1.8}
              />
            </button>
          </div>
        )}

        {showAll && (
          <p className="relative z-10 mt-2 text-center text-[9px] text-[#9A897A] sm:mt-3 sm:text-[10px]">
            Đang hiển thị {vouchers.length} ưu đãi
          </p>
        )}
      </div>
    </section>
  );
}
