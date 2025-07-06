export interface RemoteCharactersPresetsList {
    body: Body;
    path: string;
    query: string;
    cookies: any[];
}

export interface Body {
    hasPrevPage: boolean;
    hasNextPage: boolean;
    rows: Row[];
}

export interface Row {
    id: string;
    createdAt: Date;
    title: string;
    tags: any[];
    user: User;
    previewUrl: string;
    dnaUrl: string;
    _count: Count;
}

export interface Count {
    characterDownloads: number;
    characterLikes: number;
}

export interface User {
    id: string;
    name: string;
    image: string;
    starCitizenHandle: string;
}

export interface LocalCharacter {
    name: string;
    path: string;
    version: string;
}

export interface LocalCharactersResult {
    characters: LocalCharacter[];
}
