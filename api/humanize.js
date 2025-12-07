export const config = {
    runtime: 'edge',
};

export default async function handler(request) {
    if (request.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
    }

    try {
        const { text } = await request.json();

        // 1. Get the Google Gemini API Key from Vercel Environment Variables
        // GOAL: Switch to Google Gemini (Free Tier)
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return new Response(JSON.stringify({ error: 'Server Config Error: GEMINI_API_KEY missing. Please add it in Vercel Settings.' }), { status: 500 });
        }

        // 2. The "Magic" Prompt
        // We keep the same instructions because they work universally on good AI models.
        const prompt = `
        You are a professional editor. Your goal is to rewrite the following text to bypass AI detection systems like GPTZero.
        
        Guidelines:
        - Increase "Burstiness": Vary sentence length significantly. Mix short, punchy sentences with longer, complex ones.
        - Increase "Perplexity": Use more varied vocabulary and unexpected phrasing while keeping the meaning clear.
        - Tone: Natural, student-like, slightly informal but academic.
        - Do NOT change the core meaning or facts.
        - Return ONLY the rewritten text.

        Text to rewrite:
        "${text}"
        `;

        // 3. Call Google Gemini API (Free Tier)
        // Using gemini-1.5-flash which is fast and free for this usage level
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }]
            })
        });

        const data = await response.json();

        // Error handling for Google's API format
        if (data.error) {
            throw new Error(data.error.message || 'Google API Error');
        }

        // 4. Parse Google's specific response structure
        // Gemini returns candidates[0].content.parts[0].text
        const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!resultText) {
            throw new Error('No text returned from AI');
        }

        // 5. Send the result back to the frontend
        return new Response(JSON.stringify({ result: resultText }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error("API Error:", error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}