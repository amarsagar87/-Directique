export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST method is allowed" });
  }

  const { name, age, appearance, personality, emotion } = req.body;

  const replicateApiToken = process.env.REPLICATE_API_TOKEN;
  if (!replicateApiToken) {
    return res.status(500).json({ error: "Replicate API token missing" });
  }

  const prompt = `portrait of ${name}, age ${age}, ${appearance}, personality: ${personality}, facial expression: ${emotion}, ultra-detailed, cinematic lighting, studio background`;

  try {
    const response = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        Authorization: `Token ${replicateApiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version: "7b0b37de0758655e73a3adf2daaf8b67aa8c45135d25f4d832da1f3c651d4f9a",
        input: {
          prompt: prompt,
          width: 512,
          height: 768,
          num_outputs: 1,
        },
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.urls?.get) {
      return res.status(500).json({ error: "Failed to start avatar generation" });
    }

    return res.status(200).json({ get_url: data.urls.get });
  } catch (err) {
    console.error("Avatar generation error:", err);
    return res.status(500).json({ error: "Something went wrong while generating avatar" });
  }
}
