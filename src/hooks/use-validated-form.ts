"use client";

import { useCallback, useRef, useState } from "react";
import type { ZodType } from "zod";
import { notify } from "@/lib/notify";
import {
  fieldError as getFieldError,
  validateWithSchema,
  type FieldErrors,
} from "@/lib/validate-form";

export function useValidatedForm<T extends Record<string, unknown>>(
  initialValues: T,
  schema: ZodType
) {
  const initialRef = useRef(initialValues);
  initialRef.current = initialValues;

  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<FieldErrors>({});

  const setField = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      const k = String(key);
      if (!prev[k]) return prev;
      const next = { ...prev };
      delete next[k];
      return next;
    });
  }, []);

  const validate = useCallback((): T | null => {
    const parsed = validateWithSchema(schema, values);
    if (!parsed.success) {
      setErrors(parsed.errors);
      notify.error("Please fix the errors below");
      return null;
    }
    setErrors({});
    return parsed.data as T;
  }, [schema, values]);

  const reset = useCallback((next?: T) => {
    setValues(next ?? initialRef.current);
    setErrors({});
  }, []);

  const fe = useCallback(
    (name: keyof T & string) => getFieldError(errors, name),
    [errors]
  );

  return {
    values,
    setValues,
    setField,
    errors,
    setErrors,
    validate,
    reset,
    fieldError: fe,
  };
}
