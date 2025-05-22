// frontend/pages/api/generate-avatar.js

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, age, appearance, personality, emotion } = req.body;
  const replicateApiToken = process.env.REPLICATE_API_TOKEN;

  if (!replicateApiToken) {
    return res.status(500).json({ error: 'Missing Replicate API token' });
  }

  const prompt = `portrait of ${name}, age ${age}, ${appearance}, personality: ${personality}, facial expression: ${emotion}, ultra-detailed, cinematic lighting, studio background`;

  try {
    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${replicateApiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: "f178c5bf-137f-43f3-8ec6-620131210041", // SDXL v1.0
        input: {
          prompt: prompt,
          width: 512,
          height: 768,
          num_outputs: 1
        }
      }),
    });

    if (!response.ok) {
      const errorDetail = await response.text();
      console.error('Replicate Error:', errorDetail);
      return res.status(500).json({
        error: 'Replicate returned error',
        details: errorDetail
      });
    }

    const data = await response.json();
    const avatarUrl = data?.urls?.get;

    return res.status(200).json({ avatar_url: avatarUrl });

  } catch (err) {
    console.error('Server Error:', err);
    return res.status(500).json({ error: 'Unhandled server error', details: err.message });
  }
}
