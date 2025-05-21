import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import GenerateScript from './pages/GenerateScript';
import ScriptEditor from './pages/ScriptEditor';
import UploadScript from './pages/UploadScript';
import AvatarGenerator from './pages/AvatarGenerator'; // ✅ add this line

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/generate" element={<GenerateScript />} />
        <Route path="/editor" element={<ScriptEditor />} />
        <Route path="/upload" element={<UploadScript />} />
        <Route path="/avatar" element={<AvatarGenerator />} /> {/* ✅ new route */}
      </Routes>
    </Router>
  );
}

export default App;
