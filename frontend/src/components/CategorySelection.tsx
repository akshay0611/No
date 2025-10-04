import { useState, useEffect } from 'react';
import { UserCategory, getCategoryDisplayName, getCategoryDescription } from '../utils/categoryUtils';

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
    description: string;
    color: string;
    image: string;
  }> = [
      {
        id: 'men',
        title: getCategoryDisplayName('men'),
        description: getCategoryDescription('men'),
        color: 'from-blue-400 to-blue-600',
        image: '/men.jpeg'
      },
      {
        id: 'women',
        title: getCategoryDisplayName('women'),
        description: getCategoryDescription('women'),
        color: 'from-pink-400 to-pink-600',
        image: '/women.jpeg'
      },
      {
        id: 'unisex',
        title: getCategoryDisplayName('unisex'),
        description: getCategoryDescription('unisex'),
        color: 'from-purple-400 to-purple-600',
        image: '/unisex.jpeg'
      }
    ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-600 to-teal-700 flex flex-col overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/20 rounded-full -translate-y-32 translate-x-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-800/20 rounded-full translate-y-24 -translate-x-24"></div>
      </div>

      {/* Logo Section */}
      <div className="relative z-10 pt-8 pb-6 px-6">
        <div className="max-w-md mx-auto">
          <img
            src="/loadlogo.png"
            alt="ALT.Q Logo"
            className="h-16 w-auto brightness-0 invert"
          />
        </div>
      </div>

      {/* Main Content Container */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-start px-6 pb-20">
        {/* Header */}
        <div className="text-center mb-10 max-w-md">
          <h1 className="text-4xl font-bold text-white mb-4">
            Choose Your Category
          </h1>
          <p className="text-teal-100 text-base leading-relaxed">
            Select the service category that best fits your needs
          </p>
        </div>

        {/* Category Grid - Men & Women */}
        <div className="grid grid-cols-2 gap-12 place-items-center w-full max-w-lg mb-12">
          {categories.slice(0, 2).map((category) => {
            return (
              <div
                key={category.id}
                onClick={() => handleCategoryClick(category.id)}
                className={`cursor-pointer transition-all duration-300 text-center ${selectedCategory === category.id ? 'scale-105' : 'hover:scale-105'
                  }`}
              >
                {/* Circle with Image/Icon */}
                <div className="relative mb-4">
                  <div
                    className={`w-40 h-40 rounded-full overflow-hidden shadow-2xl transition-all duration-300
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
                <h3 className="text-white text-2xl font-bold mb-2">
                  {category.title}
                </h3>
                <p className="text-teal-100 text-sm leading-relaxed px-2">
                  {category.description}
                </p>
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
            <div className="relative mb-4">
              <div
                className={`w-40 h-40 rounded-full overflow-hidden shadow-2xl transition-all duration-300
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
            <h3 className="text-white text-2xl font-bold mb-2">
              {categories[2].title}
            </h3>
            <p className="text-teal-100 text-sm leading-relaxed px-2">
              {categories[2].description}
            </p>
          </div>
        </div>
      </div>

      {/* Footer Note */}
      <div className="relative z-10 pb-6 px-6 text-center">
        <p className="text-teal-100 text-sm">
          You can change this selection later in your profile settings
        </p>
      </div>
    </div>
  );
}
