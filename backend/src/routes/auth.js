const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');

const router = express.Router();

// Brute-force protection: max 10 tentatives / 15 min par IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false
});

// Utilisateurs hardcodés (en production : base de données + bcrypt hash stocké)
const USERS = [
  {
    id: 1,
    email: 'admin@fund.eu',
    // bcrypt hash de "Admin2024!"
    passwordHash: '$2a$12$Km9X1H.bYb7GjPHs3ATlk.QQI0AkRw7zSaaSXfp3JNNxlzRbT1Uge',
    name: 'Marie Dubois',
    role: 'admin',
    initials: 'MD'
  },
  {
    id: 2,
    email: 'analyst@fund.eu',
    // bcrypt hash de "Analyst2024!"
    passwordHash: '$2a$12$2q9e1XuIAJhL3Nz.mhvKLekF0s7A/VVKNx5V4rIMQvT0aJbN8GG4O',
    name: 'Thomas Laurent',
    role: 'analyst',
    initials: 'TL'
  }
];

router.post('/login', loginLimiter, async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email et mot de passe requis' });
  }

  // Normalise l'email pour éviter les attaques par casse
  const user = USERS.find(u => u.email === email.toLowerCase().trim());

  // Délai constant pour éviter le timing attack (compare même si user inexistant)
  const dummyHash = '$2a$12$aaaaaaaaaaaaaaaaaaaaaa.aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
  const isValid = await bcrypt.compare(password, user ? user.passwordHash : dummyHash);

  if (!user || !isValid) {
    return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role, initials: user.initials },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  );

  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role, initials: user.initials }
  });
});

router.post('/logout', (_req, res) => {
  // Côté serveur stateless : l'invalidation se fait en supprimant le token côté client
  res.json({ message: 'Déconnecté avec succès' });
});

router.get('/me', require('../middleware/auth'), (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
