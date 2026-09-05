import { createRoot } from "react-dom/client";
import TodayPage from "../../src/app/(dashboard)/today/page";
import { Sidebar } from "../../src/components/layout/sidebar";
import { BottomNav } from "../../src/components/layout/bottom-nav";
import "../../src/app/globals.css";

// Render the real page, with data/auth/action imports isolated by the preview
// bundler. No preview route or authentication bypass is added to Next.js.
const page = await TodayPage();
createRoot(document.getElementById("root")!).render(
  <div style={{ fontFamily: "Arial, sans-serif" }}>
    <div className="border-b bg-amber-50 px-4 py-2 text-center text-xs text-amber-900">
      Read-only component preview · fictional household · no server connection
    </div>
    <div className="flex h-[calc(100dvh-33px)]">
      <Sidebar householdName="Alex & Sam" inviteCode="DEMOONLY" userName="Alex"
        userEmail="alex@example.com" avatarUrl={null} userColorPreference="SKY" />
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0">{page}</main>
      <BottomNav />
    </div>
  </div>,
);
