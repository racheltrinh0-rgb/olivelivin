import { motion } from "framer-motion";

const feedbackImages = [
  "/images/customer-feedback-01.jpg",
  "/images/customer-feedback-02.jpg",
  "/images/customer-feedback-03.jpg",
  "/images/customer-feedback-04.jpg",
  "/images/customer-feedback-05.jpg",
  "/images/customer-feedback-06.jpg",
];

export default function CustomerFeedbackGallery() {
  // Duplicate the images so the horizontal loop feels continuous.
  const images = [...feedbackImages, ...feedbackImages];

  return (
    <section className="overflow-hidden bg-white pt-5 pb-10 sm:pt-7 sm:pb-14 lg:pt-8 lg:pb-16">
      {/* EDITORIAL HEADER */}
      <div className="mx-auto mb-6 max-w-[680px] px-5 text-center sm:mb-8">
        <div className="mb-3 flex items-center justify-center gap-3">
          <span className="h-px w-7 bg-[#D9C8B6]" />
          <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-[#9A806A] sm:text-[11px]">
            Notes from our customers
          </p>
          <span className="h-px w-7 bg-[#D9C8B6]" />
        </div>

        <h2 className="font-display text-[32px] font-normal leading-[1.12] tracking-[-0.035em] text-[#292621] sm:text-[42px] lg:text-[50px]">
          Không gian thật
          <span className="text-[#B98561]">.</span>
          <br />
          Cảm nhận chân thành
          <span className="text-[#B98561]">.</span>
        </h2>

        <p className="mx-auto mt-3 max-w-[420px] text-[12px] leading-5 text-[#81786F] sm:mt-4 sm:text-[13px]">
          Những góc nhà thân quen, được kể lại qua trải nghiệm của khách hàng Olive Living.
        </p>
      </div>

      {/* CONTINUOUS FEEDBACK GALLERY */}
      <div className="relative w-full overflow-hidden">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-20 w-8 bg-gradient-to-r from-white via-white/80 to-transparent sm:w-16 lg:w-28" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-20 w-8 bg-gradient-to-l from-white via-white/80 to-transparent sm:w-16 lg:w-28" />

        <motion.div
          className="flex w-max gap-3 sm:gap-4 lg:gap-5"
          animate={{ x: ["0%", "-50%"] }}
          transition={{
            duration: 42,
            repeat: Infinity,
            repeatType: "loop",
            ease: "linear",
          }}
        >
          {images.map((image, index) => (
            <div
              key={`${image}-${index}`}
              className="
                group relative h-[250px] w-[185px] shrink-0
                overflow-hidden rounded-[12px] bg-[#F5F2ED]
                sm:h-[300px] sm:w-[220px]
                lg:h-[340px] lg:w-[250px]
                xl:h-[360px] xl:w-[265px]
              "
            >
              <img
                src={image}
                alt={`Trải nghiệm khách hàng Olive Living ${((index % feedbackImages.length) + 1)}`}
                loading={index < feedbackImages.length ? "eager" : "lazy"}
                className="
                  block h-full w-full object-cover object-center
                  transition-transform duration-700 ease-out
                  group-hover:scale-[1.025]
                "
              />
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
