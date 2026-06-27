import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminNombre = process.env.ADMIN_NOMBRE;
  const tallerNombre = process.env.TALLER_NOMBRE;
  const tallerMoneda = process.env.TALLER_MONEDA || "MXN";

  if (!adminEmail || !adminPassword || !adminNombre || !tallerNombre) {
    console.error(
      "Faltan variables de entorno: ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NOMBRE, TALLER_NOMBRE"
    );
    process.exit(1);
  }

  const existingAdmin = await prisma.usuario.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    await prisma.usuario.create({
      data: {
        nombre: adminNombre,
        email: adminEmail,
        passwordHash,
        rol: "ADMIN",
      },
    });
    console.log(`Usuario ADMIN creado: ${adminEmail}`);
  } else {
    console.log(`Usuario ADMIN ya existe: ${adminEmail}`);
  }

  const ajustes = await prisma.ajustes.findUnique({ where: { id: 1 } });

  if (!ajustes) {
    await prisma.ajustes.create({
      data: {
        id: 1,
        nombreTaller: tallerNombre,
        moneda: tallerMoneda,
      },
    });
    console.log(`Ajustes creados: ${tallerNombre}`);
  } else {
    console.log(`Ajustes ya existen: ${ajustes.nombreTaller}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
