import React, { useState } from 'react';

const AvatarGenerator = () => {
  const [form, setForm] = useState({
    name: '',
    age: '',
    appearance: '',
    personality: '',
    emotion: '',
  });

  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleGenerate = async () => {
    const { name, age, appearance, personality, emotion } = form;
    if (!name || !age || !appearance || !personality || !emotion) {
      alert("Please fill in all fields.");
      return;
    }

    setLoading(true);
    setImageUrl('');
    setError('');

    try {
      const res = await fetch('https://directique-backend.onrender.com/generate-avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, age: parseInt(age), appearance, personality, emotion }),
      });

      const data = await res.json();
      setLoading(false);

      if (res.ok && data.avatar_url) {
        setImageUrl(data.avatar_url);
      } else {
        setError(data.detail || 'Failed to generate avatar.');
      }
    } catch (err) {
      setLoading(false);
      setError('Error generating avatar.');
      console.error(err);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Generate Character Avatar</h2>

      {["name", "age", "appearance", "personality", "emotion"].map((field) => (
        <input
          key={field}
          type="text"
          name={field}
          placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
          value={form[field]}
          onChange={handleChange}
          className="w-full mb-3 p-2 border rounded"
        />
      ))}

      <button
        onClick={handleGenerate}
        className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800"
        disabled={loading}
      >
        {loading ? 'Generating Avatar...' : 'Generate Avatar'}
      </button>

      {error && <p className="text-red-600 mt-4">{error}</p>}

      {imageUrl && (
        <div className="mt-6">
          <p className="mb-2 font-semibold">Generated Avatar:</p>
          <img src={imageUrl} alt="Generated Avatar" className="rounded shadow-lg w-full max-w-xs" />
        </div>
      )}
    </div>
  );
};

export default AvatarGenerator;
