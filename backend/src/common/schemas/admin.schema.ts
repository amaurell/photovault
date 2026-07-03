import { z } from 'zod';

export const resetPasswordSchema = z.object({
  password: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Senha deve conter pelo menos uma letra maiúscula')
    .regex(/[a-z]/, 'Senha deve conter pelo menos uma letra minúscula')
    .regex(/[0-9]/, 'Senha deve conter pelo menos um número'),
});

export const updateScheduleSchema = z.object({
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Formato inválido (HH:MM)'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Formato inválido (HH:MM)'),
  enabled: z.boolean(),
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type UpdateScheduleInput = z.infer<typeof updateScheduleSchema>;
