"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, LogOut, User, Code, LayoutPanelLeft, Book } from "lucide-react";
import { DOCS_URL } from "@/lib/utils";

interface Account {
    id: string;
    email: string;
    display_name: string;
    avatar_url?: string;
    account_type?: string;
}

interface ProfileViewProps {
    account: Account | null;
    isLoading?: boolean;
    onLogout: () => void;
    onNavigate?: (path: string) => void;
}

export default function ProfileView({
    account,
    isLoading = false,
    onLogout,
    onNavigate,
}: ProfileViewProps) {
    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    const handleNavigate = (path: string) => {
        if (onNavigate) {
            onNavigate(path);
        }
    };

    if (isLoading || !account) {
        return (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/50 animate-pulse">
                <div className="w-8 h-8 rounded-full bg-slate-700" />
                <div className="hidden sm:block">
                    <div className="h-3 w-24 bg-slate-700 rounded mb-1" />
                    <div className="h-2 w-16 bg-slate-700 rounded" />
                </div>
            </div>
        );
    }

    return (
        <DropdownMenu modal={false}>
            <DropdownMenuTrigger className="flex items-center gap-2 px-3 py-2 hover:bg-primary-20 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer">
                <Avatar className="h-8 w-8 border-2 border-slate-700">
                    <AvatarImage src={account.avatar_url} alt={account.display_name} />
                    <AvatarFallback className="bg-primary/20 text-primary text-xs font-semibold capitalize">
                        {getInitials(account.display_name)}
                    </AvatarFallback>
                </Avatar>
                <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium text-slate-200 leading-tight capitalize font-mono">
                        {account.display_name}
                    </p>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400 hidden sm:block" />
            </DropdownMenuTrigger>

            <DropdownMenuContent
                align="end"
                className="w-64 bg-card border-border shadow-xl rounded-none"
            >
                <DropdownMenuLabel className="font-normal">
                    <div className="flex items-center gap-3 py-2">
                        <Avatar className="h-12 w-12 border-2 border-slate-700">
                            <AvatarImage
                                src={account.avatar_url}
                                alt={account.display_name}
                            />
                            <AvatarFallback className="bg-primary/20 text-primary text-sm font-semibold">
                                {getInitials(account.display_name)}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col space-y-1">
                            <p className="text-sm font-semibold text-slate-100 truncate">
                                {account.display_name}
                            </p>
                            <p className="text-xs text-slate-400 leading-none truncate">
                                {account.email}
                            </p>
                            {account.account_type && (
                                <span className="text-xs px-2 py-0.5 bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 rounded-full w-fit mt-1">
                                    {account.account_type}
                                </span>
                            )}
                        </div>
                    </div>
                </DropdownMenuLabel>

                <DropdownMenuSeparator className="bg-slate-700" />

                <DropdownMenuItem
                    onClick={() => handleNavigate("/dashboard")}
                    className="cursor-pointer text-slate-200 focus:bg-primary-20 focus:text-slate-100"
                >
                    <User className="w-4 h-4 mr-2" />
                    Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={() => handleNavigate("/developer")}
                    className="cursor-pointer text-slate-200 focus:bg-primary-20 focus:text-slate-100"
                >
                    <Code className="w-4 h-4 mr-2" />
                    Developer Console
                </DropdownMenuItem>

                <DropdownMenuItem
                    onClick={() => window.open(DOCS_URL, "_blank", "noopener,noreferrer")}
                    className="cursor-pointer text-slate-200 focus:bg-primary-20 focus:text-slate-100"
                >
                    <Book className="w-4 h-4 mr-2" />
                    Documentation
                </DropdownMenuItem>

                <div className="flex flex-col gap-1 md:hidden">
                    <DropdownMenuItem
                        onClick={() => handleNavigate("/developer/apps")}
                        className="cursor-pointer text-slate-200 focus:bg-primary-20 focus:text-slate-100"
                    >
                        <LayoutPanelLeft className="w-4 h-4 mr-2" />
                        Applications
                    </DropdownMenuItem>
                </div>

                <DropdownMenuSeparator className="bg-slate-700" />

                <DropdownMenuItem
                    onClick={onLogout}
                    className="cursor-pointer text-red-400 focus:bg-red-500/10 focus:text-red-300"
                >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
