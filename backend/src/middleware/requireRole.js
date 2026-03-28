/**
 * Role-based access middleware.
 * Must be used AFTER authMiddleware (which sets req.user).
 *
 * Usage: requireRole('ADMIN', 'ANALYST')
 */
module.exports = function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Non authentifié' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Accès refusé. Rôle requis : ${roles.join(' ou ')}`
      });
    }
    next();
  };
};
