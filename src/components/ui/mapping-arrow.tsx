import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface MappingArrowProps {
  className?: string;
}

export function MappingArrow({ className }: MappingArrowProps) {
  return (
    <div
      aria-label="Identity mapping indicator"
      role="img"
      className={cn(
        "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10",
        "w-12 h-12 rounded-full",
        "bg-[#326FA9] border border-[#D9E1FF]",
        "shadow-[0px_10px_15px_-3px_rgba(43,127,255,0.3),0px_4px_6px_-4px_rgba(43,127,255,0.3)]",
        "flex items-center justify-center",
        className
      )}
    >
      <ArrowRight
        className="w-5 h-5 text-white"
        strokeWidth={2.08}
        aria-hidden="true"
      />
    </div>
  );
}

