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
        version: "7b0b37de0758655e73a3adf2daaf8b67aa8c45135d25f4d832da1f3c651d4f9a",
        input: {
          prompt: prompt,
          width: 512,
          height: 768,
          num_outputs: 1
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Replicate API Error Response:', errorText);
      return res.status(500).json({ error: 'Failed to start avatar generation', details: errorText });
    }

    const data = await response.json();
    const avatarUrl = data?.urls?.get;

    if (!avatarUrl) {
      return res.status(500).json({ error: 'Avatar URL not found in response', raw: data });
    }

    return res.status(200).json({ avatar_url: avatarUrl });

  } catch (err) {
    console.error('Server Error:', err);
    return res.status(500).json({ error: 'Server error while generating avatar' });
  }
}
