export const BUSINESS_TYPES = [
  { value: "retail", label: "Retail" },
  { value: "wholesale", label: "Wholesale" },
  { value: "restaurant", label: "Restaurant / Cafe" },
  { value: "pharmacy", label: "Pharmacy" },
  { value: "grocery", label: "Grocery / Supermarket" },
  { value: "services", label: "Services" },
  { value: "manufacturing", label: "Manufacturing" },
  { value: "other", label: "Other" },
] as const;

export const CURRENCIES = [
  { value: "BDT", label: "BDT — Bangladeshi Taka" },
  { value: "USD", label: "USD — US Dollar" },
  { value: "EUR", label: "EUR — Euro" },
  { value: "GBP", label: "GBP — British Pound" },
  { value: "INR", label: "INR — Indian Rupee" },
  { value: "PKR", label: "PKR — Pakistani Rupee" },
  { value: "AED", label: "AED — UAE Dirham" },
  { value: "SAR", label: "SAR — Saudi Riyal" },
] as const;

export const TIMEZONES = [
  { value: "Asia/Dhaka", label: "Asia/Dhaka (GMT+6)" },
  { value: "Asia/Kolkata", label: "Asia/Kolkata (GMT+5:30)" },
  { value: "Asia/Karachi", label: "Asia/Karachi (GMT+5)" },
  { value: "Asia/Dubai", label: "Asia/Dubai (GMT+4)" },
  { value: "Asia/Singapore", label: "Asia/Singapore (GMT+8)" },
  { value: "Europe/London", label: "Europe/London" },
  { value: "America/New_York", label: "America/New_York" },
  { value: "UTC", label: "UTC" },
] as const;
