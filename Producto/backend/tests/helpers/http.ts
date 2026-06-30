import request from 'supertest';
import type { Express } from 'express';
import { createApp } from '../../src/app';

let app: Express;

export function getTestApp(): Express {
  if (!app) app = createApp();
  return app;
}

export async function loginAs(email: string, password: string): Promise<string> {
  const res = await request(getTestApp())
    .post('/api/auth/login')
    .send({ email, password });

  if (res.status !== 200 || !res.body.token) {
    throw new Error(`Login falló para ${email}: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return res.body.token as string;
}

export function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}
