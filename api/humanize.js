export const config = {
    runtime: 'edge',
};

export default async function handler(request) {
    if (request.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
    }

    try {
        const { text } = await request.json();

        // 1. Get the API Key securely from Vercel Environment Variables
        // You MUST set 'OPENAI_API_KEY' in your Vercel Project Settings
        const apiKey = process.env.OPENAI_API_KEY;

        if (!apiKey) {
            return new Response(JSON.stringify({ error: 'Server Config Error: API Key missing' }), { status: 500 });
        }

        // 2. The "Magic" Prompt
        // This is the core intellectual property of your app. 
        // We ask for "Burstiness" and "Perplexity" to trick detectors.
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

        // 3. Call OpenAI API
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo", // Low cost model. Use gpt-4 for Premium users later.
                messages: [{ role: "user", content: prompt }],
                temperature: 0.7 // Higher temperature = more random/human-like
            })
        });

        const data = await response.json();

        if (data.error) {
            throw new Error(data.error.message);
        }

        // 4. Send the result back to the frontend
        return new Response(JSON.stringify({ result: data.choices[0].message.content }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}