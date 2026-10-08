import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

import {
  FlashSaleHero,
  FlashSaleVoucher,
  FlashSaleCard,
} from "@/components/flashsale";

export const Route = createFileRoute("/flashsale")({
  component: FlashSalePage,
});

/* ============================================================
   GET FLASH SALE HIỆN TẠI / SẮP DIỄN RA
============================================================ */

async function getFlashSaleForPage() {
  const now = new Date().toISOString();

  console.log("FLASH SALE NOW:", now);

  const { data, error } = await supabase
    .from("flash_sales")
    .select("*")
    .eq("active", true)
    .gte("end_at", now)
    .order("start_at", {
      ascending: true,
    })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("FLASH SALE QUERY ERROR:", error);
    throw error;
  }

  console.log("FLASH SALE SELECTED:", data);

  return data ?? null;
}

/* ============================================================
   PAGE
============================================================ */

function FlashSalePage() {
  /* ==========================================================
     FLASH SALE
  ========================================================== */

  const flashSaleQuery = useQuery({
    queryKey: ["flash-sale-page"],

    queryFn: getFlashSaleForPage,

    staleTime: 0,

    refetchOnWindowFocus: true,

    refetchOnMount: true,
  });

  const flashSale = flashSaleQuery.data;

  /* ==========================================================
     FLASH SALE PRODUCTS
  ========================================================== */

  const productsQuery = useQuery({
    queryKey: ["flash-sale-products", flashSale?.id],

    enabled: !!flashSale?.id,

    staleTime: 0,

    refetchOnWindowFocus: true,

    queryFn: async () => {
      if (!flashSale?.id) {
        return [];
      }

      console.log(
        "LOADING FLASH SALE PRODUCTS:",
        flashSale.id
      );

      const { data, error } = await supabase
        .from("flash_sale_products")
        .select(`
          product_id,
          product:products(
            id,
            name,
            price,
            slug,
            image_url,
            stock,
            express_available
          )
        `)
        .eq("flash_sale_id", flashSale.id);

      if (error) {
        console.error(
          "FLASH SALE PRODUCTS ERROR:",
          error
        );

        throw error;
      }

      console.log(
        "FLASH SALE PRODUCTS:",
        data
      );

      return data ?? [];
    },
  });

  /* ==========================================================
     LOADING
  ========================================================== */

  if (flashSaleQuery.isLoading) {
    return (
      <div className="mx-auto w-full px-4 py-12 text-center md:py-20">
        <p className="text-sm text-neutral-500 md:text-base">
          Đang tải Flash Sale...
        </p>
      </div>
    );
  }

  /* ==========================================================
     ERROR
  ========================================================== */

  if (flashSaleQuery.isError) {
    return (
      <div className="mx-auto w-full px-4 py-12 text-center md:py-20">
        <h1 className="font-display text-2xl font-semibold text-neutral-900 md:text-3xl">
          Flash Sale
        </h1>

        <p className="mt-2 text-sm text-neutral-500 md:mt-3 md:text-base">
          Không thể tải chương trình Flash Sale.
        </p>
      </div>
    );
  }

  /* ==========================================================
     KHÔNG CÓ FLASH SALE
  ========================================================== */

  if (!flashSale) {
    return (
      <div className="mx-auto w-full px-4 py-12 text-center md:py-20">
        <h1 className="font-display text-2xl text-neutral-900 md:text-3xl">
          Flash Sale
        </h1>

        <p className="mt-2 text-sm text-neutral-500 md:mt-3 md:text-base">
          Hiện chưa có chương trình Flash Sale.
        </p>
      </div>
    );
  }

  /* ==========================================================
     PRODUCTS
  ========================================================== */

  const products = productsQuery.data ?? [];

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <>
      <style>{`
        /* =====================================================
           FLASH SALE MOBILE OPTIMIZATION
        ===================================================== */

        .flash-sale-page {
          width: 100%;
          overflow-x: hidden;
        }

        /*
         * Mobile:
         * giảm spacing tổng thể
         */
        @media (max-width: 767px) {

          .flash-sale-page {
            padding-top: 12px !important;
            padding-bottom: 32px !important;
          }

          /*
           * Hero:
           * ép typography nhỏ gọn hơn nếu component
           * sử dụng heading / paragraph / button chuẩn.
           */
          .flash-sale-page h1 {
            font-size: 2rem !important;
            line-height: 1.05 !important;
          }

          .flash-sale-page h2 {
            font-size: 1.65rem !important;
            line-height: 1.1 !important;
          }

          .flash-sale-page p {
            line-height: 1.45;
          }

          /*
           * Giảm margin mặc định bên trong các section.
           */
          .flash-sale-page section {
            margin-top: 16px !important;
            margin-bottom: 16px !important;
          }

          /*
           * Button mobile compact hơn.
           */
          .flash-sale-page button {
            min-height: 42px;
          }

          /*
           * Product grid
           */
          .flash-sale-products {
            column-gap: 10px !important;
            row-gap: 14px !important;
          }

          /*
           * Product card compact
           */
          .flash-sale-products > * {
            min-width: 0;
          }
        }

        /* =====================================================
           SMALL MOBILE
        ===================================================== */

        @media (max-width: 390px) {

          .flash-sale-page {
            padding-top: 8px !important;
            padding-bottom: 24px !important;
          }

          .flash-sale-page h1 {
            font-size: 1.8rem !important;
          }

          .flash-sale-page h2 {
            font-size: 1.5rem !important;
          }

          .flash-sale-products {
            column-gap: 8px !important;
            row-gap: 12px !important;
          }
        }

        /* =====================================================
           DESKTOP
        ===================================================== */

        @media (min-width: 768px) {

          .flash-sale-page {
            padding-top: 48px;
            padding-bottom: 72px;
          }
        }
      `}</style>

      <div
        className="
          flash-sale-page
          mx-auto
          w-full
          max-w-[1440px]
          px-4
          sm:px-5
          md:px-8
          lg:px-10
        "
      >

        {/* ====================================================
            HERO
        ==================================================== */}

        <div className="w-full">
          <FlashSaleHero
            flashSale={flashSale}
          />
        </div>

        {/* ====================================================
            VOUCHER
        ==================================================== */}

        <div
          className="
            mt-4
            md:mt-8
          "
        >
          <FlashSaleVoucher />
        </div>

        {/* ====================================================
            PRODUCTS HEADER
        ==================================================== */}

        <div
          className="
            mt-7
            mb-4
            md:mt-12
            md:mb-8
          "
        >
          <div
            className="
              flex
              items-end
              justify-between
              gap-3
            "
          >
            <div>
              <h2
                className="
                  font-display
                  text-2xl
                  leading-tight
                  text-neutral-900
                  md:text-3xl
                "
              >
                Sản phẩm Flash Sale
              </h2>

              <p
                className="
                  mt-1
                  hidden
                  text-sm
                  leading-relaxed
                  text-neutral-500
                  sm:block
                  md:mt-2
                "
              >
                Giá ưu đãi chỉ áp dụng trong
                thời gian diễn ra chương trình.
              </p>
            </div>

            <a
              href="#flash-products"
              className="
                shrink-0
                text-sm
                font-medium
                text-orange-600
                transition
                hover:text-orange-700
              "
            >
              Xem tất cả →
            </a>
          </div>
        </div>

        {/* ====================================================
            AUTO VOUCHER
        ==================================================== */}

        <div
          className="
            mb-5
            md:mb-7
          "
        >
          <div
            className="
              inline-flex
              max-w-full
              items-center
              rounded-full
              bg-orange-50
              px-3
              py-2
              md:px-4
              md:py-2.5
            "
          >
            <span
              className="
                truncate
                text-xs
                font-medium
                text-orange-600
                sm:text-sm
              "
            >
              🎁 Voucher tự động áp dụng khi thanh toán
            </span>
          </div>
        </div>

        {/* ====================================================
            PRODUCT GRID
        ==================================================== */}

        <div
          id="flash-products"
          className="
            flash-sale-products
            grid
            grid-cols-2
            gap-2.5
            sm:gap-4
            md:grid-cols-3
            lg:grid-cols-4
            xl:grid-cols-5
          "
        >

          {/* ==================================================
              LOADING
          ================================================== */}

          {productsQuery.isLoading ? (
            <>
              {Array.from({ length: 6 }).map(
                (_, index) => (
                  <div
                    key={index}
                    className="
                      aspect-[0.78]
                      animate-pulse
                      rounded-2xl
                      bg-neutral-100
                      sm:rounded-3xl
                    "
                  />
                )
              )}
            </>
          ) : products.length === 0 ? (

            /* =================================================
               EMPTY
            ================================================= */

            <div
              className="
                col-span-full
                rounded-2xl
                border
                border-neutral-200
                px-4
                py-12
                text-center
                md:py-16
              "
            >
              <p className="text-sm text-neutral-500 md:text-base">
                Chưa có sản phẩm trong Flash Sale.
              </p>
            </div>

          ) : (

            /* =================================================
               PRODUCTS
            ================================================= */

            products.map(
              (item: any) => {
                const product =
                  item.product;

                if (!product) {
                  return null;
                }

                return (
                  <FlashSaleCard
                    key={
                      item.product_id
                    }
                    product={{
                      ...product,

                      discount_percent:
                        Number(
                          flashSale.discount_percent ??
                            0
                        ),
                    }}
                  />
                );
              }
            )
          )}

        </div>

      </div>
    </>
  );
}