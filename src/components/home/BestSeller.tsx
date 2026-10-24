import React, { useRef } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  ExternalLink,
} from "lucide-react";
import { Link } from "@tanstack/react-router";

type BestSellerProps = {
  products?: any[];
};

const formatVND = (price: number) =>
  `${new Intl.NumberFormat("vi-VN").format(price)}₫`;

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
        <div className="mb-7 sm:mb-8">
          {/* EDITORIAL EYEBROW */}
          <div className="mb-3 inline-flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-[#F8F2EB]">
              <Heart className="h-3.5 w-3.5 text-[#A97956]" strokeWidth={1.7} />
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#A18F7E] sm:text-[11px]">
              The Olive Edit
            </span>
            <span className="h-px w-8 bg-[#DED3C7]" />
            <span className="text-[9px] uppercase tracking-[0.14em] text-[#B3A79B]">
              Customer favorites
            </span>
          </div>

          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <h2 className="font-serif text-[30px] font-normal leading-[1.08] tracking-[-0.035em] text-[#292621] sm:text-[36px]">
                Most Loved<span className="text-[#B98561]">.</span>
              </h2>

              <p className="mt-2.5 max-w-[420px] text-[13px] leading-[1.65] text-[#81786F] sm:text-sm">
                Thoughtfully chosen pieces, made to feel at home.
              </p>

              <div className="mt-3.5 inline-flex items-center gap-2 text-[11px] text-[#8D7B6B]">
                <Heart className="h-3.5 w-3.5 text-[#B98561]" strokeWidth={1.7} />
                <span>Được khách hàng yêu thích</span>
              </div>
            </div>
          </div>
        </div>

        {/* =====================================================
            DIVIDER
        ===================================================== */}
        <div className="mb-6 h-px w-full bg-[#F0ECE6] sm:mb-7" />

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
                  <article
                    className="
                      group relative isolate h-full
                      overflow-hidden rounded-[22px]
                      border border-[#EAE7E2]
                      bg-white
                      shadow-[0_3px_14px_rgba(35,30,25,0.10)]
                      transition-all duration-300
                      hover:-translate-y-1
                      hover:shadow-[0_8px_24px_rgba(35,30,25,0.15)]
                    "
                  >
                    <Link
                      to="/products/$slug"
                      params={{ slug: product.slug }}
                      className="block h-full"
                    >
                      <div className="relative aspect-[4/5] overflow-hidden rounded-t-[21px] bg-[#F5F3EF]">
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name ?? "Product"}
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

                        {Number(product.compare_at_price ?? 0) > Number(product.price ?? 0) &&
                          Number(product.price ?? 0) > 0 && (
                            <span className="absolute left-3 top-3 rounded-full bg-[#FF4D00] px-2.5 py-1 text-[10px] font-semibold text-white">
                              SALE
                            </span>
                          )}

                        <span
                          aria-hidden="true"
                          className="absolute right-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-lg border border-white/75 bg-white/85 text-[#292621] shadow-[0_2px_6px_rgba(0,0,0,0.08)] backdrop-blur-md transition-all duration-200 group-hover:bg-white group-hover:text-[#4D5745] sm:right-3 sm:top-3 sm:h-8 sm:w-8"
                        >
                          <ExternalLink size={15} strokeWidth={1.8} />
                        </span>
                      </div>

                      <div className="flex min-h-[108px] flex-col p-3.5 sm:min-h-[120px] sm:p-4">
                        <h3 className="line-clamp-2 text-[12px] font-medium leading-[1.6] text-[#39342F] sm:text-sm">
                          {product.name}
                        </h3>

                        <div className="mt-auto flex flex-wrap items-center gap-x-2 gap-y-1 pt-3">
                          {Number(product.price ?? 0) > 0 ? (
                            <span className="text-[13px] font-semibold text-[#39342F] sm:text-sm">
                              {formatVND(Number(product.price))}
                            </span>
                          ) : (
                            <span className="text-xs text-[#8A8178]">Liên hệ</span>
                          )}

                          {Number(product.compare_at_price ?? 0) > Number(product.price ?? 0) && (
                            <span className="text-[10px] text-[#A49A90] line-through sm:text-xs">
                              {formatVND(Number(product.compare_at_price))}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  </article>

                </div>
              )
            )}

          </div>

          {/* Single subtle glass next button, balanced against the product cards */}
          <button
            type="button"
            onClick={() => scroll("right")}
            aria-label="Xem sản phẩm tiếp theo"
            className="absolute right-2 top-[42%] z-20 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full border border-white/35 bg-white/35 text-[#39342F]/75 shadow-[0_1px_5px_rgba(0,0,0,0.06)] backdrop-blur-sm transition-all duration-200 hover:bg-white/55 active:scale-95 sm:right-3 sm:h-8 sm:w-8"
          >
            <ChevronRight className="h-3.5 w-3.5" strokeWidth={1.6} />
          </button>
        </div>


      </div>
    </section>
  );
}