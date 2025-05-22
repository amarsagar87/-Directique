export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, age, appearance, personality, emotion } = req.body;
  const replicateApiToken = process.env.REPLICATE_API_TOKEN;

  console.log("Replicate Token: ", replicateApiToken); // TEMPORARY DEBUG LOG

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
        version: "db21e45a3b1151ae9c0fa60a3208c3e7f3e3ffcab6c171e42b27e3a79a0e10a4",
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
      console.error('Replicate API ERROR:', errorText);
      return res.status(500).json({ error: errorText });
    }

    const data = await response.json();
    const avatarUrl = data?.urls?.get;

    return res.status(200).json({ avatar_url: avatarUrl });

  } catch (err) {
    console.error('Server Error:', err);
    return res.status(500).json({ error: 'Server error while generating avatar' });
  }
}
