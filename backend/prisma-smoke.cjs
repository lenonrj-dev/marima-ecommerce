const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  await prisma.document.create({
    data: {
      collection: "test",
      data: { ok: true },
    },
  });

  const count = await prisma.document.count();
  console.log("Document count:", count);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });