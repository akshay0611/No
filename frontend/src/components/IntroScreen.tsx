import { useState } from 'react';
import { Sparkles, Clock, Gift, Users } from 'lucide-react';

interface IntroScreenProps {
    onNext: () => void;
    onSignIn: () => void;
}

interface IntroSlide {
    image: string;
    title: string;
    description: string;
    icon: any;
}

const introSlides: IntroSlide[] = [
    {
        image: "/1.png",
        title: "Find Top Salons Near You",
        description: "Discover trusted stylists & exclusive offers — all in one app.",
        icon: Sparkles
    },
    {
        image: "/2.png",
        title: "Book in Seconds, Skip the Wait",
        description: "Choose your stylist, set your time, and walk right in.",
        icon: Clock
    },
    {
        image: "/3.png",
        title: "Earn Rewards. Look Good. Feel Great.",
        description: "Get points & offers every time you book with AltQ.",
        icon: Gift
    }
];

export default function IntroScreen({ onNext, onSignIn }: IntroScreenProps) {
    const [currentSlide, setCurrentSlide] = useState(0);

    const handleNext = () => {
        if (currentSlide < introSlides.length - 1) {
            setCurrentSlide(currentSlide + 1);
        } else {
            onSignIn();
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
                    alt="Salon Experience"
                    className="w-full h-full object-cover"
                />
                {/* Dark gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/30 to-black/50"></div>
            </div>

            {/* Content */}
            <div className="relative flex flex-col h-full">
                {/* Skip Button */}
                <div className="absolute top-6 right-6 z-20">
                    <button
                        onClick={onSignIn}
                        className="text-white/70 hover:text-white font-medium text-sm px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm transition-all"
                    >
                        Skip
                    </button>
                </div>

                {/* Logo at top */}
                {/* <div className="absolute top-6 left-6 z-20">
                    <div className="text-white font-bold text-xl tracking-wider">
                        SmartQ
                    </div>
                </div> */}

                {/* Main content area */}
                <div className="flex-1 flex flex-col justify-center items-center px-8 py-20">
                    {/* Title and Description */}
                    <div className="text-center text-white max-w-sm mx-auto">
                        <h1 className={`font-extrabold mb-5 tracking-tight drop-shadow-2xl ${currentSlide === 0
                            ? 'text-[2.5rem] leading-[1.1]'
                            : 'text-[2rem] leading-[1.15]'
                            }`}>
                            {currentSlideData.title}
                        </h1>
                        <p className="text-[1.05rem] leading-[1.6] text-white/65 font-normal tracking-normal">
                            {currentSlideData.description}
                        </p>
                    </div>
                </div>

                {/* Bottom section */}
                <div className="px-6 pb-8 space-y-6">
                    {/* Pagination Dots */}
                    <div className="flex justify-center space-x-2">
                        {introSlides.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => goToSlide(index)}
                                className={`h-2 rounded-full transition-all duration-300 ${index === currentSlide
                                    ? 'bg-teal-400 w-8'
                                    : 'bg-white/30 w-2'
                                    }`}
                            />
                        ))}
                    </div>

                    {/* Next Button */}
                    <div className="w-full max-w-sm mx-auto">
                        <button
                            onClick={handleNext}
                            className="w-full bg-teal-500 hover:bg-teal-600 text-white font-semibold py-4 rounded-xl transition-all duration-200 text-base shadow-xl"
                        >
                            {currentSlide < introSlides.length - 1 ? 'Next' : 'Get Started'}
                        </button>
                    </div>

                    {/* Trust Badge */}
                    <div className="flex items-center justify-center gap-2 text-white/60 text-xs">
                        <Users className="w-3.5 h-3.5" />
                        <span>Trusted by 1000+ salon lovers across India </span>
                    </div>

                    {/* Bottom Sign In Link */}
                    <div className="text-center">
                        <span className="text-white/60 text-sm">
                            Already have an account?
                        </span>
                        <button
                            onClick={onSignIn}
                            className="text-teal-400 font-semibold hover:text-teal-300 transition-colors duration-200 text-sm ml-2"
                        >
                            Sign In
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
