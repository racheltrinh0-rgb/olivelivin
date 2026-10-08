import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

import {
  FlashSaleHero,
  FlashSaleTrust,
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

  console.log(
    "FLASH SALE NOW:",
    now
  );

  const {
    data,
    error,
  } = await supabase
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
    console.error(
      "FLASH SALE QUERY ERROR:",
      error
    );

    throw error;
  }

  console.log(
    "FLASH SALE SELECTED:",
    data
  );

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
    queryKey: [
      "flash-sale-page",
    ],

    queryFn:
      getFlashSaleForPage,

    staleTime: 0,

    refetchOnWindowFocus: true,

    refetchOnMount: true,
  });

  const flashSale =
    flashSaleQuery.data;

  /* ==========================================================
     FLASH SALE PRODUCTS
  ========================================================== */

  const productsQuery =
    useQuery({
      queryKey: [
        "flash-sale-products",
        flashSale?.id,
      ],

      enabled:
        !!flashSale?.id,

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

        const {
          data,
          error,
        } = await supabase
          .from(
            "flash_sale_products"
          )
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
          .eq(
            "flash_sale_id",
            flashSale.id
          );

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

  if (
    flashSaleQuery.isLoading
  ) {
    return (
      <div
        className="
          container
          mx-auto
          py-20
          text-center
        "
      >
        <p className="text-neutral-500">
          Đang tải Flash Sale...
        </p>
      </div>
    );
  }

  /* ==========================================================
     ERROR
  ========================================================== */

  if (
    flashSaleQuery.isError
  ) {
    return (
      <div
        className="
          container
          mx-auto
          py-20
          text-center
        "
      >
        <h1 className="text-2xl font-semibold">
          Flash Sale
        </h1>

        <p className="mt-3 text-neutral-500">
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
      <div
        className="
          container
          mx-auto
          py-20
          text-center
        "
      >
        <h1
          className="
            font-display
            text-3xl
            text-neutral-900
          "
        >
          Flash Sale
        </h1>

        <p
          className="
            mt-3
            text-neutral-500
          "
        >
          Hiện chưa có chương trình Flash Sale.
        </p>
      </div>
    );
  }

  /* ==========================================================
     PRODUCTS
  ========================================================== */

  const products =
    productsQuery.data ?? [];

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <div
      className="
        container
        mx-auto
        py-20
      "
    >

      {/* ======================================================
          HERO
      ====================================================== */}

      <FlashSaleHero
        flashSale={flashSale}
      />

      {/* ======================================================
          TRUST
      ====================================================== */}


      {/* ======================================================
          VOUCHER
      ====================================================== */}

      <FlashSaleVoucher />

      {/* ======================================================
          PRODUCTS HEADER
      ====================================================== */}

      <div className="my-12" />

      <div className="mb-10">
        <h2
          className="
            font-display
            text-3xl
            text-neutral-900
          "
        >
          Sản phẩm Flash Sale
        </h2>

        <p
          className="
            mt-2
            text-neutral-500
          "
        >
          Giá ưu đãi chỉ áp dụng trong
          thời gian diễn ra chương trình.
        </p>
      </div>

      {/* ======================================================
          AUTO VOUCHER
      ====================================================== */}

      <div
        className="
          mb-6
          flex
          flex-col
          gap-3
          md:flex-row
          md:items-center
          md:justify-between
        "
      >
        <div
          className="
            rounded-full
            bg-orange-50
            px-4
            py-2
          "
        >
          <span
            className="
              text-sm
              font-medium
              text-orange-600
            "
          >
            🎁 Voucher áp dụng tự động khi thanh toán
          </span>
        </div>
      </div>

      {/* ======================================================
          PRODUCT GRID
      ====================================================== */}

      <div
        id="flash-products"
        className="
          grid
          grid-cols-2
          gap-4
          md:grid-cols-3
          lg:grid-cols-4
          xl:grid-cols-5
        "
      >

        {productsQuery.isLoading ? (
          <>
            {Array.from({
              length: 5,
            }).map((_, index) => (
              <div
                key={index}
                className="
                  aspect-[3/5]
                  animate-pulse
                  rounded-3xl
                  bg-neutral-100
                "
              />
            ))}
          </>
        ) : products.length === 0 ? (
          <div
            className="
              col-span-full
              rounded-2xl
              border
              border-neutral-200
              py-16
              text-center
            "
          >
            <p
              className="
                text-neutral-500
              "
            >
              Chưa có sản phẩm trong Flash Sale.
            </p>
          </div>
        ) : (
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
  );
}