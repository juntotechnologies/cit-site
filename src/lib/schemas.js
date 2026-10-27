/** Declared shapes of the three data files that hold every site fact. A bad edit fails at load time. */
import { z } from "zod";

const SitePath = z.string().regex(/^\/(.*\/)?$/, "a site path starts and ends with /");
const AssetPath = z.string().regex(/^\/[^/].*\.(jpg|png|webp|svg)$/, "an asset path starts with / and names an image");

const Address = z.object({
  street: z.string(),
  city: z.string(),
  state: z.string(),
  zip: z.string(),
  country: z.string(),
  countryCode: z.string().length(2),
}).strict();

export const CompanySchema = z.object({
  name: z.string(),
  tagline: z.string(),
  siteUrl: z.string().url().refine((url) => !url.endsWith("/"), "no trailing slash"),
  foundingYear: z.string().regex(/^\d{4}$/),
  address: Address,
  phone: z.string(),
  tollFree: z.string(),
  tollFreeNumeric: z.string().regex(/^\+1-\d{3}-\d{3}-\d{4}$/),
  fax: z.string(),
  faxAlt: z.string(),
  chemtrec: z.string(),
  email: z.string().email(),
  bookingUrl: z.string().url(),
  defaultOgImage: AssetPath,
  logo: AssetPath,
}).strict();

const TeamMember = z.object({ name: z.string(), title: z.string(), email: z.string().email() }).strict();

export const MetadataSchema = z.object({
  company: CompanySchema,
  analytics: z.object({ gaMeasurementId: z.string().regex(/^G-[A-Z0-9]+$/) }).strict(),
  team: z.array(TeamMember).min(1),
}).strict();

const Page = z.object({
  path: SitePath,
  title: z.string(),
  description: z.string(),
  menu: z.string().optional(),
  footer: z.string().optional(),
}).strict();

const Category = z.object({
  value: z.string().regex(/^[a-z-]+$/),
  label: z.string(),
  homeLink: z.string().optional(),
}).strict();

export const PagesSchema = z.object({ pages: z.array(Page).min(1), categories: z.array(Category).min(1) }).strict();

export const DiscoverySchema = z.object({
  summary: z.string(),
  llmsNote: z.string(),
  mayDo: z.array(z.string()).min(1),
  mayNotDo: z.array(z.string()).min(1),
  contactPaths: z.array(SitePath).min(1),
}).strict();
