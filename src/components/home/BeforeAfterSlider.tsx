import React, { useRef, useState } from "react";

interface Product {
  id: string;
  slug?: string;
  name: string;
  price?: number;
  compare_at_price?: number;
  old_price?: number;
}

interface BeforeAfterSliderProps {
  beforeImage: string;
  afterImage: string;
  products?: Product[];
}

const R2_BASE =
  "https://pub-16208320b245401d98649b48aeb33803.r2.dev";

const FLOOR_LAMP_IMAGES: Record<string, string> = {
  halfround: `${R2_BASE}/products/halfround.jpg`,
  memphis20: `${R2_BASE}/products/memphis20.jpg`,
  bauhaus: `${R2_BASE}/products/bauhaus.jpg`,
  fishing: `${R2_BASE}/products/fishing.jpg`,
};

const getFloorLampDisplayName = (product: Product) => {
  const text = `${product.name || ""} ${product.slug || ""}`.toLowerCase();

  if (text.includes("half round") || text.includes("halfround")) {
    return "ĐÈN CÂY ĐỨNG HALF ROUND";
  }

  if (text.includes("memphis 20") || text.includes("memphis20")) {
    return "ĐÈN CÂY ĐỨNG MEMPHIS 20";
  }

  if (text.includes("bauhaus")) {
    return "ĐÈN CÂY ĐỨNG BAUHAUS";
  }

  if (text.includes("fishing")) {
    return "ĐÈN CÂY ĐỨNG FISHING";
  }

  return product.name;
};

const getFloorLampImage = (product: Product) => {
  const text = `${product.name || ""} ${product.slug || ""}`.toLowerCase();

  if (text.includes("half round") || text.includes("halfround")) {
    return FLOOR_LAMP_IMAGES.halfround;
  }

  if (text.includes("memphis 20") || text.includes("memphis20")) {
    return FLOOR_LAMP_IMAGES.memphis20;
  }

  if (text.includes("bauhaus")) {
    return FLOOR_LAMP_IMAGES.bauhaus;
  }

  if (text.includes("fishing")) {
    return FLOOR_LAMP_IMAGES.fishing;
  }

  return "";
};

const getFloorLampSocialProof = (product: Product) => {
  const seed = String(product.id || product.slug || "")
    .split("")
    .reduce((sum, char) => sum + char.charCodeAt(0), 0);

  return {
    rating: (4.7 + (seed % 4) * 0.1).toFixed(1),
    reviews: 14 + (seed % 88),
    sold: 32 + ((seed * 7) % 260),
  };
};

const formatPrice = (price: number) => {
  return `${new Intl.NumberFormat("vi-VN").format(price)}₫`;
};

export default function BeforeAfterSlider({
  beforeImage,
  afterImage,
  products = [],
}: BeforeAfterSliderProps) {
  const [position, setPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);

  const moveSlider = (clientX: number) => {
    const box = containerRef.current;

    if (!box) return;

    const rect = box.getBoundingClientRect();

    let value = ((clientX - rect.left) / rect.width) * 100;

    value = Math.max(0, Math.min(100, value));

    setPosition(value);
  };

  const handlePointerDown = (
    event: React.PointerEvent<HTMLDivElement>
  ) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    moveSlider(event.clientX);
  };

  const handlePointerMove = (
    event: React.PointerEvent<HTMLDivElement>
  ) => {
    if (event.buttons === 1) {
      moveSlider(event.clientX);
    }
  };

  const goToProduct = (product: Product) => {
    if (product.slug) {
      window.location.href = `/products/${product.slug}`;
    }
  };

  return (
    <>
      <style>{`
        /* intentionally static — premium editorial UI */
      `}</style>

      <section className="w-full bg-[#F6F4EF] py-7 sm:py-10 md:py-16">
      <div className="mx-auto max-w-[1320px] px-3 sm:px-5">
        <div className="flex flex-col overflow-hidden rounded-[22px] border border-stone-200/80 bg-white p-2.5 shadow-[0_10px_35px_rgba(38,38,32,0.05)] sm:p-4 lg:grid lg:grid-cols-[0.94fr_1.06fr] lg:gap-4">

          {/* BEFORE / AFTER */}
          <div
            ref={containerRef}
            className="order-1 relative aspect-[1/1.03] w-full cursor-ew-resize overflow-hidden rounded-[18px] bg-stone-100 select-none touch-none lg:order-2 lg:aspect-[0.92/1]"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
          >
            <img
              src={beforeImage}
              alt="Không gian trước khi có đèn"
              draggable={false}
              className="absolute inset-0 h-full w-full object-cover"
            />

            <div
              className="absolute inset-y-0 left-0 overflow-hidden"
              style={{ width: `${position}%` }}
            >
              <img
                src={afterImage}
                alt="Không gian sau khi có đèn"
                draggable={false}
                className="absolute left-0 top-0 h-full max-w-none object-cover"
                style={{
                  width: containerRef.current
                    ? `${containerRef.current.offsetWidth}px`
                    : "100%",
                }}
              />
            </div>

            {/* SLIDER LINE */}
            <div
              className="pointer-events-none absolute inset-y-0 w-[2px] bg-white shadow-lg"
              style={{
                left: `${position}%`,
                transform: "translateX(-50%)",
              }}
            />

            {/* SLIDER HANDLE */}
            <div
              className="pointer-events-none absolute top-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-lg sm:h-14 sm:w-14"
              style={{ left: `${position}%` }}
            >
              <span className="text-lg text-gray-800">‹</span>
              <span className="mx-1.5 h-5 w-px bg-stone-300" />
              <span className="text-lg text-gray-800">›</span>
            </div>

            {/* LABELS */}
            <div className="pointer-events-none absolute left-3 top-3 rounded-full bg-black/50 px-3 py-1.5 text-[7px] uppercase tracking-[0.25em] text-white sm:left-5 sm:top-5 sm:px-4 sm:py-2 sm:text-[8px]">
              BEFORE
            </div>

            <div className="pointer-events-none absolute right-3 top-3 rounded-full bg-white/90 px-3 py-1.5 text-[7px] uppercase tracking-[0.25em] text-gray-800 sm:right-5 sm:top-5 sm:px-4 sm:py-2 sm:text-[8px]">
              AFTER
            </div>
          </div>

          {/* LEFT CONTENT */}
          <div className="order-2 flex flex-col p-2 sm:p-4 lg:order-1">

            <p className="mb-2 text-[8px] uppercase tracking-[0.32em] text-emerald-800 sm:text-[9px]">
              SIGNATURE FLOOR LIGHTING
            </p>

            <h2 className="font-serif text-[27px] leading-[1.02] tracking-[-0.02em] text-gray-800 sm:text-4xl">
              Một dáng đèn,
              <br />
              cả góc phòng khác biệt.
            </h2>

            

            {/* PRODUCTS */}
            <div className="mt-5 grid grid-cols-2 gap-2 sm:gap-2.5 lg:grid-cols-4">
              {products.slice(0, 4).map((product) => {
                const image = getFloorLampImage(product);

                const oldPrice =
                  product.old_price &&
                  product.old_price > (product.price || 0)
                    ? product.old_price
                    : null;

                return (
                  <div
                    key={product.id}
                    className="group flex min-w-0 flex-col overflow-hidden rounded-[13px] border border-stone-200/90 bg-white transition-all duration-300 hover:-translate-y-0.5 hover:border-stone-300 hover:shadow-[0_8px_22px_rgba(38,38,32,0.07)]"
                  >
                    {/* PRODUCT IMAGE */}
                    <button
                      type="button"
                      onClick={() => goToProduct(product)}
                      className="aspect-[1.08/1] w-full overflow-hidden bg-[#F4F2ED]"
                    >
                      {image ? (
                        <img
                          src={image}
                          alt={getFloorLampDisplayName(product)}
                          draggable={false}
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.035]"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-[10px] text-gray-400">
                          No image
                        </div>
                      )}
                    </button>

                    {/* PRODUCT INFO */}
                    <div className="flex flex-1 flex-col p-2 sm:p-2.5">

                      {/* PRODUCT NAME */}
                      <button
                        type="button"
                        onClick={() => goToProduct(product)}
                        className="
                          min-h-[32px]
                          line-clamp-2
                          overflow-hidden
                          text-left
                          text-[10px]
                          font-semibold
                          leading-[1.35]
                          text-gray-900
                          transition-colors
                          hover:text-emerald-700
                          sm:min-h-[36px]
                          sm:text-[11px]
                        "
                      >
                        {getFloorLampDisplayName(product)}
                      </button>

                      {/* RATING / REVIEWS / SOLD */}
                      {(() => {
                        const socialProof = getFloorLampSocialProof(product);

                        return (
                          <div
                            className="
                              mt-1
                              flex
                              min-w-0
                              flex-wrap
                              items-center
                              gap-x-1.5
                              gap-y-0.5
                              text-[8.5px]
                              leading-4
                              text-gray-500
                              sm:text-[9.5px]
                            "
                          >
                            <span className="font-semibold text-[#C8922E]">
                              ★ {socialProof.rating}
                            </span>

                            <span className="text-gray-300">·</span>

                            <span>{socialProof.reviews} đánh giá</span>

                            <span className="text-gray-300">·</span>

                            <span>Đã bán {socialProof.sold}</span>
                          </div>
                        );
                      })()}

                      {/* PRICE */}
                      <div className="mt-1 min-h-[36px]">
                        {oldPrice ? (
                          <div className="flex flex-col leading-tight">
                            <span className="text-[8.5px] text-gray-400 line-through sm:text-[9.5px]">
                              {formatPrice(oldPrice)}
                            </span>

                            {product.price ? (
                              <span className="mt-0.5 text-[14px] font-bold leading-5 text-emerald-700 sm:text-[15px]">
                                {formatPrice(product.price)}
                              </span>
                            ) : null}
                          </div>
                        ) : product.price ? (
                          <span className="text-[14px] font-bold leading-5 text-emerald-700 sm:text-[15px]">
                            {formatPrice(product.price)}
                          </span>
                        ) : (
                          <span className="text-[10px] text-gray-400">
                            Chưa có giá
                          </span>
                        )}
                      </div>

                      {/* BUTTONS */}
                      <div className="mt-2 grid grid-cols-[1fr_30px] items-center gap-1">
                        <button
                          type="button"
                          onClick={() => goToProduct(product)}
                          className="
                            h-8
                            w-full
                            rounded-[8px]
                            bg-[#F0F5F0]
                            px-2
                            text-[9px]
                            font-semibold
                            text-emerald-700
                            transition-all
                            duration-300
                            hover:-translate-y-0.5
                            hover:bg-[#E5EEE7]
                            active:scale-[0.98]
                            sm:h-9
                            sm:text-[10px]
                          "
                        >
                          Mua ngay
                        </button>

                        <button
                          type="button"
                          aria-label="Thêm vào giỏ hàng"
                          onClick={(event) => {
                            event.stopPropagation();
                            goToProduct(product);
                          }}
                          className="
                            flex
                            h-8
                            w-[30px]
                            shrink-0
                            items-center
                            justify-center
                            rounded-[8px]
                            border
                            border-stone-200
                            bg-white
                            text-emerald-700
                            transition-all
                            duration-300
                            hover:-translate-y-0.5
                            hover:bg-stone-50
                            active:scale-[0.96]
                            sm:h-9
                            sm:w-9
                          "
                        >
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.7"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M3 4h2l2.4 11.5a2 2 0 0 0 2 1.5h7.7a2 2 0 0 0 1.9-1.4L21 8H6" />
                            <circle cx="10" cy="20" r="1.2" />
                            <circle cx="18" cy="20" r="1.2" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* CTA */}
            {/* CTA + SHOPPING BENEFITS */}

            <div
              className="
                mt-6
                flex
                flex-col
                items-start
                gap-4
              "
            >

              {/* CTA */}

              <button
                type="button"
                onClick={() => {
                  window.location.href = "/shop";
                }}
                className="
                  group
                  flex w-full items-center justify-between
                  rounded-[11px]
                  bg-gray-900
                  px-4 py-2.5
                  text-[10px]
                  font-medium
                  text-white
                  transition
                  hover:bg-gray-900
                "
              >
                <span>Chọn chiếc đèn phù hợp</span>
                <span className="text-[14px] transition-transform duration-300 group-hover:translate-x-1">
                  →
                </span>
              </button>


              {/* SHOPPING BENEFITS — 3 items always on one row */}

              <div
                className="
                  grid
                  w-full
                  grid-cols-3
                  items-center
                  gap-1
                  sm:flex
                  sm:w-auto
                  sm:gap-5
                "
              >

              {/* FREESHIP */}

              <div className="flex min-w-0 items-center justify-center gap-1.5">

                <span
                  className="
                    flex
                    h-7
                    w-7
                    items-center
                    justify-center
                    rounded-full
                    bg-[#F1F7F2]
                    text-[#4F8063]
                  "
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 6h11v10H3z" />
                    <path d="M14 9h4l3 3v4h-7z" />
                    <circle cx="7" cy="19" r="1.5" />
                    <circle cx="18" cy="19" r="1.5" />
                  </svg>
                </span>

                <span className="min-w-0 text-[8px] leading-4 text-[#6B756A] sm:text-[10px]">
                  <strong className="font-semibold text-[#3F493F]">
                    Freeship
                  </strong>
                  <br />
                  toàn quốc
                </span>

              </div>


              {/* RETURN */}

              <div className="flex min-w-0 items-center justify-center gap-1.5">

                <span
                  className="
                    flex
                    h-7
                    w-7
                    items-center
                    justify-center
                    rounded-full
                    bg-[#F1F7F2]
                    text-[#4F8063]
                  "
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M9 14 4 9l5-5" />
                    <path d="M4 9h10a6 6 0 0 1 6 6v1" />
                    <path d="M15 20h5v-5" />
                  </svg>
                </span>

                <span className="min-w-0 text-[8px] leading-4 text-[#6B756A] sm:text-[10px]">
                  <strong className="font-semibold text-[#3F493F]">
                    Đổi trả
                  </strong>
                  <br />
                  trong 15 ngày
                </span>

              </div>


              {/* VOUCHER */}

              <div className="flex min-w-0 items-center justify-center gap-1.5">

                <span
                  className="
                    flex
                    h-7
                    w-7
                    items-center
                    justify-center
                    rounded-full
                    bg-[#F1F7F2]
                    text-[#4F8063]
                  "
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-7" />
                    <path d="M2 7h20v5H2z" />
                    <path d="M12 7v14" />
                    <path d="M12 7H8.5a2.5 2.5 0 1 1 0-5C11 2 12 7 12 7Z" />
                    <path d="M12 7h3.5a2.5 2.5 0 1 0 0-5C13 2 12 7 12 7Z" />
                  </svg>
                </span>

                <span className="min-w-0 text-[8px] leading-4 text-[#6B756A] sm:text-[10px]">
                  <strong className="font-semibold text-[#3F493F]">
                    Voucher 50K
                  </strong>
                  <br />
                  cho đơn hàng
                </span>

              </div>

              </div>

            </div>

          </div>
        </div>
      </div>
    </section>
    </>
  );
}

