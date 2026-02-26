<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1MIdP7T8ARv-JDIUq0xOPBuUHMR6r0-Zy

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Real Estate AI Agent Blueprint

If you are building a real estate assistant (web/mobile/WhatsApp), see the complete architecture and workflow guide here:

- [REAL_ESTATE_AI_ARCHITECTURE.md](./REAL_ESTATE_AI_ARCHITECTURE.md)

## Implemented Project File Structure

The repository now includes a full scaffold for the proposed architecture:

```text
frontend/
backend/
agents/
database/
api/
tools/
```

Each folder includes starter files so implementation can begin immediately.
