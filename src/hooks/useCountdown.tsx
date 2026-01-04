import { useState, useEffect } from 'react';
import { differenceInSeconds } from 'date-fns';

interface CountdownResult {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
  totalSeconds: number;
}

export function useCountdown(targetDate: Date | string): CountdownResult {
  const target = typeof targetDate === 'string' ? new Date(targetDate) : targetDate;
  
  const calculateTimeLeft = (): CountdownResult => {
    const totalSeconds = differenceInSeconds(target, new Date());
    
    if (totalSeconds <= 0) {
      return {
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        isExpired: true,
        totalSeconds: 0,
      };
    }

    const days = Math.floor(totalSeconds / (60 * 60 * 24));
    const hours = Math.floor((totalSeconds % (60 * 60 * 24)) / (60 * 60));
    const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
    const seconds = totalSeconds % 60;

    return {
      days,
      hours,
      minutes,
      seconds,
      isExpired: false,
      totalSeconds,
    };
  };

  const [timeLeft, setTimeLeft] = useState<CountdownResult>(calculateTimeLeft);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [target.getTime()]);

  return timeLeft;
}

export function formatCountdown(countdown: CountdownResult): string {
  if (countdown.isExpired) return 'Closed';
  
  if (countdown.days > 0) {
    return `${countdown.days}d ${countdown.hours}h`;
  }
  
  if (countdown.hours > 0) {
    return `${countdown.hours}h ${countdown.minutes}m`;
  }
  
  if (countdown.minutes > 0) {
    return `${countdown.minutes}m ${countdown.seconds}s`;
  }
  
  return `${countdown.seconds}s`;
}
