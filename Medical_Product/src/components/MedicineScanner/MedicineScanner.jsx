import React, { useState } from "react";
import QrScanner from "react-qr-scanner"; // You'll need to install: npm install react-qr-scanner
import {
  Search,
  QrCodeScanner,
  UploadFile,
  Lightbulb,
  Info,
  Languages,
  Translate,
  AlertTriangle,
  Inventory,
  ShoppingCart,
  CheckCircle2,
  XCircle,
  Camera,
} from "lucide-react";

const MedicineScanner = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState(null);

  // Mock database for demo purposes
  const medicineDB = {
    PARA500: {
      en: {
        name: "Paracetamol 500mg",
        desc: "A common painkiller and fever reducer.",
        benefits: [
          "Relief of mild pain",
          "Fever reduction",
          "Safe for most adults",
        ],
      },
      my: {
        name: "ပါရာစီတမော ၅၀၀ မီလီဂရမ်",
        desc: "ဖျားခြင်းနှင့် နာကျင်ခြင်းများကို သက်သာစေသောဆေး။",
        benefits: [
          "အကိုက်အခဲပျောက်ကင်းစေခြင်း",
          "ကိုယ်ပူကျစေခြင်း",
          "ညွှန်ကြားချက်အတိုင်းသောက်ပါက ဘေးကင်းခြင်း",
        ],
      },
      price: "Ks 1,500 / Strip",
      stock: "In Stock (12 Stores)",
    },
  };

  const handleScan = (data) => {
    if (data) {
      // In a real app, 'data.text' would be your ID
      const result = medicineDB["PARA500"];
      setScanResult(result);
      setIsScanning(false);
    }
  };

  const handleError = (err) => {
    console.error("Scanner Error:", err);

    if (err?.name === "NotAllowedError") {
      setError(
        "Camera access denied. Please enable camera permissions in your browser settings and refresh.",
      );
    } else if (err?.name === "NotFoundError") {
      setError("No camera found on this device.");
    } else {
      setError("An unexpected error occurred while accessing the camera.");
    }

    setIsScanning(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#101922] text-slate-900 dark:text-slate-50 font-sans transition-colors duration-300">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-blue-600">
              <QrCodeScanner size={28} />
              <span className="font-bold text-lg hidden sm:inline">
                AI OCQ Medicine
              </span>
            </div>
            <div className="relative hidden md:block">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={18}
              />
              <input
                className="bg-slate-100 dark:bg-slate-800 rounded-full py-2 pl-10 pr-4 w-64 focus:ring-2 focus:ring-blue-500 outline-none border-none"
                placeholder="Search..."
              />
            </div>
          </div>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full font-bold transition-all text-sm">
            Login
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-black mb-2">
            Medicine Scanner
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Scan QR codes to verify authenticity and view usage guides.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Camera Section */}
          <div className="lg:col-span-2 space-y-4">
            <div className="relative aspect-video bg-black rounded-3xl overflow-hidden border-4 border-white dark:border-slate-800 shadow-xl">
              {isScanning ? (
                <QrScanner
                  delay={300}
                  onError={handleError}
                  onScan={handleScan}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-800">
                  <Camera size={48} className="text-slate-400 mb-4" />
                  <p className="text-slate-500">Camera is off</p>
                </div>
              )}

              {/* Overlay UI */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-48 h-48 border-2 border-blue-500/50 rounded-2xl relative">
                  <div className="absolute top-0 w-full h-0.5 bg-blue-500 shadow-[0_0_10px_blue] animate-scan" />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => {
                  setIsScanning(!isScanning);
                  setError(null);
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-bold transition-all ${isScanning ? "bg-red-100 text-red-600" : "bg-blue-600 text-white shadow-lg shadow-blue-600/30"}`}
              >
                {isScanning ? (
                  <XCircle size={20} />
                ) : (
                  <QrCodeScanner size={20} />
                )}
                {isScanning ? "Cancel" : "Open Camera"}
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 bg-slate-200 dark:bg-slate-800 py-4 rounded-2xl font-bold">
                <UploadFile size={20} /> Upload Photo
              </button>
            </div>
            {error && (
              <p className="text-red-500 text-sm font-medium">{error}</p>
            )}
          </div>

          {/* Guide Card */}
          <div className="bg-blue-600 rounded-3xl p-8 text-white">
            <Lightbulb className="mb-4 opacity-80" size={32} />
            <h3 className="text-xl font-bold mb-4">Quick Guide</h3>
            <ul className="space-y-6 opacity-90 text-sm">
              <li className="flex gap-3">
                <span className="bg-white/20 size-6 rounded-full flex items-center justify-center shrink-0">
                  1
                </span>
                Point camera at the QR code on the box.
              </li>
              <li className="flex gap-3">
                <span className="bg-white/20 size-6 rounded-full flex items-center justify-center shrink-0">
                  2
                </span>
                Keep steady for 2 seconds.
              </li>
              <li className="flex gap-3">
                <span className="bg-white/20 size-6 rounded-full flex items-center justify-center shrink-0">
                  3
                </span>
                View information in English or Myanmar.
              </li>
            </ul>
          </div>
        </div>

        {/* Results Section */}
        {scanResult && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-500">
            <div className="flex items-center justify-between border-b pb-4 dark:border-slate-800">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <CheckCircle2 className="text-green-500" /> Results Found
              </h2>
              <span className="bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full font-bold">
                AUTHENTIC
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InfoCard
                lang="EN"
                data={scanResult.en}
                icon={<Languages size={18} />}
              />
              <InfoCard
                lang="MY"
                data={scanResult.my}
                icon={<Translate size={18} />}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatBox
                label="Price"
                value={scanResult.price}
                icon={<ShoppingCart />}
              />
              <StatBox
                label="Stock"
                value={scanResult.stock}
                icon={<Inventory />}
              />
              <StatBox
                label="Precautions"
                value="Safety Labels"
                icon={<AlertTriangle />}
                active
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

// Helper Components
const InfoCard = ({ lang, data, icon }) => (
  <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
    <div className="flex items-center gap-2 text-blue-600 mb-4 font-bold text-sm">
      {icon} {lang} Information
    </div>
    <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-2">
      {data.name}
    </h3>
    <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 leading-relaxed">
      {data.desc}
    </p>
    <ul className="space-y-2">
      {data.benefits.map((b, i) => (
        <li
          key={i}
          className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400"
        >
          <div className="size-1.5 rounded-full bg-blue-500" /> {b}
        </li>
      ))}
    </ul>
  </div>
);

const StatBox = ({ label, value, icon, active }) => (
  <div
    className={`p-4 rounded-2xl border flex items-center gap-4 transition-all ${active ? "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800" : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"}`}
  >
    <div className="text-blue-600">{icon}</div>
    <div>
      <p className="text-[10px] uppercase font-bold text-slate-400">{label}</p>
      <p className="text-sm font-bold">{value}</p>
    </div>
  </div>
);

export default MedicineScanner;
