import { analyzeImage, searchWithGrounding } from '../ai/geminiClient';
import { generateWithGroq } from '../ai/groqClient';
import type { ProcurementRecommendation, Budget } from '@/types';

export async function analyzeProcurement(
    imageData: string | Blob,
    budgets: Budget[]
): Promise<ProcurementRecommendation> {
    // Step 1: Identify the item using Gemini Vision
    const identificationPrompt = `Analyze this image and identify the product. Provide:
1. Product name
2. Estimated retail price
3. Category (e.g., Electronics, Clothing, Food, etc.)

Return JSON:
{
  "productName": "string",
  "estimatedPrice": number,
  "category": "string"
}`;

    const identificationResult = await analyzeImage(imageData, identificationPrompt);
    const itemData = JSON.parse(identificationResult);

    // Step 2: Ground the price using Google Search
    const priceSearchPrompt = `What is the current market price for: ${itemData.productName}`;
    const marketPriceResult = await searchWithGrounding(priceSearchPrompt);

    // Extract price from search result (simplified)
    const priceMatch = marketPriceResult.match(/\$([0-9,]+\.?\d*)/);
    const marketPrice = priceMatch ? parseFloat(priceMatch[1].replace(',', '')) : itemData.estimatedPrice;

    // Step 3: Find relevant budget
    const relevantBudget = budgets.find(b =>
        b.category.toLowerCase().includes(itemData.category.toLowerCase())
    );

    const budgetRemaining = relevantBudget
        ? relevantBudget.amount - (relevantBudget.amount * 0.5) // Simplified: assume 50% spent
        : 0;

    // Step 4: Generate recommendation using Groq (fast conversational response)
    const recommendationPrompt = `You are a financial advisor. A user is considering purchasing:

Product: ${itemData.productName}
Price: $${itemData.estimatedPrice}
Market Price: $${marketPrice}
Category: ${itemData.category}
Budget Remaining: $${budgetRemaining}

Provide a recommendation (buy/wait/avoid) with reasoning. Consider:
- Is the price fair compared to market?
- Does the user have budget remaining?
- Total Cost of Ownership (TCO) if applicable
- Suggest alternatives if avoiding

Keep response concise and actionable.`;

    const recommendation = await generateWithGroq(
        recommendationPrompt,
        'You are a helpful financial advisor focused on smart spending.'
    );

    // Determine recommendation type
    let recommendationType: 'buy' | 'wait' | 'avoid';
    if (budgetRemaining >= itemData.estimatedPrice && itemData.estimatedPrice <= marketPrice * 1.1) {
        recommendationType = 'buy';
    } else if (budgetRemaining < itemData.estimatedPrice) {
        recommendationType = 'avoid';
    } else {
        recommendationType = 'wait';
    }

    return {
        itemName: itemData.productName,
        identifiedPrice: itemData.estimatedPrice,
        marketPrice,
        budgetCategory: itemData.category,
        budgetRemaining,
        recommendation: recommendationType,
        reasoning: recommendation,
    };
}
