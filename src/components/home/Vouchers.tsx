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
};

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

        {/* Coupon shelf */}
        {loading ? (
          <div className="mx-auto grid max-w-4xl grid-cols-1 gap-3 sm:grid-cols-2">
            {[0, 1].map((item) => (
              <div key={item} className="h-[138px] animate-pulse rounded-2xl border border-[#E5DED3] bg-white/65" />
            ))}
          </div>
        ) : visibleVouchers.length > 0 ? (
          <div className="mx-auto grid max-w-4xl grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-4">
            {visibleVouchers.map((voucher, index) => {
              const blackFriday = isBlackFriday(voucher);
              const upcoming = isUpcoming(voucher);
              const saved = savedCodes.includes(voucher.code);
              const Icon = ICONS[voucher.icon as keyof typeof ICONS] ?? Gift;
              const remaining = Math.max(0, Number(voucher.quantity || 0) - Number(voucher.used || 0));

              return (
                <motion.article
                  key={voucher.code}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.28, delay: index * 0.04 }}
                  className="group relative overflow-hidden rounded-[14px] border border-[#E4DCCE] bg-[#FFFEFB] shadow-[0_3px_12px_rgba(62,52,40,0.025)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(62,52,40,0.06)] sm:rounded-[20px]"
                >
                  <div className="flex min-h-[104px] sm:min-h-[138px]">
                    {/* Discount panel */}
                    <div className="relative flex w-[78px] shrink-0 flex-col items-center justify-center overflow-hidden border-r border-dashed border-[#D9CDBD] bg-[#EEE7DB] px-1.5 py-2 sm:w-[118px] sm:px-2.5 sm:py-4">
                      <div className="absolute -left-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-[#F4F1EB] sm:-left-2.5 sm:h-5 sm:w-5" />
                      <div className="absolute -right-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-[#F4F1EB] sm:-right-2.5 sm:h-5 sm:w-5" />
                      <div className="mb-1 flex h-6 w-6 items-center justify-center rounded-full bg-white/70 text-[#9C8067] sm:mb-2 sm:h-9 sm:w-9">
                        {blackFriday ? <Flame size={12} strokeWidth={1.5} /> : <Icon size={12} strokeWidth={1.5} />}
                      </div>
                      <span className="max-w-full truncate text-[6px] font-semibold uppercase tracking-[0.04em] text-[#968675] sm:text-[8px] sm:tracking-[0.08em]">
                        {blackFriday ? "Black Friday" : "Your reward"}
                      </span>
                      <p className="mt-0.5 text-[20px] font-normal leading-none tracking-[-0.06em] text-[#8B725A] sm:mt-1 sm:text-[29px]">
                        {formatDiscount(voucher)}
                      </p>
                      <span className="mt-0.5 text-[7px] text-[#9B8D7D] sm:mt-1 sm:text-[8px]">ưu đãi</span>
                    </div>

                    {/* Details panel */}
                    <div className="flex min-w-0 flex-1 flex-col justify-between p-2 sm:p-4">
                      <div className="min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="min-w-0 truncate font-display text-[12px] leading-tight text-[#37332D] sm:text-[16px]">
                            {voucher.title || (blackFriday ? "Black Friday Special" : "A little treat for you")}
                          </h3>
                          {blackFriday ? (
                            <span className="shrink-0 rounded-full bg-[#F2E5D6] px-2 py-1 text-[7px] font-semibold uppercase tracking-[0.08em] text-[#9B704C]">Special</span>
                          ) : voucher.badge ? (
                            <span className="shrink-0 rounded-full px-2 py-1 text-[7px] font-medium text-white" style={{ backgroundColor: voucher.badge_color || "#858B78" }}>{voucher.badge}</span>
                          ) : null}
                        </div>
                        <p className="mt-0.5 line-clamp-1 text-[9px] leading-[1.35] text-[#81796F] sm:mt-1 sm:line-clamp-2 sm:text-[11px] sm:leading-[1.45]">
                          {voucher.description || "Ưu đãi đặc biệt dành cho đơn hàng của bạn."}
                        </p>
                        <p className="mt-1 text-[8px] text-[#8A8175] sm:mt-1.5 sm:text-[10px]">
                          Đơn tối thiểu <span className="font-semibold text-[#4B463E]">{Number(voucher.min_order || 0).toLocaleString("vi-VN")}đ</span>
                        </p>
                      </div>

                      <div className="mt-1.5 flex items-end justify-between gap-1.5 sm:mt-2 sm:gap-2">
                        <div className="min-w-0">
                          <button
                            type="button"
                            onClick={() => void copyCode(voucher.code)}
                            className="inline-flex max-w-full items-center gap-1 rounded-md border border-[#E5DED3] bg-[#F9F6F0] px-1.5 py-0.5 text-[8px] font-semibold tracking-[0.01em] text-[#716454] transition hover:border-[#C9B9A4] hover:bg-white sm:gap-1.5 sm:px-2 sm:py-1 sm:text-[9px] sm:tracking-[0.03em]"
                            aria-label={`Sao chép mã ${voucher.code}`}
                          >
                            <span className="truncate">{voucher.code}</span>
                            <Copy size={9} className="shrink-0" />
                          </button>
                          <p className="mt-0.5 text-[7px] text-[#A49A8D] sm:mt-1 sm:text-[8px]">
                            {upcoming ? `Bắt đầu ${formatDate(voucher.start_at)}` : `HSD ${formatDate(voucher.end_at)}`}
                            {` · Còn ${remaining}`}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => saveVoucher(voucher)}
                          disabled={saved}
                          className={`inline-flex h-7 shrink-0 items-center justify-center gap-1 rounded-full px-2.5 text-[8px] font-medium transition sm:h-9 sm:px-3.5 sm:text-[10px] ${saved ? "bg-[#E5E9E0] text-[#626C58]" : "bg-[#737B69] text-white hover:bg-[#5F6856]"}`}
                        >
                          {saved && <Check size={11} strokeWidth={2} />}
                          {saved ? "Đã lưu" : "Lưu mã"}
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>
        ) : (
          <div className="mx-auto max-w-lg rounded-2xl border border-dashed border-[#DCD3C6] bg-white/50 px-5 py-8 text-center">
            <TicketPercent className="mx-auto text-[#A99A88]" size={24} strokeWidth={1.3} />
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
