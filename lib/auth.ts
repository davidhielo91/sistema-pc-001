"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { createSession, deleteSession } from "./session";
import { LoginFormSchema } from "./definitions";
import type { LoginFormState } from "./definitions";

export async function login(_prevState: LoginFormState, formData: FormData) {
  const validatedFields = LoginFormSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { email, password } = validatedFields.data;

  const user = await prisma.usuario.findUnique({
    where: { email },
  });

  if (!user || !user.activo) {
    return { message: "Credenciales inválidas" };
  }

  const passwordMatch = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatch) {
    return { message: "Credenciales inválidas" };
  }

  await createSession(user.id, user.rol);
  redirect("/dashboard");
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}
