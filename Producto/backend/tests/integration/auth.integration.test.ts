import './db';
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { integrationEnabled } from '../setup';
import { authHeader, getTestApp, loginAs } from '../helpers/http';
import { TEST_EMAILS, TEST_PASSWORDS } from '../../prisma/seed-test';

const describeIntegration = integrationEnabled() ? describe : describe.skip;

describeIntegration('Auth API (CP-01, CP-02)', () => {
  it('CP-01: login exitoso devuelve token y usuario', async () => {
    const res = await request(getTestApp())
      .post('/api/auth/login')
      .send({ email: TEST_EMAILS.familia, password: TEST_PASSWORDS.familia });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user.rol).toBe('FAMILIA');
    expect(res.body.user.email).toBe(TEST_EMAILS.familia);
  });

  it('CP-02: credenciales inválidas devuelven 401', async () => {
    const res = await request(getTestApp())
      .post('/api/auth/login')
      .send({ email: TEST_EMAILS.familia, password: 'clave-incorrecta' });

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/credenciales/i);
  });

  it('ruta protegida sin token devuelve 401', async () => {
    const res = await request(getTestApp()).get('/api/perfiles');
    expect(res.status).toBe(401);
  });

  it('token inválido devuelve 403', async () => {
    const res = await request(getTestApp())
      .get('/api/perfiles')
      .set(authHeader('token.invalido'));
    expect(res.status).toBe(403);
  });

  it('loginAs helper obtiene token válido', async () => {
    const token = await loginAs(TEST_EMAILS.medico, TEST_PASSWORDS.medico);
    expect(token.split('.')).toHaveLength(3);
  });
});
