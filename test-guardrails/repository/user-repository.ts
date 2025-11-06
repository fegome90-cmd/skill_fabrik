import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class UserRepository {
  // ❌ ESTE DEBE GENERAR SUGGEST (findMany sin where)
  async findAllUsers() {
    return await prisma.user.findMany();
  }

  // ❌ ESTE DEBE GENERAR WARN (updateMany sin where)
  async deactivateAllUsers() {
    return await prisma.user.updateMany({
      data: { active: false },
    });
  }

  // ❌ ESTE DEBE GENERAR BLOCK (deleteMany sin where)
  async deleteAllUsers() {
    return await prisma.user.deleteMany();
  }

  // ✅ ESTE NO DEBE GENERAR VIOLACIÓN (tiene where)
  async findActiveUsers() {
    return await prisma.user.findMany({
      where: { active: true },
    });
  }

  // ✅ ESTE NO DEBE GENERAR VIOLACIÓN (tiene where)
  async updateUserStatus(userId: string, active: boolean) {
    return await prisma.user.updateMany({
      where: { id: userId },
      data: { active },
    });
  }

  // ✅ ESTE NO DEBE GENERAR VIOLACIÓN (tiene where)
  async deleteUser(userId: string) {
    return await prisma.user.deleteMany({
      where: { id: userId },
    });
  }
}
