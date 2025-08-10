export const isDevelopment =
    (typeof import.meta !== "undefined" &&
        (import.meta as any).env &&
        (import.meta as any).env.MODE === "development") ||
    (typeof process !== "undefined" &&
        process.env &&
        process.env.NODE_ENV === "development");

export const logger = {
    log: (...args: unknown[]) => {
        if (isDevelopment) console.log(...args);
    },
    info: (...args: unknown[]) => {
        if (isDevelopment) console.info(...args);
    },
    warn: (...args: unknown[]) => {
        if (isDevelopment) console.warn(...args);
    },
    error: (...args: unknown[]) => {
        // On conserve les erreurs en prod pour faciliter le support
        console.error(...args);
    },
};

export default logger;
