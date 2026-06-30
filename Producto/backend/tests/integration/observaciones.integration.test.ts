import './db';
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { integrationEnabled } from '../setup';
import { authHeader, getTestApp, loginAs } from '../helpers/http';
import { getTestFixture, TEST_EMAILS, TEST_PASSWORDS } from '../../prisma/seed-test';

const describeIntegration = integrationEnabled() ? describe : describe.skip;

describeIntegration('Observaciones API (CP-08, CP-09)', () => {
  it('CP-08: familia crea observación pública', async () => {
    const fixture = getTestFixture();
    const token = await loginAs(TEST_EMAILS.familia, TEST_PASSWORDS.familia);
    const res = await request(getTestApp())
      .post('/api/observaciones')
      .set(authHeader(token))
      .send({
        titulo: '[TEST] Nueva obs familia',
        descripcion: 'Descripción de prueba con más de diez caracteres',
        categoria: 'COMUNICACION',
        fecha_evento: new Date().toISOString(),
        perfil_id: fixture.perfilId
      });

    expect(res.status).toBe(201);
    expect(res.body.observacion.privacidad).toBe('PUBLICA');
  });

  it('CP-09: rechaza payload inválido (título vacío)', async () => {
    const fixture = getTestFixture();
    const token = await loginAs(TEST_EMAILS.familia, TEST_PASSWORDS.familia);
    const res = await request(getTestApp())
      .post('/api/observaciones')
      .set(authHeader(token))
      .send({
        titulo: '',
        descripcion: 'Descripción válida de prueba',
        categoria: 'CONDUCTA',
        fecha_evento: new Date().toISOString(),
        perfil_id: fixture.perfilId
      });

    expect(res.status).toBe(400);
  });
});
