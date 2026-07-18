'use client';

import React, { useState } from 'react';

interface RatingFormProps {
  order: any;
  onSubmit: (shopRating: number, shopReview: string, riderRating: number, riderReview: string) => Promise<void>;
  onCancel: () => void;
}

export default function RatingForm({ order, onSubmit, onCancel }: RatingFormProps) {
  const [shopRatingInput, setShopRatingInput] = useState<number>(5);
  const [shopReviewInput, setShopReviewInput] = useState('');
  const [riderRatingInput, setRiderRatingInput] = useState<number>(5);
  const [riderReviewInput, setRiderReviewInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(shopRatingInput, shopReviewInput, riderRatingInput, riderReviewInput);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-blue-50/30 border border-blue-100 rounded-2xl p-4 space-y-4 animate-fade-in text-[11px] text-left">
      <h4 className="font-black text-slate-800 text-[11px] border-b border-slate-100/80 pb-2 flex items-center gap-1">
        <span>⭐</span> ให้คะแนนและรีวิวบริการ
      </h4>

      {/* Rate Merchant */}
      <div className="space-y-1.5 text-left">
        <span className="block font-bold text-slate-700">
          ให้คะแนนร้านค้า ({order.merchant_name}):
        </span>
        <div className="flex gap-1.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              type="button"
              key={star}
              onClick={() => setShopRatingInput(star)}
              className={`w-7 h-7 rounded-lg text-sm flex items-center justify-center transition cursor-pointer ${
                shopRatingInput >= star
                  ? 'bg-amber-100 text-amber-500'
                  : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
              }`}
            >
              ★
            </button>
          ))}
        </div>
        <input
          type="text"
          value={shopReviewInput}
          onChange={(e) => setShopReviewInput(e.target.value)}
          placeholder="เขียนรีวิวร้านค้า เช่น อร่อยมาก, แพ็คดีมากๆ (ไม่บังคับ)"
          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none text-[10px] focus:ring-1 focus:ring-blue-500 text-slate-700"
        />
      </div>

      {/* Rate Rider */}
      {order.rider_name && (
        <div className="space-y-1.5 border-t border-slate-100/50 pt-2.5 text-left">
          <span className="block font-bold text-slate-700">
            ให้คะแนนไรเดอร์ (คุณ {order.rider_name}):
          </span>
          <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                type="button"
                key={star}
                onClick={() => setRiderRatingInput(star)}
                className={`w-7 h-7 rounded-lg text-sm flex items-center justify-center transition cursor-pointer ${
                  riderRatingInput >= star
                    ? 'bg-amber-100 text-amber-500'
                    : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                }`}
              >
                ★
              </button>
            ))}
          </div>
          <input
            type="text"
            value={riderReviewInput}
            onChange={(e) => setRiderReviewInput(e.target.value)}
            placeholder="เขียนรีวิวคนขับ เช่น ส่งของสุภาพ สุภาพ (ไม่บังคับ)"
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none text-[10px] focus:ring-1 focus:ring-blue-500 text-slate-700"
          />
        </div>
      )}

      {/* Buttons */}
      <div className="flex gap-2 justify-end pt-1">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-250 text-slate-650 font-bold rounded-lg transition text-[10px] cursor-pointer"
        >
          ยกเลิก
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-3.5 py-1.5 bg-primary hover:bg-primary-hover text-white font-bold rounded-lg transition text-[10px] cursor-pointer flex items-center gap-1"
        >
          {isSubmitting ? 'กำลังส่ง...' : 'ส่งรีวิว'}
        </button>
      </div>
    </form>
  );
}
