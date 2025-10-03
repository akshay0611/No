import { useState } from 'react';

interface IntroScreenProps {
    onNext: () => void;
    onSignIn: () => void;
}

interface IntroSlide {
    image: string;
    title: string;
    description: string;
}

const introSlides: IntroSlide[] = [
    {
        image: "/intro1.png", // Placeholder image
        title: "Meet Our Specialists",
        description: "There are many best stylists from all the best salons ever"
    },
    {
        image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80", // Placeholder image  
        title: "Expert Services",
        description: "Professional styling and beauty treatments tailored just for you"
    },
    {
        image: "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80", // Placeholder image
        title: "Book Anytime",
        description: "Schedule appointments with your favorite specialists at your convenience"
    }
];

export default function IntroScreen({ onNext, onSignIn }: IntroScreenProps) {
    const [currentSlide, setCurrentSlide] = useState(0);

    const handleNext = () => {
        if (currentSlide < introSlides.length - 1) {
            setCurrentSlide(currentSlide + 1);
        } else {
            onSignIn(); // Redirect to sign-in flow when "Get Started" is clicked
        }
    };

    const goToSlide = (index: number) => {
        setCurrentSlide(index);
    };

    const currentSlideData = introSlides[currentSlide];

    return (
        <div className="fixed inset-0 z-50 bg-black overflow-hidden">
            {/* Background Image */}
            <div className="absolute inset-0">
                <img
                    src={currentSlideData.image}
                    alt="Specialist"
                    className="w-full h-full object-cover"
                />
                {/* Dark overlay for better text readability */}
                <div className="absolute inset-0 bg-black/40"></div>
            </div>

            {/* Bottom gradient shadow overlay */}
            <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-black/100 via-black/60 to-transparent pointer-events-none"></div>

            {/* Content */}
            <div className="relative flex flex-col h-full">
                {/* Main content area */}
                <div className="flex-1 flex flex-col pb-10 justify-end px-6">
                    {/* Title and Description - positioned at bottom */}
                    <div className="text-center text-white mb-4">
                        <h1 className="text-3xl font-bold mb-2 leading-tight">
                            {currentSlideData.title}
                        </h1>
                        <p className="text-medium text-white/90 leading-relaxed max-w-sm mx-auto">
                            {currentSlideData.description}
                        </p>
                    </div>

                    {/* Pagination Dots */}
                    <div className="flex justify-center space-x-2 mb-4">
                        {introSlides.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => goToSlide(index)}
                                className={`w-3 h-3 rounded-full transition-all duration-300 ${index === currentSlide
                                    ? 'bg-orange-500 w-8'
                                    : 'bg-white/50'
                                    }`}
                            />
                        ))}
                    </div>

                    {/* Next Button */}
                    <div className="mb-2">
                        <button
                            onClick={handleNext}
                            className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-4 rounded-full transition-colors duration-200 text-lg"
                        >
                            {currentSlide < introSlides.length - 1 ? 'Next' : 'Get Started'}
                        </button>
                    </div>
                </div>

                {/* Bottom Sign In Link */}
                <div className="pb-4 px-6 relative z-10">
                    <div className="text-center py-3 px-4">
                        <span className="text-white text-medium">
                            Already have an account?
                        </span>
                        <button
                            onClick={onSignIn}
                            className="text-orange-500 font-semibold hover:text-orange-400 transition-colors duration-200 text-medium ml-1"
                        >
                            Sign In
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}