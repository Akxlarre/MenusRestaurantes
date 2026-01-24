import { atom } from 'nanostores';
import type { User } from '@supabase/supabase-js';

export const userStore = atom<User | null>(null);
export const isLoadingStore = atom<boolean>(true);

export function setUser(user: User | null) {
    userStore.set(user);
    isLoadingStore.set(false);
}
