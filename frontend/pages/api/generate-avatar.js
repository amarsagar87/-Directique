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

  const fullPrompt = `portrait of ${name}, age ${age}, ${appearance}, personality: ${personality}, facial expression: ${emotion}, ultra-detailed, cinematic lighting, studio background`;

  try {
    const replicateResponse = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Authorization": `Token ${replicateApiToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        version: "db21e45c44a9418591a3f48803fd26f32f3b1aa4305ffdbb12f67ee3f296e5d9",
        input: {
          prompt: fullPrompt,
          width: 512,
          height: 768,
          num_outputs: 1
        }
      })
    });

    if (!replicateResponse.ok) {
      const errorText = await replicateResponse.text();
      console.error("Replicate Error Response:", errorText);
      return res.status(500).json({ error: "Failed to generate avatar", details: errorText });
    }

    const replicateData = await replicateResponse.json();
    const getUrl = replicateData?.urls?.get;

    if (!getUrl) {
      return res.status(500).json({ error: "Avatar URL not returned from Replicate" });
    }

    res.status(200).json({ avatar_url: getUrl });
  } catch (err) {
    console.error("Server error while generating avatar:", err);
    res.status(500).json({ error: "Server error while generating avatar" });
  }
}
