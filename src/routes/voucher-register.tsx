import { useState } from "react";

import type { FormEvent } from "react";

import { Link, createFileRoute } from "@tanstack/react-router";

import { CheckCircle2, Loader2, ArrowLeft, ShieldCheck, Mail, Gift } from "lucide-react";



import { supabase } from "@/integrations/supabase/client";



type FormData = {

  name: string;

  phone: string;

  email: string;

};



type FormErrors = {

  name?: string;

  phone?: string;

  email?: string;

  general?: string;

};



type MasterVoucher = {

  id: string;

  code: string;

  value: number | null;

  min_order: number | null;

  max_discount: number | null;

  quantity: number | null;

  used: number | null;

  active: boolean | null;

  start_at: string | null;

  end_at: string | null;

  manual_apply: boolean | null;

  auto_apply: boolean | null;

  usage_per_customer: number | null;

  is_personal: boolean | null;

};



export const Route = createFileRoute("/voucher-register")({

  component: VoucherRegisterPage,

});



/**

 * Chuẩn hóa số điện thoại Việt Nam

 *

 * +84901234567

 * 84901234567

 * 0901234567

 *

 * đều trở thành:

 * 0901234567

 */

function normalizePhone(phone: string) {
  let value = phone
    .trim()
    .replace(/\s+/g, "")
    .replace(/-/g, "")
    .replace(/\./g, "");

  if (value.startsWith("+84")) {
    value = "0" + value.slice(3);
  } else if (value.startsWith("84")) {
    value = "0" + value.slice(2);
  }

  return value;
}



/**

 * Kiểm tra số điện thoại Việt Nam

 */

function isValidVietnamPhone(phone: string) {

  return /^(03|05|07|08|09)[0-9]{8}$/.test(

    normalizePhone(phone),

  );

}



/**

 * Kiểm tra email

 */

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(email.trim());
}



/**

 * Tạo mã voucher cá nhân

 *

 * Ví dụ:

 * OLV-A7K92P

 */

function generateVoucherCode() {

  const characters =

    "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";



  let randomPart = "";



  for (let i = 0; i < 6; i++) {

    randomPart += characters.charAt(

      Math.floor(Math.random() * characters.length),

    );

  }



  return `OLV-${randomPart}`;

}



function VoucherRegisterPage() {

  const [form, setForm] = useState<FormData>({

    name: "",

    phone: "",

    email: "",

  });



  const [errors, setErrors] = useState<FormErrors>({});

  const [submitting, setSubmitting] = useState(false);

  const [success, setSuccess] = useState(false);

  const [voucherCode, setVoucherCode] = useState("");



  /**

   * Cập nhật input

   */

  function updateField(

    field: keyof FormData,

    value: string,

  ) {

    setForm((current) => ({

      ...current,

      [field]: value,

    }));



    setErrors((current) => ({

      ...current,

      [field]: undefined,

      general: undefined,

    }));

  }



  /**

   * Validate form

   */

  function validate() {

    const nextErrors: FormErrors = {};



    const name = form.name.trim();

    const phone = normalizePhone(form.phone);

    const email = form.email.trim().toLowerCase();



    if (!name) {

      nextErrors.name = "Vui lòng nhập họ và tên.";

    } else if (name.length < 2) {

      nextErrors.name = "Họ tên chưa hợp lệ.";

    }



    if (!phone) {

      nextErrors.phone =

        "Vui lòng nhập số điện thoại.";

    } else if (!isValidVietnamPhone(phone)) {

      nextErrors.phone =

        "Vui lòng nhập số điện thoại Việt Nam hợp lệ.";

    }



    if (!email) {

      nextErrors.email =

        "Vui lòng nhập email.";

    } else if (!isValidEmail(email)) {

      nextErrors.email =

        "Vui lòng nhập địa chỉ email hợp lệ.";

    }



    setErrors(nextErrors);



    return {

      valid: Object.keys(nextErrors).length === 0,

      name,

      phone,

      email,

    };

  }



  /**

   * Submit đăng ký voucher

   */

  async function handleSubmit(

    event: FormEvent<HTMLFormElement>,

  ) {

    event.preventDefault();



    if (submitting) return;



    const result = validate();



    if (!result.valid) return;



    setSubmitting(true);

    setErrors({});



    try {

      /**

       * =========================================================

       * 1. LẤY VOUCHER MASTER

       * =========================================================

       */



      const {

        data: masterVoucher,

        error: voucherError,

      } = await supabase

        .from("vouchers")

        .select(

          `

            id,

            code,

            value,

            min_order,

            max_discount,

            quantity,

            used,

            active,

            start_at,

            end_at,

            manual_apply,

            auto_apply,

            usage_per_customer,

            is_personal

          `,

        )

        .eq("code", "OLV-T2V4NF")

        .maybeSingle<MasterVoucher>();



      if (voucherError || !masterVoucher) {

        console.error(

          "LOAD MASTER VOUCHER ERROR:",

          voucherError,

        );



        setErrors({

          general:

            "Không thể tải chương trình voucher. Vui lòng thử lại sau.",

        });



        return;

      }



      /**

       * =========================================================

       * 2. KIỂM TRA VOUCHER MASTER

       * =========================================================

       */



      const now = Date.now();



      // Voucher inactive

      if (!masterVoucher.active) {

        setErrors({

          general:

            "Chương trình voucher hiện không hoạt động.",

        });



        return;

      }



      // Voucher chưa bắt đầu

      if (

        masterVoucher.start_at &&

        new Date(

          masterVoucher.start_at,

        ).getTime() > now

      ) {

        setErrors({

          general:

            "Chương trình voucher chưa bắt đầu.",

        });



        return;

      }



      // Voucher hết hạn

      if (

        masterVoucher.end_at &&

        new Date(

          masterVoucher.end_at,

        ).getTime() < now

      ) {

        setErrors({

          general:

            "Chương trình voucher đã kết thúc.",

        });



        return;

      }



      /**

       * Đảm bảo voucher master đúng cấu hình:

       *

       * 5%

       * Không minimum

       * Max 35.000đ

       */



      const voucherPercent = Number(

        masterVoucher.value ?? 0,

      );



      const voucherMinOrder = Number(

        masterVoucher.min_order ?? 0,

      );



      const voucherMaxDiscount = Number(

        masterVoucher.max_discount ?? 0,

      );



      if (voucherPercent <= 0) {

        setErrors({

          general:

            "Voucher chưa được cấu hình đúng mức giảm.",

        });



        return;

      }



      if (voucherMinOrder < 0) {

        setErrors({

          general:

            "Cấu hình minimum order của voucher không hợp lệ.",

        });



        return;

      }



      if (voucherMaxDiscount <= 0) {

        setErrors({

          general:

            "Cấu hình mức giảm tối đa của voucher không hợp lệ.",

        });



        return;

      }



      /**

       * =========================================================

       * 3. KIỂM TRA SĐT ĐÃ NHẬN VOUCHER CHƯA

       * =========================================================

       */



      const {

        data: existingCustomerVoucher,

        error: voucherCheckError,

      } = await supabase

        .from("customer_vouchers")

        .select("id")

        .eq("phone", result.phone)

        .limit(1)

        .maybeSingle();



      if (voucherCheckError) {

        console.error(

          "CHECK EXISTING CUSTOMER VOUCHER ERROR:",

          voucherCheckError,

        );



        setErrors({

          general:

            "Không thể kiểm tra thông tin đăng ký. Vui lòng thử lại.",

        });



        return;

      }



      if (existingCustomerVoucher) {

        setErrors({

          general:

            "Số điện thoại này đã được đăng ký nhận voucher trước đó.",

        });



        return;

      }



      /**

       * =========================================================

       * 4. KIỂM TRA PHONE TRONG POTENTIAL CUSTOMERS

       * =========================================================

       */



      const {

        data: existingPhone,

        error: phoneError,

      } = await supabase

        .from("potential_customers")

        .select("id")

        .eq("phone", result.phone)

        .limit(1)

        .maybeSingle();



      if (phoneError) {

        console.error(

          "CHECK PHONE ERROR:",

          phoneError,

        );

      }



      /**

       * =========================================================

       * 5. KIỂM TRA EMAIL TRONG POTENTIAL CUSTOMERS

       * =========================================================

       */



      const {

        data: existingEmail,

        error: emailError,

      } = await supabase

        .from("potential_customers")

        .select("id")

        .eq("email", result.email)

        .limit(1)

        .maybeSingle();



      if (emailError) {

        console.error(

          "CHECK EMAIL ERROR:",

          emailError,

        );

      }



      /**

       * Nếu phone hoặc email đã từng đăng ký

       * thì không cấp thêm voucher.

       */

      if (

        existingPhone ||

        existingEmail

      ) {

        setErrors({

          general:

            "Email hoặc số điện thoại này đã được đăng ký nhận voucher trước đó.",

        });



        return;

      }



      /**

       * =========================================================

       * 6. KIỂM TRA SỐ LƯỢNG VOUCHER

       * =========================================================

       *

       * Lưu ý:

       * Logic này giữ theo cấu trúc DB hiện tại của bạn.

       */



      const {

  count: issuedCount,

  error: issuedCountError,

} = await supabase

  .from("customer_vouchers")

  .select("id", {

    count: "exact",

    head: true,

  })

  .eq("discount", voucherPercent)

  .eq("min_order", voucherMinOrder);



      if (issuedCountError) {

        console.error(

          "CHECK VOUCHER QUANTITY ERROR:",

          issuedCountError,

        );



        setErrors({

          general:

            "Không thể kiểm tra số lượng voucher còn lại. Vui lòng thử lại.",

        });



        return;

      }



      if (

        masterVoucher.quantity &&

        (issuedCount ?? 0) >=

          Number(masterVoucher.quantity)

      ) {

        setErrors({

          general:

            "Voucher đăng ký đã được phát hết. Cảm ơn bạn đã quan tâm đến Olive Living.",

        });



        return;

      }



      /**

       * =========================================================

       * 7. TẠO MÃ VOUCHER CÁ NHÂN

       * =========================================================

       */



      let personalVoucherCode = "";

      let codeExists = true;



      for (

        let attempt = 0;

        attempt < 10;

        attempt++

      ) {

        const candidate =

          generateVoucherCode();



        const {

          data: existingCode,

          error: codeCheckError,

        } = await supabase

          .from("customer_vouchers")

          .select("id")

          .eq("voucher_code", candidate)

          .limit(1)

          .maybeSingle();



        if (codeCheckError) {

          console.error(

            "CHECK VOUCHER CODE ERROR:",

            codeCheckError,

          );



          setErrors({

            general:

              "Không thể tạo mã voucher. Vui lòng thử lại.",

          });



          return;

        }



        if (!existingCode) {

          personalVoucherCode = candidate;

          codeExists = false;

          break;

        }

      }



      if (

        codeExists ||

        !personalVoucherCode

      ) {

        setErrors({

          general:

            "Không thể tạo mã voucher lúc này. Vui lòng thử lại.",

        });



        return;

      }



      /**

       * =========================================================

       * 8. LƯU KHÁCH HÀNG TIỀM NĂNG

       * =========================================================

       */



      const {

        error: saveCustomerError,

      } = await supabase

        .from("potential_customers")

        .insert({

          name: result.name,

          phone: result.phone,

          email: result.email,



          // Giữ source hiện tại để không ảnh hưởng DB

          source: "voucher_page",

        });



      if (saveCustomerError) {

        console.error(

          "SAVE POTENTIAL CUSTOMER ERROR:",

          saveCustomerError,

        );



        setErrors({

          general:

            "Không thể lưu thông tin đăng ký. Vui lòng thử lại.",

        });



        return;

      }



      /**

       * =========================================================

       * 9. CẤP VOUCHER CÁ NHÂN

       * =========================================================

       *

       * QUAN TRỌNG:

       *

       * discount = 5

       *

       * Checkout sẽ hiểu:

       * 5 = 5%

       *

       * min_order = 0

       *

       * Không minimum order.

       */



      const {

        error: customerVoucherError,

      } = await supabase

        .from("customer_vouchers")

        .insert({

          full_name: result.name,

          phone: result.phone,

          voucher_code: personalVoucherCode,



          // 5%

          discount: voucherPercent,



          // Không minimum order

          min_order: voucherMinOrder,



          is_used: false,

        });



      if (customerVoucherError) {

        console.error(

          "CREATE CUSTOMER VOUCHER ERROR:",

          customerVoucherError,

        );



        setErrors({

          general:

            "Không thể cấp voucher. Vui lòng thử lại.",

        });



        return;

      }



      /**

       * =========================================================

       * 10. TÍNH NGÀY HẾT HẠN CÁ NHÂN

       * =========================================================

       *

       * Voucher cá nhân:

       * 7 ngày kể từ lúc đăng ký.

       */



      const expiresAt = new Date(

        Date.now() +

          7 * 24 * 60 * 60 * 1000,

      ).toISOString();



      /**

       * =========================================================

       * 11. GỬI EMAIL

       * =========================================================

       *

       * Email lỗi không làm mất voucher.

       * Voucher vẫn được tạo thành công.

       */



      try {

        const {

          error: sendEmailError,

        } = await supabase.functions.invoke(

          "send-voucher-email",

          {

            body: {

              name: result.name,

              email: result.email,

              voucherCode:

                personalVoucherCode,

              expiresAt,

            },

          },

        );



        if (sendEmailError) {

          console.error(

            "SEND VOUCHER EMAIL ERROR:",

            sendEmailError,

          );

        }

      } catch (emailError) {

        console.error(

          "SEND VOUCHER EMAIL EXCEPTION:",

          emailError,

        );

      }



      /**

       * =========================================================

       * 12. LƯU TRẠNG THÁI ĐÃ ĐĂNG KÝ

       * =========================================================

       */



      localStorage.setItem(

        "olive_popup_registered_v1",

        "true",

      );



      localStorage.setItem(

        "olive_personal_voucher_code",

        personalVoucherCode,

      );



      /**

       * =========================================================

       * 13. HIỂN THỊ SUCCESS

       * =========================================================

       */



      setVoucherCode(

        personalVoucherCode,

      );



      setSuccess(true);

    } catch (error) {

      console.error(

        "POTENTIAL CUSTOMER / VOUCHER ERROR:",

        error,

      );



      setErrors({

        general:

          "Có lỗi xảy ra. Vui lòng thử lại sau.",

      });

    } finally {

      setSubmitting(false);

    }

  }



  return (
    <>
      <main className="min-h-screen bg-[#FAF8F4] text-[#292621]">
        <div className="mx-auto w-full max-w-[1180px] px-4 py-5 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
          <Link
            to="/"
            className="mb-5 inline-flex items-center gap-2 text-xs font-medium text-[#81786F] transition hover:text-[#A97956] sm:mb-7 sm:text-sm"
          >
            <ArrowLeft size={16} strokeWidth={1.7} />
            Quay lại Olive Living
          </Link>

          {!success ? (
            <section className="overflow-hidden rounded-[24px] bg-white shadow-[0_16px_55px_rgba(55,43,30,0.07)] sm:rounded-[28px]">
              <div className="grid lg:grid-cols-[0.95fr_1.05fr]">
                {/* VISUAL PANEL */}
                <div className="bg-[#F0E8DE] p-3 sm:p-5 lg:p-7">
                  <div className="relative overflow-hidden rounded-[18px] bg-[#E8DED1]">
                    <img
                      src="/images/banner03-mobile.png"
                      alt="Ưu đãi thành viên mới của Olive Living"
                      className="block max-h-[260px] w-full object-cover object-center sm:max-h-[360px] lg:max-h-none"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#2B241E]/55 to-transparent px-4 pb-4 pt-12 sm:px-6 sm:pb-6">
                      <p className="text-[9px] font-medium uppercase tracking-[0.24em] text-white/80 sm:text-[10px]">
                        A LITTLE GIFT FOR YOU
                      </p>
                      <p className="mt-1 font-serif text-2xl text-white sm:text-3xl">
                        Make room for better living.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 pt-3 sm:gap-3 sm:pt-4">
                    <div className="min-w-0 rounded-[14px] border border-[#EAD6C2] bg-[#FFF8F1] p-2.5 sm:p-3.5">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#F3E0CF] text-[#AD7045] sm:h-8 sm:w-8">
                          <Gift size={16} strokeWidth={1.7} />
                        </span>
                        <p className="min-w-0 whitespace-nowrap text-[10px] font-semibold tracking-[-0.02em] text-[#49372B] sm:text-xs lg:text-sm">
                          Ưu đãi thành viên mới
                        </p>
                      </div>
                      <p className="mt-2 whitespace-nowrap text-[10px] font-medium text-[#A56B42] sm:text-[11px] lg:text-xs">
                        Giảm 5%, tối đa 35.000đ
                      </p>
                    </div>
                    <div className="min-w-0 rounded-[14px] border border-[#DCE3D2] bg-[#F5F7F0] p-2.5 sm:p-3.5">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#E4EAD9] text-[#596C48] sm:h-8 sm:w-8">
                          <ShieldCheck size={16} strokeWidth={1.7} />
                        </span>
                        <p className="min-w-0 whitespace-nowrap text-[10px] font-semibold tracking-[-0.02em] text-[#35432D] sm:text-xs lg:text-sm">
                          Ưu đãi cá nhân
                        </p>
                      </div>
                      <p className="mt-2 whitespace-nowrap text-[10px] font-medium text-[#647653] sm:text-[11px] lg:text-xs">
                        Có hiệu lực trong 7 ngày
                      </p>
                    </div>
                  </div>
                                </div>

                {/* REGISTRATION FORM */}
                <div className="flex items-center px-5 py-7 sm:px-9 sm:py-10 lg:px-12 lg:py-12">
                  <div className="mx-auto w-full max-w-[420px]">
                    <div className="mb-5 flex items-center gap-2">
                      <span className="h-px w-6 bg-[#C8B29E]" />
                      <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-[#9A806A]">
                        Olive Living · Member Benefits
                      </p>
                    </div>

                    <h1 className="font-serif text-[34px] font-normal leading-[1.08] tracking-[-0.035em] text-[#292621] sm:text-[42px]">
                      Một món quà nhỏ
                      <span className="mt-1 block text-[#B98561]">dành riêng cho bạn.</span>
                    </h1>

                    <p className="mt-4 max-w-sm text-[13px] leading-6 text-[#81786F] sm:text-sm">
                      Đăng ký thành viên để nhận voucher 5% cho lần mua sắm tiếp theo tại Olive Living.
                    </p>

                    <div className="mt-5 flex items-center gap-3 rounded-[14px] bg-[#FAF6F0] px-4 py-3.5">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-[#A97956]">
                        <Gift size={17} strokeWidth={1.7} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-[#494139] sm:text-sm">
                          Voucher thành viên mới · 5% OFF
                        </p>
                        <p className="mt-1 text-[11px] leading-4 text-[#81786F] sm:text-xs">
                          Không yêu cầu đơn tối thiểu · Giảm tối đa 35.000đ
                        </p>
                      </div>
                    </div>

                    <form onSubmit={handleSubmit} className="mt-6 space-y-4 sm:mt-7">
                      <div>
                        <label htmlFor="voucher-name" className="mb-1.5 block text-xs font-medium text-[#514A43]">
                          Họ và tên
                        </label>
                        <input
                          id="voucher-name"
                          name="name"
                          type="text"
                          value={form.name}
                          onChange={(event) => updateField("name", event.target.value)}
                          placeholder="Nhập họ và tên"
                          autoComplete="name"
                          disabled={submitting}
                          className={`h-11 w-full rounded-[10px] border bg-white px-3.5 text-sm text-[#292621] outline-none transition placeholder:text-[#B0A79E] focus:ring-2 focus:ring-[#B98561]/15 ${errors.name ? "border-red-400 focus:border-red-400" : "border-[#E6DED4] focus:border-[#B98561]"}`}
                        />
                        {errors.name && <p className="mt-1.5 text-xs text-red-500">{errors.name}</p>}
                      </div>

                      <div>
                        <label htmlFor="voucher-phone" className="mb-1.5 block text-xs font-medium text-[#514A43]">
                          Số điện thoại
                        </label>
                        <input
                          id="voucher-phone"
                          name="phone"
                          type="tel"
                          value={form.phone}
                          onChange={(event) => updateField("phone", event.target.value)}
                          placeholder="Nhập số điện thoại"
                          autoComplete="tel"
                          inputMode="numeric"
                          disabled={submitting}
                          className={`h-11 w-full rounded-[10px] border bg-white px-3.5 text-sm text-[#292621] outline-none transition placeholder:text-[#B0A79E] focus:ring-2 focus:ring-[#B98561]/15 ${errors.phone ? "border-red-400 focus:border-red-400" : "border-[#E6DED4] focus:border-[#B98561]"}`}
                        />
                        {errors.phone && <p className="mt-1.5 text-xs text-red-500">{errors.phone}</p>}
                      </div>

                      <div>
                        <label htmlFor="voucher-email" className="mb-1.5 block text-xs font-medium text-[#514A43]">
                          Email
                        </label>
                        <div className="relative">
                          <Mail size={16} strokeWidth={1.7} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A49A90]" />
                          <input
                            id="voucher-email"
                            name="email"
                            type="email"
                            value={form.email}
                            onChange={(event) => updateField("email", event.target.value)}
                            placeholder="Nhập email của bạn"
                            autoComplete="email"
                            disabled={submitting}
                            className={`h-11 w-full rounded-[10px] border bg-white pl-10 pr-3.5 text-sm text-[#292621] outline-none transition placeholder:text-[#B0A79E] focus:ring-2 focus:ring-[#B98561]/15 ${errors.email ? "border-red-400 focus:border-red-400" : "border-[#E6DED4] focus:border-[#B98561]"}`}
                          />
                        </div>
                        {errors.email && <p className="mt-1.5 text-xs text-red-500">{errors.email}</p>}
                      </div>

                      {errors.general && (
                        <div role="alert" className="rounded-[10px] border border-red-100 bg-red-50 px-3.5 py-3 text-xs leading-5 text-red-600">
                          {errors.general}
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={submitting}
                        className="group relative mt-1 flex h-11 w-full items-center justify-center gap-2 overflow-hidden rounded-[10px] bg-[#4D5745] px-5 text-xs font-semibold tracking-[0.08em] text-white transition duration-200 hover:bg-[#3F4939] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 sm:h-12 sm:text-sm"
                      >
                        {submitting ? (
                          <>
                            <Loader2 size={16} className="animate-spin" />
                            ĐANG XỬ LÝ...
                          </>
                        ) : (
                          <>
                            NHẬN VOUCHER 5%
                            <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span>
                          </>
                        )}
                      </button>
                    </form>

                    <p className="mt-4 text-center text-[11px] leading-5 text-[#9A9187]">
                      Voucher có hiệu lực 7 ngày kể từ lúc đăng ký.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          ) : (
            <section className="mx-auto max-w-[640px] rounded-[24px] bg-white px-5 py-10 text-center shadow-[0_16px_55px_rgba(55,43,30,0.07)] sm:rounded-[28px] sm:px-10 sm:py-14">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#F0F4ED]">
                <CheckCircle2 size={30} strokeWidth={1.7} className="text-[#4D5745]" />
              </div>

              <p className="mt-6 text-[10px] font-medium uppercase tracking-[0.24em] text-[#9A806A]">
                Olive Living · Member Benefits
              </p>
              <h1 className="mt-3 font-serif text-3xl font-normal tracking-[-0.03em] text-[#292621] sm:text-4xl">
                Đăng ký thành công.
              </h1>
              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#81786F]">
                Voucher cá nhân của bạn đã được tạo. Hãy lưu lại mã và sử dụng trong thời hạn hiệu lực.
              </p>

              <div className="mx-auto mt-7 max-w-sm rounded-[14px] bg-[#FAF6F0] px-5 py-5">
                <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-[#9A806A]">
                  Ưu đãi thành viên mới
                </p>
                <p className="mt-2 font-serif text-4xl text-[#B98561]">5% OFF</p>
                <p className="mt-2 text-xs leading-5 text-[#81786F]">
                  Tối đa 35.000đ · Không yêu cầu giá trị đơn tối thiểu
                </p>
              </div>

              <div className="mx-auto mt-4 max-w-sm rounded-[14px] border border-dashed border-[#D8C7B5] bg-white px-5 py-4">
                <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#9A9187]">
                  Mã voucher của bạn
                </p>
                <p className="mt-2 break-all font-mono text-2xl font-semibold tracking-[0.14em] text-[#4D5745]">
                  {voucherCode}
                </p>
              </div>

              <p className="mt-5 flex items-center justify-center gap-2 text-xs text-[#8D857C]">
                <Mail size={14} strokeWidth={1.7} />
                Mã voucher đã được gửi đến email của bạn.
              </p>

              <Link
                to="/"
                className="mt-7 inline-flex h-11 items-center justify-center gap-2 rounded-[10px] bg-[#4D5745] px-6 text-xs font-semibold tracking-[0.06em] text-white transition hover:bg-[#3F4939]"
              >
                TIẾP TỤC MUA SẮM <span aria-hidden="true">→</span>
              </Link>
            </section>
          )}

          {!success && (
            <div className="mx-auto mt-5 flex max-w-2xl flex-wrap items-center justify-center gap-x-4 gap-y-2 text-center text-[10px] text-[#9A9187] sm:mt-6 sm:text-[11px]">
              <span className="inline-flex items-center gap-1.5"><ShieldCheck size={13} /> Thông tin được bảo mật</span>
              <span className="hidden sm:inline">·</span>
              <span>Voucher cá nhân · 7 ngày</span>
              <span className="hidden sm:inline">·</span>
              <span>Olive Living</span>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
