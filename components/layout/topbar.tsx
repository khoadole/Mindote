"use client";

import { useState } from "react";
import { Search, User, LogOut } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
// import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAppStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";

export function Topbar() {
  const [searchQuery, setSearchQuery] = useState("");
  const searchWords = useAppStore((state) => state.searchWords);
  const { signOut, user } = useAuth();
  const router = useRouter();

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      const results = searchWords(query);
      console.log("Search results:", results);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <header className="h-16 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-full items-center justify-between px-6">
        <div className="flex items-center space-x-4">
          <h2 className="text-lg font-semibold">Hi, ready to learn?</h2>
        </div>

        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search words..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-64 pl-10"
            />
          </div>

          {/* Display username and Signout button */}
          <span className="text-sm text-muted-foreground">
            {user?.user_metadata?.display_name}
          </span>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="gap-2"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>

          {/* <Avatar>
            <AvatarFallback>
              <User className="h-4 w-4" />
            </AvatarFallback>
          </Avatar> */}
        </div>
      </div>
    </header>
  );
}
