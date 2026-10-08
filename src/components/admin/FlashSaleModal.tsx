import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
  flashSale?: any;
}

/**
 * datetime-local trả về:
 * 2026-10-10T23:59
 *
 * Chúng ta chủ động thêm +07:00 để PostgreSQL hiểu
 * đây là giờ Việt Nam.
 */
function localDateTimeToISO(value: string) {
  if (!value) return null;

  return `${value}:00+07:00`;
}

/**
 * Convert timestamp từ DB về format datetime-local.
 *
 * Ví dụ:
 * 2026-10-10T16:59:59+00:00
 *
 * => 2026-10-10T23:59
 */
function toDateTimeLocal(value: string | null | undefined) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const formatter = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });

  return formatter.format(date).replace(" ", "T");
}

export default function FlashSaleModal({
  open,
  onClose,
  onSaved,
  flashSale,
}: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [discount, setDiscount] = useState(8);

  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");

  const [showCountdown, setShowCountdown] =
    useState(true);

  const [active, setActive] =
    useState(true);

  const [bannerColor, setBannerColor] =
    useState("#D97745");

  const [keyword, setKeyword] =
    useState("");

  const [products, setProducts] =
    useState<any[]>([]);

  const [selectedProducts, setSelectedProducts] =
    useState<string[]>([]);

  const [saving, setSaving] =
    useState(false);

  /*
   * ============================================================
   * LOAD PRODUCTS
   * ============================================================
   */

  useEffect(() => {
    loadProducts();
  }, []);

  /*
   * ============================================================
   * LOAD FLASH SALE KHI EDIT
   * ============================================================
   */

  useEffect(() => {
    if (!open) return;

    if (!flashSale) {
      resetForm();
      return;
    }

    setTitle(
      flashSale.title || ""
    );

    setDescription(
      flashSale.description || ""
    );

    setDiscount(
      Number(
        flashSale.discount_percent ?? 0
      )
    );

    setStartAt(
      toDateTimeLocal(
        flashSale.start_at
      )
    );

    setEndAt(
      toDateTimeLocal(
        flashSale.end_at
      )
    );

    setBannerColor(
      flashSale.banner_color ||
        "#D97745"
    );

    setActive(
      flashSale.active ?? true
    );

    loadSelectedProducts(
      flashSale.id
    );
  }, [open, flashSale]);

  /*
   * ============================================================
   * LOAD PRODUCT LIST
   * ============================================================
   */

  async function loadProducts() {
    const { data, error } =
      await supabase
        .from("products")
        .select(`
          id,
          name,
          price,
          product_images(
            image_url,
            sort_order
          )
        `)
        .order("created_at", {
          ascending: false,
        });

    if (error) {
      console.error(
        "FLASH SALE PRODUCTS ERROR:",
        error
      );
      return;
    }

    setProducts(data ?? []);
  }

  /*
   * ============================================================
   * LOAD PRODUCTS ĐÃ CHỌN KHI EDIT
   * ============================================================
   */

  async function loadSelectedProducts(
    flashSaleId: string
  ) {
    const { data, error } =
      await supabase
        .from("flash_sale_products")
        .select("product_id")
        .eq(
          "flash_sale_id",
          flashSaleId
        );

    if (error) {
      console.error(
        "FLASH SALE SELECTED PRODUCTS ERROR:",
        error
      );
      return;
    }

    setSelectedProducts(
      (data ?? []).map(
        (item: any) =>
          item.product_id
      )
    );
  }

  /*
   * ============================================================
   * RESET
   * ============================================================
   */

  function resetForm() {
    setTitle("");
    setDescription("");
    setDiscount(8);
    setStartAt("");
    setEndAt("");
    setShowCountdown(true);
    setActive(true);
    setBannerColor("#D97745");
    setKeyword("");
    setSelectedProducts([]);
  }

  /*
   * ============================================================
   * SAVE
   * ============================================================
   */

  async function saveFlashSale() {
    if (saving) return;

    if (!title.trim()) {
      alert(
        "Vui lòng nhập tên chương trình."
      );
      return;
    }

    if (!startAt) {
      alert(
        "Vui lòng chọn thời gian bắt đầu."
      );
      return;
    }

    if (!endAt) {
      alert(
        "Vui lòng chọn thời gian kết thúc."
      );
      return;
    }

    const startTime =
      new Date(
        localDateTimeToISO(startAt)!
      ).getTime();

    const endTime =
      new Date(
        localDateTimeToISO(endAt)!
      ).getTime();

    if (
      Number.isNaN(startTime) ||
      Number.isNaN(endTime)
    ) {
      alert(
        "Thời gian Flash Sale không hợp lệ."
      );
      return;
    }

    if (endTime <= startTime) {
      alert(
        "Thời gian kết thúc phải sau thời gian bắt đầu."
      );
      return;
    }

    if (
      selectedProducts.length === 0
    ) {
      alert(
        "Vui lòng chọn ít nhất 1 sản phẩm."
      );
      return;
    }

    setSaving(true);

    try {
      const payload = {
        title: title.trim(),
        description:
          description.trim(),
        discount_percent:
          Number(discount) || 0,
        banner_color:
          bannerColor,
        active,
        start_at:
          localDateTimeToISO(startAt),
        end_at:
          localDateTimeToISO(endAt),
      };

      let flashSaleId =
        flashSale?.id ?? null;

      /*
       * ========================================================
       * UPDATE
       * ========================================================
       */

      if (flashSale?.id) {
        const { error } =
          await supabase
            .from("flash_sales")
            .update(payload)
            .eq(
              "id",
              flashSale.id
            );

        if (error) {
          throw error;
        }
      }

      /*
       * ========================================================
       * CREATE
       * ========================================================
       */

      else {
        const { data, error } =
          await supabase
            .from("flash_sales")
            .insert(payload)
            .select()
            .single();

        if (error) {
          throw error;
        }

        flashSaleId =
          data.id;
      }

      /*
       * ========================================================
       * PRODUCT RELATION
       *
       * Khi edit:
       * 1. Xóa product cũ
       * 2. Insert product mới
       *
       * Không tạo duplicate.
       * ========================================================
       */

      if (!flashSaleId) {
        throw new Error(
          "Không xác định được Flash Sale ID."
        );
      }

      const {
        error: deleteProductsError,
      } = await supabase
        .from(
          "flash_sale_products"
        )
        .delete()
        .eq(
          "flash_sale_id",
          flashSaleId
        );

      if (deleteProductsError) {
        throw deleteProductsError;
      }

      const rows =
        selectedProducts.map(
          (productId) => ({
            flash_sale_id:
              flashSaleId,
            product_id:
              productId,
          })
        );

      const {
        error: insertProductsError,
      } = await supabase
        .from(
          "flash_sale_products"
        )
        .insert(rows);

      if (insertProductsError) {
        throw insertProductsError;
      }

      alert(
        flashSale?.id
          ? "Đã cập nhật Flash Sale."
          : "Đã tạo Flash Sale."
      );

      resetForm();

      onSaved?.();
      onClose();
    } catch (error: any) {
      console.error(
        "SAVE FLASH SALE ERROR:",
        error
      );

      alert(
        error?.message ||
          "Không thể lưu Flash Sale."
      );
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return null;
  }

  /*
   * ============================================================
   * FILTER PRODUCTS
   * ============================================================
   */

  const filteredProducts =
    products.filter((product) =>
      String(
        product.name ?? ""
      )
        .toLowerCase()
        .includes(
          keyword.toLowerCase()
        )
    );

  return (
    <div
      className="
        fixed
        inset-0
        z-50
        flex
        items-center
        justify-center
        bg-black/40
        p-4
        backdrop-blur-[2px]
      "
    >
      <div
        className="
          relative
          flex
          w-full
          max-w-6xl
          max-h-[92vh]
          flex-col
          overflow-hidden
          rounded-3xl
          bg-white
          shadow-2xl
        "
      >
        {/* ======================================================
            HEADER
        ====================================================== */}

        <div
          className="
            flex
            shrink-0
            items-center
            justify-between
            border-b
            border-neutral-200
            px-8
            py-6
          "
        >
          <div>
            <p
              className="
                text-xs
                font-semibold
                uppercase
                tracking-[0.16em]
                text-[#D97745]
              "
            >
              Flash Sale
            </p>

            <h2
              className="
                mt-1
                text-3xl
                font-display
                text-neutral-900
              "
            >
              {flashSale
                ? "Chỉnh sửa Flash Sale"
                : "Tạo Flash Sale"}
            </h2>

            <p className="mt-1 text-sm text-neutral-500">
              Thiết lập thời gian, ưu đãi và
              sản phẩm áp dụng.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="
              flex
              h-10
              w-10
              items-center
              justify-center
              rounded-full
              text-xl
              text-neutral-500
              transition
              hover:bg-neutral-100
              hover:text-neutral-900
            "
          >
            ✕
          </button>
        </div>

        {/* ======================================================
            CONTENT
        ====================================================== */}

        <div
          className="
            flex-1
            overflow-y-auto
            px-8
            py-7
          "
        >
          <div className="space-y-7">

            {/* BASIC INFO */}

            <section>
              <div className="mb-4">
                <h3 className="font-semibold text-neutral-900">
                  Thông tin chương trình
                </h3>

                <p className="mt-1 text-sm text-neutral-500">
                  Nội dung hiển thị trên website.
                </p>
              </div>

              <div className="space-y-4">
                <input
                  value={title}
                  onChange={(e) =>
                    setTitle(
                      e.target.value
                    )
                  }
                  placeholder="Ví dụ: FLASH SALE 10.10"
                  className="
                    w-full
                    rounded-xl
                    border
                    border-neutral-200
                    px-4
                    py-3
                    outline-none
                    transition
                    focus:border-[#D97745]
                    focus:ring-2
                    focus:ring-[#D97745]/10
                  "
                />

                <textarea
                  value={description}
                  onChange={(e) =>
                    setDescription(
                      e.target.value
                    )
                  }
                  placeholder="Mô tả Flash Sale..."
                  className="
                    h-28
                    w-full
                    resize-none
                    rounded-xl
                    border
                    border-neutral-200
                    px-4
                    py-3
                    outline-none
                    transition
                    focus:border-[#D97745]
                    focus:ring-2
                    focus:ring-[#D97745]/10
                  "
                />
              </div>
            </section>

            {/* TIME */}

            <section>
              <div className="mb-4">
                <h3 className="font-semibold text-neutral-900">
                  Thời gian Flash Sale
                </h3>

                <p className="mt-1 text-sm text-neutral-500">
                  Múi giờ áp dụng: Việt Nam
                  (GMT+7).
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Giảm %
                  </label>

                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={discount}
                    onChange={(e) =>
                      setDiscount(
                        Number(
                          e.target.value
                        )
                      )
                    }
                    className="
                      w-full
                      rounded-xl
                      border
                      border-neutral-200
                      px-4
                      py-3
                      outline-none
                      focus:border-[#D97745]
                    "
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Bắt đầu
                  </label>

                  <input
                    type="datetime-local"
                    value={startAt}
                    onChange={(e) =>
                      setStartAt(
                        e.target.value
                      )
                    }
                    className="
                      w-full
                      rounded-xl
                      border
                      border-neutral-200
                      px-4
                      py-3
                      outline-none
                      focus:border-[#D97745]
                    "
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Kết thúc
                  </label>

                  <input
                    type="datetime-local"
                    value={endAt}
                    onChange={(e) =>
                      setEndAt(
                        e.target.value
                      )
                    }
                    className="
                      w-full
                      rounded-xl
                      border
                      border-neutral-200
                      px-4
                      py-3
                      outline-none
                      focus:border-[#D97745]
                    "
                  />
                </div>
              </div>
            </section>

            {/* BANNER */}

            <section>
              <label className="mb-2 block text-sm font-medium">
                Màu Banner
              </label>

              <select
                value={bannerColor}
                onChange={(e) =>
                  setBannerColor(
                    e.target.value
                  )
                }
                className="
                  w-full
                  rounded-xl
                  border
                  border-neutral-200
                  px-4
                  py-3
                  outline-none
                  focus:border-[#D97745]
                "
              >
                <option value="#D97745">
                  🟧 Cam Olive
                </option>

                <option value="#DC2626">
                  🟥 Đỏ
                </option>

                <option value="#2E3528">
                  🟩 Olive
                </option>

                <option value="#111827">
                  ⚫ Đen
                </option>
              </select>
            </section>

            {/* PRODUCTS */}

            <section>
              <div className="mb-4 flex items-end justify-between">
                <div>
                  <h3 className="font-semibold text-neutral-900">
                    Sản phẩm Flash Sale
                  </h3>

                  <p className="mt-1 text-sm text-neutral-500">
                    Đã chọn{" "}
                    <strong>
                      {selectedProducts.length}
                    </strong>{" "}
                    sản phẩm
                  </p>
                </div>
              </div>

              <input
                value={keyword}
                onChange={(e) =>
                  setKeyword(
                    e.target.value
                  )
                }
                placeholder="Tìm sản phẩm..."
                className="
                  mb-4
                  w-full
                  rounded-xl
                  border
                  border-neutral-200
                  px-4
                  py-3
                  outline-none
                  focus:border-[#D97745]
                "
              />

              <div
                className="
                  max-h-80
                  space-y-2
                  overflow-y-auto
                  rounded-2xl
                  border
                  border-neutral-200
                  p-3
                "
              >
                {filteredProducts.length ===
                0 ? (
                  <div className="py-10 text-center text-sm text-neutral-500">
                    Không tìm thấy sản phẩm.
                  </div>
                ) : (
                  filteredProducts.map(
                    (item) => {
                      const image =
                        item.product_images
                          ?.slice()
                          ?.sort(
                            (
                              a: any,
                              b: any
                            ) =>
                              Number(
                                a.sort_order ??
                                  0
                              ) -
                              Number(
                                b.sort_order ??
                                  0
                              )
                          )[0]
                          ?.image_url;

                      const checked =
                        selectedProducts.includes(
                          item.id
                        );

                      return (
                        <label
                          key={item.id}
                          className={`
                            flex
                            cursor-pointer
                            items-center
                            gap-4
                            rounded-xl
                            border
                            p-3
                            transition
                            ${
                              checked
                                ? "border-[#D97745] bg-[#FFF8F3]"
                                : "border-neutral-200 hover:bg-neutral-50"
                            }
                          `}
                        >
                          <input
                            type="checkbox"
                            checked={
                              checked
                            }
                            onChange={(
                              e
                            ) => {
                              if (
                                e.target
                                  .checked
                              ) {
                                setSelectedProducts(
                                  (
                                    current
                                  ) => [
                                    ...current,
                                    item.id,
                                  ]
                                );
                              } else {
                                setSelectedProducts(
                                  (
                                    current
                                  ) =>
                                    current.filter(
                                      (
                                        id
                                      ) =>
                                        id !==
                                        item.id
                                    )
                                );
                              }
                            }}
                            className="
                              h-4
                              w-4
                              accent-[#D97745]
                            "
                          />

                          <img
                            src={
                              image || ""
                            }
                            alt={
                              item.name
                            }
                            className="
                              h-14
                              w-14
                              shrink-0
                              rounded-lg
                              bg-neutral-100
                              object-cover
                            "
                          />

                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium">
                              {item.name}
                            </p>

                            <p className="mt-1 text-sm text-neutral-500">
                              {Number(
                                item.price
                              ).toLocaleString(
                                "vi-VN"
                              )}
                              đ
                            </p>
                          </div>
                        </label>
                      );
                    }
                  )
                )}
              </div>
            </section>

            {/* OPTIONS */}

            <section className="grid gap-4 md:grid-cols-2">
              <label
                className="
                  flex
                  cursor-pointer
                  items-center
                  gap-3
                  rounded-xl
                  border
                  border-neutral-200
                  p-4
                "
              >
                <input
                  type="checkbox"
                  checked={
                    showCountdown
                  }
                  onChange={(e) =>
                    setShowCountdown(
                      e.target.checked
                    )
                  }
                  className="accent-[#D97745]"
                />

                <div>
                  <p className="font-medium">
                    Hiển thị Countdown
                  </p>

                  <p className="text-sm text-neutral-500">
                    Hiển thị thời gian còn lại
                    trên Flash Sale.
                  </p>
                </div>
              </label>

              <label
                className="
                  flex
                  cursor-pointer
                  items-center
                  gap-3
                  rounded-xl
                  border
                  border-neutral-200
                  p-4
                "
              >
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(e) =>
                    setActive(
                      e.target.checked
                    )
                  }
                  className="accent-[#D97745]"
                />

                <div>
                  <p className="font-medium">
                    Kích hoạt
                  </p>

                  <p className="text-sm text-neutral-500">
                    Cho phép Flash Sale xuất
                    hiện trên website.
                  </p>
                </div>
              </label>
            </section>
          </div>
        </div>

        {/* ======================================================
            FOOTER
        ====================================================== */}

        <div
          className="
            flex
            shrink-0
            justify-end
            gap-3
            border-t
            border-neutral-200
            bg-white
            px-8
            py-5
          "
        >
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="
              rounded-xl
              border
              border-neutral-200
              px-6
              py-3
              font-medium
              transition
              hover:bg-neutral-50
              disabled:opacity-50
            "
          >
            Hủy
          </button>

          <button
            type="button"
            onClick={saveFlashSale}
            disabled={saving}
            className="
              rounded-xl
              bg-[#D97745]
              px-8
              py-3
              font-semibold
              text-white
              transition
              hover:bg-[#C86839]
              disabled:cursor-not-allowed
              disabled:opacity-60
            "
          >
            {saving
              ? "Đang lưu..."
              : flashSale
                ? "Lưu thay đổi"
                : "Lưu Flash Sale"}
          </button>
        </div>
      </div>
    </div>
  );
}