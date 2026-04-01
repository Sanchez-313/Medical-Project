function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

const PRODUCT_USAGE_OVERRIDES = {
  "generlog oral": {
    usage: "Used for bacterial infection care based on the medicine label and package instructions.",
    howToUse: "Take by mouth exactly as directed on the label or by a healthcare professional.",
    whenToUse: "Use when prescribed or when the product label says it is appropriate for the condition.",
    frequency: "Follow the dosing schedule written on the package.",
    caution: "Do not stop early or take extra doses unless a healthcare professional advises it.",
    storage: "Store in a cool, dry place away from direct heat and moisture.",
  },
  "gentalene c cream": {
    usage: "Used for topical skin care support when there is irritation, rash, or surface inflammation.",
    howToUse: "Apply a thin layer to the affected area as directed on the label.",
    whenToUse: "Use when the skin condition matches the product directions.",
    frequency: "Usually 1 to 2 times a day or as directed.",
    caution: "Avoid contact with eyes and stop use if irritation becomes worse.",
    storage: "Keep tightly closed and store at room temperature.",
  },
  "win methylated spirit": {
    usage: "Used for external antiseptic cleaning and hygiene support.",
    howToUse: "Apply externally with cotton or gauze as directed.",
    whenToUse: "Use for external cleaning only when appropriate for the label instructions.",
    frequency: "Use as needed for external cleansing.",
    caution: "For external use only and keep away from flame or heat.",
    storage: "Store tightly closed in a cool place away from fire.",
  },
  "enervon c": {
    usage: "Used as a multivitamin supplement to support energy and immune wellness.",
    howToUse: "Take by mouth with water according to the package directions.",
    whenToUse: "Use when vitamin supplementation or daily wellness support is needed.",
    frequency: "Usually once daily or as directed on the label.",
    caution: "Do not exceed the recommended daily intake.",
    storage: "Store in a cool, dry place away from children.",
  },
  "axiona": {
    usage: "Used for relief of mild to moderate pain and fever depending on the product label.",
    howToUse: "Take the amount shown on the package with water.",
    whenToUse: "Use for headache, fever, or body aches when the label indicates it is suitable.",
    frequency: "Follow the daily dosing instructions written on the package.",
    caution: "Avoid taking more than the recommended amount.",
    storage: "Keep in a dry place away from direct sunlight.",
  },
  "ribovit tablet": {
    usage: "Used as a vitamin supplement to support nutritional balance and energy.",
    howToUse: "Take by mouth as directed on the label.",
    whenToUse: "Use when daily vitamin support is needed.",
    frequency: "Usually once daily unless the package says otherwise.",
    caution: "Use the recommended amount only.",
    storage: "Store below room temperature in a dry place.",
  },
  "kotase": {
    usage: "Used for digestive comfort and stomach support based on the product label.",
    howToUse: "Take according to the package instructions.",
    whenToUse: "Use when mild digestive discomfort or stomach heaviness appears.",
    frequency: "Follow the label directions for daily use.",
    caution: "Avoid overuse and ask a pharmacist if symptoms continue.",
    storage: "Store in a cool, dry place.",
  },
  "multivitaminus": {
    usage: "Used as a daily multivitamin supplement for general nutritional support.",
    howToUse: "Take by mouth according to the package directions.",
    whenToUse: "Use when daily vitamin and mineral support is needed.",
    frequency: "Usually once daily or as directed.",
    caution: "Do not exceed the stated daily dose.",
    storage: "Store away from moisture and direct sunlight.",
  },
  "sezo b cream": {
    usage: "Used as a topical cream for minor skin irritation and surface discomfort.",
    howToUse: "Apply gently to the affected area as directed.",
    whenToUse: "Use when the skin condition matches the directions on the label.",
    frequency: "Usually 1 to 2 times a day or as directed.",
    caution: "Stop use if irritation worsens or spreads.",
    storage: "Store with the cap tightly closed at room temperature.",
  },
  "fungiderm cream": {
    usage: "Used for fungal skin infection care and itching relief.",
    howToUse: "Apply a thin layer to clean, dry skin as directed.",
    whenToUse: "Use for fungal skin symptoms when the label instructions match.",
    frequency: "Usually 1 to 2 times daily depending on the package directions.",
    caution: "Avoid eyes and broken skin unless the label specifically allows it.",
    storage: "Store in a cool, dry place with the cap closed.",
  },
  "ဒို့ ကျောင်းသား": {
    usage: "Traditional herbal medicine commonly used for digestive comfort and general body wellness.",
    howToUse: "Use according to the directions on the package and avoid taking more than recommended.",
    whenToUse: "Use when stomach discomfort, mild body uneasiness, or related symptoms appear.",
    frequency: "Usually 1 to 3 times a day depending on the package instructions.",
    caution: "Avoid overuse and stop if the medicine causes any unusual discomfort.",
    storage: "Store in a dry place away from heat and direct sunlight.",
  },
  "taung kyar pan ar toe say": {
    usage: "Traditional herbal medicine commonly used for muscle soreness, joint aches, and body discomfort.",
    howToUse: "Apply or use according to the package directions. Start with a small amount and avoid sensitive areas.",
    whenToUse: "Use when you feel muscle pain, stiffness, or mild body aches.",
    frequency: "Usually 1 to 3 times a day, or as directed on the label.",
    caution: "Avoid using on irritated skin and stop use if discomfort appears.",
    storage: "Store in a cool, dry place away from direct sunlight.",
  },
  "taunggyi mahar phyay say pink": {
    usage: "Traditional herbal remedy often used for general body comfort and everyday wellness support.",
    howToUse: "Use according to the package instructions and avoid exceeding the recommended amount.",
    whenToUse: "Use when body discomfort or tiredness appears, or when advised by the product label.",
    frequency: "Usually 1 to 2 times a day, depending on label directions.",
    caution: "Follow the product label carefully and avoid overuse.",
    storage: "Keep tightly closed in a clean, dry place.",
  },
  "paracetamol": {
    usage: "Helps reduce fever and relieve mild to moderate pain such as headache or body ache.",
    howToUse: "Swallow with water after checking the label dosage for age and strength.",
    whenToUse: "Use when you have fever, headache, toothache, or body pain.",
    frequency: "Often every 4 to 6 hours if needed. Do not exceed the label dose.",
    caution: "Do not take more than the recommended dose and avoid combining with other paracetamol products.",
    storage: "Store below room temperature in a dry place away from children.",
  },
  "ivytus cough syrup": {
    usage: "Used to soothe cough and throat irritation.",
    howToUse: "Measure the syrup with a spoon or cup and take it by mouth.",
    whenToUse: "Use when dry cough or throat irritation appears.",
    frequency: "Usually 2 to 3 times a day, based on the label.",
    caution: "Use the correct measured dose and check the label for age guidance.",
    storage: "Keep the bottle closed and store in a cool, dry place.",
  },
  "ab keto hair shampoo": {
    usage: "Medicated shampoo used to help control dandruff and scalp irritation.",
    howToUse: "Apply to wet hair, massage into the scalp, leave briefly, then rinse well.",
    whenToUse: "Use during hair washing when dandruff or itchy scalp is present.",
    frequency: "Usually 2 to 3 times per week, or as directed.",
    caution: "Avoid contact with eyes and discontinue use if irritation becomes worse.",
    storage: "Store at room temperature with the cap tightly closed.",
  },
};

const CATEGORY_DEFAULTS = {
  EnglishMedicine: {
    usage: "Used to support common health needs such as fever relief, cough care, vitamins, or minor symptoms depending on the product.",
    howToUse: "Read the package label carefully and use only the recommended dose.",
    whenToUse: "Use when the matching symptom or condition appears and the label indicates it is appropriate.",
    frequency: "Use the number of times per day written on the package or advised by a pharmacist.",
    caution: "Always check the label, avoid exceeding the stated dose, and ask a pharmacist when unsure.",
    storage: "Store in a cool, dry place away from moisture, heat, and direct sunlight.",
  },
  MyanmarMedicine: {
    usage: "Traditional medicine used for body comfort, herbal wellness support, or mild everyday symptoms depending on the item.",
    howToUse: "Use according to the package directions and avoid overuse.",
    whenToUse: "Use when the symptom described on the product label appears.",
    frequency: "Usually 1 to 3 times a day depending on the product instructions.",
    caution: "Follow the package directions carefully and stop use if an unusual reaction occurs.",
    storage: "Keep sealed and store in a dry place away from excessive heat.",
  },
  Equipment: {
    usage: "Healthcare equipment used for monitoring, support, protection, or first aid.",
    howToUse: "Follow the included instructions before first use.",
    whenToUse: "Use when you need measurement, support, or practical healthcare assistance.",
    frequency: "Use as needed based on the equipment purpose.",
    caution: "Use only for its intended purpose and check the device instructions before use.",
    storage: "Keep clean and store safely when not in use.",
  },
};

export function getProductUsageDetails(product, stockCount = null) {
  const normalizedName = normalizeText(product?.name);
  const fromName = PRODUCT_USAGE_OVERRIDES[normalizedName];
  const fromCategory =
    CATEGORY_DEFAULTS[String(product?.category)] || CATEGORY_DEFAULTS.EnglishMedicine;

  return {
    usage: fromName?.usage || fromCategory.usage,
    howToUse: fromName?.howToUse || fromCategory.howToUse,
    whenToUse: fromName?.whenToUse || fromCategory.whenToUse,
    frequency: fromName?.frequency || fromCategory.frequency,
    caution: fromName?.caution || fromCategory.caution,
    storage: fromName?.storage || fromCategory.storage,
    stockText:
      stockCount === null
        ? "Current stock is unavailable right now."
        : `We currently have ${stockCount} stock${stockCount === 1 ? "" : "s"} available.`,
  };
}

export function getDetectedMedicineDetails(label) {
  const normalizedLabel = normalizeText(label);
  const fromName = PRODUCT_USAGE_OVERRIDES[normalizedLabel];
  const fallback = CATEGORY_DEFAULTS.MyanmarMedicine;

  return {
    name: String(label || "Detected medicine"),
    usage: fromName?.usage || fallback.usage,
    howToUse: fromName?.howToUse || fallback.howToUse,
    whenToUse: fromName?.whenToUse || fallback.whenToUse,
    frequency: fromName?.frequency || fallback.frequency,
    caution: fromName?.caution || fallback.caution,
    storage: fromName?.storage || fallback.storage,
  };
}
