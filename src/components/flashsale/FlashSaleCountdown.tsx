import { useEffect, useState } from "react";

interface Props {
  startAt?: string;
  endAt: string;
}

interface CountdownState {
  day: number;
  hour: number;
  minute: number;
  second: number;
  mode: "before" | "active" | "expired";
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function calculateTime(
  target: number
) {
  const diff = Math.max(
    0,
    target - Date.now()
  );

  return {
    day: Math.floor(
      diff / 86400000
    ),

    hour:
      Math.floor(
        diff / 3600000
      ) % 24,

    minute:
      Math.floor(
        diff / 60000
      ) % 60,

    second:
      Math.floor(
        diff / 1000
      ) % 60,
  };
}

export default function FlashSaleCountdown({
  startAt,
  endAt,
}: Props) {

  const [time, setTime] =
    useState<CountdownState>({
      day: 0,
      hour: 0,
      minute: 0,
      second: 0,
      mode: "before",
    });

  useEffect(() => {

    function update() {

      const now =
        Date.now();

      /*
       * ==========================================
       * NO END DATE
       * ==========================================
       */

      if (!endAt) {
        setTime({
          day: 0,
          hour: 0,
          minute: 0,
          second: 0,
          mode: "before",
        });

        return;
      }

      const endTime =
        new Date(endAt).getTime();

      /*
       * ==========================================
       * BEFORE SALE
       * ==========================================
       */

      if (startAt) {
        const startTime =
          new Date(
            startAt
          ).getTime();

        if (
          !Number.isNaN(startTime) &&
          now < startTime
        ) {
          setTime({
            ...calculateTime(
              startTime
            ),
            mode: "before",
          });

          return;
        }
      }

      /*
       * ==========================================
       * EXPIRED
       * ==========================================
       */

      if (
        Number.isNaN(endTime) ||
        now >= endTime
      ) {
        setTime({
          day: 0,
          hour: 0,
          minute: 0,
          second: 0,
          mode: "expired",
        });

        return;
      }

      /*
       * ==========================================
       * ACTIVE
       * ==========================================
       */

      setTime({
        ...calculateTime(
          endTime
        ),
        mode: "active",
      });
    }

    update();

    const timer =
      window.setInterval(
        update,
        1000
      );

    return () => {
      window.clearInterval(
        timer
      );
    };

  }, [startAt, endAt]);

  /*
   * ==========================================
   * EXPIRED
   * ==========================================
   */

  if (
    time.mode === "expired"
  ) {
    return (
      <div
        className="
          flex
          items-center
          justify-between
          gap-3
        "
      >
        <div>
          <p
            className="
              text-[9px]
              font-semibold
              uppercase
              tracking-[0.16em]
              text-white/60
            "
          >
            FLASH SALE
          </p>

          <p
            className="
              mt-1
              text-[12px]
              font-medium
              text-white
            "
          >
            Chương trình đã kết thúc.
          </p>
        </div>

        <span
          className="
            rounded-full
            bg-white/10
            px-3
            py-1.5
            text-[9px]
            font-medium
            text-white/80
          "
        >
          ENDED
        </span>
      </div>
    );
  }

  const isBefore =
    time.mode === "before";

  const items = [
    {
      value: pad(time.day),
      label: "NGÀY",
    },
    {
      value: pad(time.hour),
      label: "GIỜ",
    },
    {
      value: pad(time.minute),
      label: "PHÚT",
    },
    {
      value: pad(time.second),
      label: "GIÂY",
    },
  ];

  return (
    <div className="w-full">

      {/* =================================================
          COUNTDOWN HEADER
      ================================================= */}

      <div
        className="
          mb-3
          flex
          items-end
          justify-between
          gap-3
        "
      >

        <div>

          <p
            className="
              text-[9px]
              font-semibold
              uppercase
              tracking-[0.18em]
              text-white/60
            "
          >
            {isBefore
              ? "STARTS IN"
              : "ENDS IN"}
          </p>

          <p
            className="
              mt-1
              text-[11px]
              font-medium
              text-white
            "
          >
            {isBefore
              ? "Flash Sale sắp bắt đầu"
              : "Flash Sale đang diễn ra"}
          </p>

        </div>

        <span
          className="
            text-[9px]
            font-medium
            text-white/50
          "
        >
          LIMITED TIME
        </span>

      </div>

      {/* =================================================
          COUNTDOWN NUMBERS
      ================================================= */}

      <div
        className="
          grid
          grid-cols-4
          gap-1.5

          sm:gap-2
        "
      >

        {items.map(
          (item) => (
            <div
              key={item.label}
              className="
                flex
                min-w-0
                flex-col
                items-center
                justify-center
                rounded-[10px]
                bg-white
                px-1
                py-2.5

                sm:rounded-[12px]
                sm:py-3.5
              "
            >

              <span
                className="
                  text-[20px]
                  font-semibold
                  leading-none
                  tracking-[-0.045em]
                  text-[#242424]

                  sm:text-[27px]
                "
              >
                {item.value}
              </span>

              <span
                className="
                  mt-1.5
                  text-[6px]
                  font-semibold
                  uppercase
                  tracking-[0.12em]
                  text-neutral-400

                  sm:text-[7px]
                "
              >
                {item.label}
              </span>

            </div>
          )
        )}

      </div>

      {/* =================================================
          SMALL FOOTER
      ================================================= */}

      <div
        className="
          mt-3
          flex
          items-center
          justify-between
          border-t
          border-white/15
          pt-3
        "
      >

        <p
          className="
            text-[8px]
            leading-4
            text-white/55

            sm:text-[9px]
          "
        >
          {isBefore
            ? "Tự động bắt đầu khi countdown về 0."
            : "Giá ưu đãi kết thúc khi countdown về 0."}
        </p>

      </div>

    </div>
  );
}