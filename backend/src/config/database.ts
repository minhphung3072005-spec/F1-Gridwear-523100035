import { PrismaMariaDb } from "@prisma/adapter-mariadb";

export function createMariaDbAdapter(connectionString: string): PrismaMariaDb {
  const databaseUrl = new URL(connectionString);
  const database = databaseUrl.pathname.replace(/^\//, "");

  if (databaseUrl.protocol !== "mysql:") {
    throw new Error("DATABASE_URL must use the mysql:// protocol.");
  }

  if (!database) {
    throw new Error("DATABASE_URL must include a database name.");
  }

  return new PrismaMariaDb({
    // The MariaDB driver can resolve localhost to an unavailable Windows socket/IPv6 path.
    host: databaseUrl.hostname === "localhost" ? "127.0.0.1" : databaseUrl.hostname,
    port: Number(databaseUrl.port || 3306),
    user: decodeURIComponent(databaseUrl.username),
    password: decodeURIComponent(databaseUrl.password),
    database: decodeURIComponent(database),
    connectionLimit: 10,
  });
}
