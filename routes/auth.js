const express = require('express');
const jwt = require('jsonwebtoken');
const { authenticateToken, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

const defaultNurse = {
  username: 'nurse.elena',
  fullName: 'Elena Rostova, RN',
  badgeId: 'RN-9402',
  role: 'Head Nurse',
  ward: 'Ward 4B - Cardiology'
};

router.post('/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Please provide both username and password.'
      });
    }

    const cleanUsername = username.trim().toLowerCase();

    if (cleanUsername === 'nurse.elena' && password === 'password123') {
      const token = jwt.sign(
        {
          username: defaultNurse.username,
          fullName: defaultNurse.fullName,
          badgeId: defaultNurse.badgeId,
          role: defaultNurse.role,
          ward: defaultNurse.ward
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      return res.status(200).json({
        success: true,
        message: 'Nurse authentication successful',
        token,
        nurse: defaultNurse
      });
    }

    return res.status(401).json({
      success: false,
      error: 'Authentication Error',
      message: 'Invalid nurse username or password. (Use nurse.elena / password123)'
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/auth/me', authenticateToken, (req, res) => {
  return res.json({
    success: true,
    nurse: req.nurse
  });
});

router.post('/auth/logout', (req, res) => {
  return res.json({
    success: true,
    message: 'Nurse logged out successfully'
  });
});

module.exports = router;
