export interface ThemeStore {
    primaryColor: string;
    primaryColorChoices: string[];
    setPrimaryColor: (primaryColor: string) => void;
}