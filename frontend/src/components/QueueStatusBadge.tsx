import { Clock, Bell, MapPin, CheckCircle, Loader2, XCircle, AlertCircle } from "lucide-react";

type QueueStatus = 
  | 'waiting' 
  | 'notified' 
  | 'pending_verification' 
  | 'nearby' 
  | 'in-progress' 
  | 'completed' 
  | 'no-show';

interface QueueStatusBadgeProps {
  status: QueueStatus;
  className?: string;
}

interface StatusConfig {
  label: string;
  icon: React.ReactNode;
  bgColor: string;
  textColor: string;
  borderColor: string;
  description: string;
}

const statusConfigs: Record<QueueStatus, StatusConfig> = {
  waiting: {
    label: "Waiting",
    icon: <Clock className="w-4 h-4" />,
    bgColor: "bg-gray-100",
    textColor: "text-gray-700",
    borderColor: "border-gray-300",
    description: "You're in the queue. The salon will notify you when it's almost your turn.",
  },
  notified: {
    label: "Notified",
    icon: <Bell className="w-4 h-4" />,
    bgColor: "bg-blue-100",
    textColor: "text-blue-700",
    borderColor: "border-blue-300",
    description: "The salon has notified you. Please head to the salon and check in when you arrive.",
  },
  pending_verification: {
    label: "Verifying",
    icon: <AlertCircle className="w-4 h-4" />,
    bgColor: "bg-yellow-100",
    textColor: "text-yellow-700",
    borderColor: "border-yellow-300",
    description: "Your arrival is being verified. Please wait for confirmation or show this to staff.",
  },
  nearby: {
    label: "Nearby",
    icon: <MapPin className="w-4 h-4" />,
    bgColor: "bg-green-100",
    textColor: "text-green-700",
    borderColor: "border-green-300",
    description: "Your arrival is confirmed. The salon will call you shortly to start your service.",
  },
  "in-progress": {
    label: "In Progress",
    icon: <Loader2 className="w-4 h-4 animate-spin" />,
    bgColor: "bg-purple-100",
    textColor: "text-purple-700",
    borderColor: "border-purple-300",
    description: "Your service is currently in progress. Enjoy your experience!",
  },
  completed: {
    label: "Completed",
    icon: <CheckCircle className="w-4 h-4" />,
    bgColor: "bg-green-100",
    textColor: "text-green-700",
    borderColor: "border-green-300",
    description: "Your service is complete. Thank you for visiting!",
  },
  "no-show": {
    label: "No Show",
    icon: <XCircle className="w-4 h-4" />,
    bgColor: "bg-red-100",
    textColor: "text-red-700",
    borderColor: "border-red-300",
    description: "You were marked as no-show. This may affect your reputation score.",
  },
};

export default function QueueStatusBadge({ status, className = "" }: QueueStatusBadgeProps) {
  const config = statusConfigs[status];

  if (!config) {
    return null;
  }

  return (
    <div className={`group relative inline-flex ${className}`}>
      <div
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${config.bgColor} ${config.textColor} ${config.borderColor} shadow-sm transition-all`}
      >
        {config.icon}
        <span>{config.label}</span>
      </div>

      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap max-w-xs z-10 pointer-events-none">
        <div className="relative">
          {config.description}
          {/* Arrow */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
            <div className="border-4 border-transparent border-t-gray-900" />
          </div>
        </div>
      </div>
    </div>
  );
}
