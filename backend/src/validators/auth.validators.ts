import { z } from 'zod'

export const registerSchema = z.object({
  email: z.email().max(255),
  password: z.string().min(8).max(128),
  fullName: z.string().trim().min(2).max(120),
})

export const loginSchema = z.object({
  email: z.email().max(255),
  password: z.string().min(1).max(128),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
