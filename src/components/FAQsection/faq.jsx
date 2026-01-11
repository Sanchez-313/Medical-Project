import React from "react";
const FAQ = () => {
  const [openIndex, setOpenIndex] = React.useState(null);

  const faqs = [
    {
      question: "How do I place a medicine order?",
      answer:
        "You can place an order by signing in, selecting the medicines you need, and confirming your delivery address. Our team will process it immediately."
    },
    {
      question: "How fast is the delivery?",
      answer:
        "We aim to deliver within a few hours in the city. Delivery times may vary depending on your location, but urgent prescriptions are prioritized."
    },
    {
      question: "Are the medicines authentic?",
      answer:
        "Yes, all medicines are sourced directly from licensed pharmacies and distributors. We guarantee authenticity and proper storage conditions."
    },
    {
      question: "Can I track my delivery?",
      answer:
        "Absolutely. Once your order is confirmed, you’ll receive a tracking link to monitor your delivery in real time."
    },
    {
      question: "Do you offer customer support?",
      answer:
        "Yes, our support team is available 24/7 to assist with orders, prescription uploads, and delivery inquiries."
    }
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&display=swap');
        * { font-family: 'Poppins', sans-serif; }
      `}</style>

      <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-start justify-center gap-8 px-4 py-8 md:px-0">
        <img
          className="max-w-md w-full rounded-xl h-[430px] hover:scale-103 hover:shadow-xl"
          src="/src/assets/partners/FAQsection.jpg"
          alt="Medicine delivery illustration"
        />
        <div>
          <p className="text-indigo-600 text-lg font-lg">FAQ's</p>
          <h1 className="text-3xl font-semibold">Need help with your delivery?</h1>
          <p className="text-sm text-slate-500 mt-2 pb-4">
            Fast, reliable medical delivery service — authentic medicines, trusted pharmacies, and real-time tracking.
          </p>

          {faqs.map((faq, index) => (
            <div
              className="border-b border-slate-200 py-4 cursor-pointer"
              key={index}
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-medium">{faq.question}</h3>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 18 18"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className={`${
                    openIndex === index ? "rotate-180" : ""
                  } transition-all duration-500 ease-in-out`}
                >
                  <path
                    d="m4.5 7.2 3.793 3.793a1 1 0 0 0 1.414 0L13.5 7.2"
                    stroke="#1D293D"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <p
                className={`text-sm text-slate-500 transition-all duration-500 ease-in-out max-w-md ${
                  openIndex === index
                    ? "opacity-100 max-h-[300px] translate-y-0 pt-4"
                    : "opacity-0 max-h-0 -translate-y-2"
                }`}
              >
                {faq.answer}
              </p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default FAQ;