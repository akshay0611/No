import { useState } from "react";
import { Star, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { salonRating: number; serviceRating: number; comment: string }) => void;
  salonName: string;
  serviceName: string;
  isSubmitting?: boolean;
}

export default function ReviewModal({
  isOpen,
  onClose,
  onSubmit,
  salonName,
  serviceName,
  isSubmitting = false
}: ReviewModalProps) {
  const [salonRating, setSalonRating] = useState(0);
  const [serviceRating, setServiceRating] = useState(0);
  const [hoveredSalonStar, setHoveredSalonStar] = useState(0);
  const [hoveredServiceStar, setHoveredServiceStar] = useState(0);
  const [comment, setComment] = useState("");

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (salonRating === 0 || serviceRating === 0) {
      return;
    }
    onSubmit({ salonRating, serviceRating, comment });
  };

  const renderStars = (
    rating: number,
    setRating: (rating: number) => void,
    hoveredStar: number,
    setHoveredStar: (star: number) => void,
    testId: string
  ) => {
    return (
      <div className="flex items-center justify-center gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoveredStar(star)}
            onMouseLeave={() => setHoveredStar(0)}
            className="transition-transform hover:scale-110 active:scale-95 focus:outline-none"
            data-testid={`${testId}-star-${star}`}
          >
            <Star
              className={`w-10 h-10 md:w-12 md:h-12 transition-colors ${
                star <= (hoveredStar || rating)
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto border-2 border-teal-100 shadow-2xl animate-scale-in">
        <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50 border-b-2 border-teal-100 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/50 rounded-full transition-colors"
            data-testid="button-close-review"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
          <CardTitle className="text-2xl md:text-3xl font-bold text-gray-900 pr-10">
            Rate Your Experience
          </CardTitle>
          <p className="text-gray-600 mt-2">
            Help others by sharing your feedback
          </p>
        </CardHeader>

        <CardContent className="pt-6 space-y-6">
          {/* Salon Rating */}
          <div className="space-y-3">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                How was {salonName}?
              </h3>
              <p className="text-sm text-gray-600">Rate the overall salon experience</p>
            </div>
            {renderStars(
              salonRating,
              setSalonRating,
              hoveredSalonStar,
              setHoveredSalonStar,
              'salon'
            )}
            {salonRating > 0 && (
              <p className="text-center text-sm font-medium text-teal-600 animate-fade-in">
                {salonRating === 5 && "Excellent! 🌟"}
                {salonRating === 4 && "Great! 👍"}
                {salonRating === 3 && "Good 👌"}
                {salonRating === 2 && "Could be better 😐"}
                {salonRating === 1 && "Needs improvement 😞"}
              </p>
            )}
          </div>

          {/* Divider */}
          <div className="border-t-2 border-dashed border-gray-200"></div>

          {/* Service Rating */}
          <div className="space-y-3">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                How was the service?
              </h3>
              <p className="text-sm text-gray-600">{serviceName}</p>
            </div>
            {renderStars(
              serviceRating,
              setServiceRating,
              hoveredServiceStar,
              setHoveredServiceStar,
              'service'
            )}
            {serviceRating > 0 && (
              <p className="text-center text-sm font-medium text-teal-600 animate-fade-in">
                {serviceRating === 5 && "Perfect service! ✨"}
                {serviceRating === 4 && "Very good! 💯"}
                {serviceRating === 3 && "Satisfactory ✓"}
                {serviceRating === 2 && "Below expectations 📉"}
                {serviceRating === 1 && "Poor service 📛"}
              </p>
            )}
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-900">
              Share your thoughts (optional)
            </label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell us about your experience... What did you love? What could be improved?"
              className="min-h-[100px] resize-none"
              data-testid="textarea-review-comment"
            />
            <p className="text-xs text-gray-500">
              {comment.length}/500 characters
            </p>
          </div>

          {/* Submit Button */}
          <div className="space-y-3 pt-4">
            <Button
              onClick={handleSubmit}
              disabled={salonRating === 0 || serviceRating === 0 || isSubmitting}
              className="w-full min-h-[56px] text-lg font-bold bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-lg transition-all"
              data-testid="button-submit-review"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Submitting...</span>
                </div>
              ) : (
                'Submit Review'
              )}
            </Button>
            
            {(salonRating === 0 || serviceRating === 0) && (
              <p className="text-center text-sm text-red-600 animate-fade-in">
                Please rate both the salon and service to continue
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scale-in {
          from {
            transform: scale(0.9);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }

        .animate-scale-in {
          animation: scale-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
      `}</style>
    </div>
  );
}
