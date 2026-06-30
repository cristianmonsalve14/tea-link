import './db';
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { integrationEnabled } from '../setup';
import { authHeader, getTestApp, loginAs } from '../helpers/http';
import { getTestFixture, TEST_EMAILS, TEST_PASSWORDS } from '../../prisma/seed-test';

const describeIntegration = integrationEnabled() ? describe : describe.skip;

function titulos(obs: { titulo: string }[]) {
  return obs.map(o => o.titulo);
}

describeIntegration('Privacidad bitácora (CP-10 a CP-13)', () => {
  it('CP-12: familia NO ve observación PRIVADA del médico', async () => {
    const fixture = getTestFixture();
    const token = await loginAs(TEST_EMAILS.familia, TEST_PASSWORDS.familia);
    const res = await request(getTestApp())
      .get(`/api/observaciones?perfil_id=${fixture.perfilId}`)
      .set(authHeader(token));

    expect(res.status).toBe(200);
    const ids = (res.body.observaciones as { id: number }[]).map(o => o.id);
    expect(ids).not.toContain(fixture.obsPrivadaId);
  });

  it('CP-13: profesional ve observación MULTINIVEL', async () => {
    const fixture = getTestFixture();
    const token = await loginAs(TEST_EMAILS.profesional, TEST_PASSWORDS.profesional);
    const res = await request(getTestApp())
      .get(`/api/observaciones?perfil_id=${fixture.perfilId}`)
      .set(authHeader(token));

    expect(res.status).toBe(200);
    const ids = (res.body.observaciones as { id: number }[]).map(o => o.id);
    expect(ids).toContain(fixture.obsMultinivelId);
    expect(ids).not.toContain(fixture.obsPrivadaId);
  });

  it('CP-10: educador ve observación pública de familia', async () => {
    const fixture = getTestFixture();
    const token = await loginAs(TEST_EMAILS.educador, TEST_PASSWORDS.educador);
    const res = await request(getTestApp())
      .get(`/api/observaciones?perfil_id=${fixture.perfilId}`)
      .set(authHeader(token));

    expect(res.status).toBe(200);
    const titles = titulos(res.body.observaciones);
    expect(titles.some(t => t.includes('pública'))).toBe(true);
  });

  it('CP-11: médico ve observaciones públicas del equipo', async () => {
    const fixture = getTestFixture();
    const token = await loginAs(TEST_EMAILS.medico, TEST_PASSWORDS.medico);
    const res = await request(getTestApp())
      .get(`/api/observaciones?perfil_id=${fixture.perfilId}`)
      .set(authHeader(token));

    expect(res.status).toBe(200);
    const ids = (res.body.observaciones as { id: number }[]).map(o => o.id);
    expect(ids).toContain(fixture.obsPublicaId);
    expect(ids).toContain(fixture.obsPrivadaId);
  });
});
