type SubmitButtonProps = {
  pending: boolean;
  label: string;
  pendingLabel: string;
};

/** Full-width primary submit button with a pending label. */
export function SubmitButton({ pending, label, pendingLabel }: SubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending || undefined}
      className="btn btn-primary btn-lg mt-2 w-full"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}
