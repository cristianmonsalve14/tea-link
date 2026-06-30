import './db';
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { integrationEnabled } from '../setup';
import { authHeader, getTestApp, loginAs } from '../helpers/http';
import { getTestFixture, TEST_EMAILS, TEST_PASSWORDS } from '../../prisma/seed-test';

const describeIntegration = integrationEnabled() ? describe : describe.skip;

describeIntegration('Perfiles API (CP-06, CP-07)', () => {
  it('CP-06: familia ve perfil vinculado', async () => {
    const fixture = getTestFixture();
    const token = await loginAs(TEST_EMAILS.familia, TEST_PASSWORDS.familia);
    const res = await request(getTestApp()).get('/api/perfiles').set(authHeader(token));

    expect(res.status).toBe(200);
    const ids = (res.body.perfiles as { id: number }[]).map(p => p.id);
    expect(ids).toContain(fixture.perfilId);
  });

  it('CP-07: admin de colegio crea perfil en su institución', async () => {
    const token = await loginAs(TEST_EMAILS.admin, TEST_PASSWORDS.admin);
    const res = await request(getTestApp())
      .post('/api/perfiles')
      .set(authHeader(token))
      .send({
        nombre: '[TEST] Perfil nuevo admin',
        rut: '55.555.555-5',
        edad: 8,
        fecha_nacimiento: '2018-03-15',
        nivel_educacional: 'BASICO_2',
        diagnostico_clinico: 'TEA',
        tutor_email: 'otro.tutor@test-auto.tealink.cl',
        tutor_nombre_completo: 'Otro Tutor Apellido'
      });

    expect(res.status).toBe(201);
    expect(res.body.perfil.nombre).toBe('[TEST] Perfil nuevo admin');
  });
});
