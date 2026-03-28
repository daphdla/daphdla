const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const prisma = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Trop de tentatives. Réessayez dans 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/login', loginLimiter, async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email et mot de passe requis' });
  }

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
    include: { lp: true },
  }).catch(() => null);

  // Constant-time compare to prevent timing attack
  const dummyHash = '$2a$12$aaaaaaaaaaaaaaaaaaaaaa.aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
  const isValid = await bcrypt.compare(password, user ? user.passwordHash : dummyHash);

  if (!user || !isValid) {
    return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
  }

  const payload = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    initials: user.initials,
    lpId: user.lpId ?? null,
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  });

  res.json({ token, user: payload });
});

router.post('/logout', (_req, res) => {
  res.json({ message: 'Déconnecté avec succès' });
});

router.get('/me', authMiddleware, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { id: true, email: true, name: true, role: true, initials: true, lpId: true },
  });
  if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });
  res.json({ user });
});

module.exports = router;
