function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const PRODUCT_USAGE_OVERRIDES = {
  "taung kyar pan ar toe say": {
    usage: "Traditional herbal medicine commonly used for muscle soreness, joint aches, and body discomfort.",
    howToUse: "Apply or use according to the package directions. Start with a small amount and avoid sensitive areas.",
    whenToUse: "Use when you feel muscle pain, stiffness, or mild body aches.",
    frequency: "Usually 1 to 3 times a day, or as directed on the label.",
  },
  "taunggyi mahar phyay say pink": {
    usage: "Traditional herbal remedy often used for general body comfort and everyday wellness support.",
    howToUse: "Use according to the package instructions and avoid exceeding the recommended amount.",
    whenToUse: "Use when body discomfort or tiredness appears, or when advised by the product label.",
    frequency: "Usually 1 to 2 times a day, depending on label directions.",
  },
  "paracetamol": {
    usage: "Helps reduce fever and relieve mild to moderate pain such as headache or body ache.",
    howToUse: "Swallow with water after checking the label dosage for age and strength.",
    whenToUse: "Use when you have fever, headache, toothache, or body pain.",
    frequency: "Often every 4 to 6 hours if needed. Do not exceed the label dose.",
  },
  "ivytus cough syrup": {
    usage: "Used to soothe cough and throat irritation.",
    howToUse: "Measure the syrup with a spoon or cup and take it by mouth.",
    whenToUse: "Use when dry cough or throat irritation appears.",
    frequency: "Usually 2 to 3 times a day, based on the label.",
  },
  "ab keto hair shampoo": {
    usage: "Medicated shampoo used to help control dandruff and scalp irritation.",
    howToUse: "Apply to wet hair, massage into the scalp, leave briefly, then rinse well.",
    whenToUse: "Use during hair washing when dandruff or itchy scalp is present.",
    frequency: "Usually 2 to 3 times per week, or as directed.",
  },
};

const CATEGORY_DEFAULTS = {
  EnglishMedicine: {
    usage: "Used to support common health needs such as fever relief, cough care, vitamins, or minor symptoms depending on the product.",
    howToUse: "Read the package label carefully and use only the recommended dose.",
    whenToUse: "Use when the matching symptom or condition appears and the label indicates it is appropriate.",
    frequency: "Use the number of times per day written on the package or advised by a pharmacist.",
  },
  MyanmarMedicine: {
    usage: "Traditional medicine used for body comfort, herbal wellness support, or mild everyday symptoms depending on the item.",
    howToUse: "Use according to the package directions and avoid overuse.",
    whenToUse: "Use when the symptom described on the product label appears.",
    frequency: "Usually 1 to 3 times a day depending on the product instructions.",
  },
  Equipment: {
    usage: "Healthcare equipment used for monitoring, support, protection, or first aid.",
    howToUse: "Follow the included instructions before first use.",
    whenToUse: "Use when you need measurement, support, or practical healthcare assistance.",
    frequency: "Use as needed based on the equipment purpose.",
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
    stockText:
      stockCount === null
        ? "Current stock is unavailable right now."
        : `We currently have ${stockCount} stock${stockCount === 1 ? "" : "s"} available.`,
  };
}
