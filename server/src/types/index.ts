// Cloudflare Workers environment bindings for the application
export type Bindings = {
    NODE_ENV: string;
    DB_HOST: string;
    DB_PORT: string;
    DB_USER: string;
    DB_PASSWORD: string;
    DB_NAME: string;
    DB_SSL?: string;
    DATABASE_URL?: string;
    SECRET_KEY?: string;
};

// Context type for Hono with our bindings
export type AppContext = {
    Bindings: Bindings;
};
