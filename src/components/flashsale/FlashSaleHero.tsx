
import { ArrowDown, Flame } from "lucide-react";

import { Button } from "@/components/ui/button";
import FlashSaleCountdown from "./FlashSaleCountdown";

interface FlashSaleData {
  id: string;
  title: string;
  description?: string | null;
  discount_percent?: number | null;
  start_at?: string | null;
  end_at?: string | null;
  banner_color?: string | null;
  active?: boolean;
}

interface Props {
  flashSale?: FlashSaleData | null;
}

function formatDate(value?: string | null) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(date);
}

export default function FlashSaleHero({ flashSale }: Props) {
  if (!flashSale) return null;

  const title = flashSale.title?.trim() || "Flash Sale";
  const description =
    flashSale.description?.trim() ||
    "Ưu đãi đặc biệt trong thời gian giới hạn.";

  const discount = Number(flashSale.discount_percent ?? 0);
  const startAt = flashSale.start_at ?? "";
  const endAt = flashSale.end_at ?? "";

  const startDate = formatDate(startAt);
  const endDate = formatDate(endAt);

  const scrollProducts = () => {
    document.getElementById("flash-products")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <section
      className="
        relative isolate overflow-hidden
        rounded-2xl
        bg-gradient-to-br
        from-[#F47A38] via-[#E95B50] to-[#D95778]
        px-4 py-4 text-white
        shadow-[0_8px_24px_rgba(190,76,62,0.12)]
        sm:rounded-[24px] sm:px-7 sm:py-7
        lg:rounded-[28px] lg:px-10 lg:py-9
      "
    >
      {/* BACKGROUND DECORATION */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        {/* Warm ambient glow */}
        <div
          className="
            absolute -right-16 -top-20
            h-64 w-64 rounded-full
            bg-[#FFD9B8]/20 blur-3xl
            sm:h-80 sm:w-80
          "
        />

        <div
          className="
            absolute -bottom-24 -left-16
            h-64 w-64 rounded-full
            bg-[#FFB8A8]/20 blur-3xl
            sm:h-80 sm:w-80
          "
        />

        {/* Concentric circles on the right */}
        <svg
          viewBox="0 0 360 360"
          fill="none"
          className="
            absolute -right-24 -top-16
            h-64 w-64 text-white/25
            sm:-right-12 sm:-top-20
            sm:h-96 sm:w-96
          "
        >
          <circle
            cx="180"
            cy="180"
            r="65"
            stroke="currentColor"
            strokeWidth="1"
          />
          <circle
            cx="180"
            cy="180"
            r="90"
            stroke="currentColor"
            strokeWidth="1"
          />
          <circle
            cx="180"
            cy="180"
            r="115"
            stroke="currentColor"
            strokeWidth="1"
          />
          <circle
            cx="180"
            cy="180"
            r="140"
            stroke="currentColor"
            strokeWidth="1"
          />
          <circle
            cx="180"
            cy="180"
            r="165"
            stroke="currentColor"
            strokeWidth="1"
          />
        </svg>

        {/* Flowing curves along the bottom */}
        <svg
          viewBox="0 0 900 220"
          fill="none"
          preserveAspectRatio="none"
          className="
            absolute -bottom-8 left-0
            h-28 w-full text-white/20
            sm:-bottom-12 sm:h-44
          "
        >
          <path
            d="M-40 150 C160 20 300 220 500 110 S780 30 950 120"
            stroke="currentColor"
            strokeWidth="1.2"
          />
          <path
            d="M-40 175 C160 45 300 245 500 135 S780 55 950 145"
            stroke="currentColor"
            strokeWidth="1"
          />
        </svg>

        {/* Dot pattern in the bottom-left corner */}
        <div
          className="
            absolute bottom-5 left-5
            h-14 w-14 opacity-40
            sm:bottom-8 sm:left-8
            sm:h-20 sm:w-20
          "
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.9) 1px, transparent 1.5px)",
            backgroundSize: "9px 9px",
          }}
        />
      </div>

      <div
        className="
          relative z-10 mx-auto max-w-7xl
          lg:grid
          lg:grid-cols-[minmax(0,1fr)_320px]
          lg:items-center
          lg:gap-8
        "
      >
        {/* CONTENT */}
        <div className="min-w-0">
          {/* DATE */}
          <div
            className="
              inline-flex max-w-full items-center gap-1.5
              rounded-full border border-white/30
              bg-white/10 px-2.5 py-1.5
              sm:px-3.5 sm:py-2
            "
          >
            <Flame
              className="h-3 w-3 shrink-0 sm:h-3.5 sm:w-3.5"
              strokeWidth={1.9}
            />

            <span className="truncate text-[8px] font-semibold uppercase tracking-[0.05em] sm:text-[10px]">
              Flash Sale{" "}
              {startDate && endDate
                ? `${startDate} → ${endDate}`
                : ""}
            </span>
          </div>

          {/* TITLE */}
          <h1
            className="
              mt-3 max-w-[620px]
              text-[29px] font-semibold
              leading-[1.05] tracking-[-0.045em]
              sm:mt-4 sm:text-[42px]
              lg:text-[52px]
            "
          >
            {title}
          </h1>

          {/* DISCOUNT */}
          {discount > 0 && (
            <div className="mt-2 flex items-baseline gap-2 sm:mt-2.5">
              <span
                className="
                  text-[18px] font-bold leading-none
                  tracking-[-0.035em] text-[#FFF0A8]
                  sm:text-[26px]
                "
              >
                GIẢM ĐẾN
              </span>

              <span
                className="
                  text-[29px] font-bold leading-none
                  tracking-[-0.045em] text-[#FFF0A8]
                  sm:text-[38px]
                "
              >
                {discount}%
              </span>
            </div>
          )}

          {/* DESCRIPTION */}
          <p
            className="
              mt-2.5 max-w-[540px]
              line-clamp-2 text-[11px]
              leading-[1.5] text-white/95
              sm:mt-4 sm:text-[14px] sm:leading-6
              lg:text-[15px]
            "
          >
            {description}
          </p>

          {/* BUTTONS */}
          <div className="mt-3.5 flex gap-2 sm:mt-5 sm:gap-3">
            <Button
              type="button"
              size="lg"
              onClick={scrollProducts}
              className="
                h-9 flex-1 rounded-lg
                bg-white px-4
                text-[11px] font-semibold text-[#C64F3D]
                shadow-none hover:bg-[#FFF5F0]
                sm:h-10 sm:flex-none
                sm:rounded-xl sm:px-6 sm:text-sm
              "
            >
              Mua ngay
            </Button>

            <Button
              type="button"
              size="lg"
              variant="outline"
              onClick={scrollProducts}
              className="
                hidden h-10 rounded-xl
                border-white/70 bg-transparent px-6
                text-sm font-semibold text-white
                shadow-none
                hover:bg-white hover:text-[#C64F3D]
                sm:inline-flex
              "
            >
              Xem ưu đãi
            </Button>
          </div>
        </div>

        {/* COUNTDOWN — KEEP EXISTING LOGIC */}
        <div
          className="
            mt-4 border-t border-white/25 pt-3
            sm:mt-5 sm:pt-4
            lg:mt-0 lg:border-l lg:border-t-0
            lg:py-1 lg:pl-7
          "
        >
          <FlashSaleCountdown
            startAt={startAt}
            endAt={endAt}
          />
        </div>
      </div>

      {/* DESKTOP SCROLL INDICATOR */}
      <button
        type="button"
        onClick={scrollProducts}
        aria-label="Xem sản phẩm"
        className="
          absolute bottom-2 left-1/2 z-20
          hidden -translate-x-1/2
          rounded-full p-1.5
          text-white/75 transition
          hover:bg-white/10 hover:text-white
          lg:block
        "
      >
        <ArrowDown
          className="h-4 w-4"
          strokeWidth={1.7}
        />
      </button>
    </section>
  );
}
