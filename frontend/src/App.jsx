import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import GenerateScript from './pages/GenerateScript';
import ScriptEditor from './pages/ScriptEditor';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/generate" element={<GenerateScript />} />
        <Route path="/editor" element={<ScriptEditor />} />
      </Routes>
    </Router>
  );
}

export default App;
