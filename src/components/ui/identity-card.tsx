import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface IdentityCardProps {
  name: string;
  email: string;
  avatarUrl?: string;
  isSelected?: boolean;
  isPrivate?: boolean;
  showInfoBadge?: boolean;
  onClick?: () => void;
  onDoubleClick?: () => void;
  className?: string;
}

export function IdentityCard({
  name,
  email,
  avatarUrl,
  isSelected = false,
  isPrivate = false,
  showInfoBadge = false,
  onClick,
  onDoubleClick,
  className,
}: IdentityCardProps) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={
        onClick
          ? isPrivate
            ? `Select account ${name}`
            : `Select pseudonym for ${name}`
          : undefined
      }
      className={cn(
        "w-full rounded-[14px] border transition-all duration-200",
        isSelected
          ? "bg-[#12375B] border-[#D9E1FF] shadow-[0px_0px_0px_2px_rgba(43,127,255,0.6)]"
          : "bg-[rgba(18,55,91,0.5)] border-[rgba(217,225,255,0.12)]",
        onClick && "cursor-pointer hover:border-[rgba(217,225,255,0.2)]",
        className
      )}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      <div className={cn(
        "flex items-center p-3 sm:p-6",
        isPrivate ? "gap-3" : "gap-3 sm:gap-3"
      )}>
        {/* Avatar */}
        <div
          className={cn(
            "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all",
            isSelected
              ? "bg-[rgba(43,127,255,0.3)]"
              : "bg-[rgba(43,127,255,0.2)]"
          )}
        >
          {avatarUrl ? (
            <Avatar className="w-10 h-10">
              <AvatarImage src={avatarUrl} alt={name} />
              <AvatarFallback
                className={cn(
                  "text-base font-medium",
                  isSelected
                    ? "bg-[rgba(43,127,255,0.3)] text-[#51A2FF]"
                    : "bg-[rgba(43,127,255,0.2)] text-[rgba(81,162,255,0.6)]"
                )}
              >
                {getInitials(name)}
              </AvatarFallback>
            </Avatar>
          ) : (
            <span
              className={cn(
                "text-base font-medium leading-6 tracking-[-0.3125px]",
                isSelected ? "text-[#51A2FF]" : "text-[rgba(81,162,255,0.6)]"
              )}
            >
              {getInitials(name)}
            </span>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 flex flex-col gap-1">
          {/* App Label (only for pseudonyms) */}
          {!isPrivate && (
            <div className="text-xs font-medium leading-4 text-[#62748E]">
              Sample OAuth Debugger
            </div>
          )}

          {/* Name */}
          <div
            className={cn(
              "text-base font-medium leading-6 tracking-[-0.3125px] truncate",
              isSelected ? "text-white" : "text-[rgba(121,139,178,0.85)]"
            )}
          >
            {name}
          </div>

          {/* Email */}
          <div
            className={cn(
              "text-sm font-medium leading-5 tracking-[-0.150391px] truncate",
              isSelected
                ? "text-[rgba(217,225,255,0.8)]"
                : "text-[rgba(217,225,255,0.2)]"
            )}
          >
            {email}
          </div>
        </div>

        {/* Private Badge */}
        {isPrivate && (
          <div
            className={cn(
              "flex-shrink-0 px-3 py-1 rounded-lg border text-xs font-medium leading-4",
              isSelected
                ? "bg-[rgba(49,65,88,0.4)] border-[rgba(217,225,255,0.12)] text-[rgba(217,225,255,0.8)]"
                : "bg-[rgba(49,65,88,0.4)] border-[rgba(217,225,255,0.12)] text-[rgba(217,225,255,0.5)]"
            )}
          >
            Private
          </div>
        )}
      </div>

      {/* Info Badge - only for selected pseudonym cards */}
      {showInfoBadge && isSelected && !isPrivate && (
        <div className="pb-6 sm:pb-8">
          {/* 
            Text inside box must align with name/email:
            - Card padding: 12px (mobile) / 24px (desktop)
            - Avatar: 40px
            - Gap: 12px
            - Total to text: 64px (mobile) / 76px (desktop)
            - Box left padding: 12px
            - Box margin = total - box padding: 52px (mobile) / 64px (desktop)
          */}
          <div className="ml-[52px] sm:ml-[64px] mr-3 sm:mr-6">
            <div className="px-3 py-2 rounded-lg bg-[#51ABFF] border border-[rgba(77,94,119,0.3)] max-w-[320px]">
              <p className="text-xs leading-4 text-[#08243F]">
                Shared with app only. Your real name and email will never be
                disclosed.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

