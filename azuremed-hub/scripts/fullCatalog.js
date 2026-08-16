// Ported from Medical_Product/src/components/ProductList/ProductList.js — the
// real 89-product catalog. `image` is the relative path under
// public/images/ (mirrors the original's asset import paths 1:1, since the
// whole assets tree was copied verbatim).
//
// `category` is one of the 6 storefront tabs below (CategoriesSection,
// HomeProductsSection, ProductToolbar, admin/inventory all read straight
// from this same set — no other taxonomy exists anymore). Each product was
// re-tagged by what it actually treats, not by which old
// EnglishMedicine/MyanmarMedicine/Equipment bucket it used to sit in:
//   - all Myanmar traditional/herbal remedies -> Traditional Medicine,
//     regardless of the symptom they target (that's what distinguishes this
//     product line from the English OTC equivalents)
//   - vitamins/tonics/nutritional drinks -> Fitness & Supplement
//   - anything specifically formulated/marketed for kids or a
//     pregnant/nursing mother -> Mother & Child
//   - the one reproductive-health diagnostic (pregnancy test) -> Sexual
//     Wellness, alongside future family-planning stock
//   - topical creams, eye/ear drops, first-aid gear, and other items with no
//     natural symptom-based tab -> Personal Care & Equipment (catch-all)
const ENG = "Engmedicines";
const MYA = "Myamedicines";
const EQP = "Equipments";
const CHILD = `${ENG}/child & MOM`;
const PERSONAL = `${ENG}/personal care`;
const FEVER = `${ENG}/Fever,Cough,Cold`;

const CAT_FEVER = "Fever, Cough & Cold";
const CAT_FITNESS = "Fitness & Supplement";
const CAT_SEXUAL = "Sexual Wellness";
const CAT_MOTHER = "Mother & Child";
const CAT_TRADITIONAL = "Traditional Medicine";
const CAT_PERSONAL = "Personal Care & Equipment";

const RAW_PRODUCTS = [
  // Traditional Medicine (Myanmar herbal remedies)
  { id: 1, name: "Kyun Ywet Pone Cough Relief 45g", price: 2250, category: CAT_TRADITIONAL, image: `${MYA}/Kyun Ywet Pone Cough Relief 45g.png` },
  { id: 2, name: "HmanCho", price: 3750, category: CAT_TRADITIONAL, image: `${MYA}/HmanCho.png` },
  { id: 3, name: "Maw Akari Herbal Inhaler", price: 3400, category: CAT_TRADITIONAL, image: `${MYA}/Maw Akari Herbal Inhaler.png` },
  { id: 4, name: "MedicineBox", price: 18000, category: CAT_PERSONAL, image: `${EQP}/MedicineBox.png` },
  { id: 5, name: "Maw Ri Ya Man Say", price: 1450, category: CAT_TRADITIONAL, image: `${MYA}/Maw Ri Ya Man Say.png` },
  { id: 6, name: "Wone Wann ဝုန်းဝမ်း အကြောပြေလိမ်းဆေးဆီ (သံဘူး)", price: 2700, category: CAT_TRADITIONAL, image: `${MYA}/Wone Wann ဝုန်းဝမ်း အကြောပြေလိမ်းဆေးဆီ (သံဘူး).png` },
  { id: 7, name: "Stethoscope (Pro)", price: 65000, category: CAT_PERSONAL, image: `${EQP}/Stethoscope.png` },
  { id: 8, name: "Sanda Min Vision Supplement 40g", price: 1150, category: CAT_TRADITIONAL, image: `${MYA}/Sanda Min Vision Supplement 40g.png` },
  { id: 9, name: "AWaiYar", price: 3000, category: CAT_TRADITIONAL, image: `${MYA}/AWaiYar.png` },
  { id: 10, name: "LateThoneKaung", price: 2000, category: CAT_TRADITIONAL, image: `${MYA}/Late_Thone_Kaung_Akyaw_Ar_Toe_Say__pack_-removebg-preview.png` },
  { id: 11, name: "AungTaKhon", price: 12750, category: CAT_TRADITIONAL, image: `${MYA}/AungTaKhon-removebg-preview.png` },
  { id: 12, name: "Aye Nyein Thida Neurotonic 100g", price: 6750, category: CAT_TRADITIONAL, image: `${MYA}/Aye_Nyein_Thida_Neurotonic_100g-removebg-preview.png` },
  { id: 13, name: "DhoetKyaungThar", price: 2250, category: CAT_TRADITIONAL, image: `${MYA}/DhoetKyaungThar-removebg-preview.png` },
  { id: 14, name: "Kyun Ywet Pone Cough Relief 45g", price: 12750, category: CAT_TRADITIONAL, image: `${MYA}/Kyun_Ywet_Pone_Cough_Relief_45g-removebg-preview.png` },
  { id: 15, name: "Kyun Ywet Pone", price: 6750, category: CAT_TRADITIONAL, image: `${MYA}/KyunYatPone-removebg-preview.png` },
  { id: 16, name: "Late Thone Kaung Akyaw Ar Toe Say (pack)", price: 2250, category: CAT_TRADITIONAL, image: `${MYA}/Late_Thone_Kaung_Akyaw_Ar_Toe_Say__pack_-removebg-preview.png` },
  { id: 17, name: "Monywar Sa Yar Moe Laxative 64g", price: 12750, category: CAT_TRADITIONAL, image: `${MYA}/Monywar_Sa_Yar_Moe_Laxative_64g-removebg-preview.png` },
  { id: 18, name: "Pan Wutt Hmone A Pu Nyein Say Bot", price: 6750, category: CAT_TRADITIONAL, image: `${MYA}/Pan_Wutt_Hmone_A_Pu_Nyein_Say_Bot-removebg-preview.png` },
  { id: 19, name: "Taung Kyar Pan Ar Toe Say", price: 2250, category: CAT_TRADITIONAL, image: `${MYA}/Taung_Kyar_Pan_Ar_Toe_Say-removebg-preview.png` },
  { id: 20, name: "Two Snakes Ring Worm Lotion 6 ml", price: 12750, category: CAT_TRADITIONAL, image: `${MYA}/Two_Snakes_Ring_Worm_Lotion_6_ml-removebg-preview.png` },
  { id: 21, name: "Taunggyi Mahar Phyay Say (Pink)", price: 6750, category: CAT_TRADITIONAL, image: `${MYA}/Taunggyi_Mahar_Phyay_Say__Pink_-removebg-preview.png` },
  { id: 22, name: "KyarNayAPuNyeinSay", price: 1200, category: CAT_TRADITIONAL, image: `${MYA}/wmremove-transformed__1_-removebg-preview.png` },
  { id: 23, name: "KyarNayMaharPhyaySay", price: 12750, category: CAT_TRADITIONAL, image: `${MYA}/wmremove-transformed-removebg-preview.png` },

  // Fever, Cough & Cold / Fitness & Supplement / Mother & Child / Personal Care
  { id: 24, name: "Paracetamol", price: 2250, category: CAT_FEVER, image: `${ENG}/Paracetamol.png` },
  { id: 25, name: "Oramin-G", price: 12750, category: CAT_FITNESS, image: `${ENG}/Oramin-G.png` },
  { id: 26, name: "Oramin-G (Big)", price: 23750, category: CAT_FITNESS, image: `${ENG}/Oramin-G.png` },
  { id: 27, name: "IVYTUS Cough Syrup", price: 6750, category: CAT_FEVER, image: `${ENG}/IVYTUS_Cough_Syrup.png` },
  { id: 28, name: "Appeton Ms Teen", price: 6750, category: CAT_MOTHER, image: `${CHILD}/Appeton_Ms_Teen-removebg-preview.png` },
  { id: 29, name: "Biogesic Syrup 120mg", price: 7600, category: CAT_MOTHER, image: `${CHILD}/Biogesic_Syrup_120_mg-removebg-preview.png` },
  { id: 30, name: "Calcivita", price: 19000, category: CAT_MOTHER, image: `${CHILD}/Calcivita-removebg-preview.png` },
  { id: 31, name: "Ceelin Plus Chewables", price: 3700, category: CAT_MOTHER, image: `${CHILD}/Ceelin_Plus_Chewables-removebg-preview.png` },
  { id: 32, name: "Ceelin Plus Syrup 120ml", price: 11300, category: CAT_MOTHER, image: `${CHILD}/Ceelin_Plus_Syrup_120_ml-removebg-preview.png` },
  { id: 33, name: "Dimol Drops", price: 5100, category: CAT_MOTHER, image: `${CHILD}/Dimol_Drops-removebg-preview.png` },
  { id: 34, name: "Fenza", price: 4000, category: CAT_MOTHER, image: `${CHILD}/Fenza-removebg-preview.png` },
  { id: 35, name: "Multi Kids Drops 30ml", price: 3500, category: CAT_MOTHER, image: `${CHILD}/Multi_Kids_Drops_30ml-removebg-preview.png` },
  { id: 36, name: "NatoCare", price: 6000, category: CAT_MOTHER, image: `${CHILD}/NatoCare-removebg-preview.png` },
  { id: 37, name: "One Q Emulsion 120ml", price: 7000, category: CAT_MOTHER, image: `${CHILD}/One_Q_Emulsion_Lysine___Multivitamins_120ml-removebg-preview.png` },
  { id: 38, name: "One Q Gummy Omega-3", price: 7500, category: CAT_MOTHER, image: `${CHILD}/One_Q_Gummy_Omega_3-removebg-preview.png` },
  { id: 39, name: "One Q Gummy Calcium + Vitamin D", price: 7500, category: CAT_MOTHER, image: `${CHILD}/One_Q_Gummy_with_Calcium+_Vitamin_D-removebg-preview.png` },
  { id: 40, name: "Ovimin", price: 5000, category: CAT_MOTHER, image: `${CHILD}/Ovimin-removebg-preview.png` },
  { id: 41, name: "Param Syrup", price: 2250, category: CAT_MOTHER, image: `${CHILD}/Param_Syrup-removebg-preview.png` },
  { id: 42, name: "PB Lora Syrup 60ml", price: 3600, category: CAT_MOTHER, image: `${CHILD}/PB_Lora_Syrup_60ml-removebg-preview.png` },
  { id: 43, name: "PN Kids Grow Gummies 60s", price: 8500, category: CAT_MOTHER, image: `${CHILD}/PN_Kids_Grow_60s_Gummies-removebg-preview.png` },
  { id: 44, name: "PN Kids Memory Gummies 30s", price: 6500, category: CAT_MOTHER, image: `${CHILD}/PN_Kids_Memory_30s_Gummies-removebg-preview.png` },
  { id: 45, name: "PN Kids Multivitamins Boys 30s", price: 6500, category: CAT_MOTHER, image: `${CHILD}/PN_Kids_Multivitamins+_Minerals__Boys__30s_Gummies-removebg-preview.png` },
  { id: 46, name: "PN Kids Multivitamins Girls 30s", price: 6500, category: CAT_MOTHER, image: `${CHILD}/PN_Kids_Multivitamins+_Minerals__Girls__30s_Gummies-removebg-preview.png` },
  { id: 47, name: "Progesic Suspension 100ml", price: 9000, category: CAT_MOTHER, image: `${CHILD}/Progesic-250_Suspension_100_ml-removebg-preview.png` },
  { id: 48, name: "Keto Shampoo 75ml", price: 13500, category: CAT_PERSONAL, image: `${PERSONAL}/AB-Keto Shampoo 75ml.png` },
  { id: 49, name: "V.Rohto Cool", price: 15000, category: CAT_PERSONAL, image: `${PERSONAL}/V.Rohto Cool.png` },
  { id: 50, name: "New V.Rohto", price: 13500, category: CAT_PERSONAL, image: `${PERSONAL}/New V.Rohto.png` },
  { id: 51, name: "Dextracin Eye/Ear Drops", price: 7000, category: CAT_PERSONAL, image: `${PERSONAL}/Dextracin EyeEar Drops.png` },

  // Personal Care & Equipment (catch-all) / Sexual Wellness
  { id: 52, name: "3M Aura 1870+ Mask", price: 1700, category: CAT_PERSONAL, image: `${EQP}/3M Aura 1870+ Mask.png` },
  { id: 53, name: "Ankle Support", price: 2800, category: CAT_PERSONAL, image: `${EQP}/Ankle Support.png` },
  { id: 54, name: "Aquatabs Water Purification Tablet", price: 8900, category: CAT_PERSONAL, image: `${EQP}/Aquatabs Water Purification Tablet.png` },
  { id: 55, name: "Bo Ma Pregnancy Test Strip", price: 600, category: CAT_SEXUAL, image: `${EQP}/Bo Ma Pregnancy Test Strip.png` },
  { id: 56, name: "CheckNow", price: 30000, category: CAT_PERSONAL, image: `${EQP}/CheckNow.png` },
  { id: 57, name: "Infrared Thermometer (KF-32)", price: 25000, category: CAT_PERSONAL, image: `${EQP}/Infrared Thermometer (KF-32).png` },
  { id: 58, name: "Life Saving Hands First Aid Kit Large - Regular", price: 120000, category: CAT_PERSONAL, image: `${EQP}/Life Saving Hands First Aid Kit Large - Regular.png` },
  { id: 59, name: "Life Saving Hands First Aid Kit Small - Regular", price: 32000, category: CAT_PERSONAL, image: `${EQP}/Life Saving Hands First Aid Kit Small - Regular.png` },
  { id: 60, name: "Palm Support", price: 2400, category: CAT_PERSONAL, image: `${EQP}/Palm Support.png` },
  { id: 61, name: "Precare Blood Pressure Monitor (Arm)", price: 102000, category: CAT_PERSONAL, image: `${EQP}/Precare Blood Pressure Monitor (Arm).png` },

  // Fever, Cough & Cold / Fitness & Supplement
  { id: 62, name: "Ascoril Syrup", price: 8400, category: CAT_FEVER, image: `${FEVER}/Ascoril Syrup.png` },
  { id: 63, name: "Biogesic 500 mg", price: 2000, category: CAT_FEVER, image: `${FEVER}/Biogesic 500 mg.png` },
  { id: 64, name: "Decolgen Forte", price: 2900, category: CAT_FEVER, image: `${FEVER}/Decolgen Forte.png` },
  { id: 65, name: "Fluza 10's", price: 2500, category: CAT_FEVER, image: `${FEVER}/Fluza 10.png` },
  { id: 66, name: "GO Gel", price: 5400, category: CAT_FEVER, image: `${FEVER}/GO Gel.png` },
  { id: 67, name: "Mixagrip", price: 1750, category: CAT_FEVER, image: `${FEVER}/Mixagrip.png` },
  { id: 68, name: "Paracap", price: 1500, category: CAT_FEVER, image: `${FEVER}/Paracap.png` },
  { id: 69, name: "Solmux 500 mg", price: 1900, category: CAT_FEVER, image: `${FEVER}/Solmux 500 mg.png` },
  { id: 70, name: "Woods' Peppermint (Antitussive)", price: 15400, category: CAT_FEVER, image: `${FEVER}/Woods' Peppermint (Antitussive).png` },
  { id: 71, name: "Aska Deep Sea Fish Oil Omega-3 1000 mg", price: 38000, category: CAT_FITNESS, image: `${FEVER}/Aska Deep Sea Fish Oil Omega-3 1000 mg.png` },
  { id: 72, name: "Brand's Essence of Chicken", price: 5600, category: CAT_FITNESS, image: `${FEVER}/Brand's Essence of Chicken.png` },
  { id: 73, name: "Cevit", price: 7000, category: CAT_FITNESS, image: `${FEVER}/Cevit.png` },
  { id: 74, name: "Ensure Gold 850 g (Strawberry Flavor)", price: 159000, category: CAT_FITNESS, image: `${FEVER}/Ensure Gold 850 g (Strawberry Flavor).png` },

  { id: 75, name: "Sanda Mon Vision Supplement", price: 1750, category: CAT_TRADITIONAL, image: `${MYA}/Sanda Mon Vision Supplement.png` },
  { id: 76, name: "Shwe Ohh Wai Ginshauk Bot (Small)", price: 2100, category: CAT_TRADITIONAL, image: `${MYA}/Shwe Ohh Wai Ginshauk Bot (Small).png` },
  { id: 77, name: "Wone Wann ပျားနနွင်း Turmeric Honey Tablets", price: 2000, category: CAT_TRADITIONAL, image: `${MYA}/Wone Wann ပျားနနွင်း Turmeric Honey Tablets.png` },
  { id: 78, name: "Oral Rehydration Salts (ORS)", price: 900, category: CAT_PERSONAL, image: `${PERSONAL}/Oral Rehydration Salts (ORS).png` },
  { id: 79, name: "ဦးချိန်တီ(U Chain Te)", price: 2200, category: CAT_TRADITIONAL, image: `${MYA}/u-chain-t-uhkyanete-aahcar-kyaysayylone-cosmetic-medicines-601.webp`, stock: 15 },
  { id: 80, name: "Generlog Oral", price: 4200, category: CAT_FEVER, image: `${FEVER}/Generlog Oral.png`, stock: 18 },
  { id: 81, name: "Gentalene-C Cream", price: 3900, category: CAT_PERSONAL, image: `${PERSONAL}/Gentalene-C Cream.png`, stock: 14 },
  { id: 82, name: "Win (Methylated Spirit)", price: 2500, category: CAT_PERSONAL, image: `${PERSONAL}/Dextracin EyeEar Drops.png`, stock: 10 },
  { id: 83, name: "Enervon-C", price: 6500, category: CAT_FITNESS, image: `${FEVER}/enervon-c.png`, stock: 22 },
  { id: 84, name: "Axiona", price: 2800, category: CAT_FEVER, image: `${FEVER}/Axiona.png`, stock: 16 },
  { id: 85, name: "Ribovit Tablet", price: 4800, category: CAT_FITNESS, image: `${FEVER}/Ribovit Tablet.png`, stock: 12 },
  { id: 86, name: "Kotase", price: 3000, category: CAT_PERSONAL, image: `${FEVER}/Kotase.png`, stock: 9 },
  { id: 87, name: "Multivitaminus", price: 5200, category: CAT_FITNESS, image: `${FEVER}/Cevit.png`, stock: 20 },
  { id: 88, name: "SEZO-B Cream", price: 3600, category: CAT_PERSONAL, image: `${PERSONAL}/SEZO-B.png`, stock: 11 },
  { id: 89, name: "Fungiderm Cream", price: 4300, category: CAT_PERSONAL, image: `${PERSONAL}/fungiderm.png`, stock: 13 },
];

// Ported verbatim from ProductList.js's descriptionByName/descriptionByCategory + normalizeName.
const DESCRIPTION_BY_NAME = {
  "paracetamol": "Pain and fever relief for headaches, body aches, and colds. Use as directed on the label.",
  "biogesic 500 mg": "Paracetamol for pain and fever relief. Use as directed on the label.",
  "biogesic syrup 120mg": "Paracetamol syrup for children's pain and fever. Use as directed on the label.",
  "param syrup": "Paracetamol syrup for children's pain and fever. Use as directed on the label.",
  "progesic suspension 100ml": "Ibuprofen suspension for fever and pain in children. Use as directed on the label.",
  "oramin g": "Vitamin C supplement to support immune health. Take as directed.",
  "oramin g big": "Vitamin C supplement to support immune health. Take as directed.",
  "cevit": "Vitamin C supplement to support immune health. Take as directed.",
  "ivytus cough syrup": "Cough syrup for soothing throat irritation and cough. Use as directed.",
  "ascoril syrup": "Cough syrup for cough with mucus. Use as directed.",
  "solmux 500 mg": "Mucolytic to help loosen phlegm and ease productive cough. Use as directed.",
  "woods peppermint antitussive": "Cough suppressant lozenge to relieve dry cough. Use as directed.",
  "decolgen forte": "Cold and flu relief for congestion, fever, and aches. Use as directed.",
  "mixagrip": "Cold and flu relief for fever, headache, and congestion. Use as directed.",
  "paracap": "Paracetamol for pain and fever relief. Use as directed.",
  "fluza 10 s": "Antihistamine for allergy or cold symptoms. Use as directed.",
  "omega 3": "Omega-3 fish oil supplement to support heart health. Take as directed.",
  "aska deep sea fish oil omega 3 1000 mg": "Omega-3 fish oil supplement to support heart health. Take as directed.",
  "brand s essence of chicken": "Nutritional supplement for general vitality. Take as directed.",
  "ensure gold 850 g strawberry flavor": "Nutritional drink powder to support daily nutrition. Use as directed.",
  "oral rehydration salts ors": "Oral rehydration salts to help replace fluids and electrolytes. Use as directed.",
  "keto shampoo 75ml": "Medicated anti-dandruff shampoo. Use as directed.",
  "v rohto cool": "Eye drops for dryness and irritation relief. Use as directed.",
  "new v rohto": "Eye drops for dryness and irritation relief. Use as directed.",
  "dextracin eye ear drops": "Eye or ear drops for minor irritation. Use as directed.",
  "hmancho": "Herbal throat remedy to soothe throat pain and support a clearer voice. Use as directed.",
  "kyun ywet pone cough relief 45g": "Traditional cough relief remedy to soothe throat irritation and ease cough. Use as directed.",
  "kyun ywet pone": "Traditional remedy used for cough and throat comfort. Use as directed.",
  "maw akari herbal inhaler": "Herbal inhaler to help open nasal passages and refresh breathing. Use as directed.",
  "maw ri ya man say": "Traditional herbal remedy for general wellness and energy support. Use as directed.",
  "wone wann": "Traditional herbal oil/balm for soothing body aches and muscle tension. Use as directed.",
  "wone wann turmeric honey tablets": "Herbal honey tablets to soothe throat irritation and support a clear voice. Use as directed.",
  "sanda min vision supplement 40g": "Traditional supplement to support eye comfort and vision wellness. Use as directed.",
  "sanda mon vision supplement": "Traditional supplement to support eye comfort and vision wellness. Use as directed.",
  "a waiyar": "Traditional herbal remedy for general wellness and vitality. Use as directed.",
  "latethonekaung": "Traditional herbal tonic for general vitality and stamina support. Use as directed.",
  "aungtakhon": "Traditional herbal remedy used for body aches and general wellness. Use as directed.",
  "aye nyein thida neurotonic 100g": "Traditional tonic used to support nerve comfort and relaxation. Use as directed.",
  "dhoetkyaungthar": "Traditional herbal remedy for digestive comfort and general wellness. Use as directed.",
  "generlog oral": "Oral antibiotic medicine commonly used for bacterial infections. Use only as directed by the label or a healthcare professional.",
  "gentalene c cream": "Topical cream commonly used for inflamed or irritated skin conditions. Apply as directed.",
  "gentalene cream": "Topical cream commonly used for inflamed or irritated skin conditions. Apply as directed.",
  "win methylated spirit": "Topical antiseptic spirit used for external cleaning and hygiene support. For external use only.",
  "enervon c": "Multivitamin supplement with vitamin C to support daily wellness and energy.",
  "axiona": "Pain relief medicine commonly used for mild to moderate aches and fever support. Use as directed.",
  "ribovit tablet": "Vitamin B complex supplement used to support energy and nutritional balance.",
  "kotase": "Digestive support medicine commonly used for stomach comfort and digestion support.",
  "multivitaminus": "Multivitamin supplement used to support daily nutritional needs and general wellness.",
  "sezo b cream": "Topical cream used for minor skin irritation and surface discomfort. Apply as directed.",
  "fungiderm cream": "Antifungal cream commonly used for fungal skin infections and itching. Apply as directed.",
  "monywar sa yar moe laxative 64g": "Traditional herbal laxative to support bowel regularity. Use as directed.",
  "pan wutt hmone a pu nyein say bot": "Traditional herbal oil/balm to soothe aches and promote relaxation. Use as directed.",
  "taung kyar pan ar toe say": "Traditional herbal remedy for muscle and joint comfort. Use as directed.",
  "two snakes ring worm lotion 6 ml": "Topical lotion for skin irritation such as ringworm. Use as directed.",
  "taunggyi mahar phyay say pink": "Traditional herbal remedy for general wellness and vitality. Use as directed.",
  "ဦးချိန်တီ u chain te": "Headaches, minor fevers, stomach upset, and fatigue.",
  "kyarnayapunyeinsay": "Traditional herbal remedy to soothe aches and tension. Use as directed.",
  "kyarnaymaharphyaysay": "Traditional herbal remedy for muscle and joint comfort. Use as directed.",
  "shwe ohh wai ginshauk bot small": "Traditional herbal liquid for general wellness support. Use as directed.",
  "3m aura 1870 mask": "Respiratory mask for filtration and protection. Use as directed.",
  "infrared thermometer kf 32": "Non-contact thermometer for quick temperature checks. Follow device instructions.",
  "precare blood pressure monitor arm": "Digital blood pressure monitor for home use. Follow device instructions.",
  "life saving hands first aid kit large regular": "First aid kit for basic emergency care. Follow included guide.",
  "life saving hands first aid kit small regular": "Compact first aid kit for basic emergency care. Follow included guide.",
  "aquatabs water purification tablet": "Water purification tablets for safer drinking water. Use as directed.",
  "bo ma pregnancy test strip": "Home pregnancy test strip. Follow the test instructions.",
  "ankle support": "Ankle support for stability and mild injury support. Use as directed.",
  "palm support": "Wrist or palm support for stability and comfort. Use as directed.",
  "stethoscope pro": "Stethoscope for auscultation and clinical use. Use as directed.",
  "checknow": "Medical testing device for home or clinical use. Follow instructions.",
  "medicinebox": "Storage box for medicines and supplies.",
};

const DESCRIPTION_BY_CATEGORY = {
  [CAT_FEVER]: "Common over-the-counter medicine. Use as directed on the label.",
  [CAT_FITNESS]: "Nutritional supplement to support daily wellness. Take as directed.",
  [CAT_SEXUAL]: "Reproductive health product. Follow the included instructions.",
  [CAT_MOTHER]: "Formulated for children or expecting/nursing mothers. Use as directed.",
  [CAT_TRADITIONAL]: "Traditional remedy. Follow label directions and consult a healthcare professional if unsure.",
  [CAT_PERSONAL]: "Personal care item or medical equipment for home or clinical use. Follow the included instructions.",
};

function normalizeName(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

const FULL_CATALOG = RAW_PRODUCTS.map((product) => {
  const description =
    DESCRIPTION_BY_NAME[normalizeName(product.name)] ??
    DESCRIPTION_BY_CATEGORY[product.category] ??
    "Product details available on request. Use as directed.";
  const stock_qty = product.stock ?? 25;
  return {
    sku: `MED-${String(product.id).padStart(3, "0")}`,
    name: product.name,
    category: product.category,
    image_url: `/images/${product.image}`,
    description,
    selling_price_ks: product.price,
    cost_price_ks: Math.round(product.price * 0.6),
    stock_qty,
    reorder_level: 15,
  };
});

module.exports = { FULL_CATALOG };
