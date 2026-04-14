import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export async function getCurrentUser() {
  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  const user = await db.user.upsert({
    where: { clerkId: clerkUser.id },
    update: {
      name: clerkUser.firstName ?? "User",
      email: clerkUser.emailAddresses[0]?.emailAddress ?? "",
    },
    create: {
      clerkId: clerkUser.id,
      name: clerkUser.firstName ?? "User",
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
