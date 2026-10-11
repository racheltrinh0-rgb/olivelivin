import { createFileRoute } from "@tanstack/react-router";

import { useQuery } from "@tanstack/react-query";

import { useMemo, useState } from "react";



import { supabase } from "@/integrations/supabase/client";

import { ProductCard } from "@/components/product-card";



import {

  ArrowDown,

  ArrowUp,

  Copy,

  Check,

  Ticket,

} from "lucide-react";



import { z } from "zod";



const search = z.object({

  category: z.string().optional(),

  q: z.string().optional(),

  sort: z.enum(["newest", "best"]).optional(),

  max: z.coerce.number().optional(),

});



export const Route = createFileRoute("/shop")({

  validateSearch: search,



  head: () => ({

    meta: [

      {

        title: "Cửa hàng — NHÀ",

      },

      {

        name: "description",

        content:

          "Toàn bộ sản phẩm nội thất: sofa, bàn, ghế, giường, tủ kệ.",

      },

    ],

  }),



  component: ShopPage,

});



function ShopPage() {

  const sp = Route.useSearch();



  const [copiedVoucher, setCopiedVoucher] =

    useState<string | null>(null);



  const [showAllVouchers, setShowAllVouchers] =

    useState(false);



  /* =================================================

     PRODUCTS

  ================================================== */



  const productsQ = useQuery({

    queryKey: [

      "shop-products",

      sp.category,

      sp.q,

      sp.sort,

      sp.max,

    ],



    staleTime: 1000 * 60 * 10,



    gcTime: 1000 * 60 * 30,



    refetchOnWindowFocus: false,



    queryFn: async () => {

      let q = supabase

        .from("products")

        .select(`

          id,

          slug,

          name,

          price,

          compare_at_price,

          stock,

          category_id,

          best_seller,

          created_at,

          image_url,

          express_available

        `);



      if (sp.sort === "best") {

        q = q

          .order("best_seller", {

            ascending: false,

          })

          .order("created_at", {

            ascending: false,

          });

      } else {

        q = q.order("created_at", {

          ascending: false,

        });

      }



      const { data, error } = await q.range(0, 39);

      if (error) {
        console.error("SHOP PRODUCTS ERROR:", error);
        throw error;
      }

      const items = data ?? [];
      if (items.length === 0) return [];

      const productIds = items.map((item: any) => item.id);
      const { data: saleRows, error: saleError } = await supabase
        .from("flash_sale_products")
        .select(`
          product_id,
          created_at,
          flash_sales (
            id,
            title,
            discount_percent,
            active,
            start_at,
            end_at
          )
        `)
        .in("product_id", productIds)
        .order("created_at", { ascending: false });

      if (saleError) {
        console.error("SHOP FLASH SALE ERROR:", saleError);
      }

      const now = Date.now();
      const saleByProduct = new Map<string, any>();

      for (const row of saleRows ?? []) {
        const sale = Array.isArray(row.flash_sales)
          ? row.flash_sales[0]
          : row.flash_sales;

        if (!sale || sale.active !== true) continue;

        const startAt = sale.start_at ? new Date(sale.start_at).getTime() : null;
        const endAt = sale.end_at ? new Date(sale.end_at).getTime() : null;

        if (startAt !== null && (!Number.isFinite(startAt) || now < startAt)) continue;
        if (endAt !== null && (!Number.isFinite(endAt) || now >= endAt)) continue;

        const discount = Number(sale.discount_percent) || 0;
        if (discount <= 0 || discount >= 100) continue;

        if (!saleByProduct.has(row.product_id)) {
          saleByProduct.set(row.product_id, sale);
        }
      }

      return items.map((item: any) => {
        const flashSale = saleByProduct.get(item.id) ?? null;
        const basePrice = Number(item.price) || 0;
        const discount = flashSale ? Number(flashSale.discount_percent) || 0 : 0;

        return {
          ...item,
          image_url: item.image_url,
          express_available: item.express_available === true,
          flash_sale_active: Boolean(flashSale),
          flash_sale_discount: flashSale ? discount : 0,
          flash_sale_title: flashSale?.title ?? null,
          flash_sale_end_at: flashSale?.end_at ?? null,
          flash_sale_price: flashSale
            ? Math.round(basePrice * (1 - discount / 100))
            : null,
        };
      });

    },

  });



  /* =================================================

     CATEGORIES

  ================================================== */



  const categoriesQ = useQuery({

    queryKey: ["shop-categories"],



    queryFn: async () =>

      (

        await supabase

          .from("categories")

          .select("id,slug,name")

          .order("name")

      ).data ?? [],

  });



  /* =================================================

     HOME VOUCHERS

  ================================================== */



  const vouchersQ = useQuery({

    queryKey: ["shop-home-vouchers"],



    staleTime: 1000 * 60 * 5,



    gcTime: 1000 * 60 * 15,



    refetchOnWindowFocus: false,



    queryFn: async () => {

      const { data, error } = await supabase

        .from("vouchers")

        .select("*")

        .eq("active", true)

        .eq("show_home", true)

        .order("created_at", {

          ascending: false,

        });



      if (error) {

        console.error(

          "SHOP HOME VOUCHER ERROR:",

          error

        );



        return [];

      }



      const now = new Date();



      return (data ?? []).filter((voucher: any) => {

        /* Chưa bắt đầu */



        if (

          voucher.start_at &&

          now < new Date(voucher.start_at)

        ) {

          return false;

        }



        /* Đã hết hạn */



        if (

          voucher.end_at &&

          now > new Date(voucher.end_at)

        ) {

          return false;

        }



        /* Hết lượt */



        if (

          voucher.quantity !== null &&

          voucher.quantity !== undefined

        ) {

          const quantity = Number(

            voucher.quantity

          );



          const used = Number(

            voucher.used ?? 0

          );



          if (used >= quantity) {

            return false;

          }

        }



        /* Không cho nhập mã thủ công */



        if (voucher.manual_apply === false) {

          return false;

        }



        return true;

      });

    },

  });



  /* =================================================

     COPY VOUCHER

  ================================================== */



  const copyVoucher = async (code: string) => {

    try {

      await navigator.clipboard.writeText(code);



      setCopiedVoucher(code);



      setTimeout(() => {

        setCopiedVoucher(null);

      }, 1800);

    } catch (error) {

      console.error(

        "COPY VOUCHER ERROR:",

        error

      );

    }

  };



  /* =================================================

     MAX PRICE

  ================================================== */



  const maxPrice = useMemo(() => {

    const m = Math.max(

      0,

      ...(productsQ.data?.map((p) =>

        Number(p.price)

      ) ?? [0])

    );



    return (

      Math.ceil(m / 1_000_000) *

        1_000_000 ||

      30_000_000

    );

  }, [productsQ.data]);



  /* =================================================

     CATEGORY ALIAS

  ================================================== */



  const CATEGORY_ALIASES: Record<string, string> = {

    "do-decor": "noi-that-decor",

  };



  const normalizedCategory = sp.category

    ? CATEGORY_ALIASES[sp.category] ??

      sp.category

    : undefined;



  /* =================================================

     ACTIVE CATEGORY

  ================================================== */



  const activeCatId = categoriesQ.data?.find(

    (c) => c.slug === normalizedCategory

  )?.id;



  const priceCap = sp.max ?? maxPrice;



  /* =================================================

     FILTER PRODUCTS

  ================================================== */



  const filtered = useMemo(() => {

    const list = productsQ.data ?? [];



    if (sp.category && !activeCatId) {

      return [];

    }



    return list.filter((p) => {

      if (

        activeCatId &&

        p.category_id !== activeCatId

      ) {

        return false;

      }



      if (

        sp.q &&

        !p.name

          .toLowerCase()

          .includes(sp.q.toLowerCase())

      ) {

        return false;

      }



      if (Number(p.price) > priceCap) {

        return false;

      }



      return true;

    });

  }, [

    productsQ.data,

    activeCatId,

    sp.q,

    priceCap,

    sp.category,

  ]);



  /* =================================================

     SCROLL

  ================================================== */



  const scrollToTop = () => {

    window.scrollTo({

      top: 0,

      behavior: "smooth",

    });

  };



  const scrollToBottom = () => {

    window.scrollTo({

      top: document.documentElement.scrollHeight,

      behavior: "smooth",

    });

  };



  /* =================================================

     RENDER

  ================================================== */



  return (

    <div className="container-x py-12">



      {/* =================================================

          BANNER

      ================================================== */}



      <section className="mb-8 w-full">

        <div

          className="

            relative

            aspect-[1.8/1]

            w-full

            overflow-hidden

            rounded-[10px]

            bg-[#F7F5F2]

            sm:aspect-[2.4/1]

            lg:aspect-[2.8/1]

          "

        >

          <img

            src="/images/banner03.png"

            alt="Olive Living — Bộ sưu tập đèn decor"

            loading="eager"

            fetchPriority="high"

            className="

              absolute

              inset-0

              h-full

              w-full

              object-cover

            "

          />



          {/* LEFT CONTENT */}



          <div

            className="

              absolute

              inset-y-0

              left-0

              flex

              w-[55%]

              items-center

              bg-gradient-to-r

              from-[#F7F1E8]/95

              via-[#F7F1E8]/80

              to-transparent

              px-5

              sm:w-[50%]

              sm:px-8

              md:px-10

              lg:w-[46%]

              lg:px-12

            "

          >

            <div

              className="

                max-w-[300px]

                sm:max-w-[360px]

              "

            >

              <p

                className="

                  mb-1.5

                  text-[7px]

                  font-medium

                  uppercase

                  tracking-[0.28em]

                  text-[#5C5954]

                  sm:text-[8px]

                  md:text-[9px]

                "

                style={{

                  fontFamily:

                    '"Times New Roman", Times, serif',

                }}

              >

                OLIVE LIVING

              </p>



              <h1

                className="

                  text-[22px]

                  leading-[1.05]

                  tracking-[-0.02em]

                  text-[#1E1E1E]

                  sm:text-[28px]

                  md:text-[34px]

                  lg:text-[40px]

                "

                style={{

                  fontFamily:

                    '"Times New Roman", Times, serif',

                }}

              >

                Bộ sưu tập

                <br />

                đèn decor

              </h1>



              <p

                className="

                  mt-2

                  max-w-[220px]

                  text-[9px]

                  leading-[1.5]

                  text-[#55514C]

                  sm:mt-3

                  sm:max-w-[270px]

                  sm:text-[10px]

                  md:text-[12px]

                "

                style={{

                  fontFamily:

                    "Arial, Helvetica, sans-serif",

                }}

              >

                Ánh sáng tinh tế cho không gian

                sống hiện đại và ấm áp.

              </p>





            </div>

          </div>

        </div>

      </section>



      {/* =================================================

          HOME VOUCHERS

      ================================================== */}



      {vouchersQ.data &&

        vouchersQ.data.length > 0 && (

          <section className="relative isolate mb-8 w-full overflow-hidden rounded-[16px] border border-[#F2D7C7] bg-gradient-to-br from-[#FFF8F1] via-white to-[#FFF0E7] shadow-[0_8px_28px_rgba(124,72,39,0.10)]">
            <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 z-20 h-[4px] bg-gradient-to-r from-[#FF4D00] via-[#FF7A35] to-[#E83D2A]" />
            <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-10 z-0 h-36 w-36 rounded-full bg-[#FF6A00]/[0.09] blur-2xl" />
            <div aria-hidden="true" className="pointer-events-none absolute -left-12 bottom-0 z-0 h-32 w-32 rounded-full bg-[#E8B98D]/[0.16] blur-2xl" />

            {/* DECORATIVE VOUCHER PATTERN — trải đều toàn bộ section */}
            <svg
              aria-hidden="true"
              viewBox="0 0 720 420"
              preserveAspectRatio="none"
              className="pointer-events-none absolute inset-0 z-0 h-full w-full opacity-[0.26]"
              fill="none"
              stroke="#F4A66F"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M-25 90 C65 15 125 145 220 70 S365 35 425 100 S590 150 745 55" strokeDasharray="2 9" />
              <path d="M-15 260 C70 190 130 320 225 245 S370 205 450 270 S615 320 745 230" strokeDasharray="2 9" />
              <path d="M-10 385 C70 325 140 415 230 355 S380 330 470 385 S625 410 740 350" strokeDasharray="2 9" />
              <g transform="translate(55 35) rotate(-22 65 35)">
                <path d="M12 4 H112 Q124 4 124 16 V25 Q109 35 124 45 V54 Q124 66 112 66 H12 Q0 66 0 54 V45 Q15 35 0 25 V16 Q0 4 12 4Z" />
                <text x="62" y="47" fill="#F4A66F" stroke="none" fontSize="30" textAnchor="middle">%</text>
              </g>
              <g transform="translate(520 30) rotate(17 60 35)">
                <path d="M12 4 H108 Q120 4 120 16 V25 Q105 35 120 45 V54 Q120 66 108 66 H12 Q0 66 0 54 V45 Q15 35 0 25 V16 Q0 4 12 4Z" />
                <text x="60" y="47" fill="#F4A66F" stroke="none" fontSize="30" textAnchor="middle">%</text>
              </g>
              <g transform="translate(300 145) rotate(-12 38 22)">
                <path d="M8 2 H68 Q76 2 76 10 V17 Q66 22 76 28 V35 Q76 43 68 43 H8 Q0 43 0 35 V28 Q10 22 0 17 V10 Q0 2 8 2Z" />
                <path d="M38 5 V40" strokeDasharray="3 5" />
              </g>
              <g transform="translate(30 300) rotate(14 55 30)">
                <path d="M10 0 H100 Q110 0 110 10 V20 Q98 30 110 40 V50 Q110 60 100 60 H10 Q0 60 0 50 V40 Q12 30 0 20 V10 Q0 0 10 0Z" />
                <text x="55" y="39" fill="#F4A66F" stroke="none" fontSize="26" textAnchor="middle">%</text>
              </g>
              <g transform="translate(560 290) rotate(-18 55 30)">
                <path d="M10 0 H100 Q110 0 110 10 V20 Q98 30 110 40 V50 Q110 60 100 60 H10 Q0 60 0 50 V40 Q12 30 0 20 V10 Q0 0 10 0Z" />
                <text x="55" y="39" fill="#F4A66F" stroke="none" fontSize="26" textAnchor="middle">%</text>
              </g>
              <path d="M210 160 l4 11 11 4-11 4-4 11-4-11-11-4 11-4Z" />
              <path d="M475 175 l4 10 10 4-10 4-4 10-4-10-10-4 10-4Z" />
              <path d="M280 330 l3 8 8 3-8 3-3 8-3-8-8-3 8-3Z" />
              <path d="M675 180 l3 8 8 3-8 3-3 8-3-8-8-3 8-3Z" />
              <circle cx="260" cy="35" r="5" />
              <circle cx="430" cy="145" r="4" />
              <circle cx="170" cy="220" r="4" />
              <circle cx="500" cy="235" r="5" />
              <circle cx="390" cy="375" r="4" />
              <circle cx="690" cy="335" r="4" />
            </svg>

            <div className="relative z-10 px-3 pb-3 pt-4 sm:px-4 sm:pb-4 sm:pt-5">



            {/* TITLE */}



            <div className="mb-3 flex items-end justify-between">

              <div>

                <p className="inline-flex items-center gap-1.5 rounded-full bg-[#FF4D00]/[0.09] px-2 py-1 text-[8px] font-bold uppercase tracking-[0.18em] text-[#D9430B]">
                  <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-[#FF4D00] shadow-[0_0_0_3px_rgba(255,77,0,0.12)]" />
                  ƯU ĐÃI HÔM NAY
                </p>



                <h2

                  className="

                    mt-1

                    text-[19px]

                    font-normal

                    leading-tight

                    tracking-[-0.02em]

                    text-[#252525]

                    sm:text-[22px]

                  "

                  style={{

                    fontFamily:

                      '"Times New Roman", Times, serif',

                  }}

                >

                  Voucher dành cho bạn

                </h2>

              </div>



              <span

                className="

                  rounded-full

                  bg-white/90

                  px-2.5

                  py-1

                  text-[9px]

                  font-semibold

                  text-[#9A4A2A]

                  shadow-sm

                "

              >

                {vouchersQ.data.length} ưu đãi

              </span>

            </div>



            {/* =================================================

                VOUCHER GRID

            ================================================== */}



            <div

              className="

                grid

                grid-cols-2

                gap-2.5

                sm:grid-cols-2

                lg:grid-cols-3

              "

            >

              {(

                showAllVouchers

                  ? vouchersQ.data

                  : vouchersQ.data.slice(0, 2)

              ).map((voucher: any) => {



                const code = String(

                  voucher.code ?? ""

                );



                const type = String(

                  voucher.type ?? ""

                ).toLowerCase();



                const value = Number(

                  voucher.value ?? 0

                );



                const minOrder = Number(

                  voucher.min_order ?? 0

                );



                const maxDiscount =

                  voucher.max_discount !== null &&

                  voucher.max_discount !== undefined

                    ? Number(

                        voucher.max_discount

                      )

                    : null;



                const isShipping =

                  type === "shipping";



                let discountText = "";



                if (isShipping) {

                  discountText =

                    "MIỄN PHÍ SHIP";

                } else if (

                  type === "percent"

                ) {

                  discountText =

                    `${value}% OFF`;

                } else {

                  discountText =

                    `GIẢM ${value.toLocaleString(

                      "vi-VN"

                    )}đ`;

                }



                return (

                  <div

                    key={voucher.id}

                    className="

                      group

                      relative

                      min-w-0

                      overflow-hidden

                      rounded-[11px]

                      border

                      border-[#EBD9CB]

                      bg-white/95

                      p-2.5

                      shadow-[0_3px_12px_rgba(90,55,30,0.045)]

                      transition-all

                      duration-200

                      hover:-translate-y-0.5

                      hover:border-[#F5B18F]

                      hover:shadow-[0_7px_18px_rgba(255,77,0,0.09)]

                      sm:p-3

                    "

                  >

                    {/* DECORATION */}



                    <div

                      className="

                        pointer-events-none

                        absolute

                        -right-6

                        -top-6

                        h-14

                        w-14

                        rounded-full

                        bg-white/70

                      "

                    />



                    <div

                      className="

                        relative

                        flex

                        min-w-0

                        flex-col

                      "

                    >



                      {/* TOP */}



                      <div

                        className="

                          flex

                          min-w-0

                          items-center

                          gap-2

                        "

                      >



                        {/* ICON */}



                        <div

                          className="

                            flex

                            h-8

                            w-8

                            shrink-0

                            items-center

                            justify-center

                            rounded-[9px]

                            bg-[#FFF2E8]

                            text-[#D95A21]

                            ring-1 ring-[#F6D9C7]

                            sm:h-9

                            sm:w-9

                          "

                        >

                          <Ticket

                            size={14}

                            strokeWidth={1.5}

                          />

                        </div>



                        {/* CONTENT */}



                        <div className="min-w-0 flex-1">

                          <p

                            className="

                              truncate

                              text-[12px]

                              font-semibold

                              leading-4

                              tracking-tight

                              text-[#C94313]

                              sm:text-[13px]

                            "

                          >

                            {discountText}

                          </p>



                          <p

                            className="

                              mt-0.5

                              truncate

                              text-[8px]

                              leading-3

                              text-neutral-500

                              sm:text-[9px]

                            "

                          >

                            {voucher.description ||

                              (minOrder > 0

                                ? `Đơn từ ${minOrder.toLocaleString(

                                    "vi-VN"

                                  )}đ`

                                : "Áp dụng đơn hàng")}

                          </p>

                        </div>

                      </div>



                      {/* INFO */}



                      <div

                        className="

                          mt-1.5

                          min-h-[12px]

                          truncate

                          text-[7px]

                          leading-3

                          text-neutral-400

                        "

                      >

                        {type === "percent" &&

                        maxDiscount !== null

                          ? `Tối đa ${maxDiscount.toLocaleString(

                              "vi-VN"

                            )}đ`

                          : minOrder > 0

                            ? `Đơn từ ${minOrder.toLocaleString(

                                "vi-VN"

                              )}đ`

                            : "Áp dụng toàn shop"}

                      </div>



                      {/* COPY BUTTON */}



                      <button

                        type="button"

                        onClick={() =>

                          copyVoucher(code)

                        }

                        className="

                          mt-1.5

                          flex

                          h-6

                          w-full

                          items-center

                          justify-center

                          gap-1

                          rounded-full

                          border

                          border-[#E8C6B2]

                          bg-[#FFF9F5]

                          px-2

                          text-[7px]

                          font-bold

                          uppercase

                          tracking-[0.06em]

                          text-[#4A4742]

                          transition

                          hover:bg-[#F5F1EA]

                          sm:h-7

                          sm:text-[8px]

                        "

                      >

                        {copiedVoucher ===

                        code ? (

                          <>

                            <Check size={9} />

                            Đã sao chép

                          </>

                        ) : (

                          <>

                            <Copy size={9} />

                            {code}

                          </>

                        )}

                      </button>

                    </div>

                  </div>

                );

              })}

            </div>



            {/* =================================================

                EXPAND / COLLAPSE

            ================================================== */}



            {vouchersQ.data.length > 2 && (

              <button

                type="button"

                onClick={() =>

                  setShowAllVouchers(

                    (prev) => !prev

                  )

                }

                className="

                  mx-auto

                  mt-4

                  flex

                  items-center

                  gap-1.5

                  rounded-full

                  border

                  border-[#E8C6B2]

                  bg-white/95

                  px-4

                  py-2

                  text-[8px]

                  font-medium

                  uppercase

                  tracking-[0.12em]

                  text-[#B74417]

                  shadow-[0_3px_12px_rgba(124,72,39,0.08)]

                  backdrop-blur-sm

                  transition-all

                  duration-300

                  hover:bg-[#F7F3ED]

                "

              >

                {showAllVouchers ? (

                  <>

                    Thu gọn

                    <ArrowUp size={11} />

                  </>

                ) : (

                  <>

                    Xem thêm voucher

                    <ArrowDown size={11} />

                  </>

                )}

              </button>

            )}

                      </div>
          </section>

        )}



      {/* =================================================

          PRODUCTS

      ================================================== */}



      <div className="w-full">

        <div>



          {/* LOADING */}



          {productsQ.isLoading ? (

            <div

              className="

                grid

                grid-cols-2

                gap-4

                md:grid-cols-3

                lg:grid-cols-4

                xl:grid-cols-4

                2xl:grid-cols-4

              "

            >

              {Array.from({

                length: 6,

              }).map((_, i) => (

                <div

                  key={i}

                  className="

                    aspect-[4/5]

                    animate-pulse

                    rounded-md

                    bg-muted

                  "

                />

              ))}

            </div>



          ) : filtered.length === 0 ? (



            /* EMPTY */



            <div

              className="

                rounded-lg

                border

                border-dashed

                border-border

                p-16

                text-center

                text-muted-foreground

              "

            >

              Không tìm thấy sản phẩm phù hợp.

            </div>



          ) : (

            <>

              {/* =================================================

                  PRODUCT GRID

              ================================================== */}



              <div

                className="

                  grid

                  grid-cols-2

                  gap-x-3

                  gap-y-5

                  sm:gap-x-4

                  md:grid-cols-3

                  lg:grid-cols-4

                  xl:grid-cols-4

                  2xl:grid-cols-4

                "

              >

                {filtered.map((p: any) => {
                  const isFlashSale =
                    p.flash_sale_active === true &&
                    Number(p.flash_sale_discount) > 0;
                  const cardPrice = isFlashSale
                    ? Number(p.flash_sale_price)
                    : Number(p.price);

                  return (
                    <div key={p.id} className="group relative h-full min-w-0 [&>a]:h-full [&>div]:border-0 [&>div]:shadow-none">
                      <ProductCard
                        product={{
                          ...p,
                          price: cardPrice,
                          old_price: isFlashSale
                            ? Number(p.price)
                            : p.compare_at_price,
                          express_available: p.express_available === true,
                          flash_sale_active: isFlashSale,
                          flash_sale_discount: isFlashSale
                            ? Number(p.flash_sale_discount)
                            : 0,
                          flash_sale_end_at: isFlashSale
                            ? p.flash_sale_end_at
                            : null,
                        }}
                      />

                    </div>
                  );
                })}

              </div>



              {/* =================================================

                  LIFESTYLE VIDEO

              ================================================== */}



              <section className="mt-10 w-full">

                <div

                  className="

                    relative

                    w-full

                    overflow-hidden

                    rounded-[10px]

                    bg-[#F7F5F2]

                  "

                >

                  <video

                    src="/videos/0825%20(9).mp4"

                    autoPlay

                    muted

                    loop

                    playsInline

                    preload="metadata"

                    className="

                      block

                      h-auto

                      max-h-[720px]

                      w-full

                      object-cover

                    "

                  />

                </div>

              </section>

            </>

          )}

        </div>

      </div>



      {/* =================================================

          FLOATING SCROLL BUTTONS

      ================================================== */}



      <div

        className="

          fixed

          right-3

          top-1/2

          z-[100]

          flex

          -translate-y-1/2

          flex-col

          gap-1.5

        "

      >



        {/* UP */}



        <button

          type="button"

          onClick={scrollToTop}

          aria-label="Lên đầu trang"

          className="

            group

            relative

            flex

            h-8

            w-8

            items-center

            justify-center

            overflow-hidden

            rounded-full

            border

            border-white/45

            bg-white/25

            text-black/50

            shadow-[0_3px_14px_rgba(0,0,0,0.06)]

            backdrop-blur-xl

            backdrop-saturate-125

            transition-all

            duration-300

            hover:bg-white/45

            hover:text-black/65

            hover:shadow-[0_5px_18px_rgba(0,0,0,0.09)]

          "

        >

          <span

            className="

              pointer-events-none

              absolute

              -left-8

              top-0

              h-full

              w-3

              rotate-[25deg]

              bg-white/40

              blur-sm

              transition-all

              duration-700

              group-hover:left-[120%]

            "

          />



          <span

            className="

              pointer-events-none

              absolute

              inset-[1px]

              rounded-full

              border

              border-white/35

            "

          />



          <ArrowUp

            size={12}

            strokeWidth={1.7}

            className="

              relative

              z-10

              opacity-70

              transition-transform

              duration-300

              group-hover:-translate-y-0.5

            "

          />

        </button>



        {/* DOWN */}



        <button

          type="button"

          onClick={scrollToBottom}

          aria-label="Xuống cuối trang"

          className="

            group

            relative

            flex

            h-8

            w-8

            items-center

            justify-center

            overflow-hidden

            rounded-full

            border

            border-white/45

            bg-white/25

            text-black/50

            shadow-[0_3px_14px_rgba(0,0,0,0.06)]

            backdrop-blur-xl

            backdrop-saturate-125

            transition-all

            duration-300

            hover:bg-white/45

            hover:text-black/65

            hover:shadow-[0_5px_18px_rgba(0,0,0,0.09)]

          "

        >

          <span

            className="

              pointer-events-none

              absolute

              -left-8

              top-0

              h-full

              w-3

              rotate-[25deg]

              bg-white/40

              blur-sm

              transition-all

              duration-700

              group-hover:left-[120%]

            "

          />



          <span

            className="

              pointer-events-none

              absolute

              inset-[1px]

              rounded-full

              border

              border-white/35

            "

          />



          <ArrowDown

            size={12}

            strokeWidth={1.7}

            className="

              relative

              z-10

              opacity-70

              transition-transform

              duration-300

              group-hover:translate-y-0.5

            "

          />

        </button>



      </div>

    </div>

  );

}