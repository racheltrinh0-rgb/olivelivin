import { Link } from "@tanstack/react-router";

type PolicyLayoutProps = {
  title: string;
  children: React.ReactNode;
};

export function PolicyLayout({ title, children }: PolicyLayoutProps) {
  return (
    <main className="min-h-screen bg-[#FAFAF8] text-[#222222]">
      <div className="mx-auto w-full max-w-4xl px-5 py-8 sm:px-8 sm:py-12">
        <div className="mb-8 flex items-center justify-between">
          <Link
            to="/"
            className="text-[18px] font-semibold tracking-[0.16em] text-[#292C25]"
          >
            OLIVE LIVING.
          </Link>

          <Link
            to="/"
            className="text-[10px] font-medium text-[#777B72] transition hover:text-[#222222]"
          >
            Về trang chủ
          </Link>
        </div>

        <div className="overflow-hidden rounded-2xl border border-[#E1E2DC] bg-white shadow-sm">
          <div className="border-b border-[#ECECE7] px-5 py-6 sm:px-8">
            <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#999B96]">
              OLIVE LIVING
            </p>

            <h1 className="mt-2 text-[22px] font-semibold tracking-[-0.02em] text-[#222222] sm:text-[26px]">
              {title}
            </h1>
          </div>

          <div className="px-5 py-6 sm:px-8 sm:py-8">
            {children}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-x-4 gap-y-2 text-[10px] text-[#999B96]">
          <Link
            to="/chinh-sach-doi-hang"
            className="transition hover:text-[#4F604E]"
          >
            Chính sách đổi hàng
          </Link>

          <span>•</span>

          <Link
            to="/shipping"
            className="transition hover:text-[#4F604E]"
          >
            Shipping
          </Link>

          <span>•</span>

          <Link
            to="/lien-he"
            className="transition hover:text-[#4F604E]"
          >
            Liên hệ
          </Link>

          <span>•</span>

          <Link
            to="/thanh-toan"
            className="transition hover:text-[#4F604E]"
          >
            Thanh toán
          </Link>
        </div>

        <p className="mt-4 text-center text-[9px] text-[#B0B1AC]">
          © Olive Living. All rights reserved.
        </p>
      </div>
    </main>
  );
}

export function ExchangePolicy() {
  return (
    <PolicyLayout title="Chính sách đổi hàng">
      <div className="space-y-7 text-[11px] leading-[1.7] text-[#5F625C]">
        <div>
          <p>
            Olive Living luôn mong muốn khách hàng nhận được sản phẩm nội thất
            và đèn trang trí trong tình trạng hoàn hảo.
          </p>

          <p className="mt-3">
            Nếu sản phẩm gặp lỗi từ{" "}
            <strong className="text-[#333333]">
              nhà sản xuất hoặc trong quá trình vận chuyển
            </strong>
            , Olive Living sẽ hỗ trợ đổi sản phẩm theo chính sách dưới đây.
          </p>
        </div>

        <section>
          <h2 className="text-[13px] font-semibold text-[#222222]">
            1. Điều kiện đổi hàng
          </h2>

          <ul className="mt-3 space-y-2">
            <li>
              • Sản phẩm bị <strong>lỗi kỹ thuật hoặc lỗi sản xuất</strong> từ
              nhà sản xuất.
            </li>
            <li>
              • Sản phẩm bị{" "}
              <strong>bể, vỡ hoặc hư hỏng trong quá trình vận chuyển</strong>.
            </li>
            <li>
              • Sản phẩm <strong>chưa qua sử dụng</strong>.
            </li>
            <li>
              • Sản phẩm còn{" "}
              <strong>đầy đủ hộp, bao bì và phụ kiện</strong> đi kèm.
            </li>
            <li>
              • Khách hàng thông báo khi phát hiện vấn đề và cung cấp hình
              ảnh/video để kiểm tra.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-[13px] font-semibold text-[#222222]">
            2. Các trường hợp không được hỗ trợ đổi hàng
          </h2>

          <ul className="mt-3 space-y-2">
            <li>
              • Sản phẩm đã qua sử dụng và phát sinh hao mòn trong quá trình
              sử dụng.
            </li>
            <li>
              • Sản phẩm bị bể, nứt, móp hoặc hư hỏng do tác động vật lý từ
              phía khách hàng.
            </li>
            <li>
              • Hư hỏng do sử dụng, lắp đặt hoặc bảo quản không đúng hướng dẫn.
            </li>
            <li>
              • Sản phẩm không còn đầy đủ hộp, bao bì hoặc phụ kiện trong
              trường hợp việc thiếu các thành phần này ảnh hưởng đến quá trình
              kiểm tra và đổi hàng.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-[13px] font-semibold text-[#222222]">
            3. Quy trình xử lý khi sản phẩm bị lỗi
          </h2>

          <p className="mt-3">
            Khi nhận được sản phẩm có lỗi, khách hàng vui lòng{" "}
            <strong>liên hệ Olive Living</strong> và cung cấp hình ảnh/video
            tình trạng sản phẩm.
          </p>

          <div className="mt-4 rounded-xl bg-[#F4F5F2] p-4 text-[10px] font-semibold leading-5 text-[#3F483C]">
            Khách hàng liên hệ → Olive xác nhận lỗi → Gửi sản phẩm mới → Bàn
            giao sản phẩm lỗi
          </div>

          <ul className="mt-4 space-y-2">
            <li>
              • Olive Living sẽ <strong>gửi sản phẩm mới</strong> đến khách
              hàng.
            </li>
            <li>
              • Khách hàng{" "}
              <strong>không phải chịu phí vận chuyển đổi hàng</strong>.
            </li>
            <li>
              • Sản phẩm lỗi được bàn giao lại cho shipper/đơn vị vận chuyển
              theo hướng dẫn.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-[13px] font-semibold text-[#222222]">
            4. Trường hợp sản phẩm tạm hết hàng
          </h2>

          <p className="mt-3">
            Nếu sản phẩm cần đổi không còn sẵn trong kho, Olive Living sẽ tiến
            hành đặt hàng mới cho khách hàng.
          </p>

          <div className="mt-4 rounded-xl border border-[#E1E5DE] bg-[#F7F8F5] px-4 py-3">
            <p className="text-[11px] font-semibold text-[#4F604E]">
              Thời gian dự kiến: 07–10 ngày
            </p>
            <p className="mt-1 text-[10px] text-[#777B72]">
              Tính từ thời điểm Olive Living xác nhận đổi hàng.
            </p>
          </div>

          <p className="mt-3">
            Sau khi sản phẩm mới về kho, Olive Living sẽ liên hệ và sắp xếp
            giao hàng đến khách hàng.
          </p>
        </section>

        <section>
          <h2 className="text-[13px] font-semibold text-[#222222]">
            5. Lưu ý
          </h2>

          <p className="mt-3">
            Khách hàng nên{" "}
            <strong>kiểm tra tình trạng sản phẩm ngay khi nhận hàng</strong>,
            đặc biệt đối với sản phẩm bằng kính, đèn và đồ nội thất.
          </p>

          <p className="mt-3 font-medium text-[#4F604E]">
            Olive Living cam kết hỗ trợ khách hàng xử lý nhanh chóng đối với
            các trường hợp lỗi thuộc trách nhiệm của nhà sản xuất hoặc đơn vị
            vận chuyển.
          </p>
        </section>
      </div>
    </PolicyLayout>
  );
}

export function ShippingPolicy() {
  return (
    <PolicyLayout title="Shipping">
      <div className="space-y-7 text-[11px] leading-[1.7] text-[#5F625C]">
        <p>
          Olive Living sử dụng <strong>GHN (Giao Hàng Nhanh)</strong> làm đơn
          vị vận chuyển cho các đơn hàng.
        </p>

        <section>
          <h2 className="text-[13px] font-semibold text-[#222222]">
            Thời gian giao hàng dự kiến
          </h2>

          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between rounded-xl bg-[#F5F6F3] px-4 py-3">
              <span>Nội thành Hồ Chí Minh</span>
              <strong className="text-[#4F604E]">1–2 ngày</strong>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-[#F5F6F3] px-4 py-3">
              <span>Ngoại thành</span>
              <strong className="text-[#4F604E]">2–3 ngày</strong>
            </div>
          </div>

          <p className="mt-3 text-[#777B72]">
            Thời gian trên là thời gian dự kiến và có thể thay đổi tùy tình
            hình vận chuyển thực tế.
          </p>
        </section>

        <section>
          <h2 className="text-[13px] font-semibold text-[#222222]">
            Trường hợp giao hàng chậm
          </h2>

          <p className="mt-3">
            Trong trường hợp phát sinh các yếu tố ngoài khả năng kiểm soát như{" "}
            <strong>
              mưa bão, thời tiết xấu, quá tải hoặc đơn hàng bị lưu giữ tại đơn
              vị vận chuyển
            </strong>
            , thời gian giao hàng có thể chậm thêm khoảng{" "}
            <strong>1–2 ngày</strong>.
          </p>
        </section>

        <section>
          <h2 className="text-[13px] font-semibold text-[#222222]">
            Tra cứu đơn hàng
          </h2>

          <p className="mt-3">
            Quý khách có thể{" "}
            <strong>liên hệ Olive Living để nhận mã tracking</strong> và theo
            dõi tình trạng đơn hàng.
          </p>
        </section>

        <section>
          <h2 className="text-[13px] font-semibold text-[#222222]">
            Thay đổi địa chỉ nhận hàng
          </h2>

          <p className="mt-3">
            Nếu muốn thay đổi địa chỉ sau khi đơn hàng đã được bàn giao cho đơn
            vị vận chuyển, vui lòng liên hệ Olive Living sớm nhất có thể.
          </p>

          <p className="mt-3">
            Chúng tôi sẽ kiểm tra tình trạng đơn hàng và hỗ trợ xử lý với đơn
            vị vận chuyển tùy theo khả năng điều chỉnh tại thời điểm yêu cầu.
          </p>
        </section>
      </div>
    </PolicyLayout>
  );
}

export function PaymentPolicy() {
  return (
    <PolicyLayout title="Thanh toán">
      <div className="space-y-6 text-[11px] leading-[1.7] text-[#5F625C]">
        <p>
          Olive Living hiện hỗ trợ <strong>3 phương thức thanh toán</strong>.
          Quý khách có thể lựa chọn phương thức phù hợp khi đặt hàng.
        </p>

        <section className="rounded-2xl border border-[#FFD2C2] bg-[#FFF8F5] p-5">
          <h2 className="text-[13px] font-semibold text-[#222222]">
            1. COD · Thanh toán khi nhận hàng
          </h2>

          <p className="mt-3">
            Quý khách đặt hàng và <strong>không cần thanh toán trước</strong>.
            Khi đơn hàng được giao đến, quý khách kiểm tra và thanh toán tiền
            cho đơn vị vận chuyển.
          </p>

          <div className="mt-3 rounded-xl bg-white px-4 py-3 text-[10px] font-medium leading-5 text-[#555853]">
            Đặt hàng → Olive Living xác nhận → Giao hàng → Thanh toán khi nhận
            hàng
          </div>
        </section>

        <section className="rounded-2xl border border-[#CFE2FF] bg-[#F7FAFF] p-5">
          <h2 className="text-[13px] font-semibold text-[#222222]">
            2. Chuyển khoản ngân hàng
          </h2>

          <p className="mt-3">
            Quý khách có thể thanh toán trước bằng hình thức{" "}
            <strong>chuyển khoản ngân hàng</strong>. Thông tin tài khoản và mã
            đơn hàng sẽ được hiển thị trong quá trình đặt hàng.
          </p>

          <div className="mt-3 rounded-xl bg-white px-4 py-3 text-[10px] leading-5 text-[#555853]">
            Chuyển khoản → Olive Living xác nhận thanh toán → Chuẩn bị đơn hàng
            → Giao hàng
          </div>
        </section>

        <section className="rounded-2xl border border-[#E7D69A] bg-[#FFFDF3] p-5">
          <h2 className="text-[13px] font-semibold text-[#222222]">
            3. Thanh toán qua PayPal
          </h2>

          <p className="mt-3">
            Quý khách có thể thanh toán trực tuyến thông qua{" "}
            <strong>PayPal</strong>. Giao dịch thanh toán được xử lý thông qua
            hệ thống PayPal.
          </p>

          <div className="mt-4 rounded-xl bg-white p-4">
            <p className="text-[11px] font-semibold text-[#333333]">
              Thanh toán bằng thẻ tín dụng / thẻ ghi nợ
            </p>

            <p className="mt-2">
              Nếu quý khách không có tài khoản PayPal, trong trường hợp PayPal
              hiển thị tùy chọn thanh toán bằng thẻ cho giao dịch, quý khách có
              thể chọn <strong>Credit Card / Debit Card</strong> và nhập thông
              tin thẻ theo hướng dẫn của PayPal.
            </p>

            <div className="mt-4 rounded-xl border border-dashed border-[#D8D8D2] bg-[#FAFAF8] px-4 py-3">
              <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[#999B96]">
                Hướng dẫn
              </p>

              <ol className="mt-2 space-y-1.5 text-[10px] leading-[1.6]">
                <li>
                  <strong>1.</strong> Chọn phương thức thanh toán PayPal.
                </li>
                <li>
                  <strong>2.</strong> Chọn tùy chọn thanh toán bằng thẻ nếu
                  PayPal hiển thị lựa chọn này.
                </li>
                <li>
                  <strong>3.</strong> Nhập thông tin thẻ theo hướng dẫn của
                  PayPal.
                </li>
                <li>
                  <strong>4.</strong> Xác nhận thanh toán và hoàn tất đơn hàng.
                </li>
              </ol>
            </div>

            <div className="mt-4 rounded-xl bg-[#F4F5F2] px-4 py-3">
              <p className="text-[10px] leading-5 text-[#777B72]">
                Hình ảnh hướng dẫn thanh toán bằng thẻ sẽ được cập nhật tại
                đây. Bạn có thể thay phần này bằng 2 ảnh chụp màn hình PayPal
                sau khi hoàn thiện hướng dẫn.
              </p>
            </div>
          </div>
        </section>

        <div className="rounded-xl bg-[#F4F5F2] px-4 py-3">
          <p className="text-[10px] leading-5 text-[#666A63]">
            Lưu ý: tùy theo khu vực, loại thẻ, tài khoản và điều kiện của
            PayPal, tùy chọn thanh toán bằng thẻ có thể được PayPal hiển thị
            hoặc không hiển thị.
          </p>
        </div>
      </div>
    </PolicyLayout>
  );
}

export function ContactPolicy() {
  return (
    <PolicyLayout title="Liên hệ">
      <div className="space-y-6 text-[11px] leading-[1.7] text-[#5F625C]">
        <p>
          Nếu quý khách cần hỗ trợ về{" "}
          <strong>đơn hàng, vận chuyển, đổi hàng hoặc sản phẩm</strong>, vui
          lòng liên hệ Olive Living qua các kênh dưới đây.
        </p>

        <div className="space-y-3">
          <a
            href="mailto:hello@olivelivingvn.com"
            className="flex items-center justify-between rounded-xl border border-[#E3E4DF] bg-white px-4 py-4 transition hover:bg-[#F7F8F5]"
          >
            <div>
              <p className="text-[9px] font-medium uppercase tracking-[0.12em] text-[#999B96]">
                EMAIL
              </p>
              <p className="mt-1 text-[11px] font-semibold text-[#333333]">
                hello@olivelivingvn.com
              </p>
            </div>

            <span className="text-[14px] text-[#777B72]">→</span>
          </a>

          <div className="flex items-center justify-between rounded-xl border border-[#E3E4DF] bg-white px-4 py-4">
            <div>
              <p className="text-[9px] font-medium uppercase tracking-[0.12em] text-[#999B96]">
                FANPAGE
              </p>
              <p className="mt-1 text-[11px] font-semibold text-[#333333]">
                Olive Living
              </p>
            </div>
          </div>

          <a
            href="tel:0799379179"
            className="flex items-center justify-between rounded-xl border border-[#E3E4DF] bg-white px-4 py-4 transition hover:bg-[#F7F8F5]"
          >
            <div>
              <p className="text-[9px] font-medium uppercase tracking-[0.12em] text-[#999B96]">
                ZALO
              </p>
              <p className="mt-1 text-[11px] font-semibold text-[#333333]">
                0799 379 179
              </p>
            </div>

            <span className="text-[14px] text-[#777B72]">→</span>
          </a>
        </div>

        <div className="rounded-xl bg-[#F4F5F2] px-4 py-3">
          <p className="text-[10px] leading-5 text-[#666A63]">
            Olive Living sẽ tiếp nhận và hỗ trợ quý khách trong thời gian sớm
            nhất.
          </p>
        </div>
      </div>
    </PolicyLayout>
  );
}
