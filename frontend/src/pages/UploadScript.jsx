import React, { useState } from 'react';

const UploadScript = () => {
  const [scriptText, setScriptText] = useState('');
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleUpload = async () => {
    if (!scriptText.trim()) {
      alert("Please paste your script.");
      return;
    }

    setLoading(true);
    setError('');
    setCharacters([]);

    try {
      const response = await fetch('https://directique-backend.onrender.com/upload-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ script: scriptText })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || 'Unknown error');
      }

      setCharacters(result.characters.map((char) => ({ ...char, avatar_url: '', generating: false })));
    } catch (err) {
      setError(err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleCharacterChange = (index, field, value) => {
    const updated = [...characters];
    updated[index][field] = value;
    setCharacters(updated);
  };

  const generateAvatar = async (index) => {
    const char = characters[index];
    const updated = [...characters];
    updated[index].generating = true;
    setCharacters(updated);

    try {
      const response = await fetch('https://directique-backend.onrender.com/generate-avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: char.name,
          age: char.age || 30,
          appearance: char.appearance || 'neutral appearance',
          personality: char.personality || 'neutral personality',
          emotion: 'neutral'
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || 'Avatar generation failed');
      }

      updated[index].avatar_url = result.avatar_url;
    } catch (err) {
      console.error('Avatar generation error:', err.message);
      updated[index].avatar_url = '';
      alert('Failed to generate avatar.');
    } finally {
      updated[index].generating = false;
      setCharacters(updated);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Upload or Paste Script</h2>
      <textarea
        className="w-full h-60 p-4 border rounded mb-4"
        placeholder="Paste your movie or TV script here..."
        value={scriptText}
        onChange={(e) => setScriptText(e.target.value)}
      />
      <button
        onClick={handleUpload}
        disabled={loading}
        className="bg-black text-white px-6 py-2 rounded hover:bg-gray-800"
      >
        {loading ? "Analyzing Script..." : "Generate Characters"}
      </button>

      {error && <p className="text-red-600 mt-4">{error}</p>}

      {characters.length > 0 && (
        <div className="mt-8">
          <h3 className="text-xl font-semibold mb-4">Generated Characters</h3>
          {characters.map((char, index) => (
            <div key={index} className="border rounded p-4 mb-6 bg-gray-50 shadow-lg">
              <div className="grid grid-cols-2 gap-4 mb-4">
                {["name", "age", "role", "personality", "appearance", "voice_style"].map((field) => (
                  <div key={field}>
                    <label className="block text-sm font-medium mb-1 capitalize">{field.replace('_', ' ')}</label>
                    <input
                      type="text"
                      value={char[field]}
                      onChange={(e) => handleCharacterChange(index, field, e.target.value)}
                      className="w-full border rounded p-2"
                    />
                  </div>
                ))}
              </div>

              <button
                onClick={() => generateAvatar(index)}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                disabled={char.generating}
              >
                {char.generating ? "Generating Avatar..." : "Generate Avatar"}
              </button>

              {char.avatar_url && (
                <img
                  src={char.avatar_url}
                  alt={`${char.name}'s Avatar`}
                  className="mt-4 rounded-xl border shadow-lg max-w-xs"
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UploadScript;
