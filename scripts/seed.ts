// scripts/seed.ts
// Run: npm run db:seed

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database…");

  // Seed mailbox sequence
  await prisma.mailboxCodeSequence.upsert({
    where:  { id: 1 },
    update: {},
    create: { prefix: "KLD", counter: 0 },
  });

  // Admin user
  const adminHash = await bcrypt.hash("admin1234", 12);
  const admin = await prisma.user.upsert({
    where:  { email: "admin@freightco.com" },
    update: {},
    create: {
      email:        "admin@freightco.com",
      passwordHash: adminHash,
      name:         "Admin User",
      role:         "ADMIN",
    },
  });
  console.log("✓ Admin:", admin.email);

  // Worker user
  const workerHash = await bcrypt.hash("worker1234", 12);
  const worker = await prisma.user.upsert({
    where:  { email: "worker@freightco.com" },
    update: {},
    create: {
      email:        "worker@freightco.com",
      passwordHash: workerHash,
      name:         "Warehouse Worker",
      role:         "WORKER",
    },
  });
  console.log("✓ Worker:", worker.email);

  // Demo customer 1
  const c1Hash = await bcrypt.hash("customer1234", 12);
  const customer1 = await prisma.user.upsert({
    where:  { email: "jane@example.com" },
    update: {},
    create: {
      email:        "jane@example.com",
      passwordHash: c1Hash,
      name:         "Jane Adeyemi",
      role:         "CUSTOMER",
      mailboxCode:  "KLD-001",
      phone:        "+2348012345678",
      country:      "Nigeria",
      address:      "12 Lagos Street, Lekki Phase 1",
    },
  });
  console.log("✓ Customer 1:", customer1.email, "→", customer1.mailboxCode);

  // Demo customer 2
  const c2Hash = await bcrypt.hash("customer1234", 12);
  const customer2 = await prisma.user.upsert({
    where:  { email: "kwame@example.com" },
    update: {},
    create: {
      email:        "kwame@example.com",
      passwordHash: c2Hash,
      name:         "Kwame Mensah",
      role:         "CUSTOMER",
      mailboxCode:  "KLD-002",
      phone:        "+233241234567",
      country:      "Ghana",
      address:      "45 Accra Road, East Legon",
    },
  });
  console.log("✓ Customer 2:", customer2.email, "→", customer2.mailboxCode);

  // Update sequence counter
  await prisma.mailboxCodeSequence.update({
    where: { id: 1 },
    data:  { counter: 2 },
  });

  // Seed some packages for Jane
  const packages = await Promise.all([
    prisma.package.create({
      data: {
        clientId:      customer1.id,
        trackingNumber: "TBA123456789000",
        retailer:      "Amazon",
        origin:        "UK",
        weight:        1.2,
        status:        "RECEIVED",
      },
    }),
    prisma.package.create({
      data: {
        clientId:      customer1.id,
        trackingNumber: "AS987654321",
        retailer:      "ASOS",
        origin:        "UK",
        weight:        0.5,
        status:        "RECEIVED",
      },
    }),
    prisma.package.create({
      data: {
        clientId:      customer1.id,
        trackingNumber: "JD000654321789",
        retailer:      "DPD",
        origin:        "China",
        weight:        2.1,
        status:        "RECEIVED",
      },
    }),
  ]);
  console.log(`✓ Created ${packages.length} packages for Jane`);

  // One package for Kwame
  await prisma.package.create({
    data: {
      clientId:      customer2.id,
      trackingNumber: "GB123456789GB",
      retailer:      "Royal Mail",
      origin:        "UK",
      weight:        0.8,
      status:        "RECEIVED",
    },
  });
  console.log("✓ Created 1 package for Kwame");

  console.log("\n🎉 Seed complete!\n");
  console.log("Test logins:");
  console.log("  Admin:    admin@freightco.com    / admin1234");
  console.log("  Worker:   worker@freightco.com   / worker1234");
  console.log("  Customer: jane@example.com       / customer1234  (KLD-001)");
  console.log("  Customer: kwame@example.com      / customer1234  (KLD-002)");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
