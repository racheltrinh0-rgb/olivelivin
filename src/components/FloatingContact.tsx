
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

      {/* MESSENGER — transparent + breathing glow */}
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

      {/* ZALO — transparent + breathing glow */}
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

      {/* FLASH SALE — giữ nguyên chức năng */}
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
