"use client";

import * as React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select2, Select2Multi, type Select2Option } from "@/components/ui/select2";
import { cn } from "@/lib/utils";

type FormFieldProps = {
  label?: string;
  htmlFor?: string;
  required?: boolean;
  error?: string;
  description?: string;
  className?: string;
  children: React.ReactNode;
};

export function FormField({
  label,
  htmlFor,
  required,
  error,
  description,
  className,
  children,
}: FormFieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {label ? (
        <Label htmlFor={htmlFor}>
          {label}
          {required ? (
            <span className="ml-0.5 text-destructive" aria-hidden>
              *
            </span>
          ) : null}
        </Label>
      ) : null}
      {children}
      {error ? (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : description ? (
        <p className="text-xs text-muted-foreground">{description}</p>
      ) : null}
    </div>
  );
}

type FormInputProps = React.ComponentProps<typeof Input> & {
  error?: string;
};

export function FormInput({ error, className, id, name, ...props }: FormInputProps) {
  const fieldId = id ?? name;
  return (
    <Input
      id={fieldId}
      name={name}
      aria-invalid={error ? true : undefined}
      className={cn(error && "border-destructive", className)}
      {...props}
    />
  );
}

type FormTextareaProps = React.ComponentProps<typeof Textarea> & {
  error?: string;
};

export function FormTextarea({
  error,
  className,
  id,
  name,
  ...props
}: FormTextareaProps) {
  const fieldId = id ?? name;
  return (
    <Textarea
      id={fieldId}
      name={name}
      aria-invalid={error ? true : undefined}
      className={cn(error && "border-destructive", className)}
      {...props}
    />
  );
}

export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="text-xs text-destructive" role="alert">
      {message}
    </p>
  );
}

type FormSelect2Props = {
  label?: string;
  htmlFor?: string;
  required?: boolean;
  error?: string;
  description?: string;
  className?: string;
  options: Select2Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchable?: boolean;
  disabled?: boolean;
};

type FormSelect2MultiProps = {
  label?: string;
  htmlFor?: string;
  required?: boolean;
  error?: string;
  description?: string;
  className?: string;
  options: Select2Option[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  searchable?: boolean;
  disabled?: boolean;
};

export function FormSelect2Multi({
  label,
  htmlFor,
  required,
  error,
  description,
  className,
  options,
  value,
  onChange,
  placeholder,
  searchable,
  disabled,
}: FormSelect2MultiProps) {
  return (
    <FormField
      label={label}
      htmlFor={htmlFor}
      required={required}
      error={error}
      description={description}
      className={className}
    >
      <Select2Multi
        options={options}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        searchable={searchable}
        disabled={disabled}
        error={error}
      />
    </FormField>
  );
}

export function FormSelect2({
  label,
  htmlFor,
  required,
  error,
  description,
  className,
  options,
  value,
  onChange,
  placeholder,
  searchable,
  disabled,
}: FormSelect2Props) {
  return (
    <FormField
      label={label}
      htmlFor={htmlFor}
      required={required}
      error={error}
      description={description}
      className={className}
    >
      <Select2
        options={options}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        searchable={searchable}
        disabled={disabled}
        error={error}
      />
    </FormField>
  );
}
