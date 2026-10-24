import { useRef } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronRight, ExternalLink } from "lucide-react";

type ProductCardProduct = {
  id: string | number;
  slug: string;
  name: string;
  price: number | null;
  compare_at_price?: number | null;
  stock?: number | null;
  image_url: string | null;
  color_preview?: string | null;
  express_available?: boolean | null;
};

type NewArrivalProps = {
  products: ProductCardProduct[];
};

const formatVND = (price: number) =>
  `${new Intl.NumberFormat("vi-VN").format(price)}₫`;

export default function NewArrival({ products }: NewArrivalProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  const scrollNext = () => {
    const container = scrollerRef.current;
    if (!container) return;

    const card = container.querySelector<HTMLElement>("[data-new-arrival-card]");
    const gap = 20;
    const distance = card ? card.getBoundingClientRect().width + gap : 260;

    container.scrollBy({ left: distance, behavior: "smooth" });
  };

  if (!products?.length) return null;

  return (
    <section className="relative w-full bg-white py-8 sm:py-10 lg:py-12">
      <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-end justify-between gap-4 sm:mb-7">
          <div className="min-w-0">
            <div className="mb-2 flex items-center gap-2">
              <span className="h-px w-5 bg-[#B98561]" />
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#A18F7E] sm:text-[11px]">
                Olive Living Selection
              </p>
            </div>
            <h2 className="font-serif text-[28px] font-normal leading-[1.12] tracking-[-0.035em] text-[#292621] sm:text-[32px] lg:text-[36px]">
              New Arrivals<span className="text-[#B98561]">.</span>
            </h2>
            <p className="mt-2 max-w-[420px] text-[12px] leading-5 text-[#81786F] sm:text-[13px]">
              Fresh pieces to bring a little more character home.
            </p>
          </div>
        </div>

        <div className="relative">
          <div
            ref={scrollerRef}
            className="flex snap-x snap-mandatory gap-5 overflow-x-auto px-1 pb-5 pt-2 sm:gap-6 sm:px-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          >
            {products.map((product) => {
              const price = Number(product.price ?? 0);
              const comparePrice = Number(product.compare_at_price ?? 0);
              const hasDiscount = comparePrice > price && price > 0;

              return (
                <article
                  key={product.id}
                  data-new-arrival-card
                  className="group relative w-[68%] min-w-[220px] max-w-[280px] shrink-0 snap-start overflow-hidden rounded-[20px] bg-white shadow-[0_3px_14px_rgba(35,30,25,0.08)] transition-shadow duration-300 hover:shadow-[0_7px_22px_rgba(35,30,25,0.12)] sm:w-[42%] md:w-[30%] lg:w-[23%]"
                >
                  <Link to="/products/$slug" params={{ slug: product.slug }} className="block h-full">
                    <div className="relative aspect-[4/5] overflow-hidden rounded-[20px] bg-[#F5F3EF]">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-[#A49A90]">
                          Chưa có hình ảnh
                        </div>
                      )}

                      {hasDiscount && (
                        <span className="absolute left-3 top-3 rounded-full bg-[#FF4D00] px-2.5 py-1 text-[10px] font-semibold text-white">
                          SALE
                        </span>
                      )}

                      {/* Compact icon control — same dimensions as Most Loved */}
                      <span
                        aria-hidden="true"
                        className="absolute right-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-lg border border-white/75 bg-white/85 text-[#292621] shadow-[0_2px_6px_rgba(0,0,0,0.08)] backdrop-blur-md transition-all duration-200 group-hover:bg-white group-hover:text-[#4D5745] sm:right-3 sm:top-3 sm:h-8 sm:w-8"
                      >
                        <ExternalLink size={15} strokeWidth={1.8} />
                      </span>
                    </div>

                    <div className="flex min-h-[108px] flex-col px-3.5 pb-4 pt-3.5 sm:min-h-[120px] sm:px-4 sm:pb-5 sm:pt-4">
                      <h3 className="line-clamp-2 text-[12px] font-medium leading-[1.65] text-[#39342F] sm:text-sm">
                        {product.name}
                      </h3>
                      <div className="mt-auto flex flex-wrap items-center gap-x-2 gap-y-1 pt-3">
                        {price > 0 ? (
                          <span className="text-[13px] font-semibold text-[#39342F] sm:text-sm">
                            {formatVND(price)}
                          </span>
                        ) : (
                          <span className="text-xs text-[#8A8178]">Liên hệ</span>
                        )}
                        {hasDiscount && (
                          <span className="text-[10px] text-[#A49A90] line-through sm:text-xs">
                            {formatVND(comparePrice)}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                </article>
              );
            })}
          </div>

          {products.length > 1 && (
            <button
              type="button"
              onClick={scrollNext}
              aria-label="Lướt đến sản phẩm tiếp theo"
              className="absolute right-2 top-[39%] z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-white/60 bg-white/40 text-[#39342F]/80 shadow-[0_2px_7px_rgba(0,0,0,0.07)] backdrop-blur-xl transition-all duration-200 hover:bg-white/65 active:scale-95 sm:right-3 sm:h-9 sm:w-9"
            >
              <ChevronRight size={17} strokeWidth={1.7} />
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
