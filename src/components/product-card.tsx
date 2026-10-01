import { Link } from "@tanstack/react-router";
import { formatVND } from "@/lib/format";
import { getImageUrl } from "@/lib/storage";
import { ShoppingCart, Truck } from "lucide-react";
import { motion } from "framer-motion";
import clsx from "clsx";

interface Product {
  id: string;
  slug: string;
  name: string;
  price: number | string;
  image_url: string | null;
  stock?: number;
  color_preview?: string[];
  express_available?: boolean;

  /**
   * Social proof fields.
   * BestSeller.tsx injects these values so every product
   * can have different rating / review / sold numbers.
   */
  rating?: number;
  reviewCount?: number;
  reviews?: number;
  review_count?: number;

  sold?: number;
  soldCount?: number;
  sold_count?: number;
}

interface Props {
  product: Product;
  badge?: string;
  highlight?: boolean;
}

/**
 * ============================================================
 * STABLE RANDOM FALLBACK
 * ============================================================
 *
 * Used only when the product does not already have
 * rating / review / sold values.
 *
 * The result is deterministic:
 * - Same product = same numbers
 * - Reload does not change the numbers
 * - Different products get different numbers
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

function getSocialProof(product: Product) {
  const seed = String(
    product?.id ||
      product?.slug ||
      product?.name ||
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

  const generatedRating =
    ratingOptions[ratingIndex];

  const generatedReviews = stableRandom(
    `${seed}-reviews`,
    24,
    386
  );

  const generatedSold = stableRandom(
    `${seed}-sold`,
    48,
    980
  );

  /**
   * Priority:
   *
   * 1. rating
   * 2. reviewCount
   * 3. reviews
   * 4. review_count
   *
   * If none exists -> deterministic fallback.
   */
  const rating =
    typeof product.rating === "number"
      ? product.rating
      : generatedRating;

  const reviews =
    typeof product.reviewCount === "number"
      ? product.reviewCount
      : typeof product.reviews === "number"
        ? product.reviews
        : typeof product.review_count === "number"
          ? product.review_count
          : generatedReviews;

  /**
   * BestSeller injects soldCount / sold_count.
   * We intentionally prioritize those over product.sold
   * so the UI can display the randomized social-proof value.
   */
  const sold =
    typeof product.soldCount === "number"
      ? product.soldCount
      : typeof product.sold_count === "number"
        ? product.sold_count
        : typeof product.sold === "number"
          ? product.sold
          : generatedSold;

  return {
    rating,
    reviews,
    sold,
  };
}

export function ProductCard({
  product,
  badge,
  highlight = false,
}: Props) {
  const salePrice = Number(product.price);
  const originalPrice = Math.round(
    salePrice * 1.35
  );

  /**
   * ============================================================
   * SOCIAL PROOF
   * ============================================================
   */
  const socialProof =
    getSocialProof(product);

  return (
    <Link
      to="/products/$slug"
      params={{
        slug: product.slug,
      }}
      className="group block h-full"
    >
      <article
        className={clsx(
          `
            flex
            h-full
            flex-col
            overflow-hidden
            rounded-[20px]
            border
            border-[#E8E1D8]
            bg-[#FFFDFC]
            transition-all
            duration-300
            hover:-translate-y-1
            hover:border-[#D9CEC0]
            hover:shadow-[0_12px_30px_rgba(74,62,48,0.08)]
          `,
          highlight &&
            "border-[#D8C8B7]"
        )}
      >
        {/* ======================================================
            PRODUCT IMAGE
        ====================================================== */}

        <div
          className="
            relative
            aspect-square
            overflow-hidden
            bg-[#F6F3EE]
          "
        >
          {product.express_available === true && (
            <span
              className="
                absolute
                right-3
                top-3
                z-30
                inline-flex
                h-[24px]
                items-center
                gap-1.5
                rounded-full
                border
                border-[#E8D7C8]
                bg-[#FFF9F4]/95
                px-2.5
                text-[8px]
                font-semibold
                leading-none
                tracking-[0.01em]
                text-[#C85A1A]
                shadow-[0_2px_8px_rgba(120,70,35,0.08)]
                backdrop-blur-[2px]
                max-[480px]:right-2
                max-[480px]:top-2
                max-[480px]:h-[22px]
                max-[480px]:px-2
                max-[480px]:text-[7.5px]
              "
              title="Có hỗ trợ giao hỏa tốc"
            >
              <span
                className="
                  flex
                  h-[14px]
                  w-[14px]
                  shrink-0
                  items-center
                  justify-center
                  rounded-full
                  bg-[#FCEBDD]
                "
              >
                <Truck
                  className="h-[9px] w-[9px]"
                  strokeWidth={2}
                />
              </span>
              <span className="whitespace-nowrap">
                Hỏa tốc
              </span>
            </span>
          )}

          {badge && (
            <span
              className="
                absolute
                left-4
                top-4
                z-20
                rounded-full
                border
                border-[#E7DED3]
                bg-[#FBF8F3]/95
                px-3
                py-1.5
                text-[9px]
                font-medium
                uppercase
                tracking-[0.14em]
                text-[#6B6258]
                shadow-[0_2px_8px_rgba(74,62,48,0.05)]
              "
            >
              {badge}
            </span>
          )}

          {(product.stock ?? 99) <= 5 && (
            <span
              className={clsx(
                `
                  absolute
                  right-4
                  z-20
                  rounded-full
                  border
                  border-[#E7DED3]
                  bg-white/90
                  px-3
                  py-1.5
                  text-[9px]
                  font-medium
                  text-[#756C63]
                  shadow-[0_2px_8px_rgba(74,62,48,0.04)]
                  max-[480px]:right-2
                  max-[480px]:px-2.5
                  max-[480px]:py-1
                  max-[480px]:text-[8px]
                `,
                product.express_available
                  ? "top-11 max-[480px]:top-9"
                  : "top-4 max-[480px]:top-2"
              )}
            >
              Còn {product.stock}
            </span>
          )}

          <div className="absolute inset-0 flex items-center justify-center">
            <img
              src={
                product.image_url
                  ? getImageUrl(
                      product.image_url
                    )
                  : ""
              }
              alt={product.name}
              loading="lazy"
              className="
                h-full
                w-full
                object-cover
                transition-transform
                duration-500
                ease-out
                group-hover:scale-[1.025]
              "
            />
          </div>
        </div>

        {/* ======================================================
            CONTENT
        ====================================================== */}

        <div
          className="
            flex
            flex-1
            flex-col
            px-4
            pb-4
            pt-4
            lg:px-5
            lg:pb-5
          "
        >
          {/* ====================================================
              PRODUCT NAME
          ==================================================== */}

          <h3
            className="
              line-clamp-2
              min-h-[40px]
              text-[14px]
              font-medium
              leading-[1.45]
              tracking-[-0.005em]
              text-[#393530]
            "
          >
            {product.name}
          </h3>

          {/* ====================================================
              RATING + COLORS
          ==================================================== */}

          <div className="mt-2.5 flex min-h-[18px] items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span
                className="
                  text-[10px]
                  tracking-[1px]
                  text-[#B49A63]
                "
                aria-label={`Đánh giá ${socialProof.rating.toFixed(1)} trên 5`}
              >
                ★★★★★
              </span>

              <span className="text-[10px] text-[#6F6861]">
                {socialProof.rating.toFixed(1)}
              </span>

              <span className="text-[10px] text-[#AAA29A]">
                ({socialProof.reviews})
              </span>
            </div>

            {product.color_preview?.length ? (
              <div className="flex items-center gap-1">
                {product.color_preview
                  .slice(0, 3)
                  .map((color, index) => (
                    <span
                      key={`${product.id}-${index}`}
                      className="
                        h-3
                        w-3
                        rounded-full
                        border
                        border-white
                        shadow-[0_1px_3px_rgba(0,0,0,0.12)]
                        ring-1
                        ring-[#DDD6CE]
                      "
                      style={{
                        backgroundColor:
                          color,
                      }}
                    />
                  ))}

                {product.color_preview
                  .length > 3 && (
                  <span className="ml-0.5 text-[9px] text-[#9A928A]">
                    +
                    {product
                      .color_preview
                      .length - 3}
                  </span>
                )}
              </div>
            ) : null}
          </div>

          {/* ====================================================
              PRICE
          ==================================================== */}

          <div className="mt-3">
            <div className="text-[10px] text-[#A9A19A] line-through">
              {formatVND(originalPrice)}
            </div>

            <div
              className="
                mt-0.5
                text-[19px]
                font-semibold
                leading-tight
                tracking-[-0.015em]
                text-[#3A3733]
              "
            >
              {formatVND(salePrice)}
            </div>
          </div>

          {/* ====================================================
              SERVICE INFO + SOLD
          ==================================================== */}

          <div
            className="
              mt-3
              flex
              min-w-0
              items-center
              gap-2
              text-[10px]
              text-[#81786F]
            "
          >
            <span className="shrink-0">
              Freeship
            </span>

            <span className="text-[#C8C0B8]">
              ·
            </span>

            <span className="shrink-0">
              Đổi trả 15 ngày
            </span>

            <span className="text-[#C8C0B8]">
              ·
            </span>

            <span
              className="truncate"
              title={`${socialProof.sold.toLocaleString(
                "vi-VN"
              )} lượt mua`}
            >
              {socialProof.sold.toLocaleString(
                "vi-VN"
              )} đã bán
            </span>
          </div>

          {/* ====================================================
              CTA
          ==================================================== */}

          <div className="mt-4 flex items-center gap-2">
            <motion.button
              whileHover={{ y: -1 }}
              whileTap={{
                scale: 0.985,
              }}
              className="
                h-10
                flex-1
                rounded-xl
                bg-[#5E6754]
                px-3
                text-[11px]
                font-medium
                tracking-[0.01em]
                text-white
                transition-colors
                duration-200
                hover:bg-[#4F5847]
              "
            >
              Mua ngay
            </motion.button>

            <button
              type="button"
              aria-label="Thêm vào giỏ hàng"
              className="
                flex
                h-10
                w-10
                shrink-0
                items-center
                justify-center
                rounded-xl
                border
                border-[#DDD5CC]
                bg-[#FAF8F5]
                text-[#5E5A55]
                transition-all
                duration-200
                hover:border-[#5E6754]
                hover:bg-[#5E6754]
                hover:text-white
              "
            >
              <ShoppingCart
                size={16}
                strokeWidth={1.7}
              />
            </button>
          </div>
        </div>
      </article>
    </Link>
  );
}

export default ProductCard;
