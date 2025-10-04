import { useState, useEffect } from 'react';
import { UserCategory, getUserCategory, setUserCategory, clearUserCategory } from '../utils/categoryUtils';

export const useUserCategory = () => {
  const [category, setCategory] = useState<UserCategory | null>(null);

  useEffect(() => {
    const storedCategory = getUserCategory();
    setCategory(storedCategory);
  }, []);

  const updateCategory = (newCategory: UserCategory) => {
    setUserCategory(newCategory);
    setCategory(newCategory);
  };

  const clearCategory = () => {
    clearUserCategory();
    setCategory(null);
  };

  return {
    category,
    updateCategory,
    clearCategory,
    hasCategory: category !== null
  };
};