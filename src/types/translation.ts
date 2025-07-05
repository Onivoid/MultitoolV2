export interface GamePaths {
    versions: {
        [key: string]: {
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

export interface TranslationOption {
    id: number;
    name: string;
    description: string;
    link: string;
}

export interface TranslationSetting {
    link: string | null;
    settingsEN: boolean;
}

export interface TranslationsChoosen {
    [key: string]: TranslationSetting | null;
}

export const isGamePaths = (value: any): value is GamePaths => {
    return (
        value &&
        typeof value === "object" &&
        value.versions &&
        typeof value.versions === "object"
    );
};
