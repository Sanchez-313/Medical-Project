import React from "react";
import Map from "./map";

const Delivery = () => {
  const [formData, setFormData] = React.useState({
    patientName: "",
    medicine: "",
    quantity: "",
    address: "",
    phone: "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Delivery Request:", formData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="container mx-auto px-6 py-10">
      <h1 className="text-center text-4xl font-extrabold text-indigo-600 mb-2">
        Medical Delivery Service
      </h1>
      <p className="text-center text-gray-500 mb-10">
        Fast, reliable delivery of medicines and medical accessories
      </p>

      <div className="flex flex-col md:flex-row gap-10 items-start justify-center">
        {/* Map Section */}
        <div className="w-full md:w-1/2 rounded-xl overflow-hidden shadow-lg">
          <Map />
        </div>

        {/* Form Section */}
        <form
          onSubmit={handleSubmit}
          className="w-full md:w-1/2 bg-white shadow-xl rounded-2xl p-8"
        >
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">
            Delivery Form
          </h2>

          {/* Patient Name */}
          <div className="mb-4">
            <input
              type="text"
              name="patientName"
              placeholder="Your Name"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-400 outline-none"
              value={formData.patientName}
              onChange={handleChange}
              required
            />
          </div>

          {/* Medicine */}
          <div className="mb-4">
            <input
              type="text"
              name="medicine"
              placeholder="Medicine Name"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-400 outline-none"
              value={formData.medicine}
              onChange={handleChange}
              required
            />
          </div>

          {/* Quantity */}
          <div className="mb-4">
            <input
              type="number"
              name="quantity"
              placeholder="Quantity"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-400 outline-none"
              value={formData.quantity}
              onChange={handleChange}
              required
            />
          </div>

          {/* Address */}
          <div className="mb-4">
            <input
              type="text"
              name="address"
              placeholder="Your Address"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-400 outline-none"
              value={formData.address}
              onChange={handleChange}
              required
            />
          </div>

          {/* Phone */}
          <div className="mb-6">
            <input
              type="tel"
              name="phone"
              placeholder="Your Phone Number"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-400 outline-none"
              value={formData.phone}
              onChange={handleChange}
              required
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-amber-400 to-indigo-500 text-white font-semibold rounded-lg hover:bg-gradient-l duration-300 hover:from-indigo-500 hover:to-amber-400 hover:skew-1 hover:shadow-2xl transition duration-300"
          >
            Place Order
          </button>
        </form>
      </div>
    </div>
  );
};

export default Delivery;