"use client";

import { useState } from "react";

interface AuthFormWrapperProps {
  action: (formData: FormData) => Promise<{ error: string } | void>;
  children: React.ReactNode;
}

export function AuthFormWrapper({ action, children }: AuthFormWrapperProps) {
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setError(null);
    const result = await action(formData);
    if (result?.error) setError(result.error);
  }

  return (
    <form action={handleSubmit}>
      {children}
      {error && (
        <p className="text-sm text-destructive mt-3 text-center">{error}</p>
      )}
    </form>
  );
}
