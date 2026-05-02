import { createFileRoute } from "@tanstack/react-router";

import { OnboardForm } from "@/components/onboard-form";

export const Route = createFileRoute("/onboard")({
  component: OnboardRoute,
});

function OnboardRoute() {
  return (
    <div className="flex flex-1 flex-col justify-center bg-background px-4 py-10">
      <OnboardForm />
    </div>
  );
}
