import { generateWithDeepSeek, generateStructuredOutput } from './deepseekClient';
import { generateWithGroq, streamWithGroq } from './groqClient';
import { generateWithGemini, analyzeImage, extractTextFromPDF, searchWithGrounding } from './geminiClient';

export type AIModel = 'deepseek' | 'groq' | 'gemini';

export interface AIRequest {
    task: 'reasoning' | 'conversation' | 'multimodal' | 'search';
    prompt: string;
    systemPrompt?: string;
    imageData?: string | Blob;
    pdfData?: string;
    stream?: boolean;
    onChunk?: (chunk: string) => void;
}

export interface AIResponse {
    content: string;
    model: AIModel;
    fallback?: boolean;
}

/**
 * AI Orchestrator - Routes tasks to appropriate models with fallback logic
 * 
 * Routing Strategy:
 * - DeepSeek: Complex financial reasoning, budgeting, forecasting, analysis
 * - Groq: Real-time conversational responses, narratives, alerts
 * - Gemini: Multimodal (images, PDFs), grounded search
 */
export async function orchestrateAI(request: AIRequest): Promise<AIResponse> {
    const { task, prompt, systemPrompt, imageData, pdfData, stream, onChunk } = request;

    try {
        // Route based on task type
        switch (task) {
            case 'reasoning':
                // DeepSeek for complex analysis
                const reasoningResult = await generateWithDeepSeek(prompt, systemPrompt);
                return { content: reasoningResult, model: 'deepseek' };

            case 'conversation':
                // Groq for fast conversational responses
                if (stream && onChunk) {
                    const streamResult = await streamWithGroq(prompt, systemPrompt, onChunk);
                    return { content: streamResult, model: 'groq' };
                } else {
                    const conversationResult = await generateWithGroq(prompt, systemPrompt);
                    return { content: conversationResult, model: 'groq' };
                }

            case 'multimodal':
                // Gemini for image/PDF processing
                if (imageData) {
                    const imageResult = await analyzeImage(imageData, prompt);
                    return { content: imageResult, model: 'gemini' };
                } else if (pdfData) {
                    const pdfResult = await extractTextFromPDF(pdfData, prompt);
                    return { content: pdfResult, model: 'gemini' };
                } else {
                    throw new Error('Multimodal task requires imageData or pdfData');
                }

            case 'search':
                // Gemini with grounded search
                const searchResult = await searchWithGrounding(prompt);
                return { content: searchResult, model: 'gemini' };

            default:
                throw new Error(`Unknown task type: ${task}`);
        }
    } catch (error) {
        console.error(`Primary model failed for ${task}:`, error);

        // Fallback logic
        return await fallbackAI(request, error);
    }
}

/**
 * Fallback strategy when primary model fails
 */
async function fallbackAI(request: AIRequest, originalError: unknown): Promise<AIResponse> {
    const { task, prompt, systemPrompt } = request;

    console.log(`Attempting fallback for task: ${task}`);

    try {
        // Fallback hierarchy based on task
        switch (task) {
            case 'reasoning':
                // DeepSeek failed, try Gemini for complex reasoning
                const geminiReasoning = await generateWithGemini(
                    systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt
                );
                return { content: geminiReasoning, model: 'gemini', fallback: true };

            case 'conversation':
                // Groq failed, try Gemini
                const geminiConversation = await generateWithGemini(
                    systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt
                );
                return { content: geminiConversation, model: 'gemini', fallback: true };

            case 'multimodal':
            case 'search':
                // Gemini failed, try DeepSeek as last resort (without multimodal)
                const deepseekFallback = await generateWithDeepSeek(prompt, systemPrompt);
                return { content: deepseekFallback, model: 'deepseek', fallback: true };

            default:
                throw originalError;
        }
    } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
        const fallbackErrorMessage = fallbackError instanceof Error ? fallbackError.message : 'Unknown error';
        const originalErrorMessage = originalError instanceof Error ? originalError.message : 'Unknown error';
        throw new Error(`All AI models failed. Original: ${originalErrorMessage}, Fallback: ${fallbackErrorMessage}`);
    }
}

/**
 * Generate structured output with schema validation
 */
export async function generateStructured<T>(
    prompt: string,
    systemPrompt: string,
    schema?: any
): Promise<T> {
    try {
        return await generateStructuredOutput<T>(prompt, systemPrompt, schema);
    } catch (error) {
        console.error('Structured generation failed:', error);
        // Fallback to Gemini with JSON parsing
        const result = await generateWithGemini(`${systemPrompt}\n\n${prompt}\n\nRespond with valid JSON only.`);
        return JSON.parse(result) as T;
    }
}
