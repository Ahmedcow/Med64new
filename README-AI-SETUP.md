# Med64 — Free Gemini AI setup

This version uses Google's Gemini Developer API instead of OpenAI, with Gemini 3.6 Flash as the default model. The frontend never sees the Gemini API key; Vercel stores it as a server-side environment variable.

## 1. Get a Gemini API key
Open Google AI Studio and create an API key for a project with Gemini API access.

Official page: https://aistudio.google.com/apikey

Google currently documents a free Gemini API tier with free input/output tokens for supported models, subject to rate limits and availability. Check the current pricing and limits before publishing widely.

## 2. Vercel environment variable
In Vercel: Project → Settings → Environment Variables → Add.

Name:
GEMINI_API_KEY

Value:
Paste your Gemini API key here.

Optional model variable:
GEMINI_MODEL

Recommended default:
gemini-2.5-flash

Do NOT put the key in index.html, GitHub source code, or a NEXT_PUBLIC_ variable.

## 3. Redeploy
After saving the environment variable, redeploy the Vercel project.

## 4. Important free-tier note
The free tier has request/token limits. If many people use a public Med64 site, the quota can be exhausted. This project does not yet include user authentication or per-user rate limiting.


## Gemini 3.6 Flash
The Med64 backend is configured by default to use the stable Gemini 3.6 Flash model:

`gemini-3.6-flash`

You normally do **not** need to add `GEMINI_MODEL` in Vercel. The backend will automatically use Gemini 3.6 Flash.

If you add `GEMINI_MODEL`, use the exact model ID above.
