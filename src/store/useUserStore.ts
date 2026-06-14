import { create } from 'zustand';
import type { User, UserRole } from '@/types';
import { mockUsers } from '@/data/misc';

interface UserState {
  currentUser: User | null;
  currentRole: UserRole;
  users: User[];
  login: (phone: string) => boolean;
  logout: () => void;
  switchRole: (role: UserRole) => void;
  setCurrentUser: (user: User) => void;
}

export const useUserStore = create<UserState>((set, get) => ({
  currentUser: mockUsers[0],
  currentRole: 'visitor',
  users: mockUsers,
  
  login: (phone: string) => {
    const user = get().users.find(u => u.phone === phone);
    if (user) {
      set({ currentUser: user, currentRole: user.role });
      return true;
    }
    return false;
  },
  
  logout: () => {
    set({ currentUser: null, currentRole: 'visitor' });
  },
  
  switchRole: (role: UserRole) => {
    const users = get().users;
    const user = users.find(u => u.role === role);
    if (user) {
      set({ currentUser: user, currentRole: role });
    }
  },
  
  setCurrentUser: (user: User) => {
    set({ currentUser: user, currentRole: user.role });
  },
}));
