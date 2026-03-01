"use client";

import { Button } from "@/components/ui/button";
import { Code, ArrowRight } from "lucide-react";
import Link from "next/link";

interface DeveloperBannerProps {
    className?: string;
}

export default function DeveloperBanner({ className }: DeveloperBannerProps) {
    return (
        <div
            className={`flex lg:items-center justify-between flex-col lg:flex-row gap-5 lg:gap-0 px-6 py-5 bg-primary-20 border border-ring/80 shadow-sm hover:shadow-md transition-shadow ${className || ""
                }`}
        >
            {/* Left side - Icon and text */}
            <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-14 h-14">
                    <Code className="w-7 h-7 text-primary" strokeWidth={2} />
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-primary font-mono">
                        Developer Console
                    </h3>
                    <p className="text-sm text-slate-500 mt-0.5">
                        Integrate ConsentKeys authentication into your applications
                    </p>
                </div>
            </div>

            {/* Right side - Button */}
            <Link href="/developer">
                <Button
                    className="bg-primary-emphasis hover:bg-primary-emphasis/90 text-secondary-foreground px-6 h-11 font-semibold shadow-sm cursor-pointer rounded-none font-mono"
                >
                    Open Console
                    <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
            </Link>
        </div>
    );
}
