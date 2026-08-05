"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";
import { FaStar } from "react-icons/fa";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import Heading from "@/components/Heading";

interface Review {
  id: number;
  name: string;
  title: string | null;
  comment: string;
  rating: number;
  avatar_url: string | null;
}

/** Faithful port of Medical_Product/src/components/Testimonials/Testimonials.jsx, backed by real /api/reviews. */
export default function TestimonialsSection() {
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    fetch("/api/reviews")
      .then((r) => r.json())
      .then((result) => result.success && setReviews(result.data.reviews));
  }, []);

  return (
    <section>
      <div className="max-w-[1400px] mx-auto px-10 py-16">
        <Heading highlight="Customers" heading="Saying" />

        {reviews.length > 0 ? (
          <>
            <div className="flex justify-end mt-5 py-5 gap-x-3">
              <button className="custom-prev text-2xl text-zinc-800 rounded-lg w-11 h-11 flex justify-center items-center bg-zinc-100 hover:bg-gradient-to-b hover:from-indigo-400 hover:to-indigo-600 hover:text-white">
                <IoIosArrowBack />
              </button>
              <button className="custom-next text-2xl text-zinc-800 rounded-lg w-11 h-11 flex justify-center items-center bg-zinc-100 hover:bg-gradient-to-b hover:from-indigo-400 hover:to-indigo-600 hover:text-white">
                <IoIosArrowForward />
              </button>
            </div>

            <Swiper
              navigation={{ nextEl: ".custom-next", prevEl: ".custom-prev" }}
              loop={reviews.length > 3}
              breakpoints={{
                640: { slidesPerView: 1, spaceBetween: 20 },
                768: { slidesPerView: 2, spaceBetween: 20 },
                1024: { slidesPerView: 3, spaceBetween: 20 },
              }}
              modules={[Navigation]}
            >
              {reviews.map((item) => (
                <SwiperSlide key={item.id} className="bg-zinc-100 rounded-xl p-8">
                  <div className="flex gap-5 items-center">
                    <div className="relative w-16 h-16 rounded-full overflow-hidden outline outline-orange-500 outline-offset-4 shrink-0">
                      {item.avatar_url && <Image src={item.avatar_url} alt={item.name} fill className="object-cover" />}
                    </div>
                    <div>
                      <h5 className="text-xl font-bold">{item.name}</h5>
                      <p className="text-zinc-600">{item.title || "Verified Customer"}</p>
                      <span className="flex text-yellow-400 mt-3 text-xl gap-1">
                        {Array.from({ length: item.rating }, (_, i) => (
                          <FaStar key={i} />
                        ))}
                      </span>
                    </div>
                  </div>
                  <div className="mt-10 min-h-[100px]">
                    <p className="text-zinc-600">{item.comment}</p>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </>
        ) : (
          <div className="rounded-xl bg-zinc-100 p-6 text-zinc-600">No customer reviews available yet.</div>
        )}
      </div>
    </section>
  );
}
