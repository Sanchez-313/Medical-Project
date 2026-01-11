const Reviews = () => {
  const cardsData = [
    {
      image: "/src/assets/reviews/anime2.jpg",
      name: "Kyaw Myint",
      handle: "@kyawmyint",
      rating: 4.5,
      text: "The medicine arrived quickly and safely. Excellent service for urgent needs!"
    },
    {
      image: "/src/assets/reviews/anime1.jpg",
      name: "Marlar",
      handle: "@marlar2.0",
      rating: 2.5,
      text: "Delivery was slower than expected, but the medicines were packed securely."
    },
    {
      image: "/src/assets/reviews/anime5.jpg",
      name: "Hla Myint Maung",
      handle: "@hlamaung",
      rating: 4,
      text: "Fast response and professional handling of my prescription order."
    },
    {
      image: "/src/assets/reviews/anime4.jpg",
      name: "May Tharaphi",
      handle: "@may",
      rating: 5,
      text: "Affordable delivery fees and trustworthy service for medical supplies."
    },
    {
      image: "/src/assets/reviews/anime3.jpg",
      name: "Hay Mann",
      handle: "@haymann",
      rating: 3,
      text: "Good service overall, but could improve tracking updates."
    }
  ];

  // Star component with half support
  const Star = ({ filled, half, id }) => {
    if (half) {
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          className="w-5 h-5"
          fill={`url(#${id})`}
          stroke="#f59e0b"
          strokeWidth={2}
        >
          <defs>
            <linearGradient id={id}>
              <stop offset="50%" stopColor="#f59e0b" />
              <stop offset="50%" stopColor="transparent" />
            </linearGradient>
          </defs>
          <path d="M12 17.27l5.18 3.05-1.64-5.81L20 9.24l-6.1-.52L12 3 10.1 8.72 4 9.24l4.46 5.27-1.64 5.81L12 17.27z" />
        </svg>
      );
    }
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        className="w-5 h-5"
        fill={filled ? "#f59e0b" : "none"}
        stroke="#f59e0b"
        strokeWidth={2}
      >
        <path d="M12 17.27l5.18 3.05-1.64-5.81L20 9.24l-6.1-.52L12 3 10.1 8.72 4 9.24l4.46 5.27-1.64 5.81L12 17.27z" />
      </svg>
    );
  };

  const CreateCard = ({ card, index }) => {
    const fullStars = Math.floor(card.rating);
    const hasHalf = card.rating % 1 !== 0;

    return (
      <div className="p-5 rounded-xl mx-4 shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300 w-72 shrink-0 bg-white">
        <div className="flex gap-3 items-center">
          <img className="w-12 h-12 rounded-full object-cover" src={card.image} alt={`${card.name} avatar`} />
          <div className="flex flex-col">
            <p className="font-semibold text-gray-800">{card.name}</p>
            <span className="text-xs text-slate-500">{card.handle}</span>
          </div>
        </div>

        {/* Rating Stars + Number */}
        <div className="flex mt-2 items-center">
          {[...Array(fullStars)].map((_, i) => (
            <Star key={`full-${index}-${i}`} filled />
          ))}
          {hasHalf && <Star key={`half-${index}`} half id={`halfGradient-${index}`} />}
          {[...Array(5 - fullStars - (hasHalf ? 1 : 0))].map((_, i) => (
            <Star key={`empty-${index}-${i}`} />
          ))}
          <span className="ml-2 text-sm text-gray-700 font-medium">{card.rating}</span>
        </div>

        <p className="text-sm py-4 text-gray-600 italic">“{card.text}”</p>
      </div>
    );
  };

  return (
    <>
      <h1 className="text-center text-4xl font-extrabold text-indigo-600 pt-4 mb-2">
        Customer Reviews
      </h1>
      <p className="text-center text-gray-500 mb-2">
        What Our Customers Say About Us
      </p>

      {/* Animated rows */}
      <style>{`
        @keyframes marqueeScroll {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .marquee-inner { animation: marqueeScroll 25s linear infinite; }
        .marquee-reverse { animation-direction: reverse; }
      `}</style>

      <div className="marquee-row w-full mx-auto max-w-8xl overflow-hidden relative">
        <div className="absolute left-0 top-0 h-full w-20 z-10 pointer-events-none bg-gradient-to-r from-white to-transparent"></div>
        <div className="marquee-inner flex min-w-[200%] pt-10 pb-5">
          {[...cardsData, ...cardsData].map((card, index) => (
            <CreateCard key={index} card={card} index={index} />
          ))}
        </div>
        <div className="absolute right-0 top-0 h-full w-20 md:w-40 z-10 pointer-events-none bg-gradient-to-l from-white to-transparent"></div>
      </div>

      <div className="marquee-row w-full mx-auto max-w-8xl overflow-hidden relative">
        <div className="absolute left-0 top-0 h-full w-20 z-10 pointer-events-none bg-gradient-to-r from-white to-transparent"></div>
        <div className="marquee-inner marquee-reverse flex min-w-[200%] pt-10 pb-5">
          {[...cardsData, ...cardsData].map((card, index) => (
            <CreateCard key={index} card={card} index={index} />
          ))}
        </div>
        <div className="absolute right-0 top-0 h-full w-20 md:w-40 z-10 pointer-events-none bg-gradient-to-l from-white to-transparent"></div>
      </div>
    </>
  );
};

export default Reviews;