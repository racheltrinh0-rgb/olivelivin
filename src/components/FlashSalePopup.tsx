
import { useEffect, useState } from "react";
import { X, ArrowRight } from "lucide-react";

const PRODUCT_URL =
  "https://olivelivingvn.com/products/den-cao-dung-half-round-france-diem-nhan-sang-trong-cho-khong-gian";

const POPUP_IMAGE = "/images/Half%20Round%20pop%20up.png";

export default function FlashSalePopup() {
  const [isHomepage, setIsHomepage] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Chỉ kiểm tra trang chủ ở client để tránh lỗi SSR.
  useEffect(() => {
    const homepage = window.location.pathname === "/";

    setIsHomepage(homepage);

    if (!homepage) {
      return;
    }

    const timer = window.setTimeout(() => {
      setIsOpen(true);
    }, 1000);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  // Đóng popup bằng phím Escape.
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleClose = () => {
    setIsOpen(false);
  };

  // Chuyển đến trang sản phẩm.
  const handleLearnMore = () => {
    window.location.href = PRODUCT_URL;
  };

  // Chỉ hiển thị popup trên trang chủ khi đã mở.
  if (!isHomepage || !isOpen) {
    return null;
  }

  return (
    <div
      className="
        fixed inset-0 z-[9999]
        flex items-center justify-center
        bg-black/40
        px-4 py-6
        backdrop-blur-[3px]
        animate-[olivePopupOverlay_.25s_ease-out]
      "
      onClick={handleClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Half Round France - Olive Living"
        className="
          relative flex w-full max-w-[380px]
          flex-col items-center
        "
        onClick={(event) => event.stopPropagation()}
      >
        {/* Nút đóng popup */}
        <button
          type="button"
          onClick={handleClose}
          aria-label="Đóng popup"
          className="
            absolute -right-1 top-0 z-20
            flex h-7 w-7 items-center justify-center
            rounded-full
            border border-black/5
            bg-white/95
            text-neutral-700
            shadow-[0_2px_8px_rgba(0,0,0,0.15)]
            transition
            hover:rotate-90 hover:bg-white
            active:scale-90
            sm:-right-2
          "
        >
          <X size={14} strokeWidth={2} />
        </button>

        {/* Hình voucher Half Round */}
        <button
          type="button"
          onClick={handleLearnMore}
          aria-label="Khám phá đèn Half Round France"
          className="
            flex w-full
            items-center justify-center
            bg-transparent
            px-0 pt-5
          "
        >
          <img
            src={POPUP_IMAGE}
            alt="Half Round France - Olive Living"
            className="
              half-round-popup-image
              block
              h-auto
              w-[min(82vw,340px)]
              max-w-full
              rounded-2xl
              object-contain
              select-none
            "
            draggable={false}
          />
        </button>

        {/* Button Ambient Glow style */}
        

        
<button
  type="button"
  onClick={handleLearnMore}
  className="
    ambient-glow-button
    group relative isolate
    mt-3 flex h-10 w-fit
    items-center justify-center gap-2
    overflow-hidden rounded-full
    border border-white/55
    bg-white/15
    px-5
    text-[11px] font-semibold
    tracking-wide text-white
    backdrop-blur-md
    shadow-[0_0_12px_rgba(255,255,255,0.08)]
    transition-all duration-300
    hover:-translate-y-0.5
    hover:border-white/90
    hover:bg-white/25
    hover:shadow-[0_0_22px_rgba(255,255,255,0.2)]
    active:scale-[0.97]
  "
>
  {/* Lớp kính sáng */}
  <span
    className="
      pointer-events-none absolute inset-0 -z-10
      rounded-full
      bg-gradient-to-b
      from-white/20 via-white/5 to-transparent
    "
  />

  {/* Dải sáng phản chiếu */}
  <span
    className="
      ambient-shine
      pointer-events-none absolute inset-y-0
      -left-1/2 w-1/3
      skew-x-[-20deg]
      bg-gradient-to-r
      from-transparent via-white/50 to-transparent
    "
  />

  <span>Khám phá sản phẩm</span>

  <ArrowRight
    size={14}
    strokeWidth={1.8}
    className="
      transition-transform duration-300
      group-hover:translate-x-1
      group-hover:-translate-y-0.5
    "
  />
</button>


        {/* Nội dung phụ */}
        <p
          className="
            mt-2
            text-center
            text-[10px]
            font-medium
            tracking-wide
            text-white/80
          "
        >
          Half Round France · Olive Living
        </p>
      </div>

      {/* Animation và responsive */}
      <style>{`
        @keyframes olivePopupOverlay {
          from {
            opacity: 0;
          }

          to {
            opacity: 1;
          }
        }

        @media (max-width: 420px) {
          .half-round-popup-image {
            width: min(82vw, 320px);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .half-round-popup-image {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
