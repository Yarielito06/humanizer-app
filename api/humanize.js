export const config = {
    runtime: 'edge',
};

export default async function handler(request) {
    if (request.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
    }

    try {
        const { text } = await request.json();

        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return new Response(JSON.stringify({ error: 'Server Config Error: GEMINI_API_KEY missing.' }), { status: 500 });
        }

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

        // FIXED: Using "gemini-1.5-flash-001" which is the specific stable version ID
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-001:generateContent?key=${apiKey}`, {
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

        if (data.error) {
            throw new Error(data.error.message || 'Google API Error');
        }

        const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!resultText) {
            throw new Error('No text returned from AI');
        }

        return new Response(JSON.stringify({ result: resultText }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error("API Error:", error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}