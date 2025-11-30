import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

let geminiClient: GoogleGenerativeAI | null = null;
let visionModel: GenerativeModel | null = null;
let textModel: GenerativeModel | null = null;

export function initGemini(apiKey: string): void {
    geminiClient = new GoogleGenerativeAI(apiKey);
    visionModel = geminiClient.getGenerativeModel({ model: 'gemini-1.5-flash' });
    textModel = geminiClient.getGenerativeModel({ model: 'gemini-1.5-flash' });
}

export function getGeminiClient(): GoogleGenerativeAI {
    if (!geminiClient) {
        throw new Error('Gemini client not initialized. Please provide API key in settings.');
    }
    return geminiClient;
}

// === TEXT GENERATION ===
export async function generateWithGemini(prompt: string): Promise<string> {
    if (!textModel) {
        throw new Error('Gemini not initialized');
    }

    const result = await textModel.generateContent(prompt);
    const response = await result.response;
    return response.text();
}

// === IMAGE ANALYSIS ===
export async function analyzeImage(
    imageData: string | Blob,
    prompt: string
): Promise<string> {
    if (!visionModel) {
        throw new Error('Gemini not initialized');
    }

    let imagePart: any;

    if (typeof imageData === 'string') {
        // Base64 string
        imagePart = {
            inlineData: {
                data: imageData.split(',')[1], // Remove data:image/... prefix
                mimeType: 'image/jpeg',
            },
        };
    } else {
        // Blob
        const base64 = await blobToBase64(imageData);
        imagePart = {
            inlineData: {
                data: base64,
                mimeType: imageData.type,
            },
        };
    }

    const result = await visionModel.generateContent([prompt, imagePart]);
    const response = await result.response;
    return response.text();
}

// === PDF OCR ===
export async function extractTextFromPDF(
    pdfData: string,
    prompt: string = 'Extract all transaction data from this bank statement. For each transaction, provide: date, amount, and description.'
): Promise<string> {
    if (!visionModel) {
        throw new Error('Gemini not initialized');
    }

    const pdfPart = {
        inlineData: {
            data: pdfData.split(',')[1],
            mimeType: 'application/pdf',
        },
    };

    const result = await visionModel.generateContent([prompt, pdfPart]);
    const response = await result.response;
    return response.text();
}

// === EMBEDDINGS (for payee clustering) ===
export async function generateEmbedding(text: string): Promise<number[]> {
    if (!geminiClient) {
        throw new Error('Gemini not initialized');
    }

    const model = geminiClient.getGenerativeModel({ model: 'text-embedding-004' });
    const result = await model.embedContent(text);
    return result.embedding.values;
}

// === GROUNDED SEARCH (for price checking) ===
export async function searchWithGrounding(query: string): Promise<string> {
    if (!textModel) {
        throw new Error('Gemini client not initialized. Call initGemini() first.');
    }

    const prompt = `Search for current market information about: ${query}. Provide accurate, up-to-date pricing information based on your knowledge.`;

    const result = await textModel.generateContent(prompt);
    const response = await result.response;
    return response.text();
}

// === UTILITY FUNCTIONS ===
async function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64 = reader.result as string;
            resolve(base64.split(',')[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}
