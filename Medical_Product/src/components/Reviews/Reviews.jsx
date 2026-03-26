import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

const API_BASE = "http://localhost:8000";

const Reviews = () => {
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState("");
  const [authUser, setAuthUser] = useState(null);
  const [form, setForm] = useState({
    rating: 5,
    title: "",
    comment: "",
  });

  const averageRating = useMemo(() => {
    if (!reviews.length) return "0.0";
    const total = reviews.reduce((sum, row) => sum + Number(row.rating || 0), 0);
    return (total / reviews.length).toFixed(1);
  }, [reviews]);

  const loadReviews = async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/reviews`);
      const payload = await res.json();
      if (!res.ok || !payload?.success) {
        throw new Error(payload?.message || "Unable to load reviews.");
      }
      setReviews(payload?.data?.reviews || []);
    } catch (err) {
      setError(err.message || "Unable to load reviews.");
      setReviews([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, []);

  useEffect(() => {
    const syncAuthUser = () => {
      try {
        const raw = localStorage.getItem("authUser");
        setAuthUser(raw ? JSON.parse(raw) : null);
      } catch {
        setAuthUser(null);
      }
    };
    syncAuthUser();
    window.addEventListener("auth-changed", syncAuthUser);
    window.addEventListener("storage", syncAuthUser);
    return () => {
      window.removeEventListener("auth-changed", syncAuthUser);
      window.removeEventListener("storage", syncAuthUser);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    const loggedInName = String(authUser?.name || "").trim();
    const loggedInEmail = String(authUser?.email || "").trim();
    if (!loggedInName) {
      setError("Please sign in to write a review.");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: loggedInName,
          email: loggedInEmail,
          rating: Number(form.rating),
          title: form.title,
          comment: form.comment,
        }),
      });
      const payload = await res.json();
      if (!res.ok || !payload?.success) {
        throw new Error(payload?.message || "Failed to submit review.");
      }

      setForm({ rating: 5, title: "", comment: "" });
      setSuccess("Review submitted successfully. Thank you.");
      await loadReviews();
    } catch (err) {
      setError(err.message || "Failed to submit review.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="pt-28 pb-16 px-4 md:px-8 bg-slate-50 min-h-screen">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-black text-slate-800">Customer Reviews</h1>
          <p className="mt-3 text-slate-600">
            Read what other customers are saying and share your own experience.
          </p>
          <p className="mt-2 text-sm font-bold text-blue-700">
            Average rating: {averageRating} / 5 ({reviews.length})
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {isLoading && <p className="text-slate-500 font-semibold">Loading reviews...</p>}
            {!isLoading && reviews.length === 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-500 font-semibold">
                No reviews yet.
              </div>
            )}
            {!isLoading &&
              reviews.map((item) => (
                <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="font-black text-slate-800">{item.name}</h3>
                    <span className="text-amber-600 font-bold">{"*".repeat(Number(item.rating || 0))}</span>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">{item.title || "Review"}</p>
                  <p className="mt-3 text-slate-700 leading-7">{item.comment}</p>
                </article>
              ))}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm h-fit">
            <h2 className="text-xl font-black text-slate-800 mb-4">Write a Review</h2>
            {error && <p className="mb-3 text-sm font-semibold text-red-600">{error}</p>}
            {success && <p className="mb-3 text-sm font-semibold text-emerald-600">{success}</p>}
            <form className="space-y-3" onSubmit={handleSubmit}>
              {authUser?.name ? (
                <p className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700">
                  Writing as: {authUser.name}
                </p>
              ) : (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700">
                  Please sign in to write a review.{" "}
                  <Link to="/signin" className="underline">
                    Go to Sign In
                  </Link>
                </div>
              )}
              <select
                value={form.rating}
                onChange={(e) => setForm((prev) => ({ ...prev, rating: Number(e.target.value) }))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200"
              >
                <option value={5}>5 - Excellent</option>
                <option value={4}>4 - Good</option>
                <option value={3}>3 - Average</option>
                <option value={2}>2 - Needs Improvement</option>
                <option value={1}>1 - Poor</option>
              </select>
              <input
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="Title"
              />
              <textarea
                required
                rows={5}
                value={form.comment}
                onChange={(e) => setForm((prev) => ({ ...prev, comment: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="Share your experience..."
              />
              <button
                type="submit"
                disabled={isSubmitting || !authUser?.name}
                className="w-full rounded-xl bg-blue-600 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Submitting..." : "Submit Review"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Reviews;
