
import { useEffect, useState } from "react";

const NOTICES = [
  { customer: "Minh Anh", action: "đang khám phá", product: "Đèn bàn Cordless" },
  { customer: "Thu Hà", action: "đang quan tâm", product: "Ghế xoay Cozy" },
  { customer: "Ngọc Linh", action: "đang xem", product: "Đèn cây đứng Memphis 20" },
  { customer: "Hoàng Nam", action: "đang khám phá", product: "Kệ Montara Panton Wire" },
  { customer: "Phương Thảo", action: "đang quan tâm", product: "Đèn cây đứng Half Round" },
  { customer: "Quỳnh Chi", action: "đang xem", product: "Đèn cây đứng Memphis 32" },
  { customer: "Gia Hân", action: "đang khám phá", product: "Đèn bàn Cordless" },
  { customer: "Tuấn Anh", action: "đang quan tâm", product: "Ghế xoay Cozy" },
  { customer: "Bảo Ngọc", action: "đang xem", product: "Đèn cây đứng Memphis 20" },
  { customer: "Đức Minh", action: "đang khám phá", product: "Kệ Montara Panton Wire" },
  { customer: "Thanh Trúc", action: "đang quan tâm", product: "Đèn cây đứng Half Round" },
  { customer: "Khánh Vy", action: "đang xem", product: "Đèn cây đứng Memphis 32" },
  { customer: "Hoàng Yến", action: "đang khám phá", product: "Đèn bàn Cordless" },
  { customer: "Quốc Bảo", action: "đang quan tâm", product: "Ghế xoay Cozy" },
  { customer: "Hải Yến", action: "đang xem", product: "Đèn cây đứng Memphis 20" },
  { customer: "Trung Kiên", action: "đang khám phá", product: "Kệ Montara Panton Wire" },
  { customer: "Mai Phương", action: "đang quan tâm", product: "Đèn cây đứng Half Round" },
  { customer: "Anh Thư", action: "đang xem", product: "Đèn cây đứng Memphis 32" },
  { customer: "Nhật Minh", action: "đang khám phá", product: "Đèn bàn Cordless" },
  { customer: "Khả Hân", action: "đang quan tâm", product: "Ghế xoay Cozy" },
];

function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export default function LivePurchaseNotification() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const path = window.location.pathname.toLowerCase();

    if (
      path.includes("/checkout") ||
      path.includes("/cart") ||
      path.includes("/payment") ||
      path.includes("/thank-you") ||
      path.includes("/order-success")
    ) {
      return;
    }

    const firstTimer = window.setTimeout(() => {
      setVisible(true);
    }, 2000);

    return () => window.clearTimeout(firstTimer);
  }, []);

  useEffect(() => {
    if (!visible || dismissed) return;

    const hideTimer = window.setTimeout(() => {
      setVisible(false);
    }, 5000);

    return () => window.clearTimeout(hideTimer);
  }, [visible, dismissed, index]);

  useEffect(() => {
    if (dismissed) return;

    const interval = window.setInterval(() => {
      setIndex((current) => {
        let next = randomBetween(0, NOTICES.length - 1);

        while (NOTICES.length > 1 && next === current) {
          next = randomBetween(0, NOTICES.length - 1);
        }

        return next;
      });

      setVisible(true);
    }, 50000);

    return () => window.clearInterval(interval);
  }, [dismissed]);

  if (dismissed) return null;

  const notice = NOTICES[index];

  return (
    <>
      <aside
        aria-live="polite"
        aria-label="Gợi ý sản phẩm Olive Living"
        className={`olive-live-notification ${
          visible ? "is-visible" : ""
        }`}
      >
        <div className="olive-live-notification__icon">
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M5 8h14l1 12H4L5 8Z" />
            <path d="M9 9V6a3 3 0 0 1 6 0v3" />
          </svg>
        </div>

        <div className="olive-live-notification__content">
          <p className="olive-live-notification__headline">
            {notice.customer} {notice.action}
          </p>

          <p className="olive-live-notification__product">
            {notice.product}
          </p>

          <div className="olive-live-notification__brand">
            <span className="olive-live-notification__dot" />
            Olive Living · Gợi ý sản phẩm
          </div>
        </div>

        <button
          type="button"
          className="olive-live-notification__close"
          onClick={() => {
            setVisible(false);
            setDismissed(true);
          }}
          aria-label="Đóng thông báo"
        >
          ×
        </button>
      </aside>

      <style>{`
        .olive-live-notification {
          position: fixed;
          z-index: 2147483647;
          left: 16px;
          bottom: 20px;
          display: grid;
          grid-template-columns: 34px minmax(0, 1fr) 18px;
          align-items: center;
          gap: 9px;
          width: min(285px, calc(100vw - 24px));
          padding: 10px;
          box-sizing: border-box;
          border: 1px solid rgba(232, 230, 223, 0.65);
          border-radius: 11px;
          background: rgba(255, 255, 255, 0.78);
          box-shadow: 0 5px 20px rgba(38, 34, 27, 0.07);
          color: #292725;
          opacity: 0;
          visibility: hidden;
          transform: translate3d(-8px, 6px, 0);
          pointer-events: none;
          transition:
            opacity 300ms ease,
            transform 300ms ease,
            visibility 300ms ease;
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
        }

        .olive-live-notification.is-visible {
          opacity: 1;
          visibility: visible;
          transform: translate3d(0, 0, 0);
          pointer-events: auto;
        }

        .olive-live-notification__icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: rgba(242, 243, 236, 0.8);
          color: #596c52;
        }

        .olive-live-notification__content {
          min-width: 0;
        }

        .olive-live-notification__headline {
          margin: 0;
          color: rgba(52, 52, 47, 0.92);
          font-size: 11px;
          font-weight: 600;
          line-height: 1.4;
        }

        .olive-live-notification__product {
          margin: 2px 0 0;
          color: rgba(119, 118, 110, 0.9);
          font-size: 10px;
          line-height: 1.4;
          overflow-wrap: anywhere;
        }

        .olive-live-notification__brand {
          display: flex;
          align-items: center;
          gap: 5px;
          margin-top: 5px;
          color: rgba(133, 133, 121, 0.88);
          font-size: 8px;
          letter-spacing: 0.01em;
        }

        .olive-live-notification__dot {
          width: 5px;
          height: 5px;
          flex: 0 0 5px;
          border-radius: 50%;
          background: rgba(130, 148, 117, 0.9);
        }

        .olive-live-notification__close {
          display: flex;
          align-items: center;
          justify-content: center;
          align-self: start;
          width: 18px;
          height: 18px;
          padding: 0;
          border: 0;
          border-radius: 50%;
          background: transparent;
          color: rgba(145, 140, 130, 0.85);
          font-size: 16px;
          line-height: 1;
          cursor: pointer;
        }

        .olive-live-notification__close:hover {
          background: rgba(244, 242, 237, 0.8);
        }

        @media (max-width: 640px) {
          .olive-live-notification {
            left: 10px;
            bottom: calc(72px + env(safe-area-inset-bottom));
            width: min(270px, calc(100vw - 20px));
            grid-template-columns: 30px minmax(0, 1fr) 18px;
            gap: 8px;
            padding: 9px;
            border-radius: 10px;
          }

          .olive-live-notification__icon {
            width: 30px;
            height: 30px;
          }

          .olive-live-notification__headline {
            font-size: 10px;
          }

          .olive-live-notification__product {
            font-size: 9px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .olive-live-notification {
            transition: none;
          }
        }
      `}</style>
    </>
  );
}
