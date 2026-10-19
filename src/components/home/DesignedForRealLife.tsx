
import { useRef } from "react";
import { ChevronRight } from "lucide-react";

type VideoItem = {
  title: string;
  description: string;
  video: string;
  href: string;
  exploreLabel: string;
};

const videos: VideoItem[] = [
  {
    title: "Đèn cây đứng Memphis 20",
    description: "Ánh sáng linh hoạt cho không gian sống.",
    video: "/videos/design-life-01.mp4",
    href: "https://olivelivingvn.com/products/den-cay-dung-memphis-20-dieu-chinh-linh-hoat",
    exploreLabel: "Explore Memphis 20",
  },
  {
    title: "Đèn bàn Poulsen",
    description: "Vẻ đẹp thanh lịch trong từng góc nhỏ.",
    video: "/videos/design-life-02.mp4",
    href: "https://olivelivingvn.com/products/den-ban-poulsen-ve-dep-thanh-lich",
    exploreLabel: "Explore Poulsen",
  },
  {
    title: "Đèn bàn Bauhaus",
    description: "Thiết kế tối giản, điểm nhấn sang trọng.",
    video: "/videos/design-life-03.mp4",
    href: "https://olivelivingvn.com/products/den-ban-bauhuas-thiet-ke-toi-gian-sang-trong",
    exploreLabel: "Explore Bauhaus",
  },
  {
    title: "Đèn bàn Paquepot",
    description: "Nét cổ điển giao thoa hiện đại.",
    video: "/videos/design-life-04.mp4",
    href: "https://olivelivingvn.com/products/den-ban-paquepot-net-dep-co-dien-giao-thoa-hien-dai",
    exploreLabel: "Explore Paquepot",
  },
];

export default function DesignedForRealLife() {
  const carouselRef = useRef<HTMLDivElement>(null);

  const scrollToNextCard = () => {
    const carousel = carouselRef.current;
    if (!carousel) return;

    const cards = Array.from(
      carousel.querySelectorAll<HTMLElement>("[data-video-card]"),
    );

    if (!cards.length) return;

    const currentIndex = cards.reduce(
      (closestIndex, card, index) => {
        const currentDistance = Math.abs(
          card.offsetLeft - carousel.scrollLeft,
        );
        const closestDistance = Math.abs(
          cards[closestIndex].offsetLeft - carousel.scrollLeft,
        );

        return currentDistance < closestDistance ? index : closestIndex;
      },
      0,
    );

    const nextIndex = (currentIndex + 1) % cards.length;

    carousel.scrollTo({
      left: cards[nextIndex].offsetLeft - cards[0].offsetLeft,
      behavior: "smooth",
    });
  };

  return (
    <section className="bg-white pt-2 pb-6 sm:pt-3 sm:pb-6 lg:pt-6 lg:pb-6">
      <div className="mx-auto w-full max-w-[1380px] px-4 sm:px-6 lg:px-8">
        {/* HEADING */}
        <div className="mb-4 flex items-end justify-between gap-4 sm:mb-6">
          <div>
            <p className="mb-2 text-[9px] font-semibold uppercase tracking-[0.24em] text-[#77766F] sm:text-[10px]">
              OLIVE LIVING / LIGHTING
            </p>

            <h2 className="text-[25px] font-medium leading-tight tracking-[-0.04em] text-[#292925] sm:text-[32px] lg:text-[38px]">
              Designed for real life
            </h2>

            <p className="mt-2 max-w-[440px] text-[11px] leading-relaxed text-[#77766F] sm:text-[13px]">
              Thoughtful lighting for the spaces you call home.
            </p>
          </div>
        </div>

        {/* VIDEO CAROUSEL */}
        <div className="relative">
          <div
            ref={carouselRef}
            className="
              -mx-4 flex snap-x snap-mandatory
              gap-3 overflow-x-auto overscroll-x-contain
              px-4 pb-3 pt-2
              [scrollbar-width:none]
              [&::-webkit-scrollbar]:hidden
              sm:mx-0 sm:px-0
              lg:grid lg:grid-cols-4 lg:gap-4
              lg:overflow-visible
            "
          >
            {videos.map((item, index) => (
              <article
                key={item.video}
                data-video-card
                className="
                  group relative isolate
                  aspect-[3/4] w-[78%] shrink-0 snap-start
                  overflow-hidden rounded-[14px]
                  bg-[#E8E5DF]
                  shadow-[0_3px_12px_rgba(35,30,25,0.08)]
                  sm:w-[45%]
                  lg:w-auto
                "
              >
                <video
                  src={item.video}
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  aria-label={item.title}
                  className="
                    absolute inset-0 h-full w-full object-cover
                    transition-transform duration-700
                    group-hover:scale-[1.03]
                  "
                  onError={(event) => {
                    event.currentTarget.style.visibility = "hidden";
                  }}
                />

                {/* BOTTOM GRADIENT */}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[58%] bg-gradient-to-t from-black/65 via-black/20 to-transparent" />

                {/* CONTENT */}
                <div className="absolute inset-x-0 bottom-0 p-3.5 text-white sm:p-5">
                  <p className="mb-1 text-[9px] font-medium uppercase tracking-[0.18em] text-white/85">
                    0{index + 1} / 04
                  </p>

                  <h3 className="text-[16px] font-semibold leading-tight tracking-[-0.02em] sm:text-[20px]">
                    {item.title}
                  </h3>

                  <p className="mt-1.5 text-[10px] leading-relaxed text-white/90 sm:text-[11px]">
                    {item.description}
                  </p>

                  <a
                    href={item.href}
                    className="
                      mt-3 inline-flex min-h-[36px] w-full
                      items-center justify-between
                      rounded-full border border-white/55
                      bg-white/25 px-3.5 py-2
                      text-[10px] font-semibold text-white
                      shadow-sm backdrop-blur-md
                      transition-colors hover:bg-white/40
                      active:scale-[0.99] sm:text-[11px]
                    "
                  >
                    <span>{item.exploreLabel}</span>
                    <span aria-hidden="true">↗</span>
                  </a>
                </div>
              </article>
            ))}
          </div>

          {/* SMALL FROSTED GLASS NEXT BUTTON */}
          <button
            type="button"
            onClick={scrollToNextCard}
            aria-label="Xem video tiếp theo"
            className="
              absolute right-1 top-[42%] z-20
              flex h-8 w-8 -translate-y-1/2
              items-center justify-center
              rounded-full border border-white/70
              bg-white/45 text-[#292925]
              shadow-[0_2px_8px_rgba(0,0,0,0.10)]
              backdrop-blur-xl
              transition-all duration-200
              hover:bg-white/75 active:scale-95
              sm:right-2 sm:h-9 sm:w-9
              lg:hidden
            "
          >
            <ChevronRight size={17} strokeWidth={1.7} />
          </button>
        </div>

        {/* MOBILE SCROLL HINT */}
        <div className="mt-2 flex items-center justify-between gap-3 pb-1 lg:hidden">
          <p className="flex items-center gap-2 text-[11px] text-[#77766F]">
            <span aria-hidden="true" className="text-[#292925]">
              ← →
            </span>
            Vuốt ngang để khám phá 4 video
          </p>
        </div>
      </div>
    </section>
  );
}
