const express = require('express');
const mongoose = require('mongoose');
const Slot = require('../models/Slot');
const Log = require('../models/Log');
const Patient = require('../models/Patient');

const router = express.Router();

const memorySlots = {};
const memoryLogs = {};
const memoryPatients = {};

function getInitial14Slots(deviceId) {
  const slots = [];
  let defaultMeds = [];

  if (deviceId === 'ESP32-CUBE-02') {
    defaultMeds = [
      { slotId: 1, medName: 'Enalapril 10mg', time: '09:00', status: 'scheduled' },
      { slotId: 2, medName: 'Amlodipine 5mg', time: '10:00', status: 'dispensed' },
      { slotId: 3, medName: 'Spironolactone 25mg', time: '14:00', status: 'scheduled' },
      { slotId: 4, medName: 'Levothyroxine 50mcg', time: '07:00', status: 'dispensed' },
      { slotId: 5, medName: 'Calcium + D3', time: '18:00', status: 'scheduled' }
    ];
  } else if (deviceId === 'ESP32-CUBE-03') {
    defaultMeds = [
      { slotId: 1, medName: 'Amoxicillin 500mg', time: '08:00', status: 'dispensed' },
      { slotId: 2, medName: 'Ibuprofen 400mg', time: '12:00', status: 'scheduled' },
      { slotId: 3, medName: 'Amoxicillin 500mg', time: '16:00', status: 'scheduled' },
      { slotId: 4, medName: 'Cetirizine 10mg', time: '21:00', status: 'scheduled' }
    ];
  } else {
    // Default ESP32-CUBE-01
    defaultMeds = [
      { slotId: 1, medName: 'Aspirin 100mg', time: '08:00', status: 'scheduled' },
      { slotId: 2, medName: 'Metformin 500mg', time: '08:30', status: 'scheduled' },
      { slotId: 3, medName: 'Lisopril 10mg', time: '12:00', status: 'dispensed' },
      { slotId: 4, medName: 'Vitamin D3', time: '13:00', status: 'scheduled' },
      { slotId: 5, medName: 'Atorvastatin 20mg', time: '20:00', status: 'scheduled' },
      { slotId: 6, medName: 'Omeprazole 20mg', time: '21:00', status: 'scheduled' }
    ];
  }

  for (let i = 1; i <= 14; i++) {
    const preset = defaultMeds.find(m => m.slotId === i);
    const medNameVal = preset ? preset.medName : '';
    const timeVal = preset ? preset.time : '';
    const statusVal = preset ? preset.status : 'empty';

    slots.push({
      deviceId,
      device_id: deviceId,
      slotId: i,
      slot_number: i,
      medName: medNameVal,
      med_name: medNameVal,
      dispenseTime: timeVal,
      time: timeVal,
      dosage: preset ? '1 Tabletka' : '',
      status: statusVal,
      lastDispensedAt: preset && preset.status === 'dispensed' ? new Date(Date.now() - 3600000) : null
    });
  }
  return slots;
}

function getInitialLogs(deviceId) {
  if (deviceId === 'ESP32-CUBE-02') {
    return [
      {
        _id: `log_${deviceId}_1`,
        deviceId,
        slotId: 2,
        medName: 'Amlodipine 5mg',
        status: 'dispensed',
        nurseName: 'Hamshira Elena R.',
        timestamp: new Date(Date.now() - 5400000)
      },
      {
        _id: `log_${deviceId}_2`,
        deviceId,
        slotId: 4,
        medName: 'Levothyroxine 50mcg',
        status: 'dispensed',
        nurseName: 'Hamshira Elena R.',
        timestamp: new Date(Date.now() - 10800000)
      }
    ];
  } else if (deviceId === 'ESP32-CUBE-03') {
    return [
      {
        _id: `log_${deviceId}_1`,
        deviceId,
        slotId: 1,
        medName: 'Amoxicillin 500mg',
        status: 'dispensed',
        nurseName: 'Hamshira Elena R.',
        timestamp: new Date(Date.now() - 7200000)
      }
    ];
  }

  return [
    {
      _id: `log_init_1`,
      deviceId,
      slotId: 3,
      medName: 'Lisopril 10mg',
      status: 'dispensed',
      nurseName: 'Hamshira Elena R.',
      timestamp: new Date(Date.now() - 3600000)
    }
  ];
}

router.get('/slots/:deviceId', async (req, res) => {
  const { deviceId } = req.params;

  try {
    if (mongoose.connection.readyState === 1) {
      let slots = await Slot.find({ $or: [{ deviceId }, { device_id: deviceId }] }).sort({ slotId: 1, slot_number: 1 }).lean();

      if (slots.length < 14) {
        const initial = getInitial14Slots(deviceId);
        await Slot.deleteMany({ $or: [{ deviceId }, { device_id: deviceId }] });
        slots = await Slot.insertMany(initial);
      }

      const normalizedSlots = slots.map(s => ({
        ...s,
        deviceId: s.deviceId || s.device_id,
        device_id: s.device_id || s.deviceId,
        slotId: s.slotId || s.slot_number,
        slot_number: s.slot_number || s.slotId,
        medName: s.medName || s.med_name || '',
        med_name: s.med_name || s.medName || '',
        dispenseTime: s.dispenseTime || s.time || '',
        time: s.time || s.dispenseTime || ''
      }));

      return res.json({ success: true, count: normalizedSlots.length, deviceId, slots: normalizedSlots, data: normalizedSlots });
    } else {
      if (!memorySlots[deviceId]) {
        memorySlots[deviceId] = getInitial14Slots(deviceId);
      }
      return res.json({
        success: true,
        count: memorySlots[deviceId].length,
        deviceId,
        slots: memorySlots[deviceId],
        data: memorySlots[deviceId]
      });
    }
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/slots/:deviceId/:slotId', async (req, res) => {
  const { deviceId, slotId } = req.params;
  const numSlotId = parseInt(slotId, 10);
  const { medName, med_name, dispenseTime, time, status, dosage } = req.body;

  const finalMedName = (med_name !== undefined ? med_name : medName);
  const finalTime = (time !== undefined ? time : dispenseTime);

  if (isNaN(numSlotId) || numSlotId < 1 || numSlotId > 14) {
    return res.status(400).json({ success: false, error: 'slotId must be a number between 1 and 14' });
  }

  try {
    const updateFields = {};
    if (finalMedName !== undefined) {
      updateFields.medName = String(finalMedName).trim();
      updateFields.med_name = String(finalMedName).trim();
    }
    if (finalTime !== undefined) {
      updateFields.dispenseTime = String(finalTime).trim();
      updateFields.time = String(finalTime).trim();
    }
    if (dosage !== undefined) updateFields.dosage = String(dosage).trim();
    if (status !== undefined) updateFields.status = status;

    if (finalMedName && (!status || status === 'empty')) {
      updateFields.status = 'scheduled';
    } else if (!finalMedName && (!status || status !== 'empty')) {
      updateFields.status = 'empty';
    }

    let updatedSlot = null;

    if (mongoose.connection.readyState === 1) {
      updatedSlot = await Slot.findOneAndUpdate(
        { $or: [{ deviceId, slotId: numSlotId }, { device_id: deviceId, slot_number: numSlotId }] },
        { $set: { ...updateFields, deviceId, device_id: deviceId, slotId: numSlotId, slot_number: numSlotId } },
        { new: true, upsert: true }
      );
    } else {
      if (!memorySlots[deviceId]) {
        memorySlots[deviceId] = getInitial14Slots(deviceId);
      }
      const slotIndex = memorySlots[deviceId].findIndex(s => (s.slotId === numSlotId || s.slot_number === numSlotId));
      if (slotIndex !== -1) {
        memorySlots[deviceId][slotIndex] = {
          ...memorySlots[deviceId][slotIndex],
          ...updateFields,
          updatedAt: new Date()
        };
        updatedSlot = memorySlots[deviceId][slotIndex];
      }
    }

    return res.json({
      success: true,
      message: `Slot #${numSlotId} updated successfully`,
      data: updatedSlot,
      slot: updatedSlot
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/logs', async (req, res) => {
  const { deviceId, device_id, slotId, slot_number, medName, med_name, status = 'dispensed', nurseName } = req.body;
  const targetDeviceId = deviceId || device_id;
  const numSlotId = parseInt(slotId || slot_number, 10);
  const finalMedName = medName || med_name;

  if (!targetDeviceId || isNaN(numSlotId)) {
    return res.status(400).json({ success: false, error: 'deviceId and valid slotId required' });
  }

  const logEntry = {
    _id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    deviceId: targetDeviceId,
    device_id: targetDeviceId,
    slotId: numSlotId,
    slot_number: numSlotId,
    medName: finalMedName || `Slot #${numSlotId} Medication`,
    med_name: finalMedName || `Slot #${numSlotId} Medication`,
    status: 'dispensed',
    nurseName: nurseName || 'Hamshira Elena R.',
    timestamp: new Date()
  };

  try {
    if (mongoose.connection.readyState === 1) {
      const newLog = new Log(logEntry);
      await newLog.save();

      await Slot.findOneAndUpdate(
        { $or: [{ deviceId: targetDeviceId, slotId: numSlotId }, { device_id: targetDeviceId, slot_number: numSlotId }] },
        { $set: { status: 'dispensed', lastDispensedAt: new Date() } }
      );
    } else {
      if (!memoryLogs[targetDeviceId]) {
        memoryLogs[targetDeviceId] = getInitialLogs(targetDeviceId);
      }
      memoryLogs[targetDeviceId].unshift(logEntry);

      if (!memorySlots[targetDeviceId]) {
        memorySlots[targetDeviceId] = getInitial14Slots(targetDeviceId);
      }
      const slotIndex = memorySlots[targetDeviceId].findIndex(s => (s.slotId === numSlotId || s.slot_number === numSlotId));
      if (slotIndex !== -1) {
        memorySlots[targetDeviceId][slotIndex].status = 'dispensed';
        memorySlots[targetDeviceId][slotIndex].lastDispensedAt = new Date();
      }
    }

    return res.status(201).json({
      success: true,
      message: 'Dispense log created successfully',
      data: logEntry,
      log: logEntry
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/logs/:deviceId', async (req, res) => {
  const { deviceId } = req.params;

  try {
    let logs = [];
    if (mongoose.connection.readyState === 1) {
      logs = await Log.find({ $or: [{ deviceId }, { device_id: deviceId }] }).sort({ timestamp: -1 }).limit(50).lean();
    } else {
      if (!memoryLogs[deviceId]) {
        memoryLogs[deviceId] = getInitialLogs(deviceId);
      }
      logs = memoryLogs[deviceId];
    }

    return res.json({ success: true, count: logs.length, deviceId, logs, data: logs });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/patients', async (req, res) => {
  const patientsList = [
    {
      deviceId: 'ESP32-CUBE-01',
      device_id: 'ESP32-CUBE-01',
      patientName: 'Eshmuradov Anvar Olimovich',
      age: 64,
      room: '304-palata',
      condition: 'Kardiologiya bo\'limi'
    },
    {
      deviceId: 'ESP32-CUBE-02',
      device_id: 'ESP32-CUBE-02',
      patientName: 'Karimova Nodira Saidovna',
      age: 58,
      room: '305-palata',
      condition: 'Nevrologiya bo\'limi'
    },
    {
      deviceId: 'ESP32-CUBE-03',
      device_id: 'ESP32-CUBE-03',
      patientName: 'Qodirov Sanjar Baxtiyorovich',
      age: 42,
      room: '306-palata',
      condition: 'Xirurgiya bo\'limi'
    }
  ];

  return res.json({ success: true, data: patientsList, patients: patientsList });
});

router.get('/patients/:deviceId', async (req, res) => {
  const { deviceId } = req.params;
  const isSamandar = deviceId === 'samandar';

  const defaultPatient = {
    deviceId,
    device_id: deviceId,
    patientName: isSamandar ? 'Samandar (VITO CUBE IoT)' : 'Eshmuradov Anvar Olimovich',
    age: isSamandar ? 22 : 64,
    room: isSamandar ? 'qmustartupclub' : '304-palata',
    condition: isSamandar ? 'QMU Startup Club Bo\'limi' : 'Kardiologiya bo\'limi',
    notes: 'Qurilma miyasi (ESP32 IoT) faol holatda.'
  };

  try {
    if (mongoose.connection.readyState === 1) {
      let patient = await Patient.findOne({ $or: [{ deviceId }, { device_id: deviceId }] }).lean();
      if (!patient) {
        patient = await Patient.create(defaultPatient);
      }
      return res.json({ success: true, data: patient, patient });
    } else {
      if (!memoryPatients[deviceId]) {
        memoryPatients[deviceId] = defaultPatient;
      }
      return res.json({ success: true, data: memoryPatients[deviceId], patient: memoryPatients[deviceId] });
    }
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
