import React, { useRef } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Flame,
} from "lucide-react";
import HomeProductCard from "./HomeProductCard";

type BestSellerProps = {
  products?: any[];
};

/**
 * ============================================================
 * STABLE RANDOM
 * ============================================================
 * Tạo số "random" nhưng ổn định theo seed.
 *
 * Vì dùng product.id / slug / sku làm seed nên:
 * - Reload trang không đổi số
 * - Mỗi sản phẩm có số khác nhau
 * - Không cần Math.random()
 */
function stableRandom(
  seed: string,
  min: number,
  max: number
) {
  let hash = 0;

  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }

  const normalized = Math.abs(Math.sin(hash)) % 1;

  return Math.floor(
    normalized * (max - min + 1)
  ) + min;
}

/**
 * ============================================================
 * PRODUCT SOCIAL PROOF
 * ============================================================
 *
 * Mỗi sản phẩm sẽ có:
 *
 * Rating:
 * 4.7 / 4.8 / 4.9 / 5.0
 *
 * Reviews:
 * 24 → 386
 *
 * Sold:
 * 48 → 980
 *
 * Các giá trị được tạo ổn định theo sản phẩm.
 */
function getProductSocialProof(product: any) {
  const seed = String(
    product?.id ??
      product?.slug ??
      product?.sku ??
      product?.name ??
      product?.title ??
      "product"
  );

  const ratingOptions = [
    4.7,
    4.8,
    4.9,
    5.0,
  ];

  const ratingIndex = stableRandom(
    `${seed}-rating`,
    0,
    ratingOptions.length - 1
  );

  const rating =
    ratingOptions[ratingIndex];

  const reviews = stableRandom(
    `${seed}-reviews`,
    24,
    386
  );

  const sold = stableRandom(
    `${seed}-sold`,
    48,
    980
  );

  return {
    rating,
    reviews,
    sold,
  };
}

export default function BestSeller({
  products = [],
}: BestSellerProps) {
  const sliderRef =
    useRef<HTMLDivElement | null>(null);

  /**
   * ============================================================
   * BEST SELLERS
   * ============================================================
   *
   * Quan trọng:
   * Vẫn dùng sold thật để SORT sản phẩm.
   *
   * Random social proof chỉ dùng để hiển thị.
   */
  const bestSellers = [...products]
    .filter(
      (product) =>
        product?.id &&
        product?.price
    )
    .sort((a, b) => {
      const soldA =
        Number(a?.sold) || 0;

      const soldB =
        Number(b?.sold) || 0;

      return soldB - soldA;
    })
    .slice(0, 8);

  /**
   * ============================================================
   * ADD SOCIAL PROOF
   * ============================================================
   *
   * Không mutate object gốc.
   * Tạo object mới cho từng product.
   */
  const displayProducts =
    bestSellers.map((product) => {
      const socialProof =
        getProductSocialProof(product);

      return {
        ...product,

        /**
         * Các key phổ biến để HomeProductCard
         * có thể đọc được.
         */
        rating:
          socialProof.rating,

        reviewCount:
          socialProof.reviews,

        reviews:
          socialProof.reviews,

        review_count:
          socialProof.reviews,

        sold:
          socialProof.sold,

        soldCount:
          socialProof.sold,

        sold_count:
          socialProof.sold,
      };
    });

  if (displayProducts.length === 0) {
    return null;
  }

  /**
   * ============================================================
   * CAROUSEL SCROLL
   * ============================================================
   */
  const scroll = (
    direction: "left" | "right"
  ) => {
    if (!sliderRef.current) return;

    const amount = Math.min(
      Math.max(
        sliderRef.current.clientWidth *
          0.78,
        320
      ),
      900
    );

    sliderRef.current.scrollBy({
      left:
        direction === "left"
          ? -amount
          : amount,
      behavior: "smooth",
    });
  };

  return (
    <section className="w-full bg-white py-10 sm:py-12 lg:py-14">
      <div className="mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-8">

        {/* =====================================================
            SECTION HEADER
        ===================================================== */}
        <div className="mb-7">
          <div className="mb-3 inline-flex items-center rounded-full bg-[#FBF7F1] px-3 py-1.5">
            <Flame
              className="mr-1.5 h-3 w-3 text-[#C46E3E]"
              strokeWidth={2}
            />

            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#B66A3C]">
              Top Selling
            </span>
          </div>

          <div className="flex items-end justify-between gap-5">
            <div>
              <h2 className="font-serif text-[28px] font-medium leading-tight tracking-[-0.02em] text-[#292722] sm:text-[32px]">
                Most Loved
              </h2>

              <p className="mt-2 max-w-[680px] text-[13px] leading-5 text-[#77736C]">
                The pieces everyone’s talking about.
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-2">

                {/* CUSTOMER FAVORITE */}
                <span className="inline-flex items-center rounded-full bg-[#FBF7F1] px-3 py-1.5 text-[11px] font-medium text-[#B66A3C]">
                  <span className="mr-1.5 text-[10px]">
                    ⭐
                  </span>

                  Khách hàng yêu thích
                </span>

                {/* UPDATE */}
                <span className="inline-flex items-center rounded-full bg-[#F7F6F3] px-3 py-1.5 text-[11px] text-[#77736C]">
                  Cập nhật mỗi tuần
                </span>
              </div>
            </div>

            {/* =================================================
                DESKTOP NAVIGATION
            ================================================= */}
            <div className="hidden shrink-0 items-center gap-2 sm:flex">

              <button
                type="button"
                onClick={() =>
                  scroll("left")
                }
                aria-label="Xem sản phẩm trước"
                className="grid h-9 w-9 place-items-center rounded-full border border-[#E4DED5] bg-white text-[#5D5A54] transition-colors hover:bg-[#F8F6F2]"
              >
                <ChevronLeft
                  className="h-4 w-4"
                  strokeWidth={1.7}
                />
              </button>

              <button
                type="button"
                onClick={() =>
                  scroll("right")
                }
                aria-label="Xem sản phẩm tiếp theo"
                className="grid h-9 w-9 place-items-center rounded-full border border-[#E4DED5] bg-white text-[#5D5A54] transition-colors hover:bg-[#F8F6F2]"
              >
                <ChevronRight
                  className="h-4 w-4"
                  strokeWidth={1.7}
                />
              </button>

            </div>
          </div>
        </div>

        {/* =====================================================
            DIVIDER
        ===================================================== */}
        <div className="mb-7 h-px w-full bg-[#EAE6DF]" />

        {/* =====================================================
            PRODUCT CAROUSEL
        ===================================================== */}
        <div className="relative">

          <div
            ref={sliderRef}
            className="
              flex
              gap-4
              overflow-x-auto
              scroll-smooth
              pb-2
              snap-x
              snap-mandatory
              [scrollbar-width:none]
              [&::-webkit-scrollbar]:hidden
            "
          >

            {displayProducts.map(
              (product, index) => (
                <div
                  key={product.id}
                  className="
                    relative
                    w-[210px]
                    shrink-0
                    snap-start
                    sm:w-[220px]
                    md:w-[230px]
                    lg:w-[calc((100%-48px)/5)]
                  "
                >

                  {/* =================================================
                      BEST SELLER LABEL
                  ================================================= */}
                  {index === 0 && (
                    <div className="pointer-events-none absolute left-2.5 top-2.5 z-20 rounded-full border border-[#E9DFD2] bg-[#FBF8F3]/95 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-[#6B6258]">
                      Best seller
                    </div>
                  )}

                  {/* =================================================
                      PRODUCT CARD
                      socialProof đã được inject vào product
                  ================================================= */}
                  <HomeProductCard
                    product={product}
                  />

                </div>
              )
            )}

          </div>
        </div>

        {/* =====================================================
            MOBILE NAVIGATION
        ===================================================== */}
        <div className="mt-5 flex items-center justify-center gap-2 sm:hidden">

          <button
            type="button"
            onClick={() =>
              scroll("left")
            }
            aria-label="Xem sản phẩm trước"
            className="grid h-9 w-9 place-items-center rounded-full border border-[#E4DED5] bg-white text-[#5D5A54] transition-colors hover:bg-[#F8F6F2]"
          >
            <ChevronLeft
              className="h-4 w-4"
              strokeWidth={1.7}
            />
          </button>

          <span className="px-2 text-[11px] text-[#8A857D]">
            Vuốt để xem thêm
          </span>

          <button
            type="button"
            onClick={() =>
              scroll("right")
            }
            aria-label="Xem sản phẩm tiếp theo"
            className="grid h-9 w-9 place-items-center rounded-full border border-[#E4DED5] bg-white text-[#5D5A54] transition-colors hover:bg-[#F8F6F2]"
          >
            <ChevronRight
              className="h-4 w-4"
              strokeWidth={1.7}
            />
          </button>

        </div>

      </div>
    </section>
  );
}