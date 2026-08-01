export interface AuthState {
    provider: string;
    projectId: string;
    successRedirectUrl: string;
    failedRedirectUrl?: string;
    nonce?: string;
    oauthStatsMode?: 'prod' | 'test';
    credentialMode?: 'preview' | 'deploy';
    [key: string]: any;
}
