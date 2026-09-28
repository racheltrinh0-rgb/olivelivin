import { ShoppingCart, Truck, RotateCcw, Gift } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  products: any[];
}

const getFeaturedDisplayName = (product: any) => {
  const text = `${product.name || ""} ${product.slug || ""}`.toLowerCase();

  if (text.includes("cordless")) {
    return "ĐÈN BÀN CORDLESS";
  }

  if (text.includes("montara") || text.includes("panton wire")) {
    return "KỆ MONTARA PANTON WIRE";
  }

  return product.name;
};

const formatFeaturedPrice = (price: number) => {
  return `${new Intl.NumberFormat("vi-VN").format(price)}₫`;
};

export default function FeaturedCollectionShowcase({
  products,
}: Props) {

const [pantonProduct, setPantonProduct] = useState<any | null>(null);
const [cordlessProduct, setCordlessProduct] = useState<any | null>(null);

useEffect(() => {
  async function loadCollectionProducts() {
    const [panton, cordless] = await Promise.all([
      supabase
        .from("products")
        .select(
          "id,slug,name,price,compare_at_price,stock,image_url,color_preview"
        )
        .ilike("name", "%Panton%")
        .limit(1)
        .maybeSingle(),

      supabase
        .from("products")
        .select(
          "id,slug,name,price,compare_at_price,stock,image_url,color_preview"
        )
        .ilike("name", "%Cordless%")
        .limit(1)
        .maybeSingle(),
    ]);

    if (panton.error) {
      console.error("PANTON PRODUCT ERROR:", panton.error);
    }

    if (cordless.error) {
      console.error("CORDLESS PRODUCT ERROR:", cordless.error);
    }

    setPantonProduct(panton.data);
    setCordlessProduct(cordless.data);
  }

  loadCollectionProducts();
}, []);

const collectionProducts = [
  cordlessProduct,
  pantonProduct,
].filter(Boolean);

function getProductSocialProof(product: any) {
  const seed = String(product.id || product.slug || "")
    .split("")
    .reduce((sum, char) => sum + char.charCodeAt(0), 0);

  const rating = (4.7 + (seed % 4) * 0.1).toFixed(1);

  const reviews = 12 + (seed % 76);

  const sold = 35 + ((seed * 7) % 210);

  return {
    rating,
    reviews,
    sold,
  };
}

  return (
    <>
      <style>{`
              `}</style>

      <section className="bg-[#F7F4EF] py-10 sm:py-14 lg:py-20">
      <div className="mx-auto w-full max-w-[1380px] px-4 sm:px-6 lg:px-8">

        {/* MAIN COLLECTION */}
        <div
          className="
            overflow-hidden
            rounded-[26px]
            border
            border-[#E7DED3]
            bg-white
            shadow-[0_20px_70px_rgba(60,45,30,0.06)]

            lg:grid
            lg:grid-cols-[1.02fr_0.98fr]

            xl:rounded-[34px]
          "
        >

          {/* ================================================= */}
          {/* LEFT IMAGE */}
          {/* ================================================= */}

          <div
            className="
              relative
              min-h-[420px]
              overflow-hidden

              sm:min-h-[520px]

              lg:min-h-[680px]
            "
          >
            <img
              src="/images/collection-showcase.jpg"
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

            {/* subtle overlay */}
            <div
              className="
                pointer-events-none
                absolute
                inset-0
                bg-gradient-to-r
                from-black/[0.03]
                via-transparent
                to-black/[0.04]
              "
            />
          </div>


          {/* ================================================= */}
          {/* RIGHT CONTENT */}
          {/* ================================================= */}

          <div
            className="
              flex
              flex-col
              justify-center

              px-5
              py-7

              sm:px-8
              sm:py-10

              lg:px-10
              lg:py-12

              xl:px-14
              xl:py-14
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
              FEATURED COLLECTION
            </p>


            {/* TITLE */}

            <h2
              className="
                mt-4
                max-w-[540px]

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
              Đẹp Từ Những 
              <br />
              Điều Đơn Giản
            </h2>


            {/* DESCRIPTION */}

            <p
              className="
                mt-5
                max-w-[560px]

                text-[13px]
                leading-6
                text-neutral-500

                sm:text-sm
                sm:leading-7
              "
            >
              Thiết kế tinh giản cho một không gian sống đầy cảm hứng.
            </p>


            {/* ================================================= */}
{/* COLLECTION PRODUCTS */}
{/* ================================================= */}

<div
  className="
    mt-5
    grid
    grid-cols-2
    gap-2.5

    sm:mt-8
    sm:gap-4

    lg:mt-7
    lg:gap-4

    xl:gap-5
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
        border-[#E5DDD3]
        bg-white
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
            alt={getFeaturedDisplayName(product)}
            className="
              h-full
              w-full
              object-cover
              transition-transform
              duration-500
              hover:scale-[1.03]
            "
          />
        </div>
      </Link>


     {/* PRODUCT CONTENT */}

<div
  className="
    flex
    min-h-[108px]
    flex-col
    p-2.5
    sm:min-h-[118px]
    sm:p-3
  "
>

  {/* NAME */}

  <Link
    to="/products/$slug"
    params={{
      slug: product.slug,
    }}
    className="
      block
      line-clamp-2
      min-h-[28px]
      overflow-hidden
      text-[10px]
      font-medium
      leading-[1.3]
      tracking-[-0.01em]
      text-[#292725]

      sm:min-h-[31px]
      sm:text-[11.5px]
    "
  >
    {getFeaturedDisplayName(product)}
  </Link>


  {/* RATING + REVIEWS + SOLD */}
  {(() => {
    const socialProof = getProductSocialProof(product);

    return (
      <div className="mt-0.5 flex flex-col gap-0 text-[7.5px] leading-3 text-[#817970] sm:text-[8.5px]">
        <div className="flex min-w-0 items-center gap-x-1 whitespace-nowrap overflow-hidden text-[#817970]">
          <span className="font-medium text-[#B8875B]">
            ★ {socialProof.rating}
          </span>
          <span>{socialProof.reviews} đánh giá</span>
        </div>

        <div className="text-[#9A9188]">
          Đã bán {socialProof.sold}
        </div>
      </div>
    );
  })()}

  {/* PRICE */}

  <div className="mt-0.5 min-h-[27px] flex flex-col justify-center">

    {product.compare_at_price &&
     product.compare_at_price > product.price && (
      <span
        className="
          text-[7.5px]
          leading-3
          text-neutral-400
          line-through
          sm:text-[8.5px]
        "
      >
        {formatFeaturedPrice(product.compare_at_price)}
      </span>
    )}

    <span
      className="
        text-[12.5px]
        font-semibold
        leading-4
        text-[#4F8063]
        sm:text-[13.5px]
      "
    >
      {formatFeaturedPrice(product.price)}
    </span>

  </div>


  {/* ACTION */}

  <div
    className="
      mt-auto
      flex
      items-center
      gap-1
      pt-1
    "
  >

    {/* MUA NGAY */}

    <Link
      to="/products/$slug"
      params={{
        slug: product.slug,
      }}
      className="
        flex
        h-7
        min-w-0
        flex-1
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
        hover:bg-[#CDE8D9]

        sm:text-[10px]
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
      aria-label={`Xem ${getFeaturedDisplayName(product)}`}
      className="
        flex
        h-7
        w-7
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
        hover:bg-[#DDF1E6]
      "
    >
      <ShoppingCart size={12} strokeWidth={1.6} />
    </Link>

  </div>

</div>

    </div>
  ))}
</div>

            {/* ================================================= */}
            {/* REFERENCE CTA + TRUST STRIP */}
            {/* ================================================= */}

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
                  sm:text-[10px]
                "
              >
                <span>Xem trọn bộ nội thất</span>
                <span
                  className="
                    text-[12px]
                    transition-transform
                    duration-200
                    group-hover:translate-x-1
                  "
                >
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
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-[#66745F] shadow-[0_1px_4px_rgba(40,35,30,0.035)] sm:h-7 sm:w-7">
                    <Truck size={12} strokeWidth={1.5} />
                  </span>
                  <span className="min-w-0 text-[7.5px] leading-[1.25] text-[#817970] sm:text-[8.5px]">
                    <strong className="block font-medium text-[#454D43]">
                      Freeship
                    </strong>
                    toàn quốc
                  </span>
                </div>

                <div className="flex min-w-0 items-center justify-center gap-1.5 px-1 sm:gap-2">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-[#66745F] shadow-[0_1px_4px_rgba(40,35,30,0.035)] sm:h-7 sm:w-7">
                    <RotateCcw size={12} strokeWidth={1.5} />
                  </span>
                  <span className="min-w-0 text-[7.5px] leading-[1.25] text-[#817970] sm:text-[8.5px]">
                    <strong className="block font-medium text-[#454D43]">
                      Đổi trả
                    </strong>
                    15 ngày
                  </span>
                </div>

                <div className="flex min-w-0 items-center justify-center gap-1.5 px-1 sm:gap-2">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-[#66745F] shadow-[0_1px_4px_rgba(40,35,30,0.035)] sm:h-7 sm:w-7">
                    <Gift size={12} strokeWidth={1.5} />
                  </span>
                  <span className="min-w-0 text-[7.5px] leading-[1.25] text-[#817970] sm:text-[8.5px]">
                    <strong className="block font-medium text-[#454D43]">
                      Voucher 50K
                    </strong>
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


