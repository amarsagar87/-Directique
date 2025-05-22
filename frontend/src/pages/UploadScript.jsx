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

      let parsedCharacters = [];

      try {
        parsedCharacters = JSON.parse(result.characters);
      } catch (err) {
        throw new Error("Failed to parse character data. Try a simpler script.");
      }

      // Add empty avatar_url to each character
      setCharacters(parsedCharacters.map(c => ({ ...c, avatar_url: '' })));
    } catch (err) {
      setError(err.message || "An error occurred.");
      console.error(err);
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
    setLoading(true);
    setError('');

    try {
      const response = await fetch('https://directique-backend.onrender.com/generate-avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: char.name || 'Unnamed Character',
          age: parseInt(char.age) || 30,
          appearance: char.appearance || 'average features',
          personality: char.personality || 'neutral',
          emotion: 'neutral'
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || 'Failed to generate avatar');
      }

      const updated = [...characters];
      updated[index].avatar_url = result.avatar_url;
      setCharacters(updated);

    } catch (err) {
      console.error(err);
      setError(err.message || 'Avatar generation failed.');
    } finally {
      setLoading(false);
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
            <div key={index} className="border rounded p-4 mb-4 bg-gray-50">
              <div className="grid grid-cols-2 gap-4">
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

              <div className="mt-4 flex gap-4 items-center">
                <button
                  onClick={() => generateAvatar(index)}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  disabled={loading}
                >
                  {loading ? "Generating..." : "Generate Avatar"}
                </button>

                {char.avatar_url && (
                  <img
                    src={char.avatar_url}
                    alt="Avatar"
                    className="w-24 h-32 rounded shadow-lg"
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UploadScript;
