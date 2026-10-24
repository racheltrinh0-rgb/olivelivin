import { Link } from "@tanstack/react-router";
import { useCart } from "@/lib/cart";
import { toast } from "sonner";
import { useEffect, useState } from "react";

import { formatVND } from "@/lib/format";

import { getImageUrl } from "@/lib/storage";

import { ShoppingCart, Truck, Clock3, ExternalLink } from "lucide-react";


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



// Shorten card titles cleanly without adding an ellipsis.
const getShortProductName = (name: string, maxWords = 5) => {
  // Keep only the product's main name; remove marketing/descriptive suffixes.
  const mainName = name.split(/\s+[–—-]\s+/)[0].trim();
  const words = mainName.split(/\s+/);
  return words.length > maxWords ? words.slice(0, maxWords).join(" ") : mainName;
};

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

      className="group block h-full w-full"

    >

      <article

        className={clsx(

          `

            flex

            h-full

            min-w-0

            flex-col

            overflow-hidden

            rounded-[24px] border-0 bg-white font-sans
            shadow-[0_10px_28px_rgba(35,30,25,0.16)]
            transition-all duration-300
            hover:-translate-y-1
            hover:shadow-[0_18px_42px_rgba(35,30,25,0.24)]

          `,

          highlight &&

            ""

        )}
        style={{ fontFamily: "Arial, Helvetica, sans-serif" }}

      >

        {/* ======================================================

            PRODUCT IMAGE

        ====================================================== */}



        <div

          className="

            relative

            mx-0.5 mt-1

            aspect-[4/5]

            overflow-hidden

            rounded-[20px]

            bg-[#F2F2F2]

          "

        >

          {(showFlashSale || product.express_available === true) && (
            <div className="absolute left-2 right-2 top-2 z-30 flex items-start justify-start gap-1.5 sm:left-3 sm:right-3 sm:top-3 sm:gap-2">
              {product.express_available === true && (
                <span
  className="inline-flex h-5 shrink-0 items-center justify-center gap-0.5 rounded-full bg-[#E8F7EE] px-1.5 text-[8px] font-bold leading-none text-[#16834A] shadow-[0_2px_6px_rgba(0,0,0,0.08)] sm:h-6 sm:gap-1 sm:px-2.5 sm:text-[10px]"
  title="Có hỗ trợ giao hỏa tốc"
>
  <Truck
    className="h-2.5 w-2.5 shrink-0 sm:h-3 sm:w-3"
    aria-hidden="true"
  />
  Hỏa tốc
</span>
              )}

              {showFlashSale && (
                <span
                  className="inline-flex h-5 min-w-0 shrink items-center justify-center rounded-full bg-[#4D5745] px-1.5 text-[8px] font-extrabold leading-none tracking-[-0.02em] text-white shadow-[0_2px_7px_rgba(0,0,0,0.16)] sm:h-6 sm:px-2.5 sm:text-[10px]"
                  title={product.flash_sale_title || `Flash Sale giảm ${flashSaleDiscount}%`}
                >
                  <span className="truncate">SAVE {flashSaleDiscount}%</span>
                </span>
              )}
            </div>
          )}

          <span
            aria-hidden="true"
            className="absolute right-2 top-2 z-20 flex h-6 w-6 items-center justify-center rounded-lg border border-white/75 bg-white/90 text-[#292621] shadow-[0_3px_9px_rgba(0,0,0,0.16)] backdrop-blur-md transition-all duration-200 group-hover:bg-white group-hover:text-[#4D5745] sm:right-3 sm:top-3 sm:h-10 sm:w-10"
          >
            <ExternalLink size={12} strokeWidth={1.8} className="sm:hidden" />
            <ExternalLink size={18} strokeWidth={1.8} className="hidden sm:block" />
          </span>

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

            pb-4

            pt-3

            sm:px-4

            sm:pb-5

            sm:pt-3.5

            lg:px-4

            lg:pb-4

          "

        >

          {/* ====================================================

              PRODUCT NAME

          ==================================================== */}



          <h3
  className="
    min-h-[32px]
    max-w-full
    overflow-hidden
    font-sans
    text-[11px]
    font-bold
    leading-[1.45]
    sm:min-h-[36px]
    sm:text-[13px]
    sm:font-semibold
    tracking-[-0.005em]
    text-[#393530]
  "
  style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
>
  {getShortProductName(product.name)}
</h3>



          {/* ====================================================

              PRICE

          ==================================================== */}



          {showFlashSale && (
            <div className="mt-2 flex h-5 min-w-0 items-center justify-center rounded-md bg-[#FFF4EB] px-1.5">
              {product.flash_sale_end_at && remainingMs > 0 ? (
                <span className="flex min-w-0 items-center justify-center gap-1 text-[7px] font-medium tabular-nums text-[#8E4B2B] sm:text-[9px]">
                  <Clock3 className="h-2.5 w-2.5 shrink-0" strokeWidth={1.7} />
                  <span className="truncate">{countdownLabel}</span>
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[7px] font-medium text-[#B96A3B] sm:text-[9px]">
                  <Clock3 className="h-2.5 w-2.5 shrink-0" strokeWidth={1.7} />
                  -{flashSaleDiscount}%
                </span>
              )}
            </div>
          )}

          <div className={clsx(
            "flex min-w-0 items-baseline gap-x-2",
            showFlashSale ? "mt-3 min-h-[22px]" : "mt-3 min-h-[22px]"
          )}>
            <span className="shrink-0 text-[15px] font-semibold leading-tight tracking-[-0.035em] text-[#34352F] sm:text-[18px]">
              {formatVND(salePrice)}
            </span>
            {originalPrice != null && Number.isFinite(originalPrice) && originalPrice > salePrice && (
              <span className="truncate text-[8px] leading-tight text-[#A9A19A] line-through sm:text-[9px]">
                {formatVND(originalPrice)}
              </span>
            )}
          </div>
          {showFlashSale && savingAmount > 0 && (
            <div className="mt-0.5 h-4 min-w-0">
              <span className="inline-flex h-4 max-w-full items-center rounded-sm bg-[#FFF0E5] px-1.5 text-[7px] font-medium leading-none text-[#B96A3B] sm:text-[8px]">
                <span className="truncate">Tiết kiệm {formatVND(savingAmount)}</span>
              </span>
            </div>
          )}



        </div>

      </article>

    </Link>

  );

}



export default ProductCard;
