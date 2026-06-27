"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";

const UsuarioSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  email: z.string().email("Correo inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
  rol: z.enum(["ADMIN", "TECNICO"]),
});

export async function getUsuarios() {
  const session = await verifySession();
  if (session.rol !== "ADMIN") {
    return [];
  }
  return prisma.usuario.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      nombre: true,
      email: true,
      rol: true,
      activo: true,
      createdAt: true,
    },
  });
}

export async function createUsuario(formData: FormData) {
  const session = await verifySession();
  if (session.rol !== "ADMIN") {
    return { message: "Solo administradores" };
  }

  const raw = Object.fromEntries(formData);
  const parsed = UsuarioSchema.safeParse(raw);

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const existing = await prisma.usuario.findUnique({
    where: { email: parsed.data.email },
  });
  if (existing) {
    return { message: "Ya existe un usuario con ese email" };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  await prisma.usuario.create({
    data: {
      nombre: parsed.data.nombre,
      email: parsed.data.email,
      passwordHash,
      rol: parsed.data.rol,
    },
  });

  revalidatePath("/dashboard/usuarios");
  return { success: true };
}

export async function toggleUsuarioActivo(id: string) {
  const session = await verifySession();
  if (session.rol !== "ADMIN") {
    return { message: "Solo administradores" };
  }

  const user = await prisma.usuario.findUnique({ where: { id } });
  if (!user) return { message: "Usuario no encontrado" };

  await prisma.usuario.update({
    where: { id },
    data: { activo: !user.activo },
  });

  revalidatePath("/dashboard/usuarios");
  return { success: true };
}

export async function cambiarRolUsuario(id: string, rol: "ADMIN" | "TECNICO") {
  const session = await verifySession();
  if (session.rol !== "ADMIN") {
    return { message: "Solo administradores" };
  }

  await prisma.usuario.update({
    where: { id },
    data: { rol },
  });

  revalidatePath("/dashboard/usuarios");
  return { success: true };
}
