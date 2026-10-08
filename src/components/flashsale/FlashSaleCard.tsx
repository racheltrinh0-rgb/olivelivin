import {
  ArrowUpRight,
  Flame,
} from "lucide-react";

import { Link } from "@tanstack/react-router";

interface FlashSaleCardProps {
  product: any;
}

function formatPrice(
  price: number | null | undefined
) {
  return (
    new Intl.NumberFormat("vi-VN").format(
      Number(price ?? 0)
    ) + "đ"
  );
}

export default function FlashSaleCard({
  product,
}: FlashSaleCardProps) {

  /* ==========================================================
     PRICE
  ========================================================== */

  const oldPrice = Number(
    product?.price ?? 0
  );

  const percent = Math.max(
    0,
    Number(
      product?.discount_percent ?? 0
    )
  );

  const salePrice =
    percent > 0
      ? Math.round(
          oldPrice *
            (100 - percent) /
            100
        )
      : oldPrice;

  const saving = Math.max(
    0,
    oldPrice - salePrice
  );

  /* ==========================================================
     PRODUCT DATA
  ========================================================== */

  const stock =
    Number(
      product?.stock ?? 0
    );

  /*
   * Dùng sold nếu database đã có.
   * Nếu chưa có thì dùng giá mặc định ổn định,
   * không random mỗi lần render.
   */

  const sold =
    Number(
      product?.sold ??
        product?.sold_count ??
        0
    );

  /*
   * Nếu chưa có sold data,
   * không hiển thị số giả.
   */

  const hasSoldData =
    sold > 0;

  /*
   * Progress:
   * ưu tiên dữ liệu thật nếu có.
   */

  const progress =
    hasSoldData
      ? Math.min(
          100,
          Math.max(
            0,
            Math.round(
              (sold /
                Math.max(
                  sold + stock,
                  1
                )) *
                100
            )
          )
        )
      : 0;

  /* ==========================================================
     IMAGE
  ========================================================== */

  const imageUrl =
    product?.image_url ||
    product?.image ||
    "";

  /* ==========================================================
     BADGE
  ========================================================== */

  const badgeText =
    percent > 0
      ? `-${percent}%`
      : "FLASH";

  return (
    <article
      className="
        group
        min-w-0
        overflow-hidden
        rounded-[18px]
        border
        border-[#E7E3DC]
        bg-white
        shadow-[0_2px_12px_rgba(40,35,28,0.05)]
        transition-all
        duration-300

        hover:-translate-y-1
        hover:border-[#D8D2C9]
        hover:shadow-[0_12px_30px_rgba(40,35,28,0.10)]

        sm:rounded-[20px]
      "
    >

      {/* ======================================================
          IMAGE
      ====================================================== */}

      <Link
        to="/products/$slug"
        params={{
          slug:
            product?.slug ?? "",
        }}
        className="
          block
          overflow-hidden
        "
      >

        <div
          className="
            relative
            aspect-square
            overflow-hidden
            bg-[#F5F3EF]
          "
        >

          {imageUrl ? (
            <img
              src={imageUrl}
              alt={
                product?.name ??
                "Product"
              }
              loading="lazy"
              className="
                h-full
                w-full
                object-cover
                transition-transform
                duration-500
                group-hover:scale-[1.025]
              "
            />
          ) : (
            <div
              className="
                flex
                h-full
                w-full
                items-center
                justify-center
                text-xs
                text-neutral-400
              "
            >
              No image
            </div>
          )}

          {/* SALE BADGE */}

          {percent > 0 && (
            <div
              className="
                absolute
                left-2.5
                top-2.5
                flex
                items-center
                gap-1
                rounded-full
                bg-[#20231F]
                px-2.5
                py-1.5
                text-[10px]
                font-semibold
                leading-none
                text-white
                shadow-sm

                sm:left-3
                sm:top-3
                sm:px-3
                sm:py-1.5
              "
            >
              <Flame
                className="
                  h-3
                  w-3
                  text-[#FF6A00]
                "
                strokeWidth={2}
              />

              {badgeText}
            </div>
          )}

          {/* EXPRESS */}

          {product?.express_available && (
            <div
              className="
                absolute
                right-2.5
                top-2.5
                rounded-full
                bg-white/95
                px-2
                py-1
                text-[8px]
                font-semibold
                uppercase
                tracking-[0.04em]
                text-[#536A59]
                shadow-sm
                backdrop-blur

                sm:right-3
                sm:top-3
              "
            >
              HỎA TỐC
            </div>
          )}

        </div>

      </Link>

      {/* ======================================================
          CONTENT
      ====================================================== */}

      <div
        className="
          min-w-0
          p-3

          sm:p-3.5
        "
      >

        {/* ====================================================
            PRODUCT NAME
        ==================================================== */}

        <Link
          to="/products/$slug"
          params={{
            slug:
              product?.slug ?? "",
          }}
          className="block"
        >
          <h3
            className="
              min-h-[38px]
              overflow-hidden
              text-[12px]
              font-medium
              leading-[1.55]
              tracking-[-0.01em]
              text-[#292C28]

              line-clamp-2

              sm:min-h-[42px]
              sm:text-[13px]
              sm:leading-5
            "
          >
            {product?.name ??
              "Sản phẩm"}
          </h3>
        </Link>

        {/* ====================================================
            PRICE
        ==================================================== */}

        <div
          className="
            mt-2.5
            min-w-0
          "
        >

          <div
            className="
              flex
              min-w-0
              items-baseline
              gap-1.5
              overflow-hidden
            "
          >

            {/* SALE PRICE */}

            <span
              className="
                min-w-0
                shrink
                whitespace-nowrap
                text-[clamp(18px,5vw,24px)]
                font-bold
                leading-none
                tracking-[-0.045em]
                text-[#F05A32]

                sm:text-[25px]
              "
            >
              {formatPrice(
                salePrice
              )}
            </span>

            {/* OLD PRICE */}

            {oldPrice >
              salePrice && (
              <span
                className="
                  min-w-0
                  shrink
                  whitespace-nowrap
                  truncate
                  text-[9px]
                  leading-none
                  text-neutral-400
                  line-through

                  sm:text-[11px]
                "
              >
                {formatPrice(
                  oldPrice
                )}
              </span>
            )}

          </div>

          {/* SAVING */}

          {saving > 0 && (
            <p
              className="
                mt-1
                truncate
                text-[10px]
                leading-4
                text-neutral-500

                sm:text-[11px]
              "
            >
              Tiết kiệm{" "}
              <span className="font-medium text-[#536A59]">
                {formatPrice(
                  saving
                )}
              </span>
            </p>
          )}

        </div>

        {/* ====================================================
            SALE STATUS
        ==================================================== */}

        <div
          className="
            mt-3
          "
        >

          <div
            className="
              flex
              items-center
              justify-between
              gap-2
              text-[9px]
              leading-4

              sm:text-[10px]
            "
          >

            <span
              className="
                shrink-0
                text-neutral-500
              "
            >
              Flash Sale
            </span>

            {stock > 0 && (
              <span
                className="
                  shrink-0
                  font-medium
                  text-[#F05A32]
                "
              >
                Còn {stock}
              </span>
            )}

          </div>

          {/* PROGRESS */}

          {hasSoldData && (
            <div
              className="
                mt-1.5
                h-[3px]
                overflow-hidden
                rounded-full
                bg-[#EEEAE4]
              "
            >
              <div
                className="
                  h-full
                  rounded-full
                  bg-[#F05A32]
                  transition-all
                  duration-500
                "
                style={{
                  width: `${progress}%`,
                }}
              />
            </div>
          )}

          {hasSoldData && (
            <p
              className="
                mt-1
                truncate
                text-[9px]
                text-neutral-400
              "
            >
              Đã bán {sold}
            </p>
          )}

        </div>

        {/* ====================================================
            BUTTON
        ==================================================== */}

        <Link
          to="/products/$slug"
          params={{
            slug:
              product?.slug ?? "",
          }}
          className="
            mt-3
            flex
            w-full
            items-center
            justify-center
            gap-1.5
            rounded-full
            border
            border-[#6C706B]
            bg-white
            px-3
            py-2
            text-[11px]
            font-medium
            text-[#30342F]
            transition-all
            duration-200

            hover:border-[#30342F]
            hover:bg-[#30342F]
            hover:text-white

            active:scale-[0.98]

            sm:py-2.5
            sm:text-xs
          "
        >
          <span>
            Xem sản phẩm
          </span>

          <ArrowUpRight
            className="
              h-3.5
              w-3.5
              shrink-0
            "
            strokeWidth={1.8}
          />
        </Link>

      </div>
    </article>
  );
}