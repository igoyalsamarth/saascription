import { SignedIn, UserButton } from "@clerk/clerk-react";

export default function HeaderUser() {
  return (
    <SignedIn>
      <UserButton />
    </SignedIn>
  );
}
