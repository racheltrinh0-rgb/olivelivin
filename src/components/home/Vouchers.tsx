import { Ticket, Truck, Gift, Flame, Copy, Check } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";

const ICONS = {
  gift: Gift,
  truck: Truck,
  ticket: Ticket,
};

export default function Vouchers() {
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [savedCodes, setSavedCodes] = useState<string[]>([]);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    loadVouchers();

    const saved = JSON.parse(
      localStorage.getItem("olive_vouchers") || "[]"
    );

    setSavedCodes(saved.map((v: any) => v.code));
  }, []);

  async function loadVouchers() {
    const now = new Date();

    const { data, error } = await supabase
      .from("vouchers")
      .select("*")
      .eq("active", true)
      .eq("show_home", true)
      .order("start_at", { ascending: true });

    if (error) {
      toast.error(error.message);
      return;
    }

    // CHỈ HIỆN VOUCHER CÒN HIỆU LỰC:
    // - Đang diễn ra: start_at <= now < end_at
    // - Sắp diễn ra: start_at > now
    // - TUYỆT ĐỐI KHÔNG hiện voucher đã hết hạn: end_at <= now
    //
    // Điều kiện thực tế chỉ cần kiểm tra end_at > now,
    // vì voucher có end_at trong tương lai sẽ là đang diễn ra
    // hoặc sắp diễn ra.
    const available = (data ?? []).filter((voucher) => {
      if (!voucher.start_at || !voucher.end_at) return false;

      const start = new Date(voucher.start_at);
      const end = new Date(voucher.end_at);

      // Bỏ dữ liệu ngày không hợp lệ.
      if (
        Number.isNaN(start.getTime()) ||
        Number.isNaN(end.getTime())
      ) {
        return false;
      }

      // Voucher đã hết hạn => KHÔNG HIỆN.
      if (end.getTime() <= now.getTime()) {
        return false;
      }

      // Chỉ cho phép:
      // 1. Đang diễn ra
      // 2. Sắp diễn ra
      return start.getTime() <= end.getTime();
    });

    const sorted = [...available].sort((a, b) => {
      // Black Friday luôn đứng đầu.
      const aBF = isBlackFriday(a) ? 1 : 0;
      const bBF = isBlackFriday(b) ? 1 : 0;

      if (aBF !== bBF) {
        return bBF - aBF;
      }

      // Voucher đang diễn ra đứng trước voucher sắp diễn ra.
      const aStarted = new Date(a.start_at) <= now;
      const bStarted = new Date(b.start_at) <= now;

      if (aStarted !== bStarted) {
        return aStarted ? -1 : 1;
      }

      // Sau đó theo thời gian bắt đầu gần nhất.
      return (
        new Date(a.start_at).getTime() -
        new Date(b.start_at).getTime()
      );
    });

    setVouchers(sorted);
  }

  function isBlackFriday(voucher: any) {
    const text = `
      ${voucher.code || ""}
      ${voucher.title || ""}
      ${voucher.description || ""}
      ${voucher.badge || ""}
      ${voucher.event_type || ""}
    `.toLowerCase();

    return (
      voucher.event_type === "black_friday" ||
      text.includes("black friday") ||
      text.includes("black_friday") ||
      text.includes("black-friday") ||
      text.includes("blackfriday") ||
      text.includes("bf2026")
    );
  }

  function isUpcoming(voucher: any) {
    if (!voucher.start_at || !voucher.end_at) return false;

    const now = new Date().getTime();
    const start = new Date(voucher.start_at).getTime();
    const end = new Date(voucher.end_at).getTime();

    return (
      !Number.isNaN(start) &&
      !Number.isNaN(end) &&
      start > now &&
      end > now
    );
  }

  function saveVoucher(voucher: any) {
    const saved = JSON.parse(
      localStorage.getItem("olive_vouchers") || "[]"
    );

    if (saved.find((v: any) => v.code === voucher.code)) {
      toast.info("Voucher đã được lưu");
      return;
    }

    saved.push({ code: voucher.code });

    localStorage.setItem(
      "olive_vouchers",
      JSON.stringify(saved)
    );

    setSavedCodes(saved.map((v: any) => v.code));
    toast.success("Đã lưu voucher");
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code);
    toast.success(`Đã sao chép mã ${code}`);
  }

  function formatDiscount(item: any) {
    if (item.type === "percent") {
      return `${item.value}%`;
    }

    if (item.type === "fixed") {
      return `${Number(item.value).toLocaleString("vi-VN")}đ`;
    }

    return "FREE";
  }

  // Hiện tối đa 2 voucher ban đầu.
  // Black Friday được ưu tiên đầu tiên, sau đó là 1 voucher thường.
  // Khi bấm "Xem thêm" mới hiện toàn bộ voucher hợp lệ.
  const visibleVouchers = showAll
    ? vouchers
    : vouchers.slice(0, 2);

  const hiddenVoucherCount = Math.max(
    0,
    vouchers.length - 2
  );

  return (
    <section className="bg-[#F8F6F1] pt-4 pb-10 sm:pt-5 sm:pb-12 lg:pt-6 lg:pb-16">
      <div className="container-x">
        <div className="mx-auto mb-8 max-w-2xl text-center sm:mb-10">
          <p className="text-[9px] font-medium uppercase tracking-[0.26em] text-[#A99B8A]">
            OLIVE LIVING · PRIVATE OFFERS
          </p>

          <h2 className="mt-2 font-display text-[27px] font-normal leading-[1.18] tracking-[-0.025em] text-[#39352F] sm:text-[32px]">
            A little something for your space.
          </h2>

          <p className="mx-auto mt-2.5 max-w-lg text-[12px] leading-5 text-[#858078] sm:text-[13px]">
            Những ưu đãi nhỏ dành cho những không gian bạn yêu thích.
          </p>

          <Link
            to="/voucher-register"
            className="mx-auto mt-4 inline-flex w-fit items-center gap-2 rounded-full border border-[#DED7CC] bg-[#FBFAF7] px-4 py-2 text-[9px] font-medium uppercase tracking-[0.1em] text-[#686158] transition-all hover:border-[#CEC4B7] hover:bg-white active:scale-[0.98]"
          >
            <Gift size={12} strokeWidth={1.5} />
            Nhận ưu đãi
          </Link>
        </div>

        {visibleVouchers.length > 0 && (
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-4 sm:grid-cols-2">
            {visibleVouchers
              .filter((item) => {
                if (!item.start_at || !item.end_at) return false;

                const now = Date.now();
                const start = new Date(item.start_at).getTime();
                const end = new Date(item.end_at).getTime();

                return (
                  !Number.isNaN(start) &&
                  !Number.isNaN(end) &&
                  end > now &&
                  start <= end
                );
              })
              .map((item) => {
                const blackFriday = isBlackFriday(item);
                const upcoming = isUpcoming(item);
                const saved = savedCodes.includes(item.code);

                const Icon =
                  ICONS[item.icon as keyof typeof ICONS] ?? Gift;

                return (
                  <motion.div
                    key={item.code}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                    className="group relative overflow-hidden rounded-[22px] border border-[#E7E1D8] bg-[#FCFBF8] shadow-[0_2px_14px_rgba(73,61,48,0.035)] transition-all duration-300 hover:-translate-y-[1px] hover:shadow-[0_8px_24px_rgba(73,61,48,0.065)]"
                  >
                    {blackFriday && (
                      <div className="pointer-events-none absolute inset-0 bg-[#F7F0E7]/40" />
                    )}

                    <div className="absolute left-6 right-6 top-0 h-[2px] rounded-full bg-[#D8B9A0] opacity-60" />

                    <div className="relative flex min-h-[142px]">
                      <div className="flex w-[108px] shrink-0 flex-col items-center justify-center bg-[#F8F5EF] px-3 py-5 sm:w-[124px]">
                        <div className="mb-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-[#F1E9DE] text-[#B28C71]">
                          {blackFriday ? (
                            <Flame size={15} strokeWidth={1.35} />
                          ) : (
                            <Icon size={15} strokeWidth={1.35} />
                          )}
                        </div>

                        {blackFriday && (
                          <span className="mb-1 text-[7px] font-medium uppercase tracking-[0.16em] text-[#A8754D]">
                            Black Friday
                          </span>
                        )}

                        <p className="max-w-full truncate text-[8px] font-medium tracking-[0.07em] text-[#A49B90]">
                          {item.code}
                        </p>

                        <p className="mt-0.5 text-[21px] font-normal leading-none tracking-[-0.035em] text-[#AD896F] sm:text-[23px]">
                          {formatDiscount(item)}
                        </p>

                        <span className="mt-1 text-[8px] text-[#AAA197]">
                          ưu đãi
                        </span>
                      </div>

                      <div className="flex min-w-0 flex-1 flex-col justify-between px-4 py-4 sm:px-5">
                        <div className="min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="min-w-0 truncate text-[12px] font-medium tracking-[-0.005em] text-[#48433C] sm:text-[13px]">
                              {item.title ||
                                (blackFriday
                                  ? "Black Friday Special"
                                  : "A little treat for you")}
                            </h3>

                            {item.badge && !blackFriday ? (
                              <span
                                className="shrink-0 rounded-full px-2 py-1 text-[7px] font-medium text-white opacity-85"
                                style={{
                                  backgroundColor:
                                    item.badge_color || "#8A8278",
                                }}
                              >
                                {item.badge}
                              </span>
                            ) : blackFriday ? (
                              <span className="shrink-0 rounded-full bg-[#F0E4D5] px-2 py-1 text-[7px] font-medium text-[#A8754D]">
                                Special
                              </span>
                            ) : null}
                          </div>

                          <p className="mt-1 line-clamp-2 max-w-[330px] text-[10px] leading-[1.55] text-[#888178] sm:text-[11px]">
                            {item.description}
                          </p>

                          <p className="mt-2 text-[10px] text-[#8B847B]">
                            Đơn từ{" "}
                            <span className="font-medium text-[#514B44]">
                              {Number(item.min_order || 0).toLocaleString(
                                "vi-VN"
                              )}
                              đ
                            </span>
                          </p>
                        </div>

                        <div className="mt-3 flex items-end justify-between gap-3">
                          <div>
                            <p className="text-[9px] font-medium text-[#A88973]">
                              {upcoming
                                ? "Sắp diễn ra"
                                : `Còn ${Math.max(
                                    0,
                                    Number(item.quantity || 0) -
                                      Number(item.used || 0)
                                  )}`}
                            </p>

                            <p className="mt-0.5 text-[8px] text-[#AAA39A]">
                              {upcoming
                                ? `Bắt đầu: ${new Date(
                                    item.start_at
                                  ).toLocaleDateString("vi-VN")}`
                                : `HSD: ${new Date(
                                    item.end_at
                                  ).toLocaleDateString("vi-VN")}`}
                            </p>
                          </div>

                          <div className="flex shrink-0 items-center gap-1.5">
                            <button
                              onClick={() => copyCode(item.code)}
                              className="flex h-7 items-center gap-1 rounded-full border border-[#DED8CE] bg-transparent px-2.5 text-[8px] font-medium text-[#716A61] transition-colors hover:bg-white"
                            >
                              <Copy size={10} strokeWidth={1.5} />
                              <span className="hidden sm:inline">
                                Sao chép
                              </span>
                            </button>

                            <button
                              onClick={() => saveVoucher(item)}
                              disabled={saved}
                              className={`h-7 rounded-full px-3 text-[8px] font-medium transition-colors ${
                                saved
                                  ? "bg-[#87907C] text-white"
                                  : "bg-[#737B69] text-white hover:bg-[#626A59]"
                              }`}
                            >
                              {saved ? (
                                <>
                                  <Check
                                    size={10}
                                    className="mr-0.5 inline"
                                    strokeWidth={1.8}
                                  />
                                  Đã lưu
                                </>
                              ) : (
                                "Lưu ưu đãi"
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
          </div>
        )}

        {hiddenVoucherCount > 0 && (
          <div className="mt-6 flex justify-center">
            <button
              onClick={() => setShowAll(!showAll)}
              className="rounded-full border border-[#DDD6CB] bg-transparent px-4 py-1.5 text-[9px] font-medium uppercase tracking-[0.12em] text-[#746D64] transition-all hover:border-[#C6BCAF] hover:bg-white"
            >
              {showAll
                ? "Thu gọn"
                : `Xem thêm ${hiddenVoucherCount} ưu đãi`}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
