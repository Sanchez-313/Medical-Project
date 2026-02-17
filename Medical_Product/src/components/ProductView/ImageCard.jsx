import { useState } from "react";

export default function ImageCard({ image, name }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div
        className="w-full aspect-square bg-white rounded-[2.5rem] shadow-sm flex items-center justify-center border border-slate-100 p-8 group cursor-pointer"
        onClick={() => setIsOpen(true)}
      >
        {image ? (
          <img
            src={image}
            alt={name}
            className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          <div className="text-7xl">💊</div>
        )}
      </div>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50"
          onClick={() => setIsOpen(false)}
        >
          <img
            src={image}
            alt={name}
            className="max-w-full max-h-full object-contain"
          />
        </div>
      )}
    </>
  );
}