import { useEffect, useState } from "react";
import { X, ArrowRight } from "lucide-react";

const FLASH_SALE_URL = "/flashsale";

export default function FlashSalePopup() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setIsOpen(true);
    }, 1000);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleLearnMore = () => {
    window.location.href = FLASH_SALE_URL;
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="
        fixed
        inset-0
        z-[9999]

        flex
        items-center
        justify-center

        bg-black/50
        backdrop-blur-[3px]

        px-4
        py-4

        animate-[overlayIn_.25s_ease-out]
      "
      onClick={handleClose}
    >
      {/* POPUP */}
      <div
        className="
          relative

          w-full
          max-w-[440px]

          overflow-hidden

          rounded-[18px]

          bg-white

          shadow-[0_20px_60px_rgba(0,0,0,0.25)]

          animate-[popupIn_.3s_ease-out]
        "
        onClick={(event) => {
          event.stopPropagation();
        }}
      >
        {/* CLOSE BUTTON */}
        <button
          type="button"
          onClick={handleClose}
          aria-label="Đóng popup"
          className="
            absolute
            right-3
            top-3
            z-30

            flex
            h-8
            w-8
            items-center
            justify-center

            rounded-full

            bg-white/95

            text-neutral-700

            shadow-[0_2px_10px_rgba(0,0,0,0.14)]

            backdrop-blur

            transition-all
            duration-200

            hover:bg-white
            hover:text-black
            hover:scale-105

            active:scale-95

            sm:right-3
            sm:top-3
            sm:h-9
            sm:w-9
          "
        >
          <X
            size={17}
            strokeWidth={1.8}
          />
        </button>

        {/* IMAGE */}
        <div
          className="
            flex
            w-full
            items-center
            justify-center

            overflow-hidden

            bg-neutral-100
          "
        >
          <img
            src="/images/popup10.10.png"
            alt="Olive Living 10.10 Flash Sale"
            className="
              block

              h-auto
              w-full

              max-h-[58vh]

              object-contain

              sm:max-h-[62vh]
            "
          />
        </div>

        {/* CTA */}
        <div
          className="
            bg-white

            px-3
            py-3

            sm:px-4
            sm:py-4
          "
        >
          <button
            type="button"
            onClick={handleLearnMore}
            className="
              group

              flex
              h-[46px]
              w-full

              items-center
              justify-center
              gap-2

              rounded-[11px]

              bg-[#222222]

              px-4

              text-[11px]
              font-semibold
              uppercase

              tracking-[0.08em]

              text-white

              transition-all
              duration-200

              hover:bg-black

              active:scale-[0.98]
            "
          >
            <span>
              Tìm hiểu ngay
            </span>

            <ArrowRight
              size={15}
              strokeWidth={1.8}
              className="
                transition-transform
                duration-200

                group-hover:translate-x-1
              "
            />
          </button>
        </div>
      </div>

      {/* ANIMATION */}
      <style>{`
        @keyframes overlayIn {
          from {
            opacity: 0;
          }

          to {
            opacity: 1;
          }
        }

        @keyframes popupIn {
          from {
            opacity: 0;
            transform: scale(0.96) translateY(10px);
          }

          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </div>
  );
}