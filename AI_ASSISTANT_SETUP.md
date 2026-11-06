# AI Salon Assistant setup

This feature adds a floating dark-and-gold chat assistant to the salon site.

## Deployment
1. Deploy this repository to Vercel as a Vite project (build: `npm run build`, output: `dist`).
2. In Vercel project Settings → Environment Variables, add `OPENAI_API_KEY` with your own API key. Never put it in frontend code or commit it to GitHub.
3. Redeploy after adding the environment variable.
4. Test the assistant on the deployed site. Vite's standalone `npm run dev` does **not** run the Vercel `/api/chat` function; chat requests will fail locally unless you run a compatible serverless dev environment.

The serverless endpoint is `api/chat.js`, and the frontend is `public/js/ai-assistant.js` with styling in `src/styles/ai-assistant.css`. The site retains its existing 3D scripts and WhatsApp booking form.

## Important before launch
- The site's prices, hours and phone number include placeholders. Replace these with verified business details and update the server-side assistant instructions.
- The assistant does not create bookings or confirm available slots. Visitors use the existing booking form.
- OpenAI API usage is billed separately. Set spending limits and monitor usage.
- For production, add IP-based rate limiting and abuse monitoring at the hosting edge; the current endpoint limits input length but does not provide rate limiting.
- Avoid collecting personal/sensitive information in chat. Review your privacy notice and retention practices before launch.
