import { describe, it, expect, vi } from 'vitest';
import { authorizeRoles } from '../../src/middleware/authMiddleware';
import type { AuthRequest } from '../../src/middleware/authMiddleware';
import type { Response, NextFunction } from 'express';

function mockRes() {
  const res = {
    statusCode: 200,
    body: undefined as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    }
  };
  return res as Response & { statusCode: number; body: unknown };
}

describe('authorizeRoles', () => {
  it('permite rol autorizado', () => {
    const middleware = authorizeRoles('SUPERADMIN', 'ADMINISTRADOR');
    const req = { user: { rol: 'SUPERADMIN' } } as AuthRequest;
    const res = mockRes();
    const next = vi.fn() as NextFunction;

    middleware(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.statusCode).toBe(200);
  });

  it('rechaza rol no autorizado con 403', () => {
    const middleware = authorizeRoles('SUPERADMIN');
    const req = { user: { rol: 'FAMILIA' } } as AuthRequest;
    const res = mockRes();
    const next = vi.fn() as NextFunction;

    middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(403);
    expect(res.body).toEqual({ error: 'Acceso denegado: rol no autorizado' });
  });

  it('rechaza si no hay usuario', () => {
    const middleware = authorizeRoles('ADMINISTRADOR');
    const req = {} as AuthRequest;
    const res = mockRes();
    const next = vi.fn() as NextFunction;

    middleware(req, res, next);

    expect(res.statusCode).toBe(403);
  });
});
