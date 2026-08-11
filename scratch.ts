import { PrismaClient } from './apps/backend/node_modules/@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const cities = await prisma.city.findMany();
  console.log(cities.map(c => c.name));
}
main().catch(console.error).finally(() => prisma.$disconnect());
