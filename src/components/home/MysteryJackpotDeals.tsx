



import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";



import { supabase } from "@/integrations/supabase/client";



import { useNavigate } from "@tanstack/react-router";



import { useCart } from "@/lib/cart";



import { toast } from "sonner";



import { ShoppingCart, Zap } from "lucide-react";



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



function Countdown({ target, now }: { target: string; now: number }) {

  const time = getTimeLeft(target, now);

  const units = [

    { label: "Giờ", value: time.hours },

    { label: "Phút", value: time.minutes },

    { label: "Giây", value: time.seconds },

  ];



  return (

    <div className="rounded-xl bg-[#FFF7F1] p-3 sm:p-4">

      <div className="mb-3 flex items-center justify-between gap-2">

        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#B9430D] sm:text-xs">Thời gian ưu đãi</p>

        <span className="inline-flex items-center gap-1.5 rounded-md bg-[#FF4D00] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-wide text-white sm:text-[10px]">

          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" /> Limited time

        </span>

      </div>

      <div className="flex items-stretch gap-2 sm:gap-3">

        <div className="flex min-w-[62px] flex-col justify-center rounded-lg bg-[#FF4D00] px-3 py-2 text-white sm:min-w-[76px] sm:px-4">

          <p className="text-[9px] font-medium uppercase tracking-[0.1em] text-white/80">Ngày</p>

          <p className="mt-1 text-3xl font-bold leading-none tracking-tight tabular-nums sm:text-4xl">{String(time.days).padStart(2, "0")}</p>

        </div>

        <div className="grid min-w-0 flex-1 grid-cols-3 gap-1.5 sm:gap-2">

          {units.map((item) => (

            <div key={item.label} className="flex min-w-0 flex-col items-center justify-center rounded-lg bg-white/90 px-1 py-2 sm:py-3">

              <p className="text-xl font-bold leading-none text-[#30251E] tabular-nums sm:text-2xl">{String(item.value).padStart(2, "0")}</p>

              <p className="mt-1 text-[9px] font-medium text-[#89847C] sm:text-[10px]">{item.label}</p>

            </div>

          ))}

        </div>

      </div>

    </div>

  );

}



function MysteryPlaceholder() {

  return (

    <div className="relative flex aspect-square items-center justify-center overflow-hidden bg-[#F3F0EA]">

      <div className="absolute h-[62%] w-[62%] rounded-full border border-[#D8D1C7]" />

      <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-white text-5xl font-light text-[#FF4D00] shadow-sm sm:h-24 sm:w-24 sm:text-6xl">

        ?

      </div>

      <span className="absolute bottom-3 text-[9px] font-medium uppercase tracking-[0.18em] text-[#89847C]">Mystery item</span>

    </div>

  );

}



export default function MysteryJackpotDeals() {



  const navigate = useNavigate();



  const { add } = useCart();



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



  const handleAddToCart = (item: DealProduct, salePrice: number, isUpcoming: boolean, saleHasEnded: boolean) => {



    const remaining = Math.max(0, Number(item.quota) - Number(item.sold_count));



    if (isUpcoming) return toast.error("Chương trình chưa bắt đầu.");



    if (saleHasEnded) return toast.error("Ưu đãi đã kết thúc.");



    if (remaining <= 0) return toast.error("Sản phẩm đã hết suất ưu đãi.");



    if (!item.product.slug) return toast.error("Không tìm thấy đường dẫn sản phẩm.");



    add({



      id: item.product.id,



      slug: item.product.slug,



      name: item.product.name,



      price: salePrice,



      image: item.product.image_url,



    }, 1);



    toast.success("Đã thêm vào giỏ hàng");



  };



  const handleBuyNow = (item: DealProduct, isUpcoming: boolean, saleHasEnded: boolean) => {



    const remaining = Math.max(0, Number(item.quota) - Number(item.sold_count));



    if (isUpcoming) return toast.error("Chương trình chưa bắt đầu.");



    if (saleHasEnded) return toast.error("Ưu đãi đã kết thúc.");



    if (remaining <= 0) return toast.error("Sản phẩm đã hết suất ưu đãi.");



    if (!item.product.slug) return toast.error("Không tìm thấy đường dẫn sản phẩm.");



    navigate({ to: "/products/$slug", params: { slug: item.product.slug } });



  };



  const submitInterest = async (event: FormEvent<HTMLFormElement>) => {



    event.preventDefault();



    if (!interestTarget) return;



    const normalizedPhone = interestPhone.trim().replace(/[\s().-]/g, "");



    if (!/^(?:\+?84|0)\d{8,10}$/.test(normalizedPhone)) {



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



    <section



  id="mystery-jackpot-deals"



  className="container-x scroll-mt-4 py-5 sm:py-7"



>



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



            className="relative mb-5 sm:mb-7"



          >



            {/* Header */}



            <div className="relative grid gap-4 pb-4 sm:gap-6 sm:pb-6 lg:grid-cols-[1fr_minmax(320px,0.85fr)] lg:items-center lg:pb-7">



              <div className="min-w-0">

                <div className="flex items-start justify-between gap-3">
                  <h2 className="mt-1 min-w-0 flex-1 text-2xl font-semibold leading-tight tracking-[-0.035em] text-[#30251E] sm:text-3xl lg:text-[32px]">
                    {deal.title}
                  </h2>

                  <span className={`mt-1 inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-[10px] font-semibold sm:text-xs ${isUpcoming ? "bg-[#F3F0EA] text-[#75695E]" : "bg-[#FFF0E8] text-[#E94B08]"}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${isUpcoming ? "bg-[#A69A8F]" : "bg-[#FF4D00] animate-pulse"}`} />
                    {isUpcoming ? "Sắp mở bán" : "Đang diễn ra"}
                  </span>
                </div>

                {deal.description && (
                  <p className="mt-3 max-w-md text-xs leading-5 text-[#77736C] sm:text-sm sm:leading-6">
                    {deal.description}
                  </p>
                )}
              </div>



              {/* Đồng hồ nổi bật */}



              <div className="relative min-w-0">



                <Countdown



                  target={isUpcoming ? deal.start_at : deal.end_at}



                  now={now}



                />



              </div>



            </div>



            {/* Slider một hàng */}



            <div



              ref={(element) => {



                sliderRefs.current[deal.id] = element;



              }}



              onScroll={() => updateSliderMetrics(deal.id)}



              onLoad={() => updateSliderMetrics(deal.id)}



              className="no-scrollbar relative flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain p-4 pb-5 sm:gap-4 sm:px-5 sm:pb-6"



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



                    className="w-[188px] flex-none snap-start overflow-hidden bg-transparent sm:w-[228px] lg:w-[248px]"



                  >



                    {isUpcoming ? (



                      <>



                        <MysteryPlaceholder />



                        <div className="flex min-h-[124px] flex-col bg-white p-3 sm:min-h-[138px] sm:p-4">



                          <div className="flex items-center gap-2">



                            <span className="h-1.5 w-1.5 rounded-full bg-[#FF4D00]" />



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



                            className="mt-3 flex min-h-9 w-full items-center justify-center rounded-full bg-[#FF4D00] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#E84600] active:scale-[0.98] sm:text-sm"



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



                          <div className="relative aspect-square overflow-hidden rounded-lg bg-[#F3F0EA]">



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



                            <span className="absolute left-2 top-2 rounded-full bg-white px-2 py-1 text-[10px] font-semibold text-[#FF4D00]">



                              -{discount}%



                            </span>



                          </div>



                          <div className="p-3 sm:p-3.5">



                            <h3 className="line-clamp-2 min-h-[36px] text-xs font-medium leading-5 text-[#30251E] sm:min-h-[40px] sm:text-sm">



                              {item.product.name}



                            </h3>



                            <p className="mt-2 text-sm font-semibold text-[#FF4D00] sm:text-base">



                              {formatPrice(salePrice)}



                            </p>



                            <p className="mt-1 text-[10px] text-[#A69A8F] line-through sm:text-xs">



                              {formatPrice(originalPrice)}



                            </p>



                            {originalPrice > salePrice && (



                              <p className="mt-1 text-[9px] font-semibold leading-4 text-emerald-700 sm:text-[10px]">



                                Tiết kiệm {formatPrice(originalPrice - salePrice)}



                              </p>



                            )}



                          </div>



                        </a>



                        <div className="px-3.5 pb-3.5 sm:px-4 sm:pb-4">



                          <div className="h-1 overflow-hidden rounded-full bg-[#EEECE7]">



                            <div



                              className="h-full rounded-full bg-[#FF4D00] transition-all duration-300"



                              style={{ width: `${soldPercent}%` }}



                            />



                          </div>



                          <p className="mt-2 text-[10px] leading-4 text-[#8A7B6D] sm:text-xs">



                            {remaining > 0



                              ? `Còn ${remaining}/${quota} suất`



                              : "Đã hết suất"}



                          </p>



                          <div className="mt-3 grid grid-cols-[minmax(0,1fr)_38px] items-center gap-2">



                            <button



                              type="button"



                              disabled={remaining <= 0}



                              onClick={() => handleBuyNow(item, isUpcoming, now >= new Date(deal.end_at).getTime())}



                              className="flex h-9 min-w-0 items-center justify-center gap-1.5 rounded-lg bg-[#FF4D00] px-2.5 text-[11px] font-semibold text-white transition-colors duration-150 hover:bg-[#E84600] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 sm:text-xs"



                            >



                              <Zap size={12} className="shrink-0" aria-hidden="true" />



                              <span className="truncate">Mua ngay</span>



                            </button>



                            <button



                              type="button"



                              disabled={remaining <= 0}



                              aria-label={`Thêm ${item.product.name} vào giỏ hàng`}



                              title="Thêm vào giỏ hàng"



                              onClick={() => handleAddToCart(item, salePrice, isUpcoming, now >= new Date(deal.end_at).getTime())}



                              className="flex h-9 w-[38px] items-center justify-center rounded-lg bg-[#F4F1EC] text-[#5F554D] transition-colors duration-150 hover:bg-[#FFF0E7] hover:text-[#FF4D00] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"



                            >



                              <ShoppingCart size={16} strokeWidth={1.8} aria-hidden="true" />



                            </button>



                          </div>



                        </div>



                      </>



                    )}



                  </article>



                );



              })}





              <button
                type="button"
                aria-label="Sản phẩm tiếp theo"
                disabled={!canGoForward}
                onClick={() => moveSlider(deal.id, 1)}
                className="sticky right-2 top-1/2 z-20 -mr-1 ml-[-36px] flex h-7 w-7 flex-none -translate-y-[calc(50%+10px)] items-center justify-center self-center rounded-full border border-white/80 bg-white/80 text-[#625D55] shadow-sm backdrop-blur-sm transition hover:bg-white/90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-25"
              >
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m9 18 6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

            </div>



          </div>



        );



      })}



      {interestTarget && (



        <div



          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#24211D]/45 p-4 backdrop-blur-sm"



          onMouseDown={(event) => {



            if (event.target === event.currentTarget && !interestSubmitting) setInterestTarget(null);



          }}



        >



          <div



            role="dialog"



            aria-modal="true"



            aria-labelledby="mystery-interest-title"



            className="relative w-full max-w-md rounded-2xl border border-[#EAE7E1] bg-white p-5 shadow-[0_16px_48px_rgba(30,25,20,0.14)] sm:p-7"



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
