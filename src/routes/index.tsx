import { createFileRoute } from "@tanstack/react-router";
import {
  useSuspenseQuery,
  queryOptions,
} from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

import Hero from "@/components/home/Hero";
import NewArrival from "@/components/home/NewArrival";
import Collections from "@/components/home/Collections";
import Lookbook from "@/components/home/Lookbook";
import FlashSale from "@/components/home/FlashSale";
import Newsletter from "@/components/home/Newsletter";
import Vouchers from "@/components/home/Vouchers";
import BedsideCollection from "@/components/home/BedsideCollection";
import BestSeller from "@/components/home/BestSeller";
import Under399 from "@/components/home/Under399";
import FeaturedCollection from "@/components/home/FeaturedCollection";
import FeaturedCollectionShowcase from "@/components/home/FeaturedCollectionShowcase";
import FeaturedCollectionShowcaseReverse from "@/components/home/FeaturedCollectionShowcaseReverse";
import FurnitureCollectionShowcase from "@/components/home/FurnitureCollectionShowcase";
import FloorLampCollectionShowcase from "@/components/home/FloorLampCollectionShowcase";
import BeforeAfterSlider from "@/components/home/BeforeAfterSlider";
import FlashSalePopup from "@/components/home/FlashSalePopup";
import CustomerFeedbackGallery from "@/components/home/CustomerFeedbackGallery";
import BF08VoucherPopup from "@/components/BF08VoucherPopup";
import OliveTrustSection from "@/components/home/OliveTrustSection";
import ScrollToTopBottom from "@/components/home/ScrollToTopBottom";


/* =========================================================
   HOME DATA
========================================================= */

const homeData = queryOptions({
  queryKey: ["home-data"],

  staleTime: 1000 * 60 * 10,

  gcTime: 1000 * 60 * 30,

  refetchOnWindowFocus: false,

  queryFn: async () => {
    const [
      featured,
      newArrivals,
      bedside,
      bestSellers,
      under399,
      memphisProducts,
      furnitureProducts,
      floorLampProducts,
    ] = await Promise.all([

      /* =====================================================
         FEATURED
      ===================================================== */

      supabase
  .from("products")
  .select(
  "id,slug,name,price,compare_at_price,stock,image_url,color_preview,express_available"
)
  .eq("featured", true)
  .or("new_arrival.eq.false,new_arrival.is.null")
  .limit(9),


      /* =====================================================
         NEW ARRIVAL
         Chỉ lấy sản phẩm có new_arrival = true
      ===================================================== */

      supabase
        .from("products")
        .select(
          "id,slug,name,price,compare_at_price,stock,image_url,color_preview,express_available"
        )
        .eq("new_arrival", true)
        .order("created_at", { ascending: false })
        .limit(12),


      /* =====================================================
         BEDSIDE
      ===================================================== */

      supabase
        .from("products")
        .select(
          "id,slug,name,price,compare_at_price,stock,image_url,color_preview,express_available"
        )
        .eq(
          "category_id",
          "8c71807e-4a94-4304-bff7-a4d5208cd5b8"
        )
        .limit(4),


      /* =====================================================
         BEST SELLERS / MOST LOVED
      ===================================================== */

      supabase
        .from("products")
        .select(
          "id,slug,name,price,compare_at_price,stock,image_url,color_preview,express_available"
        )
        .eq("top_seller", true),


      /* =====================================================
         UNDER 399
      ===================================================== */

      supabase
        .from("products")
        .select(
          "id,slug,name,price,compare_at_price,stock,image_url,color_preview,express_available"
        )
        .lte("price", 399000)
        .order("price")
        .limit(20),


      /* =====================================================
         MEMPHIS 32 + MEMPHIS 20
      ===================================================== */

      supabase
        .from("products")
        .select(
          "id,slug,name,price,compare_at_price,stock,image_url,color_preview,express_available"
        )
        .or(
          "name.ilike.%Memphis 32%,name.ilike.%Memphis 20%"
        ),


      /* =====================================================
         FURNITURE
      ===================================================== */

      supabase
        .from("products")
        .select(
          "id,slug,name,price,compare_at_price,stock,image_url,color_preview,express_available"
        )
        .or(
          "name.ilike.%Montara%,name.ilike.%AERO%,name.ilike.%Curva%"
        ),


      /* =====================================================
         FLOOR LAMPS
      ===================================================== */

      supabase
        .from("products")
        .select(
          "id,slug,name,price,compare_at_price,stock,image_url,color_preview,express_available"
        )
        .or(
          "name.ilike.%HALF ROUND%,name.ilike.%MEMPHIS 20%,name.ilike.%BAUHAUS%,name.ilike.%FISHING%"
        )
        .limit(4),
    ]);


    /* =======================================================
       DEBUG
    ======================================================= */

    console.log(
      "FEATURED DATA",
      featured.data
    );

    console.log(
      "FEATURED ERROR",
      featured.error
    );

    console.log(
      "NEW ARRIVAL DATA",
      newArrivals.data
    );

    console.log(
      "NEW ARRIVAL ERROR",
      newArrivals.error
    );

    console.log(
      "TOP SELLER DATA",
      bestSellers.data
    );

    console.log(
      "TOP SELLER ERROR",
      bestSellers.error
    );

    console.log(
      "UNDER399 DATA:",
      under399.data
    );

    console.log(
      "UNDER399 ERROR:",
      under399.error
    );


    /* =======================================================
       MAP PRODUCTS
    ======================================================= */

    const mapProducts = (
      list: any[]
    ) =>
      (list ?? []).map((p) => ({
        ...p,
        old_price:
          p.compare_at_price,
        express_available:
          p.express_available === true,
      }));


    /* =======================================================
       RETURN HOME DATA
    ======================================================= */

    return {

      /* FEATURED */
      featured:
        mapProducts(
          featured.data
        ),


      /* NEW ARRIVAL */
      newArrivals:
        mapProducts(
          newArrivals.data
        ),


      /* BEDSIDE */
      bedside:
        mapProducts(
          bedside.data
        ),


      /* BEST SELLERS */
      bestSellers:
        mapProducts(
          bestSellers.data
        ),


      /* UNDER 399 */
      under399:
        mapProducts(
          under399.data
        ),


      /* MEMPHIS */
      memphisProducts:
        mapProducts(
          memphisProducts.data
        ),


      /* FURNITURE */
      furnitureProducts:
        mapProducts(
          furnitureProducts.data
        ),


      /* FLOOR LAMP */
      floorLampProducts:
        mapProducts(
          floorLampProducts.data
        ),


      /* =====================================================
         CATEGORIES
      ===================================================== */

      categories: [
        {
          id: "1",
          slug: "den-ban",
          name: "Đèn bàn",
          description:
            "Đèn ngủ, đèn decor",
        },

        {
          id: "2",
          slug: "den-dung",
          name: "Đèn đứng",
          description:
            "Floor lamp phòng khách",
        },

        {
          id: "3",
          slug: "den-tha",
          name: "Đèn thả",
          description:
            "Đèn thả trần hiện đại",
        },

        {
          id: "4",
          slug: "den-tuong",
          name: "Đèn tường",
          description:
            "Wall lamp trang trí",
        },

        {
          id: "5",
          slug: "den-khong-day",
          name: "Đèn không dây",
          description:
            "Cordless lamp collection",
        },
      ],
    };
  },
});


/* =========================================================
   ROUTE
========================================================= */

export const Route =
  createFileRoute("/")({

    head: () => ({
      meta: [
        {
          title:
            "OLIVE LIVING — Nội thất tinh tế cho ngôi nhà bạn",
        },

        {
          name: "description",
          content:
            "Khám phá bộ sưu tập nội thất tối giản và tinh tế.",
        },
      ],
    }),


    loader: ({ context }) => {
      context.queryClient.ensureQueryData(
        homeData
      );
    },


    component: HomePage,
  });


/* =========================================================
   HOME PAGE
========================================================= */

function HomePage() {

  const { data } =
    useSuspenseQuery(
      homeData
    );


  return (
    <div>

      {/* =====================================================
          VOUCHER POPUP
      ===================================================== */}

      {/* <WelcomeVoucherModal /> */}

      <BF08VoucherPopup />


      {/* =====================================================
          HERO
      ===================================================== */}

      <Hero />


      {/* =====================================================
          COLLECTIONS
      ===================================================== */}

      {/* <Services /> */}

      <Collections />


      {/* =====================================================
          FEATURED COLLECTION - OLD
      ===================================================== */}

      {/*
      <FeaturedCollection />
      */}


      {/* =====================================================
          VOUCHERS
      ===================================================== */}

      <Vouchers />

      <FlashSale />


      {/* =====================================================
          MOST LOVED
      ===================================================== */}

      <BestSeller
        products={
          data.bestSellers
        }
      />


      {/* =====================================================
          NEW ARRIVAL
          Lấy riêng products.new_arrival = true
      ===================================================== */}

      <NewArrival
        products={
          data.newArrivals
        }
      />


      {/* =====================================================
          FEATURED COLLECTION SHOWCASE
          Lấy products.featured = true
      ===================================================== */}

      {/*<FeaturedCollectionShowcase
        products={
          data.featured
        }
      />*/}


      {/* =====================================================
          VIDEO 01
      ===================================================== */}

      <section
        className="
          bg-[#F7F4EF]
          py-4
          sm:py-6
          lg:py-8
        "
      >

        <div
          className="
            mx-auto
            w-full
            max-w-[1380px]
            px-4
            sm:px-6
            lg:px-8
          "
        >

          <div
            className="
              relative
              w-full
              overflow-hidden
              rounded-[26px]
              border
              border-[#E7DED3]
              bg-black
              shadow-[0_20px_70px_rgba(60,45,30,0.08)]
              aspect-[16/7]
            "
          >

            <video
              src="/videos/0825 (4)(1).mp4"
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              className="
                absolute
                inset-0
                h-full
                w-full
                object-cover
              "
            />

          </div>

        </div>

      </section>


      {/* =====================================================
          MEMPHIS COLLECTION
      ===================================================== */}

      

      <FeaturedCollectionShowcaseReverse
        products={
          data.memphisProducts
        }
      />


      {/* =====================================================
          TRUST
      ===================================================== */}

      <OliveTrustSection />


      {/* =====================================================
          SCROLL CONTROL
      ===================================================== */}

      <ScrollToTopBottom />


      {/* =====================================================
          FURNITURE
      ===================================================== */}

      <FurnitureCollectionShowcase
        products={
          data.furnitureProducts
        }
      />


      {/* =====================================================
          FLOOR LAMP
      ===================================================== */}

      <BeforeAfterSlider
        beforeImage="/images/floor-lamp-before.jpg"
        afterImage="/images/floor-lamp-after.jpg"
        products={
          data.floorLampProducts
        }
      />


      {/* =====================================================
          FLASH SALE
      ===================================================== */}

      <FlashSale />


      {/* =====================================================
          FAVORITE PRODUCTS - OLD
      ===================================================== */}

      {/*
      <FavoriteProducts
        products={
          data.bestSellers.slice(
            0,
            4
          )
        }
      />
      */}


      {/* =====================================================
          UNDER 399 - OLD
      ===================================================== */}

      {/*
      <Under399
        products={
          data.under399
        }
      />
      */}


      {/* =====================================================
          LOOKBOOK - OLD
      ===================================================== */}

      {/*
      <Lookbook />
      */}


      {/* =====================================================
          BEDSIDE COLLECTION - OLD
      ===================================================== */}

      {/*
      <BedsideCollection
        products={
          data.bedside
        }
      />
      */}


      {/* =====================================================
          FLASH SALE POPUP - DISABLED
      ===================================================== */}

      {/*
      <FlashSalePopup />
      */}


      {/* =====================================================
          VIDEO 02
      ===================================================== */}

      <section
        className="
          bg-[#F7F4EF]
          py-4
          sm:py-6
          lg:py-8
        "
      >

        <div
          className="
            mx-auto
            w-full
            max-w-[1380px]
            px-4
            sm:px-6
            lg:px-8
          "
        >

          <div
            className="
              relative
              w-full
              overflow-hidden
              rounded-[26px]
              border
              border-[#E7DED3]
              bg-black
              shadow-[0_20px_70px_rgba(60,45,30,0.08)]
              aspect-[16/7]
            "
          >

            <video
              src="/videos/0825 (9).mp4"
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              className="
                absolute
                inset-0
                h-full
                w-full
                object-cover
              "
            />

          </div>

        </div>

      </section>


      {/* =====================================================
          CUSTOMER FEEDBACK
      ===================================================== */}

      <CustomerFeedbackGallery />


      {/* =====================================================
          NEWSLETTER
      ===================================================== */}

      {/*
      <Newsletter />
      */}

    </div>
  );
}