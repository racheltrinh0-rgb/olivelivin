import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  X,
  Zap,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";

/* ============================================================
   TYPES
============================================================ */

type CountdownState = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

type ProductItem = {
  product_id: string;

  products?: {
    id: string;
    name: string;
    price: number;
    slug?: string | null;
    image_url?: string | null;
    express_available?: boolean | null;
  } | null;
};

/* ============================================================
   HELPERS
============================================================ */

/**
 * Rút gọn tên sản phẩm.
 *
 * Ví dụ:
 *
 * ĐÈN CAO ĐỨNG HALF ROUND SINGLE
 * – THIẾT KẾ TỐI GIẢN
 *
 * =>
 *
 * ĐÈN CAO ĐỨNG HALF ROUND SINGLE
 */

function getShortProductName(
  name?: string | null
) {
  if (!name) {
    return "";
  }

  let result =
    name.trim();

  result =
    result.split("–")[0];

  result =
    result.split("—")[0];

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
   FORMAT PRICE
============================================================ */

function formatPrice(
  value: number
) {
  return (
    value.toLocaleString("vi-VN") +
    "đ"
  );
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

  return new Date(
    date
  ).toLocaleString(
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
   COUNTDOWN CALCULATOR
============================================================ */

function calculateCountdown(
  target?: string | null
): CountdownState {
  if (!target) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
    };
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

export default function FlashSale() {
  const [sale, setSale] =
    useState<any>(null);

  const [products, setProducts] =
    useState<ProductItem[]>([]);

  const [timeLeft, setTimeLeft] =
    useState<CountdownState>({
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
    });

  /* ==========================================================
     POPUP STATE
  ========================================================== */

  const [
    showStartPopup,
    setShowStartPopup,
  ] = useState(false);

  const [
    selectedProductName,
    setSelectedProductName,
  ] = useState("");

  /* ==========================================================
     LOAD FLASH SALE
  ========================================================== */

  useEffect(() => {
    loadFlashSale();
  }, []);

  /* ==========================================================
     COUNTDOWN
  ========================================================== */

  useEffect(() => {
    if (
      !sale?.start_at &&
      !sale?.end_at
    ) {
      return;
    }

    const updateCountdown = () => {
      const now =
        Date.now();

      const startTime =
        sale?.start_at
          ? new Date(
              sale.start_at
            ).getTime()
          : null;

      const endTime =
        sale?.end_at
          ? new Date(
              sale.end_at
            ).getTime()
          : null;

      /*
       * ==========================================
       * CHƯA BẮT ĐẦU
       * ==========================================
       */

      if (
        startTime !== null &&
        now < startTime
      ) {
        setTimeLeft(
          calculateCountdown(
            sale.start_at
          )
        );

        return;
      }

      /*
       * ==========================================
       * ĐANG FLASH SALE
       * ==========================================
       */

      if (
        endTime !== null &&
        now < endTime
      ) {
        setTimeLeft(
          calculateCountdown(
            sale.end_at
          )
        );

        return;
      }

      /*
       * ==========================================
       * ĐÃ KẾT THÚC
       * ==========================================
       */

      setTimeLeft({
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
      });
    };

    updateCountdown();

    const timer =
      window.setInterval(
        updateCountdown,
        1000
      );

    return () => {
      window.clearInterval(
        timer
      );
    };
  }, [
    sale?.start_at,
    sale?.end_at,
  ]);

  /* ==========================================================
     LOAD SALE + PRODUCTS
  ========================================================== */

  async function loadFlashSale() {
    const now =
      new Date().toISOString();

    console.log(
      "FLASH SALE NOW:",
      now
    );

    const {
      data: flashSale,
      error,
    } = await supabase
      .from("flash_sales")
      .select("*")
      .eq("active", true)
      .order("created_at", {
        ascending: false,
      })
      .limit(1)
      .maybeSingle();

    console.log(
      "FLASH SALE:",
      flashSale
    );

    if (error) {
      console.error(
        "FLASH SALE ERROR:",
        error
      );
    }

    if (!flashSale) {
      return;
    }

    /* ========================================================
       CHECK EXPIRED
    ======================================================== */

    const endTime =
      new Date(
        flashSale.end_at
      ).getTime();

    if (
      !Number.isNaN(endTime) &&
      Date.now() > endTime
    ) {
      return;
    }

    setSale(
      flashSale
    );

    /* ========================================================
       LOAD PRODUCTS
    ======================================================== */

    const {
      data: saleProducts,
      error:
        productsError,
    } = await supabase
      .from(
        "flash_sale_products"
      )
      .select(`
        product_id,
        products(
          id,
          name,
          price,
          slug,
          image_url,
          express_available
        )
      `)
      .eq(
        "flash_sale_id",
        flashSale.id
      );

    if (productsError) {
      console.error(
        "FLASH SALE PRODUCTS ERROR:",
        productsError
      );
    }

    console.log(
      "FLASH SALE PRODUCTS:",
      saleProducts
    );

    setProducts(
      (saleProducts ??
        []) as ProductItem[]
    );
  }

  /* ==========================================================
     NO SALE
  ========================================================== */

  if (!sale) {
    return null;
  }

  /* ==========================================================
     SALE STATUS
  ========================================================== */

  const now =
    Date.now();

  const startTime =
    sale?.start_at
      ? new Date(
          sale.start_at
        ).getTime()
      : null;

  const endTime =
    sale?.end_at
      ? new Date(
          sale.end_at
        ).getTime()
      : null;

  const saleHasStarted =
    startTime === null ||
    now >= startTime;

  const saleHasEnded =
    endTime !== null &&
    now >= endTime;

  const countdownLabel =
    saleHasEnded
      ? "Flash Sale đã kết thúc"
      : saleHasStarted
        ? "Kết thúc sau"
        : "Bắt đầu sau";

  /* ==========================================================
     COLORS
  ========================================================== */

  const accentColor =
    sale?.banner_color ||
    "#D97745";

  const discount =
    Number(
      sale?.discount_percent ??
        0
    );

  /* ==========================================================
     BUY NOW
  ========================================================== */

  const handleBuyNow = (
    product: ProductItem["products"]
  ) => {
    if (!product) {
      return;
    }

    /*
     * ==========================================
     * CHƯA TỚI FLASH SALE
     * ==========================================
     */

    if (!saleHasStarted) {
      setSelectedProductName(
        getShortProductName(
          product.name
        )
      );

      setShowStartPopup(
        true
      );

      return;
    }

    /*
     * ==========================================
     * ĐÃ TỚI FLASH SALE
     *
     * Đi thẳng /cart
     *
     * Không quay lại /flashsale
     * ==========================================
     */

    window.location.href =
      "/cart";
  };

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <>
      <section
        className="
          w-full
          py-7
          sm:py-9
          lg:py-12
        "
      >
        <div
          className="
            mx-auto
            w-full
            max-w-[1440px]
            px-4
            sm:px-6
            lg:px-8
          "
        >

          {/* ==================================================
              MAIN CONTAINER
          ================================================== */}

          <div
            className="
              overflow-hidden
              rounded-[20px]
              bg-[#FAF9F6]
              px-4
              py-5
              sm:rounded-[24px]
              sm:px-6
              sm:py-6
              lg:px-8
              lg:py-7
            "
          >

            {/* ==================================================
                HEADER
            ================================================== */}

            <div
              className="
                flex
                items-center
                justify-between
                gap-4
              "
            >

              {/* LABEL */}

              <div
                className="
                  flex
                  min-w-0
                  items-center
                  gap-2
                "
              >
                <span
                  className="
                    h-1.5
                    w-1.5
                    shrink-0
                    rounded-full
                  "
                  style={{
                    backgroundColor:
                      accentColor,
                  }}
                />

                <span
                  className="
                    truncate
                    text-[10px]
                    font-semibold
                    uppercase
                    tracking-[0.2em]
                    text-neutral-700
                    sm:text-xs
                  "
                >
                  Flash Sale · 10.10
                </span>
              </div>

              {/* VIEW ALL */}

              <Link
                to="/flashsale"
                className="
                  group
                  inline-flex
                  shrink-0
                  items-center
                  gap-1.5
                  rounded-full
                  border
                  border-neutral-300
                  bg-white
                  px-3
                  py-1.5
                  text-[10px]
                  font-semibold
                  text-neutral-800
                  shadow-sm
                  transition-all
                  duration-200
                  hover:border-[#D97745]
                  hover:bg-[#D97745]
                  hover:text-white
                  active:scale-[0.97]
                  sm:px-4
                  sm:py-2
                  sm:text-xs
                "
              >
                Xem tất cả

                <span
                  className="
                    transition-transform
                    duration-200
                    group-hover:translate-x-0.5
                  "
                >
                  →
                </span>
              </Link>

            </div>

            {/* ==================================================
                TITLE
            ================================================== */}

            <div
              className="
                mt-4
                flex
                flex-col
                gap-4
                lg:flex-row
                lg:items-end
                lg:justify-between
              "
            >

              <div
                className="
                  min-w-0
                  flex-1
                "
              >

                <h2
                  className="
                    font-display
                    text-[25px]
                    font-normal
                    leading-[1.08]
                    tracking-[-0.025em]
                    text-neutral-900
                    sm:text-3xl
                    lg:text-[40px]
                  "
                >
                  {sale?.title ||
                    "10.10 Olive Flash Sale"}

                  <span
                    className="
                      ml-1.5
                    "
                    style={{
                      color:
                        accentColor,
                    }}
                  >
                    {discount}%
                  </span>
                </h2>

                <p
                  className="
                    mt-2
                    max-w-[760px]
                    text-[11px]
                    leading-[1.55]
                    text-neutral-500
                    sm:text-sm
                  "
                >
                  {sale?.description}
                </p>

                {/* =================================================
                    COUNTDOWN
                ================================================= */}

                <div
                  className="
                    mt-3
                    flex
                    flex-wrap
                    items-center
                    gap-2
                  "
                >

                  <span
                    className="
                      mr-1
                      text-[10px]
                      font-medium
                      text-neutral-500
                      sm:text-xs
                    "
                  >
                    {countdownLabel}
                  </span>

                  {!saleHasEnded && (
                    <>
                      <CountdownBox
                        value={
                          timeLeft.days
                        }
                        label="ngày"
                      />

                      <span
                        className="
                          text-[10px]
                          text-neutral-300
                        "
                      >
                        :
                      </span>

                      <CountdownBox
                        value={
                          timeLeft.hours
                        }
                        label="giờ"
                      />

                      <span
                        className="
                          text-[10px]
                          text-neutral-300
                        "
                      >
                        :
                      </span>

                      <CountdownBox
                        value={
                          timeLeft.minutes
                        }
                        label="phút"
                      />

                      <span
                        className="
                          text-[10px]
                          text-neutral-300
                        "
                      >
                        :
                      </span>

                      <CountdownBox
                        value={
                          timeLeft.seconds
                        }
                        label="giây"
                        accent
                      />
                    </>
                  )}

                </div>

              </div>

              {/* MAIN CTA */}

              <Link
                to="/flashsale"
                className="
                  flex
                  h-9
                  w-full
                  shrink-0
                  items-center
                  justify-center
                  rounded-full
                  px-5
                  text-[11px]
                  font-semibold
                  text-white
                  transition
                  hover:opacity-90
                  active:scale-[0.98]
                  sm:h-10
                  sm:w-fit
                  sm:px-6
                  sm:text-xs
                  lg:min-w-[140px]
                "
                style={{
                  backgroundColor:
                    accentColor,
                }}
              >
                Mua ngay
                <span className="ml-1">
                  →
                </span>
              </Link>

            </div>

            {/* ==================================================
                PRODUCTS
            ================================================== */}

            <div
              className="
                mt-5
                grid
                grid-cols-2
                gap-x-2.5
                gap-y-5
                sm:mt-6
                sm:gap-4
                lg:grid-cols-4
              "
            >

              {products
                .slice(0, 4)
                .map(
                  (
                    item: ProductItem
                  ) => {

                    const product =
                      item.products;

                    if (!product) {
                      return null;
                    }

                    /* ==========================================
                       PRICE
                    ========================================== */

                    const oldPrice =
                      Number(
                        product.price ??
                          0
                      );

                    const salePrice =
                      Math.round(
                        oldPrice *
                          (100 -
                            discount) /
                          100
                      );

                    const saving =
                      oldPrice -
                      salePrice;

                    const percent =
                      oldPrice > 0
                        ? Math.round(
                            ((oldPrice -
                              salePrice) /
                              oldPrice) *
                              100
                          )
                        : 0;

                    /* ==========================================
                       NAME
                    ========================================== */

                    const displayName =
                      getShortProductName(
                        product.name
                      );

                    /* ==========================================
                       EXPRESS
                    ========================================== */

                    const isExpress =
                      product.express_available ===
                      true;

                    return (
                      <div
                        key={
                          product.id
                        }
                        className="
                          group
                          min-w-0
                        "
                      >

                        {/* ====================================
                            IMAGE
                        ==================================== */}

                        <div
                          className="
                            relative
                            aspect-square
                            overflow-hidden
                            rounded-xl
                            bg-[#F1EFEB]
                            sm:rounded-2xl
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
                              group-hover:scale-[1.02]
                            "
                          />

                          {/* DISCOUNT */}

                          {percent >
                            0 && (
                            <span
                              className="
                                absolute
                                left-2
                                top-2
                                rounded-md
                                bg-[#FF3B30]
                                px-1.5
                                py-1
                                text-[9px]
                                font-semibold
                                leading-none
                                text-white
                                sm:left-3
                                sm:top-3
                                sm:px-2
                                sm:text-[10px]
                              "
                            >
                              -{percent}%
                            </span>
                          )}

                          {/* EXPRESS */}

                          {isExpress && (
                            <span
                              className="
                                absolute
                                bottom-2
                                left-2
                                inline-flex
                                items-center
                                gap-1
                                rounded-md
                                bg-white/95
                                px-1.5
                                py-1
                                text-[8px]
                                font-semibold
                                leading-none
                                text-[#E8753C]
                                shadow-sm
                                backdrop-blur-sm
                                sm:bottom-3
                                sm:left-3
                                sm:px-2
                                sm:text-[9px]
                              "
                            >
                              <Zap
                                size={9}
                                strokeWidth={
                                  2.2
                                }
                                fill="currentColor"
                              />

                              Hỏa tốc
                            </span>
                          )}

                        </div>

                        {/* ====================================
                            PRODUCT INFO
                        ==================================== */}

                        <div
                          className="
                            pt-2
                            sm:pt-2.5
                          "
                        >

                          {/* NAME */}

                          <h3
                            className="
                              line-clamp-2
                              min-h-[30px]
                              text-[10px]
                              font-medium
                              leading-[1.4]
                              tracking-[-0.01em]
                              text-neutral-700
                              sm:min-h-[34px]
                              sm:text-xs
                            "
                            title={
                              product.name
                            }
                          >
                            {displayName}
                          </h3>

                          {/* PRICE */}

                          <div
                            className="
                              mt-1
                              flex
                              items-baseline
                              gap-1.5
                              whitespace-nowrap
                            "
                          >

                            <span
                              className="
                                text-[15px]
                                font-semibold
                                leading-none
                                tracking-tight
                                sm:text-base
                              "
                              style={{
                                color:
                                  accentColor,
                              }}
                            >
                              {formatPrice(
                                salePrice
                              )}
                            </span>

                            {oldPrice >
                              salePrice && (
                              <span
                                className="
                                  text-[8px]
                                  text-neutral-400
                                  line-through
                                  sm:text-[10px]
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
                                text-[8px]
                                leading-none
                                text-neutral-400
                                sm:text-[10px]
                              "
                            >
                              Tiết kiệm{" "}

                              <span
                                className="
                                  font-medium
                                "
                                style={{
                                  color:
                                    accentColor,
                                }}
                              >
                                {formatPrice(
                                  saving
                                )}
                              </span>
                            </p>
                          )}

                          {/* ==================================
                              BUY NOW
                          ================================== */}

                          <button
                            type="button"
                            onClick={() =>
                              handleBuyNow(
                                product
                              )
                            }
                            className="
                              mt-2
                              flex
                              h-8
                              w-full
                              items-center
                              justify-center
                              rounded-full
                              text-[9px]
                              font-semibold
                              text-white
                              transition
                              hover:opacity-90
                              active:scale-[0.98]
                              sm:h-9
                              sm:text-[11px]
                            "
                            style={{
                              backgroundColor:
                                accentColor,
                            }}
                          >
                            Mua ngay

                            <span className="ml-1">
                              →
                            </span>
                          </button>

                        </div>
                      </div>
                    );
                  }
                )}

            </div>

          </div>
        </div>
      </section>

      {/* ========================================================
          FLASH SALE NOT STARTED POPUP
      ======================================================== */}

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
            setShowStartPopup(
              false
            )
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
              aria-label="Đóng"
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
              <X size={16} />
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

            {/* PRODUCT */}

            {selectedProductName && (
              <p
                className="
                  mt-2
                  text-sm
                  font-medium
                  text-neutral-800
                "
              >
                {selectedProductName}
              </p>
            )}

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

            {sale?.start_at && (
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
                    sale.start_at
                  )}
                </p>
              </div>
            )}

            {/* COUNTDOWN */}

            {!saleHasStarted && (
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

            {/* CLOSE */}

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
   COUNTDOWN BOX
============================================================ */

function CountdownBox({
  value,
  label,
  accent = false,
}: {
  value: number;
  label: string;
  accent?: boolean;
}) {
  return (
    <div
      className="
        flex
        min-w-[37px]
        flex-col
        items-center
        rounded-md
        border
        border-neutral-200
        bg-white
        px-1.5
        py-1
        sm:min-w-[44px]
        sm:px-2
        sm:py-1.5
      "
    >
      <span
        className={`
          text-[11px]
          font-semibold
          leading-none
          sm:text-sm
          ${
            accent
              ? "text-[#D97745]"
              : "text-neutral-800"
          }
        `}
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
          text-[6px]
          uppercase
          tracking-wide
          text-neutral-400
          sm:text-[8px]
        "
      >
        {label}
      </span>
    </div>
  );
}

/* ============================================================
   POPUP MINI TIME
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