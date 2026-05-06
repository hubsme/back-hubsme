import type { Config } from "drizzle-kit";
import { dbConfig } from "@db/config.db";

export default {
  schema: "./src/db/tables/*.table.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: dbConfig,
} satisfies Config;
