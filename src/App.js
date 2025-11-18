     import React from 'react';
     import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
     import Dashboard from './components/Dashboard';
     import Auth from './components/Auth';
     function App() {
       return (
         <Router>
           <Routes>
             <Route path="/auth" element={<Auth />} />
             <Route path="/" element={<Dashboard />} />
           </Routes>
         </Router>
       );
     }
     export default App;
     