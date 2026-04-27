import { SignIn, useAuth } from "@clerk/clerk-react";
import { Navigate } from "@tanstack/react-router";

export function SignInPage() {
  const { isLoaded, userId } = useAuth();

  if (!isLoaded) {
    return (
      <main className="flex min-h-screen flex-1 flex-col items-center justify-center bg-background px-4">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </main>
    );
  }

  if (userId) {
    return <Navigate to="/" replace />;
  }

  return (
    <main className="flex min-h-screen flex-1 flex-col items-center justify-center bg-background px-4 py-10 sm:px-6">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 text-card-foreground shadow-sm sm:p-8">
        <SignIn
          routing="path"
          path="/sign-in"
          forceRedirectUrl="/"
          fallbackRedirectUrl="/"
        />
      </div>
    </main>
  );
}
