import { z } from 'zod';

export const photoQuerySchema = z.object({
  page: z.coerce.number().optional().default(1),
  limit: z.coerce.number().optional().default(20),
  search: z.string().optional(),
  albumId: z.string().optional(),
  tag: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  favorite: z.coerce.boolean().optional(),
  sortBy: z.enum(['createdAt', 'name', 'size']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  userId: z.string().optional(),
});

export const movePhotoSchema = z.object({
  albumId: z.string().min(1, 'Álbum de destino obrigatório'),
});

const tagSchema = z.string().min(1, 'Tag não pode ser vazia').max(50, 'Tag deve ter no máximo 50 caracteres');

export const addTagsSchema = z.object({
  tags: z.array(tagSchema).min(1, 'Pelo menos uma tag é obrigatória').max(20, 'Máximo de 20 tags por vez'),
});

export const updatePhotoSchema = z.object({
  tags: z.array(z.string()).optional(),
  albumId: z.string().optional(),
});

export const updateCaptionSchema = z.object({
  caption: z.string().max(500, 'Legenda deve ter no máximo 500 caracteres').optional(),
});

export type PhotoQueryInput = z.infer<typeof photoQuerySchema>;
export type MovePhotoInput = z.infer<typeof movePhotoSchema>;
export type AddTagsInput = z.infer<typeof addTagsSchema>;
export type UpdatePhotoInput = z.infer<typeof updatePhotoSchema>;
export type UpdateCaptionInput = z.infer<typeof updateCaptionSchema>;
