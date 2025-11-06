import { Router } from 'express';

const router = Router();

// AuthController: ejemplo mínimo para señal de endpoint backend
router.post('/auth/login', async (req, res) => {
  return res.status(200).json({ ok: true });
});

export default router;


