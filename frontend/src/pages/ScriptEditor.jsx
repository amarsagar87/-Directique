import React, { useEffect, useState } from 'react';

const ScriptEditor = () => {
  const [script, setScript] = useState('');

  useEffect(() => {
    const savedScript = localStorage.getItem('generatedScript');
    setScript(savedScript || '');
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Script Editor</h2>
      <textarea
        value={script}
        onChange={(e) => setScript(e.target.value)}
        className="w-full h-[80vh] p-4 border rounded font-mono"
      />
    </div>
  );
};

export default ScriptEditor;
