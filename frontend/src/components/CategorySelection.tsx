import { useState, useEffect } from 'react';
import { UserCategory, getCategoryDisplayName } from '../utils/categoryUtils';
import { Check } from 'lucide-react';

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
        color: 'from-blue-500 to-blue-600',
        image: '/men.jpeg'
      },
      {
        id: 'women',
        title: getCategoryDisplayName('women'),
        color: 'from-pink-500 to-pink-600',
        image: '/women.jpeg'
      },
      {
        id: 'unisex',
        title: getCategoryDisplayName('unisex'),
        color: 'from-purple-500 to-purple-600',
        image: '/unisex.jpeg'
      }
    ];

  return (
    <div className="fixed inset-0 z-50  overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src="/4.png"
          alt="Background"
          className="w-full h-full object-cover"
        />

      </div>

      {/* Content */}
      <div className="relative flex flex-col h-full overflow-y-auto">
        {/* Main Content */}
        <div className="flex-1 flex flex-col justify-center items-center px-4 py-6 min-h-full">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <img
              src="/loadlogo.png"
              alt="SmartQ Logo"
              className="h-20 w-auto drop-shadow-2xl"
            />
          </div>

          {/* Selection Card */}
          <div className="w-full max-w-md bg-white/95 backdrop-blur-md rounded-2xl px-5 py-6 shadow-2xl border border-white/20">
            {/* Header */}
            <div className="mb-6 text-center">
              <h1 className="text-xl font-bold text-gray-900 mb-1.5">Choose Your Category</h1>
              <p className="text-gray-500 text-xs leading-relaxed">
                Select your preferred salon category
              </p>
            </div>

            {/* Category Options */}
            <div className="space-y-2.5">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleCategoryClick(category.id)}
                  className={`w-full p-3 rounded-xl border-2 transition-all duration-300 ${selectedCategory === category.id
                    ? 'border-teal-500 bg-teal-50 shadow-lg scale-[1.02]'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Category Image */}
                    <div className={`relative w-14 h-14 rounded-full overflow-hidden flex-shrink-0 shadow-md ${selectedCategory === category.id ? 'ring-2 ring-teal-500 ring-offset-2' : ''
                      }`}>
                      <img
                        src={category.image}
                        alt={category.title}
                        className="w-full h-full object-cover"
                      />
                      {selectedCategory === category.id && (
                        <div className="absolute inset-0 bg-teal-500/20 flex items-center justify-center">
                          <div className="w-5 h-5 bg-teal-500 rounded-full flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Category Info */}
                    <div className="flex-1 text-left min-w-0">
                      <h3 className={`text-base font-bold transition-colors ${selectedCategory === category.id ? 'text-teal-700' : 'text-gray-900'
                        }`}>
                        {category.title}
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">
                        {category.id === 'men' && 'Barbershops & Men\'s Grooming'}
                        {category.id === 'women' && 'Beauty Salons & Spas'}
                        {category.id === 'unisex' && 'All Services Available'}
                      </p>
                    </div>

                    {/* Selection Indicator */}
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${selectedCategory === category.id
                      ? 'border-teal-500 bg-teal-500'
                      : 'border-gray-300 bg-white'
                      }`}>
                      {selectedCategory === category.id && (
                        <Check className="w-3 h-3 text-white" />
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Info Note */}
            <div className="mt-4 p-2.5 bg-gray-50 border border-gray-200 rounded-xl">
              <p className="text-xs text-gray-600 text-center leading-relaxed">
                💡 Change this later in settings
              </p>
            </div>
          </div>

          {/* Trust Badge */}
          <div className="text-center mt-6">
            <p className="text-white/60 text-xs">
              🔒 Your preferences are saved securely
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
