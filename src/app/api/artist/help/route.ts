import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { query } = await req.json();

        const apiKey = process.env.GEMINI_API_KEY || 'AIzaSyA-MENTzsZyZBdmckbTBLcIClPMJaFl3ok';

        if (!apiKey) {
            return NextResponse.json({ error: 'Gemini API key missing on server' }, { status: 500 });
        }

        const systemPrompt = `You are Vilo AI, the official intelligent assistant for ViloBeat (a managed music distribution and artist services platform).

Your sole purpose is to help artists navigate the platform, explain features, and solve problems. You must be polite, concise, and highly knowledgeable about ViloBeat's specific capabilities.

KNOWLEDGE BASE:
1. Distribution: Users must have an active subscription or pay an unlock fee to distribute music. Subscribing to the PRO tier gives access to 150+ DSPs (including TikTok, Instagram, etc).
2. Creative Hub: Found in the "Creative" or "Create" tab. Offers incredibly powerful AI tools:
   - AI Lyrics: Generates structured song lyrics by mood.
   - AI Cover: Creates DSP-ready album art.
   - Lyrics to Music: Turns written lyrics into full song audio tracks.
   - Mastering: AI mastering usually completes in 10-15 minutes.
3. Royalties: Collaborators can be added by email during upload. ViloBeat automatically calculates and deposits percentages directly to their wallets.
4. Wallet & Withdrawals: All earnings appear in the Wallet tab. Withdrawals have a $50 minimum. Processed manually within 48 hours for standard users. PRO tier users get instant withdrawals.
5. Storage: Asset Storage keeps track of generated lyrics, covers, and music. Users can jump straight from a saved lyric to the "Make Song" generator.
6. DSP Status: Live tracking of where a song has been published.
7. Active Data: Real data routing and admin tracking is actively logged.

When a user asks a question, answer it directly using this knowledge. If they ask how to do something, point them to the specific Tab (e.g. Dashboard, Creative, Wallet, Storage, Royalties). If a question is entirely unrelated to ViloBeat or music distribution, politely decline to answer.`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                systemInstruction: {
                    parts: [{ text: systemPrompt }]
                },
                contents: [{
                    parts: [{ text: query }]
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
        const answer = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

        return NextResponse.json({ answer });
    } catch (e: any) {
        console.error('Vilo AI Help Error:', e);
        return NextResponse.json({ error: e.message || 'Failed to process AI help request' }, { status: 500 });
    }
}
