import OpenAI from 'openai';

let groqClient: OpenAI | null = null;

export function initGroq(apiKey: string): void {
    groqClient = new OpenAI({
        apiKey,
        baseURL: 'https://api.groq.com/openai/v1',
        dangerouslyAllowBrowser: true,
    });
}

export function getGroqClient(): OpenAI {
    if (!groqClient) {
        throw new Error('Groq client not initialized. Please provide API key in settings.');
    }
    return groqClient;
}

export async function generateWithGroq(
    prompt: string,
    systemPrompt?: string,
    conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<string> {
    const client = getGroqClient();

    const messages: any[] = [
        ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
        ...(conversationHistory || []),
        { role: 'user', content: prompt },
    ];

    const response = await client.chat.completions.create({
        model: 'llama-3.3-70b-versatile', // Fast model for real-time responses
        messages,
        temperature: 0.8,
        max_tokens: 1500,
    });

    return response.choices[0]?.message?.content || '';
}

export async function streamWithGroq(
    prompt: string,
    systemPrompt?: string,
    onChunk?: (chunk: string) => void
): Promise<string> {
    const client = getGroqClient();

    const stream = await client.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
            ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
            { role: 'user', content: prompt },
        ],
        temperature: 0.8,
        max_tokens: 1500,
        stream: true,
    });

    let fullResponse = '';

    for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        fullResponse += content;
        if (onChunk) {
            onChunk(content);
        }
    }

    return fullResponse;
}
