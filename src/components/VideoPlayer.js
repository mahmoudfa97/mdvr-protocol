import React, { useEffect, useState } from 'react';
import ReactPlayer from 'react-player';
   import axios from 'axios';

function VideoPlayer({ deviceId }) {
  const [url, setUrl] = useState(null);

  useEffect(() => {
    // Fetch streaming URL from backend (e.g., via V102)
    axios.get(`/api/devices/${deviceId}/stream`).then(res => setUrl(res.data.url));
  }, [deviceId]);

  return url ? <ReactPlayer url={url} controls playing /> : <p>Loading video...</p>;
}
export default VideoPlayer;