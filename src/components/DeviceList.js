     import React, { useEffect, useState } from 'react';
     import axios from 'axios';

     function DeviceList() {
       const [devices, setDevices] = useState([]);

       useEffect(() => {
         axios.get('http://localhost:3001/api/devices').then(res => setDevices(res.data));
       }, []);

       return (
         <div>
           <h2>Devices</h2>
           <ul>
             {devices?.map(d => (
               <li key={d.id}>
                 {d.serial} - {d.status}
               <button onClick={() => axios.post(`/api/devices/${d.id}/control`, { command: 'C508', params: { action: 'start' } })}>
  Start Video
</button>
<button onClick={() => axios.post(`/api/devices/${d.id}/control`, { command: 'C702', params: { fileId: 'someId' } })}>
  Download File
</button>
                 
               </li>
             ))}
           </ul>
         </div>
       );
     }
     export default DeviceList;
     