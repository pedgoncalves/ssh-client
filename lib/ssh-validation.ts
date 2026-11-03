import { z } from 'zod'

export const connectionSchema = z.object({
  host: z.string().trim().min(1, 'Informe o host').max(255),
  port: z.coerce.number().int().min(1).max(65535),
  username: z.string().trim().min(1, 'Informe o usuário').max(128),
  password: z.string().max(4096).optional(),
  privateKey: z.string().max(200000).optional(),
  passphrase: z.string().max(4096).optional(),
})

export type ConnectionInput = z.infer<typeof connectionSchema>
