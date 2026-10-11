import { useEffect, useMemo, useState } from "react";
import { X, ArrowRight, Flame } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const FLASH_SALE_URL = "/flashsale";

type FlashSaleTiming = {
  start_at: string | null;
  end_at: string | null;
  created_at?: string | null;
};

type Countdown = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

function getCountdown(totalSeconds: number): Countdown {
  const safe = Math.max(0, totalSeconds);
  return {
    days: Math.floor(safe / 86400),
    hours: Math.floor((safe % 86400) / 3600),
    minutes: Math.floor((safe % 3600) / 60),
    seconds: safe % 60,
  };
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

export default function FlashSalePopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [saleTiming, setSaleTiming] = useState<FlashSaleTiming | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setTimeout(() => setIsOpen(true), 1000);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadSaleTiming() {
      const { data, error } = await supabase
        .from("flash_sales")
        .select("start_at,end_at,created_at")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!cancelled && !error && data) {
        setSaleTiming(data as FlashSaleTiming);
      }
    }

    void loadSaleTiming();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  const countdownState = useMemo(() => {
    if (!saleTiming?.start_at || !saleTiming?.end_at) return null;

    const start = new Date(saleTiming.start_at).getTime();
    const end = new Date(saleTiming.end_at).getTime();

    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
      return null;
    }

    if (now < start) {
      return {
        label: "FLASH SALE BẮT ĐẦU SAU",
        remaining: Math.ceil((start - now) / 1000),
      };
    }

    if (now < end) {
      return {
        label: "FLASH SALE KẾT THÚC SAU",
        remaining: Math.ceil((end - now) / 1000),
      };
    }

    return { label: "FLASH SALE ĐÃ KẾT THÚC", remaining: 0 };
  }, [saleTiming, now]);

  const countdown = getCountdown(countdownState?.remaining ?? 0);

  const handleClose = () => setIsOpen(false);

  const handleLearnMore = () => {
    window.location.href = FLASH_SALE_URL;
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/55 px-4 py-4 backdrop-blur-[3px] animate-[overlayIn_.25s_ease-out]"
      onClick={handleClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Olive Living Flash Sale"
        className="relative w-full max-w-[440px] overflow-hidden rounded-[18px] bg-[#f6f0e3] shadow-[0_20px_60px_rgba(0,0,0,0.28)] animate-[popupIn_.3s_ease-out]"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={handleClose}
          aria-label="Đóng popup"
          className="absolute right-3 top-3 z-30 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-neutral-700 shadow-[0_2px_10px_rgba(0,0,0,0.14)] backdrop-blur transition hover:scale-105 hover:bg-white hover:text-black active:scale-95"
        >
          <X size={17} strokeWidth={1.8} />
        </button>

        {/* Banner và phần CTA dùng chung một nền; không còn footer trắng tách lớp. */}
        <div className="relative isolate overflow-hidden bg-[#f6f0e3]">
          <img
            src="/images/popup10.10.png"
            alt="Olive Living 10.10 Flash Sale - Sale up to 50% off"
            className="block h-auto max-h-[76vh] min-h-[420px] w-full object-cover object-top sm:max-h-[78vh]"
          />

          {/* Countdown đặt ở vùng trống phía dưới banner, không che headline 50% OFF. */}
          <div className="absolute inset-x-0 bottom-0 z-10 px-4 pb-4 pt-8 sm:px-5 sm:pb-5 sm:pt-10">
            <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-t from-[#f7f0e2] via-[#f7f0e2]/90 to-transparent" />

            {countdownState && (
              <div className="flash-countdown-card mx-auto mb-2.5 max-w-[340px] rounded-[15px] border border-[#c91b1b]/25 bg-[#fffdf8]/90 px-2.5 py-2 shadow-[0_8px_24px_rgba(168,15,22,0.12)] backdrop-blur-[3px] sm:px-3 sm:py-2.5">
                <div className="mb-1.5 flex items-center justify-center gap-1.5 text-[8px] font-extrabold uppercase tracking-[0.12em] text-[#a80f16] sm:mb-2 sm:text-[9px]">
                  <Flame size={12} strokeWidth={2.2} />
                  <span>{countdownState.label}</span>
                </div>

                {countdownState.remaining > 0 ? (
                  <div className="flex items-stretch justify-center gap-1.5 sm:gap-2">
                    <div className="flash-days min-w-0 flex-1 rounded-[9px] bg-gradient-to-br from-[#d21b24] via-[#b80f18] to-[#930b12] px-1.5 py-1.5 text-center text-white shadow-[0_4px_10px_rgba(184,15,24,0.22)] sm:px-2">
                      <div className="text-[20px] font-black leading-none tabular-nums sm:text-[24px]">
                        {countdown.days}
                      </div>
                      <div className="mt-1 text-[8px] font-semibold uppercase tracking-[0.12em] text-white/80">Ngày</div>
                    </div>
                    {[
                      { label: "Giờ", value: countdown.hours },
                      { label: "Phút", value: countdown.minutes },
                      { label: "Giây", value: countdown.seconds },
                    ].map((unit) => (
                      <div key={unit.label} className="flash-time-unit min-w-0 flex-1 rounded-[9px] border border-[#dfc9a8] bg-gradient-to-b from-white to-[#f8efdf] px-1 py-1.5 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.95)] sm:px-1.5">
                        <div className="text-[18px] font-extrabold leading-none tabular-nums text-[#2a2925] sm:text-[21px]">
                          {pad(unit.value)}
                        </div>
                        <div className="mt-1 text-[8px] font-semibold uppercase tracking-[0.1em] text-[#817666]">{unit.label}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-[11px] font-semibold text-[#a80f16]">Hẹn bạn ở chương trình tiếp theo.</p>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={handleLearnMore}
              className="flash-cta group relative isolate flex h-[46px] w-full items-center justify-center gap-2 overflow-hidden rounded-[11px] bg-gradient-to-r from-[#a90d16] via-[#c3131d] to-[#a90d16] px-4 text-[11px] font-extrabold uppercase tracking-[0.09em] text-white shadow-[0_7px_18px_rgba(169,13,22,0.28)] transition duration-200 hover:brightness-110 active:scale-[0.985]"
            >
              <span>Tìm hiểu ngay</span>
              <ArrowRight size={15} strokeWidth={1.8} className="transition-transform duration-200 group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes overlayIn { from { opacity: 0; } to { opacity: 1; } }
        .flash-countdown-card { animation: countdownRise .55s cubic-bezier(.2,.75,.25,1) both; }
        .flash-time-unit { transition: border-color .2s ease, transform .2s ease; }
        .flash-time-unit:hover { border-color: rgba(184,15,24,.42); transform: translateY(-1px); }
        .flash-cta::before {
          content: "";
          position: absolute;
          inset: -1px auto -1px -45%;
          width: 32%;
          transform: skewX(-20deg);
          background: linear-gradient(90deg, transparent, rgba(255,255,255,.42), transparent);
          animation: ctaShimmer 3.2s ease-in-out infinite;
          pointer-events: none;
          z-index: -1;
        }
        .flash-cta::after {
          content: "";
          position: absolute;
          inset: 1px;
          border: 1px solid rgba(255,255,255,.18);
          border-radius: 10px;
          pointer-events: none;
        }
        @keyframes ctaShimmer {
          0%, 58% { left: -45%; opacity: 0; }
          68% { opacity: 1; }
          100% { left: 125%; opacity: 0; }
        }
        @keyframes countdownRise {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .flash-countdown-card, .flash-cta::before { animation: none; }
        }
        @keyframes popupIn {
          from { opacity: 0; transform: scale(.96) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @media (max-width: 420px) {
          @supports (height: 100dvh) {
            [aria-label="Olive Living Flash Sale"] img { max-height: 76dvh; }
          }
        }
      `}</style>
    </div>
  );
}
