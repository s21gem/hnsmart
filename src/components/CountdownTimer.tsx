import React, { useState, useEffect } from 'react';
import { formatToBengaliNumber } from '../utils';
import { Timer } from 'lucide-react';

export default function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    // Set target date to 3 days from now for demo purposes
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 3);

    const interval = setInterval(() => {
      const now = new Date();
      const difference = targetDate.getTime() - now.getTime();

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        });
      } else {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const timeBlocks = [
    { label: 'দিন', value: timeLeft.days },
    { label: 'ঘণ্টা', value: timeLeft.hours },
    { label: 'মিনিট', value: timeLeft.minutes },
    { label: 'সেকেন্ড', value: timeLeft.seconds }
  ];

  return (
    <div className="my-5 flex flex-col items-center">
      <div className="inline-flex items-center gap-2 bg-red-50 border border-red-200 px-4 py-1.5 rounded-full mb-3 shadow-[0_0_15px_rgba(239,68,68,0.2)] animate-pulse">
        <Timer size={16} className="text-red-600" />
        <span className="font-heading font-bold text-sm text-red-600">অফারটি শেষ হতে বাকি</span>
      </div>
      <div className="flex justify-center gap-2 md:gap-3">
        {timeBlocks.map((block, index) => (
          <div key={index} className="flex flex-col items-center">
            <div className="bg-white/90 backdrop-blur-sm w-12 h-10 md:w-14 md:h-12 flex items-center justify-center rounded-lg border border-red-200 shadow-sm relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-red-50/50 to-transparent"></div>
              <span className="text-lg md:text-xl font-serif font-bold text-red-600 relative z-10">
                {formatToBengaliNumber(block.value.toString().padStart(2, '0'))}
              </span>
            </div>
            <span className="text-[10px] md:text-xs font-heading text-slate-500 mt-1.5 font-bold">{block.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
