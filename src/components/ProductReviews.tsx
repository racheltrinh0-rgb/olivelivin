import { useEffect, useRef, useState, type FormEvent } from "react";
import { Star, ImagePlus, X, LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type ProductReview = {
  id: string;
  product_id: string;
  rating: number;
  reviewer_name: string;
  review_text: string;
  photo_urls: string[] | null;
  created_at: string;
};

type ProductReviewsProps = { productId: string; productName: string };
const BUCKET = "product-review-photos";
const MAX_PHOTOS = 4;
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export default function ProductReviews({ productId, productName }: ProductReviewsProps) {
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [reviewText, setReviewText] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  async function loadReviews() {
    setLoading(true);
    const { data, error } = await supabase
      .from("product_reviews")
      .select("id, product_id, rating, reviewer_name, review_text, photo_urls, created_at")
      .eq("product_id", productId)
      .eq("status", "approved")
      .order("created_at", { ascending: false });
    if (error) {
      console.error("Could not load product reviews:", error);
      toast.error("Chưa thể tải đánh giá. Vui lòng thử lại sau.");
    } else {
      setReviews((data ?? []) as ProductReview[]);
    }
    setLoading(false);
  }

  useEffect(() => { void loadReviews(); }, [productId]);

  const average = reviews.length
    ? reviews.reduce((sum, review) => sum + Number(review.rating), 0) / reviews.length
    : 0;
  const distribution = [5, 4, 3, 2, 1].map((value) => ({
    rating: value,
    count: reviews.filter((review) => Number(review.rating) === value).length,
  }));

  function handlePhotos(files: FileList | null) {
    if (!files) return;
    const selected = Array.from(files);
    const valid = selected.filter((file) => {
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name}: chỉ hỗ trợ tệp hình ảnh.`);
        return false;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name}: dung lượng tối đa 10 MB.`);
        return false;
      }
      return true;
    });
    setPhotos((current) => [...current, ...valid].slice(0, MAX_PHOTOS));
  }

  async function submitReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!productId) {
      toast.error("Không xác định được sản phẩm.");
      return;
    }
    if (rating < 1 || rating > 5) {
      toast.error("Please select a rating from 1 to 5 stars.");
      return;
    }
    if (!name.trim() || !email.trim() || !reviewText.trim()) {
      toast.error("Vui lòng điền đầy đủ thông tin bắt buộc.");
      return;
    }
    setSubmitting(true);
    try {
      const uploadedUrls: string[] = [];
      for (const file of photos) {
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
        const path = `${productId}/${crypto.randomUUID()}-${safeName}`;
        const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type,
        });
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
        uploadedUrls.push(data.publicUrl);
      }

      const { error } = await supabase.from("product_reviews").insert({
        product_id: productId,
        rating,
        reviewer_name: name.trim(),
        reviewer_email: email.trim().toLowerCase(),
        review_text: reviewText.trim(),
        photo_urls: uploadedUrls,
        status: "pending",
      });
      if (error) throw error;

      toast.success("Cảm ơn bạn! Đánh giá đã được gửi và sẽ hiển thị sau khi duyệt.");
      setFormOpen(false);
      setRating(0);
      setName("");
      setEmail("");
      setReviewText("");
      setPhotos([]);
      if (fileInput.current) fileInput.current.value = "";
    } catch (error) {
      console.error("Submit product review failed:", error);
      toast.error("Không gửi được đánh giá. Hãy kiểm tra cấu hình Supabase và thử lại.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section
      aria-labelledby="product-reviews-heading"
      className="w-full border-t border-neutral-200 pt-8 sm:pt-10"
    >
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-12">
        {/* Compact review summary */}
        <aside className="h-fit rounded-2xl border border-[#E7EAE3] bg-[#FAFBF8] p-5 sm:p-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#6F8B62]">
            CUSTOMER REVIEWS
          </p>
          <h2 id="product-reviews-heading" className="mt-2 text-2xl font-semibold tracking-tight text-[#263D2B]">
            Reviews
          </h2>

          <div className="mt-4 flex items-center gap-3">
            <span className="text-4xl font-semibold leading-none tracking-tight text-[#263D2B]">
              {reviews.length ? average.toFixed(1) : "—"}
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-0.5" aria-label={`${average.toFixed(1)} out of 5 stars`}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} size={15} className={star <= Math.round(average) ? "fill-[#F5B323] text-[#F5B323]" : "text-neutral-300"} />
                ))}
              </div>
              <p className="mt-1 text-xs text-neutral-500">
                {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setFormOpen((open) => !open)}
            aria-expanded={formOpen}
            className="mt-5 inline-flex min-h-10 w-full items-center justify-center rounded-lg bg-[#6F8B62] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#5F7954] focus:outline-none focus:ring-2 focus:ring-[#6F8B62] focus:ring-offset-2"
          >
            {formOpen ? "Close review form" : "Write a review"}
          </button>

          {reviews.length > 0 && (
            <div className="mt-6 border-t border-[#E5E9E0] pt-5">
              <p className="mb-4 text-xs font-semibold text-[#394A35]">Rating breakdown</p>
              <div className="space-y-3">
                {distribution.map((item) => (
                  <div key={item.rating} className="grid grid-cols-[76px_minmax(0,1fr)_18px] items-center gap-2 text-xs">
                    <div className="flex items-center gap-0.5" aria-label={`${item.rating} sao`}>
                      {Array.from({ length: item.rating }, (_, index) => (
                        <Star key={index} size={12} className="shrink-0 fill-[#F5B323] text-[#F5B323]" />
                      ))}
                    </div>
                    <div className="h-[7px] overflow-hidden rounded-full bg-[#E9ECE6]">
                      <div
                        className="h-full rounded-full bg-[#6F8B62] transition-[width] duration-300"
                        style={{ width: `${reviews.length ? (item.count / reviews.length) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="text-right tabular-nums text-neutral-500">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* Review form and customer reviews */}
        <div className="min-w-0">
          {formOpen && (
            <form onSubmit={submitReview} className="mb-7 rounded-2xl border border-neutral-200 bg-white p-4 sm:p-6" aria-label={`Write a review for ${productName}`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-base font-semibold text-neutral-900">Share your experience</h3>
                  <p className="mt-1 text-xs text-neutral-500">Your feedback helps other customers choose.</p>
                </div>
                <button type="button" onClick={() => setFormOpen(false)} aria-label="Close review form" className="rounded-full p-1.5 text-neutral-500 hover:bg-neutral-100">
                  <X size={18} />
                </button>
              </div>

              <div className="mt-5">
                <label className="block text-xs font-medium text-neutral-700">Rating <span className="text-red-600">*</span></label>
                <div className="mt-2 flex items-center gap-1" role="radiogroup" aria-label="Rating">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} type="button" role="radio" aria-checked={rating === star} aria-label={`${star} star${star > 1 ? "s" : ""}`} onClick={() => setRating(star)} className="rounded-sm p-0.5 focus:outline-none focus:ring-2 focus:ring-amber-400">
                      <Star size={25} className={star <= rating ? "fill-[#F5B323] text-[#F5B323]" : "text-neutral-300"} />
                    </button>
                  ))}
                </div>
                {rating === 0 && <p className="mt-1 text-[11px] text-neutral-500">Select a rating from 1 to 5 stars.</p>}
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="review-name" className="mb-1.5 block text-xs font-medium text-neutral-700">Name <span className="text-red-600">*</span></label>
                  <input id="review-name" autoComplete="name" required maxLength={80} value={name} onChange={(e) => setName(e.target.value)} className="h-11 w-full rounded-lg border border-neutral-300 px-3 text-sm outline-none transition focus:border-[#6F8B62] focus:ring-1 focus:ring-[#6F8B62]" placeholder="Your name" />
                </div>
                <div>
                  <label htmlFor="review-email" className="mb-1.5 block text-xs font-medium text-neutral-700">Email <span className="text-red-600">*</span></label>
                  <input id="review-email" type="email" autoComplete="email" required maxLength={254} value={email} onChange={(e) => setEmail(e.target.value)} className="h-11 w-full rounded-lg border border-neutral-300 px-3 text-sm outline-none transition focus:border-[#6F8B62] focus:ring-1 focus:ring-[#6F8B62]" placeholder="you@example.com" />
                </div>
              </div>

              <div className="mt-4">
                <label htmlFor="review-text" className="mb-1.5 block text-xs font-medium text-neutral-700">Review <span className="text-red-600">*</span></label>
                <textarea id="review-text" required minLength={5} maxLength={3000} rows={4} value={reviewText} onChange={(e) => setReviewText(e.target.value)} className="w-full resize-y rounded-lg border border-neutral-300 px-3 py-2.5 text-sm leading-6 outline-none transition focus:border-[#6F8B62] focus:ring-1 focus:ring-[#6F8B62]" placeholder={`What did you think about ${productName}?`} />
                <p className="mt-1 text-right text-[11px] text-neutral-400">{reviewText.length}/3000</p>
              </div>

              <div className="mt-4">
                <span className="block text-xs font-medium text-neutral-700">Photos <span className="font-normal text-neutral-400">(optional, up to {MAX_PHOTOS})</span></span>
                <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple className="sr-only" id="review-photos" onChange={(e) => handlePhotos(e.target.files)} />
                <button type="button" onClick={() => fileInput.current?.click()} disabled={photos.length >= MAX_PHOTOS} className="mt-2 inline-flex min-h-10 items-center gap-2 rounded-lg border border-dashed border-neutral-300 px-3 py-2 text-xs text-neutral-700 hover:border-[#6F8B62] disabled:opacity-50"><ImagePlus size={16} /> Add photos</button>
                <p className="mt-1 text-[11px] text-neutral-400">JPG, PNG, GIF or WEBP · 10 MB max per photo</p>
                {photos.length > 0 && <ul className="mt-3 space-y-2">{photos.map((file, index) => <li key={`${file.name}-${index}`} className="flex items-center justify-between gap-3 rounded-lg bg-neutral-50 px-3 py-2 text-xs"><span className="truncate">{file.name}</span><button type="button" onClick={() => setPhotos((current) => current.filter((_, i) => i !== index))} aria-label={`Remove ${file.name}`} className="shrink-0 p-1 text-neutral-500 hover:text-red-600"><X size={14} /></button></li>)}</ul>}
              </div>

              <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
                <button type="submit" disabled={submitting} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#6F8B62] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#5F7954] focus:outline-none focus:ring-2 focus:ring-[#6F8B62] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60">{submitting && <LoaderCircle size={16} className="animate-spin" />}{submitting ? "Submitting…" : "Submit review"}</button>
                <button type="button" onClick={() => setFormOpen(false)} disabled={submitting} className="min-h-11 rounded-lg border border-neutral-300 px-5 py-3 text-sm text-neutral-700 hover:bg-neutral-50">Cancel</button>
              </div>
              <p className="mt-3 text-[11px] leading-5 text-neutral-500">Reviews are checked before they appear publicly. Your email will not be shown on the website.</p>
            </form>
          )}

          {loading ? (
            <div className="space-y-4" aria-label="Loading reviews">
              <div className="h-20 animate-pulse rounded-xl bg-neutral-100" />
              <div className="h-20 animate-pulse rounded-xl bg-neutral-100" />
            </div>
          ) : reviews.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-neutral-200 px-5 py-10 text-center">
              <div className="mx-auto flex justify-center gap-1">{[1, 2, 3, 4, 5].map((star) => <Star key={star} size={18} className="text-neutral-300" />)}</div>
              <h3 className="mt-3 text-sm font-semibold text-neutral-900">No reviews yet</h3>
              <p className="mt-1 text-sm text-neutral-500">Be the first to share your experience with this product.</p>
            </div>
          ) : (
            <div className="divide-y divide-neutral-200">
              {reviews.map((review) => (
                <article key={review.id} className="py-5 first:pt-0 sm:py-6">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#263D2B] text-sm font-semibold text-white">
                      {review.reviewer_name.trim().charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <h3 className="text-sm font-semibold text-neutral-900">{review.reviewer_name}</h3>
                        <time className="text-xs text-neutral-400" dateTime={review.created_at}>{new Date(review.created_at).toLocaleDateString("vi-VN", { year: "numeric", month: "short", day: "numeric" })}</time>
                      </div>
                      <div className="mt-2 flex gap-0.5" aria-label={`${review.rating} out of 5 stars`}>
                        {[1, 2, 3, 4, 5].map((star) => <Star key={star} size={14} className={star <= review.rating ? "fill-[#F5B323] text-[#F5B323]" : "text-neutral-300"} />)}
                      </div>
                      <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-neutral-700">{review.review_text}</p>
                      {review.photo_urls?.length ? (
                        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                          {review.photo_urls.map((url, index) => <a key={url} href={url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-xl bg-neutral-100"><img src={url} alt={`Customer review photo ${index + 1}`} loading="lazy" className="aspect-square h-full w-full object-cover transition hover:scale-[1.03]" /></a>)}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
