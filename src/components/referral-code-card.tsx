"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RefreshCw, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ReferralCodeCardProps {
  code: string;
  createdAt: string | null;
  onRegenerate: () => void;
  isRegenerating: boolean;
  className?: string;
  variant?: "dashboard" | "consent";
}

export function ReferralCodeCard({
  code,
  createdAt,
  onRegenerate,
  isRegenerating,
  className,
  variant = "dashboard",
}: ReferralCodeCardProps) {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopyCode = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setIsCopied(true);
      toast.success("Referral code copied to clipboard", { duration: 2000 });
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Failed to copy referral code", err);
      }
      toast.error("Failed to copy referral code", { duration: 2000 });
    }
  };

  if (variant === "dashboard") {
    return (
      <Card className={cn("bg-bg-20 border-slate-800 shadow-xl rounded-none gap-4", className)}>
        <CardHeader className="px-6 pt-6 pb-4">
          <div className="flex items-start justify-between gap-5">
            <div>
              <CardTitle className="text-white text-xl font-mono">
                Invite Friends
              </CardTitle>
              <CardDescription className="text-slate-300 text-sm mt-2">
                Share your referral code to invite others to ConsentKeys.
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRegenerate()}
              disabled={isRegenerating}
              className="text-primary hover:text-primary/80 hover:bg-primary/10 cursor-pointer"
              title="Regenerate referral code"
            >
              <RefreshCw
                className={cn("w-4 h-4", isRegenerating && "animate-spin")}
              />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 bg-bg-10 p-4 border border-slate-700 rounded-none">
              <code className="font-mono text-lg flex-1 text-primary select-all">
                {code}
              </code>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyCode}
                className="text-slate-400 hover:text-slate-200 hover:bg-slate-800 cursor-pointer"
                title="Copy referral code"
              >
                {isCopied ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Code expires in 24 hours</span>
              {createdAt && (
                <span>
                  Generated: {new Date(createdAt).toLocaleString()}
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Consent page variant
  return (
    <div className={cn("bg-primary/10 p-6 rounded-none border border-primary/20 h-full", className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-foreground">
          Invite Friends
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onRegenerate()}
          disabled={isRegenerating}
          className="text-primary hover:text-primary/80 hover:bg-primary/10 h-8 px-2"
          title="Regenerate referral code"
        >
          <RefreshCw className={cn("w-4 h-4", isRegenerating && "animate-spin")} />
        </Button>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Share your referral code to invite others to ConsentKeys. Each code is valid for 24 hours.
      </p>
      <div className="space-y-4">
        <div className="flex items-center gap-2 bg-background p-4 border border-input">
          <code className="font-mono text-xl flex-1 select-all text-primary">
            {code}
          </code>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopyCode}
            className="text-muted-foreground hover:text-foreground hover:bg-primary/10"
            title="Copy referral code"
          >
            {isCopied ? (
              <Check className="w-4 h-4 text-emerald-400" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </Button>
        </div>
        {createdAt && (
          <p className="text-xs text-muted-foreground text-right">
            Generated: {new Date(createdAt).toLocaleString()}
          </p>
        )}
        <div className="pt-4 border-t border-primary/20">
          <p className="text-xs text-muted-foreground">
            💡 Your referral code helps grow the ConsentKeys community while maintaining our privacy-first approach.
          </p>
        </div>
      </div>
    </div>
  );
}
