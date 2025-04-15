export const config = {
    SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL as string,
    SUPABASE_KEY: import.meta.env.VITE_SUPABASE_KEY as string,
    PROGRAM_ID: import.meta.env.VITE_PROGRAM_ID as string,
    NETWORK: import.meta.env.VITE_NETWORK || 'testnet',
    MIN_STAKE: 1000,
    REWARD_RATE: 0.1,
    MAX_TASK_SIZE: 50 * 1024 * 1024 // 50MB
};
