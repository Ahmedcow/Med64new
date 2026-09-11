export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!process.env.OPENAI_API_KEY) return res.status(500).json({ error: "OPENAI_API_KEY is not configured in Vercel." });
  try {
    const body=req.body||{}, action=body.action, model=process.env.OPENAI_MODEL||"gpt-5";
    const base=`You are Med64 AI, a medical education assistant. Give educational explanations, not personal medical diagnosis or treatment. Prefer clear, exam-oriented explanations. Do not invent source-specific facts. When generating MCQs, make exactly one defensible correct answer and four distinct options.`;
    let instructions=base, input="";
    if(action==="chat"){
      instructions += ` Answer the user's request directly. Use supplied Med64 context when discussing the question bank or performance.`;
      input=JSON.stringify({userMessage:body.message,conversation:Array.isArray(body.history)?body.history.slice(-12):[],med64Context:body.context||{}});
    } else if(action==="quiz"){
      const count=Math.min(20,Math.max(1,Number(body.count)||10));
      instructions += ` Generate exactly ${count} single-answer medical MCQs at ${body.difficulty||"Medium"} difficulty. User request: ${body.topic||"Create a medical review quiz."} Return ONLY valid JSON: {"questions":[{"id":"ai-1","module":"...","subject":"...","lecture":"...","question":"...","options":["...","...","...","..."],"correctIndex":0,"explanation":"..."}]}. Exactly four options per question; correctIndex must be 0-3. If source material is supplied, stay grounded in it.`;
      input=JSON.stringify({request:body.topic,sourceMode:body.source,questionBank:Array.isArray(body.questions)?body.questions:[],med64Context:body.context||{}});
    } else return res.status(400).json({error:"Unknown AI action."});
    const response=await fetch("https://api.openai.com/v1/responses",{method:"POST",headers:{"Authorization":`Bearer ${process.env.OPENAI_API_KEY}`,"Content-Type":"application/json"},body:JSON.stringify({model,instructions,input,store:false})});
    const data=await response.json();
    if(!response.ok)return res.status(response.status).json({error:data?.error?.message||"OpenAI request failed."});
    const text=data.output_text||"";
    if(action==="quiz"){
      try{return res.status(200).json(JSON.parse(text));}
      catch{try{return res.status(200).json(JSON.parse(text.replace(/^```json\s*/i,"").replace(/```$/i,"").trim()));}catch{return res.status(200).json({questions:[]});}}
    }
    return res.status(200).json({text});
  } catch(e){ console.error(e); return res.status(500).json({error:"Server error while contacting the AI service."}); }
}