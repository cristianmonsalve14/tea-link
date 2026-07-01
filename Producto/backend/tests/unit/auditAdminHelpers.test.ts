import { describe, expect, it } from 'vitest';

import {
  AUDIT_IP_MAX_LEN,
  sanitizeAuditIp,
  truncateAuditDetalles
} from '../../src/utils/auditAdminHelpers';

describe('auditAdminHelpers', () => {
  it('sanitizeAuditIp devuelve null si está vacío', () => {
    expect(sanitizeAuditIp('')).toBeNull();
    expect(sanitizeAuditIp(undefined)).toBeNull();
  });

  it('sanitizeAuditIp conserva IP corta', () => {
    expect(sanitizeAuditIp('190.12.34.56')).toBe('190.12.34.56');
  });

  it('sanitizeAuditIp toma el primer hop de X-Forwarded-For', () => {
    const chain = '203.0.113.10, 10.0.0.1, 10.0.0.2';
    expect(sanitizeAuditIp(chain)).toBe('203.0.113.10');
  });

  it('sanitizeAuditIp recorta si supera el máximo', () => {
    const long = 'x'.repeat(AUDIT_IP_MAX_LEN + 10);
    expect(sanitizeAuditIp(long)?.length).toBe(AUDIT_IP_MAX_LEN);
  });

  it('truncateAuditDetalles recorta a 500 caracteres', () => {
    const long = 'a'.repeat(600);
    const out = truncateAuditDetalles(long);
    expect(out.length).toBe(500);
    expect(out.endsWith('...')).toBe(true);
  });
});
