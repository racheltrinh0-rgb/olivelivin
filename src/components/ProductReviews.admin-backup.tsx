import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search, Star, CheckCircle2, XCircle, Clock3, RefreshCw, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/reviews")({ component: AdminReviewsPage });
type ReviewStatus = "pending" | "approved" | "rejected";
type ProductReview = {
  id: string; product_id: string; rating: number; reviewer_name: string;
  reviewer_email: string; review_text: string; photo_urls: string[] | null;
  status: ReviewStatus; created_at: string;
};
type ProductRow = { id: string; name: string };
const statusLabels: Record<ReviewStatus, string> = { pending: "Chờ duyệt", approved: "Đã duyệt", rejected: "Đã từ chối" };
function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}
function AdminReviewsPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<"all" | ReviewStatus>("pending");
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const reviewsQuery = useQuery({
    queryKey: ["admin-product-reviews"],
    queryFn: async () => {
      const { data, error } = await supabase.from("product_reviews")
        .select("id, product_id, rating, reviewer_name, reviewer_email, review_text, photo_urls, status, created_at")
        .order("created_at", { ascending: false }).limit(500);
      if (error) throw error;
      return (data ?? []) as ProductReview[];
    },
  });
  const productsQuery = useQuery({
    queryKey: ["admin-review-products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("id, name");
      if (error) throw error;
      return (data ?? []) as ProductRow[];
    },
  });
  const productNames = useMemo(() => new Map((productsQuery.data ?? []).map((p) => [p.id, p.name])), [productsQuery.data]);
  const reviews = reviewsQuery.data ?? [];
  const counts = useMemo(() => ({
    all: reviews.length,
    pending: reviews.filter((r) => r.status === "pending").length,
    approved: reviews.filter((r) => r.status === "approved").length,
    rejected: reviews.filter((r) => r.status === "rejected").length,
  }), [reviews]);
  const visibleReviews = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase();
    return reviews.filter((r) => {
      const statusMatches = statusFilter === "all" || r.status === statusFilter;
      const product = productNames.get(r.product_id) ?? "";
      const searchMatches = !needle || [r.reviewer_name, r.reviewer_email, r.review_text, product].some((v) => v.toLocaleLowerCase().includes(needle));
      return statusMatches && searchMatches;
    });
  }, [reviews, statusFilter, search, productNames]);
  async function updateStatus(review: ProductReview, status: ReviewStatus) {
    if (review.status === status) return;
    setBusyId(review.id);
    try {
      const { error } = await supabase.from("product_reviews").update({ status }).eq("id", review.id);
      if (error) throw error;
      toast.success(status === "approved" ? "Đã duyệt đánh giá." : status === "rejected" ? "Đã từ chối đánh giá." : "Đã chuyển về chờ duyệt.");
      await queryClient.invalidateQueries({ queryKey: ["admin-product-reviews"] });
    } catch (error) {
      console.error("Update review status failed:", error);
      toast.error("Không cập nhật được trạng thái. Hãy kiểm tra quyền UPDATE/RLS của bảng product_reviews trong Supabase.");
    } finally { setBusyId(null); }
  }
  const loading = reviewsQuery.isLoading || productsQuery.isLoading;
  const loadError = reviewsQuery.error || productsQuery.error;
  return <div className="min-h-screen bg-[#F7F6F2] px-4 py-6 sm:px-6 lg:px-8 lg:py-8"><div className="mx-auto max-w-[1500px]">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-[10px] font-medium uppercase tracking-[0.24em] text-[#6F8B5E]">OLIVE LIVING · CATALOG</p><h1 className="mt-2 text-2xl font-semibold tracking-tight text-[#252824] sm:text-3xl">Đánh giá sản phẩm</h1><p className="mt-2 text-sm text-neutral-500">Xem, kiểm duyệt và quản lý phản hồi của khách hàng.</p></div>
      <button type="button" onClick={() => void queryClient.invalidateQueries({ queryKey: ["admin-product-reviews"] })} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[#E6E2DA] bg-white px-4 text-sm text-neutral-700 transition hover:bg-[#FAF9F6]"><RefreshCw size={15}/> Làm mới</button></div>
    <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{([ ["Tất cả đánh giá", counts.all, "all"], ["Chờ duyệt", counts.pending, "pending"], ["Đã duyệt", counts.approved, "approved"], ["Đã từ chối", counts.rejected, "rejected"] ] as const).map(([label, count, key]) => <button key={key} type="button" onClick={() => setStatusFilter(key)} className={`rounded-2xl border p-4 text-left transition ${statusFilter === key ? "border-[#B9C9AE] bg-[#EDF2EA]" : "border-[#E7E4DD] bg-white hover:border-[#D9DED4]"}`}><p className="text-xs text-neutral-500">{label}</p><p className="mt-2 text-2xl font-semibold text-[#30332F]">{count}</p></button>)}</div>
    <div className="mt-5 rounded-2xl border border-[#E7E4DD] bg-white"><div className="flex flex-col gap-3 border-b border-[#ECEAE5] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"><div className="relative w-full sm:max-w-md"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"/><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm tên, email, sản phẩm hoặc nội dung..." className="h-10 w-full rounded-xl border border-[#E6E2DA] bg-white pl-9 pr-3 text-sm outline-none transition focus:border-[#9EB294] focus:ring-2 focus:ring-[#E9F0E5]"/></div><div className="text-xs text-neutral-500">{visibleReviews.length} đánh giá</div></div>
      {loading ? <div className="p-12 text-center text-sm text-neutral-500">Đang tải đánh giá...</div> : loadError ? <div className="p-8 text-center"><p className="text-sm font-medium text-red-600">Không tải được danh sách đánh giá.</p><p className="mt-2 text-xs text-neutral-500">{loadError instanceof Error ? loadError.message : "Kiểm tra bảng product_reviews và quyền SELECT trong Supabase."}</p><button type="button" onClick={() => void reviewsQuery.refetch()} className="mt-4 rounded-lg bg-[#6F8B62] px-4 py-2 text-sm font-medium text-white hover:bg-[#5F7954]">Thử lại</button></div> : visibleReviews.length === 0 ? <div className="px-5 py-16 text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#EDF2EA] text-[#6F8B62]"><Star size={20}/></div><p className="mt-4 text-sm font-medium text-[#30332F]">Không có đánh giá phù hợp</p><p className="mt-1 text-xs text-neutral-500">{statusFilter === "pending" ? "Chưa có đánh giá nào đang chờ duyệt." : "Thử đổi bộ lọc hoặc từ khóa tìm kiếm."}</p></div> : <div className="divide-y divide-[#F0EEE9]">{visibleReviews.map((review) => { const status = (review.status || "pending") as ReviewStatus; const busy = busyId === review.id; return <article key={review.id} className="p-4 sm:p-5 lg:p-6"><div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium ${status === "approved" ? "bg-emerald-50 text-emerald-700" : status === "rejected" ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-700"}`}>{status === "approved" ? <CheckCircle2 size={13}/> : status === "rejected" ? <XCircle size={13}/> : <Clock3 size={13}/>} {statusLabels[status] ?? status}</span><span className="text-xs text-neutral-400">{formatDate(review.created_at)}</span></div>
        <h2 className="mt-3 text-sm font-semibold text-[#30332F]">{productNames.get(review.product_id) ?? `Sản phẩm #${review.product_id.slice(0, 8)}`}</h2><div className="mt-2 flex items-center gap-1" aria-label={`${review.rating} trên 5 sao`}>{[1,2,3,4,5].map((star) => <Star key={star} size={15} className={star <= Number(review.rating) ? "fill-[#F5B323] text-[#F5B323]" : "text-neutral-300"}/>)}<span className="ml-1 text-xs text-neutral-500">{review.rating}/5</span></div><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-neutral-700">{review.review_text}</p><div className="mt-4"><p className="text-xs font-medium text-neutral-700">{review.reviewer_name}</p><p className="mt-0.5 text-xs text-neutral-500">{review.reviewer_email}</p></div>
        {!!review.photo_urls?.length && <div className="mt-4 flex flex-wrap gap-2">{review.photo_urls.map((url, i) => <a key={`${url}-${i}`} href={url} target="_blank" rel="noreferrer" className="group relative block h-20 w-20 overflow-hidden rounded-lg border border-[#E7E4DD] bg-[#F7F6F2]" title="Mở ảnh đánh giá"><img src={url} alt={`Ảnh đánh giá ${i+1}`} className="h-full w-full object-cover transition group-hover:scale-105"/><span className="absolute bottom-1 right-1 rounded bg-black/60 p-1 text-white"><ExternalLink size={11}/></span></a>)}</div>}</div>
        <div className="flex shrink-0 flex-wrap gap-2 xl:w-44 xl:flex-col">{status !== "approved" && <button type="button" disabled={busy} onClick={() => void updateStatus(review, "approved")} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[#6F8B62] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#5F7954] disabled:opacity-50"><CheckCircle2 size={14}/> Duyệt đánh giá</button>}{status !== "rejected" && <button type="button" disabled={busy} onClick={() => void updateStatus(review, "rejected")} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"><XCircle size={14}/> Từ chối</button>}{status !== "pending" && <button type="button" disabled={busy} onClick={() => void updateStatus(review, "pending")} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[#E6E2DA] bg-white px-3 py-2 text-xs font-medium text-neutral-600 transition hover:bg-[#FAF9F6] disabled:opacity-50"><Clock3 size={14}/> Chuyển về chờ duyệt</button>}{busy && <p className="text-center text-xs text-neutral-400">Đang cập nhật...</p>}</div></div></article>; })}</div>}
    </div><p className="mt-4 text-xs leading-5 text-neutral-400">Chỉ đánh giá có trạng thái “Đã duyệt” mới hiển thị công khai trên trang sản phẩm. Nếu thao tác duyệt bị từ chối, hãy kiểm tra chính sách RLS/UPDATE trong Supabase.</p>
  </div></div>;
}
