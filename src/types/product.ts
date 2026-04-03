import { z } from "zod";

export const ProductSchema = z.object({
  catalog_number:   z.string().optional(),
  name:             z.string().optional(),
  url:              z.string().optional(),
  cas:              z.string().optional(),
  molecular_weight: z.string().optional(),
  molecular_formula:z.string().optional(),
  image_url:        z.string().optional(),
  image_file:       z.string().optional(),
  category:         z.string().optional(),
  // Detail-page fields
  purity:           z.string().optional(),
  grade:            z.string().optional(),
  synonyms:         z.string().optional(),
  description:      z.string().optional(),
  tags:             z.array(z.string()).optional(),
});

export type Product = z.infer<typeof ProductSchema>;

/** Single source of truth for the catalog number label used across card views. */
export const CIT_LABEL = "CIT #:";

/** Parse and validate a raw JSON array as Product[]. Throws at build time on schema mismatch. */
export function parseProducts(data: unknown[]): Product[] {
  return data.map((item) => ProductSchema.parse(item));
}
