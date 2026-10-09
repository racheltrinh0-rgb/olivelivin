const paymentMethods = [
  {
    name: "Visa",
    src: "/images/visa.png",
  },
  {
    name: "Mastercard",
    src: "/images/mastercard.png",
  },
  {
    name: "American Express",
    src: "/images/amex.png",
  },
  {
    name: "PayPal",
    src: "/images/PayPal (1).png",
  },
  {
    name: "Diners Club",
    src: "/images/Diners Club.png",
  },
  {
    name: "Discover",
    src: "/images/discover.png",
  },
];

export function PaymentMethods() {
  return (
    <div className="mt-3 border-y border-neutral-200 py-3">
      <div
        className="flex w-full flex-nowrap items-center justify-between gap-2"
        aria-label="Accepted payment methods"
      >
        {paymentMethods.map((payment) => (
          <div
            key={payment.name}
            title={payment.name}
            className="flex h-8 min-w-0 flex-1 items-center justify-center"
          >
            <img
              src={payment.src}
              alt={payment.name}
              className="block max-h-6 max-w-full object-contain"
              loading="lazy"
              draggable={false}
            />
          </div>
        ))}
      </div>
    </div>
  );
}