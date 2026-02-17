import React from "react";
import Heading from "../Heading/Heading";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";
import { FaStar } from "react-icons/fa";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";

import Customer1 from "../../assets/Customers/customer2.jpg";
import Customer2 from "../../assets/Customers/customer2.jpg";
import Customer3 from "../../assets/Customers/customer3.jpg";
import Customer4 from "../../assets/Customers/customer4.jpg";
import Customer5 from "../../assets/Customers/customer5.jpg";

const Testimonials = () => {
  return (
    <section>
      <div className="max-w-[1400px] mx-auto px-10 py-20">
        <Heading highlight="Customers" heading="Saying" />

        <div className="flex justify-end mt-5 py-5 gap-x-3">
          <button className="custom-prev text-2xl text-zinc-800 rounded-lg w-11 h-11 flex justify-center items-center bg-zinc-100 hover:bg-gradient-to-b hover:from-indigo-400 hover:to-indigo-600 hover:text-white cursor-pointer">
            <IoIosArrowBack />
          </button>
          <button className="custom-next text-2xl text-zinc-800 rounded-lg w-11 h-11 flex justify-center items-center bg-zinc-100 hover:bg-gradient-to-b hover:from-indigo-400 hover:to-indigo-600 hover:text-white cursor-pointer">
            <IoIosArrowForward />
          </button>
        </div>

        <Swiper
          navigation={{
            nextEl: ".custom-next",
            prevEl: ".custom-prev",
          }}
          loop={true}
          breakpoints={{
            640: { slidesPerView: 1, spaceBetween: 20 },
            768: { slidesPerView: 2, spaceBetween: 20 },
            1024: { slidesPerView: 3, spaceBetween: 20 },
          }}
          modules={[Navigation]}
          className="mySwiper"
        >
          {review.map((item) => (
            <SwiperSlide key={item.id} className="bg-zinc-100 rounded-xl p-8">
              <div className="flex gap-5 items-center">
                <div className="w-16 h-16 rounded-full overflow-hidden outline outline-orange-500 outline-offset-4">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h5 className="text-xl font-bold">{item.name}</h5>
                  <p className="text-zinc-600">{item.profession}</p>
                  <span className="flex text-yellow-400 mt-3 text-xl gap-1">
                    {Array.from({ length: Math.floor(item.rating) }, (_, i) => (
                      <FaStar key={i} />
                    ))}
                    {item.rating % 1 !== 0 && (
                      <FaStar className="opacity-50" />
                    )}{" "}
                    {/* half star */}
                  </span>
                </div>
              </div>

              <div className="mt-10 h-[15vh]">
                <p className="text-zinc-600">{item.para}</p>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
};

export default Testimonials;

const review = [
  {
    id: 1,
    name: "Myint Zaw",
    profession: "",
    rating: 3,
    para: "Lorem Ipsum is simply dummy text of the printing and typesetting industry.",
    image: Customer1,
  },
  {
    id: 2,
    name: "Zaw Zaw Myint",
    profession: "",
    rating: 3.5,
    para: "Lorem Ipsum is simply dummy text of the printing and typesetting industry.",
    image: Customer2,
  },
  {
    id: 3,
    name: "Myint Myint Zaw",
    profession: "",
    rating: 4,
    para: "Lorem Ipsum is simply dummy text of the printing and typesetting industry.",
    image: Customer3,
  },
  {
    id: 4,
    name: "Carlos Mendes",
    profession: "",
    rating: 5,
    para: "Lorem Ipsum is simply dummy text of the printing and typesetting industry.",
    image: Customer4,
  },
  {
    id: 5,
    name: "Natcha Phongchai",
    profession: "",
    rating: 4.5,
    para: "Lorem Ipsum is simply dummy text of the printing and typesetting industry.",
    image: Customer5,
  },
];
