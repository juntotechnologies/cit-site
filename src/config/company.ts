/** Single source of truth for all CHEM-IS-TRY company contact info and branding constants. */
export const COMPANY = {
  name:         "CHEM-IS-TRY, Inc.",
  siteUrl:      "https://chem-is-try.com",
  foundingYear: "1999",

  address: {
    street:  "160-4 & 160-5 A Liberty Street, Liberty Corporate Park",
    city:    "Metuchen",
    state:   "NJ",
    zip:     "08840",
    country: "USA",
    countryCode: "US",
    /** Fully formatted single-line address for display. */
    full: "160-4 & 160-5 A Liberty Street, Liberty Corporate Park, Metuchen, NJ 08840, USA",
  },

  phone:           "+1-732-372-7311",
  phoneDisplay:    "732-372-7311",
  tollFree:        "+1-877-CHEM-123",
  tollFreeDisplay: "1-877-CHEM-123",
  tollFreeNumeric: "877-243-6123",
  fax:             "+1-732-372-7312",
  faxDisplay:      "732-372-7312",
  faxAlt:          "+1-732-603-1905",
  chemtrec:        "1-800-424-9300",

  email: "info@chem-is-try.com",

  /** URL-encoded address for Google Maps embed. */
  mapEmbedUrl: "https://maps.google.com/maps?q=160-4+%26+160-5+A+Liberty+Street+Liberty+Corporate+Park+Metuchen+NJ+08840&output=embed",

  defaultOgImage: "https://chem-is-try.com/assets/banner-01.jpg",
  logo:           "https://chem-is-try.com/assets/logo.png",
} as const;
