import { Map } from "lucide-react";
import type React from "react";

import { cn } from "@/lib/utils";

interface ItemProps {
  emoji: string;
  position: string;
}

interface HeroCardProps {
  destinations?: ItemProps[];
  treasures?: ItemProps[];
  className?: string;
}

const HeroSectionTextHover: React.FC<HeroCardProps> = ({ className }) => {
  const destinations: ItemProps[] = [
    {
      emoji: "🏨",
      position:
        "-left-20 top-3 group-hover/hero:-rotate-[10deg] group-hover/hero:-translate-y-12 md:-left-28 md:-top-2 sm:-left-24",
    },
    {
      emoji: "✈️",
      position:
        "-left-[72px] top-0 group-hover/hero:-rotate-[20deg] group-hover/hero:-translate-x-10 md:-left-[135px] md:-top-2 sm:-left-24 ",
    },
    {
      emoji: "🏔️",
      position:
        "left-[150px] top-0 group-hover/hero:rotate-[10deg] group-hover/hero:-translate-y-10 md:left-[210px] md:-top-1 sm:left-[180px]",
    },
    {
      emoji: "🏡",
      position:
        "left-[105px] top-0 group-hover/hero:rotate-[20deg] group-hover/hero:translate-x-16 md:left-[190px] md:-top-2 sm:left-[150px]",
    },
  ];

  return (
    <div className={cn("relative w-full", className)}>
      <div className="flex flex-col items-center justify-center gap-2 sm:gap-4 md:flex-row flex-wrap">
        <span className="text-slate-900 dark:text-white">Orzuyingizdagi</span>
        
        <div className="group/hero relative flex items-center">
          <span className="text-primary-600 transition-colors group-hover/hero:text-sky-400">
            sayohatni
          </span>
          <div className="duration-400 absolute inset-0 cursor-pointer opacity-0 transition-opacity group-hover/hero:opacity-100">
            {destinations.map((dest, index) => (
              <span
                key={index}
                className={cn(
                  "pointer-events-none absolute transform text-lg transition-transform duration-300 ease-[cubic-bezier(0.5,1.8,0.4,1)] group-hover/hero:scale-110 sm:text-2xl md:text-4xl",
                  dest.position,
                )}
              >
                {dest.emoji}
              </span>
            ))}
          </div>
        </div>

        <span className="text-slate-900 dark:text-white">bugun boshlang</span>
      </div>
    </div>
  );
};

export default HeroSectionTextHover;
