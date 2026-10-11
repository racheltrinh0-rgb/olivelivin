import { useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { Link } from "@tanstack/react-router";

const MESSENGER_URL = "https://m.me/oliveliving";
const ZALO_URL = "https://zalo.me/0799379179";

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

  if (!isVisible) return null;

  const glassButtonClass = `
    group relative flex h-10 w-10 shrink-0 items-center justify-center
    overflow-hidden rounded-full
    border border-white/55
    bg-gradient-to-br from-white/55 via-white/30 to-neutral-200/20
    backdrop-blur-[14px] backdrop-saturate-[145%]
    text-neutral-600/85
    shadow-[0_4px_14px_rgba(0,0,0,0.09),inset_0_1px_1px_rgba(255,255,255,0.65)]
    opacity-75 transition-all duration-300
    hover:scale-105 hover:opacity-100
    hover:from-white/75 hover:via-white/50 hover:to-neutral-100/30
    hover:text-neutral-800
    before:pointer-events-none before:absolute before:inset-[2px]
    before:rounded-full before:border before:border-white/45
    before:content-['']
  `;

  return (
    <div
      className="
        fixed bottom-[120px] right-3 z-[60]
        flex flex-col items-center gap-2
        opacity-90
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
        aria-label="Chat với Olive Living qua Messenger"
        title="Messenger"
        className={glassButtonClass}
      >
        <MessageCircle
          size={18}
          strokeWidth={1.5}
          className="relative z-10 transition-transform duration-300 group-hover:scale-110"
        />
      </a>

      {/* ZALO */}
      <a
        href={ZALO_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat với Olive Living qua Zalo"
        title="Zalo"
        className={glassButtonClass}
      >
        <span
          className="
            relative z-10 flex h-[17px] w-[17px] items-center justify-center
            rounded-[5px] border border-neutral-500/70 bg-white/15
            text-[7px] font-bold leading-none text-neutral-600/90
            transition-transform duration-300 group-hover:scale-110
          "
        >
          Z
        </span>
      </a>

      {/* FLASH SALE - gắn cùng cụm, nằm ngay dưới Zalo */}
      <Link
        to="/flashsale"
        aria-label="Khám phá chương trình Flash Sale"
        title="Flash Sale"
        className="
          group relative mt-2 block w-10 shrink-0
          transition-transform duration-300
          hover:scale-110
          motion-safe:animate-[bounce_1.8s_ease-in-out_infinite]
        "
      >
        <span className="pointer-events-none absolute inset-1 -z-10 rounded-full bg-red-500/60 opacity-70 blur-md motion-safe:animate-pulse" />
        <span className="pointer-events-none absolute -inset-1 -z-10 rounded-full bg-yellow-300/40 opacity-60 blur-lg motion-safe:animate-[pulse_1.4s_ease-in-out_infinite]" />

        <img
          src="/images/flash-sale-sticker.png"
          alt="Flash Sale"
          className="relative block h-auto w-full object-contain drop-shadow-[0_0_5px_rgba(255,70,30,0.9)] transition-[filter] duration-300 group-hover:drop-shadow-[0_0_10px_rgba(255,190,40,1)]"
        />

        <span className="pointer-events-none absolute inset-0 overflow-hidden">
          <span className="absolute -left-1/2 top-0 h-full w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/90 to-transparent opacity-0 motion-safe:animate-[flashShimmer_2.2s_ease-in-out_infinite]" />
        </span>
      </Link>
    </div>
  );
}

