import { Check, ArrowUpRight, ShieldCheck } from "lucide-react";

export default function OliveTrustSection() {
  const stats = [
    {
      number: "1.000+",
      label: "Đơn hàng đã được đặt",
    },
    {
      number: "5.0",
      label: "Đánh giá trung bình",
      star: true,
    },
    {
      number: "98%",
      label: "Khách hàng hài lòng",
    },
  ];

  const benefits = [
    "Ưu đãi thành viên",
    "Đóng gói cẩn thận",
    "Sản phẩm chọn lọc",
    "Hỗ trợ tận tâm",
  ];

  return (
    <section className="bg-white px-3 py-5 sm:px-5 sm:py-8 lg:py-10">
      <div
        className="
          mx-auto
          w-full
          max-w-[1280px]
          overflow-hidden
          rounded-[18px]
          border
          border-[#E4DDD3]
          bg-[#FCFBF8]
          shadow-[0_8px_26px_rgba(55,45,35,0.04)]
          sm:rounded-[24px]
        "
      >
        {/* =====================================================
            MOBILE — COMPACT / SINGLE CARD
            Inspired by the supplied reference:
            eyebrow → heading → short description → CTA →
            divider → community stat → compact trust points.
           ===================================================== */}
        <div className="block px-4 py-5 sm:px-7 sm:py-7 lg:hidden">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#58604D]" />
            <p className="text-[8px] font-medium uppercase tracking-[0.2em] text-[#686158]">
              Olive Living Community
            </p>
          </div>

          <h2
            className="
              mt-3
              max-w-[300px]
              font-display
              text-[25px]
              font-normal
              leading-[1.04]
              tracking-[-0.035em]
              text-[#29241F]
            "
          >
            Được khách hàng lựa chọn
          </h2>

          <p className="mt-2 max-w-[310px] text-[11px] leading-[1.45] text-[#81786E]">
            Cảm ơn bạn đã đồng hành cùng Olive Living.
            Những con số nhỏ tạo nên niềm tin lớn.
          </p>

      

          <div className="my-4 border-t border-[#E6E0D8]" />

          <div className="flex items-end justify-between gap-3">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] uppercase tracking-[0.18em] text-[#8C8379]">
                  Our community
                </span>
              </div>

              <div className="mt-1 flex items-center gap-1.5">
                <span className="text-[34px] font-medium leading-none tracking-[-0.05em] text-[#151515]">
                  1.000+
                </span>
              </div>

              <p className="mt-1 text-[10px] text-[#81786E]">
                Đơn hàng đã được đặt
              </p>
            </div>

            <div className="flex items-center gap-1.5 pb-0.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#F1EEE8]">
                <ShieldCheck
                  size={12}
                  strokeWidth={1.6}
                  className="text-[#68705D]"
                />
              </span>
              <span className="text-[9px] text-[#81786E]">
                Khách hàng tin chọn
              </span>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-1.5">
            <div className="rounded-[7px] bg-[#F4F1EB] px-2.5 py-2 text-[9px] text-[#70685F]">
              <span className="mr-1 text-[#68705D]">✓</span>
              Đánh giá 5.0
            </div>

            <div className="rounded-[7px] bg-[#F4F1EB] px-2.5 py-2 text-[9px] text-[#70685F]">
              <span className="mr-1 text-[#68705D]">✓</span>
              Hỗ trợ tận tâm
            </div>
          </div>
        </div>

        {/* =====================================================
            DESKTOP — KEEP THE 3 STAT CARDS
           ===================================================== */}
        <div className="hidden px-4 py-6 sm:px-7 sm:py-7 lg:block lg:px-9 lg:py-8">
          <div className="flex items-end justify-between gap-5">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#58604D]" />
                <p className="text-[8px] font-medium uppercase tracking-[0.28em] text-[#68705D] sm:text-[9px]">
                  Olive Living Community
                </p>
              </div>

              <h2
                className="
                  mt-2.5
                  font-display
                  text-[27px]
                  font-normal
                  leading-[1.05]
                  tracking-[-0.035em]
                  text-[#29241F]
                  sm:text-[32px]
                  lg:text-[36px]
                "
              >
                Được khách hàng lựa chọn
              </h2>

              <p className="mt-2 max-w-[620px] text-[11px] leading-4 text-[#8A8177] sm:text-[12px]">
                Cảm ơn bạn đã đồng hành cùng Olive Living. Những con số nhỏ tạo nên niềm tin lớn.
              </p>
            </div>

            <p className="hidden shrink-0 pb-1 text-[8px] uppercase tracking-[0.24em] text-[#9A9187] sm:block">
              Trusted by our community
            </p>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-2.5 sm:gap-3 lg:mt-7">
            {stats.map((stat, index) => (
              <div
                key={stat.label}
                className="
                  relative
                  min-h-[106px]
                  rounded-[16px]
                  border
                  border-[#E7E0D7]
                  bg-white/80
                  px-4
                  py-4
                  sm:min-h-[116px]
                  sm:px-5
                  sm:py-4
                "
              >
                <div className="flex items-center justify-between">
                  <span className="text-[8px] tracking-[0.18em] text-[#A79E93]">
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#F4F0E9] text-[#5F6758]">
                    <Check size={13} strokeWidth={1.6} />
                  </span>
                </div>

                <div className="mt-2 flex items-center gap-1.5">
                  <span className="text-[29px] font-medium leading-none tracking-[-0.045em] text-[#171717] sm:text-[31px]">
                    {stat.number}
                  </span>

                  {stat.star && (
                    <span className="mt-0.5 text-[24px] leading-none text-[#C77B55]">
                      ★
                    </span>
                  )}
                </div>

                <p className="mt-1.5 text-[10px] leading-4 text-[#81786E] sm:text-[11px]">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-2.5 grid grid-cols-4 gap-1.5 sm:gap-2">
            {benefits.map((benefit) => (
              <div
                key={benefit}
                className="
                  flex
                  min-h-[32px]
                  items-center
                  gap-1.5
                  rounded-[7px]
                  bg-[#F4F1EB]
                  px-2.5
                  py-1.5
                  text-[9px]
                  leading-3.5
                  text-[#70685F]
                  sm:min-h-[34px]
                  sm:px-3
                  sm:text-[10px]
                "
              >
                <Check
                  size={11}
                  strokeWidth={1.7}
                  className="shrink-0 text-[#68705D]"
                />
                <span>{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
