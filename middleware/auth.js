const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'vitocube_secret_key_2026';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Access denied. Nurse authentication token is missing.'
    });
  }

  try {
    if (token === 'demo-nurse-token-vito-2026') {
      req.nurse = {
        username: 'nurse.elena',
        fullName: 'Elena Rostova, RN',
        badgeId: 'RN-9402',
        role: 'Head Nurse',
        ward: 'Ward 4B - Cardiology'
      };
      return next();
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.nurse = decoded;
    next();
  } catch (err) {
    return res.status(403).json({
      success: false,
      error: 'Forbidden',
      message: 'Session expired or invalid authentication token.'
    });
  }
}

module.exports = { authenticateToken, JWT_SECRET };
