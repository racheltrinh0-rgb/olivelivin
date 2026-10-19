import {
  Package,
  Headset,
  RotateCcw,
  LockKeyhole,
} from "lucide-react";

const supportItems = [
  {
    icon: Package,
    title: "Giao hàng có mã theo dõi",
    linkText: "Chi tiết giao hàng",
    href: "/shipping",
  },
  {
    icon: Headset,
    title: "Chúng tôi luôn hỗ trợ",
    linkText: "Liên hệ",
    href: "/lien-he",
  },
  {
    icon: RotateCcw,
    title: "Đổi trả trong 30 ngày",
    linkText: "Chính sách đổi trả",
    href: "/chinh-sach-doi-hang",
  },
  {
    icon: LockKeyhole,
    title: "Thanh toán an toàn",
    linkText: "Phương thức thanh toán",
    href: "/thanh-toan",
  },
];

export default function FooterPolicyLinks() {
  return (
    <section className="w-full bg-[#F1F1F1] px-3 py-4 sm:px-5 sm:py-5">
      <div className="mx-auto w-full max-w-[1200px]">
        <div className="grid grid-cols-2 gap-y-5 rounded-xl border border-[#E1E1E1] bg-white px-2 py-4 sm:gap-y-6 sm:px-4 sm:py-5 lg:grid-cols-4 lg:gap-y-0 lg:py-4">
          {supportItems.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.title}
                className="flex min-w-0 flex-col items-center justify-center px-1 text-center"
              >
                <Icon
                  size={22}
                  strokeWidth={2}
                  className="mb-1.5 shrink-0 text-[#292929]"
                />

                <p className="text-[11px] font-medium leading-4 text-[#292929] sm:text-xs">
                  {item.title}
                </p>

                <a
                  href={item.href}
                  className="mt-2 text-[10px] leading-4 text-[#666] underline underline-offset-2 sm:text-[11px]"
                >
                  {item.linkText}
                </a>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}