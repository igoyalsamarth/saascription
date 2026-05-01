import { SignedIn, UserButton } from "@clerk/clerk-react";

export default function ClerkHeaderUser() {
  return (
    <SignedIn>
      <UserButton />
    </SignedIn>
  );
}
