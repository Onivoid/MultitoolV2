import { create } from "zustand";

type AdminStore = {
    visible: boolean;
    show: () => void;
    hide: () => void;
};

export const useAdminStore = create<AdminStore>((set) => ({
    visible: false,
    show: () => set({ visible: true }),
    hide: () => set({ visible: false }),
}));
