import { useEffect, useState } from "react";
import { X, ArrowRight } from "lucide-react";

const TARGET_ID = "mystery-jackpot-deals";

export default function FlashSalePopup() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setIsOpen(true), 1000);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const handleLearnMore = () => {
    setIsOpen(false);

    // Nếu đang ở trang khác, về trang chủ và mang theo vị trí đích.
    if (window.location.pathname !== "/") {
      window.location.href = `/#${TARGET_ID}`;
      return;
    }

    // Tìm khu vực Jackpot sau khi popup đóng.
    window.setTimeout(() => {
      const findAndScroll = (attempt = 0) => {
        const target = document.getElementById(TARGET_ID);

        if (target) {
          target.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
          return;
        }

        // Thử lại trong tối đa khoảng 3 giây nếu component chưa render.
        if (attempt < 15) {
          window.setTimeout(() => findAndScroll(attempt + 1), 200);
        } else {
          console.error(
            `Không tìm thấy #${TARGET_ID}. Hãy kiểm tra ID trong MysteryJackpotDeals.tsx.`
          );
        }
      };

      findAndScroll();
    }, 250);
  };

  // Hỗ trợ trường hợp trang chủ mở từ URL có hash.
  useEffect(() => {
    if (window.location.hash !== `#${TARGET_ID}`) return;

    const timer = window.setTimeout(() => {
      document.getElementById(TARGET_ID)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });

      // Xóa hash sau khi xử lý để tránh cuộn lại ngoài ý muốn.
      window.history.replaceState(
        null,
        "",
        window.location.pathname + window.location.search
      );
    }, 500);

    return () => window.clearTimeout(timer);
  }, []);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 px-4 py-6 backdrop-blur-[3px] animate-[olivePopupOverlay_.25s_ease-out]"
      onClick={() => setIsOpen(false)}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Ưu đãi Olive Living 25% OFF"
        className="relative flex w-full max-w-[420px] flex-col items-center"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          aria-label="Đóng popup"
          className="absolute -right-1 top-0 z-20 flex h-7 w-7 items-center justify-center rounded-full border border-black/5 bg-white/95 text-neutral-700 shadow-[0_2px_8px_rgba(0,0,0,0.15)] transition hover:rotate-90 hover:bg-white active:scale-90 sm:-right-2"
        >
          <X size={14} strokeWidth={2} />
        </button>

        <button
          type="button"
          onClick={handleLearnMore}
          aria-label="Khám phá Jackpot Deals"
          className="flex w-full items-center justify-center bg-transparent px-0 pb-0 pt-5"
        >
          <img
            src="/images/discount25.png"
            alt="25% OFF"
            className="discount25-sticker block w-[min(94vw,390px)] max-w-full select-none object-contain"
            draggable={false}
          />
        </button>

        <button
          type="button"
          onClick={handleLearnMore}
          className="group mt-3 flex h-12 w-[min(76vw,280px)] items-center justify-center gap-2 rounded-full border border-white/30 bg-[#FF4D00] px-5 text-[12px] font-extrabold uppercase tracking-[0.07em] text-white shadow-[0_6px_20px_rgba(255,77,0,0.3)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#f04400] hover:shadow-[0_9px_24px_rgba(255,77,0,0.38)] active:scale-[0.98]"
        >
          <span>Khám phá ưu đãi</span>
          <ArrowRight
            size={16}
            strokeWidth={2.2}
            className="transition-transform duration-200 group-hover:translate-x-1"
          />
        </button>

        <p className="mt-2 text-center text-[10px] font-medium tracking-wide text-white/80">
          Ưu đãi bí mật · Số lượng giới hạn
        </p>
      </div>

      <style>{`
        @keyframes olivePopupOverlay {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @media (max-width: 420px) {
          .discount25-sticker {
            width: min(94vw, 360px);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .discount25-sticker {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}