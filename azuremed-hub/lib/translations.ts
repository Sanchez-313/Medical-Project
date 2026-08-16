export type Lang = "en" | "my";

/**
 * Flat UI-microcopy dictionary for the storefront. Deliberately not product
 * data (names/categories/descriptions already come from the DB in whichever
 * language they were entered — Myanmar medicine names are already Myanmar,
 * English medicine names already English) — this only covers chrome text:
 * nav, buttons, headings, labels.
 */
export const translations = {
  // Navbar
  "nav.home": { en: "Home", my: "ပင်မစာမျက်နှာ" },
  "nav.pharmacy": { en: "Pharmacy", my: "ဆေးဆိုင်" },
  "nav.allProducts": { en: "All Products", my: "ကုန်ပစ္စည်းအားလုံး" },
  "nav.feverCoughCold": { en: "Fever, Cough & Cold", my: "အဖျား၊ ချောင်းဆိုးနှင့် အအေးမိခြင်း" },
  "nav.fitnessSupplement": { en: "Fitness & Supplement", my: "ကျန်းမာရေးနှင့် အားဆေး" },
  "nav.sexualWellness": { en: "Sexual Wellness", my: "လိင်ပိုင်းဆိုင်ရာကျန်းမာရေး" },
  "nav.motherChild": { en: "Mother & Child", my: "မိခင်နှင့်ကလေး" },
  "nav.traditionalMedicine": { en: "Traditional Medicine", my: "ရိုးရာဆေးဝါး" },
  "nav.personalCareEquipment": { en: "Personal Care & Equipment", my: "ကိုယ်ရေးကိုယ်တာနှင့် ဆေးကိရိယာ" },
  "nav.bills": { en: "Bills", my: "ငွေတောင်းခံလွှာ" },
  "nav.detectMedicine": { en: "Detect Medicine", my: "ဆေးရှာဖွေမှု" },
  "nav.more": { en: "More", my: "နောက်ထပ်" },
  "nav.aboutUs": { en: "About Us", my: "ကျွန်ုပ်တို့အကြောင်း" },
  "nav.contactUs": { en: "Contact Us", my: "ဆက်သွယ်ရန်" },
  "nav.reviews": { en: "Reviews", my: "သုံးသပ်ချက်များ" },
  "nav.signIn": { en: "Sign In", my: "ဝင်ရောက်ရန်" },
  "nav.signUp": { en: "Sign Up", my: "စာရင်းသွင်းရန်" },
  "nav.searchPlaceholder": { en: "Search pharmacy...", my: "ဆေးဆိုင်ရှာဖွေရန်..." },
  "nav.hiUser": { en: "Hi", my: "မင်္ဂလာပါ" },

  // Hero
  "hero.badge": { en: "Trusted Healthcare Solutions", my: "စိတ်ချယုံကြည်ရသော ကျန်းမာရေးဝန်ဆောင်မှု" },
  "hero.titlePrefix": { en: "Reliable", my: "ယုံကြည်စိတ်ချရသော" },
  "hero.titleMedical": { en: "Medical", my: "ဆေးဘက်ဆိုင်ရာ" },
  "hero.titleAnd": { en: "&", my: "နှင့်" },
  "hero.titlePharmacy": { en: "Pharmacy", my: "ဆေးဆိုင်" },
  "hero.titleSuffix": { en: "Inventory System", my: "စာရင်းစနစ်" },
  "hero.description": {
    en: "Streamline your healthcare management with our integrated system for English and Myanmar medicines, surgical equipment, and real-time stock tracking.",
    my: "အင်္ဂလိပ်နှင့် မြန်မာဆေးဝါးများ၊ ခွဲစိတ်ကိရိယာများနှင့် လက်ရှိစတော့အခြေအနေကို ပေါင်းစပ်ထားသော စနစ်ဖြင့် သင့်ကျန်းမာရေးစီမံခန့်ခွဲမှုကို လွယ်ကူချောမွေ့စေပါမည်။",
  },
  "hero.browseProducts": { en: "Browse Products", my: "ကုန်ပစ္စည်းများကြည့်ရှုရန်" },
  "hero.tryAiDetection": { en: "Try AI Detection", my: "AI ဖြင့်ရှာဖွေကြည့်ရန်" },
  "hero.statProducts": { en: "Products in stock", my: "စတော့ရှိပစ္စည်းများ" },
  "hero.statCategories": { en: "Product categories", my: "ကုန်ပစ္စည်းအမျိုးအစားများ" },
  "hero.statAi": { en: "AI medicine detection", my: "AI ဆေးရှာဖွေမှု" },

  // Categories section
  "categories.highlight": { en: "Browse", my: "ရှာဖွေရန်" },
  "categories.heading": { en: "Medical Categories", my: "ဆေးဝါးအမျိုးအစားများ" },
  "categories.productsAvailable": { en: "products available", my: "ခု ရရှိနိုင်သည်" },
  "categories.viewProducts": { en: "View Products", my: "ကြည့်ရှုရန်" },

  // Product card
  "product.addToCart": { en: "Add to Cart", my: "ခြင်းထဲထည့်ရန်" },
  "product.available": { en: "available", my: "လက်ကျန်ရှိသည်" },
  "product.outOfStock": { en: "Out of stock", my: "ကုန်သွားပြီ" },

  // Footer
  "footer.tagline": {
    en: "AzureMed Hub helps customers discover trusted medicines, practical equipment, and healthcare support in one simple storefront.",
    my: "AzureMed Hub သည် ယုံကြည်ရသောဆေးဝါးများ၊ လက်တွေ့သုံးကိရိယာများနှင့် ကျန်းမာရေးဝန်ဆောင်မှုများကို တစ်နေရာတည်းတွင် ရှာဖွေနိုင်ရန် ကူညီပေးပါသည်။",
  },
  "footer.rightsReserved": { en: "All Rights Reserved", my: "မူပိုင်ခွင့်အားလုံး ရရှိထားသည်" },
  "footer.company": { en: "Company", my: "ကုမ္ပဏီ" },
  "footer.about": { en: "About", my: "အကြောင်း" },
  "footer.faq": { en: "FAQ's", my: "မေးလေ့ရှိသောမေးခွန်းများ" },
  "footer.support": { en: "Support", my: "အကူအညီ" },
  "footer.supportCenter": { en: "Support Center", my: "အကူအညီစင်တာ" },
  "footer.feedback": { en: "Feedback", my: "အကြံပြုရန်" },
  "footer.stayConnected": { en: "Stay Connected", my: "ဆက်သွယ်ရန်" },
  "footer.feedbackPrompt": {
    en: "Questions or Feedback? We'd love to hear from you",
    my: "မေးခွန်းများ သို့မဟုတ် အကြံပြုချက်များ ရှိပါက ကျွန်ုပ်တို့ကို ဆက်သွယ်ပါ",
  },
  "footer.emailPlaceholder": { en: "Email Address", my: "အီးမေးလ်လိပ်စာ" },

  // Product detail page + reviews
  "productDetail.reviewsHeading": { en: "Customer Reviews", my: "customer သုံးသပ်ချက်များ" },
  "productDetail.noReviews": { en: "No reviews yet — be the first to review this product.", my: "သုံးသပ်ချက် မရှိသေးပါ — ဤထုတ်ကုန်ကို ပထမဆုံး သုံးသပ်ပါ။" },
  "productDetail.noRating": { en: "No reviews yet", my: "သုံးသပ်ချက် မရှိသေးပါ" },
  "productDetail.review": { en: "review", my: "သုံးသပ်ချက်" },
  "productDetail.reviews": { en: "reviews", my: "သုံးသပ်ချက်များ" },
  "reviewForm.heading": { en: "Write a review", my: "သုံးသပ်ချက် ရေးရန်" },
  "reviewForm.placeholder": { en: "Share what you thought about this product (optional)", my: "ဤထုတ်ကုန်အကြောင်း သင့်အမြင်ကို မျှဝေပါ (မလိုအပ်ပါ)" },
  "reviewForm.submit": { en: "Submit Review", my: "သုံးသပ်ချက် တင်ရန်" },
  "reviewForm.submitting": { en: "Submitting...", my: "တင်နေသည်..." },
  "reviewForm.selectRating": { en: "Please select a star rating.", my: "ကြယ်ပွင့်အဆင့် ရွေးချယ်ပါ။" },
  "reviewForm.success": { en: "Thanks — your review has been posted.", my: "ကျေးဇူးတင်ပါသည် — သင့်သုံးသပ်ချက် တင်ပြီးပါပြီ။" },
  "reviewForm.signInPrompt": { en: "to leave a review — only customers who ordered this product can review it.", my: "သုံးသပ်ချက် ရေးရန် ဝင်ရောက်ပါ — ဤထုတ်ကုန်ကို မှာယူထားသော customer များသာ သုံးသပ်နိုင်ပါသည်။" },
  "reviewForm.signIn": { en: "Sign in", my: "ဝင်ရောက်ရန်" },
  "reviewForm.noRating": { en: "No rating selected", my: "ကြယ်ပွင့်အဆင့် မရွေးရသေးပါ" },
  "reviewForm.ratingOf5": { en: "of 5 stars", my: "/ ၅ ကြယ်" },
  "reviewForm.clearRating": { en: "Clear", my: "ရှင်းရန်" },

  // About page
  "about.badge": { en: "About AzureMed Hub", my: "AzureMed Hub အကြောင်း" },
  "about.heading": { en: "Trusted digital pharmacy, built for Myanmar", my: "မြန်မာနိုင်ငံအတွက် တည်ဆောက်ထားသော ယုံကြည်စိတ်ချရသော ဒစ်ဂျစ်တယ်ဆေးဆိုင်" },
  "about.description": {
    en: "AzureMed Hub helps customers discover trusted medicines, practical equipment, and healthcare support in one simple storefront — bringing together English medicines, traditional Myanmar remedies, and medical equipment with real-time stock visibility, secure checkout, and AI-assisted medicine detection.",
    my: "AzureMed Hub သည် ယုံကြည်ရသောဆေးဝါးများ၊ လက်တွေ့သုံးကိရိယာများနှင့် ကျန်းမာရေးဝန်ဆောင်မှုများကို တစ်နေရာတည်းတွင် ရှာဖွေနိုင်ရန် ကူညီပေးပါသည် — အင်္ဂလိပ်ဆေးများ၊ မြန်မာ့ရိုးရာဆေးများနှင့် ဆေးကိရိယာများကို လက်ရှိစတော့အခြေအနေ၊ လုံခြုံသောငွေချေမှုနှင့် AI ဆေးရှာဖွေမှုတို့ဖြင့် ပေါင်းစပ်ထားပါသည်။",
  },
  "about.valuesHeading": { en: "What We Stand For", my: "ကျွန်ုပ်တို့ ရပ်တည်ချက်" },
  "about.valueQualityTitle": { en: "Certified Quality", my: "အသိအမှတ်ပြု အရည်အသွေး" },
  "about.valueQualityPara": { en: "All English and Myanmar medicines undergo strict quality control and FDA inspections.", my: "အင်္ဂလိပ်နှင့် မြန်မာဆေးဝါးအားလုံးသည် တင်းကြပ်သော အရည်အသွေးထိန်းချုပ်မှုနှင့် FDA စစ်ဆေးမှုများကို ခံယူထားပါသည်။" },
  "about.valueSupportTitle": { en: "Expert Support", my: "ကျွမ်းကျင်သူ အကူအညီ" },
  "about.valueSupportPara": { en: "Our pharmacists are available to provide professional consultation for your prescriptions.", my: "ကျွန်ုပ်တို့၏ ဆေးဝါးပညာရှင်များသည် သင့်ဆေးညွှန်းများအတွက် အကြံဉာဏ်ပေးရန် အသင့်ရှိပါသည်။" },
  "about.valueSafetyTitle": { en: "Safety First", my: "ဘေးကင်းရေး ဦးစားပေး" },
  "about.valueSafetyPara": { en: "Secure packaging and temperature-controlled storage ensure your medicine remains effective.", my: "လုံခြုံသော ထုပ်ပိုးမှုနှင့် အပူချိန်ထိန်းချုပ်ထားသော သိုလှောင်မှုသည် သင့်ဆေးဝါး ထိရောက်မှုရှိစေပါသည်။" },
  "about.valueHerbalTitle": { en: "Authentic Herbal", my: "စစ်မှန်သော ဆေးဖက်ဝင်" },
  "about.valueHerbalPara": { en: "Traditional Myanmar medicines sourced directly from trusted, licensed herbal manufacturers.", my: "မြန်မာ့ရိုးရာဆေးဝါးများကို ယုံကြည်ရသော လိုင်စင်ရ ဆေးဖက်ဝင်ထုတ်လုပ်သူများထံမှ တိုက်ရိုက်ရယူထားပါသည်။" },

  // About page — How to Use This Website
  "about.howToUseHeading": { en: "How to Use This Website", my: "ဤဝဘ်ဆိုက်ကို အသုံးပြုနည်း" },
  "about.howToUseIntro": {
    en: "New here? Here's a quick walkthrough of everything you can do on AzureMed Hub.",
    my: "ဤနေရာသို့ ပထမဆုံးရောက်ရှိခြင်းလား။ AzureMed Hub တွင် သင်လုပ်ဆောင်နိုင်သည့်အရာများကို အတိုချုပ်ဖော်ပြထားပါသည်။",
  },
  "about.step1Title": { en: "Browse & Search", my: "ရှာဖွေခြင်း" },
  "about.step1Para": {
    en: "Browse category tabs or use the search bar to find English medicines, Myanmar traditional remedies, and medical equipment.",
    my: "အင်္ဂလိပ်ဆေးများ၊ မြန်မာ့ရိုးရာဆေးများနှင့် ဆေးကိရိယာများကို ရှာဖွေရန် အမျိုးအစားများကို ကြည့်ရှုပါ သို့မဟုတ် ရှာဖွေရေးဘားကို အသုံးပြုပါ။",
  },
  "about.step2Title": { en: "Add to Cart or Wishlist", my: "ခြင်း သို့မဟုတ် Wishlist ထဲသို့ ထည့်ခြင်း" },
  "about.step2Para": {
    en: "Tap the cart icon on any product to add it, or the heart icon to save it to your wishlist for later.",
    my: "ကုန်ပစ္စည်းတစ်ခုကို ထည့်ရန် ခြင်းအိုင်ကွန်ကို နှိပ်ပါ၊ သို့မဟုတ် နောက်မှဝယ်ရန် နှလုံးအိုင်ကွန်ဖြင့် Wishlist တွင် သိမ်းထားပါ။",
  },
  "about.step3Title": { en: "Checkout Securely", my: "လုံခြုံစွာ ငွေချေခြင်း" },
  "about.step3Para": {
    en: "Review your cart, enter your delivery details, and choose a payment method to place your order.",
    my: "သင့်ခြင်းကို စစ်ဆေးပြီး၊ ပို့ဆောင်ရေးအချက်အလက်များ ဖြည့်သွင်းကာ၊ ငွေချေရန်နည်းလမ်းရွေးချယ်၍ အော်ဒါတင်ပါ။",
  },
  "about.step4Title": { en: "Track Your Orders", my: "အော်ဒါများကို စောင့်ကြည့်ခြင်း" },
  "about.step4Para": {
    en: "Visit the Bills page anytime to check your order status and past order history.",
    my: "အော်ဒါအခြေအနေနှင့် မှတ်တမ်းကို စစ်ဆေးရန် အချိန်မရွေး Bills စာမျက်နှာသို့ သွားနိုင်ပါသည်။",
  },
  "about.step5Title": { en: "Try AI Medicine Detection", my: "AI ဆေးရှာဖွေမှုကို စမ်းသုံးကြည့်ပါ" },
  "about.step5Para": {
    en: "Open the Detect Medicine page, capture or upload a photo of a medicine pack, and let the AI match it to our catalog.",
    my: "Detect Medicine စာမျက်နှာကိုဖွင့်ပြီး ဆေးထုပ်ပိုး၏ ဓာတ်ပုံကို ရိုက်ကူး သို့မဟုတ် တင်ပါ၊ AI က ကျွန်ုပ်တို့၏ ကုန်ပစ္စည်းစာရင်းမှ ရှာဖွေပေးပါလိမ့်မည်။",
  },
  "about.step6Title": { en: "Rate & Review", my: "အဆင့်သတ်မှတ်ပြီး သုံးသပ်ရန်" },
  "about.step6Para": {
    en: "After receiving your order, leave a star rating and comment to help other customers choose with confidence.",
    my: "အော်ဒါရရှိပြီးနောက်၊ အခြားဖောက်သည်များ စိတ်ချစွာရွေးချယ်နိုင်ရန် ကူညီရန် ကြယ်ပွင့်အဆင့်နှင့် မှတ်ချက်ပေးနိုင်ပါသည်။",
  },

  // Contact page
  "contact.badge": { en: "Contact Us", my: "ဆက်သွယ်ရန်" },
  "contact.heading": { en: "We'd love to hear from you", my: "သင့်ထံမှ ကြားလိုပါသည်" },
  "contact.description": {
    en: "Questions about an order, a product, or the platform itself? Reach us through any of the channels below, or send a message directly through your account.",
    my: "အော်ဒါ၊ ထုတ်ကုန် သို့မဟုတ် ဝန်ဆောင်မှုအကြောင်း မေးခွန်းရှိပါသလား? အောက်ပါနည်းလမ်းများဖြင့် ဆက်သွယ်နိုင်သလို၊ သင့်အကောင့်မှတစ်ဆင့် တိုက်ရိုက်စာပို့နိုင်ပါသည်။",
  },
  "contact.phone": { en: "Phone", my: "ဖုန်းနံပါတ်" },
  "contact.email": { en: "Email", my: "အီးမေးလ်" },
  "contact.address": { en: "Address", my: "လိပ်စာ" },
  "contact.hours": { en: "Hours", my: "ဖွင့်ချိန်" },
  "contact.hoursValue": { en: "Mon–Sat, 8:00 AM – 8:00 PM", my: "တနင်္လာ–စနေ၊ မနက် ၈:၀၀ – ည ၈:၀၀" },
  "contact.specificQuestion": { en: "Have a specific question?", my: "တိကျသော မေးခွန်း ရှိပါသလား?" },
  "contact.signInPrompt": {
    en: "Sign in and send us a message directly — we'll reply on your account's Support page.",
    my: "ဝင်ရောက်ပြီး ကျွန်ုပ်တို့ကို တိုက်ရိုက်စာပို့ပါ — သင့်အကောင့်၏ Support စာမျက်နှာတွင် ပြန်လည်ဖြေကြားပါမည်။",
  },
  "contact.goToSupport": { en: "Go to Support", my: "Support သို့ သွားရန်" },
  "contact.signInToContact": { en: "Sign in to Contact Support", my: "Support ကို ဆက်သွယ်ရန် ဝင်ရောက်ပါ" },
} satisfies Record<string, Record<Lang, string>>;

export type TranslationKey = keyof typeof translations;
