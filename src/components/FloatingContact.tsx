
import { useState } from "react";
import { X } from "lucide-react";

const MESSENGER_URL = "https://m.me/oliveliving";
const ZALO_URL = "https://zalo.me/0799379179";
const MYSTERY_JACKPOT_ID = "mystery-jackpot-deals";

export default function FloatingSupport({
  onClose,
}: {
  onClose?: () => void;
}) {
  const [isVisible, setIsVisible] = useState(true);

  const handleClose = () => {
    setIsVisible(false);
    onClose?.();
  };

  const handleFlashSaleClick = (
    event: React.MouseEvent<HTMLAnchorElement>
  ) => {
    event.preventDefault();

    // Nếu đang ở trang khác, chuyển về trang chủ kèm anchor.
    if (window.location.pathname !== "/") {
      window.location.href = `/#${MYSTERY_JACKPOT_ID}`;
      return;
    }

    // Nếu đang ở trang chủ, cuộn đến Mystery Jackpot Deals.
    const target = document.getElementById(MYSTERY_JACKPOT_ID);

    if (target) {
      target.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      return;
    }

    // Dự phòng khi section chưa được render.
    window.location.hash = MYSTERY_JACKPOT_ID;
  };

  if (!isVisible) return null;

  return (
    <div
      className="
        fixed bottom-[120px] right-3 z-[60]
        flex flex-col items-center gap-2
        sm:bottom-[125px]
        lg:bottom-6 lg:right-5
      "
    >
      {/* CLOSE */}
      <button
        type="button"
        onClick={handleClose}
        aria-label="Ẩn nút hỗ trợ"
        title="Ẩn"
        className="
          mb-0.5 flex h-6 w-6 shrink-0 items-center justify-center
          rounded-full border border-white/55 bg-white/45
          text-neutral-500/75 shadow-[0_3px_10px_rgba(0,0,0,0.07)]
          backdrop-blur-[12px] transition-all duration-300
          hover:scale-105 hover:bg-white/75 hover:text-neutral-800
        "
      >
        <X size={11} strokeWidth={1.7} />
      </button>

      {/* MESSENGER */}
      <a
        href={MESSENGER_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat Messenger"
        title="Messenger"
        className="contact-icon-glow"
      >
        <img
          src="/images/messenger.png"
          alt="Messenger"
          className="contact-icon-image"
        />
      </a>

      {/* ZALO */}
      <a
        href={ZALO_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat Zalo"
        title="Zalo"
        className="contact-icon-glow"
      >
        <img
          src="/images/zalo .png"
          alt="Zalo"
          className="contact-icon-image"
        />
      </a>

     
{/* MYSTERY JACKPOT - DISCOUNT 25% */}
<a
  href={`/#${MYSTERY_JACKPOT_ID}`}
  onClick={handleFlashSaleClick}
  aria-label="Khám phá Mystery Jackpot giảm giá 25%"
  title="Mystery Jackpot - Giảm giá 25%"
  className="
    discount25-floating
    flex h-14 w-14 items-center justify-center
    sm:h-16 sm:w-16
  "
>
  <img
    src="/images/discount25.png"
    alt="Giảm giá 25%"
    className="h-full w-full object-contain"
  />
</a>
    </div>
  );
}