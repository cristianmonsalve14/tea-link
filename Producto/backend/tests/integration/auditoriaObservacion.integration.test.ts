import './db';
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { integrationEnabled } from '../setup';
import { authHeader, getTestApp, loginAs } from '../helpers/http';
import { getTestFixture, TEST_EMAILS, TEST_PASSWORDS } from '../../prisma/seed-test';
import { ACCION_AUDITORIA_OBS } from '../../src/utils/auditoriaObservacion';

const describeIntegration = integrationEnabled() ? describe : describe.skip;
const prisma = new PrismaClient();

describeIntegration('Auditoría observaciones sensibles', () => {
  it('registra consulta de observación PRIVADA por médico', async () => {
    const fixture = getTestFixture();
    const token = await loginAs(TEST_EMAILS.medico, TEST_PASSWORDS.medico);

    const antes = await prisma.auditoriaObservacion.count({
      where: {
        observacion_id: fixture.obsPrivadaId,
        accion: ACCION_AUDITORIA_OBS.CONSULTAR
      }
    });

    const res = await request(getTestApp())
      .get(`/api/observaciones/${fixture.obsPrivadaId}`)
      .set(authHeader(token));

    expect(res.status).toBe(200);
    expect(res.body.observacion.privacidad).toBe('PRIVADA');

    const despues = await prisma.auditoriaObservacion.count({
      where: {
        observacion_id: fixture.obsPrivadaId,
        accion: ACCION_AUDITORIA_OBS.CONSULTAR
      }
    });
    expect(despues).toBe(antes + 1);
  });

  it('registra CONSULTAR_LISTA cuando profesional ve MULTINIVEL', async () => {
    const fixture = getTestFixture();
    const token = await loginAs(TEST_EMAILS.profesional, TEST_PASSWORDS.profesional);

    const res = await request(getTestApp())
      .get(`/api/observaciones?perfil_id=${fixture.perfilId}`)
      .set(authHeader(token));

    expect(res.status).toBe(200);

    const log = await prisma.auditoriaObservacion.findFirst({
      where: {
        accion: ACCION_AUDITORIA_OBS.CONSULTAR_LISTA,
        perfil_id: fixture.perfilId
      },
      orderBy: { created_at: 'desc' }
    });
    expect(log).toBeTruthy();
    expect(log?.detalles).toMatch(/MULTINIVEL/i);
  });

  it('NO registra auditoría al listar solo observaciones públicas (familia)', async () => {
    const fixture = getTestFixture();
    const token = await loginAs(TEST_EMAILS.familia, TEST_PASSWORDS.familia);

    const antes = await prisma.auditoriaObservacion.count();

    const res = await request(getTestApp())
      .get(`/api/observaciones?perfil_id=${fixture.perfilId}`)
      .set(authHeader(token));

    expect(res.status).toBe(200);

    const despues = await prisma.auditoriaObservacion.count();
    expect(despues).toBe(antes);
  });

  it('superadmin puede listar auditoría de observaciones', async () => {
    const token = await loginAs(TEST_EMAILS.superadmin, TEST_PASSWORDS.superadmin);
    const res = await request(getTestApp())
      .get('/api/auth/superadmin/auditoria-observaciones')
      .set(authHeader(token));

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.acciones)).toBe(true);
  });
});
