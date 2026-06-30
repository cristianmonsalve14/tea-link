import './db';
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { integrationEnabled } from '../setup';
import { authHeader, getTestApp, loginAs } from '../helpers/http';
import { getTestFixture, TEST_EMAILS, TEST_PASSWORDS } from '../../prisma/seed-test';

const describeIntegration = integrationEnabled() ? describe : describe.skip;

describeIntegration('RBAC API (CP-04, CP-05)', () => {
  it('CP-04: familia no puede crear institución (solo superadmin)', async () => {
    const token = await loginAs(TEST_EMAILS.familia, TEST_PASSWORDS.familia);
    const res = await request(getTestApp())
      .post('/api/auth/institucion')
      .set(authHeader(token))
      .send({ nombre: 'Hack Inst', tipo: 'FAMILIA' });

    expect(res.status).toBe(403);
  });

  it('CP-05: administrador puede listar observaciones en solo lectura', async () => {
    const fixture = getTestFixture();
    const token = await loginAs(TEST_EMAILS.admin, TEST_PASSWORDS.admin);
    const res = await request(getTestApp())
      .get(`/api/observaciones?perfil_id=${fixture.perfilId}`)
      .set(authHeader(token));

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.observaciones)).toBe(true);
    const titulos = res.body.observaciones.map((o: { titulo: string }) => o.titulo);
    expect(titulos).toContain('[TEST] Observación pública');
    expect(titulos).toContain('[TEST] Nota multinivel');
    expect(titulos).not.toContain('[TEST] Nota privada médica');
  });

  it('CP-05b: administrador no puede crear observaciones', async () => {
    const fixture = getTestFixture();
    const token = await loginAs(TEST_EMAILS.admin, TEST_PASSWORDS.admin);
    const res = await request(getTestApp())
      .post('/api/observaciones')
      .set(authHeader(token))
      .send({
        titulo: '[TEST] Admin no debe crear',
        descripcion: 'Intento de creación por administrador',
        categoria: 'CONDUCTA',
        fecha_evento: new Date().toISOString(),
        perfil_id: fixture.perfilId
      });

    expect(res.status).toBe(403);
  });

  it('superadmin puede listar instituciones', async () => {
    const token = await loginAs(TEST_EMAILS.superadmin, TEST_PASSWORDS.superadmin);
    const res = await request(getTestApp())
      .get('/api/auth/instituciones')
      .set(authHeader(token));

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.instituciones)).toBe(true);
  });
});
