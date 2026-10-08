import { Link } from "@tanstack/react-router";
import {
  Heart,
  ShoppingBag,
  Zap,
} from "lucide-react";

type FlashSaleCardProps = {
  product: {
    id: string;
    name: string;
    price: number;
    slug?: string | null;
    image_url?: string | null;
    stock?: number | null;
    express_available?: boolean | null;
    discount_percent?: number | null;
  };
};

/* ============================================================
   RÚT GỌN TÊN SẢN PHẨM
============================================================ */

function getShortProductName(
  name?: string
) {
  if (!name) return "";

  let result = name.trim();

  /*
   * Bỏ phần mô tả sau dấu –
   *
   * Ví dụ:
   * ĐÈN CÂY ĐỨNG HALF ROUND TIMBER GRAIN
   * – VÂN GỖ CỔ ĐIỂN
   *
   * =>
   *
   * ĐÈN CÂY ĐỨNG HALF ROUND TIMBER GRAIN
   */
  result = result.split("–")[0];

  /*
   * Bỏ phần mô tả sau dấu —
   */
  result = result.split("—")[0];

  /*
   * Bỏ các hậu tố mô tả phổ biến
   */
  result = result.replace(
    /\s*-\s*THIẾT KẾ.*$/i,
    ""
  );

  result = result.replace(
    /\s*-\s*PHONG CÁCH.*$/i,
    ""
  );

  result = result.replace(
    /\s*-\s*VÂN GỖ.*$/i,
    ""
  );

  result = result.replace(
    /\s*-\s*NGHỆ THUẬT.*$/i,
    ""
  );

  result = result.replace(
    /\s*\|\s*.*$/i,
    ""
  );

  return result
    .replace(/\s+/g, " ")
    .trim();
}

/* ============================================================
   COMPONENT
============================================================ */

export function FlashSaleCard({
  product,
}: FlashSaleCardProps) {
  const oldPrice = Number(
    product.price ?? 0
  );

  const discount = Number(
    product.discount_percent ?? 0
  );

  const salePrice = Math.round(
    oldPrice *
      (100 - discount) /
      100
  );

  const saving =
    oldPrice - salePrice;

  const isExpress =
    product.express_available === true;

  const isOutOfStock =
    Number(product.stock ?? 0) <= 0;

  const shortName =
    getShortProductName(
      product.name
    );

  return (
    <Link
      to="/product/$slug"
      params={{
        slug:
          product.slug || "",
      }}
      className="
        group
        block
        min-w-0
      "
    >

      {/* ======================================================
          IMAGE
      ====================================================== */}

      <div
        className="
          relative
          aspect-square
          overflow-hidden
          rounded-2xl
          bg-[#F5F3EF]
        "
      >

        {/* PRODUCT IMAGE */}

        <img
          src={
            product.image_url ||
            "/placeholder.svg"
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

        {/* ====================================================
            DISCOUNT
        ==================================================== */}

        {discount > 0 && (
          <span
            className="
              absolute
              left-2.5
              top-2.5
              rounded-md
              bg-[#FF3B30]
              px-2
              py-1.5
              text-[10px]
              font-semibold
              leading-none
              text-white
              sm:left-3
              sm:top-3
              sm:text-xs
            "
          >
            -{discount}%
          </span>
        )}

        {/* ====================================================
            WISHLIST
        ==================================================== */}

        <button
          type="button"
          aria-label="Thêm vào yêu thích"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
          }}
          className="
            absolute
            right-2.5
            top-2.5
            flex
            h-8
            w-8
            items-center
            justify-center
            rounded-full
            bg-white/95
            text-neutral-700
            shadow-sm
            backdrop-blur-sm
            transition
            hover:bg-white
            hover:text-neutral-900
            sm:right-3
            sm:top-3
          "
        >
          <Heart
            size={15}
            strokeWidth={1.7}
          />
        </button>

        {/* ====================================================
            EXPRESS
        ==================================================== */}

        {isExpress && (
          <div
            className="
              absolute
              bottom-2.5
              left-2.5
              inline-flex
              items-center
              gap-1
              rounded-md
              bg-white/95
              px-2
              py-1.5
              text-[9px]
              font-semibold
              leading-none
              text-[#E8753C]
              shadow-sm
              backdrop-blur-sm
              sm:bottom-3
              sm:left-3
              sm:text-[10px]
            "
          >
            <Zap
              size={10}
              strokeWidth={2.3}
              fill="currentColor"
            />

            Hỏa tốc
          </div>
        )}

      </div>

      {/* ======================================================
          PRODUCT INFO
      ====================================================== */}

      <div
        className="
          pt-3
        "
      >

        {/* ====================================================
            NAME
        ==================================================== */}

        <h3
          className="
            line-clamp-2
            min-h-[32px]
            text-[11px]
            font-medium
            leading-[1.45]
            tracking-[-0.01em]
            text-neutral-800
            sm:min-h-[36px]
            sm:text-sm
          "
          title={product.name}
        >
          {shortName}
        </h3>

        {/* ====================================================
            PRICE
        ==================================================== */}

        <div
          className="
            mt-1.5
            flex
            items-baseline
            gap-2
            whitespace-nowrap
          "
        >

          <span
            className="
              text-[17px]
              font-semibold
              leading-none
              tracking-tight
              text-[#E8753C]
              sm:text-lg
            "
          >
            {salePrice.toLocaleString(
              "vi-VN"
            )}
            đ
          </span>

          {oldPrice > salePrice && (
            <span
              className="
                text-[9px]
                text-neutral-400
                line-through
                sm:text-[10px]
              "
            >
              {oldPrice.toLocaleString(
                "vi-VN"
              )}
              đ
            </span>
          )}

        </div>

        {/* ====================================================
            SAVING
        ==================================================== */}

        {saving > 0 && (
          <p
            className="
              mt-1.5
              text-[9px]
              leading-none
              text-neutral-400
              sm:text-[10px]
            "
          >
            Tiết kiệm{" "}
            <span
              className="
                font-medium
                text-[#E8753C]
              "
            >
              {saving.toLocaleString(
                "vi-VN"
              )}
              đ
            </span>
          </p>
        )}

        {/* ====================================================
            ACTIONS
        ==================================================== */}

        <div
          className="
            mt-3
            flex
            items-center
            gap-2
          "
        >

          {/* BUY */}

          <div
            className="
              flex
              h-9
              flex-1
              items-center
              justify-center
              rounded-full
              bg-[#E8753C]
              px-3
              text-[10px]
              font-semibold
              text-white
              transition
              duration-200
              group-hover:bg-[#DF6A32]
              sm:h-10
              sm:text-xs
            "
          >
            Mua ngay
            <span className="ml-1">
              →
            </span>
          </div>

          {/* CART */}

          <button
            type="button"
            aria-label="Thêm vào giỏ hàng"
            disabled={isOutOfStock}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
            }}
            className="
              flex
              h-9
              w-9
              shrink-0
              items-center
              justify-center
              rounded-full
              border
              border-neutral-200
              bg-white
              text-neutral-700
              transition
              hover:border-neutral-300
              hover:bg-neutral-50
              sm:h-10
              sm:w-10
            "
          >
            <ShoppingBag
              size={15}
              strokeWidth={1.7}
            />
          </button>

        </div>

      </div>
    </Link>
  );
}