
import { useRef } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";

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

export default function NewArrival({
  products,
}: NewArrivalProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  const scrollNext = () => {
    const container = scrollerRef.current;
    if (!container) return;

    const card = container.querySelector<HTMLElement>(
      "[data-new-arrival-card]",
    );

    const gap = 20;
    const distance = card
      ? card.getBoundingClientRect().width + gap
      : 260;

    container.scrollBy({
      left: distance,
      behavior: "smooth",
    });
  };

  if (!products?.length) return null;

  return (
    <section className="relative w-full bg-white py-8 sm:py-10 lg:py-12">
      <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8">
        {/* HEADING */}
        <div className="mb-5 sm:mb-7">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#A49A90] sm:text-xs">
            Olive Living Selection
          </p>

          <h2 className="text-[22px] font-medium tracking-[-0.03em] text-[#292621] sm:text-2xl lg:text-3xl">
            New Arrivals
          </h2>
        </div>

        {/* PRODUCT SCROLLER + GLASS ARROW */}
        <div className="relative">
          <div
            ref={scrollerRef}
            className="
              flex snap-x snap-mandatory
              gap-5 overflow-x-auto
              px-2 pb-5 pt-3
              sm:gap-6 sm:px-3
              [scrollbar-width:none]
              [-ms-overflow-style:none]
              [&::-webkit-scrollbar]:hidden
            "
          >
            {products.map((product) => {
              const price = Number(product.price ?? 0);
              const comparePrice = Number(
                product.compare_at_price ?? 0,
              );

              const hasDiscount =
                comparePrice > price && price > 0;

              return (
                <article
                  key={product.id}
                  data-new-arrival-card
                  className="
                    group relative isolate
                    w-[68%] min-w-[220px] max-w-[280px]
                    shrink-0 snap-start
                    overflow-hidden rounded-[22px]
                    border border-[#EAE7E2]
                    bg-white
                    shadow-[0_3px_14px_rgba(35,30,25,0.10)]
                    transition-all duration-300
                    hover:-translate-y-1
                    hover:shadow-[0_8px_24px_rgba(35,30,25,0.15)]
                    sm:w-[42%]
                    md:w-[30%]
                    lg:w-[23%]
                  "
                >
                  <Link
                    to="/products/$slug"
                    params={{ slug: product.slug }}
                    className="block h-full"
                  >
                    {/* PRODUCT IMAGE */}
                    <div className="relative aspect-[4/5] overflow-hidden rounded-t-[21px] bg-[#F5F3EF]">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          loading="lazy"
                          className="
                            h-full w-full object-cover
                            transition-transform duration-500
                            group-hover:scale-[1.03]
                          "
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-[#A49A90]">
                          Chưa có hình ảnh
                        </div>
                      )}

                      {/* DISCOUNT BADGE */}
                      {hasDiscount && (
                        <span className="absolute left-3 top-3 rounded-full bg-[#FF4D00] px-2.5 py-1 text-[10px] font-semibold text-white">
                          SALE
                        </span>
                      )}

                      {/* GLASS PRODUCT BUTTON */}
                      <span
                        className="
                          absolute bottom-3 left-3 right-3
                          flex items-center justify-center
                          rounded-full
                          border border-white/70
                          bg-white/75
                          px-3 py-2.5
                          text-xs font-medium
                          text-[#292621]
                          shadow-[0_2px_10px_rgba(0,0,0,0.06)]
                          backdrop-blur-md
                          transition-colors duration-200
                          group-hover:bg-white/90
                          sm:bottom-4 sm:left-4 sm:right-4
                        "
                      >
                        Xem sản phẩm
                      </span>
                    </div>

                    {/* PRODUCT DETAILS */}
                    <div className="flex min-h-[108px] flex-col p-3.5 sm:min-h-[120px] sm:p-4">
                      <h3 className="line-clamp-2 text-[12px] font-medium leading-[1.6] text-[#39342F] sm:text-sm">
                        {product.name}
                      </h3>

                      <div className="mt-auto flex flex-wrap items-center gap-x-2 gap-y-1 pt-3">
                        {price > 0 ? (
                          <span className="text-[13px] font-semibold text-[#39342F] sm:text-sm">
                            {formatVND(price)}
                          </span>
                        ) : (
                          <span className="text-xs text-[#8A8178]">
                            Liên hệ
                          </span>
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

          {/* GLASSMORPHISM NEXT BUTTON */}
          {products.length > 1 && (
            
            
<button
  type="button"
  onClick={scrollNext}
  aria-label="Lướt đến sản phẩm tiếp theo"
  className="
    absolute right-1 top-[42%] z-20
    flex h-8 w-8
    -translate-y-1/2
    items-center justify-center
    rounded-full
    border border-white/70
    bg-white/45
    text-[#39342F]
    shadow-[0_2px_8px_rgba(0,0,0,0.10)]
    backdrop-blur-xl
    transition-all duration-200
    hover:bg-white/75
    active:scale-95
    sm:right-2 sm:h-9 sm:w-9
  "
>
  <ChevronRight
    size={17}
    strokeWidth={1.7}
  />
</button>


          )}
        </div>
      </div>
    </section>
  );
}
