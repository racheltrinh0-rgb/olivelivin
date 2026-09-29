import {
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { ProductCardProduct } from "@/components/product-card";
import { useRef } from "react";

interface Props {
  products: ProductCardProduct[];
}

export default function NewArrival({
  products,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (!products?.length) return null;

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;

    const amount =
      scrollRef.current.clientWidth * 0.8;

    scrollRef.current.scrollBy({
      left:
        direction === "right"
          ? amount
          : -amount,
      behavior: "smooth",
    });
  };

  return (
    <section className="relative overflow-hidden bg-[#F8F6F2] py-16 sm:py-20 lg:py-24">

      {/* =====================================================
          CONTAINER
      ===================================================== */}

      <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8">

        {/* ===================================================
            HEADER
        =================================================== */}

        <div className="mb-8 flex items-end justify-between gap-4 sm:mb-10">

          <div>

            <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-neutral-500 sm:text-xs">
              NEW ARRIVAL
            </p>

            <h2 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-[#1F1F1F] sm:text-4xl lg:text-5xl">
              Sản phẩm mới
            </h2>

          </div>


          {/* DESKTOP ARROWS */}

          <div className="hidden items-center gap-2 sm:flex">

            <button
              type="button"
              onClick={() => scroll("left")}
              aria-label="Sản phẩm trước"
              className="
                flex
                h-10
                w-10
                items-center
                justify-center
                rounded-full
                border
                border-[#D9D5CF]
                bg-white
                text-[#222]
                transition-all
                hover:border-black
                hover:bg-black
                hover:text-white
                lg:h-11
                lg:w-11
              "
            >
              <ChevronLeft size={18} />
            </button>

            <button
              type="button"
              onClick={() => scroll("right")}
              aria-label="Sản phẩm tiếp theo"
              className="
                flex
                h-10
                w-10
                items-center
                justify-center
                rounded-full
                border
                border-[#D9D5CF]
                bg-white
                text-[#222]
                transition-all
                hover:border-black
                hover:bg-black
                hover:text-white
                lg:h-11
                lg:w-11
              "
            >
              <ChevronRight size={18} />
            </button>

          </div>

        </div>


        {/* ===================================================
            PRODUCT SCROLLER
        =================================================== */}

        <div
          ref={scrollRef}
          className="
            flex
            snap-x
            snap-mandatory
            gap-3
            overflow-x-auto
            pb-4
            [-ms-overflow-style:none]
            [scrollbar-width:none]
            [&::-webkit-scrollbar]:hidden

            sm:gap-4
          "
        >

          {products.map((product) => (

            <div
              key={product.id}
              className="
                w-[72vw]
                max-w-[290px]
                shrink-0
                snap-start

                sm:w-[calc((100%-12px)/2)]
                sm:max-w-none

                lg:w-[calc((100%-48px)/4)]
              "
            >

              <Link
                to="/products/$slug"
                params={{
                  slug: product.slug,
                }}
                className="group block h-full"
              >

                {/* =================================================
                    CARD
                ================================================= */}

                <article
                  className="
                    flex
                    h-full
                    flex-col
                    overflow-hidden
                    rounded-[20px]
                    bg-white

                    shadow-[0_8px_30px_rgba(35,30,25,0.07)]

                    transition-all
                    duration-500

                    group-hover:-translate-y-1
                    group-hover:shadow-[0_18px_45px_rgba(35,30,25,0.13)]

                    sm:rounded-[22px]
                    lg:rounded-[24px]
                  "
                >

                  {/* =================================================
                      IMAGE
                  ================================================= */}

                  <div className="relative aspect-[4/5] overflow-hidden bg-[#F1EEE9]">

                    <img
                      src={
                        product.image_url ??
                        "/placeholder.svg"
                      }
                      alt={product.name}
                      loading="lazy"
                      className="
                        h-full
                        w-full
                        object-cover

                        transition-transform
                        duration-700
                        ease-out

                        group-hover:scale-[1.04]
                      "
                    />

                    {/* NEW BADGE */}

                    <div className="absolute left-3 top-3 sm:left-4 sm:top-4">

                      <span
                        className="
                          rounded-full
                          bg-white/95
                          px-3
                          py-1.5
                          text-[9px]
                          font-semibold
                          uppercase
                          tracking-[0.18em]
                          text-[#222]
                          shadow-sm
                          backdrop-blur
                        "
                      >
                        NEW
                      </span>

                    </div>

                  </div>


                  {/* =================================================
                      CONTENT
                  ================================================= */}

                  <div className="flex flex-1 flex-col p-4 sm:p-5">

                    <h3
                      className="
                        line-clamp-2
                        min-h-[44px]
                        text-sm
                        font-medium
                        leading-6
                        tracking-[-0.01em]
                        text-[#222]

                        sm:min-h-[48px]
                        sm:text-[15px]
                      "
                    >
                      {product.name}
                    </h3>


                    {/* =================================================
                        CTA
                    ================================================= */}

                    <div className="mt-auto pt-5">

                      <span
                        className="
                          inline-flex
                          items-center
                          gap-2
                          text-xs
                          font-semibold
                          text-[#222]

                          transition-all
                          duration-300

                          group-hover:gap-3

                          sm:text-sm
                        "
                      >
                        Xem sản phẩm

                        <ChevronRight
                          size={15}
                          className="
                            transition-transform
                            duration-300
                            group-hover:translate-x-1
                          "
                        />

                      </span>

                    </div>

                  </div>

                </article>

              </Link>

            </div>

          ))}

        </div>

      </div>

    </section>
  );
}