import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './Login';
import Dashboard from './Dashboard';
import AddMember from './AddMember';
import MemberProfile from './MemberProfile'; // <--- Import this

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/add-member" element={<AddMember />} />
        <Route path="/member/:id" element={<MemberProfile />} /> {/* <--- Add this Route */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;