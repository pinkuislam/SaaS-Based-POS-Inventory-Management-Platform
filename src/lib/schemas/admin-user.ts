import { z } from "zod";

export const adminUserCreateSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email address"),
  phone: z.string().max(30, "Phone is too long").optional().or(z.literal("")),
  password: z.string().min(6, "Password must be at least 6 characters"),
  roleId: z.string().min(1, "Please select a role"),
});

export const adminUserUpdateSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email address"),
  phone: z.string().max(30, "Phone is too long").optional().or(z.literal("")),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .optional()
    .or(z.literal("")),
  roleId: z.string().min(1, "Please select a role"),
  isActive: z.boolean().optional(),
});
