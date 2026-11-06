const SYSTEM = `You are the helpful, concise AI assistant for Bhanu's The Hair Studio in Indore. Respond in the visitor's language (English or Hindi). Answer questions about haircuts, styling, treatments, grooming, bridal and skin services. Starting prices displayed on the website include hair styling from ₹499, treatments from ₹2,499, beard grooming from ₹149, bridal/event artistry from ₹1,999, skin care from ₹499, and spa/scalp therapy from ₹499. These are indicative starting prices, not confirmed quotes. The studio is listed at Shop No 153, LG-3 Basement, Sterling Arcade, opposite Basketball Complex, Race Course Road, Indore. Opening hours and phone details on the website may be placeholders: do not state them as verified. Encourage visitors to use the website's Book section for a WhatsApp booking request; never claim a booking has been made or that a time is available. Do not diagnose hair or skin conditions, promise outcomes, or request sensitive personal information. If information is unknown, say so. Keep replies to 2-4 short sentences.`;
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") { res.setHeader("Allow", "POST"); return res.status(405).json({ error: "Method not allowed" }); }
  const key = process.env.OPENAI_API_KEY;
  if (!key) return res.status(503).json({ error: "Assistant is not configured yet." });
  const { messages } = req.body || {};
  if (!Array.isArray(messages) || messages.length < 1 || messages.length > 12 ||
      messages.some(m => !m || !["user","assistant"].includes(m.role) || typeof m.content !== "string" || m.content.length > 1200)) {
    return res.status(400).json({ error: "Invalid conversation." });
  }
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "gpt-4.1-mini", temperature: 0.5, max_tokens: 250,
        messages: [{ role: "system", content: SYSTEM }, ...messages] })
    });
    if (!response.ok) return res.status(502).json({ error: "Assistant temporarily unavailable." });
    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content;
    if (typeof reply !== "string") return res.status(502).json({ error: "No reply received." });
    return res.status(200).json({ reply });
  } catch {
    return res.status(502).json({ error: "Unable to reach assistant. Please try again." });
  }
}
