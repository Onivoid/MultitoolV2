export interface GamePaths {
    versions: {
        LIVE: {
            path: string;
            translated: boolean;
            up_to_date: boolean;
        };
        PTU?: {
            path: string;
            translated: boolean;
            up_to_date: boolean;
        };
        EPTU?: {
            path: string;
            translated: boolean;
            up_to_date: boolean;
        };
        "TECH-PREVIEW"?: {
            path: string;
            translated: boolean;
            up_to_date: boolean;
        };
    };
}

export interface Link {
    id: number;
    name: string;
    url: string;
}

export interface LanguageConfig {
    folder: string;
    enabled: boolean;
    links: Link[];
}

export interface LocalizationConfig {
    fr: LanguageConfig;
    de: LanguageConfig;
    ita: LanguageConfig;
    es: LanguageConfig;
    en: LanguageConfig;
}

export const isLocalizationConfig = (
    value: any,
): value is LocalizationConfig => {
    return (
        value &&
        typeof value === "object" &&
        value.fr &&
        typeof value.fr === "object"
    );
};

export interface TranslationsChoosen {
    LIVE: string | null;
    PTU: string | null;
    EPTU: string | null;
    "TECH-PREVIEW": string | null;
    "4.0_PREVIEW": string | null;
    "HOTFIX": string | null;
}

export const isGamePaths = (value: any): value is GamePaths => {
    return (
        value &&
        typeof value === "object" &&
        value.versions &&
        typeof value.versions === "object"
    );
};