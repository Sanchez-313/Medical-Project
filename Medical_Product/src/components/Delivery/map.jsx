import React from "react";

const Map = () => {
  return (
    <div className="flex justify-center items-center w-full h-[500px]">
      <iframe
        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d118427.16450757287!2d96.07582415!3d21.940359899999997!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x30cb6d23f0d27411%3A0x24146be01e4e5646!2sMandalay!5e0!3m2!1sen!2smm!4v1767500888665!5m2!1sen!2smm"
        className="w-full h-full border-0 rounded-xl shadow-lg"
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        title="Google Map"
      ></iframe>
    </div>
  );
};

export default Map;