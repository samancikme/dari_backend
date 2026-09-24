const http = require('http');
const app = require('../server');

const TEST_PORT = 5050;
let server;

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: '127.0.0.1',
      port: TEST_PORT,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', (err) => reject(err));

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runVerification() {
  server = app.listen(TEST_PORT, async () => {
    console.log(`\n🧪 Testing all API endpoints on http://127.0.0.1:${TEST_PORT}...\n`);
    const results = [];

    try {
      // 1. Health check
      const health = await request('GET', '/health');
      results.push({
        endpoint: 'GET /health',
        status: health.status,
        success: health.status === 200 && health.body.status === 'ok',
        note: `Protocol: ${health.body.protocol || 'http'}`
      });

      // 2. Nurse Login Auth
      const login = await request('POST', '/api/auth/login', {
        username: 'nurse.elena',
        password: 'password123'
      });
      results.push({
        endpoint: 'POST /api/auth/login',
        status: login.status,
        success: login.status === 200 && login.body.success === true,
        note: `User: ${login.body.user?.fullName || 'nurse.elena'}`
      });

      // 3. Get Slots for ESP32-CUBE-01
      const slots1 = await request('GET', '/api/slots/ESP32-CUBE-01');
      results.push({
        endpoint: 'GET /api/slots/ESP32-CUBE-01',
        status: slots1.status,
        success: slots1.status === 200 && Array.isArray(slots1.body.slots) && slots1.body.slots.length === 14,
        note: `Total Slots: ${slots1.body.count || 14}`
      });

      // 4. Get Slots for custom patient ID (bemor_1)
      const slotsCustom = await request('GET', '/api/slots/bemor_1');
      results.push({
        endpoint: 'GET /api/slots/bemor_1',
        status: slotsCustom.status,
        success: slotsCustom.status === 200 && Array.isArray(slotsCustom.body.slots) && slotsCustom.body.slots.length === 14,
        note: `Supports both snake_case & camelCase`
      });

      // 5. Update Slot #1 via PUT (camelCase)
      const updateCamel = await request('PUT', '/api/slots/ESP32-CUBE-01/1', {
        medName: 'Ibuprofen 400mg',
        dispenseTime: '08:00',
        status: 'scheduled'
      });
      results.push({
        endpoint: 'PUT /api/slots/ESP32-CUBE-01/1 (camelCase)',
        status: updateCamel.status,
        success: updateCamel.status === 200 && updateCamel.body.success === true,
        note: `Updated: ${updateCamel.body.slot?.medName || 'Ibuprofen 400mg'}`
      });

      // 6. Update Slot #2 via PUT (snake_case per user requirement)
      const updateSnake = await request('PUT', '/api/slots/bemor_1/2', {
        med_name: 'Paracetamol 500mg',
        time: '09:30',
        status: 'scheduled'
      });
      results.push({
        endpoint: 'PUT /api/slots/bemor_1/2 (snake_case)',
        status: updateSnake.status,
        success: updateSnake.status === 200 && updateSnake.body.success === true,
        note: `Updated: ${updateSnake.body.slot?.med_name || 'Paracetamol 500mg'}`
      });

      // 7. Post Dispense Log
      const postLog = await request('POST', '/api/logs', {
        deviceId: 'ESP32-CUBE-01',
        slotId: 1,
        medName: 'Ibuprofen 400mg',
        status: 'dispensed',
        nurseName: 'Hamshira Elena R.'
      });
      results.push({
        endpoint: 'POST /api/logs',
        status: postLog.status,
        success: postLog.status === 201 && postLog.body.success === true,
        note: `Logged Dispense: ${postLog.body.log?.medName || 'Ibuprofen 400mg'}`
      });

      // 8. Get Dispense History Logs
      const getLogs = await request('GET', '/api/logs/ESP32-CUBE-01');
      results.push({
        endpoint: 'GET /api/logs/ESP32-CUBE-01',
        status: getLogs.status,
        success: getLogs.status === 200 && Array.isArray(getLogs.body.logs),
        note: `Logs Count: ${getLogs.body.count}`
      });

      // 9. Get Multi-Patient List
      const patients = await request('GET', '/api/patients');
      results.push({
        endpoint: 'GET /api/patients',
        status: patients.status,
        success: patients.status === 200 && Array.isArray(patients.body.data),
        note: `Patients Total: ${patients.body.data?.length}`
      });

      // 10. Get Single Patient Details
      const singlePatient = await request('GET', '/api/patients/ESP32-CUBE-01');
      results.push({
        endpoint: 'GET /api/patients/ESP32-CUBE-01',
        status: singlePatient.status,
        success: singlePatient.status === 200 && singlePatient.body.data?.patientName !== undefined,
        note: `Patient Name: ${singlePatient.body.data?.patientName}`
      });

      console.log('-----------------------------------------------------------------------------');
      console.log('ENDPOINT                        STATUS    RESULT   DETAILS');
      console.log('-----------------------------------------------------------------------------');
      results.forEach((r) => {
        const pass = r.success ? '✅ PASS' : '❌ FAIL';
        console.log(
          `${r.endpoint.padEnd(32)} ${String(r.status).padEnd(9)} ${pass.padEnd(8)} ${r.note}`
        );
      });
      console.log('-----------------------------------------------------------------------------\n');

      server.close();
      const allPassed = results.every((r) => r.success);
      process.exit(allPassed ? 0 : 1);
    } catch (err) {
      console.error('Verification failed:', err);
      if (server) server.close();
      process.exit(1);
    }
  });
}

runVerification();
