import { ShoppingCart, Truck, RotateCcw, Gift } from "lucide-react";

import { Link } from "@tanstack/react-router";

import { useEffect, useState } from "react";

import { supabase } from "@/integrations/supabase/client";

interface Props {

  products: any[];

}

const getFeaturedDisplayName = (product: any) => {

  const text = `${product.name || ""} ${product.slug || ""}`.toLowerCase();

  if (text.includes("cozy")) {

    return "GHẾ XOAY COZY";

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

const [cozyProduct, setCozyProduct] = useState<any | null>(null);

useEffect(() => {

  async function loadCollectionProducts() {

    const [panton, cozy] = await Promise.all([

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

        .ilike("name", "%Cozy%")

        .limit(1)

        .maybeSingle(),

    ]);

    if (panton.error) {

      console.error("PANTON PRODUCT ERROR:", panton.error);

    }

    if (cozy.error) {

      console.error("COZY PRODUCT ERROR:", cozy.error);

    }

    setPantonProduct(panton.data);

    setCozyProduct(cozy.data);

  }

  loadCollectionProducts();

}, []);

const collectionProducts = [

  cozyProduct,

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

      <section className="bg-white py-3 sm:py-4 lg:py-6">

      <div className="mx-auto w-full max-w-[1080px] px-3 sm:px-5 lg:px-6">

        {/* MAIN COLLECTION */}

        <div

          className="

            overflow-hidden

            rounded-[14px]

            bg-white

            lg:grid

            lg:grid-cols-[0.9fr_1.1fr] lg:items-stretch

            xl:rounded-[20px]

          "

        >

          {/* ================================================= */}

          {/* LEFT IMAGE */}

          {/* ================================================= */}

          <div

            className="

              relative

              w-full

              overflow-hidden

              rounded-[14px]

              bg-white

              lg:aspect-auto lg:min-h-[0] lg:h-full lg:min-h-[390px] xl:min-h-[410px]

            "

          >

            <img

              src="/images/arm chair.png"

              alt="Olive Living Collection"

              className="

                relative

                block

                h-auto

                w-full

                object-contain

                object-center

                transition-transform

                duration-700

                lg:absolute

                lg:inset-0

                lg:h-full

                lg:object-cover

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

              px-4

              py-5

              sm:px-5

              sm:py-5

              lg:px-6

              lg:py-6

              xl:px-7

              xl:py-7

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

                mt-2

                max-w-[540px]

                font-display

                text-[25px]

                leading-[1.08]

                tracking-[-0.025em]

                text-[#292725]

                sm:text-[30px]

                lg:text-[34px]

                xl:text-[36px]

              "

            >

              Đẹp Từ Những&#x20;

              <br />

              Điều Đơn Giản

            </h2>

            {/* DESCRIPTION */}

            <p

              className="

                mt-2

                max-w-[520px]

                text-[11px]

                leading-[1.7]

                text-neutral-500

                sm:text-[12px]

                sm:leading-5

              "

            >

              Thiết kế tinh giản cho một không gian sống đầy cảm hứng.

            </p>

            {/* ================================================= */}

{/* COLLECTION PRODUCTS */}

{/* ================================================= */}

<div

  className="

    mt-3

    grid

    grid-cols-2

    items-start

    gap-x-3

    gap-y-4

    sm:mt-4

    sm:gap-4

    lg:mt-4

    lg:gap-3

    xl:gap-4

  "

>

  {collectionProducts.map((product) => (

    <div

      key={product.id}

      className="

        min-w-0

        overflow-hidden

        rounded-none

        border-0

        bg-transparent

        shadow-none

        ring-0

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

            aspect-[0.92/1]

            w-full

            overflow-hidden

            rounded-[5px]

            bg-[#F7F5F1]

            sm:aspect-[0.94/1]

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

              hover:scale-[1.025]

            "

          />

        </div>

      </Link>

     {/* PRODUCT CONTENT */}

<div

  className="

    flex

    min-h-[120px]

    flex-col

    bg-transparent

    px-0

    pt-2

    pb-0

    sm:min-h-[126px]

    sm:pt-2

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

      min-h-[26px]

      overflow-hidden

      text-[10px]

      font-semibold

      leading-[1.4]

      tracking-[-0.01em]

      text-[#292725]

      sm:min-h-[28px]

      sm:text-[11.5px]

    "

  >

    {getFeaturedDisplayName(product)}

  </Link>

  {/* RATING + REVIEWS + SOLD */}

  {(() => {

    const socialProof = getProductSocialProof(product);

    return (

      <div className="mt-1 flex min-w-0 flex-wrap items-center gap-x-1 gap-y-0.5 text-[8px] leading-[1.45] text-[#817970] sm:text-[10px] sm:leading-4">

        <span className="shrink-0 font-medium text-[#B8875B]">

          ★ {socialProof.rating}

        </span>

        <span className="text-[#C9C1B8]">·</span>

        <span className="truncate">

          {socialProof.reviews} đánh giá

        </span>

        <span className="text-[#C9C1B8]">·</span>

        <span className="shrink-0">

          Đã bán {socialProof.sold}

        </span>

      </div>

    );

  })()}

  {/* PRICE */}

  <div className="mt-1 flex min-h-[26px] flex-col justify-start">

    {product.compare_at_price &&

     product.compare_at_price > product.price && (

      <span

        className="

          text-[9px]

          leading-3.5

          text-neutral-400

          line-through

          sm:text-[10px]

        "

      >

        {formatFeaturedPrice(product.compare_at_price)}

      </span>

    )}

    <span

      className="

        text-[13px]

        font-semibold

        leading-5

        tracking-[-0.02em]

        text-[#3F674B]

        sm:text-[15px]

      "

    >

      {formatFeaturedPrice(product.price)}

    </span>

  </div>

  {/* ACTION */}

  <div

    className="

      mt-2

      flex

      items-center

      gap-1.5

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

        rounded-full

        bg-[#DDEBE0]

        px-2

        text-[10px]

        font-medium

        text-[#355940]

        transition-colors

        duration-200

        hover:bg-[#C9DFCF]

        sm:h-7

        sm:text-[11px]

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

        rounded-full

        border-0

        bg-[#F2F6F2]

        text-[#355940]

        transition-colors

        duration-200

        hover:bg-[#DDEBE0]

        sm:h-7

        sm:w-7

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

            {/* COMPACT CTA + TRUST STRIP */}

            {/* ================================================= */}

            <div

              className="

                mt-3

                border-t

                border-[#EEEAE4]

                pt-3

                sm:mt-4

                sm:pt-3

              "

            >

<Link

  to="/shop"

  className="

    group

    flex

    h-10

    w-full

    items-center

    justify-center

    gap-2

    rounded-full

    bg-[#4F8063]

    px-4

    text-[11px]

    font-semibold

    tracking-[-0.01em]

    text-white

    transition-colors

    duration-200

    hover:bg-[#3F6B51]

    active:scale-[0.99]

  "

>

  <span>Xem trọn bộ nội thất</span>

  <span

    className="

      text-[13px]

      leading-none

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

                  min-h-[40px]

                  grid-cols-3

                  divide-x

                  divide-[#EAE5DE]

                  bg-transparent

                  px-0

                  py-1

                  sm:min-h-[42px]

                  sm:px-1

                "

              >

                <div className="flex min-w-0 flex-col items-center justify-center gap-1 px-1 text-center sm:flex-row sm:gap-2 sm:text-left">

                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#F7F5F1] text-[#66745F] sm:h-7 sm:w-7">

                    <Truck size={12} strokeWidth={1.5} />

                  </span>

                  <span className="min-w-0 text-[8px] leading-[1.3] text-[#817970] sm:text-[9px] sm:leading-[1.4]">

                    <strong className="block font-medium text-[#454D43]">

                      Freeship

                    </strong>

                    toàn quốc

                  </span>

                </div>

                <div className="flex min-w-0 flex-col items-center justify-center gap-1 px-1 text-center sm:flex-row sm:gap-2 sm:text-left">

                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#F7F5F1] text-[#66745F] sm:h-7 sm:w-7">

                    <RotateCcw size={12} strokeWidth={1.5} />

                  </span>

                  <span className="min-w-0 text-[8px] leading-[1.3] text-[#817970] sm:text-[9px] sm:leading-[1.4]">

                    <strong className="block font-medium text-[#454D43]">

                      Đổi trả

                    </strong>

                    15 ngày

                  </span>

                </div>

                <div className="flex min-w-0 flex-col items-center justify-center gap-1 px-1 text-center sm:flex-row sm:gap-2 sm:text-left">

                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#F7F5F1] text-[#66745F] sm:h-7 sm:w-7">

                    <Gift size={12} strokeWidth={1.5} />

                  </span>

                  <span className="min-w-0 text-[8px] leading-[1.3] text-[#817970] sm:text-[9px] sm:leading-[1.4]">

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

