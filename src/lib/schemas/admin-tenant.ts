import { z } from "zod";

export const tenantCreateSchema = z.object({
  name: z
    .string()
    .min(2, "Business name must be at least 2 characters")
    .max(120, "Business name is too long"),
  ownerName: z.string().max(120, "Owner name is too long").optional().or(z.literal("")),
  email: z.string().email("Enter a valid email address"),
  phone: z.string().max(30, "Phone number is too long").optional().or(z.literal("")),
  address: z.string().max(255, "Address is too long").optional().or(z.literal("")),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .max(63, "Slug is too long")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Use lowercase letters, numbers, and hyphens only"
    ),
  packageId: z.string().optional().or(z.literal("")),
  status: z.enum(["PENDING", "ACTIVE", "SUSPENDED"]),
  adminPassword: z
    .string()
    .min(6, "Admin password must be at least 6 characters")
    .max(128, "Password is too long"),
});

export type TenantCreateInput = z.infer<typeof tenantCreateSchema>;

export const tenantUpdateSchema = z.object({
  name: z
    .string()
    .min(2, "Business name must be at least 2 characters")
    .max(120, "Business name is too long"),
  ownerName: z.string().max(120, "Owner name is too long").optional().or(z.literal("")),
  email: z.string().email("Enter a valid email address"),
  phone: z.string().max(30, "Phone number is too long").optional().or(z.literal("")),
  address: z.string().max(255, "Address is too long").optional().or(z.literal("")),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .max(63, "Slug is too long")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Use lowercase letters, numbers, and hyphens only"
    ),
  packageId: z.string().optional().or(z.literal("")),
  status: z.enum(["PENDING", "ACTIVE", "SUSPENDED", "EXPIRED", "INACTIVE"]),
  loginBlocked: z.boolean(),
});

export type TenantUpdateInput = z.infer<typeof tenantUpdateSchema>;
