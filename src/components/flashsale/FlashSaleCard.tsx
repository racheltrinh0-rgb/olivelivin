import { Link } from "@tanstack/react-router";
import {
  Heart,
  ShoppingBag,
  Zap,
  X,
} from "lucide-react";
import {
  useEffect,
  useState,
} from "react";

/* ============================================================
   TYPES
============================================================ */

type FlashSaleProduct = {
  id: string;
  name: string;
  price: number;
  slug?: string | null;
  image_url?: string | null;
  stock?: number | null;
  express_available?: boolean | null;

  discount_percent?: number | null;

  flash_sale_start_at?: string | null;
  flash_sale_end_at?: string | null;
  flash_sale_title?: string | null;
};

type FlashSaleCardProps = {
  product: FlashSaleProduct;
};

/* ============================================================
   SHORT PRODUCT NAME
============================================================ */

function getShortProductName(
  name?: string
) {
  if (!name) {
    return "";
  }

  let result =
    name.trim();

  /*
   * Bỏ phần mô tả sau dấu –
   */
  result =
    result.split("–")[0];

  /*
   * Bỏ phần mô tả sau dấu —
   */
  result =
    result.split("—")[0];

  /*
   * Bỏ các hậu tố dài
   */
  result =
    result.replace(
      /\s*-\s*THIẾT KẾ.*$/i,
      ""
    );

  result =
    result.replace(
      /\s*-\s*PHONG CÁCH.*$/i,
      ""
    );

  result =
    result.replace(
      /\s*-\s*VÂN GỖ.*$/i,
      ""
    );

  result =
    result.replace(
      /\s*-\s*NGHỆ THUẬT.*$/i,
      ""
    );

  result =
    result.replace(
      /\s*\|\s*.*$/i,
      ""
    );

  return result
    .replace(/\s+/g, " ")
    .trim();
}

/* ============================================================
   FORMAT DATE
============================================================ */

function formatFlashSaleDate(
  date?: string | null
) {
  if (!date) {
    return "";
  }

  const value =
    new Date(date);

  return value.toLocaleString(
    "vi-VN",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );
}

/* ============================================================
   COUNTDOWN
============================================================ */

function getTimeLeft(
  target?: string | null
) {
  if (!target) {
    return null;
  }

  const diff =
    new Date(target).getTime() -
    Date.now();

  if (diff <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
    };
  }

  const totalSeconds =
    Math.floor(
      diff / 1000
    );

  return {
    days: Math.floor(
      totalSeconds / 86400
    ),

    hours: Math.floor(
      (totalSeconds % 86400) /
        3600
    ),

    minutes: Math.floor(
      (totalSeconds % 3600) /
        60
    ),

    seconds:
      totalSeconds % 60,
  };
}

/* ============================================================
   COMPONENT
============================================================ */

export function FlashSaleCard({
  product,
}: FlashSaleCardProps) {
  const [
    showStartPopup,
    setShowStartPopup,
  ] = useState(false);

  const [
    timeLeft,
    setTimeLeft,
  ] = useState(
    getTimeLeft(
      product.flash_sale_start_at
    )
  );

  /* ==========================================================
     CHECK SALE START
  ========================================================== */

  const saleStartAt =
    product.flash_sale_start_at
      ? new Date(
          product.flash_sale_start_at
        ).getTime()
      : null;

  const saleHasStarted =
    saleStartAt === null ||
    Date.now() >= saleStartAt;

  /* ==========================================================
     COUNTDOWN TO START
  ========================================================== */

  useEffect(() => {
    if (
      !product.flash_sale_start_at
    ) {
      return;
    }

    const update = () => {
      setTimeLeft(
        getTimeLeft(
          product.flash_sale_start_at
        )
      );
    };

    update();

    const timer =
      window.setInterval(
        update,
        1000
      );

    return () => {
      window.clearInterval(
        timer
      );
    };
  }, [
    product.flash_sale_start_at,
  ]);

  /* ==========================================================
     PRICE
  ========================================================== */

  const oldPrice =
    Number(
      product.price ?? 0
    );

  const discount =
    Number(
      product.discount_percent ??
        0
    );

  const salePrice =
    Math.round(
      oldPrice *
        (100 - discount) /
        100
    );

  const saving =
    oldPrice -
    salePrice;

  const isExpress =
    product.express_available ===
    true;

  const shortName =
    getShortProductName(
      product.name
    );

  /* ==========================================================
     HANDLE PRODUCT CLICK
  ========================================================== */

  const handleProductClick = (
    event: React.MouseEvent
  ) => {
    if (saleHasStarted) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    setShowStartPopup(true);
  };

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <>
      {/* ======================================================
          PRODUCT CARD
      ====================================================== */}

      <Link
        to="/products/$slug"
        params={{
          slug:
            product.slug || "",
        }}
        onClick={
          handleProductClick
        }
        className="
          group
          block
          min-w-0
        "
      >

        {/* ====================================================
            IMAGE
        ==================================================== */}

        <div
          className="
            relative
            aspect-square
            overflow-hidden
            rounded-2xl
            bg-[#F5F3EF]
          "
        >

          <img
            src={
              product.image_url ||
              "/placeholder.svg"
            }
            alt={
              product.name
            }
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

          {/* DISCOUNT */}

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

          {/* WISHLIST */}

          <button
            type="button"
            aria-label="Thêm vào yêu thích"
            onClick={(
              event
            ) => {
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
            "
          >
            <Heart
              size={15}
              strokeWidth={1.7}
            />
          </button>

          {/* EXPRESS */}

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

        {/* ====================================================
            PRODUCT INFO
        ==================================================== */}

        <div className="pt-3">

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
            title={
              product.name
            }
          >
            {shortName}
          </h3>

          {/* PRICE */}

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

            {oldPrice >
              salePrice && (
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

          {/* SAVING */}

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

          {/* CTA */}

          <div
            className="
              mt-3
              flex
              h-9
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
        </div>
      </Link>

      {/* ======================================================
          START DATE POPUP
      ====================================================== */}

      {showStartPopup && (
        <div
          className="
            fixed
            inset-0
            z-[9999]
            flex
            items-center
            justify-center
            bg-black/40
            px-5
            backdrop-blur-[3px]
          "
          onClick={() =>
            setShowStartPopup(false)
          }
        >

          <div
            className="
              relative
              w-full
              max-w-[390px]
              overflow-hidden
              rounded-2xl
              bg-white
              p-6
              shadow-2xl
            "
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            {/* CLOSE */}

            <button
              type="button"
              onClick={() =>
                setShowStartPopup(
                  false
                )
              }
              className="
                absolute
                right-4
                top-4
                flex
                h-8
                w-8
                items-center
                justify-center
                rounded-full
                bg-neutral-100
                text-neutral-500
                transition
                hover:bg-neutral-200
              "
            >
              <X
                size={16}
              />
            </button>

            {/* ICON */}

            <div
              className="
                flex
                h-11
                w-11
                items-center
                justify-center
                rounded-full
                bg-[#FFF3EC]
                text-xl
              "
            >
              🔥
            </div>

            {/* TITLE */}

            <h3
              className="
                mt-4
                pr-8
                font-display
                text-2xl
                leading-tight
                text-neutral-900
              "
            >
              Flash Sale
              chưa bắt đầu
            </h3>

            {/* DESCRIPTION */}

            <p
              className="
                mt-2
                text-sm
                leading-6
                text-neutral-500
              "
            >
              Sản phẩm này sẽ được
              áp dụng mức giá Flash
              Sale khi chương trình
              chính thức bắt đầu.
            </p>

            {/* START DATE */}

            {product.flash_sale_start_at && (
              <div
                className="
                  mt-5
                  rounded-xl
                  bg-[#FAF9F6]
                  px-4
                  py-3
                "
              >
                <p
                  className="
                    text-[10px]
                    font-medium
                    uppercase
                    tracking-[0.12em]
                    text-neutral-400
                  "
                >
                  Bắt đầu lúc
                </p>

                <p
                  className="
                    mt-1
                    text-sm
                    font-semibold
                    text-[#E8753C]
                  "
                >
                  {formatFlashSaleDate(
                    product.flash_sale_start_at
                  )}
                </p>
              </div>
            )}

            {/* COUNTDOWN */}

            {timeLeft && (
              <div
                className="
                  mt-4
                  flex
                  items-center
                  justify-center
                  gap-1.5
                "
              >
                <MiniTime
                  value={
                    timeLeft.days
                  }
                  label="ngày"
                />

                <span className="text-neutral-300">
                  :
                </span>

                <MiniTime
                  value={
                    timeLeft.hours
                  }
                  label="giờ"
                />

                <span className="text-neutral-300">
                  :
                </span>

                <MiniTime
                  value={
                    timeLeft.minutes
                  }
                  label="phút"
                />

                <span className="text-neutral-300">
                  :
                </span>

                <MiniTime
                  value={
                    timeLeft.seconds
                  }
                  label="giây"
                />
              </div>
            )}

            {/* OK */}

            <button
              type="button"
              onClick={() =>
                setShowStartPopup(
                  false
                )
              }
              className="
                mt-5
                flex
                h-11
                w-full
                items-center
                justify-center
                rounded-full
                bg-[#E8753C]
                text-sm
                font-semibold
                text-white
                transition
                hover:bg-[#DF6A32]
              "
            >
              Đã hiểu
            </button>

          </div>
        </div>
      )}
    </>
  );
}

/* ============================================================
   MINI COUNTDOWN
============================================================ */

function MiniTime({
  value,
  label,
}: {
  value: number;
  label: string;
}) {
  return (
    <div
      className="
        flex
        min-w-[45px]
        flex-col
        items-center
        rounded-lg
        border
        border-neutral-200
        bg-white
        px-2
        py-1.5
      "
    >
      <span
        className="
          text-sm
          font-semibold
          leading-none
          text-neutral-900
        "
      >
        {String(
          value
        ).padStart(
          2,
          "0"
        )}
      </span>

      <span
        className="
          mt-1
          text-[7px]
          uppercase
          tracking-wide
          text-neutral-400
        "
      >
        {label}
      </span>
    </div>
  );
}