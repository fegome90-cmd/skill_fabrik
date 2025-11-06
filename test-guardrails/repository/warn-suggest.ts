import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function demo() {
  // SUGGEST: findMany without where
  await prisma.user.findMany({ select: { id: true } });

  // WARN: updateMany without where
  await prisma.user.updateMany({ data: { active: false } });
}
