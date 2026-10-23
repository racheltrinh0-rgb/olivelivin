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
    <section className="relative overflow-hidden bg-[#F4F1EB] py-3 sm:py-9 lg:py-[60px]">
      <div className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-[#E7DED0]/55 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 -left-20 h-64 w-64 rounded-full bg-white/70 blur-3xl" />

      {/* Harmonized promotional motifs: ticket outlines, tiny stars and confetti behind content */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden text-[#B79A7D]/25" aria-hidden="true">
        <svg className="absolute left-[2%] top-[15%] h-[132px] w-[94px] sm:left-[5%] sm:top-[13%] sm:h-[190px] sm:w-[132px]" viewBox="0 0 132 190" fill="none">
          <path d="M18 20H105V68C97 68 92 74 92 81C92 88 97 94 105 94V170H18V94C26 94 31 88 31 81C31 74 26 68 18 68V20Z" stroke="currentColor" strokeWidth="1.1" strokeDasharray="3 4"/>
          <path d="M38 43L41 50L48 53L41 56L38 63L35 56L28 53L35 50L38 43Z" stroke="currentColor" strokeWidth="1"/>
          <path d="M75 112L78 119L85 122L78 125L75 132L72 125L65 122L72 119L75 112Z" stroke="currentColor" strokeWidth="1"/>
          <circle cx="66" cy="81" r="10" stroke="currentColor" strokeDasharray="2 3"/>
          <path d="M45 145H78" stroke="currentColor" strokeWidth="1" strokeDasharray="2 4"/>
          <circle cx="22" cy="12" r="2" fill="currentColor"/>
          <circle cx="112" cy="154" r="2" fill="currentColor"/>
        </svg>
        <svg className="absolute right-[2%] top-[16%] h-[128px] w-[92px] sm:right-[4%] sm:top-[14%] sm:h-[184px] sm:w-[128px]" viewBox="0 0 128 184" fill="none">
          <path d="M22 16H108V62C100 62 95 68 95 75C95 82 100 88 108 88V164H22V88C30 88 35 82 35 75C35 68 30 62 22 62V16Z" stroke="currentColor" strokeWidth="1.1" strokeDasharray="3 4"/>
          <path d="M77 35L80 42L87 45L80 48L77 55L74 48L67 45L74 42L77 35Z" stroke="currentColor" strokeWidth="1"/>
          <path d="M49 111L52 118L59 121L52 124L49 131L46 124L39 121L46 118L49 111Z" stroke="currentColor" strokeWidth="1"/>
          <circle cx="65" cy="75" r="10" stroke="currentColor" strokeDasharray="2 3"/>
          <path d="M48 143H83" stroke="currentColor" strokeWidth="1" strokeDasharray="2 4"/>
          <circle cx="14" cy="145" r="2" fill="currentColor"/>
          <circle cx="112" cy="10" r="2" fill="currentColor"/>
        </svg>
        <svg className="absolute bottom-[2%] left-[5%] h-[42px] w-[164px] sm:bottom-[3%] sm:left-[9%] sm:h-[58px] sm:w-[214px]" viewBox="0 0 214 58" fill="none">
          <path d="M4 40C36 12 73 13 107 34C142 55 179 51 210 17" stroke="currentColor" strokeWidth="1" strokeDasharray="2 5"/>
          <path d="M107 25L111 31L118 34L111 37L107 43L103 37L96 34L103 31L107 25Z" stroke="currentColor" strokeWidth="1"/>
          <circle cx="34" cy="14" r="2" fill="currentColor"/>
          <circle cx="183" cy="44" r="2" fill="currentColor"/>
        </svg>
      </div>

      <div className="container-x relative z-10">
        {/* New editorial header */}
        <div className="mx-auto mb-3 max-w-3xl text-center sm:mb-7">
          <div className="mx-auto mb-1.5 inline-flex items-center gap-1.5 rounded-full border border-[#DCD3C6] bg-white/60 px-2.5 py-1 text-[7px] font-semibold uppercase tracking-[0.16em] text-[#837666] sm:mb-3 sm:px-3 sm:py-1.5 sm:text-[9px]">
            <Sparkles size={11} strokeWidth={1.6} />
            Olive Living · Member perks
          </div>
          <h2 className="font-display text-[19px] font-normal leading-[1.1] tracking-[-0.035em] text-[#302D27] sm:text-[32px] lg:text-[40px]">
            Good things, just for you.
          </h2>
          <p className="mx-auto mt-1 max-w-md text-[9px] leading-[1.4] text-[#81796F] sm:mt-3 sm:text-[13px]">
            Ưu đãi dành riêng cho những không gian bạn yêu thích.
          </p>
          <Link
            to="/voucher-register"
            className="group mx-auto mt-2.5 inline-flex h-7 items-center justify-center gap-1.5 rounded-full bg-[#4D5745] px-3.5 text-[8px] font-medium text-white transition hover:bg-[#4A5141] active:scale-[0.98] sm:mt-5 sm:h-10 sm:gap-2 sm:px-5 sm:text-[10px]"
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
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-4">
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
                  className="group relative isolate overflow-hidden rounded-[18px] border border-[#EAE1D5] bg-[#FFFEFC] shadow-[0_5px_18px_rgba(54,45,34,0.07)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#D8C8B5] hover:shadow-[0_12px_28px_rgba(54,45,34,0.12)]"
                >
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-[#D8B99D] via-[#B98561] to-[#E9D8C5]" />
                  <div className="flex min-h-[118px] sm:min-h-[164px]">
                    {/* Discount ticket */}
                    <div className="relative flex w-[30%] min-w-[88px] shrink-0 flex-col items-center justify-center overflow-hidden border-r border-dashed border-[#E6D5C4] bg-gradient-to-br from-[#F7F1E8] via-[#F3EADF] to-[#EDE1D2] px-2 py-2 text-center sm:w-[126px] sm:min-w-0 sm:px-2 sm:py-4">
                      <div className="absolute -left-[10px] top-1/2 h-5 w-5 -translate-y-1/2 rounded-full border-r border-[#E6D5C4] bg-[#F4F1EB]" />
                      <div className="absolute -right-[10px] top-1/2 h-5 w-5 -translate-y-1/2 rounded-full border-l border-[#E6D5C4] bg-[#FFFEFC]" />
                      {/* Tiny, restrained promo confetti accents */}
                      <div className="pointer-events-none absolute bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-1 opacity-45" aria-hidden="true">
                        <span className="h-1 w-1 rounded-full bg-[#B98561]" />
                        <span className="h-1 w-1 rotate-45 border border-[#B98561]" />
                        <span className="h-1 w-1 rounded-full bg-[#B98561]" />
                      </div>
                      <div className="mb-1 flex h-7 w-7 items-center justify-center rounded-xl bg-white text-[#A97956] shadow-[0_3px_10px_rgba(54,45,34,0.08)] ring-1 ring-white sm:mb-2 sm:h-9 sm:w-9 sm:rounded-2xl">
                        {blackFriday ? <Flame size={16} strokeWidth={1.8} /> : isShipping ? <Truck size={16} strokeWidth={1.8} /> : <Icon size={16} strokeWidth={1.8} />}
                      </div>
                      <span className="text-[7px] font-bold uppercase tracking-[0.12em] text-[#8E7057] sm:text-[8px]">
                        {isShipping ? "Freeship" : voucher.type === "percent" ? "Ưu đãi %" : blackFriday ? "Hot deal" : "Voucher"}
                      </span>
                      <p
                        className={`mt-1 w-full whitespace-nowrap font-bold leading-none tracking-[-0.045em] text-[#9B6847] ${
                          discount.length >= 8
                            ? "text-[12px] sm:text-[16px]"
                            : discount.length >= 6
                              ? "text-[15px] sm:text-[21px]"
                               : "text-[22px] sm:text-[29px]"
                        }`}
                        title={discount}
                      >
                        {discount}
                      </p>
                      <span className="mt-1 rounded-full border border-[#E5D5C5] bg-white/75 px-1.5 py-0.5 text-[6px] font-medium text-[#8E7057] sm:mt-2 sm:px-2 sm:text-[7px]">
                        Dành cho bạn
                      </span>
                    </div>

                    {/* Voucher details */}
                    <div className="flex min-w-0 flex-1 flex-col justify-between p-2 sm:p-4">
                      <div className="min-w-0">
                        <div className="flex min-w-0 items-start gap-2">
                          <h3 className="min-w-0 flex-1 break-words text-[12px] font-bold leading-[1.3] text-[#34312B] sm:text-[15px]">
                            {voucher.title || (blackFriday ? "Ưu đãi đặc biệt" : "Voucher dành cho bạn")}
                          </h3>
                          {blackFriday ? (
                            <span className="shrink-0 rounded-md bg-[#FFF0E8] px-1.5 py-1 text-[7px] font-bold uppercase tracking-[0.08em] text-[#E94B2B]">Hot</span>
                          ) : voucher.badge ? (
                            <span className="shrink-0 rounded-md px-1.5 py-1 text-[7px] font-semibold text-white" style={{ backgroundColor: voucher.badge_color || "#EE4D2D" }}>{voucher.badge}</span>
                          ) : null}
                        </div>
                        <p className="mt-0.5 line-clamp-2 text-[8px] leading-[1.35] text-[#81776C] sm:mt-1.5 sm:text-[11px]">
                          {voucher.description || "Ưu đãi đặc biệt dành riêng cho đơn hàng của bạn."}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-1 sm:mt-2 sm:gap-1.5">
                          <span className="rounded-md bg-[#F5F1EA] px-1.5 py-1 text-[7px] text-[#76695F] sm:px-2 sm:text-[8px]">
                            Đơn tối thiểu <strong className="font-semibold text-[#41372F]">{Number(voucher.min_order || 0).toLocaleString("vi-VN")}đ</strong>
                          </span>
                          {remaining > 0 && remaining <= 50 ? (
                            <span className="rounded-md bg-[#FFF1E9] px-2 py-1 text-[8px] font-medium text-[#D95635]">Còn {remaining} mã</span>
                          ) : null}
                        </div>
                      </div>

                      <div className="mt-1.5 flex min-w-0 items-end justify-between gap-1.5 border-t border-dashed border-[#EDE3DC] pt-2 sm:mt-3 sm:gap-2 sm:pt-2.5">
                        <div className="min-w-0">
                          <button
                            type="button"
                            onClick={() => void copyCode(voucher.code)}
                            className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-[#E3D4C4] bg-[#F8F4EE] px-2 py-1.5 text-[7px] font-bold tracking-[0.025em] text-[#80634B] transition hover:border-[#B98561] hover:bg-[#F2E8DC] sm:px-2.5 sm:text-[9px]"
                            aria-label={`Sao chép mã ${voucher.code}`}
                          >
                            <span className="truncate">{voucher.code}</span>
                            <Copy size={10} className="shrink-0" />
                          </button>
                          <p className="mt-1 text-[6px] text-[#9A9089] sm:text-[8px]">
                            {upcoming ? `Bắt đầu ${formatDate(voucher.start_at)}` : `HSD ${formatDate(voucher.end_at)}`}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => saveVoucher(voucher)}
                          disabled={saved}
                          className={`relative isolate inline-flex h-7 shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full px-2.5 text-[8px] font-semibold backdrop-blur-xl transition-all duration-300 sm:h-9 sm:px-4 sm:text-[10px] ${
                            saved
                              ? "border border-[#DCE7D6]/80 bg-[#F1F7ED]/65 text-[#58734A] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_3px_10px_rgba(72,65,52,0.06)] before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-1/2 before:bg-gradient-to-b before:from-white/75 before:to-transparent"
                              : "border border-white/20 bg-[#4D5745]/90 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.32),0_4px_12px_rgba(55,64,48,0.18)] before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-1/2 before:bg-gradient-to-b before:from-white/30 before:to-transparent after:pointer-events-none after:absolute after:-left-1/2 after:top-[-35%] after:h-[170%] after:w-1/3 after:rotate-[22deg] after:bg-gradient-to-r after:from-transparent after:via-white/55 after:to-transparent after:opacity-0 after:transition-all after:duration-700 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_7px_18px_rgba(55,64,48,0.22)] hover:after:left-[130%] hover:after:opacity-100 active:scale-[0.97]"
                          }`}
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
          <div className="mt-2 flex justify-center sm:mt-7">
            <button
              type="button"
              onClick={() => setShowAll((value) => !value)}
              className="group relative isolate inline-flex h-8 items-center gap-1.5 overflow-hidden rounded-full border border-white/70 bg-white/35 px-3.5 text-[8px] font-semibold uppercase tracking-[0.1em] text-[#4D5745] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_4px_14px_rgba(72,65,52,0.08)] backdrop-blur-xl transition-all duration-300 before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-1/2 before:rounded-t-full before:bg-gradient-to-b before:from-white/80 before:to-white/5 after:pointer-events-none after:absolute after:-left-1/2 after:top-[-35%] after:h-[170%] after:w-1/3 after:rotate-[22deg] after:bg-gradient-to-r after:from-transparent after:via-white/70 after:to-transparent after:opacity-0 after:transition-all after:duration-700 hover:border-white hover:bg-white/55 hover:shadow-[inset_0_1px_0_rgba(255,255,255,1),0_7px_20px_rgba(72,65,52,0.12)] hover:after:left-[120%] hover:after:opacity-100 active:scale-[0.98] sm:h-9 sm:gap-2 sm:px-4 sm:text-[9px] sm:tracking-[0.12em]"
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
