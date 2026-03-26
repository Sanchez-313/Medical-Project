import React, { useEffect, useRef, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { 
  User,
  Truck, CreditCard, Lock, CheckCircle, 
  Phone, Mail, X
} from 'lucide-react';

const API_BASE_URL = 'http://localhost:8000';

const CheckoutPage = () => {
  const outletContext = useOutletContext() || {};
  const { cartItems = [], addOrder, clearCart } = outletContext;
  const shippingSectionRef = useRef(null);

  const [paymentMethod, setPaymentMethod] = useState('kpay');
  const [kpayScreenshot, setKpayScreenshot] = useState(null);
  const [kpayScreenshotPreview, setKpayScreenshotPreview] = useState('');
  const screenshotInputRef = useRef(null);
  const [paymentNotice, setPaymentNotice] = useState({ type: '', message: '' });
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    city: 'Yangon',
    address: ''
  });
  const [invoiceOrder, setInvoiceOrder] = useState(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [missingShippingFields, setMissingShippingFields] = useState({});
  const [shippingAlert, setShippingAlert] = useState('');

  /*
  const cartItems = [
    { id: 1, name: 'Paracetamol 500mg', qty: '2 packs', price: 12000, img: '💊' },
    { id: 2, name: 'Vitamin C Supplements', qty: '1 bottle', price: 18500, img: '🍊' }
  ];

  */
  const subtotal = cartItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );
  const tax = subtotal * 0.05; // 5% tax
  const total = subtotal + tax;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setMissingShippingFields((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const validateShippingDetails = () => {
    const requiredKeys = ['fullName', 'email', 'phone', 'city', 'address'];
    return requiredKeys.filter((key) => String(formData[key] || '').trim() === '');
  };

  useEffect(() => {
    if (!kpayScreenshot) {
      setKpayScreenshotPreview('');
      return;
    }
    const previewUrl = URL.createObjectURL(kpayScreenshot);
    setKpayScreenshotPreview(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [kpayScreenshot]);

  useEffect(() => {
    setPaymentNotice({ type: '', message: '' });
    setInvoiceOrder(null);
    setShowInvoiceModal(false);
  }, [paymentMethod]);

  useEffect(() => {
    if (!shippingAlert) return;
    const timer = setTimeout(() => setShippingAlert(''), 2600);
    return () => clearTimeout(timer);
  }, [shippingAlert]);

  const handleRemoveScreenshot = () => {
    setKpayScreenshot(null);
    if (screenshotInputRef.current) {
      screenshotInputRef.current.value = '';
    }
  };
  const handleConfirmPayment = async () => {
    setInvoiceOrder(null);
    setShowInvoiceModal(false);

    if (cartItems.length === 0) {
      setPaymentNotice({
        type: 'error',
        message: 'Your cart is empty. Please add items before checkout.',
      });
      return;
    }

    const missingFields = validateShippingDetails();
    if (missingFields.length > 0) {
      const nextMissing = missingFields.reduce((acc, key) => {
        acc[key] = true;
        return acc;
      }, {});
      setMissingShippingFields(nextMissing);
      setShippingAlert('Please enter the shipping details first before confirming payment.');
      shippingSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      const firstMissing = missingFields[0];
      const firstInput = document.querySelector(`[name="${firstMissing}"]`);
      if (firstInput && typeof firstInput.focus === 'function') {
        firstInput.focus();
      }
      setPaymentNotice({
        type: 'error',
        message: 'Please fill all required shipping details.',
      });
      return;
    }

    if (paymentMethod === 'kpay') {
      if (!kpayScreenshot) {
        setPaymentNotice({
          type: 'error',
          message: 'Please upload your KPay transaction screenshot.',
        });
        return;
      }
    }

    const orderPayload = {
      id: `ORD-${Date.now()}`,
      createdAt: new Date().toISOString(),
      paymentMethod: paymentMethod === 'kpay' ? 'KBZ Pay' : 'Cash on Delivery',
      shipping: { ...formData },
      items: cartItems.map((item) => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.price,
        totalPrice: item.price * item.quantity,
      })),
      subtotal,
      tax,
      total,
      kpayScreenshotName: kpayScreenshot?.name || '',
    };

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setPaymentNotice({
          type: 'error',
          message: 'Please sign in first before placing an order.',
        });
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          payment_method: paymentMethod === 'kpay' ? 'kpay' : 'cod',
          shipping: { ...formData },
          items: cartItems.map((item) => ({
            product_id: Number(item.id),
            qty: Number(item.quantity) || 1,
          })),
        }),
      });

      const data = await response.json();
      if (!response.ok || !data?.success) {
        setPaymentNotice({
          type: 'error',
          message: data?.message || 'Order could not be placed.',
        });
        return;
      }

      const savedOrder = {
        ...orderPayload,
        id: data?.data?.order_code || orderPayload.id,
        createdAt: new Date().toISOString(),
        subtotal: Number(data?.data?.subtotal_ks || subtotal),
        tax: Number(data?.data?.tax_ks || tax),
        total: Number(data?.data?.total_ks || total),
        status: data?.data?.status || 'pending',
      };

      addOrder?.(savedOrder);
      clearCart?.();
      setInvoiceOrder(savedOrder);
      setShowInvoiceModal(true);
      setKpayScreenshot(null);
      if (screenshotInputRef.current) {
        screenshotInputRef.current.value = '';
      }

      setPaymentNotice({
        type: 'success',
        message:
          paymentMethod === 'kpay'
            ? 'Payment confirmed and order saved to the backend.'
            : 'Order confirmed and saved to the backend.',
      });
    } catch {
      setPaymentNotice({
        type: 'error',
        message: 'Cannot reach backend order API. Please make sure the server is running.',
      });
    }
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
            <section ref={shippingSectionRef} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                  <Truck size={24} />
                </div>
                <h2 className="text-2xl font-black">Shipping Details</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField label="Full Name" name="fullName" placeholder="Aung Kyaw" icon={<User size={18}/>} onChange={handleInputChange} value={formData.fullName} hasError={Boolean(missingShippingFields.fullName)} />
                <InputField label="Email Address" name="email" placeholder="aung@example.com" type="email" icon={<Mail size={18}/>} onChange={handleInputChange} value={formData.email} hasError={Boolean(missingShippingFields.email)} />
                <InputField label="Phone Number" name="phone" placeholder="+95 9..." type="tel" icon={<Phone size={18}/>} onChange={handleInputChange} value={formData.phone} hasError={Boolean(missingShippingFields.phone)} />
                
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-black ml-1 uppercase tracking-tighter text-slate-500">
                    City{missingShippingFields.city ? <span className="ml-1 text-red-600">*</span> : null}
                  </label>
                  <select 
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className={`h-14 px-4 rounded-2xl bg-slate-50 focus:ring-2 focus:ring-blue-500 appearance-none font-bold ${
                      missingShippingFields.city ? 'border-red-500 ring-1 ring-red-100' : 'border-slate-100'
                    }`}
                  >
                    <option>Yangon</option>
                    <option>Mandalay</option>
                    <option>Naypyidaw</option>
                  </select>
                </div>
                
                <div className="md:col-span-2 flex flex-col gap-2">
                  <label className="text-sm font-black ml-1 uppercase tracking-tighter text-slate-500">
                    Delivery Address{missingShippingFields.address ? <span className="ml-1 text-red-600">*</span> : null}
                  </label>
                  <textarea 
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    rows="3" 
                    className={`p-5 rounded-2xl bg-slate-50 focus:ring-2 focus:ring-blue-500 w-full font-medium ${
                      missingShippingFields.address ? 'border-red-500 ring-1 ring-red-100' : 'border-slate-100'
                    }`}
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
              {paymentMethod === 'kpay' ? (
                <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-3 rounded-xl border border-blue-100 bg-blue-50 p-3 text-sm text-slate-700">
                    <p className="font-black text-blue-700">KBZ Pay Number</p>
                    <p className="mt-1 font-semibold">+95 9 456 789 123</p>
                    <p className="mt-3 font-black text-blue-700">Demo Bank Account</p>
                    <p className="mt-1">Bank: KBZ Bank</p>
                    <p>Account Name: AzureMed Hub Demo</p>
                    <p>Account Number: 009 123 456 789</p>
                  </div>
                  <label className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-500">
                    KPay Transaction Screenshot
                  </label>
                  <input
                    ref={screenshotInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => setKpayScreenshot(e.target.files?.[0] || null)}
                    className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none file:mr-4 file:rounded-lg file:border-0 file:bg-blue-600 file:px-3 file:py-2 file:text-xs file:font-black file:text-white hover:file:bg-blue-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                  {kpayScreenshot ? (
                    <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3">
                      <div className="mb-3 flex items-center justify-between">
                        <p className="truncate pr-3 text-xs font-semibold text-slate-600">
                          {kpayScreenshot.name}
                        </p>
                        <button
                          type="button"
                          onClick={handleRemoveScreenshot}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:border-red-300 hover:text-red-600"
                          aria-label="Remove selected screenshot"
                        >
                          <X size={14} />
                        </button>
                      </div>
                      {kpayScreenshotPreview ? (
                        <img
                          src={kpayScreenshotPreview}
                          alt="KPay transaction screenshot preview"
                          className="h-48 w-full rounded-lg border border-slate-100 object-contain bg-slate-50"
                        />
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-600">
                  Payment will be confirmed from the Order Summary button.
                </div>
              )}
              {paymentNotice.message ? (
                <div
                  className={`mt-4 rounded-2xl border px-4 py-3 text-sm font-semibold ${
                    paymentNotice.type === 'error'
                      ? 'border-red-200 bg-red-50 text-red-700'
                      : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  }`}
                >
                  {paymentNotice.message}
                </div>
              ) : null}
            </section>
          </div>

          {/* Right: Summary Card */}
          <div className="lg:col-span-5">
            <div className="sticky top-28 p-10 rounded-[3rem] border border-slate-100 bg-white shadow-2xl shadow-blue-900/5">
              <h3 className="text-2xl font-black mb-8">Order Summary</h3>
              
              <div className="space-y-6 mb-8 max-h-[300px] overflow-y-auto pr-2 no-scrollbar">
                {cartItems.length === 0 ? (
                  <div className="rounded-2xl border border-slate-100 p-6 text-center text-slate-500">
                    Your cart is empty.
                  </div>
                ) : (
                  cartItems.map(item => (
                    <div key={item.id} className="flex items-center gap-5 group">
                      <div className="size-16 rounded-2xl bg-slate-50 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform overflow-hidden">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="h-full w-full object-contain" />
                        ) : (
                          <span>🧴</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-black text-slate-800">{item.name}</p>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                          Qty {item.quantity}
                        </p>
                      </div>
                      <p className="font-black text-slate-900">
                        {(item.price * item.quantity).toLocaleString()} MMK
                      </p>
                    </div>
                  ))
                )}
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

              <div className="mt-10 flex flex-col items-center gap-6">
                <button
                  type="button"
                  onClick={handleConfirmPayment}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-5 rounded-[2rem] shadow-xl shadow-blue-200 transition-all hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-3"
                >
                  {paymentMethod === 'kpay' ? 'Confirm KPay Payment' : 'Confirm Cash on Delivery'}
                </button>
                <Link
                  to="/cart"
                  className="w-full max-w-sm rounded-full border-2 border-blue-600/20 bg-gradient-to-r from-slate-50 to-white py-3 text-center text-sm font-black text-slate-700 shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-600/60 hover:text-blue-700 hover:shadow-md active:translate-y-0"
                >
                  Go Back to Cart
                </Link>
              </div>
              
              <div className="flex items-center justify-center gap-2 mt-8 text-slate-300">
                <Lock size={14} />
                <span className="text-[10px] font-black uppercase tracking-widest">Secure 256-bit SSL Connection</span>
              </div>
            </div>
          </div>
        </div>
      </main>
      {shippingAlert ? (
        <div className="fixed bottom-6 left-1/2 z-[260] -translate-x-1/2 rounded-full border border-red-200 bg-red-600 px-7 py-3 text-sm font-extrabold text-white shadow-2xl shadow-red-300">
          {shippingAlert}
        </div>
      ) : null}
      {showInvoiceModal && invoiceOrder ? (
        <div className="fixed inset-0 z-[280] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-3xl rounded-xl border border-slate-200 bg-white p-5 shadow-2xl md:p-7">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-2xl font-black text-slate-900">Order Bill</h3>
                <p className="text-xs font-semibold text-slate-500">
                  {new Date(invoiceOrder.createdAt).toLocaleString()} | {invoiceOrder.id}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowInvoiceModal(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                aria-label="Close invoice"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
              <p><span className="font-black">Customer:</span> {invoiceOrder.shipping.fullName}</p>
              <p><span className="font-black">Payment:</span> {invoiceOrder.paymentMethod}</p>
              <p><span className="font-black">Phone:</span> {invoiceOrder.shipping.phone}</p>
              <p><span className="font-black">City:</span> {invoiceOrder.shipping.city}</p>
            </div>

            <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50">
                  <tr className="text-left text-xs uppercase tracking-wider text-slate-500">
                    <th className="px-4 py-3">Item Name</th>
                    <th className="px-4 py-3">Quantity</th>
                    <th className="px-4 py-3">Price</th>
                    <th className="px-4 py-3">Total Price</th>
                  </tr>
                </thead>
                <tbody>
                  {invoiceOrder.items.map((item) => (
                    <tr key={`${invoiceOrder.id}-${item.id}`} className="border-t border-slate-100">
                      <td className="px-4 py-3 font-semibold text-slate-800">{item.name}</td>
                      <td className="px-4 py-3 text-slate-700">{item.quantity}</td>
                      <td className="px-4 py-3 text-slate-700">{Number(item.unitPrice).toLocaleString()} MMK</td>
                      <td className="px-4 py-3 font-bold text-slate-900">{Number(item.totalPrice).toLocaleString()} MMK</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 ml-auto w-full max-w-xs space-y-1 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-600">Subtotal</span>
                <span className="font-bold text-slate-800">{Number(invoiceOrder.subtotal).toLocaleString()} MMK</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-600">Tax (5%)</span>
                <span className="font-bold text-slate-800">{Number(invoiceOrder.tax).toLocaleString()} MMK</span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-200 pt-2 text-base">
                <span className="font-black text-slate-700">Total</span>
                <span className="font-black text-blue-700">{Number(invoiceOrder.total).toLocaleString()} MMK</span>
              </div>
            </div>

            <div className="mt-6 flex flex-col items-stretch gap-3 md:flex-row md:justify-end">
              <Link
                to="/orders"
                onClick={() => setShowInvoiceModal(false)}
                className="rounded-lg border border-blue-200 px-5 py-2.5 text-center text-sm font-bold text-blue-700 hover:bg-blue-50"
              >
                View All Bills
              </Link>
              <button
                type="button"
                onClick={() => setShowInvoiceModal(false)}
                className="rounded-lg bg-slate-800 px-5 py-2.5 text-sm font-bold text-white hover:bg-slate-900"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

// Helper Components
const InputField = ({ label, name, placeholder, type = "text", icon, onChange, value, hasError }) => (
  <div className="flex flex-col gap-2">
    <label className="text-sm font-black ml-1 uppercase tracking-tighter text-slate-500">
      {label}{hasError ? <span className="ml-1 text-red-600">*</span> : null}
    </label>
    <div className="relative">
      <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400">{icon}</div>
      <input 
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        className={`w-full h-14 pl-14 pr-4 rounded-2xl bg-slate-50 focus:ring-2 focus:ring-blue-500 font-medium transition-all ${
          hasError ? 'border-red-500 ring-1 ring-red-100' : 'border-slate-100'
        }`}
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
