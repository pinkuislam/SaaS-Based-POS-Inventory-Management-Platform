import type { ZodType, z } from "zod";

export type FieldErrors = Record<string, string>;

export function validateWithSchema<T extends ZodType>(
  schema: T,
  data: unknown
):
  | { success: true; data: z.infer<T> }
  | { success: false; errors: FieldErrors } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors: FieldErrors = {};
  for (const issue of result.error.issues) {
    const key = issue.path.length > 0 ? String(issue.path[0]) : "_form";
    if (!errors[key]) {
      errors[key] = issue.message;
    }
  }
  return { success: false, errors };
}

export function fieldError(errors: FieldErrors, name: string): string | undefined {
  return errors[name];
}
