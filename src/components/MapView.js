     import React, { useEffect, useState } from 'react';
     import { MapContainer, TileLayer, Marker } from 'react-leaflet';
     import supabase from '../supabaseClient';

     function MapView() {
       const [locations, setLocations] = useState([]);

       useEffect(() => {
         supabase.from('locations').select('*').then(({ data }) => setLocations(data));
       }, []);

       return (
         <MapContainer center={[0, 0]} zoom={2} style={{ height: '400px', width: '100%' }}>
           <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
           {locations?.map(l => <Marker key={l.id} position={[l.latitude, l.longitude]} />)}
         </MapContainer>
       );
     }
     export default MapView;
     