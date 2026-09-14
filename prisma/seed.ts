import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { hash } from "bcryptjs";
import { z } from "zod";

const connectionString = z.string().url().parse(process.env.DATABASE_URL);
const db = new PrismaClient({ adapter: new PrismaNeon({ connectionString }) });

async function main() {
  await db.financialCategory.upsert({
    where: { systemKey: "MONTHLY_DUES" },
    update: {},
    create: { name: "Uang Kas", type: "INCOME", systemKey: "MONTHLY_DUES" },
  });
  for (const name of ["Listrik", "WiFi"]) {
    await db.financialCategory.upsert({
      where: { name_type: { name, type: "EXPENSE" } },
      update: {},
      create: { name, type: "EXPENSE" },
    });
  }
  await db.appSetting.upsert({ where: { id: "default" }, update: {}, create: {} });
  if (process.env.SEED_ADMIN_EMAIL && process.env.SEED_ADMIN_PASSWORD) {
    const email = z.email().parse(process.env.SEED_ADMIN_EMAIL.trim().toLowerCase());
    const password = z.string().min(6).max(72).parse(process.env.SEED_ADMIN_PASSWORD);
    await db.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        name: process.env.SEED_ADMIN_NAME || "Admin MyKontrakans",
        role: "ADMIN",
        passwordHash: await hash(password, 12),
        activatedAt: new Date(),
      },
    });
    console.info("Seed administrator selesai (akun existing tidak diubah).");
  } else {
    console.info("Seed user dilewati: SEED_ADMIN_EMAIL/PASSWORD belum diisi.");
  }
  console.info("Seed kategori dan pengaturan selesai.");
}

main().catch(() => {
  console.error("Seed gagal. Periksa konfigurasi dan koneksi database.");
  process.exitCode = 1;
}).finally(() => db.$disconnect());
