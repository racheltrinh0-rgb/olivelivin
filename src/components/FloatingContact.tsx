
import { useState } from "react";
import { X } from "lucide-react";

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
    </div>
  );
}
