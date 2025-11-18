  import React, { useEffect, useState } from 'react';
     import supabase from '../supabaseClient';
     function AlarmList() {
       const [alarms, setAlarms] = useState([]);
       useEffect(() => {
         supabase.from('alarms').select('*').then(({ data }) => setAlarms(data));
       }, []);
       return (
         <ul>
           {alarms?.map(a => <li key={a.id}>{a.type}: {a.message}</li>)}
         </ul>
       );
     }
     export default AlarmList;
     
