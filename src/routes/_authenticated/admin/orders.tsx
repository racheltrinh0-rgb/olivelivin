import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatVND } from "@/lib/format";
import { useEffect, useState } from "react";
import {
  Gift,
  Truck,
  Printer,
  Circle,
  Package,
  PackageCheck,
  XCircle,
  ChevronDown,
  ArrowLeft,
} from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/admin/orders")({
  component: OrdersAdminPage,
});

function getShippingMethodLabel(method: string | null | undefined) {
  if (method === "express" || method === "fast") return "Hỏa tốc";
  if (method === "standard") return "Tiêu chuẩn";
  return "—";
}

function OrdersAdminPage() {
  const navigate = useNavigate();
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [savingNoteId, setSavingNoteId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const ORDERS_PER_PAGE = 10;
  const [currentPage, setCurrentPage] = useState(1);

  const [dateFilter, setDateFilter] = useState<
  "today" |
  "yesterday" |
  "7days" |
  "30days" |
  "thisMonth" |
  "all"
>("all");

const [search, setSearch] = useState("");

const [statusFilter, setStatusFilter] = useState("all");

    const handlePrint = () => {
    const invoice = document.getElementById("invoice-print");

    if (!invoice) {
      alert("Không tìm thấy nội dung hóa đơn để in.");
      return;
    }

    // Print in the current tab instead of opening a popup/new window.
    // This avoids browser popup blockers and works better on mobile.
    const printRoot = document.createElement("div");
    printRoot.id = "olive-print-root";
    printRoot.innerHTML = invoice.innerHTML;

    const printStyle = document.createElement("style");
    printStyle.id = "olive-print-style";
    printStyle.textContent = `
      @page {
        size: A4;
        margin: 12mm;
      }

      html, body {
        margin: 0 !important;
        padding: 0 !important;
        background: #fff !important;
      }

      body > * {
        display: none !important;
      }

      #olive-print-root {
        display: block !important;
        width: 100%;
        max-width: 186mm;
        margin: 0 auto;
        color: #252820;
        background: #fff;
        font-family: Arial, Helvetica, sans-serif;
        font-size: 10px;
        line-height: 1.45;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }

      #olive-print-root *,
      #olive-print-root *::before,
      #olive-print-root *::after {
        visibility: visible !important;
        box-sizing: border-box;
      }

      #olive-print-root img {
        max-width: 100%;
      }

      #olive-print-root .break-inside-avoid,
      #olive-print-root [class*="break-inside-avoid"] {
        break-inside: avoid;
        page-break-inside: avoid;
      }
    `;

    document.head.appendChild(printStyle);
    document.body.appendChild(printRoot);

    const cleanup = () => {
      printStyle.remove();
      printRoot.remove();
      window.removeEventListener("afterprint", cleanup);
    };

    window.addEventListener("afterprint", cleanup);

    // Give the browser one frame to mount the print DOM, then open
    // the native print dialog.
    requestAnimationFrame(() => {
      setTimeout(() => {
        window.print();
      }, 80);
    });
  };
  async function saveAdminNote(
    orderId: string,
    note: string,
  ) {
    const savedNote = note.trim() || null;

    // Optimistic UI: close the editor and show the new note immediately.
    queryClient.setQueryData(
      ["admin-orders"],
      (current: any[] | undefined) => {
        if (!current) return current;

        return current.map((item) =>
          item.id === orderId
            ? { ...item, admin_note: savedNote }
            : item,
        );
      },
    );

    setEditingNoteId(null);
    setNoteDraft("");
    setSavingNoteId(orderId);

    try {
      const { error } = await supabase
        .from("orders")
        .update({
          admin_note: savedNote,
        })
        .eq("id", orderId);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error("SAVE ADMIN NOTE ERROR:", error);

      // Restore the server value only when the save actually fails.
      await refetch();

      const message =
        error instanceof Error
          ? error.message
          : "Không thể lưu ghi chú.";

      alert(message);
    } finally {
      setSavingNoteId(null);
    }
  }


async function updateOrderStatus(
  orderId: string,
  newStatus: string
) {
  const order = (data ?? []).find(
    (item) => item.id === orderId
  );

  if (!order) {
    alert("Không tìm thấy đơn hàng.");
    return;
  }

  const currentStatus = order.status;

  /*
   * =====================================================
   * CHỈ CHO PHÉP ĐI THEO ĐÚNG LUỒNG
   *
   * pending
   *    ↓
   * processing
   *    ↓
   * shipping
   *    ↓
   * completed
   *
   * cancelled là trạng thái kết thúc riêng.
   * =====================================================
   */

  const allowedTransitions: Record<string, string[]> = {
    pending: ["processing", "cancelled"],
    processing: ["shipping", "cancelled"],
    shipping: ["completed", "cancelled"],
    completed: [],
    cancelled: [],
  };

  const allowed = allowedTransitions[currentStatus] ?? [];

  if (!allowed.includes(newStatus)) {
    alert(
      `Không thể chuyển đơn hàng từ "${currentStatus}" sang "${newStatus}".`
    );
    return;
  }

  try {
    setUpdatingOrderId(orderId);

    /*
     * =====================================================
     * PROCESSING / COMPLETED
     *
     * Hai trạng thái này PHẢI đi qua Edge Function.
     *
     * processing:
     * - đổi status
     * - gửi email xác nhận đơn hàng
     *
     * completed:
     * - đổi status
     * - tạo voucher 5%
     * - gửi email giao hàng thành công
     * =====================================================
     */

    if (
      newStatus === "processing" ||
      newStatus === "completed"
    ) {
      const {
        data: functionResult,
        error: functionError,
      } = await supabase.functions.invoke(
        "admin-update-order-status",
        {
          body: {
            order_id: orderId,
            status: newStatus,
          },
        }
      );

      if (functionError) {
        throw new Error(functionError.message);
      }

      if (
        functionResult &&
        functionResult.success === false
      ) {
        throw new Error(
          functionResult.message ||
          "Không thể cập nhật trạng thái đơn hàng."
        );
      }

      console.log(
        "ADMIN UPDATE ORDER RESULT:",
        functionResult
      );
    }

    /*
     * =====================================================
     * SHIPPING / CANCELLED
     *
     * Hai trạng thái này chưa cần gửi email tự động
     * nên vẫn update trực tiếp.
     *
     * Có thêm điều kiện status hiện tại để tránh:
     * tab A + tab B cùng sửa một đơn.
     * =====================================================
     */

    else {
      const {
        error: updateError,
      } = await supabase
        .from("orders")
        .update({
          status: newStatus,
        })
        .eq("id", orderId)
        .eq("status", currentStatus);

      if (updateError) {
        throw updateError;
      }
    }

    await refetch();

  } catch (error) {
    console.error(
      "UPDATE ORDER STATUS ERROR:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "Không thể cập nhật trạng thái đơn hàng.";

    alert(message);

    await refetch();

  } finally {
    setUpdatingOrderId(null);
  }
}

  const {
    data,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["admin-orders"],

    // Keep the orders page fast when navigating away and back.
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,

    queryFn: async () => {
      // 1) Fetch orders once.
      const { data: orders, error: orderError } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", {
          ascending: false,
        });

      if (orderError) throw orderError;

      const orderRows = orders ?? [];
      const orderIds = orderRows.map((order) => order.id);

      if (orderRows.length === 0) {
        return [];
      }

      // 2) Fetch order items + vouchers in parallel.
      // The old version made one voucher request PER order,
      // which becomes slow as the number of orders grows.
      const voucherCodes = [
        ...new Set(
          orderRows
            .map((order) => order.shipping_voucher_code)
            .filter(Boolean),
        ),
      ];

      const [itemsResult, vouchersResult] = await Promise.all([
        supabase
          .from("order_items")
          .select("*")
          .in("order_id", orderIds),

        voucherCodes.length > 0
          ? supabase
              .from("vouchers")
              .select("code, value")
              .in("code", voucherCodes)
          : Promise.resolve({
              data: [],
              error: null,
            }),
      ]);

      if (itemsResult.error) throw itemsResult.error;
      if (vouchersResult.error) throw vouchersResult.error;

      const items = itemsResult.data ?? [];
      const vouchers = vouchersResult.data ?? [];

      const voucherMap = new Map(
        vouchers.map((voucher) => [
          voucher.code,
          Number(voucher.value ?? 0),
        ]),
      );

      const itemsByOrder = new Map<string, any[]>();

      for (const item of items) {
        const existing = itemsByOrder.get(item.order_id) ?? [];
        existing.push(item);
        itemsByOrder.set(item.order_id, existing);
      }

      // 3) Build the same result shape as before,
      // but entirely in memory — no per-order Supabase requests.
      return orderRows.map((order) => ({
        ...order,
        shipping_voucher_value: order.shipping_voucher_code
          ? voucherMap.get(order.shipping_voucher_code) ?? 0
          : 0,
        order_items: itemsByOrder.get(order.id) ?? [],
      }));
    },
  });

const keyword = search.trim().toLowerCase();

const filteredOrders = (data ?? []).filter((order) => {

  // Lọc theo ngày
  if (!isMatchDate(order.created_at)) {
    return false;
  }

  // Lọc theo trạng thái
  if (
    statusFilter !== "all" &&
    order.status !== statusFilter
  ) {
    return false;
  }

  // Không nhập từ khóa
  if (!keyword) {
    return true;
  }

  // Search
  return (
    order.id.toLowerCase().includes(keyword) ||
    order.full_name?.toLowerCase().includes(keyword) ||
    order.phone?.toLowerCase().includes(keyword) ||
    order.email?.toLowerCase().includes(keyword)
  );

});

const totalOrders = filteredOrders.length;

const totalPages = Math.max(1, Math.ceil(totalOrders / ORDERS_PER_PAGE));

useEffect(() => {
  setCurrentPage(1);
}, [search, dateFilter, statusFilter]);

useEffect(() => {
  if (currentPage > totalPages) {
    setCurrentPage(totalPages);
  }
}, [currentPage, totalPages]);

const paginatedOrders = filteredOrders.slice(
  (currentPage - 1) * ORDERS_PER_PAGE,
  currentPage * ORDERS_PER_PAGE
);

// Loading state is rendered only AFTER all hooks above have executed.
if (isLoading) {
  return (
    <div className="container-x min-w-0 max-w-full overflow-x-hidden py-10">
      Đang tải...
    </div>
  );
}

const revenueOrders = filteredOrders.filter(
  (order) => order.status !== "cancelled"
);

const totalRevenue = revenueOrders.reduce(
  (sum, order) => sum + Number(order.total ?? 0),
  0
);

const pendingOrders = filteredOrders.filter(
  order => order.status === "pending"
).length;

const processingOrders = filteredOrders.filter(
  order => order.status === "processing"
).length;

const completedOrders = filteredOrders.filter(
  order => order.status === "completed"
).length;

const cancelledOrders = filteredOrders.filter(
  order => order.status === "cancelled"
).length;


function getVietnamDate(date: string | Date) {
  return new Date(
    new Date(date).toLocaleString("en-US", {
      timeZone: "Asia/Ho_Chi_Minh",
    })
  );
}

function isMatchDate(orderDate: string) {
  if (dateFilter === "all") return true;

  const now = getVietnamDate(new Date());
  const created = getVietnamDate(orderDate);

  const startToday = new Date(now);
  startToday.setHours(0, 0, 0, 0);

  const endToday = new Date(now);
  endToday.setHours(23, 59, 59, 999);

  switch (dateFilter) {

    case "today":
      return created >= startToday && created <= endToday;

    case "yesterday": {

      const start = new Date(startToday);
      start.setDate(start.getDate() - 1);

      const end = new Date(endToday);
      end.setDate(end.getDate() - 1);

      return created >= start && created <= end;
    }

    case "7days": {

      const start = new Date(startToday);
      start.setDate(start.getDate() - 6);

      return created >= start;
    }

    case "30days": {

      const start = new Date(startToday);
      start.setDate(start.getDate() - 29);

      return created >= start;
    }

    case "thisMonth": {

      const start = new Date(now.getFullYear(), now.getMonth(), 1);

      return created >= start;
    }

    default:
      return true;
  }
}

  return (
    <div
      className="container-x w-full min-w-0 overflow-x-hidden py-8 sm:py-10"
      style={{ fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif" }}
    >
      {/* ================= BACK TO DASHBOARD ================= */}
      <button
        type="button"
        onClick={() => navigate({ to: "/account" })}
        className="mb-5 inline-flex h-9 items-center gap-2 rounded-full border border-[#E4E5E0] bg-white px-3.5 text-[11px] font-semibold text-[#555950] shadow-[0_1px_2px_rgba(0,0,0,0.025)] transition-all duration-200 hover:-translate-x-0.5 hover:border-[#B9D8C8] hover:bg-[#F7FBF8] hover:text-[#167A55] hover:shadow-sm"
      >
        <ArrowLeft
          className="h-3.5 w-3.5"
          strokeWidth={1.7}
        />
        Quay lại Dashboard
      </button>

      {/* ================= PAGE HEADER ================= */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-600" />
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
              Olive Living Admin
            </span>
          </div>

          <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl">
            Đơn hàng
          </h1>

          <p className="mt-2 text-sm text-neutral-500">
            Quản lý và theo dõi toàn bộ đơn hàng từ website Olive Living
          </p>
        </div>

        <div className="text-sm text-neutral-500">
          {filteredOrders.length} đơn hàng
        </div>
      </div>

      {/* ================= KPI ================= */}
      <div className="mb-7 grid min-w-0 grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        {[
          {
            label: "Tổng đơn hàng",
            value: filteredOrders.length,
            icon: Package,
            card: "border-[#DCEFE7] bg-[#F4FAF7]",
            iconBox: "bg-[#E2F3EA] text-[#3B8064]",
          },
          {
            label: "Doanh thu",
            value: formatVND(totalRevenue),
            icon: Gift,
            card: "border-[#EEE5D2] bg-[#FBF8F0]",
            iconBox: "bg-[#F5EEDB] text-[#927A42]",
          },
          {
            label: "Chờ xác nhận",
            value: pendingOrders,
            icon: Circle,
            card: "border-[#DDE8F0] bg-[#F5F9FC]",
            iconBox: "bg-[#E7F0F6] text-[#527892]",
          },
          {
            label: "Đang xử lý",
            value: processingOrders,
            icon: PackageCheck,
            card: "border-[#E4E0F0] bg-[#F8F6FB]",
            iconBox: "bg-[#ECE8F5] text-[#75698F]",
          },
          {
            label: "Hoàn thành",
            value: completedOrders,
            icon: PackageCheck,
            card: "border-[#DCEDE7] bg-[#F4FAF8]",
            iconBox: "bg-[#E3F3EC] text-[#4A806C]",
          },
          {
            label: "Đơn hủy",
            value: cancelledOrders,
            icon: XCircle,
            card: "border-[#F0DEDE] bg-[#FCF7F7]",
            iconBox: "bg-[#F6E8E8] text-[#9A6767]",
          },
        ].map((kpi) => {
          const Icon = kpi.icon;

          return (
            <div
              key={kpi.label}
              className={`group relative min-w-0 overflow-hidden rounded-2xl border p-4 shadow-[0_1px_2px_rgba(0,0,0,0.025)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm ${kpi.card}`}
            >
              <div
                className={`absolute right-4 top-4 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg opacity-60 transition-transform duration-200 group-hover:scale-105 ${kpi.iconBox}`}
              >
                <Icon className="h-3.5 w-3.5" strokeWidth={1.5} />
              </div>

              <div className="min-w-0 pr-1">
                <p className="max-w-[72%] text-[10px] font-semibold uppercase tracking-[0.08em] text-neutral-500/90">
                  {kpi.label}
                </p>

                <p
                  className={
                    kpi.label === "Doanh thu"
                      ? "mt-4 whitespace-nowrap text-[18px] font-bold leading-none tracking-tight text-neutral-900 sm:text-xl"
                      : "mt-4 whitespace-nowrap text-xl font-bold leading-none tracking-tight text-neutral-900 sm:text-2xl"
                  }
                >
                  {kpi.value}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ================= FILTER TOOLBAR ================= */}
      <div className="mb-5 w-full max-w-full rounded-[16px] border border-[#E8E8E3] bg-[#FBFBF9] px-3 py-3 shadow-[0_1px_2px_rgba(0,0,0,0.025)] sm:px-3.5">
        <div className="flex flex-col gap-2.5 md:flex-row md:items-center">
          <div className="relative min-w-0 flex-1">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm mã đơn, tên khách, SĐT hoặc email..."
              className="h-9 w-full rounded-[10px] border border-[#E4E5E0] bg-white px-3.5 text-[12px] text-[#30332D] outline-none transition placeholder:text-[#A1A39C] focus:border-[#B9D8C8] focus:ring-2 focus:ring-[#DFF0E7]"
            />
          </div>

          <div className="flex shrink-0 gap-2">
            <select
              value={dateFilter}
              onChange={(e) =>
                setDateFilter(e.target.value as any)
              }
              className="h-9 min-w-[138px] rounded-[10px] border border-[#E4E5E0] bg-white px-3 text-[12px] font-medium text-[#4B4E47] outline-none transition focus:border-[#B9D8C8] focus:ring-2 focus:ring-[#DFF0E7]"
            >
              <option value="today">Hôm nay</option>
              <option value="yesterday">Hôm qua</option>
              <option value="7days">7 ngày gần đây</option>
              <option value="30days">30 ngày gần đây</option>
              <option value="thisMonth">Tháng này</option>
              <option value="all">Tất cả thời gian</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 min-w-[148px] rounded-[10px] border border-[#E4E5E0] bg-white px-3 text-[12px] font-medium text-[#4B4E47] outline-none transition focus:border-[#B9D8C8] focus:ring-2 focus:ring-[#DFF0E7]"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="pending">Chờ xác nhận</option>
              <option value="processing">Đã xử lý</option>
              <option value="shipping">Đang giao</option>
              <option value="completed">Hoàn thành</option>
              <option value="cancelled">Đã hủy</option>
            </select>
          </div>
        </div>
      </div>

      {/* ================= ORDERS TABLE ================= */}
      <section className="w-full overflow-hidden rounded-[20px] border border-[#E7E7E2] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        {/* Desktop / tablet: responsive grid. No horizontal scrolling. */}
        <div className="hidden md:block">
          <div
            className="grid items-center gap-x-3 border-b border-[#ECECE7] bg-[#FAFAF7] px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.13em] text-[#8A8D84]"
            style={{
              gridTemplateColumns:
                "minmax(0,1.35fr) minmax(0,1.05fr) minmax(0,.95fr) minmax(0,.82fr) minmax(0,.9fr) minmax(0,.98fr) minmax(0,1.05fr) minmax(0,1fr) minmax(64px,.55fr)",
            }}
          >
            <div>Đơn hàng</div>
            <div>Khách hàng</div>
            <div>Thanh toán</div>
            <div>Hình thức VC</div>
            <div>Voucher</div>
            <div className="text-right pr-2">Tổng tiền</div>
            <div className="pl-1">Trạng thái</div>
            <div>Ghi chú</div>
            <div className="text-right">Thao tác</div>
          </div>

          <div>
            {filteredOrders.length === 0 ? (
              <div className="px-5 py-16 text-center text-sm text-[#8A8D84]">
                Không tìm thấy đơn hàng phù hợp.
              </div>
            ) : (
              paginatedOrders.map((order) => (
                <div
                  key={order.id}
                  className={`grid items-center gap-x-3 border-b border-[#F0F0EC] px-5 py-3.5 transition-colors last:border-0 ${
                    order.status === "pending"
                      ? "bg-[#F7FBF8] hover:bg-[#F1F8F3]"
                      : "bg-white hover:bg-[#FAFAF7]"
                  }`}
                  style={{
                    gridTemplateColumns:
                      "minmax(0,1.35fr) minmax(0,1.05fr) minmax(0,.95fr) minmax(0,.82fr) minmax(0,.9fr) minmax(0,.98fr) minmax(0,1.05fr) minmax(0,1fr) minmax(64px,.55fr)",
                  }}
                >
                  {/* Order */}
                  <div className="min-w-0 pr-2">
                    <p className="truncate font-mono text-[11px] font-semibold tracking-tight text-[#252820]">
                      #{order.id.slice(0, 8)}
                    </p>
                    <p className="mt-1 truncate text-[10px] text-[#9A9D95]">
                      {new Date(order.created_at).toLocaleDateString("vi-VN")}
                      {" · "}
                      {new Date(order.created_at).toLocaleTimeString("vi-VN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>

                  {/* Customer */}
                  <div className="min-w-0 pr-2">
                    <p className="truncate text-[12px] font-semibold text-[#252820]">
                      {order.full_name || "—"}
                    </p>
                    <p className="mt-1 truncate text-[10px] text-[#8A8D84]">
                      {order.phone || order.email || "—"}
                    </p>
                  </div>

                  {/* Payment */}
                  <div className="min-w-0 pr-1">
                    <span className="inline-flex max-w-full items-center rounded-full border border-[#E8E8E3] bg-[#F7F7F4] px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.08em] text-[#62665D]">
                      {order.payment_method || "—"}
                    </span>
                    <div className="mt-1.5 truncate">
                      {order.payment_method?.toLowerCase() === "paypal" ||
                      order.status === "completed" ||
                      order.payment_status === "paid" ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[#16835B]">
                          <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-[#DDF6EA] text-[9px]">✓</span>
                          Đã thanh toán
                        </span>
                      ) : order.payment_status === "partial" ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[#A36A00]">
                          <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-[#FFF0C7] text-[9px]">◐</span>
                          Một phần
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[#858980]">
                          <span className="h-3.5 w-3.5 shrink-0 rounded-full border border-[#B8BBB3]" />
                          Chưa thanh toán
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Shipping method */}
                  <div className="min-w-0 pr-1">
                    <span
                      className={`inline-flex max-w-full items-center rounded-full border px-2 py-1 text-[9px] font-semibold ${
                        order.shipping_method === "express" || order.shipping_method === "fast"
                          ? "border-[#D7D9FA] bg-[#F4F4FF] text-[#6265A5]"
                          : order.shipping_method === "standard"
                            ? "border-[#E8E8E3] bg-[#F7F7F4] text-[#62665D]"
                            : "border-[#E8E8E3] bg-[#FAFAF7] text-[#9A9D95]"
                      }`}
                    >
                      {getShippingMethodLabel(order.shipping_method)}
                    </span>
                  </div>

                  {/* Voucher */}
                  <div className="min-w-0 pr-1">
                    {order.discount_voucher_code ? (
                      <div className="truncate text-[10px] font-medium text-[#267A5C]">
                        <span className="mr-1">•</span>{order.discount_voucher_code}
                      </div>
                    ) : null}
                    {order.shipping_voucher_code ? (
                      <div className="mt-1 truncate text-[10px] font-medium text-[#3575A8]">
                        <span className="mr-1">•</span>{order.shipping_voucher_code}
                      </div>
                    ) : null}
                    {!order.discount_voucher_code && !order.shipping_voucher_code && (
                      <span className="text-[10px] text-[#A1A39C]">—</span>
                    )}
                  </div>

                  {/* Total */}
                  <div className="min-w-0 border-l border-[#EEEEEA] pl-3 pr-3 text-right">
                    <span className="block truncate whitespace-nowrap text-[12px] font-semibold tabular-nums text-[#252820]">
                      {formatVND(Number(order.total ?? 0))}
                    </span>
                  </div>

                  {/* Status */}
                  <div className="min-w-0 border-l border-[#EEEEEA] pl-3 pr-2">
                    <Select
                      value={order.status}
                      disabled={updatingOrderId === order.id}
                      onValueChange={(value) => updateOrderStatus(order.id, value)}
                    >
                      <SelectTrigger
                        className={`h-8 w-full min-w-0 rounded-full border px-3 text-[10px] font-semibold shadow-none focus:ring-2 focus:ring-emerald-500/10 ${
                          order.status === "pending"
                            ? "border-[#BFE6D2] bg-[#F0FAF5] text-[#167A55]"
                            : order.status === "processing"
                              ? "border-[#CBE1F2] bg-[#F1F7FC] text-[#3B6F95]"
                              : order.status === "shipping"
                                ? "border-[#D7D9FA] bg-[#F4F4FF] text-[#6265A5]"
                                : order.status === "completed"
                                  ? "border-[#BFE6D2] bg-[#F0FAF5] text-[#167A55]"
                                  : "border-[#F0CACA] bg-[#FFF5F5] text-[#B34C4C]"
                        }`}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {order.status === "pending" && (
                          <>
                            <SelectItem value="pending" disabled>Chờ xác nhận</SelectItem>
                            <SelectItem value="processing">Xử lý đơn hàng</SelectItem>
                            <SelectItem value="cancelled">Hủy đơn</SelectItem>
                          </>
                        )}
                        {order.status === "processing" && (
                          <>
                            <SelectItem value="processing" disabled>Đã xử lý</SelectItem>
                            <SelectItem value="shipping">Đang giao</SelectItem>
                            <SelectItem value="cancelled">Hủy đơn</SelectItem>
                          </>
                        )}
                        {order.status === "shipping" && (
                          <>
                            <SelectItem value="shipping" disabled>Đang giao</SelectItem>
                            <SelectItem value="completed">Hoàn thành</SelectItem>
                            <SelectItem value="cancelled">Hủy đơn</SelectItem>
                          </>
                        )}
                        {order.status === "completed" && (
                          <SelectItem value="completed" disabled>Hoàn thành</SelectItem>
                        )}
                        {order.status === "cancelled" && (
                          <SelectItem value="cancelled" disabled>Đã hủy</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Admin note */}
                  <div className="min-w-0 pr-2">
                    {editingNoteId === order.id ? (
                      <div className="flex min-w-0 items-center gap-1">
                        <input
                          autoFocus
                          value={noteDraft}
                          onChange={(e) => setNoteDraft(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              void saveAdminNote(order.id, noteDraft);
                            }
                            if (e.key === "Escape") {
                              setEditingNoteId(null);
                              setNoteDraft("");
                            }
                          }}
                          className="h-8 min-w-0 w-full rounded-lg border border-[#C8DCCF] bg-white px-2.5 text-[10px] text-[#454941] outline-none focus:border-[#7EAE91] focus:ring-2 focus:ring-[#7EAE91]/10"
                          placeholder="Nhập ghi chú..."
                          disabled={savingNoteId === order.id}
                        />
                        <button
                          type="button"
                          onClick={() => void saveAdminNote(order.id, noteDraft)}
                          disabled={savingNoteId === order.id}
                          className="h-8 shrink-0 rounded-lg bg-[#176B4B] px-2 text-[10px] font-semibold text-white hover:bg-[#12583E] disabled:opacity-50"
                        >
                          {savingNoteId === order.id ? "..." : "Lưu"}
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingNoteId(order.id);
                          setNoteDraft(order.admin_note ?? "");
                        }}
                        className="group flex w-full min-w-0 items-center rounded-lg border border-dashed border-[#DCDDD7] bg-[#FCFCFA] px-2.5 py-1.5 text-left transition hover:border-[#B8CCBE] hover:bg-[#F6FAF7]"
                        title={order.admin_note || "Thêm ghi chú"}
                      >
                        <span className="block min-w-0 truncate text-[10px] font-medium text-[#6E7269] group-hover:text-[#176B4B]">
                          {order.admin_note || "+ Thêm ghi chú"}
                        </span>
                      </button>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex min-w-0 items-center justify-end">
                    <button
                      type="button"
                      onClick={() => setSelectedOrder(order)}
                      className="inline-flex h-8 items-center rounded-full border border-[#E4E5DF] bg-white px-3 text-[10px] font-semibold text-[#454941] transition hover:border-[#AFCFBD] hover:bg-[#F4F9F6] hover:text-[#167A55]"
                    >
                      Xem
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Small screens: compact order cards — no horizontal scrolling */}
        <div className="md:hidden">
          {filteredOrders.length === 0 ? (
            <div className="px-5 py-16 text-center text-sm text-[#8A8D84]">
              Không tìm thấy đơn hàng phù hợp.
            </div>
          ) : (
            <div className="divide-y divide-[#F0F0EC]">
              {paginatedOrders.map((order) => (
                <article
                  key={order.id}
                  className={`p-4 ${
                    order.status === "pending"
                      ? "bg-[#F7FBF8]"
                      : "bg-white"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-mono text-[11px] font-semibold text-[#252820]">
                        #{order.id.slice(0, 8)}
                      </p>
                      <p className="mt-1 truncate text-sm font-semibold text-[#252820]">
                        {order.full_name || "—"}
                      </p>
                      <p className="mt-0.5 text-[11px] text-[#8A8D84]">
                        {order.phone || order.email || "—"}
                      </p>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="text-sm font-semibold tabular-nums text-[#252820]">
                        {formatVND(Number(order.total ?? 0))}
                      </p>
                      <p className="mt-1 text-[10px] text-[#9A9D95]">
                        {new Date(order.created_at).toLocaleDateString("vi-VN")}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <div className="rounded-xl border border-[#E8E8E3] bg-[#FAFAF7] px-3 py-2.5">
                      <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[#9A9D95]">
                        Thanh toán
                      </p>
                      <p className="mt-1 text-[11px] font-semibold uppercase text-[#454941]">
                        {order.payment_method || "—"}
                      </p>
                      <p className="mt-1 text-[10px] text-[#16835B]">
                        {order.payment_method?.toLowerCase() === "paypal" ||
                        order.status === "completed" ||
                        order.payment_status === "paid"
                          ? "Đã thanh toán"
                          : order.payment_status === "partial"
                            ? "Thanh toán một phần"
                            : "Chưa thanh toán"}
                      </p>
                    </div>

                    <div className="rounded-xl border border-[#E8E8E3] bg-[#FAFAF7] px-3 py-2.5">
                      <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[#9A9D95]">
                        Voucher
                      </p>
                      <p className="mt-1 truncate text-[10px] font-medium text-[#267A5C]">
                        {order.discount_voucher_code ||
                          order.shipping_voucher_code ||
                          "Không có"}
                      </p>
                    </div>

                    <div className="col-span-2 rounded-xl border border-[#E8E8E3] bg-[#FAFAF7] px-3 py-2.5">
                      <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[#9A9D95]">
                        Hình thức vận chuyển
                      </p>
                      <p className="mt-1 text-[11px] font-semibold text-[#454941]">
                        {getShippingMethodLabel(order.shipping_method)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <Select
                      value={order.status}
                      disabled={updatingOrderId === order.id}
                      onValueChange={(value) =>
                        updateOrderStatus(order.id, value)
                      }
                    >
                      <SelectTrigger
                        className={`h-9 flex-1 rounded-full border px-3 text-[11px] font-semibold shadow-none ${
                          order.status === "pending"
                            ? "border-[#BFE6D2] bg-[#F0FAF5] text-[#167A55]"
                            : order.status === "processing"
                              ? "border-[#CBE1F2] bg-[#F1F7FC] text-[#3B6F95]"
                              : order.status === "shipping"
                                ? "border-[#D7D9FA] bg-[#F4F4FF] text-[#6265A5]"
                                : order.status === "completed"
                                  ? "border-[#BFE6D2] bg-[#F0FAF5] text-[#167A55]"
                                  : "border-[#F0CACA] bg-[#FFF5F5] text-[#B34C4C]"
                        }`}
                      >
                        <SelectValue />
                      </SelectTrigger>

                      <SelectContent>
                        {order.status === "pending" && (
                          <>
                            <SelectItem value="pending" disabled>
                              Chờ xác nhận
                            </SelectItem>
                            <SelectItem value="processing">
                              Xử lý đơn hàng
                            </SelectItem>
                            <SelectItem value="cancelled">Hủy đơn</SelectItem>
                          </>
                        )}
                        {order.status === "processing" && (
                          <>
                            <SelectItem value="processing" disabled>
                              Đã xử lý
                            </SelectItem>
                            <SelectItem value="shipping">Đang giao</SelectItem>
                            <SelectItem value="cancelled">Hủy đơn</SelectItem>
                          </>
                        )}
                        {order.status === "shipping" && (
                          <>
                            <SelectItem value="shipping" disabled>
                              Đang giao
                            </SelectItem>
                            <SelectItem value="completed">
                              Hoàn thành
                            </SelectItem>
                            <SelectItem value="cancelled">Hủy đơn</SelectItem>
                          </>
                        )}
                        {order.status === "completed" && (
                          <SelectItem value="completed" disabled>
                            Hoàn thành
                          </SelectItem>
                        )}
                        {order.status === "cancelled" && (
                          <SelectItem value="cancelled" disabled>
                            Đã hủy
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>

                    <button
                      type="button"
                      onClick={() => setSelectedOrder(order)}
                      className="h-9 rounded-full border border-[#E4E5DF] bg-white px-4 text-[11px] font-semibold text-[#454941] hover:border-[#AFCFBD] hover:bg-[#F4F9F6] hover:text-[#167A55]"
                    >
                      Chi tiết
                    </button>
                  </div>

                  {order.admin_note ? (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingNoteId(order.id);
                        setNoteDraft(order.admin_note ?? "");
                      }}
                      className="mt-3 block w-full truncate rounded-xl border border-dashed border-[#DCDDD7] bg-white px-3 py-2 text-left text-[10px] text-[#777B72]"
                    >
                      <span className="font-semibold text-[#555950]">
                        Ghi chú:
                      </span>{" "}
                      {order.admin_note}
                    </button>
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ================= PAGINATION ================= */}
      {filteredOrders.length > 0 && (
        <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-neutral-200 bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-neutral-500">
            Hiển thị <span className="font-semibold text-neutral-800">
              {(currentPage - 1) * ORDERS_PER_PAGE + 1}
            </span>
            –
            <span className="font-semibold text-neutral-800">
              {Math.min(currentPage * ORDERS_PER_PAGE, filteredOrders.length)}
            </span>
            trong <span className="font-semibold text-neutral-800">{filteredOrders.length}</span> đơn hàng
          </p>

          <div className="flex items-center justify-center gap-1.5">
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={currentPage === 1}
              className="inline-flex h-9 min-w-9 items-center justify-center rounded-xl border border-neutral-200 bg-white px-3 text-sm font-medium text-neutral-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              ←
            </button>

            {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
              <button
                key={page}
                type="button"
                onClick={() => setCurrentPage(page)}
                className={
                  `inline-flex h-9 min-w-9 items-center justify-center rounded-xl px-3 text-sm font-semibold transition ${
                    currentPage === page
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "border border-neutral-200 bg-white text-neutral-700 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
                  }`
                }
              >
                {page}
              </button>
            ))}

            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              disabled={currentPage === totalPages}
              className="inline-flex h-9 min-w-9 items-center justify-center rounded-xl border border-neutral-200 bg-white px-3 text-sm font-medium text-neutral-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              →
            </button>
          </div>
        </div>
      )}

      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#171A17]/45 p-3 backdrop-blur-[2px] sm:p-5">
          <div
            className="
              flex w-full max-w-[760px] h-[calc(100dvh-12px)] max-h-[calc(100dvh-12px)] flex-col overflow-hidden sm:h-[calc(100vh-24px)] sm:max-h-[calc(100vh-24px)]
              rounded-[22px] border border-[#E7E7E2] bg-[#FBFBF9]
              shadow-[0_24px_80px_rgba(24,28,24,0.18)]
              print:max-h-none print:max-w-[210mm] print:overflow-visible
              print:rounded-none print:border-0 print:bg-white print:shadow-none
            "
          >
            {/* Modal header */}
            <div className="flex shrink-0 items-center justify-between border-b border-[#E8E8E3] bg-white px-3.5 py-2.5 sm:px-6 sm:py-4">
              <div className="min-w-0">
                <p className="text-[8px] font-semibold uppercase tracking-[0.15em] text-[#8A8D84] sm:text-[10px]">
                  Order details
                </p>
                <div className="mt-0.5 flex items-center gap-1.5">
                  <h2 className="font-serif text-[18px] leading-none tracking-[-0.02em] text-[#252820] sm:text-[22px]">
                    Đơn hàng
                  </h2>
                  <span className="font-mono text-[11px] font-semibold text-[#777B72]">
                    #{selectedOrder.id.slice(0, 8)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="inline-flex h-8 items-center gap-1.5 rounded-full border border-[#E2E3DD] bg-white px-3 text-[10px] font-semibold text-[#555950] transition hover:border-[#B9D8C8] hover:bg-[#F5FAF7] hover:text-[#167A55]"
                >
                  <Printer className="h-3.5 w-3.5" strokeWidth={1.7} />
                  In hóa đơn
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  aria-label="Đóng"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-transparent text-[#8A8D84] transition hover:border-[#E5E5E0] hover:bg-[#F6F6F3] hover:text-[#30332D]"
                >
                  <span className="text-lg leading-none">×</span>
                </button>
              </div>
            </div>

            <div
              id="invoice-print"
              className="min-h-0 flex-1 overflow-y-auto px-3 py-2.5 sm:overflow-hidden sm:px-5 sm:py-3 print:overflow-visible print:px-0 print:py-0"
            >
              {/* Brand / invoice identity */}
              <div className="rounded-[12px] border border-[#E5E6E0] bg-white px-3 py-2.5 sm:px-4 sm:py-3">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <img
                      src="/branding/olive-logo.png"
                      alt="Olive Living"
                      className="h-7 w-auto shrink-0 object-contain sm:h-9"
                    />

                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold tracking-[0.08em] text-[#252820] sm:text-[13px]">
                        OLIVE LIVING
                      </p>
                      <p className="mt-0.5 text-[10px] text-[#8A8D84]">
                        Modern living · Premium decor
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[#9A9D95]">
                      Invoice
                    </p>
                    <p className="mt-1 font-mono text-[11px] font-semibold text-[#252820]">
                      #{selectedOrder.id.slice(0, 8)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Customer / delivery */}
              <section className="mt-2.5 rounded-[12px] border border-[#E5E6E0] bg-white p-3 sm:mt-3 sm:rounded-[14px] sm:p-4">
                <div className="mb-1.5 flex items-center justify-between">
                  <h3 className="text-[9px] font-semibold uppercase tracking-[0.13em] text-[#555950] sm:text-[11px]">
                    Customer & delivery
                  </h3>

                  <span
                    className={`inline-flex rounded-full border px-2 py-0.5 text-[8px] font-semibold sm:px-2.5 sm:py-1 sm:text-[9px] ${
                      selectedOrder.status === "completed"
                        ? "border-[#BFE6D2] bg-[#F0FAF5] text-[#167A55]"
                        : selectedOrder.status === "cancelled"
                          ? "border-[#F0CACA] bg-[#FFF5F5] text-[#B34C4C]"
                          : "border-[#DDE8F0] bg-[#F5F9FC] text-[#527892]"
                    }`}
                  >
                    {selectedOrder.status === "pending"
                      ? "Chờ xác nhận"
                      : selectedOrder.status === "processing"
                        ? "Đã xử lý"
                        : selectedOrder.status === "shipping"
                          ? "Đang giao"
                          : selectedOrder.status === "completed"
                            ? "Hoàn thành"
                            : "Đã hủy"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:gap-x-7 sm:gap-y-2.5">
                  <div>
                    <p className="text-[7px] font-semibold uppercase tracking-[0.11em] text-[#A0A39B] sm:text-[9px]">
                      Khách hàng
                    </p>
                    <p className="mt-0.5 truncate text-[10px] font-semibold text-[#30332D] sm:text-[11px]">
                      {selectedOrder.full_name || "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-[7px] font-semibold uppercase tracking-[0.11em] text-[#A0A39B] sm:text-[9px]">
                      Số điện thoại
                    </p>
                    <p className="mt-0.5 truncate text-[10px] text-[#454941] sm:text-[11px]">
                      {selectedOrder.phone || "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-[7px] font-semibold uppercase tracking-[0.11em] text-[#A0A39B] sm:text-[9px]">
                      Email
                    </p>
                    <p className="mt-0.5 truncate text-[10px] text-[#454941] sm:text-[11px]">
                      {selectedOrder.email || "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-[7px] font-semibold uppercase tracking-[0.11em] text-[#A0A39B] sm:text-[9px]">
                      Thanh toán
                    </p>
                    <p className="mt-0.5 truncate text-[10px] font-semibold uppercase text-[#454941] sm:text-[11px]">
                      {selectedOrder.payment_method || "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-[7px] font-semibold uppercase tracking-[0.11em] text-[#A0A39B] sm:text-[9px]">
                      Hình thức vận chuyển
                    </p>
                    <p className="mt-0.5 truncate text-[10px] font-semibold text-[#454941] sm:text-[11px]">
                      {getShippingMethodLabel(selectedOrder.shipping_method)}
                    </p>
                  </div>

                  <div className="col-span-2 border-t border-[#F1F1ED] pt-2">
                    <p className="text-[7px] font-semibold uppercase tracking-[0.11em] text-[#A0A39B] sm:text-[9px]">
                      Địa chỉ giao hàng
                    </p>
                    <p className="mt-0.5 text-[10px] leading-4 text-[#454941] sm:text-[11px] sm:leading-4.5">
                      {selectedOrder.address || "—"}
                      {selectedOrder.ward ? `, ${selectedOrder.ward}` : ""}
                      {selectedOrder.district ? `, ${selectedOrder.district}` : ""}
                      {selectedOrder.city ? `, ${selectedOrder.city}` : ""}
                    </p>
                  </div>

                  {selectedOrder.notes ? (
                    <div className="col-span-2 rounded-lg bg-[#FAFAF7] px-2.5 py-1.5 sm:px-3 sm:py-2">
                      <p className="text-[7px] font-semibold uppercase tracking-[0.11em] text-[#A0A39B] sm:text-[9px]">
                        Ghi chú khách hàng
                      </p>
                      <p className="mt-0.5 truncate text-[9px] leading-4 text-[#555950] sm:text-[10px]">
                        {selectedOrder.notes}
                      </p>
                    </div>
                  ) : null}
                </div>
              </section>

              {/* Products */}
              <section className="mt-2.5 rounded-[14px] border border-[#E5E6E0] bg-white p-3.5 sm:p-4">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#555950]">
                    Sản phẩm
                  </h3>
                  <span className="text-[10px] text-[#9A9D95]">
                    {selectedOrder.order_items?.length ?? 0} sản phẩm
                  </span>
                </div>

                <div className="divide-y divide-[#F0F0EC]">
                  {selectedOrder.order_items?.map((item: any) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0 break-inside-avoid page-break-inside-avoid"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <img
                          src={item.product_image}
                          alt={item.product_name}
                          className="h-8 w-8 shrink-0 rounded-[8px] sm:h-9 sm:w-9 border border-[#ECECE7] object-cover"
                        />

                        <div className="min-w-0">
                          <p className="line-clamp-1 text-[10px] font-semibold leading-4 text-[#30332D]">
                            {item.product_name}
                          </p>
                          <p className="mt-0.5 text-[8px] leading-3 text-[#8A8D84] sm:text-[9px]">
                            {item.color_name ?? "—"} · Qty {item.quantity}
                          </p>
                        </div>
                      </div>

                      <p className="shrink-0 text-[10px] font-semibold tabular-nums text-[#30332D]">
                        {formatVND(item.unit_price)}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Payment summary */}
              <section className="mt-2.5 rounded-[14px] border border-[#E5E6E0] bg-white p-3.5 sm:p-4">
                <div className="mb-2">
                  <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#555950]">
                    Order summary
                  </h3>
                </div>

                <div className="space-y-2 text-[10px]">
                  <div className="flex items-center justify-between text-[#666A62]">
                    <span>Tạm tính</span>
                    <span className="font-medium tabular-nums text-[#30332D]">
                      {formatVND(Number(selectedOrder.subtotal ?? 0))}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[#666A62]">
                    <span>Phí vận chuyển</span>
                    <span className="font-medium tabular-nums text-[#30332D]">
                      {formatVND(Number(selectedOrder.shipping_fee ?? 0))}
                    </span>
                  </div>

                  {selectedOrder.discount_voucher_code ? (
                    <div className="flex items-center justify-between border-t border-[#F0F0EC] pt-2.5">
                      <div className="min-w-0">
                        <p className="text-[#777B72]">Voucher giảm giá</p>
                        <p className="mt-0.5 truncate font-medium text-[#454941]">
                          {selectedOrder.discount_voucher_code}
                        </p>
                      </div>
                      <span className="font-semibold tabular-nums text-[#16835B]">
                        -{formatVND(Number(selectedOrder.discount_amount ?? 0))}
                      </span>
                    </div>
                  ) : null}

                  {selectedOrder.shipping_voucher_code ? (
                    <div className="flex items-center justify-between">
                      <div className="min-w-0">
                        <p className="text-[#777B72]">Voucher Freeship</p>
                        <p className="mt-0.5 truncate font-medium text-[#454941]">
                          {selectedOrder.shipping_voucher_code}
                        </p>
                      </div>
                      <span className="font-semibold tabular-nums text-[#16835B]">
                        -{formatVND(Number(selectedOrder.shipping_voucher_value ?? 0))}
                      </span>
                    </div>
                  ) : null}
                </div>

                <div className="mt-3 flex items-end justify-between rounded-[12px] bg-[#F3F7F4] px-4 py-3.5">
                  <div>
                    <p className="text-[8px] font-semibold uppercase tracking-[0.12em] text-[#7C8178] sm:text-[9px]">
                      Total
                    </p>
                    <p className="mt-0.5 text-[9px] text-[#8A8D84]">
                      Đã gồm phí ship và ưu đãi
                    </p>
                  </div>

                  <p className="text-[17px] font-semibold tracking-tight tabular-nums text-[#1F5E47] sm:text-[19px]">
                    {formatVND(Number(selectedOrder.total ?? 0))}
                  </p>
                </div>
              </section>

              {/* Footer */}
              <div className="px-2 pb-0 pt-2.5 text-center sm:pt-3">
                <p className="mx-auto w-full whitespace-nowrap text-center text-[11px] font-medium leading-5 text-[#3D413A] sm:text-[15px]">
                  Cảm ơn Quý khách đã mua sắm tại Olive Living.
                </p>
                <p className="mx-auto mt-1 max-w-[300px] text-[8px] leading-4 text-[#8A8D84] sm:max-w-none sm:text-[9px]">
                  Chúng tôi sẽ liên hệ xác nhận đơn hàng trong thời gian sớm nhất.
                </p>
                <p className="mt-2 text-[8px] tracking-[0.12em] text-[#A0A39B]">
                  OLIVELIVINGVN.COM · MODERN LIVING · PREMIUM DECOR
                </p>
              </div>
            </div>
          </div>
        </div>
      )}


    </div>
  );
}