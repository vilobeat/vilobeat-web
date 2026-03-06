import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { lyrics } = body;

        const apiKey = process.env.GEMINI_API_KEY || 'AIzaSyA-MENTzsZyZBdmckbTBLcIClPMJaFl3ok';

        if (!lyrics) {
            return NextResponse.json({ error: 'Lyrics are required' }, { status: 400 });
        }

        if (!apiKey) {
            return NextResponse.json({ error: 'Gemini API key missing' }, { status: 500 });
        }

        const prompt = `You are a professional hit-making songwriter. A user has provided you with some raw lyrics. Your job is to refine, polish, and creatively enhance these lyrics into two vastly different hit-song variations while retaining the underlying meaning.

Return exactly a JSON object with a "variations" array containing exactly two strings (the two refined lyrics options).
Do not include markdown blocks around the JSON.

Original Lyrics:
"""
${lyrics}
"""
`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }],
                generationConfig: {
                    responseMimeType: "application/json",
                    temperature: 0.7
                }
            })
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`Gemini error: ${err}`);
        }

        const data = await response.json();
        const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';

        let responseJson;
        try {
            responseJson = JSON.parse(content);
        } catch (e) {
            return NextResponse.json({ error: 'AI returned invalid format' }, { status: 500 });
        }

        return NextResponse.json({ options: responseJson.variations || [] });
    } catch (error: any) {
        console.error('AI Refine Lyrics Error:', error);
        return NextResponse.json({ error: error.message || 'Failed to refine lyrics' }, { status: 500 });
    }
}
