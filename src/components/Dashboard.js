// frontend/src/components/Dashboard.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import axios from 'axios';
import supabase from '../supabaseClient';
import DeviceList from './DeviceList';
import MapView from './MapView';
import AlarmList from './AlarmList';
import VideoPlayer from './VideoPlayer';

function Dashboard() {
  const [user, setUser] = useState(null);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [realTimeUpdates, setRealTimeUpdates] = useState([]);
  const [newDevice, setNewDevice] = useState({ serial: '', location: { lat: 0, lng: 0 }, status: 'offline' });
  const [file, setFile] = useState(null);
  const navigate = useNavigate();

  // Check authentication on load
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
      } else {
        setUser(user);
      }
    };
    checkAuth();
  }, [navigate]);

  // Socket.io for real-time updates
  useEffect(() => {
    if (!user) return;
    const socket = io('http://localhost:3001');
    socket.on('deviceUpdate', (data) => {
      setRealTimeUpdates((prev) => [...prev, data]);
      console.log('Real-time update:', data);
    });
    socket.on('alarmUpdate', (data) => {
      alert(`New alarm: ${data.message}`);
    });
    return () => socket.disconnect();
  }, [user]);

  // Manual add device
  const addDevice = async () => {
    try {
      await axios.post('http://localhost:3001/api/devices', newDevice, {
        headers: { Authorization: `Bearer ${(await supabase.auth.getSession()).data.session.access_token}` }
      });
      alert('Device added!');
      setNewDevice({ serial: '', location: { lat: 0, lng: 0 }, status: 'offline' });
    } catch (err) {
      alert('Error adding device');
    }
  };

  // Bulk import CSV
  const uploadCSV = async () => {
    if (!file) return alert('Select a file');
    const formData = new FormData();
    formData.append('file', file);
    try {
      await axios.post('http://localhost:3001/api/devices/bulk-import', formData, {
        headers: { Authorization: `Bearer ${(await supabase.auth.getSession()).data.session.access_token}` }
      });
      alert('CSV imported!');
      setFile(null);
    } catch (err) {
      alert('Error importing CSV');
    }
  };

  // Import from API
  const importFromAPI = async () => {
    try {
      await axios.post('http://localhost:3001/api/devices/api-import', {}, {
        headers: { Authorization: `Bearer ${(await supabase.auth.getSession()).data.session.access_token}` }
      });
      alert('Imported from API!');
    } catch (err) {
      alert('Error importing from API');
    }
  };

  if (!user) {
    return <p>Loading...</p>;
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>MDVR SaaS Dashboard</h1>
      <p>Welcome, {user.email}! Manage your fleet of MDVR devices.</p>

      {/* Real-time updates log */}
      <div style={{ marginBottom: '20px' }}>
        <h3>Real-Time Updates</h3>
        <ul>
          {realTimeUpdates.slice(-10).map((update, index) => (
            <li key={index}>{JSON.stringify(update)}</li>
          ))}
        </ul>
      </div>

      {/* Device List */}
      <DeviceList onSelectDevice={setSelectedDevice} />

      {/* Map View */}
      <MapView selectedDevice={selectedDevice} />

      {/* Alarm List */}
      <AlarmList selectedDevice={selectedDevice} />

      {/* Video Player */}
      {selectedDevice && (
        <div style={{ marginTop: '20px' }}>
          <h3>Live Video for Device {selectedDevice.serial}</h3>
          <VideoPlayer deviceId={selectedDevice.id} />
        </div>
      )}

      {/* Controls for selected device */}
      {selectedDevice && (
        <div style={{ marginTop: '20px' }}>
          <button onClick={async () => axios.post(`http://localhost:3001/api/devices/${selectedDevice.id}/control`, { command: 'C508', params: { action: 'start' } }, {
            headers: { Authorization: `Bearer ${(await supabase.auth.getSession()).data.session.access_token}` }
          })}>
            Start Video Stream
          </button>
          <button onClick={async () => axios.post(`http://localhost:3001/api/devices/${selectedDevice.id}/control`, { command: 'C702', params: { fileId: 'latest' } }, {
            headers: { Authorization: `Bearer ${(await supabase.auth.getSession()).data.session.access_token}` }
          })}>
            Download Latest File
          </button>
        </div>
      )}

      {/* Add New Device Form */}
      <div style={{ marginTop: '20px' }}>
        <h3>Add New Device</h3>
        <input
          type="text"
          placeholder="Serial Number"
          value={newDevice.serial}
          onChange={(e) => setNewDevice({ ...newDevice, serial: e.target.value })}
        />
        <input
          type="number"
          placeholder="Latitude"
          value={newDevice.location.lat}
          onChange={(e) => setNewDevice({ ...newDevice, location: { ...newDevice.location, lat: parseFloat(e.target.value) } })}
        />
        <input
          type="number"
          placeholder="Longitude"
          value={newDevice.location.lng}
          onChange={(e) => setNewDevice({ ...newDevice, location: { ...newDevice.location, lng: parseFloat(e.target.value) } })}
        />
        <button onClick={addDevice}>Add Device</button>
      </div>

      {/* Bulk Import */}
      <div style={{ marginTop: '20px' }}>
        <h3>Bulk Import</h3>
        <input type="file" accept=".csv" onChange={(e) => setFile(e.target.files[0])} />
        <button onClick={uploadCSV}>Import CSV</button>
        <button onClick={importFromAPI}>Import from API</button>
      </div>

      {/* Analytics Placeholder */}
      <div style={{ marginTop: '20px' }}>
        <h3>Analytics</h3>
        <p>Charts for mileage, fuel, etc., will go here.</p>
      </div>

      {/* Logout */}
      <button onClick={() => supabase.auth.signOut().then(() => navigate('/auth'))} style={{ marginTop: '20px' }}>
        Logout
      </button>
    </div>
  );
}

export default Dashboard;