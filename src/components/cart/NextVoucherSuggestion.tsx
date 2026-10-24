import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  TicketPercent,
  Flame,
  Lightbulb,
  ArrowRight,
  Check,
  Copy,
  Truck,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { formatVND } from "@/lib/format";

interface Props {
  subtotal: number;
}

interface Voucher {
  id: string;
  title: string;
  code?: string | null;
  type: string;
  value: number;
  min_order: number;
  max_discount: number;
  active: boolean;
  start_at: string;
  end_at: string;
  quantity: number;
  used: number;
  max_uses?: number | null;
  used_count?: number | null;
}

function getVoucherSavingText(voucher: Voucher) {
  const value = Number(voucher.value || 0);
  const maxDiscount = Number(voucher.max_discount || 0);

  if (voucher.type === "percent" || voucher.type === "discount_percent") {
    return `Giảm ${value}%${maxDiscount > 0 ? ` · Tối đa ${formatVND(maxDiscount)}` : ""}`;
  }
  if (voucher.type === "shipping" || voucher.type === "free_shipping") {
    return "Miễn phí vận chuyển";
  }
  return `Giảm ${formatVND(value)}`;
}

function getVoucherHeadline(voucher: Voucher) {
  if (voucher.type === "shipping" || voucher.type === "free_shipping") {
    return "MIỄN PHÍ SHIP";
  }
  if (voucher.type === "percent" || voucher.type === "discount_percent") {
    return `GIẢM ${Number(voucher.value)}%`;
  }
  return `GIẢM ${formatVND(Number(voucher.value || 0))}`;
}

export default function NextVoucherSuggestion({ subtotal }: Props) {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadVouchers() {
      setLoading(true);
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from("vouchers")
        .select("*")
        .eq("active", true)
        .eq("is_personal", false)
        .lte("start_at", now)
        .gte("end_at", now)
        .order("min_order", { ascending: true });

      if (error) {
        console.error("LOAD VOUCHERS ERROR:", error);
        if (!cancelled) {
          setVouchers([]);
          setLoading(false);
        }
        return;
      }

      const validVouchers = ((data ?? []) as Voucher[]).filter((voucher) => {
        if (voucher.max_uses == null) return true;
        return Number(voucher.used_count || 0) < Number(voucher.max_uses);
      });

      if (!cancelled) {
        setVouchers(validVouchers);
        setLoading(false);
      }
    }

    void loadVouchers();
    return () => {
      cancelled = true;
    };
  }, []);

  const voucherData = useMemo(() => {
    return vouchers.map((voucher) => {
      const minOrder = Number(voucher.min_order || 0);
      const eligible = subtotal >= minOrder;
      const remaining = Math.max(0, minOrder - subtotal);
      const progress = minOrder > 0 ? Math.min(100, (subtotal / minOrder) * 100) : 100;
      return { voucher, minOrder, eligible, remaining, progress };
    });
  }, [vouchers, subtotal]);

  const eligibleVouchers = voucherData.filter((item) => item.eligible);
  const lockedVouchers = voucherData.filter((item) => !item.eligible);
  const visibleEligible = showAll ? eligibleVouchers : eligibleVouchers.slice(0, 2);
  const visibleLocked = showAll ? lockedVouchers : lockedVouchers.slice(0, 2);

  async function copyCode(code?: string | null) {
    if (!code) {
      toast.info("Voucher sẽ được chọn tại bước thanh toán.");
      return;
    }
    try {
      await navigator.clipboard.writeText(code);
      toast.success("Đã sao chép mã voucher", { description: code });
    } catch {
      toast.error("Không thể sao chép mã. Vui lòng thử lại.");
    }
  }

  if (!loading && vouchers.length === 0) return null;

  return (
    <section className="relative mt-5 overflow-hidden rounded-[20px] border border-[#EEE6DA] bg-[linear-gradient(145deg,#FBF9F5_0%,#F7F3EB_52%,#FBF8F2_100%)] p-3.5 shadow-[0_8px_24px_rgba(70,56,36,0.045)] sm:p-5">
      {/* Subtle Olive Living ornament: concentrated at the edges so the cards stay clear */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="absolute -right-12 -top-14 h-44 w-44 rounded-full border border-[#B9A17F]/25" />
        <div className="absolute -right-7 -top-7 h-32 w-32 rounded-full border border-[#B9A17F]/20" />
        <div className="absolute -right-1 -top-1 h-20 w-20 rounded-full border border-[#B9A17F]/15" />
        <div className="absolute -bottom-10 -left-10 h-36 w-36 rounded-full border border-[#B9A17F]/20" />
        <div className="absolute -bottom-5 -left-5 h-24 w-24 rounded-full border border-[#B9A17F]/15" />
        <svg viewBox="0 0 120 120" className="absolute bottom-3 right-3 h-12 w-12 text-[#A88D68]/20" fill="none">
          <path d="M24 18h52a7 7 0 0 1 7 7v12a8 8 0 0 0 0 16v12a7 7 0 0 1-7 7H24a7 7 0 0 1-7-7V53a8 8 0 0 0 0-16V25a7 7 0 0 1 7-7Z" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" />
          <path d="m40 34 23 23m0-23L40 57" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(251,249,245,0.18),transparent_32%,transparent_70%,rgba(251,249,245,0.22))]" />
      </div>
      <div className="relative z-10">
      <div className="mb-3.5 flex items-center justify-between gap-3 px-0.5">
        <div className="min-w-0">
          <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#A07850]">
            Ưu đãi hôm nay
          </p>
          <h3 className="mt-1 text-[15px] font-semibold tracking-[-0.025em] text-[#272821] sm:text-base">
            Voucher dành cho bạn
          </h3>
          <p className="mt-1 text-[11px] leading-4 text-[#858174]">
            Ưu đãi phù hợp với giỏ hàng hiện tại
          </p>
        </div>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-[#9A7957] shadow-[0_2px_10px_rgba(58,46,29,0.05)]">
          <TicketPercent className="h-4 w-4" strokeWidth={1.7} />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {[0, 1].map((item) => (
            <div key={item} className="h-[104px] animate-pulse rounded-2xl bg-white" />
          ))}
        </div>
      ) : (
        <>
          {eligibleVouchers.length > 0 && (
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {visibleEligible.map(({ voucher }) => (
                <article key={voucher.id} className="relative min-w-0 overflow-hidden rounded-2xl bg-white p-3.5 shadow-[0_2px_12px_rgba(56,44,27,0.035)] ring-1 ring-[#EDE6DC]">
                  <div className="flex items-start gap-2.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F6F0E7] text-[#98744F]">
                      {voucher.type === "shipping" || voucher.type === "free_shipping" ? <Truck className="h-4 w-4" strokeWidth={1.7} /> : <TicketPercent className="h-4 w-4" strokeWidth={1.7} />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[10px] font-bold tracking-[0.08em] text-[#9A7957]">{getVoucherHeadline(voucher)}</div>
                      <p className="mt-1 line-clamp-2 text-[12px] font-semibold leading-4 text-[#303027]">{voucher.title || getVoucherSavingText(voucher)}</p>
                      <p className="mt-1 text-[10px] text-[#898477]">Đơn từ {formatVND(Number(voucher.min_order || 0))}</p>
                    </div>
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#EEF4E9] px-2 py-1 text-[9px] font-semibold text-[#5D7650]"><Check className="h-3 w-3" /> Sẵn sàng</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-2 border-t border-dashed border-[#E9E1D6] pt-2.5">
                    <span className="min-w-0 truncate font-mono text-[10px] font-semibold tracking-wide text-[#66533E]">{voucher.code || "Áp dụng tại thanh toán"}</span>
                    <button type="button" onClick={() => void copyCode(voucher.code)} className="checkout-mirror-button h-7 shrink-0 gap-1.5 px-3 text-[10px] font-semibold tracking-wide active:scale-[0.98]">
                      {voucher.code ? <><Copy className="h-3 w-3" /> Sao chép</> : "Chi tiết"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}

          {lockedVouchers.length > 0 && (
            <div className={eligibleVouchers.length > 0 ? "mt-3.5" : ""}>
              <div className="mb-2 flex items-center gap-1.5 px-0.5">
                <Sparkles className="h-3.5 w-3.5 text-[#A07850]" />
                <p className="text-[10px] font-semibold text-[#777164]">Mua thêm để mở khóa ưu đãi</p>
              </div>
              <div className="space-y-2">
                {visibleLocked.map(({ voucher, minOrder, remaining, progress }) => (
                  <article key={voucher.id} className="rounded-xl bg-white/80 px-3.5 py-3 ring-1 ring-[#EEE8DF]">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F3EFE8] text-[#A18B70]"><TicketPercent className="h-3.5 w-3.5" strokeWidth={1.7} /></div>
                        <div className="min-w-0">
                          <p className="truncate text-[11px] font-semibold text-[#37372F]">{voucher.title || getVoucherHeadline(voucher)}</p>
                          <p className="mt-0.5 text-[10px] text-[#8A8579]">Đơn từ {formatVND(minOrder)}</p>
                        </div>
                      </div>
                      <span className="shrink-0 text-right text-[10px] font-semibold text-[#A07850]">Thiếu {formatVND(remaining)}</span>
                    </div>
                    <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-[#EEEAE3]"><div className="h-full rounded-full bg-[#B39A79] transition-all duration-500" style={{ width: `${progress}%` }} /></div>
                  </article>
                ))}
              </div>
            </div>
          )}

          {eligibleVouchers.length + lockedVouchers.length > 2 && (
            <button type="button" onClick={() => setShowAll((value) => !value)} className="mx-auto mt-3.5 flex h-9 items-center justify-center gap-2 rounded-full border border-[#E5DCCF] bg-white px-4 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#6E6659] transition hover:border-[#BDA88D] hover:text-[#40392F]">
              {showAll ? "Thu gọn voucher" : "Xem thêm voucher"}
              <ArrowRight className={`h-3.5 w-3.5 transition-transform ${showAll ? "-rotate-90" : "rotate-90"}`} />
            </button>
          )}

          {eligibleVouchers.length > 0 && (
            <p className="mt-3 flex items-start gap-1.5 px-0.5 text-[10px] leading-4 text-[#8A8579]">
              <Lightbulb className="mt-0.5 h-3 w-3 shrink-0 text-[#A78A64]" />
              Voucher được áp dụng ở bước thanh toán. Hệ thống sẽ kiểm tra điều kiện trước khi áp dụng.
            </p>
          )}
          {eligibleVouchers.length === 0 && lockedVouchers.length > 0 && (
            <Link to="/shop" className="mt-3 flex h-10 items-center justify-center gap-2 rounded-xl bg-[#292B24] text-[11px] font-semibold text-white transition hover:bg-[#47483F]">
              Chọn thêm sản phẩm <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </>
      )}
      </div>
    </section>
  );
}
