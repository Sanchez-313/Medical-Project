import React, { useState } from 'react';
import { 
  Search, MapPin, Phone, Mail, Globe, Twitter, Instagram, 
  Linkedin, ArrowRight, ShieldCheck, Lock, Share2, ThumbsUp, Send, CheckCircle2 
} from 'lucide-react';

const ContactUs = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    subject: '',
    message: ''
  });
  const [status, setStatus] = useState('idle');
  const [showToast, setShowToast] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setStatus('sending');
    
    setTimeout(() => {
      setStatus('success');
      setShowToast(true);
      setFormData({ fullName: '', email: '', subject: '', message: '' });
      
      setTimeout(() => {
        setStatus('idle');
        setShowToast(false);
      }, 4000);
    }, 1500);
  };

  // Styles updated for a cleaner medical look
  const inputStyles = "w-full bg-white border border-slate-200 rounded-xl p-3.5 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none transition-all text-slate-900 placeholder:text-slate-400";

  return (
    /* Changed bg-indigo-500 to bg-cyan-50 (Medical Sky Blue) */
    <div className="min-h-screen bg-cyan-50 dark:bg-cyan-100 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-300">
      
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-12 right-6 z-[100] flex items-center gap-3 bg-cyan-600 text-white px-6 py-4 rounded-2xl shadow-2xl animate-in slide-in-from-right duration-300">
          <CheckCircle2 size={24} />
          <div>
            <p className="font-bold">Inquiry Received</p>
            <p className="text-xs opacity-90">A health coordinator will contact you.</p>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-6 py-16">
        <div className="mb-12 text-center lg:text-left">
          {/* Changed text color to a deep medical blue */}
          <h1 className="text-5xl font-extrabold tracking-tight mb-4 text-slate-800 dark:text-white">
            How can we <span className="text-cyan-600">help?</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-lg max-w-2xl leading-relaxed">
            From emergency medicine supply to equipment inquiries, our medical support team is available around the clock.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-10">
            {/* Form Section */}
            <section className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] shadow-xl shadow-cyan-900/5 border border-white dark:border-slate-800">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-cyan-400">Send us a Message</h2>
                <p className="text-slate-400 text-sm mt-1">Average response time: 15-30 minutes.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-600 dark:text-slate-300 ml-1">Full Name</label>
                    <input 
                      name="fullName" type="text" value={formData.fullName} onChange={handleChange}
                      placeholder="e.g. Dr. Smith" required className={inputStyles} 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-600 dark:text-slate-300 ml-1">Email Address</label>
                    <input 
                      name="email" type="email" value={formData.email} onChange={handleChange}
                      placeholder="name@clinic.com" required className={inputStyles} 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-600 dark:text-slate-300 ml-1">Inquiry Type</label>
                  <input 
                    name="subject" type="text" value={formData.subject} onChange={handleChange}
                    placeholder="Medicine Supply, Lab Equipment, etc." className={inputStyles} 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-600 dark:text-slate-300 ml-1">Message</label>
                  <textarea 
                    name="message" rows="5" value={formData.message} onChange={handleChange}
                    placeholder="Describe your requirements..." required className={`${inputStyles} resize-none`} 
                  ></textarea>
                </div>

                <button 
                  type="submit" 
                  disabled={status === 'sending'}
                  className={`w-full md:w-auto px-10 py-4 rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95 ${
                    status === 'success' ? 'bg-green-500 text-white' : 'bg-cyan-600 hover:bg-cyan-700 text-white shadow-cyan-600/20'
                  }`}
                >
                  {status === 'sending' ? <span className="animate-pulse">Processing...</span> : 
                   status === 'success' ? 'Request Sent!' : 
                   <><Send size={18} /> Submit Inquiry</>}
                </button>
              </form>
            </section>
          </div>

          <aside className="space-y-8">
            {/* Emergency Card */}
            <div className="bg-gradient-to-br from-cyan-600 to-blue-700 p-8 rounded-[2rem] text-white shadow-xl shadow-cyan-600/30">
              <h3 className="text-xl font-bold mb-2">24/7 Hotline</h3>
              <p className="text-cyan-100 text-sm mb-8">Urgent medical supply requests only.</p>
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl"><Phone size={22} /></div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest opacity-80">Emergency line</p>
                    <p className="text-xl font-bold">+95 9 123 456 789</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm">
              <h3 className="font-bold text-slate-800 dark:text-white mb-6">Our Networks</h3>
              <div className="grid grid-cols-2 gap-4">
                {[{ icon: Globe, name: 'Web' }, { icon: Twitter, name: 'Twitter' }, { icon: Instagram, name: 'Insta' }, { icon: Linkedin, name: 'LinkedIn' }].map((social) => (
                  <a key={social.name} href="#" className="flex flex-col items-center p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-transparent hover:border-cyan-500 hover:bg-white transition-all group">
                    <social.icon size={20} className="text-cyan-600 mb-2 transition-transform group-hover:scale-110" />
                    <span className="text-xs font-semibold text-slate-500">{social.name}</span>
                  </a>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default ContactUs;