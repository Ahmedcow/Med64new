# Med64 AI setup

This version adds an AI Assistant and AI Quiz Generator without putting your OpenAI key in the browser.

## Vercel environment variables
Add `OPENAI_API_KEY` with your OpenAI API key. Optional: `OPENAI_MODEL` (default `gpt-5`).

Never put the key in `index.html`, GitHub source code, or any `NEXT_PUBLIC_` variable.

After changing an environment variable, redeploy.
