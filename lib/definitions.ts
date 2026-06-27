import { z } from "zod";

export const LoginFormSchema = z.object({
  email: z.string().email({ message: "Correo inválido" }).trim(),
  password: z.string().min(1, { message: "Contraseña requerida" }),
});

export type LoginFormState =
  | { errors?: { email?: string[]; password?: string[] }; message?: string }
  | undefined;

export type SessionPayload = {
  userId: string;
  rol: string;
  expiresAt: Date;
};
