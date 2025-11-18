// Comprehensive parser for MDVR protocol (signaling and media)
function parseSignalingPacket(packet) {
  const parts = packet.split(',');
  const command = parts[2];
  const data = { command, timestamp: new Date() };
  switch (command) {
    case 'V101': // Device Registration
      data.serial = parts[3];
      data.location = { lat: parseFloat(parts[5]), lng: parseFloat(parts[6]) }; // GPS
      data.status = parts[7]; // Online/offline
      data.protocolVersion = parts[18]; // e.g., V1.0.0.1
      data.numberOfPeople = parseInt(parts[8]);
      data.componentStatus = parts[17]; // Binary status (e.g., engine, doors)
      // Add all supplementary fields (e.g., IMEI, SIM card, firmware)
      break;
    case 'V109': // Heartbeat
      data.serial = parts[3];
      data.battery = parseFloat(parts[4]);
      // Supplementary: Include uptime, signal strength
      break;
    case 'V114': // Location Report
      data.serial = parts[3];
      data.location = { lat: parseFloat(parts[5]), lng: parseFloat(parts[6]) };
      data.speed = parseFloat(parts[7]);
      data.direction = parseFloat(parts[8]);
      data.altitude = parseFloat(parts[9]);
      data.satelliteCount = parseInt(parts[10]);
      // Supplementary: Fuel level, RPM, temperature from extended fields
      data.fuel = parseFloat(parts[11] || 0);
      data.rpm = parseInt(parts[12] || 0);
      break;
    case 'V201': // Custom Alarm
    case 'V251': // Motion Alarm
      data.serial = parts[3];
      data.alarmType = command === 'V201' ? 'custom' : 'motion';
      data.message = parts[4];
      data.snapshot = parts[5]; // URL or data
      data.video = parts[6]; // Supplementary: Video attachment
      break;
    case 'V232': // File Upload Report
      data.serial = parts[3];
      data.fileType = parts[4]; // 'picture' or 'video'
      data.filePath = parts[5];
      data.fileSize = parseInt(parts[6]);
      data.startTime = parts[7];
      break;
    case 'C508': // Video Control (Start/Stop)
      data.serial = parts[3];
      data.action = parts[4]; // 'start' or 'stop'
      data.channel = parseInt(parts[5]); // Main/sub channel
      data.streamType = parts[6]; // Real-time or playback
      break;
    case 'V141': // File List Query
      data.serial = parts[3];
      data.queryType = parts[4]; // e.g., 'all', 'date_range'
      break;
    case 'C702': // File Download Request
      data.serial = parts[3];
      data.fileId = parts[4];
      break;
    // Add any supplementary commands (e.g., V301 for authentication)
    default:
      data.error = 'Unknown command';
      return null;
  }
  return data;
}

function parseMediaPacket(packet) {
  // For @@$$dc media packets
  const parts = packet.split(',');
  const command = parts[2];
  const data = { command };
  switch (command) {
    case 'V102': // Media Registration
      data.serial = parts[3];
      data.mediaType = parts[4]; // 'video', 'audio'
      break;
    case 'V103': // File Download
      data.serial = parts[3];
      data.fileData = parts[4]; // Binary data (handle as buffer)
      break;
    case '0x6011': // I-Frame (Video)
    case '0x6012': // P-Frame (Video)
      data.frameType = command;
      data.serial = parts[3];
      data.frameData = parts[4]; // Stream data
      break;
    default:
      return null;
  }
  return data;
}

module.exports = { parseSignalingPacket, parseMediaPacket };