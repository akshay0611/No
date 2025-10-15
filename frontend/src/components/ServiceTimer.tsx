import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

interface ServiceTimerProps {
  startTime: Date;
  estimatedDuration?: number; // in minutes
  className?: string;
}

export default function ServiceTimer({
  startTime,
  estimatedDuration,
  className = "",
}: ServiceTimerProps) {
  const [elapsedTime, setElapsedTime] = useState<string>("00:00");
  const [estimatedCompletion, setEstimatedCompletion] = useState<string>("");

  useEffect(() => {
    // Calculate estimated completion time
    if (estimatedDuration) {
      const completionTime = new Date(startTime);
      completionTime.setMinutes(completionTime.getMinutes() + estimatedDuration);
      setEstimatedCompletion(
        completionTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      );
    }

    // Update elapsed time every second
    const interval = setInterval(() => {
      const now = new Date();
      const start = new Date(startTime);
      const diffMs = now.getTime() - start.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffSecs = Math.floor((diffMs % 60000) / 1000);

      const formattedTime = `${String(diffMins).padStart(2, "0")}:${String(diffSecs).padStart(2, "0")}`;
      setElapsedTime(formattedTime);
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, estimatedDuration]);

  return (
    <div className={`bg-purple-50 border border-purple-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-purple-600" />
          <div>
            <p className="text-xs text-gray-600">Service in progress</p>
            <p className="text-2xl font-bold text-purple-600">{elapsedTime}</p>
          </div>
        </div>
        {estimatedCompletion && (
          <div className="text-right">
            <p className="text-xs text-gray-600">Est. completion</p>
            <p className="text-lg font-semibold text-gray-900">{estimatedCompletion}</p>
          </div>
        )}
      </div>
    </div>
  );
}
