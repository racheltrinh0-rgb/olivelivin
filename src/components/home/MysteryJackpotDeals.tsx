

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";

import { supabase } from "@/integrations/supabase/client";



type MysteryDeal = {

  id: string;

  title: string;

  description: string | null;

  start_at: string;

  end_at: string;

  active: boolean;

};



type DealProductRow = {

  id: string;

  mystery_deal_id: string;

  product_id: string;

  discount_percent: number;

  quota: number;

  sold_count: number;

};



type Product = {

  id: string;

  slug: string;

  name: string;

  price: number;

  image_url: string | null;

  stock: number | null;

};



type DealProduct = DealProductRow & {

  product: Product;

};



type DealWithProducts = MysteryDeal & {

  products: DealProduct[];

};



const formatPrice = (price: number) =>

  new Intl.NumberFormat("vi-VN", {

    style: "currency",

    currency: "VND",

    maximumFractionDigits: 0,

  }).format(price);



function getTimeLeft(target: string, now: number) {

  const distance = Math.max(0, new Date(target).getTime() - now);



  return {

    days: Math.floor(distance / 86400000),

    hours: Math.floor((distance % 86400000) / 3600000),

    minutes: Math.floor((distance % 3600000) / 60000),

    seconds: Math.floor((distance % 60000) / 1000),

  };

}





function Countdown({

  target,

  now,

}: {

  target: string;

  now: number;

}) {

  const time = getTimeLeft(target, now);



  const units = [

    { label: "Giờ", value: time.hours },

    { label: "Phút", value: time.minutes },

    { label: "Giây", value: time.seconds },

  ];



  return (

    <div className="relative overflow-hidden rounded-2xl border border-[#F1D5BE] bg-gradient-to-br from-[#FFF9F2] via-[#FFF1E5] to-[#FBE3D0] p-3 shadow-[0_8px_24px_rgba(255,77,0,0.09)] sm:p-4">

      {/* Họa tiết nền */}

      <div className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full border border-[#FF4D00]/10" />

      <div className="pointer-events-none absolute -right-3 -top-5 h-16 w-16 rounded-full border border-[#FF4D00]/15" />



      <div className="relative flex items-center gap-2 sm:gap-3">

        {/* Ngày */}

        <div className="flex min-w-0 flex-1 items-center gap-2 border-r border-[#E8C9B1] pr-2 sm:gap-3 sm:pr-3">

          <div className="min-w-0">

            <div className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#D9571B] sm:text-[10px]">

              Còn lại

            </div>



            <div className="mt-0.5 text-4xl font-black leading-none tracking-tight text-[#FF4D00] tabular-nums sm:text-5xl">

              {String(time.days).padStart(2, "0")}

            </div>



            <div className="mt-1 text-[10px] font-semibold text-[#8D6B56] sm:text-xs">

              NGÀY

            </div>

          </div>



          <div className="hidden h-10 w-1 rounded-full bg-gradient-to-b from-[#FF6A00] to-[#FFB17F] sm:block" />

        </div>



        {/* Giờ, phút, giây */}

        <div className="grid flex-[1.4] grid-cols-3 gap-1.5 sm:gap-2">

          {units.map((item) => (

            <div key={item.label} className="min-w-0 text-center">

              <div className="rounded-lg border border-[#F0D7C3] bg-white/80 px-1 py-2 shadow-[0_2px_6px_rgba(122,65,32,0.05)] sm:rounded-xl sm:py-3">

                <div className="text-xl font-extrabold leading-none text-[#493126] tabular-nums sm:text-2xl">

                  {String(item.value).padStart(2, "0")}

                </div>

              </div>



              <div className="mt-1 text-[8px] font-semibold text-[#967763] sm:text-[10px]">

                {item.label}

              </div>

            </div>

          ))}

        </div>

      </div>



      {/* Thanh tiến trình trang trí */}

      <div className="absolute bottom-0 left-0 h-[3px] w-full bg-[#F3DCCB]">

        <div className="h-full w-1/3 rounded-r-full bg-gradient-to-r from-[#FF4D00] to-[#FF9A68]" />

      </div>

    </div>

  );

}





function MysteryPlaceholder() {

  return (

    <div className="relative flex aspect-square items-center justify-center overflow-hidden bg-gradient-to-br from-[#FFF8F0] via-[#F5E5D5] to-[#EBC6A8]">

      <div

        className="pointer-events-none absolute inset-0 opacity-[0.16]"

        style={{

          backgroundImage:

            "radial-gradient(circle at 1px 1px, #A96B45 1px, transparent 0)",

          backgroundSize: "18px 18px",

        }}

      />



      <div className="absolute h-[88%] w-[88%] rounded-full border border-[#B8754D]/20" />

      <div className="absolute h-[72%] w-[72%] rounded-full border border-[#B8754D]/25" />

      <div className="absolute left-5 top-5 h-4 w-4 rotate-45 border border-[#FF4D00]/40" />

      <div className="absolute right-5 top-5 h-3 w-3 rotate-45 bg-[#FF4D00]/25" />

      <div className="absolute bottom-10 left-6 h-2 w-2 rounded-full bg-[#FF4D00]/40" />

      <div className="absolute bottom-12 right-7 h-4 w-4 rotate-45 border border-[#FF4D00]/30" />



      <div className="absolute h-[65%] w-[65%] rounded-full bg-[#FF4D00]/10 blur-2xl" />



      <div className="mystery-question-orb relative flex h-[56%] w-[56%] items-center justify-center rounded-full border border-white/80 bg-white/45 shadow-[0_12px_40px_rgba(122,65,32,0.14)] backdrop-blur-sm">

        <div className="flex h-[78%] w-[78%] items-center justify-center rounded-full bg-gradient-to-br from-[#FF6A00] to-[#D93E00] shadow-[0_8px_28px_rgba(255,77,0,0.35)]">

          <span className="mystery-question-mark select-none text-6xl font-semibold leading-none text-white sm:text-7xl">

            ?

          </span>

        </div>

      </div>



      <span className="absolute bottom-3 text-[9px] font-semibold tracking-[0.2em] text-[#8D4A2B] sm:text-[10px]">

        MYSTERY ITEM

      </span>

    </div>

  );

}



export default function MysteryJackpotDeals() {

  const [deals, setDeals] = useState<DealWithProducts[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [now, setNow] = useState(Date.now());
  const [interestTarget, setInterestTarget] = useState<{ dealId: string; itemId: string } | null>(null);
  const [interestName, setInterestName] = useState("");
  const [interestPhone, setInterestPhone] = useState("");
  const [interestSubmitting, setInterestSubmitting] = useState(false);
  const [interestError, setInterestError] = useState("");
  const [interestSuccess, setInterestSuccess] = useState(false);

  const [positions, setPositions] = useState<Record<string, number>>({});

  const [sliderWidths, setSliderWidths] = useState<

    Record<string, { client: number; total: number }>

  >({});



  const sliderRefs = useRef<Record<string, HTMLDivElement | null>>({});



  const submitInterest = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!interestTarget) return;

    const normalizedPhone = interestPhone.trim().replace(/[\s().-]/g, "");
    if (!/^(\+?84|0)\d{8,10}$/.test(normalizedPhone)) {
      setInterestError("Vui lòng nhập số điện thoại Việt Nam hợp lệ.");
      return;
    }

    setInterestSubmitting(true);
    setInterestError("");
    try {
      const { error: insertError } = await supabase
        .from("mystery_deal_interests")
        .insert({
          customer_name: interestName.trim(),
          phone: normalizedPhone,
          mystery_deal_id: interestTarget.dealId,
          mystery_deal_product_id: interestTarget.itemId,
        });
      if (insertError) throw insertError;
      setInterestSuccess(true);
    } catch (err) {
      console.error("Failed to save Mystery Jackpot interest:", err);
      setInterestError("Chưa gửi được thông tin. Vui lòng thử lại sau.");
    } finally {
      setInterestSubmitting(false);
    }
  };

  const loadDeals = useCallback(async () => {

    try {

      setError("");



      const { data: dealRows, error: dealError } = await supabase

        .from("mystery_deals")

        .select("id,title,description,start_at,end_at,active")

        .eq("active", true)

        .order("start_at", { ascending: true });



      if (dealError) throw dealError;



      if (!dealRows?.length) {

        setDeals([]);

        return;

      }



      const dealIds = dealRows.map((deal) => deal.id);



      const { data: itemRows, error: itemError } = await supabase

        .from("mystery_deal_products")

        .select(

          "id,mystery_deal_id,product_id,discount_percent,quota,sold_count"

        )

        .in("mystery_deal_id", dealIds);



      if (itemError) throw itemError;



      const productIds = [

        ...new Set((itemRows ?? []).map((item) => item.product_id)),

      ];



      let productRows: Product[] = [];



      if (productIds.length > 0) {

        const { data, error: productError } = await supabase

          .from("products")

          .select("id,slug,name,price,image_url,stock")

          .in("id", productIds);



        if (productError) throw productError;



        productRows = (data ?? []) as Product[];

      }



      const productMap = new Map(

        productRows.map((product) => [product.id, product])

      );



      const result: DealWithProducts[] = dealRows.map((deal) => ({

        ...deal,

        products: (itemRows ?? []).flatMap((item) => {

          if (item.mystery_deal_id !== deal.id) return [];



          const product = productMap.get(item.product_id);

          return product ? [{ ...item, product }] : [];

        }),

      }));



      setDeals(result);

    } catch (err) {

      console.error("[Mystery Jackpot] LOAD ERROR:", err);



      setError(

        err instanceof Error

          ? err.message

          : "Không thể tải dữ liệu Mystery Jackpot."

      );



      setDeals([]);

    } finally {

      setLoading(false);

    }

  }, []);



  useEffect(() => {

    void loadDeals();



    const refreshInterval = window.setInterval(() => {

      void loadDeals();

    }, 30000);



    const clockInterval = window.setInterval(() => {

      setNow(Date.now());

    }, 1000);



    return () => {

      window.clearInterval(refreshInterval);

      window.clearInterval(clockInterval);

    };

  }, [loadDeals]);



  const visibleDeals = deals.filter((deal) => {

    const start = new Date(deal.start_at).getTime();

    const end = new Date(deal.end_at).getTime();



    return (

      deal.active &&

      Number.isFinite(start) &&

      Number.isFinite(end) &&

      now < end

    );

  });



  function updateSliderMetrics(dealId: string) {

    const element = sliderRefs.current[dealId];

    if (!element) return;



    setPositions((current) => ({

      ...current,

      [dealId]: element.scrollLeft,

    }));



    setSliderWidths((current) => ({

      ...current,

      [dealId]: {

        client: element.clientWidth,

        total: element.scrollWidth,

      },

    }));

  }



  function moveSlider(dealId: string, direction: -1 | 1) {

    const element = sliderRefs.current[dealId];

    if (!element) return;



    const card = element.querySelector<HTMLElement>("[data-mystery-card]");

    const distance = card

      ? card.offsetWidth + 16

      : element.clientWidth * 0.8;



    element.scrollBy({

      left: direction * distance * 2,

      behavior: "smooth",

    });

  }



  if (loading) {

    return (

      <section className="container-x py-8">

        <div className="rounded-2xl border border-[#E9DED1] bg-[#FBF7F1] p-6 text-sm text-[#76685C]">

          Đang tải Mystery Jackpot...

        </div>

      </section>

    );

  }



  if (error) {

    return (

      <section className="container-x py-8">

        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">

          Không tải được Mystery Jackpot: {error}

        </div>

      </section>

    );

  }



  if (visibleDeals.length === 0) return null;



  return (

    <section className="container-x py-5 sm:py-8">

      {visibleDeals.map((deal) => {

        const start = new Date(deal.start_at).getTime();

        const end = new Date(deal.end_at).getTime();

        const isUpcoming = now < start;



        const position = positions[deal.id] ?? 0;

        const metrics = sliderWidths[deal.id];

        const canGoBack = position > 5;

        const canGoForward = metrics

          ? position + metrics.client < metrics.total - 5

          : deal.products.length > 1;



        return (

          <div

            key={deal.id}

            className="relative mb-6 overflow-hidden rounded-2xl border border-[#E7D6C4] bg-[#FBF7F1] shadow-[0_8px_30px_rgba(70,45,25,0.06)] sm:mb-8 sm:rounded-3xl"

          >

            {/* Họa tiết trang trí toàn bộ layer */}

            <div

              aria-hidden="true"

              className="pointer-events-none absolute inset-0 opacity-[0.18]"

              style={{

                backgroundImage:

                  "radial-gradient(circle at 1px 1px, #B8754D 1px, transparent 0)",

                backgroundSize: "22px 22px",

                maskImage:

                  "linear-gradient(to bottom, black, transparent 75%)",

              }}

            />



            <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full border border-[#FF4D00]/10" />

            <div className="pointer-events-none absolute -right-8 -top-12 h-40 w-40 rounded-full border border-[#FF4D00]/10" />



            {/* Header */}

            <div className="relative grid gap-5 border-b border-[#E9D8C5] p-4 sm:gap-6 sm:p-6 lg:grid-cols-[1fr_minmax(320px,0.85fr)] lg:items-center lg:p-7">

              <div className="min-w-0">

                <div className="flex items-center gap-2">

                  <span className="h-2 w-2 rounded-full bg-[#FF4D00]" />

                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#FF4D00] sm:text-[10px]">

                    Olive Living · Mystery Deals

                  </p>

                </div>



                <h2 className="mt-3 font-serif text-2xl font-semibold tracking-tight text-[#30251E] sm:text-3xl lg:text-[34px]">

                  {deal.title}

                </h2>



                {deal.description && (

                  <p className="mt-2 max-w-md text-xs leading-5 text-[#78695C] sm:text-sm sm:leading-6">

                    {deal.description}

                  </p>

                )}



                <span className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-[#FF4D00]/10 bg-[#FF4D00]/10 px-3 py-1.5 text-[10px] font-semibold text-[#C3420B] sm:text-xs">

                  <span className="h-1.5 w-1.5 rounded-full bg-[#FF4D00]" />

                  {isUpcoming ? "Sắp mở bán" : "Đang diễn ra"}

                </span>

              </div>



              {/* Đồng hồ nổi bật */}

              <div className="relative min-w-0">

                <div className="mb-2 flex items-center justify-between gap-2">

                  <p className="text-xs font-semibold text-[#78695C] sm:text-sm">

                    {isUpcoming ? "Bắt đầu sau" : "Kết thúc sau"}

                  </p>



                  <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#B8754D] sm:text-[10px]">

                    Limited time

                  </span>

                </div>



                <Countdown

                  target={isUpcoming ? deal.start_at : deal.end_at}

                  now={now}

                />

              </div>

            </div>



            {/* Thanh điều hướng */}

            <div className="relative flex items-center justify-between gap-3 px-4 pt-4 sm:px-5 sm:pt-5">

              <p className="text-xs font-semibold text-[#78695C] sm:text-sm">

                {isUpcoming ? "Khám phá bí mật" : "Ưu đãi giới hạn"}

              </p>



              <div className="flex gap-2">

                <button

                  type="button"

                  aria-label="Sản phẩm trước"

                  disabled={!canGoBack}

                  onClick={() => moveSlider(deal.id, -1)}

                  className="flex h-9 w-9 items-center justify-center rounded-full border border-[#E4CDB8] bg-white text-[#FF4D00] transition hover:border-[#FF4D00] hover:bg-[#FFF0E5] disabled:cursor-not-allowed disabled:opacity-30"

                >

                  <svg

                    viewBox="0 0 24 24"

                    className="h-4 w-4"

                    fill="none"

                    stroke="currentColor"

                    strokeWidth="2"

                  >

                    <path

                      d="m15 18-6-6 6-6"

                      strokeLinecap="round"

                      strokeLinejoin="round"

                    />

                  </svg>

                </button>



                <button

                  type="button"

                  aria-label="Sản phẩm tiếp theo"

                  disabled={!canGoForward}

                  onClick={() => moveSlider(deal.id, 1)}

                  className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FF4D00] text-white shadow-sm transition hover:bg-[#E84600] disabled:cursor-not-allowed disabled:opacity-30"

                >

                  <svg

                    viewBox="0 0 24 24"

                    className="h-4 w-4"

                    fill="none"

                    stroke="currentColor"

                    strokeWidth="2"

                  >

                    <path

                      d="m9 18 6-6-6-6"

                      strokeLinecap="round"

                      strokeLinejoin="round"

                    />

                  </svg>

                </button>

              </div>

            </div>



            {/* Slider một hàng */}

            <div

              ref={(element) => {

                sliderRefs.current[deal.id] = element;

              }}

              onScroll={() => updateSliderMetrics(deal.id)}

              onLoad={() => updateSliderMetrics(deal.id)}

              className="no-scrollbar relative flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain p-4 sm:gap-4 sm:px-5 sm:pb-6"

              style={{

                scrollbarWidth: "none",

                msOverflowStyle: "none",

              }}

            >

              {deal.products.map((item) => {

                const originalPrice = Number(item.product.price) || 0;

                const discount = Number(item.discount_percent) || 0;

                const salePrice = Math.round(

                  originalPrice * (1 - discount / 100)

                );



                const quota = Math.max(0, Number(item.quota) || 0);

                const sold = Math.max(0, Number(item.sold_count) || 0);

                const remaining = Math.max(0, quota - sold);

                const soldPercent =

                  quota > 0 ? Math.min(100, (sold / quota) * 100) : 0;



                return (

                  <article

                    key={item.id}

                    data-mystery-card

                    className="w-[160px] flex-none snap-start overflow-hidden rounded-xl border border-transparent bg-transparent shadow-none backdrop-blur-none sm:w-[205px] sm:rounded-2xl lg:w-[220px]"

                  >

                    {isUpcoming ? (

                      <>

                        <MysteryPlaceholder />



                        <div className="flex min-h-[132px] flex-col bg-white/25 p-3 sm:min-h-[145px] sm:p-4">
                          <div className="flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#FF4D00] shadow-[0_0_8px_rgba(255,77,0,0.45)]" />
                            <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#9A8171] sm:text-[10px]">
                              Mystery drop
                            </span>
                          </div>

                          <h3 className="mt-2 text-[13px] font-semibold leading-snug text-[#30251E] sm:text-sm">
                            Sản phẩm bí mật
                          </h3>

                          <div className="mt-auto flex items-end justify-between gap-2 border-t border-white/70 pt-3">
                            <div className="min-w-0">
                              <p className="text-[9px] font-medium text-[#8A7B6D] sm:text-[10px]">Giá khi mở bán</p>
                              <p className="mt-0.5 text-xl font-extrabold leading-none tracking-tight text-[#FF4D00] sm:text-2xl">
                                ???
                              </p>
                            </div>
                            <span className="mb-0.5 shrink-0 rounded-md bg-[#FF4D00] px-2 py-1.5 text-[10px] font-extrabold leading-none text-white sm:text-xs">
                              -25%
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setInterestTarget({ dealId: deal.id, itemId: item.id });
                              setInterestName("");
                              setInterestPhone("");
                              setInterestError("");
                              setInterestSuccess(false);
                            }}
                            className="mt-3 flex min-h-10 w-full items-center justify-center rounded-full bg-[#FF4D00] px-3 py-2 text-xs font-bold text-white shadow-[0_4px_12px_rgba(255,77,0,0.18)] transition hover:bg-[#E84600] active:scale-[0.98] sm:text-sm"
                          >
                            Quan tâm
                          </button>
                        </div>

                      </>

                    ) : (

                      <>

                        <a

                          href={`/products/${item.product.slug}`}

                          className="block"

                        >

                          <div className="relative aspect-square overflow-hidden bg-[#F0E7DC]">

                            {item.product.image_url ? (

                              <img

                                src={item.product.image_url}

                                alt={item.product.name}

                                loading="lazy"

                                className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"

                              />

                            ) : (

                              <div className="flex h-full items-center justify-center text-xs text-[#9A897A]">

                                Chưa có hình ảnh

                              </div>

                            )}



                            <span className="absolute left-2 top-2 rounded-full bg-[#FF4D00] px-2 py-1 text-[10px] font-bold text-white">

                              -{discount}%

                            </span>

                          </div>



                          <div className="p-3">

                            <h3 className="line-clamp-2 min-h-[36px] text-xs font-medium leading-5 text-[#30251E] sm:min-h-[40px] sm:text-sm">

                              {item.product.name}

                            </h3>



                            <p className="mt-2 text-sm font-bold text-[#FF4D00] sm:text-base">

                              {formatPrice(salePrice)}

                            </p>



                            <p className="mt-1 text-[10px] text-[#A69A8F] line-through sm:text-xs">

                              {formatPrice(originalPrice)}

                            </p>

                          </div>

                        </a>



                        <div className="px-3 pb-3">

                          <div className="h-1.5 overflow-hidden rounded-full bg-[#F0EBE5]">

                            <div

                              className="h-full rounded-full bg-[#FF4D00] transition-all"

                              style={{ width: `${soldPercent}%` }}

                            />

                          </div>



                          <p className="mt-2 text-[10px] text-[#8A7B6D] sm:text-xs">

                            {remaining > 0

                              ? `Còn ${remaining}/${quota} suất`

                              : "Đã hết suất"}

                          </p>

                        </div>

                      </>

                    )}

                  </article>

                );

              })}

            </div>

          </div>

        );

      })}



      {interestTarget && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#24170F]/55 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !interestSubmitting) setInterestTarget(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="mystery-interest-title"
            className="relative w-full max-w-md rounded-3xl border border-white/70 bg-[#FFFCF8] p-5 shadow-[0_24px_80px_rgba(35,20,10,0.25)] sm:p-7"
          >
            <button
              type="button"
              aria-label="Đóng biểu mẫu"
              onClick={() => !interestSubmitting && setInterestTarget(null)}
              className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-[#F4EAE0] text-lg text-[#6D5544] transition hover:bg-[#EBD9C8]"
            >
              ×
            </button>
            {interestSuccess ? (
              <div className="py-5 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#FFF0E7] text-2xl font-bold text-[#FF4D00]">✓</div>
                <h3 className="mt-4 text-xl font-bold text-[#30251E]">Đã ghi nhận quan tâm!</h3>
                <p className="mt-2 text-sm leading-6 text-[#8A7B6D]">Olive Living sẽ liên hệ khi sản phẩm bí mật sắp mở bán.</p>
                <button type="button" onClick={() => setInterestTarget(null)} className="mt-6 min-h-11 w-full rounded-full bg-[#FF4D00] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#E84600]">Đóng</button>
              </div>
            ) : (
              <>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#FF4D00]">Mystery Jackpot Deals</p>
                <h3 id="mystery-interest-title" className="mt-2 pr-8 text-2xl font-bold tracking-tight text-[#30251E]">Đừng bỏ lỡ ưu đãi</h3>
                <p className="mt-2 text-sm leading-6 text-[#8A7B6D]">Để lại thông tin, Olive Living sẽ báo bạn khi sản phẩm bí mật mở bán với ưu đãi giảm 25%.</p>
                <form onSubmit={submitInterest} className="mt-6 space-y-4">
                  <div>
                    <label htmlFor="mystery-customer-name" className="mb-1.5 block text-xs font-semibold text-[#5F4A3A]">Họ và tên</label>
                    <input id="mystery-customer-name" autoComplete="name" required maxLength={100} value={interestName} onChange={(event) => setInterestName(event.target.value)} placeholder="Nhập tên của bạn" className="min-h-12 w-full rounded-xl border border-[#E8D8C8] bg-white px-4 text-sm text-[#30251E] outline-none transition placeholder:text-[#B3A397] focus:border-[#FF4D00] focus:ring-4 focus:ring-[#FF4D00]/10" />
                  </div>
                  <div>
                    <label htmlFor="mystery-customer-phone" className="mb-1.5 block text-xs font-semibold text-[#5F4A3A]">Số điện thoại</label>
                    <input id="mystery-customer-phone" type="tel" autoComplete="tel" inputMode="tel" required maxLength={20} value={interestPhone} onChange={(event) => setInterestPhone(event.target.value)} placeholder="Ví dụ: 0901234567" className="min-h-12 w-full rounded-xl border border-[#E8D8C8] bg-white px-4 text-sm text-[#30251E] outline-none transition placeholder:text-[#B3A397] focus:border-[#FF4D00] focus:ring-4 focus:ring-[#FF4D00]/10" />
                  </div>
                  {interestError && <p role="alert" className="text-xs leading-5 text-red-600">{interestError}</p>}
                  <button type="submit" disabled={interestSubmitting} className="flex min-h-12 w-full items-center justify-center rounded-full bg-[#FF4D00] px-4 py-3 text-sm font-bold text-white shadow-[0_6px_18px_rgba(255,77,0,0.22)] transition hover:bg-[#E84600] disabled:cursor-not-allowed disabled:opacity-60">
                    {interestSubmitting ? "Đang gửi..." : "Gửi thông tin"}
                  </button>
                  <p className="text-center text-[10px] leading-4 text-[#A39487]">Thông tin chỉ được dùng để liên hệ về chương trình này.</p>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }

        .mystery-question-orb {
          isolation: isolate;
          animation: mystery-float 2.8s ease-in-out infinite;
          will-change: transform;
        }

        .mystery-question-orb::before {
          content: "";
          position: absolute;
          inset: -9px;
          border: 1px solid rgba(255, 77, 0, 0.34);
          border-radius: 9999px;
          pointer-events: none;
          animation: mystery-ring 7s linear infinite;
        }

        .mystery-question-orb::after {
          content: "";
          position: absolute;
          inset: -4px;
          border-radius: 9999px;
          background: rgba(255, 77, 0, 0.18);
          filter: blur(12px);
          z-index: -1;
          pointer-events: none;
          animation: mystery-glow 2.4s ease-in-out infinite;
        }

        .mystery-question-mark {
          transform-origin: center;
          animation: mystery-bounce 2.8s ease-in-out infinite;
          text-shadow: 0 2px 14px rgba(255, 255, 255, 0.2);
        }

        @keyframes mystery-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }

        @keyframes mystery-bounce {
          0%, 100% { transform: scale(1) rotate(0deg); }
          42% { transform: scale(1.08) rotate(-3deg); }
          58% { transform: scale(1.04) rotate(3deg); }
        }

        @keyframes mystery-ring {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes mystery-glow {
          0%, 100% { opacity: 0.35; transform: scale(0.96); }
          50% { opacity: 0.8; transform: scale(1.06); }
        }

        @media (prefers-reduced-motion: reduce) {
          .mystery-question-orb,
          .mystery-question-orb::before,
          .mystery-question-orb::after,
          .mystery-question-mark {
            animation: none !important;
          }
        }
      `}</style>

    </section>

  );

}
