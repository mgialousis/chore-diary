import { requireHousehold } from "@/lib/household";
import { Sidebar } from "@/components/layout/sidebar";
import { BottomNav } from "@/components/layout/bottom-nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, household } = await requireHousehold();

  return (
    <div className="flex h-full flex-1">
      <Sidebar
        householdName={household.name}
        inviteCode={household.inviteCode}
        userName={user.name}
        userEmail={user.email}
        avatarUrl={user.avatarUrl}
        userColorPreference={user.colorPreference}
      />
      <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
