import { getHouseholdForUser } from "@/lib/household";
import { redirect } from "next/navigation";
import { OnboardingForm } from "@/components/onboarding/onboarding-form";

export default async function OnboardingPage() {
  const { household } = await getHouseholdForUser();

  if (household) {
    redirect("/today");
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <OnboardingForm />
    </div>
  );
}
