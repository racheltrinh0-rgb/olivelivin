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
    title: "Đèn cây đứng Half Round",
    description: "Ánh sáng linh hoạt cho không gian sống.",
    video: "/videos/Đèn cây đứng Half Round bản 2.MP4",
    href: "https://olivelivingvn.com/products/den-cao-dung-half-round-france-diem-nhan-sang-trong-cho-khong-gian",
    exploreLabel: "Explore Half Round",
  },
  {
    title: "Đèn bàn Poulsen",
    description: "Vẻ đẹp thanh lịch trong từng góc nhỏ.",
    video: "/videos/design-life-02.mp4",
    href: "https://olivelivingvn.com/products/den-ban-ufo-cam-ung-3-che-do",
    exploreLabel: "Explore UFO",
  },
  {
    title: "Đèn bàn UFO",
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

    const currentIndex = cards.reduce((closestIndex, card, index) => {
      const currentDistance = Math.abs(card.offsetLeft - carousel.scrollLeft);
      const closestDistance = Math.abs(
        cards[closestIndex].offsetLeft - carousel.scrollLeft,
      );
      return currentDistance < closestDistance ? index : closestIndex;
    }, 0);

    const nextIndex = (currentIndex + 1) % cards.length;
    carousel.scrollTo({
      left: cards[nextIndex].offsetLeft - cards[0].offsetLeft,
      behavior: "smooth",
    });
  };

  return (
    <section className="w-full overflow-hidden bg-white py-8 sm:py-10 lg:py-12">
      <div className="mx-auto w-full max-w-[1380px] px-5 sm:px-7 lg:px-8">
        {/* EDITORIAL HEADER */}
        <div className="mb-5 flex items-end justify-between gap-4 sm:mb-7">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="h-px w-5 bg-[#B98561]" />
              <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-[#A18F7E] sm:text-[10px]">
                The Olive Edit · Lighting
              </p>
            </div>

            <h2 className="font-serif text-[27px] font-normal leading-[1.12] tracking-[-0.035em] text-[#292621] sm:text-[32px] lg:text-[38px]">
              Designed for real life<span className="text-[#B98561]">.</span>
            </h2>

            <p className="mt-2 max-w-[440px] text-[12px] leading-relaxed text-[#81786F] sm:text-[13px]">
              Thoughtful lighting, made to bring your space to life.
            </p>
          </div>
        </div>

        {/* VIDEO CAROUSEL */}
        <div className="relative">
          <div
            ref={carouselRef}
            className="
              -mx-1 flex snap-x snap-mandatory gap-4
              overflow-x-auto overscroll-x-contain
              px-1 pb-8 pt-4
              [scrollbar-width:none]
              [&::-webkit-scrollbar]:hidden
              sm:mx-0 sm:gap-5 sm:px-0
              lg:grid lg:grid-cols-4 lg:gap-5 lg:overflow-visible
            "
          >
            {videos.map((item, index) => (
              <article
                key={item.video}
                data-video-card
                className="
                  group relative isolate aspect-[3/4]
                  w-[86%] min-w-[270px] max-w-[420px] shrink-0 snap-start
                  overflow-hidden rounded-[24px] bg-[#E8E5DF]
                  shadow-[0_12px_32px_rgba(35,30,25,0.18)]
                  transition-all duration-500
                  hover:-translate-y-1
                  hover:shadow-[0_18px_42px_rgba(35,30,25,0.24)]
                  sm:w-[45%] sm:rounded-[26px]
                  lg:w-auto lg:min-w-0
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
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.025]"
                  onError={(event) => {
                    event.currentTarget.style.visibility = "hidden";
                  }}
                />

                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[62%] bg-gradient-to-t from-black/75 via-black/30 to-transparent" />

                <div className="absolute inset-x-0 bottom-0 p-4 text-white sm:p-5">
                  <p className="mb-1.5 text-[9px] font-medium uppercase tracking-[0.18em] text-white/75">
                    0{index + 1} <span className="mx-1 text-white/45">/</span> 04
                  </p>

                  <h3 className="text-[15px] font-medium leading-snug tracking-[-0.015em] sm:text-[19px]">
                    {item.title}
                  </h3>

                  <p className="mt-1.5 text-[10px] leading-relaxed text-white/85 sm:text-[11px]">
                    {item.description}
                  </p>

                  <a
                    href={item.href}
                    className="
                      mt-3 inline-flex min-h-[35px] w-full items-center
                      justify-between gap-3 rounded-full
                      border border-white/45 bg-white/20 px-3.5 py-2
                      text-[10px] font-medium text-white
                      backdrop-blur-lg transition-colors duration-200
                      hover:bg-white/30 active:scale-[0.99] sm:text-[11px]
                    "
                  >
                    <span>{item.exploreLabel}</span>
                    <span aria-hidden="true" className="text-sm font-normal">
                      ↗
                    </span>
                  </a>
                </div>
              </article>
            ))}
          </div>

          {/* SINGLE SUBTLE GLASS ARROW */}
          {videos.length > 1 && (
            <button
              type="button"
              onClick={scrollToNextCard}
              aria-label="Xem video tiếp theo"
              className="
                absolute right-2 top-[42%] z-20
                flex h-7 w-7 -translate-y-1/2 items-center justify-center
                rounded-full border border-white/55 bg-white/30
                text-[#39342F]/80 shadow-[0_1px_5px_rgba(0,0,0,0.06)]
                backdrop-blur-md transition-all duration-200
                hover:bg-white/50 active:scale-95
                sm:right-2 sm:h-8 sm:w-8 lg:hidden
              "
            >
              <ChevronRight size={16} strokeWidth={1.6} />
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
