// frontend/pages/api/generate-avatar.js

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST method is allowed' });
  }

  const { name, age, appearance, personality, emotion } = req.body;
  const replicateApiToken = process.env.REPLICATE_API_TOKEN;

  if (!replicateApiToken) {
    return res.status(500).json({ error: 'Replicate API token missing' });
  }

  const prompt = `portrait of ${name}, age ${age}, ${appearance}, personality: ${personality}, facial expression: ${emotion}, ultra-detailed, cinematic lighting, studio background`;

  try {
    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${replicateApiToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        version: "610dddf033f10431b1b55f24510b6009fcba23017ee551a1b9afbc4eec79e29c", // SDXL model version
        input: {
          prompt,
          width: 512,
          height: 768,
          num_outputs: 1
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Replicate Error Response:", errorText);
      return res.status(500).json({ error: "Failed to start avatar generation" });
    }

    const data = await response.json();
    const avatarUrl = data?.urls?.get;

    if (!avatarUrl) {
      return res.status(500).json({ error: "Avatar URL not returned from API" });
    }

    res.status(200).json({ avatar_url: avatarUrl });

  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: "Server error while generating avatar" });
  }
}
