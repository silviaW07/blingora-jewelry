

/**
 * @file auth-definitions.ts
 * @description Defines the external interfaces and types for the third-party authentication library.
 * 
 * Usage Pattern:
 * 
 * 1. Get Provider:
 *    import { getAuthProvider } from '@/thirdparty/auth/google';
 *    const provider = getAuthProvider();
 * 
 * 2. Initiate Login (Server Action):
 *    // Generate Auth URL — redirect back to the SAME login page, not a new callback page
 *    const url = provider.getAuthUrl('/login?status=success', '/login?status=fail');
 *    return { url };
 * 
 * 3. Frontend Redirection:
 *    // OAuth URL is async — use openExternalLinkAsync in the user-gesture stack
 *    import { openExternalLinkAsync } from "@/lib/utils";
 *    openExternalLinkAsync(async () => {
 *      const result = await getGoogleLoginUrl(); // action wrapper
 *      return result.url;
 *    }, { onNavigate: () => setLoading(false), onError: () => setLoading(false) });
 * 
 * 4. Verify User (Callback Server Action):
 *    // Read auth_token from URL query after redirect (not OAuth code)
 *    const user = await provider.getAuthUser(authToken);
 *    if (user) {
 *       // Save to DB and create session
 *    }
 */

export type SupportedAuthProvider = 'google' ;

export interface ThirdPartyUser {
    id: string;
    displayName: string;
    email: string;
    photos?: { value: string }[];
    provider: string;
    _json?: any;
    [key: string]: any;
}

export interface ThirdPartyAuthProvider {
    /**
     * Generates the OAuth2 login URL.
     * @param successRedirectUrl - URL to redirect after success 本站内的相对路径，不要带http://host前缀, 需要添加query参数status=success
     * @param failedRedirectUrl - Optional URL to redirect after failure.本站内的相对路径，不要带http://host前缀, 需要添加query参数status=fail
     */
    getAuthUrl(successRedirectUrl: string, failedRedirectUrl?: string): string;
    
    /**
     * Retrieves the authenticated user from the auth token.
     * @param authToken - Optional encrypted token from URL query parameter (after OAuth redirect).
     *                     Falls back to cookie context if not provided (backward compat).
     * （回调页面中使用，调用之后把信息存储到本地数据库和 session 中）
     */
    getAuthUser(authToken?: string): Promise<ThirdPartyUser | null>;
}

/**
 * Factory to get an authentication provider.
 */
export type GetAuthProvider = (name: SupportedAuthProvider) => ThirdPartyAuthProvider;