export type UserCategory = 'men' | 'women' | 'unisex';

export const getUserCategory = (): UserCategory | null => {
  const category = localStorage.getItem('smartq_user_category');
  return category as UserCategory | null;
};

export const setUserCategory = (category: UserCategory): void => {
  localStorage.setItem('smartq_user_category', category);
};

export const clearUserCategory = (): void => {
  localStorage.removeItem('smartq_user_category');
};

export const getCategoryDisplayName = (category: UserCategory): string => {
  switch (category) {
    case 'men':
      return 'Men';
    case 'women':
      return 'Women';
    case 'unisex':
      return 'Unisex';
    default:
      return 'Unknown';
  }
};

export const getCategoryDescription = (category: UserCategory): string => {
  switch (category) {
    case 'men':
      return 'Grooming & styling services for men';
    case 'women':
      return 'Beauty & wellness services for women';
    case 'unisex':
      return 'Services for everyone';
    default:
      return '';
  }
};