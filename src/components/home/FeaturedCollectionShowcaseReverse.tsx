import { Link } from "@tanstack/react-router";
import { ShoppingCart } from "lucide-react";

interface Props {
  products: any[];
}


const getMemphisDisplayName = (product: any) => {
  const text = `${product.name || ""} ${product.slug || ""}`.toLowerCase();

  if (text.includes("memphis 32")) {
    return "ĐÈN CÂY ĐỨNG MEMPHIS 32";
  }

  if (text.includes("memphis 20")) {
    return "ĐÈN CÂY ĐỨNG MEMPHIS 20";
  }

  return product.name;
};

const getMemphisSocialProof = (product: any) => {
  const seed = String(product.id || product.slug || "")
    .split("")
    .reduce((sum, char) => sum + char.charCodeAt(0), 0);

  return {
    rating: (4.7 + (seed % 4) * 0.1).toFixed(1),
    reviews: 18 + (seed % 83),
    sold: 42 + ((seed * 7) % 260),
  };
};

export default function FeaturedCollectionShowcaseReverse({
  products,
}: Props) {
  
  const collectionProducts = [
  products.find((product) => {
    const text = `${product.name} ${product.slug}`.toLowerCase();
    return text.includes("memphis 32");
  }),

  products.find((product) => {
    const text = `${product.name} ${product.slug}`.toLowerCase();
    return text.includes("memphis 20");
  }),
].filter(Boolean);

  return (
    <>


      <section className="bg-[#F7F4EF] py-10 sm:py-14 lg:py-20">
      <div className="mx-auto w-full max-w-[1380px] px-4 sm:px-6 lg:px-8">

        {/* ===================================================== */}
        {/* MAIN CARD */}
        {/* ===================================================== */}

        <div
          className="
            overflow-hidden
            rounded-[26px]
            border
            border-[#E7DED3]
            bg-white
            shadow-[0_20px_70px_rgba(60,45,30,0.06)]

            lg:grid
            lg:grid-cols-[0.98fr_1.02fr]

            xl:rounded-[34px]
          "
        >

          {/* ===================================================== */}
          {/* LEFT CONTENT */}
          {/* ===================================================== */}

          <div
            className="
              order-2
              flex
              flex-col
              justify-center

              px-6
              py-10

              sm:px-8
              sm:py-12

              lg:order-1
              lg:px-10
              lg:py-14

              xl:px-14
              xl:py-16
            "
          >

            {/* EYEBROW */}

            <p
              className="
                text-[9px]
                font-semibold
                uppercase
                tracking-[0.34em]
                text-[#6F8B5E]

                sm:text-[10px]
              "
            >
              EVERYDAY ESSENTIALS
            </p>


            {/* TITLE */}

            <h2
              className="
                mt-4
                max-w-[520px]

                font-display
                text-[34px]
                leading-[1.05]
                tracking-[-0.025em]
                text-[#292725]

                sm:text-[42px]

                lg:text-[46px]

                xl:text-[52px]
              "
            >
              Những món đồ
              <br />
              làm nên không gian.
            </h2>


            {/* DESCRIPTION */}

            


            {/* ===================================================== */}
            {/* PRODUCT CARDS */}
            {/* ===================================================== */}

            <div
              className="
                mt-6
                grid
                grid-cols-2
                gap-2.5
                sm:mt-8
                sm:gap-4
                lg:max-w-[500px]
                lg:gap-4
              "
            >

              {collectionProducts.map((product) => (

                <div
                  key={product.id}
                  className="
                    min-w-0
                    overflow-hidden

                    rounded-[12px]
                    border
                    border-[#E7E1D8]
                    bg-white
                    shadow-[0_3px_14px_rgba(60,45,30,0.025)]
                  "
                >

                  {/* PRODUCT IMAGE */}

                  <Link
                    to="/products/$slug"
                    params={{
                      slug: product.slug,
                    }}
                    className="block"
                  >

                    <div
                      className="
                        aspect-[1.12/1]
                        w-full
                        overflow-hidden
                        bg-[#F5F2ED]
                        sm:aspect-[1.06/1]
                      "
                    >

                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="
                          h-full
                          w-full

                          object-contain
                          object-center

                          transition-transform
                          duration-500

                          hover:scale-[1.025]
                        "
                      />

                    </div>

                  </Link>


                  {/* PRODUCT CONTENT */}

                  <div
                    className="
                      flex
                      min-w-0
                      flex-1
                      flex-col
                      px-2
                      pb-2
                      pt-2
                      sm:px-3
                      sm:pb-3
                      sm:pt-2.5
                    "
                  >
                    {/* PRODUCT NAME */}

                    <Link
                      to="/products/$slug"
                      params={{
                        slug: product.slug,
                      }}
                      className="
                        block
                        min-h-[28px]
                        line-clamp-2
                        overflow-hidden
                        text-[10px]
                        font-medium
                        leading-[1.3]
                        tracking-[-0.005em]
                        text-[#292725]
                        transition-colors
                        hover:text-[#4F8063]
                        sm:min-h-[31px]
                        sm:text-[11.5px]
                      "
                    >
                      {getMemphisDisplayName(product)}
                    </Link>

                    {/* RATING / REVIEWS / SOLD */}

                    {(() => {
                      const socialProof = getMemphisSocialProof(product);

                      return (
                        <div
                          className="
                            mt-0.5
                            flex
                            min-w-0
                            items-center
                            gap-x-1
                            whitespace-nowrap
                            overflow-hidden
                            text-[7.5px]
                            leading-3.5
                            text-[#817A72]
                            sm:text-[8.5px]
                          "
                        >
                          <span className="font-semibold text-[#C8922E]">
                            ★ {socialProof.rating}
                          </span>

                          <span className="text-[#B8B2AA]">·</span>

                          <span className="truncate">{socialProof.reviews} đánh giá</span>

                          <span className="text-[#C8C1B8]">·</span>

                          <span className="truncate">Đã bán {socialProof.sold}</span>
                        </div>
                      );
                    })()}

                    {/* PRICE */}

                    <div className="mt-0.5 min-h-[30px]">
                      {product.price ? (
                        <>
                          <div className="text-[8px] leading-3 text-[#B0AAA3] line-through sm:text-[8.5px]">
                            {new Intl.NumberFormat("vi-VN").format(
                              product.compare_at_price &&
                              product.compare_at_price > product.price
                                ? product.compare_at_price
                                : Math.ceil(
                                    (product.price * 1.1) / 10000
                                  ) * 10000
                            )}₫
                          </div>

                          <div className="mt-0.5 text-[13px] font-semibold leading-4 tracking-[-0.02em] text-[#4F8063] sm:text-[13.5px]">
                            {new Intl.NumberFormat("vi-VN").format(
                              product.price
                            )}₫
                          </div>
                        </>
                      ) : (
                        <div className="text-[10px] text-red-500">
                          Chưa có giá
                        </div>
                      )}
                    </div>

                    {/* ACTIONS */}

                    <div
                      className="
                        mt-1
                        grid
                        grid-cols-[1fr_30px]
                        items-center
                        gap-1
                        sm:grid-cols-[1fr_32px]
                        sm:gap-1.5
                      "
                    >
                      {/* BUY */}

                      <Link
                        to="/products/$slug"
                        params={{
                          slug: product.slug,
                        }}
                        className="
                          flex
                          h-7
                          w-full
                          items-center
                          justify-center
                          rounded-[8px]
                          bg-[#DDF1E6]
                          px-1.5
                          text-[8px]
                          font-medium
                          text-[#4F8063]
                          transition-all
                          duration-300
                          hover:-translate-y-0.5
                          hover:bg-[#CDE8D9]
                          active:scale-[0.98]
                          sm:h-8
                          sm:rounded-[9px]
                          sm:text-[9px]
                        "
                      >
                        Mua ngay
                      </Link>

                      {/* CART */}

                      <Link
                        to="/products/$slug"
                        params={{
                          slug: product.slug,
                        }}
                        aria-label={`Thêm ${product.name} vào giỏ hàng`}
                        className="
                          flex
                          h-7
                          w-[30px]
                          shrink-0
                          items-center
                          justify-center
                          rounded-[8px]
                          border
                          border-[#D7E9DD]
                          bg-[#F7FBF8]
                          text-[#4F8063]
                          transition-all
                          duration-300
                          hover:-translate-y-0.5
                          hover:bg-[#DDF1E6]
                          active:scale-[0.96]
                          sm:h-8
                          sm:w-8
                          sm:rounded-[9px]
                        "
                      >
                        <ShoppingCart
                          size={13}
                          strokeWidth={1.6}
                        />
                      </Link>
                    </div>

                  </div>

                </div>

              ))}

            </div>


            {/* ===================================================== */}
            {/* CTA + TRUST STRIP */}

            <div
              className="
                mt-5
                border-t
                border-[#E7E0D7]
                pt-4
                sm:mt-7
                sm:pt-5
              "
            >
              <Link
                to="/shop"
                className="
                  group
                  flex
                  h-9
                  w-full
                  items-center
                  justify-center
                  gap-2
                  rounded-full
                  bg-[#2E3528]
                  px-4
                  text-[9px]
                  font-semibold
                  tracking-[-0.01em]
                  text-white
                  transition-colors
                  duration-200
                  hover:bg-[#3A4433]
                  active:scale-[0.99]
                  sm:h-10
                  sm:w-fit
                  sm:text-[10px]
                "
              >
                <span>Xem trọn bộ nội thất</span>
                <span className="text-[12px] transition-transform duration-200 group-hover:translate-x-1">
                  →
                </span>
              </Link>

              <div
                className="
                  mt-3
                  grid
                  min-h-[48px]
                  grid-cols-3
                  divide-x
                  divide-[#E4DDD4]
                  rounded-[10px]
                  bg-[#F7F4EF]
                  px-1
                  py-1.5
                  sm:min-h-[52px]
                  sm:px-2
                "
              >
                <div className="flex min-w-0 items-center justify-center gap-1.5 px-1 sm:gap-2">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-[#66745F] sm:h-7 sm:w-7">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 6h11v10H3z" /><path d="M14 9h4l3 3v4h-7z" /><circle cx="7" cy="19" r="1.5" /><circle cx="18" cy="19" r="1.5" />
                    </svg>
                  </span>
                  <span className="min-w-0 text-[7.5px] leading-[1.25] text-[#817970] sm:text-[8.5px]">
                    <strong className="block font-medium text-[#454D43]">Freeship</strong>
                    toàn quốc
                  </span>
                </div>

                <div className="flex min-w-0 items-center justify-center gap-1.5 px-1 sm:gap-2">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-[#66745F] sm:h-7 sm:w-7">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 14 4 9l5-5" /><path d="M4 9h10a6 6 0 0 1 6 6v1" /><path d="M15 20h5v-5" />
                    </svg>
                  </span>
                  <span className="min-w-0 text-[7.5px] leading-[1.25] text-[#817970] sm:text-[8.5px]">
                    <strong className="block font-medium text-[#454D43]">Đổi trả</strong>
                    15 ngày
                  </span>
                </div>

                <div className="flex min-w-0 items-center justify-center gap-1.5 px-1 sm:gap-2">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-[#66745F] sm:h-7 sm:w-7">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-7" /><path d="M2 7h20v5H2z" /><path d="M12 7v14" /><path d="M12 7H8.5a2.5 2.5 0 1 1 0-5C11 2 12 7 12 7Z" /><path d="M12 7h3.5a2.5 2.5 0 1 0 0-5C13 2 12 7 12 7Z" />
                    </svg>
                  </span>
                  <span className="min-w-0 text-[7.5px] leading-[1.25] text-[#817970] sm:text-[8.5px]">
                    <strong className="block font-medium text-[#454D43]">Voucher 50K</strong>
                    cho đơn hàng
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* ===================================================== */}
          {/* RIGHT IMAGE */}
          {/* ===================================================== */}

          <div
            className="
              order-1
              relative

              min-h-[420px]

              overflow-hidden

              sm:min-h-[520px]

              lg:order-2
              lg:min-h-[680px]
            "
          >

            <img
              src="/images/collection-showcase-2.jpg"
              alt="Olive Living Collection"
              className="
                absolute
                inset-0

                h-full
                w-full

                object-cover
                object-center

                transition-transform
                duration-700
              "
            />

            {/* IMAGE OVERLAY */}

            <div
              className="
                pointer-events-none
                absolute
                inset-0

                bg-gradient-to-l
                from-black/[0.03]
                via-transparent
                to-black/[0.04]
              "
            />

          </div>

        </div>

      </div>
    </section>
    </>
  );
}



