import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

function getDefaultDisplayName(clerkUser: NonNullable<Awaited<ReturnType<typeof currentUser>>>) {
  return (
    clerkUser.firstName ??
    clerkUser.fullName ??
    clerkUser.username ??
    clerkUser.emailAddresses[0]?.emailAddress?.split("@")[0] ??
    "User"
  );
}

export async function getCurrentUser() {
  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  const user = await db.user.upsert({
    where: { clerkId: clerkUser.id },
    update: {
      email: clerkUser.emailAddresses[0]?.emailAddress ?? "",
      avatarUrl: clerkUser.imageUrl,
    },
    create: {
      clerkId: clerkUser.id,
      name: getDefaultDisplayName(clerkUser),
      email: clerkUser.emailAddresses[0]?.emailAddress ?? "",
      avatarUrl: clerkUser.imageUrl,
    },
  });

  return user;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  return user;
}
