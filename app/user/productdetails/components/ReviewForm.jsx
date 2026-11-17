"use client";

import { useState } from "react";
import { toast } from "react-toastify";
import { FaStar } from "react-icons/fa";
import { FaRegStar } from "react-icons/fa6";
import { useLanguage } from "../../../../context/LanguageContext";
import { submitItemRating } from "../../../../utils/functions";

export default function ReviewForm({ product, itemId, onRatingSubmitted }) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [review, setReview] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [saveInfo, setSaveInfo] = useState(false);
  const [submitting, setSubmitting] = useState(false);
const {t}= useLanguage()

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (submitting) return;

    if (!rating) {
      toast.error(t("select_rating_first"));
      return;
    }

    setSubmitting(true);
    try {
      await submitItemRating(itemId, rating, review);
      onRatingSubmitted?.();
      setRating(0)
      setReview("")
    } catch (error) {
      console.error("Failed to submit rating:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full"
    >
      <h2 className="mb-2 text-lg font-bold text-gray-900 sm:text-xl">
        {t("Add_review")}
      </h2>

      <p className="text-sm text-gray-500 mb-8">
        {t("Required_fields")}{" "}
        <span className="text-[#e5485d]">*</span>
      </p>

      {/* Rating */}
      <div className="mb-6 flex items-center gap-3">
        <label className="block text-sm font-medium text-gray-700 ">
          {t("Your_rating")} <span className="text-[#e5485d]">*</span>
        </label>
        <div className="flex items-center gap-1" role="radiogroup" aria-label={t("rating")}>
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              aria-label={t("rating_value").replace("{value}", value)}
              onClick={() => setRating(value)}
              onMouseEnter={() => setHoverRating(value)}
              onMouseLeave={() => setHoverRating(0)}
              className="outline-none focus:outline-none"
            >
              {value <= hoverRating || value <= rating ? (
                <FaStar
                  className="h-5 w-5 sm:h-6 sm:w-6 transition-colors duration-200 ease-in-out text-[#f5b800]" />
              ) :
                (<FaRegStar
                  key={value}
                  className="text-gray-300 h-5 w-5 sm:h-6 sm:w-6 transition-colors duration-200 ease-in-out"
                />)
              }
            </button>
          ))}
        </div>
      </div>

      {/* Review */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t("Your_review")} <span className="text-[#e5485d]">*</span>
        </label>
        <textarea
          value={review}
          onChange={(e) => setReview(e.target.value)}
          rows={8}
          placeholder={t("Your_review_placeholder")}
          className="w-full h-[190px] resize-y rounded-2xl border border-gray-300 bg-white p-4 text-sm text-gray-800 outline-none transition-colors focus:border-[#e5485d]/60"
        />
      </div>

      {/* Name */}
      {/* <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Name <span className="text-[#e5485d]">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full h-[42px] rounded-full border border-gray-300 bg-white px-5 text-sm text-gray-800 outline-none transition-colors focus:border-[#e5485d]/60"
        />
      </div> */}

      {/* Email */}
      {/* <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Email <span className="text-[#e5485d]">*</span>
        </label>
        <input
          type="email"
          v>alue={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full h-[42px] rounded-full border border-gray-300 bg-white px-5 text-sm text-gray-800 outline-none transition-colors focus:border-[#e5485d]/60"
        />
      </div> */}

      {/* Save info */}
      {/* <div className="flex items-start gap-3 mb-8">
        <input
          type="checkbox"
          id="save-info"
          checked={saveInfo}
          onChange={(e) => setSaveInfo(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-gray-300 accent-[#e5485d]"
        />
        <label htmlFor="save-info" className="text-sm text-gray-600 leading-snug">
          Save my name, email, and website in this browser for the next time I
          comment.
        </label>
      </div> */}

      {/* Submit */}
      <button
        type="submit"
        disabled={submitting}
        className="rounded-full bg-[#e5485d] px-6 py-3 text-sm font-medium text-white transition-all duration-200 hover:bg-[#d04153] hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {submitting ? t("Submitting") : t("Submit")}
      </button>
    </form>
  );
}