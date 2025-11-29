import OpenAI from 'openai';

let deepseekClient: OpenAI | null = null;

export function initDeepSeek(apiKey: string): void {
    deepseekClient = new OpenAI({
        apiKey,
        baseURL: 'https://api.deepseek.com',
        dangerouslyAllowBrowser: true, // For client-side usage
    });
}

export function getDeepSeekClient(): OpenAI {
    if (!deepseekClient) {
        throw new Error('DeepSeek client not initialized. Please provide API key in settings.');
    }
    return deepseekClient;
}

export async function generateWithDeepSeek(
    prompt: string,
    systemPrompt?: string
): Promise<string> {
    const client = getDeepSeekClient();

    const response = await client.chat.completions.create({
        model: 'deepseek-chat',
        messages: [
            ...(systemPrompt ? [{ role: 'system' as const, content: systemPrompt }] : []),
            { role: 'user' as const, content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 2000,
    });

    return response.choices[0]?.message?.content || '';
}

export async function generateStructuredOutput<T>(
    prompt: string,
    systemPrompt: string,
    schema?: any
): Promise<T> {
    const client = getDeepSeekClient();

    const response = await client.chat.completions.create({
        model: 'deepseek-chat',
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt },
        ],
        temperature: 0.3, // Lower temperature for structured output
        max_tokens: 3000,
        response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content || '{}';
    return JSON.parse(content) as T;
}
