import { useEffect, useState } from "react";
import {
  Gift,
  Truck,
  Ticket,
  Percent,
  Copy,
  Check,
  ChevronDown,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";

type Voucher = {
  id: string;
  code: string;
  title: string | null;
  description?: string | null;
  type: string;
  value: number | null;
  min_order: number | null;
  max_discount?: number | null;
  active: boolean;
  start_at?: string | null;
  end_at?: string | null;
};

function formatVND(
  value: number | null | undefined
) {
  return (
    new Intl.NumberFormat("vi-VN").format(
      Number(value ?? 0)
    ) + "đ"
  );
}

function getNormalizedType(type: string) {
  const value = String(type ?? "").toLowerCase();

  if (
    value === "freeship" ||
    value === "free_shipping" ||
    value === "shipping"
  ) {
    return "freeship";
  }

  return value;
}

function getVoucherIcon(type: string) {
  switch (getNormalizedType(type)) {
    case "freeship":
      return Truck;

    case "percent":
      return Percent;

    case "fixed":
      return Gift;

    default:
      return Ticket;
  }
}

function getVoucherStyle(type: string) {
  switch (getNormalizedType(type)) {
    case "freeship":
      return {
        iconBg: "bg-[#F1F5F1]",
        iconColor: "text-[#506457]",
        badge: "FREE SHIP",
      };

    case "percent":
      return {
        iconBg: "bg-[#F4F1EC]",
        iconColor: "text-[#5E665F]",
        badge: "BEST",
      };

    case "fixed":
      return {
        iconBg: "bg-[#F5F0EA]",
        iconColor: "text-[#665E55]",
        badge: "NEW",
      };

    default:
      return {
        iconBg: "bg-[#F2F1ED]",
        iconColor: "text-[#5C625D]",
        badge: "OFFER",
      };
  }
}

function getVoucherTitle(voucher: Voucher) {
  const value = Number(voucher.value ?? 0);

  switch (getNormalizedType(voucher.type)) {
    case "freeship":
      return "Miễn phí vận chuyển";

    case "percent":
      return `Giảm ${value}%`;

    case "fixed":
      return `Giảm ${formatVND(value)}`;

    default:
      return (
        voucher.title ||
        "Ưu đãi đặc biệt"
      );
  }
}

function getVoucherDescription(
  voucher: Voucher
) {
  const minOrder = Number(
    voucher.min_order ?? 0
  );

  if (minOrder > 0) {
    return `Đơn từ ${formatVND(minOrder)}`;
  }

  return (
    voucher.description ||
    "Áp dụng cho đơn hàng"
  );
}

function saveVoucher(voucher: Voucher) {
  try {
    const raw = localStorage.getItem(
      "olive_saved_vouchers"
    );

    const savedVouchers = raw
      ? JSON.parse(raw)
      : [];

    const existed =
      savedVouchers.some(
        (item: any) =>
          item.code === voucher.code
      );

    if (existed) {
      return false;
    }

    savedVouchers.push({
      id: voucher.id,
      code: voucher.code,
      title: getVoucherTitle(
        voucher
      ),
      value: Number(
        voucher.value ?? 0
      ),
      type: voucher.type,
      minOrder: Number(
        voucher.min_order ?? 0
      ),
      maxDiscount: Number(
        voucher.max_discount ?? 0
      ),
    });

    localStorage.setItem(
      "olive_saved_vouchers",
      JSON.stringify(
        savedVouchers
      )
    );

    return true;
  } catch (error) {
    console.error(
      "Save voucher error:",
      error
    );

    return false;
  }
}

export default function FlashSaleVoucher() {
  const [vouchers, setVouchers] =
    useState<Voucher[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [copiedCode, setCopiedCode] =
    useState<string | null>(null);

  const [showAll, setShowAll] =
    useState(false);

  /*
   * ==========================================================
   * LOAD VOUCHERS
   * ==========================================================
   */

  async function loadVouchers() {
    setLoading(true);

    try {
      const {
        data,
        error,
      } = await supabase
        .from("vouchers")
        .select("*")
        .eq("active", true)
        .eq("is_personal", false)
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        console.error(
          "Load Flash Sale vouchers error:",
          error
        );

        setVouchers([]);

        return;
      }

      const now = new Date();

      const validVouchers =
        (data ?? []).filter(
          (voucher: Voucher) => {
            const startAt =
              voucher.start_at
                ? new Date(
                    voucher.start_at
                  )
                : null;

            const endAt =
              voucher.end_at
                ? new Date(
                    voucher.end_at
                  )
                : null;

            /*
             * Chưa tới ngày bắt đầu
             */

            if (
              startAt &&
              now < startAt
            ) {
              return false;
            }

            /*
             * Đã quá ngày kết thúc
             */

            if (
              endAt &&
              now > endAt
            ) {
              return false;
            }

            return true;
          }
        );

      setVouchers(
        validVouchers as Voucher[]
      );
    } catch (error) {
      console.error(
        "Load vouchers error:",
        error
      );

      setVouchers([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadVouchers();
  }, []);

  /*
   * ==========================================================
   * SAVE / COPY VOUCHER
   * ==========================================================
   */

  async function handleSaveVoucher(
    voucher: Voucher
  ) {
    saveVoucher(voucher);

    try {
      await navigator.clipboard.writeText(
        voucher.code
      );
    } catch {
      // Clipboard có thể bị browser chặn.
    }

    setCopiedCode(
      voucher.code
    );

    window.setTimeout(() => {
      setCopiedCode(null);
    }, 2000);
  }

  /*
   * ==========================================================
   * LOADING
   * ==========================================================
   */

  if (loading) {
    return (
      <section className="mt-8 sm:mt-10">
        <div className="mb-4 sm:mb-5">
          <div
            className="
              h-3
              w-24
              animate-pulse
              rounded
              bg-neutral-100
            "
          />

          <div
            className="
              mt-2
              h-7
              w-48
              animate-pulse
              rounded
              bg-neutral-100
            "
          />

          <div
            className="
              mt-2
              h-4
              w-64
              animate-pulse
              rounded
              bg-neutral-100
            "
          />
        </div>

        <div
          className="
            grid
            grid-cols-1
            gap-3
            sm:grid-cols-2
            xl:grid-cols-3
          "
        >
          {[1, 2].map(
            (item) => (
              <div
                key={item}
                className="
                  h-[108px]
                  animate-pulse
                  rounded-[16px]
                  border
                  border-[#E9E5DE]
                  bg-[#FAF9F7]
                "
              />
            )
          )}
        </div>
      </section>
    );
  }

  /*
   * ==========================================================
   * EMPTY
   * ==========================================================
   */

  if (vouchers.length === 0) {
    return (
      <section className="mt-8 sm:mt-10">
        <div className="mb-5">
          <p
            className="
              text-[10px]
              font-medium
              uppercase
              tracking-[0.2em]
              text-neutral-400
            "
          >
            SPECIAL OFFERS
          </p>

          <h2
            className="
              mt-1
              font-display
              text-[24px]
              leading-tight
              tracking-[-0.025em]
              text-[#20231F]
              sm:text-[28px]
            "
          >
            Voucher độc quyền
          </h2>

          <p
            className="
              mt-1
              text-[13px]
              text-neutral-500
            "
          >
            Lưu mã để sử dụng khi
            thanh toán.
          </p>
        </div>

        <div
          className="
            rounded-[16px]
            border
            border-dashed
            border-[#DCD8D0]
            bg-[#FAF9F7]
            px-5
            py-8
            text-center
          "
        >
          <Ticket
            className="
              mx-auto
              h-7
              w-7
              text-neutral-400
            "
            strokeWidth={1.5}
          />

          <p
            className="
              mt-3
              text-[13px]
              text-neutral-500
            "
          >
            Hiện chưa có voucher
            khả dụng.
          </p>
        </div>
      </section>
    );
  }

  /*
   * ==========================================================
   * SHOW ONLY 2 BY DEFAULT
   * ==========================================================
   */

  const visibleVouchers =
    showAll
      ? vouchers
      : vouchers.slice(0, 2);

  const remainingCount =
    Math.max(
      0,
      vouchers.length - 2
    );

  /*
   * ==========================================================
   * MAIN
   * ==========================================================
   */

  return (
    <section className="mt-8 sm:mt-10">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div
        className="
          mb-4
          flex
          items-end
          justify-between
          gap-4
          sm:mb-5
        "
      >
        <div>
          <p
            className="
              text-[9px]
              font-medium
              uppercase
              tracking-[0.2em]
              text-neutral-400
              sm:text-[10px]
            "
          >
            SPECIAL OFFERS
          </p>

          <h2
            className="
              mt-1
              font-display
              text-[24px]
              leading-[1.05]
              tracking-[-0.025em]
              text-[#20231F]
              sm:text-[30px]
            "
          >
            Voucher độc quyền
          </h2>

          <p
            className="
              mt-1
              text-[12px]
              leading-5
              text-neutral-500
              sm:text-[13px]
            "
          >
            Lưu mã để sử dụng khi
            thanh toán.
          </p>
        </div>

        <div
          className="
            hidden
            shrink-0
            text-[11px]
            text-neutral-400
            sm:block
          "
        >
          {vouchers.length} ưu đãi
        </div>
      </div>

      {/* =====================================================
          VOUCHER GRID
      ===================================================== */}

      <div
        className="
          grid
          grid-cols-1
          gap-3
          sm:grid-cols-2
          xl:grid-cols-3
        "
      >
        {visibleVouchers.map(
          (voucher) => {
            const Icon =
              getVoucherIcon(
                voucher.type
              );

            const style =
              getVoucherStyle(
                voucher.type
              );

            const isCopied =
              copiedCode ===
              voucher.code;

            return (
              <article
                key={voucher.id}
                className="
                  group
                  relative
                  overflow-hidden
                  rounded-[16px]
                  border
                  border-[#E7E3DC]
                  bg-white
                  px-3.5
                  py-3
                  transition-all
                  duration-300
                  hover:-translate-y-0.5
                  hover:border-[#D9D4CB]
                  hover:shadow-[0_10px_30px_rgba(40,35,28,0.07)]
                  sm:rounded-[18px]
                  sm:px-4
                  sm:py-3.5
                "
              >

                {/* =================================================
                    TOP
                ================================================= */}

                <div
                  className="
                    flex
                    items-center
                    gap-3
                  "
                >

                  {/* ICON */}

                  <div
                    className={`
                      flex
                      h-10
                      w-10
                      shrink-0
                      items-center
                      justify-center
                      rounded-[12px]
                      ${style.iconBg}
                      sm:h-11
                      sm:w-11
                    `}
                  >
                    <Icon
                      size={19}
                      strokeWidth={1.7}
                      className={
                        style.iconColor
                      }
                    />
                  </div>

                  {/* INFORMATION */}

                  <div
                    className="
                      min-w-0
                      flex-1
                    "
                  >

                    {/* CODE + BADGE */}

                    <div
                      className="
                        flex
                        items-center
                        gap-2
                      "
                    >
                      <p
                        className="
                          min-w-0
                          truncate
                          font-mono
                          text-[11px]
                          font-medium
                          tracking-[0.02em]
                          text-[#333832]
                          sm:text-[12px]
                        "
                      >
                        {voucher.code}
                      </p>

                      <span
                        className="
                          hidden
                          shrink-0
                          rounded-full
                          bg-[#F1F3EF]
                          px-2
                          py-[3px]
                          text-[8px]
                          font-semibold
                          uppercase
                          tracking-[0.05em]
                          text-[#5C6C60]
                          min-[400px]:inline-flex
                        "
                      >
                        {style.badge}
                      </span>
                    </div>

                    {/* TITLE */}

                    <h3
                      className="
                        mt-0.5
                        truncate
                        text-[13px]
                        font-semibold
                        leading-5
                        text-[#20251F]
                        sm:text-[14px]
                      "
                    >
                      {getVoucherTitle(
                        voucher
                      )}
                    </h3>

                    {/* DESCRIPTION */}

                    <p
                      className="
                        mt-0.5
                        truncate
                        text-[11px]
                        leading-4
                        text-neutral-500
                        sm:text-[12px]
                      "
                    >
                      {getVoucherDescription(
                        voucher
                      )}
                    </p>
                  </div>

                  {/* MOBILE BADGE */}

                  <span
                    className="
                      shrink-0
                      rounded-full
                      bg-[#F1F3EF]
                      px-2
                      py-[3px]
                      text-[7px]
                      font-semibold
                      uppercase
                      tracking-[0.05em]
                      text-[#5C6C60]
                      min-[400px]:hidden
                    "
                  >
                    {style.badge}
                  </span>
                </div>

                {/* =================================================
                    BOTTOM
                ================================================= */}

                <div
                  className="
                    mt-3
                    flex
                    items-center
                    justify-between
                    gap-3
                    border-t
                    border-[#EEEAE4]
                    pt-3
                  "
                >

                  {/* CONDITION */}

                  <div
                    className="
                      min-w-0
                    "
                  >
                    <p
                      className="
                        text-[9px]
                        uppercase
                        tracking-[0.08em]
                        text-neutral-400
                      "
                    >
                      Điều kiện
                    </p>

                    <p
                      className="
                        mt-0.5
                        truncate
                        text-[10px]
                        font-medium
                        text-[#5A5D58]
                        sm:text-[11px]
                      "
                    >
                      {getVoucherDescription(
                        voucher
                      )}
                    </p>
                  </div>

                  {/* SAVE */}

                  <button
                    type="button"
                    onClick={() =>
                      handleSaveVoucher(
                        voucher
                      )
                    }
                    className={`
                      flex
                      h-8
                      shrink-0
                      items-center
                      justify-center
                      gap-1.5
                      rounded-full
                      px-4
                      text-[10px]
                      font-semibold
                      transition-all
                      duration-200
                      active:scale-[0.97]
                      sm:h-9
                      sm:px-4.5
                      sm:text-[11px]
                      ${
                        isCopied
                          ? "bg-[#EEF4ED] text-[#58705D]"
                          : "bg-[#536A59] text-white hover:bg-[#465A4B]"
                      }
                    `}
                  >
                    {isCopied ? (
                      <>
                        <Check
                          size={13}
                          strokeWidth={2}
                        />

                        Đã lưu
                      </>
                    ) : (
                      <>
                        <Copy
                          size={13}
                          strokeWidth={1.8}
                        />

                        Lưu mã
                      </>
                    )}
                  </button>
                </div>

                {/* HOVER LINE */}

                <div
                  className="
                    pointer-events-none
                    absolute
                    bottom-0
                    left-0
                    h-px
                    w-0
                    bg-[#536A59]
                    transition-all
                    duration-300
                    group-hover:w-full
                  "
                />
              </article>
            );
          }
        )}
      </div>

      {/* =====================================================
          EXPAND / COLLAPSE
      ===================================================== */}

      {vouchers.length > 2 && (
        <div
          className="
            mt-4
            flex
            justify-center
          "
        >
          <button
            type="button"
            onClick={() =>
              setShowAll(
                (current) => !current
              )
            }
            className="
              inline-flex
              h-9
              items-center
              gap-1.5
              rounded-full
              border
              border-[#DEDAD2]
              bg-white
              px-5
              text-[11px]
              font-medium
              text-[#536257]
              transition-all
              duration-200
              hover:border-[#536A59]
              hover:bg-[#F7F8F5]
              active:scale-[0.98]
            "
          >
            {showAll
              ? "Thu gọn"
              : `Xem thêm ${remainingCount} voucher`}

            <ChevronDown
              className={`
                h-3.5
                w-3.5
                transition-transform
                duration-200
                ${
                  showAll
                    ? "rotate-180"
                    : ""
                }
              `}
              strokeWidth={1.8}
            />
          </button>
        </div>
      )}

      {/* MOBILE COUNT */}

      <div
        className="
          mt-3
          text-center
          text-[10px]
          text-neutral-400
          sm:hidden
        "
      >
        {showAll
          ? `Đang hiển thị ${vouchers.length} ưu đãi`
          : vouchers.length > 2
            ? `${vouchers.length - 2} voucher khác đang có`
            : ""}
      </div>
    </section>
  );
}