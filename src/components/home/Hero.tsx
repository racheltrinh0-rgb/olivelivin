import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, ArrowUpRight } from "lucide-react";
import { Link } from "@tanstack/react-router";

const slides = [
  {
    desktop: "/images/banner01-desktop.png",
    mobile: "/images/banner01-mobile.png",
    alt: "Olive Living interior lighting collection",
  },
  {
    desktop: "/images/banner02-desktop.png",
    mobile: "/images/banner02-mobile.png",
    alt: "Olive Living sculptural lighting collection",
  },
  {
    desktop: "/images/banner03-desktop.png",
    mobile: "/images/banner03-mobile.png",
    alt: "Olive Living home decor collection",
  },
];

const categories = [
  { label: "Ambient Glow", to: "/shop?category=den-ban" },
  { label: "Sculptural Light", to: "/shop?category=den-dung" },
  { label: "Living Spaces", to: "/shop?category=do-decor" },
];

export default function Hero() {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const timer = window.setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [paused]);

  const next = () => setCurrent((prev) => (prev + 1) % slides.length);
  const prev = () => setCurrent((prev) => (prev === 0 ? slides.length - 1 : prev - 1));

  return (
    <section
      aria-label="Olive Living collections"
      className="relative mx-auto w-[calc(100%-24px)] max-w-[1440px] overflow-hidden rounded-[22px] bg-[#eee8df] shadow-[0_18px_55px_rgba(48,36,25,0.12)] sm:w-[calc(100%-40px)] sm:rounded-[26px] lg:w-[calc(100%-64px)]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Background slides: one visible at a time */}
      <div className="relative aspect-[4/5] w-full sm:aspect-[5/4] lg:aspect-[16/7.8]">
        {slides.map((slide, index) => (
          <picture
            key={slide.desktop}
            className={`absolute inset-0 block transition-opacity duration-1000 ${index === current ? "z-[1] opacity-100" : "z-0 opacity-0"}`}
          >
            <source media="(min-width: 1024px)" srcSet={slide.desktop} />
            <img
              src={slide.mobile}
              alt={slide.alt}
              draggable={false}
              fetchPriority={index === 0 ? "high" : "auto"}
              className="h-full w-full object-cover object-center"
            />
          </picture>
        ))}

        {/* Soft, neutral overlay keeps the artwork visible and text readable. */}
        <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-black/55 via-black/10 to-black/[0.03] lg:bg-gradient-to-r lg:from-black/40 lg:via-black/10 lg:to-transparent" />

        {/* Content */}
        <div className="absolute inset-0 z-20 flex items-end lg:items-center">
          <div className="w-full px-5 pb-12 pt-10 text-white sm:px-8 sm:pb-14 lg:max-w-[690px] lg:translate-y-10 lg:px-14 lg:py-12 xl:px-[7%]">
            <p className="mb-3 text-[9px] font-medium uppercase tracking-[0.28em] text-white/85 sm:text-[10px]">
              THE OLIVE EDIT
            </p>
            <h1 className="max-w-[620px] text-[34px] font-medium leading-[1.02] tracking-[-0.045em] sm:text-[42px] lg:text-[54px] xl:text-[64px]">
              Designed for the Way You Feel.
            </h1>
            <p className="mt-3 max-w-[440px] text-[12px] leading-5 text-white/85 sm:text-[13px] lg:mt-4 lg:text-[14px]">
              Thoughtful lighting and timeless pieces for everyday living.
            </p>

            <nav aria-label="Shop by collection" className="mt-4 flex w-full flex-nowrap items-center gap-1.5 sm:mt-6 sm:gap-3">
              {categories.map((category) => (
                <Link
                  key={category.label}
                  to={category.to}
                  className="group inline-flex min-h-9 min-w-0 flex-1 items-center justify-center gap-1 rounded-full border border-white/55 bg-white/15 px-1.5 py-2 text-[9px] font-medium leading-none whitespace-nowrap text-white shadow-[0_4px_18px_rgba(0,0,0,0.08)] backdrop-blur-xl transition duration-300 hover:-translate-y-0.5 hover:border-white/80 hover:bg-white/90 hover:text-[#26231f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black/20 sm:min-h-11 sm:flex-none sm:gap-2 sm:px-5 sm:text-[12px]"
                >
                  {category.label}
                  <ArrowUpRight className="h-3 w-3 shrink-0 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 sm:h-3.5 sm:w-3.5" />
                </Link>
              ))}
            </nav>
          </div>
        </div>

        {/* Slide navigation */}
        <button
          type="button"
          onClick={prev}
          aria-label="Ảnh trước"
          className="absolute left-3 top-1/2 z-30 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/35 bg-black/20 text-white shadow-sm backdrop-blur-lg transition hover:bg-white hover:text-[#26231f] sm:left-5 sm:h-10 sm:w-10 lg:left-6"
        >
          <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>
        <button
          type="button"
          onClick={next}
          aria-label="Ảnh tiếp theo"
          className="absolute right-3 top-1/2 z-30 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/35 bg-black/20 text-white shadow-sm backdrop-blur-lg transition hover:bg-white hover:text-[#26231f] sm:right-5 sm:h-10 sm:w-10 lg:right-6"
        >
          <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>

        {/* Slide indicators */}
        <div className="absolute bottom-4 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 sm:bottom-5">
          {slides.map((slide, index) => (
            <button
              key={`indicator-${slide.desktop}`}
              type="button"
              onClick={() => setCurrent(index)}
              aria-label={`Chuyển đến slide ${index + 1}`}
              aria-current={current === index ? "true" : undefined}
              className={`h-1 rounded-full transition-all duration-300 ${current === index ? "w-7 bg-white" : "w-1.5 bg-white/55 hover:bg-white/85"}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
