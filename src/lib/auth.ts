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

  const email = clerkUser.emailAddresses[0]?.emailAddress ?? "";
  const displayName = getDefaultDisplayName(clerkUser);

  const existingByClerkId = await db.user.findUnique({
    where: { clerkId: clerkUser.id },
  });

  if (existingByClerkId) {
    return db.user.update({
      where: { id: existingByClerkId.id },
      data: {
        email,
        avatarUrl: clerkUser.imageUrl,
      },
    });
  }

  if (email) {
    const existingByEmail = await db.user.findUnique({
      where: { email },
    });

    if (existingByEmail) {
      return db.user.update({
        where: { id: existingByEmail.id },
        data: {
          clerkId: clerkUser.id,
          avatarUrl: clerkUser.imageUrl,
          email,
        },
      });
    }
  }

  const user = await db.user.create({
    data: {
      clerkId: clerkUser.id,
      name: displayName,
      email,
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
