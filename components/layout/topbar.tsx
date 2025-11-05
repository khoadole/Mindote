"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, User, LogOut, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAllWords } from "@/hooks/use-words";
import { useCollections } from "@/hooks/use-collections";
import { useAuth } from "@/lib/auth";
import { cn, getUserDisplayName } from "@/lib/utils";

export function Topbar() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const { signOut, user } = useAuth();
  const router = useRouter();
  const searchRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: words = [] } = useAllWords();
  const { data: collections = [] } = useCollections();

  // Filter words based on search query
  const filteredWords = searchQuery.trim()
    ? (words || []).filter((word) =>
        word.term.toLowerCase().includes(searchQuery.toLowerCase().trim())
      )
    : [];

  // Get collection name for a word
  const getCollectionName = (collectionId: string) => {
    const collection = (collections || []).find((c) => c.id === collectionId);
    return collection?.name || "Unknown";
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Auto-scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && dropdownRef.current) {
      const selectedElement = dropdownRef.current.querySelector(
        `[data-index="${selectedIndex}"]`
      ) as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({
          block: "nearest",
          behavior: "smooth",
        });
      }
    }
  }, [selectedIndex]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setIsOpen(query.trim().length > 0);
    setSelectedIndex(-1); // Reset selection when typing
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || filteredWords.length === 0) return;

    const maxIndex = Math.min(filteredWords.length - 1, 9); // Max 10 items

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => (prev < maxIndex ? prev + 1 : prev));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex <= maxIndex) {
          handleWordClick(filteredWords[selectedIndex].collectionId);
        }
        break;
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleWordClick = (collectionId: string) => {
    router.push(`/collections/${collectionId}`);
    setSearchQuery("");
    setIsOpen(false);
    setSelectedIndex(-1);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setIsOpen(false);
    setSelectedIndex(-1);
  };

  const handleSignOut = async () => {
    try {
      // Optimistic UI: Redirect immediately, sign out in background
      router.push("/");
      signOut(); // Don't await - let it run in background
      router.refresh();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <header className="h-20 border-b border-border bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
      <div className="flex h-full items-center justify-between px-6">
        <div className="flex items-center space-x-4">
          <div>
            <h2 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {getGreeting()}, {getUserDisplayName(user)}! 👋
            </h2>
            <p className="text-sm text-muted-foreground">
              Ready to expand your vocabulary?
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Search with Dropdown */}
          <div className="relative" ref={searchRef}>
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground z-10" />
            <Input
              placeholder="Search words... (⌘K)"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => searchQuery.trim() && setIsOpen(true)}
              className={cn(
                "w-80 pl-11 pr-10 h-11 rounded-2xl transition-all duration-300",
                "border-2 border-transparent",
                "focus:border-primary/50 focus:shadow-lg focus:shadow-primary/10",
                "bg-muted/50 hover:bg-muted/70"
              )}
            />
            {searchQuery && (
              <button
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground z-10 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}

            {/* Dropdown Results */}
            {isOpen && filteredWords.length > 0 && (
              <div
                ref={dropdownRef}
                className="absolute top-full mt-3 w-full bg-background/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl shadow-primary/10 max-h-96 overflow-y-auto z-50"
              >
                {filteredWords.slice(0, 10).map((word, index) => (
                  <button
                    key={word.id}
                    data-index={index}
                    onClick={() => handleWordClick(word.collectionId)}
                    className={cn(
                      "w-full px-4 py-3 text-left transition-colors border-b border-border last:border-b-0 flex items-start justify-between gap-2",
                      selectedIndex === index
                        ? "bg-primary/10 border-l-2 border-l-primary"
                        : "hover:bg-muted"
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate">
                          {word.term}
                        </span>
                        {word.partOfSpeech && (
                          <Badge variant="outline" className="text-xs shrink-0">
                            {word.partOfSpeech}
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground truncate mt-1">
                        {word.definition}
                      </div>
                    </div>
                    <Badge variant="secondary" className="shrink-0 text-xs">
                      {getCollectionName(word.collectionId)}
                    </Badge>
                  </button>
                ))}
                {filteredWords.length > 10 && (
                  <div className="px-4 py-2 text-xs text-muted-foreground text-center border-t">
                    +{filteredWords.length - 10} more results
                  </div>
                )}
              </div>
            )}

            {/* No Results */}
            {isOpen && searchQuery.trim() && filteredWords.length === 0 && (
              <div className="absolute top-full mt-2 w-full bg-background border border-border rounded-lg shadow-lg p-4 z-50">
                <p className="text-sm text-muted-foreground text-center">
                  No words found matching "{searchQuery}"
                </p>
              </div>
            )}
          </div>

          {/* User section */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-2xl bg-muted/50">
              <User className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">
                {getUserDisplayName(user)}
              </span>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="gap-2 rounded-xl hover:bg-destructive/10 hover:text-destructive transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
