const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Nurse = require('../models/Nurse');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// In-memory hamshiralar do'koni (MongoDB ishlamagan holat uchun)
const memoryNurses = {
  'nurse.elena': {
    username: 'nurse.elena',
    fullName: 'Elena Rostova, RN',
    badgeId: 'RN-9402',
    role: 'Head Nurse',
    ward: 'Ward 4B - Cardiology',
    phone: ''
  }
};

// GET /api/nurses — Barcha hamshiralar ro'yxati
router.get('/nurses', async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const nurses = await Nurse.find({}, { passwordHash: 0 }).lean();
      return res.json({
        success: true,
        count: nurses.length,
        data: nurses,
        nurses
      });
    } else {
      const list = Object.values(memoryNurses);
      return res.json({
        success: true,
        count: list.length,
        data: list,
        nurses: list
      });
    }
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/nurses/:username — Bitta hamshira ma'lumotlari
router.get('/nurses/:username', async (req, res) => {
  const { username } = req.params;
  const cleanUsername = String(username).trim().toLowerCase();

  try {
    if (mongoose.connection.readyState === 1) {
      const nurse = await Nurse.findOne({ username: cleanUsername }, { passwordHash: 0 }).lean();
      if (!nurse) {
        // Demo hamshira
        if (cleanUsername === 'nurse.elena') {
          return res.json({
            success: true,
            data: memoryNurses['nurse.elena'],
            nurse: memoryNurses['nurse.elena']
          });
        }
        return res.status(404).json({
          success: false,
          error: 'Not Found',
          message: `"${cleanUsername}" username bilan hamshira topilmadi.`
        });
      }
      return res.json({ success: true, data: nurse, nurse });
    } else {
      const nurse = memoryNurses[cleanUsername];
      if (!nurse) {
        return res.status(404).json({
          success: false,
          error: 'Not Found',
          message: `"${cleanUsername}" username bilan hamshira topilmadi.`
        });
      }
      return res.json({ success: true, data: nurse, nurse });
    }
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/nurses/:username — Hamshira ma'lumotlarini yangilash (ism, telefon, bo'lim, lavozim)
router.put('/nurses/:username', async (req, res) => {
  const { username } = req.params;
  const cleanUsername = String(username).trim().toLowerCase();
  const { fullName, badgeId, role, ward, phone, password } = req.body;

  const updateFields = {};
  if (fullName !== undefined) updateFields.fullName = String(fullName).trim();
  if (badgeId !== undefined) updateFields.badgeId = String(badgeId).trim();
  if (role !== undefined) updateFields.role = String(role).trim();
  if (ward !== undefined) updateFields.ward = String(ward).trim();
  if (phone !== undefined) updateFields.phone = String(phone).trim();

  // Yangi parol o'rnatish (ixtiyoriy)
  if (password && String(password).trim().length >= 6) {
    const salt = await bcrypt.genSalt(10);
    updateFields.passwordHash = await bcrypt.hash(password.trim(), salt);
  }

  if (Object.keys(updateFields).length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: 'Kamida bitta maydon (fullName, phone, role, ward, badgeId) talab qilinadi.'
    });
  }

  try {
    if (mongoose.connection.readyState === 1) {
      const updated = await Nurse.findOneAndUpdate(
        { username: cleanUsername },
        { $set: updateFields },
        { new: true }
      ).lean();

      if (!updated) {
        return res.status(404).json({
          success: false,
          error: 'Not Found',
          message: `"${cleanUsername}" username bilan hamshira topilmadi.`
        });
      }

      const { passwordHash, ...safeNurse } = updated;
      return res.json({
        success: true,
        message: 'Hamshira ma\'lumotlari muvaffaqiyatli yangilandi',
        data: safeNurse,
        nurse: safeNurse
      });
    } else {
      if (!memoryNurses[cleanUsername]) {
        return res.status(404).json({
          success: false,
          error: 'Not Found',
          message: `"${cleanUsername}" username bilan hamshira topilmadi.`
        });
      }
      const { passwordHash: _ph, ...restFields } = updateFields;
      memoryNurses[cleanUsername] = {
        ...memoryNurses[cleanUsername],
        ...restFields,
        updatedAt: new Date()
      };
      return res.json({
        success: true,
        message: 'Hamshira ma\'lumotlari yangilandi (in-memory)',
        data: memoryNurses[cleanUsername],
        nurse: memoryNurses[cleanUsername]
      });
    }
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
