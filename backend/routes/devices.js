// backend/routes/devices.js
const express = require('express');
const supabase = require('../utils/supabaseClient');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const axios = require('axios'); // For external API integration

const router = express.Router();
const upload = multer({ dest: 'uploads/' }); // For file uploads

// Middleware to check authentication (assuming Supabase JWT)
const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return res.status(401).json({ error: 'Invalid token' });
  req.user = user;
  next();
};

// Apply auth to all routes
router.use(authenticate);

// GET /api/devices - Fetch all devices for the tenant
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('devices')
      .select('*')
      .eq('tenant_id', req.user.id); // Multi-tenant filter
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/devices/:id/control - Send control commands (e.g., C508 for video)
router.post('/:id/control', async (req, res) => {
  try {
    const { command, params } = req.body;
    // Validate device ownership
    const { data: device } = await supabase
      .from('devices')
      .select('*')
      .eq('id', req.params.id)
      .eq('tenant_id', req.user.id)
      .single();
    if (!device) return res.status(404).json({ error: 'Device not found' });

    // Simulate sending command to device (via proxy or socket)
    // In a real setup, push to a queue or direct socket
    console.log(`Sending ${command} to device ${device.serial}`, params);
    res.json({ message: 'Command sent', command, params });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/devices/:id/files - Fetch files for a device
router.get('/:id/files', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('files')
      .select('*')
      .eq('device_id', req.params.id);
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/devices/bulk-import - Bulk import devices from CSV
router.post('/bulk-import', upload.single('file'), async (req, res) => {
  try {
    const devices = [];
    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', (row) => {
        devices.push({
          serial: row.serial,
          location: { lat: parseFloat(row.lat || 0), lng: parseFloat(row.lng || 0) },
          status: row.status || 'offline',
          tenant_id: req.user.id
        });
      })
      .on('end', async () => {
        const { error } = await supabase.from('devices').insert(devices);
        fs.unlinkSync(req.file.path); // Clean up uploaded file
        if (error) throw error;
        res.json({ message: 'Devices imported successfully' });
      });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/devices/api-import - Import devices from external API
router.post('/api-import', async (req, res) => {
  try {
    // Replace with real external API endpoint
    const response = await axios.get('https://external-api.com/devices', {
      headers: { Authorization: `Bearer ${process.env.EXTERNAL_API_KEY}` }
    });
    const devices = response.data.map(d => ({
      serial: d.serial,
      location: d.location || { lat: 0, lng: 0 },
      status: d.status || 'offline',
      tenant_id: req.user.id
    }));
    const { error } = await supabase.from('devices').insert(devices);
    if (error) throw error;
    res.json({ message: 'Devices imported from API' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/devices - Manual add single device (alternative to bulk)
router.post('/', async (req, res) => {
  try {
    const { serial, location, status } = req.body;
    const { error } = await supabase.from('devices').insert({
      serial,
      location,
      status: status || 'offline',
      tenant_id: req.user.id
    });
    if (error) throw error;
    res.json({ message: 'Device added' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;