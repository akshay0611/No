import { useState, useEffect } from 'react';
import { UserCategory, getCategoryDisplayName } from '../utils/categoryUtils';

interface CategorySelectionProps {
  onCategorySelect: (category: UserCategory) => void;
}

export default function CategorySelection({ onCategorySelect }: CategorySelectionProps) {
  const [selectedCategory, setSelectedCategory] = useState<UserCategory | null>(null);

  useEffect(() => {
    console.log('CategorySelection: Component mounted');
  }, []);

  const handleCategoryClick = (category: UserCategory) => {
    console.log('CategorySelection: User clicked category:', category);
    setSelectedCategory(category);
    setTimeout(() => {
      console.log('CategorySelection: Calling onCategorySelect with:', category);
      onCategorySelect(category);
    }, 300);
  };

  const categories: Array<{
    id: UserCategory;
    title: string;
    color: string;
    image: string;
  }> = [
      {
        id: 'men',
        title: getCategoryDisplayName('men'),
        color: 'from-blue-400 to-blue-600',
        image: '/men.jpeg'
      },
      {
        id: 'women',
        title: getCategoryDisplayName('women'),
      
        color: 'from-pink-400 to-pink-600',
        image: '/women.jpeg'
      },
      {
        id: 'unisex',
        title: getCategoryDisplayName('unisex'),
        
        color: 'from-purple-400 to-purple-600',
        image: '/unisex.jpeg'
      }
    ];

  return (
    <div className="h-screen bg-gradient-to-br from-teal-600 to-teal-700 flex flex-col overflow-hidden relative">
      {/* Main Content Container */}
      <div className="relative z-10 flex flex-col h-full justify-between py-8 px-6">
        {/* Header */}
        <div className="text-center px-4">
          <h1 className="text-3xl font-bold text-white mb-3 whitespace-nowrap">
            Choose Your Category
          </h1>
        </div>

        {/* Category Grid - Men & Women */}
        <div className="grid grid-cols-2 gap-6 place-items-center w-full max-w-md mx-auto">
          {categories.slice(0, 2).map((category) => {
            return (
              <div
                key={category.id}
                onClick={() => handleCategoryClick(category.id)}
                className={`cursor-pointer transition-all duration-300 text-center ${selectedCategory === category.id ? 'scale-105' : 'hover:scale-105'
                  }`}
              >
                {/* Circle with Image/Icon */}
                <div className="relative mb-3">
                  <div
                    className={`w-32 h-32 rounded-full overflow-hidden shadow-2xl transition-all duration-300 bg-teal-100
                    ${selectedCategory === category.id ? 'ring-4 ring-white ring-opacity-50' : ''}`}
                  >
                    {/* Category Image */}
                    <img
                      src={category.image}
                      alt={category.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Selection Indicator */}
                  {selectedCategory === category.id && (
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg">
                      <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Category Info */}
                <h3 className="text-white text-2xl font-bold mb-1">
                  {category.title}
                </h3>
              </div>
            );
          })}
        </div>

        {/* Unisex Centered Below */}
        <div className="flex justify-center">
          <div
            onClick={() => handleCategoryClick(categories[2].id)}
            className={`cursor-pointer transition-all duration-300 text-center ${selectedCategory === categories[2].id ? 'scale-105' : 'hover:scale-105'
              }`}
          >
            {/* Circle with Image/Icon */}
            <div className="relative mb-3">
              <div
                className={`w-32 h-32 rounded-full overflow-hidden shadow-2xl transition-all duration-300 bg-teal-100
                ${selectedCategory === categories[2].id ? 'ring-4 ring-white ring-opacity-50' : ''}`}
              >
                {/* Category Image */}
                <img
                  src={categories[2].image}
                  alt={categories[2].title}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Selection Indicator */}
              {selectedCategory === categories[2].id && (
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>

            {/* Category Info */}
            <h3 className="text-white text-2xl font-bold mb-1">
              {categories[2].title}
            </h3>
          </div>
        </div>

        {/* Footer Note */}
        <div className="text-center px-4">
          <p className="text-teal-50 text-sm max-w-md mx-auto break-words">
            You can change this selection later in your profile settings
          </p>
        </div>
      </div>
    </div>
  );
}
