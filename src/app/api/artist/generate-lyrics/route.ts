import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { mood, theme, keywords, genre, audience, structure } = body;

        const apiKey = process.env.GEMINI_API_KEY || 'AIzaSyA-MENTzsZyZBdmckbTBLcIClPMJaFl3ok';

        if (!apiKey) {
            return NextResponse.json({ error: 'Gemini API key missing on server' }, { status: 500 });
        }

        const audienceStr = audience ? `\nTarget Audience: ${audience}` : '';
        const keywordsStr = keywords ? `\nProminent Keywords to Include: ${keywords}` : '';
        const structureStr = structure && structure.length > 0 ? `\nSong Structure Required: ${structure.join(' -> ')}` : '';

        const prompt = `Write professional song lyrics based on the exact following details:\nMood: ${mood}\nTheme: ${theme}\nGenre: ${genre}${keywordsStr}${audienceStr}${structureStr}\nPlease adhere strictly to the requested song structure, and tailor the language heavily to the target audience and mood. Avoid adding extra notes or commentary—return *only* the lyrics.`;


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
                    temperature: 0.7
                }
            })
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`Gemini error: ${err}`);
        }

        const data = await response.json();
        const lyrics = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

        return NextResponse.json({ lyrics });
    } catch (e: any) {
        console.error('Lyrics Gen Error', e);
        return NextResponse.json({ error: e.message || 'Internal server error while generating lyrics' }, { status: 500 });
    }
}
