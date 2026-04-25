import { Router } from 'express';
import { register, login } from '../controllers/authController';
import { authenticateToken, AuthRequest } from '../middleware/authMiddleware';

const router = Router();


// Registro de usuario
router.post('/register', register);

// Login de usuario
router.post('/login', login);

// Ruta protegida de ejemplo
router.get('/protegida', authenticateToken, (req: AuthRequest, res) => {
	res.json({ message: 'Acceso autorizado a ruta protegida', user: req.user });
});

export default router;
