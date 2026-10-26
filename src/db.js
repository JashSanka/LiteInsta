require("dotenv/config");

const { PrismaClient } = require("../generated/prisma/client.ts");
const { PrismaPg } = require("@prisma/adapter-pg");

function getConnectionString(url) {
  if (url && url.startsWith("prisma+postgres:")) {
    try {
      const u = new URL(url);
      const apiKey = u.searchParams.get("api_key");
      if (apiKey) {
        const decoded = JSON.parse(Buffer.from(apiKey, "base64").toString("utf8"));
        if (decoded.databaseUrl) return decoded.databaseUrl;
      }
    } catch (e) {
      // fallback
    }
  }
  return url;
}

const connectionString = getConnectionString(process.env.DATABASE_URL);
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

module.exports = prisma;
