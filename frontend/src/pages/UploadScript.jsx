import React, { useState } from 'react';

const UploadScript = () => {
  const [scriptText, setScriptText] = useState('');
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generatingAvatars, setGeneratingAvatars] = useState({});

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

      setCharacters(result.characters.map(char => ({ ...char, avatar_url: null })));
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

  const handleGenerateAvatar = async (index) => {
    const char = characters[index];
    if (!char.name || !char.age || !char.appearance || !char.personality || !char.voice_style) {
      alert("Please fill all fields before generating avatar.");
      return;
    }

    setGeneratingAvatars(prev => ({ ...prev, [index]: true }));

    try {
      const response = await fetch('https://directique-backend.onrender.com/generate-avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: char.name,
          age: char.age,
          appearance: char.appearance,
          personality: char.personality,
          emotion: char.voice_style || 'neutral'
        })
      });

      const result = await response.json();

      if (response.ok) {
        const updated = [...characters];
        updated[index].avatar_url = result.avatar_url;
        setCharacters(updated);
      } else {
        throw new Error(result.detail || 'Avatar generation failed');
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setGeneratingAvatars(prev => ({ ...prev, [index]: false }));
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

              <div className="mt-4 text-center">
                <button
                  onClick={() => handleGenerateAvatar(index)}
                  disabled={generatingAvatars[index]}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  {generatingAvatars[index] ? "Generating Avatar..." : "Generate Avatar"}
                </button>

                {char.avatar_url && (
                  <div className="mt-4">
                    <img src={char.avatar_url} alt="Avatar" className="rounded-xl shadow-lg mx-auto" />
                  </div>
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
