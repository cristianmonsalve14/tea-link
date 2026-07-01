import './db';
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { integrationEnabled } from '../setup';
import { authHeader, getTestApp, loginAs } from '../helpers/http';
import { getTestFixture, TEST_EMAILS, TEST_PASSWORDS } from '../../prisma/seed-test';

const describeIntegration = integrationEnabled() ? describe : describe.skip;

describeIntegration('Superadmin API', () => {
  it('stats globales devuelven KPIs', async () => {
    const token = await loginAs(TEST_EMAILS.superadmin, TEST_PASSWORDS.superadmin);
    const res = await request(getTestApp())
      .get('/api/auth/superadmin/stats')
      .set(authHeader(token));

    expect(res.status).toBe(200);
    expect(res.body.kpis).toMatchObject({
      usuarios: expect.any(Number),
      perfiles: expect.any(Number),
      observaciones: expect.any(Number),
      instituciones: expect.any(Number)
    });
    expect(res.body.kpis.usuarios).toBeGreaterThan(0);
  });

  it('stats filtrados por rol FAMILIA reducen usuarios', async () => {
    const token = await loginAs(TEST_EMAILS.superadmin, TEST_PASSWORDS.superadmin);
    const [allRes, famRes] = await Promise.all([
      request(getTestApp()).get('/api/auth/superadmin/stats').set(authHeader(token)),
      request(getTestApp())
        .get('/api/auth/superadmin/stats?rol=FAMILIA')
        .set(authHeader(token))
    ]);

    expect(allRes.body.kpis.usuarios).toBeGreaterThanOrEqual(famRes.body.kpis.usuarios);
    expect(famRes.body.kpis.usuarios).toBeGreaterThanOrEqual(1);
  });

  it('stats filtrados por institución de prueba', async () => {
    const fixture = getTestFixture();
    const token = await loginAs(TEST_EMAILS.superadmin, TEST_PASSWORDS.superadmin);
    const res = await request(getTestApp())
      .get(`/api/auth/superadmin/stats?institucion=${fixture.institucionColegioId}`)
      .set(authHeader(token));

    expect(res.status).toBe(200);
    expect(res.body.kpis.instituciones).toBe(1);
  });

  it('auditoría devuelve arreglo acciones', async () => {
    const token = await loginAs(TEST_EMAILS.superadmin, TEST_PASSWORDS.superadmin);
    const res = await request(getTestApp())
      .get('/api/auth/superadmin/auditoria')
      .set(authHeader(token));

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.acciones)).toBe(true);
  });

  it('familia no accede a stats superadmin', async () => {
    const token = await loginAs(TEST_EMAILS.familia, TEST_PASSWORDS.familia);
    const res = await request(getTestApp())
      .get('/api/auth/superadmin/stats')
      .set(authHeader(token));

    expect(res.status).toBe(403);
  });
});
