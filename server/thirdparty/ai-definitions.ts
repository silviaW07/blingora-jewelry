/**
 * @file ai-definitions.ts
 * @description Defines the external interfaces for the AI model calling library.
 * Supports chat completion and image generation via OpenAI-compatible API format.
 * 
 * Usage Pattern:
 * 
 * 1. Get Provider:
 *    import { getAIProvider } from '@/thirdparty/ai/openai-compat';
 *    const ai = getAIProvider();
 * 
 * 2. Chat Completion (Server Action):
 *    const result = await ai.chatCompletion({
 *       messages: [
 *         { role: 'system', content: 'You are a helpful assistant.' },
 *         { role: 'user', content: userMessage }
 *       ],
 *       model: 'gpt-4o-mini',  // optional, uses default if not specified
 *    });
 *    return { reply: result.content };
 * 
 * 3. Image Generation (Server Action):
 *    const result = await ai.imageGeneration({
 *       prompt: 'A cute cat wearing a hat',
 *       model: 'dall-e-3',  // optional
 *       size: '1024x1024',  // optional
 *    });
 *    return { imageUrl: result.url };
 * 
 * Key Format Compatibility:
 * - OpenAI: sk-xxx (base_url: https://api.openai.com/v1)
 * - Claude via OpenAI-compat proxy: sk-ant-xxx or any key (custom base_url)
 * - Azure OpenAI: custom key format (custom base_url)
 * - 国内模型 (通义千问/文心/GLM): various key formats (custom base_url)
 * - OneAPI/NewAPI 中转: any key format (custom base_url)
 * 
 * All providers are accessed via the same OpenAI-compatible chat/completions endpoint.
 * Users only need to provide: API_KEY + optional BASE_URL + optional MODEL.
 */

export interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface ChatCompletionParams {
    /** Message history */
    messages: ChatMessage[];
    /** Model name (optional, uses THIRD_PARTY_AI_DEFAULT_MODEL from common.ts if not specified) */
    model?: string;
    /** Temperature (0-2, default 0.7) */
    temperature?: number;
    /** Max tokens to generate */
    maxTokens?: number;
    /** Whether to stream (default false, returns full result) */
    stream?: boolean;
}

export interface ChatCompletionResult {
    /** The generated text content */
    content: string;
    /** Model used */
    model: string;
    /** Token usage info */
    usage?: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
}

export interface ImageGenerationParams {
    /** Text description of the image to generate */
    prompt: string;
    /** Model name (optional, uses THIRD_PARTY_AI_IMAGE_DEFAULT_MODEL from common.ts if not specified) */
    model?: string;
    /** Image size (default '1024x1024'). Standard: '256x256', '512x512', '1024x1024', '1792x1024', '1024x1792'. Volcengine also supports '2K'. */
    size?: '256x256' | '512x512' | '1024x1024' | '1792x1024' | '1024x1792' | '2K' | string;
    /** Number of images to generate (default 1) */
    n?: number;
    /** Response format */
    responseFormat?: 'url' | 'b64_json';
    /** Whether to add watermark (Volcengine-specific, optional) */
    watermark?: boolean;
}

export interface ImageGenerationResult {
    /** URL of the generated image */
    url: string;
    /** Base64 encoded image (if responseFormat is 'b64_json') */
    b64Json?: string;
    /** Revised prompt (if model supports it) */
    revisedPrompt?: string;
}

export interface ThirdPartyAIProvider {
    /**
     * Send a chat completion request.
     */
    chatCompletion(params: ChatCompletionParams): Promise<ChatCompletionResult>;

    /**
     * Generate an image from text prompt.
     */
    imageGeneration(params: ImageGenerationParams): Promise<ImageGenerationResult>;
}

export type GetAIProvider = () => ThirdPartyAIProvider;
