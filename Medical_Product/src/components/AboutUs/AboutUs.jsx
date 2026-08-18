import React from "react";
import { ShieldCheck, HeartPulse, Truck, Users } from "lucide-react";
import Values from "../Values/Values";
import Process from "../Process/Process";
import ContactUs from "../ContactUs/ContactUs";

const highlights = [
  {
    icon: ShieldCheck,
    title: "Trusted Products",
    description:
      "We focus on reliable medicines, wellness products, and practical medical supplies that customers can order with confidence.",
  },
  {
    icon: HeartPulse,
    title: "Healthcare First",
    description:
      "Every part of the experience is designed to make health support feel clearer, faster, and easier for families and clinics.",
  },
  {
    icon: Truck,
    title: "Simple Delivery",
    description:
      "From quick product discovery to checkout and delivery updates, we aim to remove friction from urgent healthcare shopping.",
  },
  {
    icon: Users,
    title: "Human Support",
    description:
      "We combine digital convenience with responsive support so customers can get help when they need it most.",
  },
];

const AboutUs = () => {
  return (
    <>
      <section className="bg-[linear-gradient(180deg,#eef6ff_0%,#ffffff_42%,#f4fbf7_100%)] pt-28 pb-14">
        <div className="mx-auto max-w-[1180px] px-6">
          <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div>
              <span className="inline-flex rounded-full border border-sky-200 bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.28em] text-sky-700">
                About AzureMed Hub
              </span>
              <h1 className="mt-6 max-w-3xl text-4xl font-black tracking-tight text-slate-900 md:text-5xl">
                Digital pharmacy support built for everyday healthcare needs
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600">
                AzureMed Hub brings together English medicines, Myanmar traditional
                medicines, and essential medical equipment in one accessible online
                experience. Our goal is to make product discovery, stock awareness,
                and healthcare shopping feel dependable from start to finish.
              </p>
            </div>

            <div className="rounded-[32px] border border-sky-100 bg-white p-7 shadow-[0_25px_70px_rgba(14,116,144,0.12)]">
              <p className="text-sm font-bold uppercase tracking-[0.24em] text-sky-700">
                What We Believe
              </p>
              <div className="mt-5 space-y-4 text-sm leading-7 text-slate-600">
                <p>
                  Safe and transparent access to medical products should feel simple,
                  not confusing.
                </p>
                <p>
                  Customers should be able to understand what a product is for, how to
                  use it, and whether it is currently available.
                </p>
                <p>
                  Technology should support healthcare decisions with clarity, not add
                  extra stress during urgent moments.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {highlights.map(({ icon: Icon, title, description }) => (
              <article
                key={title}
                className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="inline-flex rounded-2xl bg-sky-100 p-3 text-sky-700">
                  <Icon className="h-6 w-6" />
                </div>
                <h2 className="mt-4 text-xl font-black text-slate-900">{title}</h2>
                <p className="mt-3 text-sm leading-7 text-slate-600">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="pb-6">
        <div className="mx-auto max-w-[1180px] px-6">
          <div className="rounded-[32px] border border-slate-200 bg-white p-7 shadow-sm md:p-9">
            <div className="grid gap-8 lg:grid-cols-3">
              <article>
                <h3 className="text-lg font-black text-slate-900">Who We Are</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  We are building a healthcare-focused shopping platform that connects
                  customers with quality medicines and practical care essentials in a
                  cleaner digital format.
                </p>
              </article>
              <article>
                <h3 className="text-lg font-black text-slate-900">Our Mission</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  Our mission is to provide safe, affordable, and understandable access
                  to pharmacy products while improving trust with better stock visibility
                  and stronger product guidance.
                </p>
              </article>
              <article>
                <h3 className="text-lg font-black text-slate-900">Why It Matters</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  People often shop for health products during stressful moments. We want
                  the experience to stay calm, accurate, and supportive all the way to
                  checkout.
                </p>
              </article>
            </div>
          </div>
        </div>
      </section>

      <Values />
      <Process />
      <ContactUs />
    </>
  );
};

export default AboutUs;
