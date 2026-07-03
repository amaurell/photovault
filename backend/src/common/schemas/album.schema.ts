import { z } from 'zod';

export const createAlbumSchema = z.object({
  title: z.string().min(1, 'Título obrigatório').max(200),
  description: z.string().max(1000).optional(),
});

export const updateAlbumSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  coverUrl: z.string().optional(),
});

export const albumQuerySchema = z.object({
  page: z.coerce.number().optional().default(1),
  limit: z.coerce.number().optional().default(20),
  search: z.string().optional(),
  userId: z.string().optional(),
});

export type CreateAlbumInput = z.infer<typeof createAlbumSchema>;
export type UpdateAlbumInput = z.infer<typeof updateAlbumSchema>;
export type AlbumQueryInput = z.infer<typeof albumQuerySchema>;
