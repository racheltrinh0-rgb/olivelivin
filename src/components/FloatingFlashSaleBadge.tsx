import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";

export default function FloatingFlashSaleBadge() {
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setPulse((value) => !value);
    }, 1400);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <Link
      to="/flashsale"
      aria-label="Khám phá chương trình Flash Sale"
      className="fixed right-5 bottom-[190px] z-[40] block w-[46px] sm:right-6 sm:bottom-[200px] sm:w-[56px]"
    >
      <img
        src="/images/flash-sale-sticker.png"
        alt="Flash Sale"
        className={`block h-auto w-full object-contain transition-transform duration-500 ${
          pulse ? "scale-105 -rotate-3" : "scale-95 rotate-3"
        }`}
      />
    </Link>
  );
}

