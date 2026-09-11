export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!process.env.GEMINI_API_KEY) return res.status(500).json({ error: "GEMINI_API_KEY is not configured in Vercel." });

  try {
    const body = req.body || {};
    const action = body.action;
    const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
    const base = `You are Med64 AI, a medical education assistant. Give educational explanations, not personal medical diagnosis or treatment. Prefer clear, exam-oriented explanations. Do not invent source-specific facts. When generating MCQs, make exactly one defensible correct answer and four distinct options.`;

    let prompt = base;
    if (action === "chat") {
      prompt += ` Answer the user's request directly. Use the supplied Med64 context when discussing the question bank or performance.\n\n`;
      prompt += JSON.stringify({
        userMessage: body.message,
        conversation: Array.isArray(body.history) ? body.history.slice(-12) : [],
        med64Context: body.context || {}
      });
    } else if (action === "quiz") {
      const count = Math.min(20, Math.max(1, Number(body.count) || 10));
      prompt += ` Generate exactly ${count} single-answer medical MCQs at ${body.difficulty || "Medium"} difficulty. User request: ${body.topic || "Create a medical review quiz."} Return ONLY valid JSON: {"questions":[{"id":"ai-1","module":"...","subject":"...","lecture":"...","question":"...","options":["...","...","...","..."],"correctIndex":0,"explanation":"..."}]}. Exactly four options per question; correctIndex must be 0-3. If source material is supplied, stay grounded in it.\n\n`;
      prompt += JSON.stringify({
        request: body.topic,
        sourceMode: body.source,
        questionBank: Array.isArray(body.questions) ? body.questions : [],
        med64Context: body.context || {}
      });
    } else {
      return res.status(400).json({ error: "Unknown AI action." });
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(process.env.GEMINI_API_KEY)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: action === "quiz" ? 0.7 : 0.4,
          maxOutputTokens: action === "quiz" ? 6000 : 1800,
          ...(action === "quiz" ? { responseMimeType: "application/json" } : {})
        }
      })
    });

    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data?.error?.message || "Gemini request failed." });

    const text = data?.candidates?.[0]?.content?.parts?.map(p => p.text || "").join("") || "";
    if (!text) return res.status(502).json({ error: "Gemini returned an empty response." });

    if (action === "quiz") {
      try {
        return res.status(200).json(JSON.parse(text));
      } catch {
        try {
          const cleaned = text.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
          return res.status(200).json(JSON.parse(cleaned));
        } catch {
          return res.status(502).json({ error: "Gemini returned quiz data in an invalid format. Please try again." });
        }
      }
    }

    return res.status(200).json({ text });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Server error while contacting the AI service." });
  }
}
