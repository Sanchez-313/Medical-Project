import Navbar from "../components/navbar/navbar";
import Categories from "../components/Categories/Categories";
import Products from "../components/Product/products";
import GoalCard from "../components/Features/goalcard";
import Footer from "../components/Footer/footer";
import Banner from "../components/Banner/banner";
import Partnership from "../components/Partnership/partnership";
import Reviews from "../components/Reviews/reviews";
import Delivery from "../components/Delivery/delivery";
import FAQ from "../components/FAQsection/faq";

export default function Main() {
  return (
    <>
      <div className="bg-gray-300">
        <div>
          <Navbar />
        </div>

        <div className="container w-full p-4">
          <Categories />
        </div>

        <div className="bg-gray-100">
          <Banner/>
        </div>

        <div className="bg-indigo-100 p-4">
          <Products />
        </div>

        <div className="bg-gray-50 p-4">
          <GoalCard />
        </div>

        <div className="bg-indigo-100 ">
          <Partnership />
        </div>

        <div className="bg-amber-50 ">
          <Delivery />
        </div>

        <div className="bg-blue-50 ">
          <Reviews />
        </div>

        <div className="bg-slate-200 ">
          <FAQ />
        </div>

        <div>
          <Footer />
        </div>
      </div>
    </>
  );
}
