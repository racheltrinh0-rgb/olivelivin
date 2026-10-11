import { Link } from "@tanstack/react-router";
import { useCart } from "@/lib/cart";
import { toast } from "sonner";
import { useEffect, useState } from "react";

import { formatVND } from "@/lib/format";

import { getImageUrl } from "@/lib/storage";

import { ShoppingCart, Truck, Clock3 } from "lucide-react";

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
  old_price?: number | string | null;
  compare_at_price?: number | string | null;
  flash_sale_active?: boolean;
  flash_sale_discount?: number | string;
  flash_sale_title?: string;
  flash_sale_price?: number | string;
  flash_sale_end_at?: string | null;



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
  const { add } = useCart();

  const salePrice = Number(
    product.flash_sale_active && product.flash_sale_price != null
      ? product.flash_sale_price
      : product.price
  );
  const rawOriginalPrice = product.old_price ?? product.compare_at_price;
  const originalPrice = rawOriginalPrice != null ? Number(rawOriginalPrice) : null;
  const showFlashSale =
    product.flash_sale_active === true &&
    Number(product.flash_sale_discount) > 0 &&
    Number(product.flash_sale_discount) < 100;
  const flashSaleDiscount = Math.round(Number(product.flash_sale_discount) || 0);

  const [countdownNow, setCountdownNow] = useState(() => Date.now());

  useEffect(() => {
    if (!showFlashSale || !product.flash_sale_end_at) return;

    const updateNow = () => setCountdownNow(Date.now());
    updateNow();
    const timer = window.setInterval(updateNow, 60_000);
    return () => window.clearInterval(timer);
  }, [showFlashSale, product.flash_sale_end_at]);

  const saleEndTime = product.flash_sale_end_at
    ? new Date(product.flash_sale_end_at).getTime()
    : NaN;
  const remainingMs = Number.isFinite(saleEndTime)
    ? Math.max(0, saleEndTime - countdownNow)
    : 0;
  const remainingDays = Math.floor(remainingMs / 86_400_000);
  const remainingHours = Math.floor((remainingMs % 86_400_000) / 3_600_000);
  const remainingMinutes = Math.floor((remainingMs % 3_600_000) / 60_000);
  const countdownLabel = remainingDays > 0
    ? `CÒN ${remainingDays} NGÀY ${remainingHours} GIỜ`
    : remainingHours > 0
      ? `CÒN ${remainingHours} GIỜ ${remainingMinutes} PHÚT`
      : `CÒN ${remainingMinutes} PHÚT`;
  const savingAmount = originalPrice != null && Number.isFinite(originalPrice)
    ? Math.max(0, originalPrice - salePrice)
    : 0;



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

            rounded-[14px] border-0 bg-[#FFFDFC] transition-colors duration-200

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

            aspect-[4/3]

            overflow-hidden

            bg-[#F6F3EE]

          "

        >

          {(showFlashSale || product.express_available === true) && (
            <div className="absolute left-2 right-2 top-2 z-30 flex items-start justify-between gap-1.5 sm:left-3 sm:right-3 sm:top-3 sm:gap-2">
              {showFlashSale ? (
                <span
                  className="inline-flex h-[22px] min-w-0 shrink items-center justify-center rounded-full bg-gradient-to-r from-[#F46B32] to-[#F08A42] px-2 text-[8px] font-semibold leading-none tracking-[0.01em] text-white shadow-[0_3px_10px_rgba(220,94,39,0.20)] sm:h-6 sm:px-2.5 sm:text-[9px]"
                  title={product.flash_sale_title || `Flash Sale giảm ${flashSaleDiscount}%`}
                >
                  <span className="truncate">FLASH SALE -{flashSaleDiscount}%</span>
                </span>
              ) : <span />}

              {product.express_available === true && (
                <span
                  className="inline-flex h-[22px] shrink-0 items-center justify-center gap-1 rounded-full border border-[#E8D7C8] bg-[#FFF9F4]/95 px-2 text-[8px] font-semibold leading-none tracking-[0.01em] text-[#C85A1A] shadow-[0_2px_8px_rgba(120,70,35,0.08)] backdrop-blur-[2px] sm:h-6 sm:gap-1.5 sm:px-2.5"
                  title="Có hỗ trợ giao hỏa tốc"
                >
                  <Truck className="h-3 w-3 shrink-0" aria-hidden="true" />
                  Hỏa tốc
                </span>
              )}
            </div>
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

            px-2

            pb-3

            pt-2

            sm:px-3

            sm:pb-3.5

            sm:pt-2.5

            lg:px-4

            lg:pb-4

          "

        >

          {/* ====================================================

              PRODUCT NAME

          ==================================================== */}



          <h3

            className="

              line-clamp-2

              min-h-[32px]

              text-[12px]

              font-medium

              leading-[1.35]

              sm:min-h-[36px]

              sm:text-[13px]

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



          <div className="mt-2 h-[25px]">
            {showFlashSale ? (
              <div className="flex h-full min-w-0 items-center justify-center rounded-md border border-[#F2D7C3] bg-[#FFF5EC] px-2">
                {product.flash_sale_end_at && remainingMs > 0 ? (
                  <span className="flex min-w-0 items-center justify-center gap-1 text-[8px] font-medium tabular-nums text-[#8E4B2B] sm:text-[9px]">
                    <Clock3 className="h-3 w-3 shrink-0" strokeWidth={1.7} />
                    <span className="truncate">{countdownLabel}</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[8px] font-medium text-[#B96A3B]">
                    <Clock3 className="h-3 w-3 shrink-0" strokeWidth={1.7} />
                    -{flashSaleDiscount}%
                  </span>
                )}
              </div>
            ) : (
              <div aria-hidden="true" className="h-full" />
            )}
          </div>

          <div className="mt-2 flex min-h-[25px] min-w-0 flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
            <span className="text-[17px] font-semibold leading-tight tracking-[-0.025em] text-[#34352F] sm:text-[18px]">
              {formatVND(salePrice)}
            </span>
            {originalPrice != null && Number.isFinite(originalPrice) && originalPrice > salePrice && (
              <span className="text-[9px] leading-tight text-[#A9A19A] line-through">
                {formatVND(originalPrice)}
              </span>
            )}
          </div>
          <div className="mt-1 h-[17px]">
            {showFlashSale && savingAmount > 0 ? (
              <span className="inline-flex h-[17px] max-w-full items-center rounded-sm bg-[#FFF0E5] px-1.5 text-[8px] font-medium leading-none text-[#B96A3B]">
                <span className="truncate">Tiết kiệm {formatVND(savingAmount)}</span>
              </span>
            ) : (
              <span aria-hidden="true" className="invisible inline-flex h-[17px]">.</span>
            )}
          </div>



          {/* ====================================================

              SERVICE INFO + SOLD

          ==================================================== */}



          <div

            className="

              mt-2

              flex

              min-h-[15px]

              min-w-0

              items-center

              gap-1.5

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



          <div className="mt-auto flex items-center gap-2 pt-3">

            <motion.button

              whileHover={{ y: -1 }}

              whileTap={{

                scale: 0.985,

              }}

              className="

                h-10

                min-w-0

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

              aria-label={`Thêm ${product.name} vào giỏ hàng`}

              onClick={(event) => {
                // The card is wrapped in a product Link; stop its navigation.
                event.preventDefault();
                event.stopPropagation();

                if (product.stock !== undefined && Number(product.stock) <= 0) {
                  toast.error("Sản phẩm hiện đã hết hàng");
                  return;
                }

                add(
                  {
                    id: product.id,
                    slug: product.slug,
                    name: product.name,
                    price: salePrice,
                    image: product.image_url || null,
                  },
                  1
                );

                toast.success("Đã thêm vào giỏ hàng", {
                  description: `${product.name} × 1`,
                });
              }}

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
