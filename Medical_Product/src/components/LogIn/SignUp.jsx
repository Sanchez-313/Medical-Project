import React, { useState } from "react";
import LoginImage from "../../assets/Engmedicines/Hero.png";
import { EyeIcon, EyeOffIcon, X } from "lucide-react";
import { FaFacebook, FaGoogle, FaTelegram, FaViber } from "react-icons/fa6";
import { Link, useNavigate } from "react-router-dom";

const SignUp = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  const closeSignUp = () => {
    if (onClose) {
      onClose();
      return;
    }
    navigate("/");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const name = `${firstName} ${lastName}`.trim();
    if (!name || !email || password.length < 6) {
      setError("Please enter name, valid email, and password (min 6 chars).");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("http://localhost:8000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role: "customer" }),
      });

      const data = await res.json();
      if (!res.ok || !data?.success) {
        setError(data?.message || "Registration failed.");
        return;
      }

      if (data?.data?.token && data?.data?.user) {
        localStorage.setItem("authToken", data.data.token);
        localStorage.setItem("authUser", JSON.stringify(data.data.user));
        window.dispatchEvent(new Event("auth-changed"));
      }

      setShowSuccessDialog(true);
      setFirstName("");
      setLastName("");
      setEmail("");
      setPassword("");
    } catch {
      setError("Cannot reach backend. Make sure API is running on localhost:8000.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  if (showSuccessDialog) {
    return (
      <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-6 text-center shadow-2xl">
          <h3 className="text-2xl font-extrabold text-slate-800">Sign Up Successfully</h3>
          <p className="mt-3 text-sm text-slate-600">
            Your account has been created and signed in successfully.
          </p>
          <button
            type="button"
            onClick={closeSignUp}
            className="mt-6 w-full rounded-xl bg-blue-600 py-3 font-bold uppercase tracking-widest text-white transition-all hover:bg-blue-700"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      {/* Main Modal Container */}
      <div className="relative flex min-h-[600px] w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl animate-in fade-in zoom-in duration-300">
        {/* Close Button for Home Page Overlay */}
        <button
          onClick={closeSignUp}
          className="absolute left-4 top-4 z-[110] rounded-full bg-slate-100 p-2 text-slate-500 transition-colors hover:bg-red-100 hover:text-red-600 lg:hidden"
        >
          <X size={20} />
        </button>

        {/* LEFT SIDE: SIGNUP FORM */}
        <div className="flex w-full flex-col items-center justify-center p-8 lg:w-1/2">
          <div className="w-full max-w-md">
            <div className="mb-8 text-center">
              <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">
                Create Your Profile
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Register to access exclusive pharmacy discounts, manage digital prescriptions, and track your wellness journey.
              </p>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="flex gap-4">
                <div className="w-1/2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    First Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. John"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>
                <div className="w-1/2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Last Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Doe"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Registered Email
                </label>
                <input
                  type="email"
                  placeholder="name@healthcare.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>

              <div className="relative">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Security Password
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Minimum 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-9 text-slate-400 hover:text-blue-600"
                >
                  {showPassword ? (
                    <EyeOffIcon size={18} />
                  ) : (
                    <EyeIcon size={18} />
                  )}
                </button>
              </div>

              {error ? <p className="text-sm text-red-600">{error}</p> : null}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-blue-600 py-3.5 font-bold text-white shadow-lg shadow-blue-200 transition-all hover:bg-blue-700 active:scale-95 uppercase tracking-widest disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Registering..." : "Register Account"}
              </button>
            </form>

            <div className="mt-10 text-center">
              <span className="bg-white px-2 text-[11px] font-bold uppercase tracking-widest text-slate-400">
                Verified Health Identity
              </span>
              <div className="mt-6 flex justify-center gap-5">
                <SocialIcon icon={<FaGoogle />} color="hover:text-red-500" />
                <SocialIcon icon={<FaFacebook />} color="hover:text-blue-600" />
                <SocialIcon icon={<FaTelegram />} color="hover:text-sky-500" />
                <SocialIcon icon={<FaViber />} color="hover:text-purple-500" />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE: BRANDING OVERLAY */}
        <div
          className="relative hidden w-1/2 flex-col justify-between bg-indigo-600 p-12 text-white lg:flex"
          style={{
            clipPath: "polygon(25% 0%, 100% 0%, 100% 100%, 25% 100%, 0% 50%)",
            backgroundImage: `linear-gradient(rgba(163, 184, 253, 0.8), rgba(69, 110, 245, 0.8)), url(${LoginImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          {/* Close button for desktop */}
          <button
            onClick={closeSignUp}
            className="absolute right-6 top-6 rounded-full bg-white/10 p-2 hover:bg-white/20 transition-colors"
          >
            <X size={20} />
          </button>

          <div className="relative z-10 text-center">
            <h2 className="text-2xl font-black tracking-tighter italic">
              AzureMed<span className="font-light text-blue-200"> HUB</span>
            </h2>
          </div>

          <div className="relative z-10 flex flex-col items-center text-center">
            <h1 className="mb-4 text-4xl font-bold uppercase">Welcome Back</h1>
            <p className="mb-8 max-w-sm text-blue-100/90 leading-relaxed">
              Already have a VitalRx account? Log in to view your medication refill history and coordinate with your doctor.
            </p>
            <Link to="/signin">
              <button className="group flex items-center gap-2 rounded-full border-2 border-white/50 px-10 py-3 font-bold transition-all hover:bg-white hover:text-blue-600 hover:border-white uppercase tracking-widest">
                Authorize Sign In
              </button>
            </Link>
          </div>

          <div className="relative z-10 text-[10px] text-blue-200/50 text-center uppercase tracking-[0.2em]">
            AES-256 Medical Data Encryption
          </div>
        </div>
      </div>
    </div>
  );
};

const SocialIcon = ({ icon, color }) => (
  <button
    className={`group relative flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-transparent hover:shadow-xl ${color}`}
  >
    <div className="absolute inset-0 scale-75 rounded-2xl bg-slate-50 opacity-0 transition-all group-hover:scale-100 group-hover:opacity-100"></div>
    <span className="relative z-10 text-xl">{icon}</span>
  </button>
);

export default SignUp;
