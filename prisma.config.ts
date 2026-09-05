import { loadEnvConfig } from "@next/env";
import { fileURLToPath } from "node:url";
import { defineConfig } from "prisma/config";

// Match Next.js precedence, including .env.local, without overriding shell/CI values.
loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production");

const prismaCliUrl = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

if (!prismaCliUrl) {
  throw new Error("DIRECT_URL or DATABASE_URL is required for Prisma CLI.");
}

export default defineConfig({
    schema: fileURLToPath(new URL("./prisma/schema.prisma", import.meta.url)),
    migrations: {
        seed: "node prisma/seed.ts",
    },
    datasource: {
        url: prismaCliUrl,
    },
});
