import { useId, type ComponentProps } from "react";

type FormFieldProps = Omit<ComponentProps<"input">, "id" | "name"> & {
  name: string;
  label: string;
  hint?: string;
};

/** Labelled text input using the `.field` / `.input` design primitives. */
export function FormField({ name, label, hint, className, ...input }: FormFieldProps) {
  // useId: sign-in and sign-up both have "email"/"password" fields and can
  // be mounted at the same time (Activity), so names alone would collide.
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;

  return (
    <div className="field">
      <label htmlFor={id} className="label">
        {label}
      </label>
      <input
        id={id}
        name={name}
        aria-describedby={hintId}
        className={className ? `input ${className}` : "input"}
        {...input}
      />
      {hint && (
        <p id={hintId} className="hint">
          {hint}
        </p>
      )}
    </div>
  );
}
