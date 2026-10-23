import { createFileRoute } from "@tanstack/react-router";

import { useQuery } from "@tanstack/react-query";

import { useMemo, useRef, useState } from "react";



import { supabase } from "@/integrations/supabase/client";

import { ProductCard } from "@/components/product-card";



import {

  ArrowDown,

  ArrowUp,
  ChevronLeft,
  ChevronRight,

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

  const voucherScrollRef = useRef<HTMLDivElement | null>(null);

  const scrollVouchers = (direction: "left" | "right") => {
    const container = voucherScrollRef.current;
    if (!container) return;

    container.scrollBy({
      left:
        direction === "left"
          ? -container.clientWidth * 0.82
          : container.clientWidth * 0.82,
      behavior: "smooth",
    });
  };



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
          HOME VOUCHERS — CLEAN RESPONSIVE DESIGN
      ================================================== */}

      {vouchersQ.data && vouchersQ.data.length > 0 && (
        <section
          className="mb-5 w-full overflow-hidden rounded-[18px] bg-[#F7F5F0] p-2.5 sm:mb-6 sm:rounded-[20px] sm:p-3.5 lg:p-4"
          style={{
            backgroundColor: "#F7F5F0",
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%25' height='100%25' viewBox='0 0 1200 420' preserveAspectRatio='none'%3E%3Cg fill='none' stroke='%238c9677' stroke-linecap='round' stroke-linejoin='round'%3E%3Cg stroke-width='1.3' stroke-dasharray='4 6' opacity='.22'%3E%3Cpath d='M45 52 H125 A12 12 0 0 0 149 52 H215 V116 H149 A12 12 0 0 0 125 116 H45 Z' transform='rotate(-8 130 84)'/%3E%3Cpath d='M970 280 H1045 A12 12 0 0 0 1069 280 H1145 V346 H1069 A12 12 0 0 0 1045 346 H970 Z' transform='rotate(7 1057 313)'/%3E%3Cpath d='M390 335 H440 A10 10 0 0 0 460 335 H510 V385 H460 A10 10 0 0 0 440 385 H390 Z' transform='rotate(-9 450 360)'/%3E%3C/g%3E%3Cg stroke-width='1.5' opacity='.26'%3E%3Cpath d='M300 64 q18 -15 36 0 q-18 15 -36 0 M318 64 q-4 12 -13 17'/%3E%3Cpath d='M780 325 q18 -15 36 0 q-18 15 -36 0 M798 325 q-4 12 -13 17' transform='rotate(15 798 325)'/%3E%3Cpath d='M600 95 q24 -18 48 0 q-24 18 -48 0 M624 95 q-5 14 -17 20' transform='rotate(-12 624 95)'/%3E%3C/g%3E%3C/g%3E%3Cg fill='%238c9677' opacity='.28'%3E%3Cpath d='M545 45 l4 10 10 4 -10 4 -4 10 -4 -10 -10 -4 10 -4z'/%3E%3Cpath d='M870 190 l3 8 8 3 -8 3 -3 8 -3 -8 -8 -3 8 -3z'/%3E%3Cpath d='M185 265 l3 8 8 3 -8 3 -3 8 -3 -8 -8 -3 8 -3z'/%3E%3C/g%3E%3Cpath d='M70 220 q45 -25 82 5 t82 0 M690 200 q42 -20 76 3 t70 0' fill='none' stroke='%238c9677' stroke-width='1.5' opacity='.18'/%3E%3C/svg%3E\")",
            backgroundSize: "100% 100%",
            backgroundPosition: "center",
          }}
        >
          <div className="mb-2.5 flex items-end justify-between gap-2 sm:mb-3">
            <div className="min-w-0">
              <p className="inline-flex items-center gap-1.5 text-[8px] font-bold uppercase tracking-[0.16em] text-[#687354] sm:text-[9px]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#687354]" />
                Ưu đãi hôm nay
              </p>
              <h2
                className="mt-1 text-[17px] leading-tight tracking-[-0.025em] text-[#292B25] sm:text-[22px]"
                style={{ fontFamily: '"Times New Roman", Times, serif' }}
              >
                Voucher dành cho bạn
              </h2>
              <p className="mt-0.5 text-[9px] text-[#858478] sm:text-[11px]">
                Chọn ưu đãi phù hợp cho đơn hàng của bạn.
              </p>
            </div>

            <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-[8px] font-semibold text-[#657052] shadow-[0_2px_8px_rgba(40,45,30,0.06)] sm:text-[9px]">
              {vouchersQ.data.length} ưu đãi
            </span>
          </div>

          <div className="relative">
            <div
              ref={voucherScrollRef}
              className=" -mx-1 flex gap-2 overflow-x-auto px-1 pb-1 snap-x snap-mandatory scroll-px-1 sm:mx-0 sm:grid sm:overflow-visible sm:px-0 sm:pb-0 sm:snap-none sm:grid-cols-2 lg:grid-cols-3"
              style={{ scrollbarWidth: "none" }}
            >
              {vouchersQ.data.map((voucher: any, index: number) => {
              const code = String(voucher.code ?? "");
              const type = String(voucher.type ?? "").toLowerCase();
              const value = Number(voucher.value ?? 0);
              const minOrder = Number(voucher.min_order ?? 0);
              const maxDiscount =
                voucher.max_discount !== null && voucher.max_discount !== undefined
                  ? Number(voucher.max_discount)
                  : null;
              const isShipping = type === "shipping";

              let discountText = "";
              if (isShipping) {
                discountText = "MIỄN PHÍ SHIP";
              } else if (type === "percent") {
                discountText = `GIẢM ${value}%`;
              } else {
                discountText = `GIẢM ${value.toLocaleString("vi-VN")}đ`;
              }

              return (
                <article
                  key={voucher.id}
                  className={
                    "group relative flex h-[100px] w-[82vw] max-w-[330px] shrink-0 snap-start overflow-hidden rounded-[12px] bg-white shadow-[0_3px_10px_rgba(45,43,34,0.05)] ring-1 ring-black/[0.02] transition-all duration-200 hover:shadow-[0_6px_16px_rgba(45,43,34,0.08)] before:pointer-events-none before:absolute before:left-0 before:top-1/2 before:z-20 before:h-4 before:w-4 before:-translate-x-1/2 before:-translate-y-1/2 before:rounded-full before:bg-[#F7F5F0] after:pointer-events-none after:absolute after:right-0 after:top-1/2 after:z-20 after:h-4 after:w-4 after:translate-x-1/2 after:-translate-y-1/2 after:rounded-full after:bg-[#F7F5F0] sm:h-auto sm:min-h-[104px] sm:w-auto sm:max-w-none sm:shrink sm:rounded-[14px] " +
                    (!showAllVouchers && index >= 3 ? "sm:hidden" : "")
                  }
                >
                  <div className="relative flex w-[66px] shrink-0 flex-col items-center justify-center border-r border-dashed border-[#DADCCF] bg-[#EAEDE2] px-1 py-1.5 text-center before:absolute before:right-[-7px] before:top-1/2 before:z-[2] before:h-3.5 before:w-3.5 before:-translate-y-1/2 before:rounded-full before:bg-white after:absolute after:right-[-7px] after:top-1/2 after:z-[3] after:h-3.5 after:w-3.5 after:-translate-y-1/2 after:rounded-full after:border after:border-[#EAEDE2] after:opacity-70 sm:w-[84px] sm:px-2 sm:py-3">
                    <div className="mb-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-white text-[#657052] shadow-sm sm:mb-1 sm:h-8 sm:w-8">
                      <Ticket size={14} strokeWidth={1.6} className="sm:hidden" />
                      <Ticket size={17} strokeWidth={1.6} className="hidden sm:block" />
                    </div>
                    <span className="text-[6px] font-semibold uppercase tracking-[0.06em] text-[#7B806D] sm:text-[7px] sm:tracking-[0.1em]">
                      Ưu đãi
                    </span>
                    <span className="mt-0.5 max-w-full whitespace-nowrap text-[11px] font-bold leading-tight tracking-[-0.04em] text-[#4D5745] sm:mt-0.5 sm:text-[16px]">
                      {isShipping ? "SHIP" : type === "percent" ? `${value}%` : `${value.toLocaleString("vi-VN")}đ`}
                    </span>
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col justify-center p-2 sm:p-3">
                    <div className="flex min-w-0 items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-[11px] font-bold leading-4 text-[#34382E] min-[390px]:text-[10px] sm:text-[12px]">
                          {discountText}
                        </p>
                        <p className="mt-0.5 line-clamp-2 text-[8px] leading-[1.35] text-[#77786E] min-[390px]:text-[7px] sm:mt-0.5 sm:text-[9px] sm:leading-[1.4]">
                          {voucher.description ||
                            (minOrder > 0
                              ? `Áp dụng cho đơn từ ${minOrder.toLocaleString("vi-VN")}đ`
                              : "Áp dụng theo điều kiện voucher")}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full bg-[#F0F3EA] px-1.5 py-0.5 text-[7px] font-semibold text-[#687354] sm:px-2 sm:py-0.5 sm:text-[7px]">
                        Có sẵn
                      </span>
                    </div>

                    <div className="mt-1 text-[7px] leading-tight text-[#99988D] min-[390px]:text-[6px] sm:mt-1 sm:text-[8px]">
                      {type === "percent" && maxDiscount !== null
                        ? `Giảm tối đa ${maxDiscount.toLocaleString("vi-VN")}đ`
                        : minOrder > 0
                          ? `Đơn tối thiểu ${minOrder.toLocaleString("vi-VN")}đ`
                          : "Áp dụng toàn shop"}
                    </div>

                    <button
                      type="button"
                      onClick={() => copyVoucher(code)}
                      aria-label={`Sao chép mã ${code}`}
                      className="mt-1.5 flex min-h-6 w-full items-center justify-between gap-2 rounded-md border border-dashed border-[#C9CEBC] bg-[#F8F9F5] px-2 py-1 text-[8px] font-bold tracking-[0.02em] text-[#4D5745] transition hover:border-[#8D9878] hover:bg-[#EFF2E8] min-[390px]:text-[7px] sm:mt-2 sm:min-h-7 sm:gap-2 sm:rounded-lg sm:px-2.5 sm:py-1 sm:text-[9px] sm:tracking-[0.04em]"
                    >
                      <span className="min-w-0 truncate">{code}</span>
                      <span className="inline-flex shrink-0 items-center gap-1">
                        {copiedVoucher === code ? (
                          <>
                            <Check size={10} className="sm:hidden" />
                            <Check size={11} className="hidden sm:block" />
                            <span className="hidden sm:inline">Đã sao chép</span>
                          </>
                        ) : (
                          <>
                            <Copy size={10} className="sm:hidden" />
                            <Copy size={11} className="hidden sm:block" />
                            <span className="hidden sm:inline">Sao chép</span>
                          </>
                        )}
                      </span>
                    </button>
                  </div>
                </article>
                );
              })}
            </div>

            {vouchersQ.data.length > 1 && (
              <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 sm:hidden">
                {/* Subtle edge fade with one compact, translucent next button */}
                <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-[#F7F7F1]/45 via-[#F7F7F1]/15 to-transparent" />
                <div className="absolute inset-y-0 right-0 flex items-center justify-end pr-1">
                  <button
                    type="button"
                    onClick={() => scrollVouchers("right")}
                    aria-label="Lướt voucher tiếp theo"
                    className="group/mirror pointer-events-auto relative flex h-5 w-5 items-center justify-center overflow-hidden rounded-full border border-white/35 bg-white/20 text-[#5F6B4F]/55 shadow-[inset_0_1px_1px_rgba(255,255,255,0.35)] backdrop-blur-sm transition-all duration-200 hover:bg-white/35 hover:text-[#5F6B4F]/80 active:scale-95"
                  >
                    <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-full bg-[linear-gradient(145deg,rgba(255,255,255,0.48)_0%,rgba(255,255,255,0.10)_45%,rgba(255,255,255,0)_70%)]" />
                    <span aria-hidden="true" className="pointer-events-none absolute -left-1/2 top-0 h-full w-1/2 -skew-x-[25deg] bg-gradient-to-r from-transparent via-white/55 to-transparent opacity-0 transition-all duration-500 group-hover/mirror:left-full group-hover/mirror:opacity-70" />
                    <ChevronRight className="relative z-10" size={10} strokeWidth={1.7} />
                  </button>
                </div>
              </div>
            )}
          </div>


          {vouchersQ.data.length > 2 && (
            <div className="mt-3 hidden justify-center sm:flex">
              <button
                type="button"
                onClick={() => setShowAllVouchers((prev: boolean) => !prev)}
                className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[#5F6B4F] shadow-[0_3px_12px_rgba(45,55,35,0.08)] transition hover:bg-[#EEF1E7]"
              >
                {showAllVouchers ? "THU GỌN VOUCHER" : "XEM THÊM VOUCHER"}
                {showAllVouchers ? <ArrowUp size={13} /> : <ArrowDown size={13} />}
              </button>
            </div>
          )}
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