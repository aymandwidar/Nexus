# Nexus - AI-Powered Spending Management

A comprehensive financial management Progressive Web App focused on spending optimization, featuring advanced AI capabilities and beautiful Liquid Glass UI.

![Nexus](./public/icon-512.png)

## ✨ Features

### 🤖 Multi-AI Architecture
- **DeepSeek**: Advanced financial reasoning, budgeting, forecasting
- **Groq**: Real-time conversational UI, instant alerts
- **Gemini**: Multimodal processing (OCR, image recognition, price grounding)

### 💰 Core Features
- **Hyper-Personalized Budgeting**: AI-generated budgets based on your actual spending patterns
- **Cash Flow Forecasting**: 3/6/12-month projections with proactive alerts
- **Burn Rate Analysis**: Track spending efficiency in real-time
- **Phantom Spend Detection**: Identify high-frequency, low-value drains
- **Multi-Format Import**: CSV, QIF, and PDF bank statements (AI-powered OCR)

### 📱 PWA Optimized for iPhone
- Full offline support with IndexedDB
- Installable as standalone app
- iOS safe areas and touch-optimized UI
- Liquid Glass design with vibrant gradients

## 🚀 Getting Started

### Prerequisites
You'll need API keys from:
- [DeepSeek](https://platform.deepseek.com) - For financial reasoning
- [Groq](https://console.groq.com) - For real-time responses
- [Gemini](https://makersuite.google.com/app/apikey) - For OCR and multimodal

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
npm start
```

Visit `http://localhost:3000` and configure your API keys in Settings.

## 📖 Usage

1. **Configure API Keys**: Go to Settings and add your DeepSeek, Groq, and Gemini API keys
2. **Upload Transactions**: Upload CSV, QIF, or PDF bank statements
3. **View Insights**: Get AI-powered budget recommendations and forecasts
4. **Track Spending**: Monitor your Burn Rate and detect Phantom Spend

## 🏗️ Architecture

- **Framework**: Next.js 14 with TypeScript
- **Styling**: Vanilla CSS with Liquid Glass design system
- **Database**: IndexedDB (client-side, offline-first)
- **AI**: Multi-model orchestration with fallback logic
- **PWA**: next-pwa for service worker and offline support

## 🔒 Privacy

All your financial data is stored locally in your browser using IndexedDB. API keys are never sent to any server except the respective AI providers. Your data remains private and under your control.

## 📄 License

MIT License - feel free to use and modify as needed.
