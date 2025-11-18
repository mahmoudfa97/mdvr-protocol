// backend/proxy.js
const net = require('net');
const supabase = require('./utils/supabaseClient');
const { parseSignalingPacket, parseMediaPacket } = require('./utils/protocolParser');

const CMSV6_IP = '57.131.13.157'; // Your VPS IP for CMSV6
const CMSV6_SIGNALING_PORT = 9000; // Assuming CMSV6 uses same ports
const CMSV6_MEDIA_PORT = 6602;

// Signaling Proxy (Port 9000)
const signalingServer = net.createServer((socket) => {
  socket.on('data', async (data) => {
    const packet = data.toString();
    if (packet.startsWith('$$dc')) {
      const parsed = parseSignalingPacket(packet);
      if (parsed) {
        // Local processing (store in Supabase, etc.)
        if (parsed.serial) {
          const { data: device } = await supabase.from('devices').select('*').eq('serial', parsed.serial).single();
          if (!device) {
            await supabase.from('devices').insert({
              serial: parsed.serial,
              status: parsed.status || 'online',
              location: parsed.location,
              tenant_id: 'default' // Update for multi-tenancy
            });
          } else {
            await supabase.from('devices').update({
              status: 'online',
              location: parsed.location || device.location,
              last_heartbeat: new Date()
            }).eq('serial', parsed.serial);
          }
        }

        // Specific handling (e.g., locations, alarms)
        if (parsed.command === 'V114') {
          const { data: device } = await supabase.from('devices').select('id').eq('serial', parsed.serial).single();
          await supabase.from('locations').insert({
            device_id: device.id,
            latitude: parsed.location.lat,
            longitude: parsed.location.lng,
            speed: parsed.speed
          });
        } else if (parsed.command.startsWith('V2')) {
          const { data: device } = await supabase.from('devices').select('id').eq('serial', parsed.serial).single();
          await supabase.from('alarms').insert({
            device_id: device.id,
            type: parsed.alarmType,
            message: parsed.message,
            snapshot_url: parsed.snapshot,
            video_url: parsed.video
          });
        } else if (parsed.command === 'V232') {
          const { data: device } = await supabase.from('devices').select('id').eq('serial', parsed.serial).single();
          await supabase.from('files').insert({
            device_id: device.id,
            type: parsed.fileType,
            path: parsed.filePath,
            size: parsed.fileSize,
            url: 'supabase_storage_url'
          });
        }

        // Respond to MDVR device (SaaS handles this)
        const response = `$$dc...,C100,${parsed.serial},OK,#`;
        socket.write(response);

        // Forward to CMSV6 (after local handling)
        const cmsv6Socket = net.createConnection({ host: CMSV6_IP, port: CMSV6_SIGNALING_PORT }, () => {
          cmsv6Socket.write(data); // Send original packet
          cmsv6Socket.end(); // Close after sending
        });
        cmsv6Socket.on('error', (err) => console.error('Forwarding error to CMSV6:', err));
      } else {
        socket.write('$$dc...,C999,Invalid Command,#');
      }
    }
  });
});
signalingServer.listen(9000, () => console.log('Signaling proxy on port 9000, forwarding to CMSV6'));

// Media Proxy (Port 6602)
const mediaServer = net.createServer((socket) => {
  socket.on('data', async (data) => {
    const packet = data.toString();
    if (packet.startsWith('@@$$dc')) {
      const parsed = parseMediaPacket(packet);
      if (parsed) {
        // Local handling (e.g., store video)
        if (parsed.command === 'V102') {
          console.log('Media registered for', parsed.serial);
        } else if (parsed.command === 'V103') {
          const { data: uploadData } = await supabase.storage.from('mdvr-media').upload(`files/${parsed.serial}/${Date.now()}`, Buffer.from(parsed.fileData));
          await supabase.from('files').update({ url: uploadData.path }).eq('device_id', /* get from serial */);
        } else if (parsed.command.startsWith('0x60')) {
          // Process video frames locally
        }
        socket.write('@@$$dc...,C100,OK,#');

        // Forward to CMSV6
        const cmsv6Socket = net.createConnection({ host: CMSV6_IP, port: CMSV6_MEDIA_PORT }, () => {
          cmsv6Socket.write(data);
          cmsv6Socket.end();
        });
        cmsv6Socket.on('error', (err) => console.error('Media forwarding error to CMSV6:', err));
      }
    }
  });
});
mediaServer.listen(6602, () => console.log('Media proxy on port 6602, forwarding to CMSV6'));