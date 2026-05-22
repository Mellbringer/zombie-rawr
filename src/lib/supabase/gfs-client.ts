import { createBrowserClient } from "@supabase/ssr";

function createGFSClient() {
    const isProd = typeof window !== "undefined" && window.location.hostname.endsWith("gameforsmart.com");

    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookieOptions: {
                domain: isProd ? ".gameforsmart.com" : undefined,
                path: "/",
                sameSite: "lax",
                secure: isProd,
            },
            auth: {
                autoRefreshToken: false,
            }
        }
    );
}

export const supabase = createGFSClient();