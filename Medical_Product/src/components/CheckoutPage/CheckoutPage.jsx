import React, { useState } from 'react';
import { 
  ShoppingCart, User, Search, ChevronRight, 
  Truck, CreditCard, Lock, CheckCircle, 
  Phone, Mail, Package, Home
} from 'lucide-react';

const CheckoutPage = () => {
  const [paymentMethod, setPaymentMethod] = useState('kpay');
  const [ setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    city: 'Yangon',
    address: ''
  });

  const cartItems = [
    { id: 1, name: 'Paracetamol 500mg', qty: '2 packs', price: 12000, img: '💊' },
    { id: 2, name: 'Vitamin C Supplements', qty: '1 bottle', price: 18500, img: '🍊' }
  ];

  const subtotal = cartItems.reduce((acc, item) => acc + item.price, 0);
  const tax = subtotal * 0.05; // 5% tax
  const total = subtotal + tax;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans pb-20">

      <main className="max-w-7xl mx-auto px-4 py-8 lg:px-8">
  
        <div className="mb-10">
          <h1 className="text-4xl font-black tracking-tight text-slate-900 mb-2">Checkout</h1>
          <p className="text-slate-500">Please provide your delivery information to complete the order.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Left: Forms */}
          <div className="lg:col-span-7 space-y-10">
            
            {/* Shipping Info */}
            <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                  <Truck size={24} />
                </div>
                <h2 className="text-2xl font-black">Shipping Details</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField label="Full Name" name="fullName" placeholder="Aung Kyaw" icon={<User size={18}/>} onChange={handleInputChange} />
                <InputField label="Email Address" name="email" placeholder="aung@example.com" type="email" icon={<Mail size={18}/>} onChange={handleInputChange} />
                <InputField label="Phone Number" name="phone" placeholder="+95 9..." type="tel" icon={<Phone size={18}/>} onChange={handleInputChange} />
                
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-black ml-1 uppercase tracking-tighter text-slate-500">City</label>
                  <select 
                    name="city"
                    onChange={handleInputChange}
                    className="h-14 px-4 rounded-2xl border-slate-100 bg-slate-50 focus:ring-2 focus:ring-blue-500 appearance-none font-bold"
                  >
                    <option>Mandalay</option>
                    <option>Yangon</option>
                    <option>Naypyidaw</option>
                  </select>
                </div>
                
                <div className="md:col-span-2 flex flex-col gap-2">
                  <label className="text-sm font-black ml-1 uppercase tracking-tighter text-slate-500">Delivery Address</label>
                  <textarea 
                    name="address"
                    onChange={handleInputChange}
                    rows="3" 
                    className="p-5 rounded-2xl border-slate-100 bg-slate-50 focus:ring-2 focus:ring-blue-500 w-full font-medium"
                    placeholder="House number, Street, Township..."
                  ></textarea>
                </div>
              </div>
            </section>

            {/* Payment Selection */}
            <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                  <CreditCard size={24} />
                </div>
                <h2 className="text-2xl font-black">Payment Method</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <PaymentOption 
                  id="kpay"
                  title="KBZ Pay"
                  description="Instant mobile transfer"
                  selected={paymentMethod === 'kpay'}
                  onClick={() => setPaymentMethod('kpay')}
                  logo={<div className="bg-[#0056b3] text-white text-[10px] font-black px-2 py-1 rounded">KPAY</div>}
                />
                <PaymentOption 
                  id="cod"
                  title="Cash on Delivery"
                  description="Pay when medicine arrives"
                  selected={paymentMethod === 'cod'}
                  onClick={() => setPaymentMethod('cod')}
                  logo={<Truck size={22} className="text-slate-400" />}
                />
              </div>
            </section>
          </div>

          {/* Right: Summary Card */}
          <div className="lg:col-span-5">
            <div className="sticky top-28 p-10 rounded-[3rem] border border-slate-100 bg-white shadow-2xl shadow-blue-900/5">
              <h3 className="text-2xl font-black mb-8">Order Summary</h3>
              
              <div className="space-y-6 mb-8 max-h-[300px] overflow-y-auto pr-2 no-scrollbar">
                {cartItems.map(item => (
                  <div key={item.id} className="flex items-center gap-5 group">
                    <div className="size-16 rounded-2xl bg-slate-50 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                      {item.img}
                    </div>
                    <div className="flex-1">
                      <p className="font-black text-slate-800">{item.name}</p>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{item.qty}</p>
                    </div>
                    <p className="font-black text-slate-900">{item.price.toLocaleString()} MMK</p>
                  </div>
                ))}
              </div>

              <div className="space-y-4 pt-8 border-t border-slate-50">
                <SummaryRow label="Subtotal" value={`${subtotal.toLocaleString()} MMK`} />
                <SummaryRow label="Delivery Fee" value="FREE" isFree />
                <SummaryRow label="Government Tax (5%)" value={`${tax.toLocaleString()} MMK`} />
                
                <div className="flex justify-between items-center pt-6 border-t border-slate-100 mt-4">
                  <span className="text-lg font-black text-slate-400 uppercase tracking-tighter">Total Amount</span>
                  <span className="text-4xl font-black text-blue-600">{total.toLocaleString()} <span className="text-sm">MMK</span></span>
                </div>
              </div>

              <button className="w-full mt-10 bg-blue-600 hover:bg-blue-700 text-white font-black py-5 rounded-[2rem] shadow-xl shadow-blue-200 transition-all hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-3">
                Confirm & Place Order
              </button>
              
              <div className="flex items-center justify-center gap-2 mt-8 text-slate-300">
                <Lock size={14} />
                <span className="text-[10px] font-black uppercase tracking-widest">Secure 256-bit SSL Connection</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

// Helper Components
const InputField = ({ label, name, placeholder, type = "text", icon, onChange }) => (
  <div className="flex flex-col gap-2">
    <label className="text-sm font-black ml-1 uppercase tracking-tighter text-slate-500">{label}</label>
    <div className="relative">
      <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400">{icon}</div>
      <input 
        name={name}
        type={type}
        onChange={onChange}
        className="w-full h-14 pl-14 pr-4 rounded-2xl border-slate-100 bg-slate-50 focus:ring-2 focus:ring-blue-500 font-medium transition-all" 
        placeholder={placeholder} 
      />
    </div>
  </div>
);

const PaymentOption = ({ title, description, selected, onClick, logo }) => (
  <div 
    onClick={onClick}
    className={`p-6 rounded-[2rem] border-2 cursor-pointer transition-all duration-300 ${
      selected 
        ? 'border-blue-500 bg-blue-50/30 ring-4 ring-blue-50' 
        : 'border-slate-50 bg-slate-50/50 hover:border-slate-200'
    }`}
  >
    <div className="flex justify-between items-start mb-4">
      <div className="p-3 rounded-xl bg-white shadow-sm border border-slate-50">{logo}</div>
      {selected && <CheckCircle className="text-blue-600" size={24} fill="currentColor" fillOpacity={0.1} />}
    </div>
    <p className="font-black text-slate-900">{title}</p>
    <p className="text-xs font-bold text-slate-400 mt-1">{description}</p>
  </div>
);

const SummaryRow = ({ label, value, isFree }) => (
  <div className="flex justify-between text-sm">
    <span className="font-bold text-slate-400">{label}</span>
    <span className={isFree ? 'text-emerald-500 font-black tracking-widest' : 'font-black text-slate-700'}>{value}</span>
  </div>
);

export default CheckoutPage;