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

function getErrorDetails(error: unknown) {
  if (!(error instanceof Error)) {
    return { error };
  }

  const details: Record<string, unknown> = {
    name: error.name,
    message: error.message,
  };

  if ("code" in error) details.code = (error as { code?: string }).code;
  if ("meta" in error) details.meta = (error as { meta?: unknown }).meta;
  if ("clientVersion" in error) {
    details.clientVersion = (error as { clientVersion?: string }).clientVersion;
  }

  return details;
}

function getDatabaseHost() {
  const url = process.env.DATABASE_URL;
  if (!url) return null;

  try {
    return new URL(url).host;
  } catch {
    return url.split("@")[1]?.split("/")[0] ?? null;
  }
}

export async function getCurrentUser() {
  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  const email = clerkUser.emailAddresses[0]?.emailAddress ?? "";
  const displayName = getDefaultDisplayName(clerkUser);
  let stage = "start";

  try {
    stage = "findUnique(clerkId)";
    const existingByClerkId = await db.user.findUnique({
      where: { clerkId: clerkUser.id },
    });

    if (existingByClerkId) {
      stage = "update(existingByClerkId)";
      return db.user.update({
        where: { id: existingByClerkId.id },
        data: {
          email,
          avatarUrl: clerkUser.imageUrl,
        },
      });
    }

    if (email) {
      stage = "findUnique(email)";
      const existingByEmail = await db.user.findUnique({
        where: { email },
      });

      if (existingByEmail) {
        stage = "update(existingByEmail)";
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

    stage = "create";
    return db.user.create({
      data: {
        clerkId: clerkUser.id,
        name: displayName,
        email,
        avatarUrl: clerkUser.imageUrl,
      },
    });
  } catch (error) {
    console.error(
      `[auth] getCurrentUser failed ${JSON.stringify({
        stage,
        clerkId: clerkUser.id,
        email,
        databaseHost: getDatabaseHost(),
        ...getErrorDetails(error),
      })}`,
    );
    throw error;
  }
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  return user;
}
