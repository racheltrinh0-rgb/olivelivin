import { useEffect, useState } from "react";
import {
  ArrowRight,
  Check,
  Copy,
  Gift,
  Flame,
  TicketPercent,
  Truck,
  Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const ICONS = {
  gift: Gift,
  truck: Truck,
  ticket: TicketPercent,
  percent: TicketPercent,
};

function getVoucherIcon(voucher: any) {
  const text = [
    voucher.code,
    voucher.title,
    voucher.description,
    voucher.badge,
    voucher.event_type,
    voucher.type,
    voucher.icon,
  ].filter(Boolean).join(" ").toLowerCase();

  // Shipping-related vouchers always use a truck icon.
  if (/free\s?ship|freeship|shipping|ship\s?fee|ph[ií]\s?v[aậ]n\s?chuy[eể]n|giao\s?h[aà]ng|h[oỏ]a\s?t[oố]c/.test(text)) {
    return Truck;
  }

  if (voucher.type === "percent" || /\b\d+\s?%|gi[aả]m\s?\d+\s?%/.test(text)) {
    return TicketPercent;
  }

  return ICONS[voucher.icon as keyof typeof ICONS] ?? Gift;
}

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

export default function Vouchers() {
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [savedCodes, setSavedCodes] = useState<string[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void loadVouchers();

    try {
      const saved = JSON.parse(localStorage.getItem("olive_vouchers") || "[]");
      setSavedCodes(saved.map((voucher: any) => voucher.code));
    } catch {
      setSavedCodes([]);
    }
  }, []);

  async function loadVouchers() {
    setLoading(true);
    const now = Date.now();
    const { data, error } = await supabase
      .from("vouchers")
      .select("*")
      .eq("active", true)
      .eq("show_home", true)
      .order("start_at", { ascending: true });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    const available = (data ?? []).filter((voucher) => {
      if (!voucher.start_at || !voucher.end_at) return false;
      const start = new Date(voucher.start_at).getTime();
      const end = new Date(voucher.end_at).getTime();
      return !Number.isNaN(start) && !Number.isNaN(end) && end > now && start <= end;
    });

    available.sort((a, b) => {
      const aBF = isBlackFriday(a) ? 1 : 0;
      const bBF = isBlackFriday(b) ? 1 : 0;
      if (aBF !== bBF) return bBF - aBF;
      const aStarted = new Date(a.start_at).getTime() <= now;
      const bStarted = new Date(b.start_at).getTime() <= now;
      if (aStarted !== bStarted) return aStarted ? -1 : 1;
      return new Date(a.start_at).getTime() - new Date(b.start_at).getTime();
    });

    setVouchers(available);
    setLoading(false);
  }

  function isBlackFriday(voucher: any) {
    const text = `${voucher.code || ""} ${voucher.title || ""} ${voucher.description || ""} ${voucher.badge || ""} ${voucher.event_type || ""}`.toLowerCase();
    return voucher.event_type === "black_friday" || ["black friday", "black_friday", "black-friday", "blackfriday", "bf2026"].some((term) => text.includes(term));
  }

  function isUpcoming(voucher: any) {
    if (!voucher.start_at || !voucher.end_at) return false;
    const now = Date.now();
    const start = new Date(voucher.start_at).getTime();
    const end = new Date(voucher.end_at).getTime();
    return !Number.isNaN(start) && !Number.isNaN(end) && start > now && end > now;
  }

  function formatDiscount(voucher: any) {
    if (voucher.type === "percent") return `${voucher.value}%`;
    if (voucher.type === "fixed") return `${Number(voucher.value).toLocaleString("vi-VN")}đ`;
    return "FREE";
  }

  function saveVoucher(voucher: any) {
    let saved: any[] = [];
    try {
      saved = JSON.parse(localStorage.getItem("olive_vouchers") || "[]");
    } catch {
      saved = [];
    }

    if (saved.some((item) => item.code === voucher.code)) {
      toast.info("Voucher đã được lưu");
      return;
    }

    saved.push({ code: voucher.code });
    localStorage.setItem("olive_vouchers", JSON.stringify(saved));
    setSavedCodes(saved.map((item) => item.code));
    toast.success("Đã lưu voucher");
  }

  async function copyCode(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      toast.success(`Đã sao chép mã ${code}`);
    } catch {
      toast.error("Không thể sao chép mã. Vui lòng thử lại.");
    }
  }

  const visibleVouchers = showAll ? vouchers : vouchers.slice(0, 2);
  const hiddenVoucherCount = Math.max(0, vouchers.length - 2);

  return (
    <section className="relative overflow-hidden bg-[#F4F1EB] py-5 sm:py-9 lg:py-[60px]">
      <div className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-[#E7DED0]/55 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 -left-20 h-64 w-64 rounded-full bg-white/70 blur-3xl" />

      <div className="container-x relative z-10">
        {/* New editorial header */}
        <div className="mx-auto mb-4 max-w-3xl text-center sm:mb-7">
          <div className="mx-auto mb-2 inline-flex items-center gap-1.5 rounded-full border border-[#DCD3C6] bg-white/60 px-2.5 py-1 text-[7px] font-semibold uppercase tracking-[0.16em] text-[#837666] sm:mb-3 sm:px-3 sm:py-1.5 sm:text-[9px]">
            <Sparkles size={11} strokeWidth={1.6} />
            Olive Living · Member perks
          </div>
          <h2 className="font-display text-[22px] font-normal leading-[1.12] tracking-[-0.035em] text-[#302D27] sm:text-[32px] lg:text-[40px]">
            Good things, just for you.
          </h2>
          <p className="mx-auto mt-1.5 max-w-md text-[10px] leading-[1.45] text-[#81796F] sm:mt-3 sm:text-[13px]">
            Ưu đãi dành riêng cho những không gian bạn yêu thích.
          </p>
          <Link
            to="/voucher-register"
            className="group mx-auto mt-3 inline-flex h-8 items-center justify-center gap-1.5 rounded-full bg-[#33382D] px-3.5 text-[8px] font-medium text-white transition hover:bg-[#4A5141] active:scale-[0.98] sm:mt-5 sm:h-10 sm:gap-2 sm:px-5 sm:text-[10px]"
          >
            <Gift size={11} strokeWidth={1.6} />
            Khám phá ưu đãi thành viên
            <ArrowRight size={10} className="transition-transform group-hover:translate-x-0.5 sm:h-3 sm:w-3" />
          </Link>
        </div>

        {/* Premium marketplace voucher cards */}
        {loading ? (
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-3 sm:grid-cols-2">
            {[0, 1].map((item) => (
              <div key={item} className="h-[158px] animate-pulse rounded-2xl border border-[#F0E5DE] bg-white" />
            ))}
          </div>
        ) : visibleVouchers.length > 0 ? (
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
            {visibleVouchers.map((voucher, index) => {
              const blackFriday = isBlackFriday(voucher);
              const upcoming = isUpcoming(voucher);
              const saved = savedCodes.includes(voucher.code);
              const Icon = getVoucherIcon(voucher);
              const remaining = Math.max(0, Number(voucher.quantity || 0) - Number(voucher.used || 0));
              const voucherText = `${voucher.code || ""} ${voucher.title || ""} ${voucher.description || ""}`.toLowerCase();
              const isShipping = /free\s?ship|freeship|shipping|ship\s?fee|ph[ií]\s?v[aậ]n\s?chuy[eể]n|giao\s?h[aà]ng|h[oỏ]a\s?t[oố]c/.test(voucherText);
              const discount = formatDiscount(voucher);

              return (
                <motion.article
                  key={voucher.code}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.24, delay: index * 0.04 }}
                  className="group relative isolate overflow-hidden rounded-2xl border border-[#F0D8CD] bg-white shadow-[0_5px_18px_rgba(100,55,35,0.045)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#F2A184] hover:shadow-[0_12px_28px_rgba(100,55,35,0.10)]"
                >
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-[#F9A58B] via-[#EE4D2D] to-[#FFC5A9]" />
                  <div className="flex min-h-[154px] sm:min-h-[164px]">
                    {/* Discount ticket */}
                    <div className="relative flex w-[108px] shrink-0 flex-col items-center justify-center overflow-hidden border-r border-dashed border-[#F0C7B7] bg-gradient-to-br from-[#FFF5EF] via-[#FFF0E8] to-[#FCE5DA] px-2 py-4 text-center sm:w-[126px]">
                      <div className="absolute -left-[10px] top-1/2 h-5 w-5 -translate-y-1/2 rounded-full border-r border-[#F0D8CD] bg-[#F4F1EB]" />
                      <div className="absolute -right-[10px] top-1/2 h-5 w-5 -translate-y-1/2 rounded-full border-l border-[#F0D8CD] bg-white" />
                      <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-2xl bg-white text-[#EE4D2D] shadow-[0_3px_10px_rgba(238,77,45,0.10)] ring-1 ring-white">
                        {blackFriday ? <Flame size={16} strokeWidth={1.8} /> : isShipping ? <Truck size={16} strokeWidth={1.8} /> : <Icon size={16} strokeWidth={1.8} />}
                      </div>
                      <span className="text-[7px] font-bold uppercase tracking-[0.15em] text-[#C75A3C] sm:text-[8px]">
                        {isShipping ? "Freeship" : voucher.type === "percent" ? "Ưu đãi %" : blackFriday ? "Hot deal" : "Voucher"}
                      </span>
                      <p
                        className={`mt-1.5 w-full break-words font-bold leading-[0.95] tracking-[-0.055em] text-[#E94B2B] ${
                          discount.length >= 8
                            ? "text-[13px] sm:text-[16px]"
                            : discount.length >= 6
                              ? "text-[17px] sm:text-[21px]"
                              : "text-[25px] sm:text-[29px]"
                        }`}
                        title={discount}
                      >
                        {discount}
                      </p>
                      <span className="mt-2 rounded-full border border-[#F2C7B6] bg-white/70 px-2 py-0.5 text-[7px] font-medium text-[#A86A55]">
                        Dành cho bạn
                      </span>
                    </div>

                    {/* Voucher details */}
                    <div className="flex min-w-0 flex-1 flex-col justify-between p-3.5 sm:p-4">
                      <div className="min-w-0">
                        <div className="flex min-w-0 items-start gap-2">
                          <h3 className="min-w-0 flex-1 break-words text-[13px] font-semibold leading-[1.3] text-[#2F2925] sm:text-[15px]">
                            {voucher.title || (blackFriday ? "Ưu đãi đặc biệt" : "Voucher dành cho bạn")}
                          </h3>
                          {blackFriday ? (
                            <span className="shrink-0 rounded-md bg-[#FFF0E8] px-1.5 py-1 text-[7px] font-bold uppercase tracking-[0.08em] text-[#E94B2B]">Hot</span>
                          ) : voucher.badge ? (
                            <span className="shrink-0 rounded-md px-1.5 py-1 text-[7px] font-semibold text-white" style={{ backgroundColor: voucher.badge_color || "#EE4D2D" }}>{voucher.badge}</span>
                          ) : null}
                        </div>
                        <p className="mt-1.5 line-clamp-2 text-[10px] leading-[1.5] text-[#756B64] sm:text-[11px]">
                          {voucher.description || "Ưu đãi đặc biệt dành riêng cho đơn hàng của bạn."}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          <span className="rounded-md bg-[#F8F5F1] px-2 py-1 text-[8px] text-[#76695F]">
                            Đơn tối thiểu <strong className="font-semibold text-[#41372F]">{Number(voucher.min_order || 0).toLocaleString("vi-VN")}đ</strong>
                          </span>
                          {remaining > 0 && remaining <= 50 ? (
                            <span className="rounded-md bg-[#FFF1E9] px-2 py-1 text-[8px] font-medium text-[#D95635]">Còn {remaining} mã</span>
                          ) : null}
                        </div>
                      </div>

                      <div className="mt-3 flex min-w-0 items-end justify-between gap-2 border-t border-dashed border-[#EDE3DC] pt-2.5">
                        <div className="min-w-0">
                          <button
                            type="button"
                            onClick={() => void copyCode(voucher.code)}
                            className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-[#F0C8B8] bg-[#FFF8F4] px-2.5 py-1.5 text-[8px] font-bold tracking-[0.035em] text-[#D94B2A] transition hover:border-[#EE4D2D] hover:bg-[#FFF0E8] sm:text-[9px]"
                            aria-label={`Sao chép mã ${voucher.code}`}
                          >
                            <span className="truncate">{voucher.code}</span>
                            <Copy size={10} className="shrink-0" />
                          </button>
                          <p className="mt-1 text-[7px] text-[#9A9089] sm:text-[8px]">
                            {upcoming ? `Bắt đầu ${formatDate(voucher.start_at)}` : `HSD ${formatDate(voucher.end_at)}`}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => saveVoucher(voucher)}
                          disabled={saved}
                          className={`inline-flex h-8 shrink-0 items-center justify-center gap-1 rounded-lg px-3.5 text-[9px] font-semibold transition sm:h-9 sm:px-4 sm:text-[10px] ${saved ? "border border-[#DCE7D6] bg-[#F1F7ED] text-[#58734A]" : "bg-gradient-to-r from-[#F05A37] to-[#E94727] text-white shadow-[0_3px_8px_rgba(238,77,45,0.18)] hover:from-[#DF4828] hover:to-[#D83D20] active:scale-[0.98]"}`}
                        >
                          {saved ? <><Check size={11} /> Đã lưu</> : "Lưu mã"}
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>
        ) : (
          <div className="mx-auto max-w-lg rounded-2xl border border-dashed border-[#E6CFC3] bg-white px-5 py-8 text-center">
            <TicketPercent className="mx-auto text-[#EE4D2D]" size={24} strokeWidth={1.4} />
            <p className="mt-3 text-sm text-[#514B43]">Hiện chưa có ưu đãi nào.</p>
            <p className="mt-1 text-xs text-[#8B8379]">Quay lại sau để khám phá các ưu đãi mới nhé.</p>
          </div>
        )}

        {hiddenVoucherCount > 0 && !loading && (
          <div className="mt-3 flex justify-center sm:mt-7">
            <button
              type="button"
              onClick={() => setShowAll((value) => !value)}
              className="group inline-flex h-8 items-center gap-1.5 rounded-full border border-[#D8D0C4] bg-white/50 px-3.5 text-[8px] font-semibold uppercase tracking-[0.1em] text-[#71695E] transition hover:border-[#BDB09F] hover:bg-white sm:h-9 sm:gap-2 sm:px-4 sm:text-[9px] sm:tracking-[0.12em]"
            >
              {showAll ? "Thu gọn ưu đãi" : `Xem thêm ${hiddenVoucherCount} ưu đãi`}
              <ArrowRight size={12} className={`transition-transform ${showAll ? "rotate-180" : "group-hover:translate-x-0.5"}`} />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
