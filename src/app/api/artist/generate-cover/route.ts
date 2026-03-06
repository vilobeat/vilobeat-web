import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { songTitle, artistName, visualIdeas, styleType, prompt } = body;

        const apiKey = process.env.GEMINI_API_KEY || 'AIzaSyA-MENTzsZyZBdmckbTBLcIClPMJaFl3ok';

        if (!apiKey) {
            return NextResponse.json({ error: 'Gemini API key missing on server' }, { status: 500 });
        }

        const ai = new GoogleGenAI({ apiKey });

        // Construct a highly detailed prompt targeting a 3000x3000px aesthetic
        const constructedPrompt = `You are designing a strictly professional, high-end digital music/song cover artwork.
        CRITICAL FORMAT REQUIREMENT: This image MUST be perfectly flat, 2D, full bleed and edge-to-edge. DO NOT generate a 3D mockup, vinyl record mockup, CD jewel case mockup, tilted perspective, or physical object representation. DO NOT include any borders, white margins, or frames. The artwork must completely fill the perfectly flat, square digital canvas edge-to-edge.
        ${styleType ? `CRITICAL CREATIVE STYLE: The overall artistic medium and style MUST heavily resemble: ${styleType}. ` : ''}
        ${songTitle ? `CRITICAL TYPOGRAPHY REQUIREMENT 1: The primary graphic title "${songTitle}" MUST be the most prominent, massively scaled, and highly legible text element on the graphic. It should immediately draw the eye and dominate the typographical hierarchy.` : ''}
        ${artistName ? `CRITICAL TYPOGRAPHY REQUIREMENT 2: The secondary text/credit "${artistName}" MUST be included, but it must be noticeably smaller, subtler, and less prominent than the primary title. It should act as secondary information.` : ''}
        ${visualIdeas ? `Visual aesthetic and thematic direction: ${visualIdeas}. ` : ''}
        ${prompt ? `Additional context and instructions: ${prompt}. ` : ''}
        Focus intensely on commercial viability, stunning high-end music cover aesthetics, flawless typography integration that matches the vibe, and guaranteeing absolutely NO borders or blank margins. DO NOT add random untranslatable text.`;

        const makeRequest = async () => {
            const response = await ai.models.generateContent({
                model: "gemini-3-pro-image-preview",
                contents: constructedPrompt,
                config: {
                    responseModalities: ["image", "text"],
                },
            });

            // Extract image from response
            if (response.candidates && response.candidates[0]?.content?.parts) {
                for (const part of response.candidates[0].content.parts) {
                    if (part.inlineData) {
                        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                    }
                }
            }

            throw new Error("No image data returned from Gemini");
        };

        const [cover1, cover2] = await Promise.all([makeRequest(), makeRequest()]);

        return NextResponse.json({ covers: [cover1, cover2] });
    } catch (e: any) {
        console.error('Cover Gen Error', e);
        return NextResponse.json({ error: e.message || 'Internal server error while generating cover' }, { status: 500 });
    }
}
