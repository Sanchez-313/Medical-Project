import React, { useState } from "react";
import LoginImage from "../../assets/Engmedicines/FAQsection.jpg";
import Logo from "../../assets/Logo/logo.png";
import { FaFacebook, FaGoogle, FaTelegram, FaViber } from "react-icons/fa6";
import { X } from "lucide-react"; 
import { Link, useNavigate } from "react-router-dom"; // Use Link for internal routing
import { API_BASE_URL } from "../../lib/api";

const SignIn = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const closeSignIn = () => {
    if (onClose) {
      onClose();
      return;
    }
    navigate("/");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Please enter email and password.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok || !data?.success) {
        setError(data?.message || "Sign in failed.");
        return;
      }

      if (data?.data?.token && data?.data?.user) {
        localStorage.setItem("authToken", data.data.token);
        localStorage.setItem("authUser", JSON.stringify(data.data.user));
        window.dispatchEvent(new Event("auth-changed"));
      }

      closeSignIn();
    } catch {
      setError(`Cannot reach backend. Make sure API is running on ${API_BASE_URL}.`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4">
      <div className="relative flex min-h-[600px] w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl animate-in fade-in zoom-in duration-300">
        
        {/* MOBILE CLOSE BUTTON */}
        <button
          onClick={closeSignIn}
          className="absolute right-4 top-4 z-[1001] rounded-full bg-slate-100 p-2 text-slate-500 lg:hidden"
        >
          <X size={20} />
        </button>

        {/* LEFT SIDE: BRANDING & CALL TO ACTION */}
        <section
          className="relative hidden w-1/2 flex-col justify-between p-12 text-white lg:flex"
          style={{
            clipPath: "polygon(0% 0%, 75% 0%, 100% 50%, 75% 100%, 0% 100%)",
            backgroundImage: `url(${LoginImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="absolute inset-0 bg-blue-900/70 z-0"></div>

          <div className="relative z-10 flex items-center gap-3">
            <img
              src={Logo}
              alt="AzureMed Hub logo"
              className="h-12 w-12 rounded-2xl object-contain bg-white/10 p-1.5"
            />
            <div className="flex items-center gap-1 whitespace-nowrap">
              <span className="text-2xl font-black tracking-tight italic">
                AzureMed
              </span>
              <span className="text-2xl font-black tracking-tight italic text-blue-300">
                HUB
              </span>
            </div>
          </div>

          <div className="relative z-10 flex flex-col items-center text-center">
            <h1 className="mb-4 text-4xl font-bold uppercase tracking-tight">Need an Account?</h1>
            <p className="mb-10 max-w-xs text-lg text-blue-50/90 leading-relaxed">
              Join our wellness community to manage your digital prescriptions, refill history, and expert pharmacist consultations.
            </p>
            <Link to="/signup">
              <button
                type="button"
                className="group flex items-center gap-2 rounded-full border-2 border-white px-10 py-3 font-bold uppercase tracking-widest transition-all hover:bg-white hover:text-blue-700"
              >
                Create Health Profile
              </button>
            </Link>
          </div>

          <div className="relative z-10 text-[10px] text-blue-200/50 uppercase tracking-[0.3em] font-bold">
            HIPAA Compliant • Secure Access
          </div>
        </section>

        {/* RIGHT SIDE: LOGIN FORM */}
        <section className="flex w-full flex-col items-center justify-center p-8 lg:w-1/2">
          {/* DESKTOP CLOSE BUTTON */}
          <button
            onClick={closeSignIn}
            className="absolute right-6 top-6 hidden text-slate-300 hover:text-slate-600 lg:block transition-colors"
          >
            <X size={24} />
          </button>

          <div className="w-full max-w-md">
            <header className="mb-10 text-center">
              <div className="mb-4 flex items-center justify-center gap-3">
                <img
                  src={Logo}
                  alt="AzureMed Hub logo"
                  className="h-12 w-12 rounded-2xl object-contain bg-slate-100 p-1.5"
                />
                <div className="flex items-center gap-1 whitespace-nowrap">
                  <span className="text-2xl font-black tracking-tight text-indigo-400 italic">
                    AzureMed
                  </span>
                  <span className="text-2xl font-black tracking-tight text-blue-600 italic">
                    HUB
                  </span>
                </div>
              </div>
              <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">
                Welcome Back
              </h2>
              <p className="mt-3 text-slate-500 text-sm">
                Sign in to access for using AI OCR and medicine discount.
              </p>
            </header>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Patient Email / Health ID
                </label>
                <input
                  type="email"
                  placeholder="e.g. john.doe@healthcare.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-sm outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
                />
              </div>

              <div className="relative">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Security Password
                  </label>
                  <a href="#" className="text-[10px] font-bold text-blue-600 hover:underline uppercase">
                    Forgot Password?
                  </a>
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-sm outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-[38px] text-slate-400 hover:text-blue-600 transition-colors"
                >
                   {showPassword ? (
                    <span className="text-[10px] font-bold">HIDE</span>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                  )}
                </button>
              </div>

              <div className="flex items-center gap-3 py-1">
                <input
                  type="checkbox"
                  id="remember"
                  className="h-4 w-4 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="remember" className="text-xs font-semibold text-slate-500 cursor-pointer">
                  Keep me Log In
                </label>
              </div>

              {error ? <p className="text-sm text-red-600">{error}</p> : null}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-blue-600 py-4 text-sm font-bold tracking-[0.15em] text-white shadow-xl shadow-blue-100 transition-all hover:bg-blue-700 hover:shadow-blue-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Signing In..." : "Secure LOGIN"}
              </button>
            </form>

            <footer className="mt-12 text-center">
              <div className="relative mb-6 flex items-center justify-center">
                <div className="absolute w-full border-t border-slate-100"></div>
                <span className="relative bg-white px-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Verified Health Login
                </span>
              </div>
              <div className="flex justify-center gap-4">
                <SocialIcon icon={<FaGoogle />} color="text-red-500 hover:bg-red-50" />
                <SocialIcon icon={<FaFacebook />} color="text-blue-800 hover:bg-blue-50" />
                <SocialIcon icon={<FaTelegram />} color="text-sky-500 hover:bg-sky-50" />
                <SocialIcon icon={<FaViber />} color="text-purple-600 hover:bg-purple-50" />
              </div>
            </footer>
          </div>
        </section>
      </div>
    </div>
  );
};

const SocialIcon = ({ icon, color }) => (
  <button className={`flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-100 bg-white text-xl shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md ${color}`}>
    {icon}
  </button>
);

export default SignIn;
