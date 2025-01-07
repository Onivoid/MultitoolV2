import { create } from "zustand";
import { ThemeStore } from "@/types/theme-types";

export const useThemeStore = create<ThemeStore>((set) => ({
    primaryColor: "#6463b6",
    primaryColorChoices: [
        "#6463b6",
        "#3B3B98",
        "#B33771",
        "#FC427B",
        "#FEA47B",
    ],
    setPrimaryColor: (primaryColor) => set({ primaryColor }),
}));