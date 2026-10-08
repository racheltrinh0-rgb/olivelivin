import {
  ArrowDown,
  Flame,
} from "lucide-react";

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

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(date);
}

export default function FlashSaleHero({
  flashSale,
}: Props) {
  if (!flashSale) {
    return null;
  }

  const title =
    flashSale.title?.trim() ||
    "Flash Sale";

  const description =
    flashSale.description?.trim() ||
    "Ưu đãi đặc biệt trong thời gian giới hạn.";

  const discount = Number(
    flashSale.discount_percent ?? 0
  );

  const startAt =
    flashSale.start_at ?? "";

  const endAt =
    flashSale.end_at ?? "";

  const startDate =
    formatDate(startAt);

  const endDate =
    formatDate(endAt);

  const scrollProducts = () => {
    document
      .getElementById("flash-products")
      ?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
  };

  return (
    <section
      className="
        relative
        overflow-hidden
        rounded-[22px]
        bg-gradient-to-br
        from-[#FF6A00]
        via-[#FF4135]
        to-[#F42F87]
        px-5
        pt-6
        pb-4
        text-white
        shadow-[0_12px_35px_rgba(60,40,30,0.12)]

        sm:rounded-[26px]
        sm:px-8
        sm:py-9

        lg:rounded-[30px]
        lg:px-12
        lg:py-12
      "
    >

      {/* =====================================================
          SOFT BACKGROUND LIGHT
      ===================================================== */}

      <div
        className="
          pointer-events-none
          absolute
          -right-24
          -top-24
          h-64
          w-64
          rounded-full
          bg-white/10
          blur-3xl
        "
      />

      <div
        className="
          pointer-events-none
          absolute
          -bottom-32
          left-1/3
          h-72
          w-72
          rounded-full
          bg-yellow-300/10
          blur-3xl
        "
      />

      {/* =====================================================
          DESKTOP GRID / MOBILE SINGLE COLUMN
      ===================================================== */}

      <div
        className="
          relative
          z-10
          mx-auto
          max-w-7xl

          lg:grid
          lg:grid-cols-[minmax(0,1fr)_360px]
          lg:items-center
          lg:gap-12
      "
      >

        {/* ===================================================
            LEFT CONTENT
        =================================================== */}

        <div className="min-w-0">

          {/* DATE */}

          <div
            className="
              inline-flex
              items-center
              gap-1.5
              rounded-full
              border
              border-white/25
              bg-white/10
              px-3
              py-1.5
              backdrop-blur-sm

              sm:px-4
              sm:py-2
            "
          >
            <Flame
              className="
                h-3.5
                w-3.5
                shrink-0
              "
              strokeWidth={2}
            />

            <span
              className="
                whitespace-nowrap
                text-[9px]
                font-semibold
                uppercase
                tracking-[0.06em]

                sm:text-[11px]
              "
            >
              Flash Sale{" "}
              {startDate &&
                endDate &&
                `${startDate} → ${endDate}`}
            </span>
          </div>

          {/* TITLE */}

          <h1
            className="
              mt-4
              max-w-[680px]
              text-[31px]
              font-semibold
              leading-[1.02]
              tracking-[-0.045em]

              sm:mt-5
              sm:text-[46px]

              lg:text-[56px]
            "
          >
            {title}
          </h1>

          {/* DISCOUNT */}

          {discount > 0 && (
            <div
              className="
                mt-2
                flex
                items-baseline
                gap-1.5

                sm:mt-3
              "
            >
              <span
                className="
                  text-[22px]
                  font-bold
                  leading-none
                  tracking-[-0.04em]
                  text-yellow-300

                  sm:text-[30px]
                "
              >
                GIẢM ĐẾN
              </span>

              <span
                className="
                  text-[31px]
                  font-bold
                  leading-none
                  tracking-[-0.045em]
                  text-yellow-300

                  sm:text-[40px]
                "
              >
                {discount}%
              </span>
            </div>
          )}

          {/* DESCRIPTION */}

          <p
            className="
              mt-3
              max-w-[590px]
              line-clamp-3
              text-[12px]
              leading-[1.5]
              text-white/90

              sm:mt-5
              sm:text-[15px]
              sm:leading-6

              lg:text-base
              lg:leading-7
            "
          >
            {description}
          </p>

          {/* =================================================
              MOBILE / DESKTOP CTA
          ================================================= */}

          <div
            className="
              mt-4
              flex
              gap-2.5

              sm:mt-7
              sm:gap-3
            "
          >

            {/* PRIMARY */}

            <Button
              type="button"
              size="lg"
              onClick={scrollProducts}
              className="
                h-9
                flex-1
                rounded-xl
                bg-white
                px-4
                text-[11px]
                font-semibold
                text-[#E84A25]
                shadow-sm
                hover:bg-neutral-100

                sm:h-11
                sm:flex-none
                sm:px-7
                sm:text-sm
              "
            >
              Mua ngay
            </Button>

            {/* SECONDARY
                Desktop only
            */}

            <Button
              type="button"
              size="lg"
              variant="outline"
              onClick={scrollProducts}
              className="
                hidden
                h-11
                rounded-xl
                border-white/70
                bg-transparent
                px-7
                text-sm
                font-semibold
                text-white
                hover:bg-white
                hover:text-[#E84A25]

                sm:inline-flex
              "
            >
              Xem ưu đãi
            </Button>

          </div>
        </div>

        {/* ===================================================
            COUNTDOWN
        =================================================== */}

        <div
          className="
            mt-5

            border-t
            border-white/20
            pt-4

            lg:mt-0
            lg:border-t-0
            lg:border-l
            lg:pl-10
            lg:pt-0
          "
        >

          <FlashSaleCountdown
            startAt={startAt}
            endAt={endAt}
          />

        </div>

      </div>

      {/* =====================================================
          DESKTOP SCROLL BUTTON
      ===================================================== */}

      <button
        type="button"
        onClick={scrollProducts}
        aria-label="Xem sản phẩm"
        className="
          absolute
          bottom-3
          left-1/2
          z-20
          hidden
          -translate-x-1/2
          rounded-full
          p-2
          text-white/80
          transition
          hover:bg-white/10
          hover:text-white

          lg:block
        "
      >
        <ArrowDown
          className="h-5 w-5"
          strokeWidth={1.7}
        />
      </button>

    </section>
  );
}