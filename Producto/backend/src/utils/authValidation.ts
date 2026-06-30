import { z } from 'zod';
import { normalizeEmail } from './email';

export const loginSchema = z.object({
  email: z.string().trim().email().transform(normalizeEmail),
  password: z.string().min(6)
});

export function parseLoginBody(body: unknown) {
  return loginSchema.parse(body);
}
