/**
 * @file openai-compat.ts
 * @description OpenAI-compatible AI provider implementation.
 */
import { resolveAiImageSecrets, resolveAiSecrets } from '../secret-resolver';
import { ThirdPartyAIProvider, ChatCompletionParams, ChatCompletionResult, ImageGenerationParams, ImageGenerationResult } from '../ai-definitions';

export const provider: ThirdPartyAIProvider = {
    chatCompletion,
    imageGeneration,
};

export function getAIProvider(): ThirdPartyAIProvider {
    return provider;
}

export async function chatCompletion(params: ChatCompletionParams): Promise<ChatCompletionResult> {
    const {
        messages,
        model,
        temperature = 0.7,
        maxTokens,
        stream = false,
    } = params;

    const aiSecrets = resolveAiSecrets();
    if (!aiSecrets.apiKey) {
        throw new Error('THIRD_PARTY_AI_API_KEY is not configured. Please set it in server/thirdparty/common.ts');
    }

    const url = `${aiSecrets.baseUrl}/chat/completions`;
    const resolvedModel = model || aiSecrets.defaultModel;

    const body: any = {
        model: resolvedModel,
        messages,
        temperature,
        stream,
    };
    if (maxTokens) {
        body.max_tokens = maxTokens;
    }

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${aiSecrets.apiKey}`,
        },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`AI API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    const choice = data.choices?.[0];
    if (!choice) {
        throw new Error('AI API returned no choices');
    }

    return {
        content: choice.message?.content || '',
        model: data.model || resolvedModel,
        usage: data.usage ? {
            promptTokens: data.usage.prompt_tokens || 0,
            completionTokens: data.usage.completion_tokens || 0,
            totalTokens: data.usage.total_tokens || 0,
        } : undefined,
    };
}

export async function imageGeneration(params: ImageGenerationParams): Promise<ImageGenerationResult> {
    const {
        prompt,
        model,
        size = '1024x1024',
        n = 1,
        responseFormat = 'url',
        watermark,
    } = params;

    const imageSecrets = resolveAiImageSecrets();
    const chatSecrets = resolveAiSecrets();
    const apiKey = imageSecrets.apiKey || chatSecrets.apiKey;
    const baseUrl = imageSecrets.baseUrl || chatSecrets.baseUrl;
    const defaultModel = imageSecrets.defaultModel || 'dall-e-3';

    if (!apiKey) {
        throw new Error('AI Image API key is not configured. Please set THIRD_PARTY_AI_IMAGE_API_KEY or THIRD_PARTY_AI_API_KEY in server/thirdparty/common.ts');
    }

    const url = `${baseUrl}/images/generations`;
    const body: Record<string, unknown> = {
        model: model || defaultModel,
        prompt,
        size,
        n,
        response_format: responseFormat,
    };

    if (watermark !== undefined) {
        body.watermark = watermark;
    }

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`AI Image API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    const image = data.data?.[0];
    if (!image) {
        throw new Error('AI Image API returned no images');
    }

    return {
        url: image.url || '',
        b64Json: image.b64_json,
        revisedPrompt: image.revised_prompt,
    };
}
