     import React, { useState } from 'react';
     import supabase from '../supabaseClient';

     function Auth() {
       const [email, setEmail] = useState('');
       const [password, setPassword] = useState('');

       const signUp = async () => {
         await supabase.auth.signUp({ email, password });
       };

       return (
         <div>
           <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
           <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
           <button onClick={signUp}>Sign Up</button>
         </div>
       );
     }
     export default Auth;
     