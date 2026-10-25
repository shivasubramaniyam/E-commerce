import pkg from "@prisma/client";

const { PrismaClient } = pkg;

// ✅ PERF: only log queries in development — query logging in prod is a major throughput killer
const prisma = new PrismaClient({
  log:
    process.env.NODE_ENV === "development"
      ? ["query", "error", "warn"]
      : ["error"],
});

export default prisma;
