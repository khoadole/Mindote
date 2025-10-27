"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { History, Trash2, Clock, ExternalLink, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface YouTubeHistoryItem {
  id: string;
  url: string;
  title: string;
  videoId: string;
  createdAt: string;
}

interface YouTubeHistoryProps {
  history: YouTubeHistoryItem[];
  onSelectUrl: (url: string) => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
}

export function YouTubeHistory({
  history,
  onSelectUrl,
  onDelete,
  onClearAll,
}: YouTubeHistoryProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (history.length === 0) {
    return (
      <div className="text-center py-4 px-2">
        <History className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">No history yet</p>
        <p className="text-xs text-muted-foreground mt-1">
          Videos you've watched will appear here
        </p>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <History className="h-5 w-5" />
            Recent Videos
            <Badge variant="secondary" className="ml-1">
              {history.length}
            </Badge>
          </CardTitle>
          {history.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  •••
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={onClearAll}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear All History
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-2">
            {history.map((item) => (
              <div
                key={item.id}
                className="group relative p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/50 transition-all cursor-pointer"
                onClick={() => onSelectUrl(item.url)}
              >
                <div className="flex items-start gap-3">
                  {/* Thumbnail */}
                  <div className="relative flex-shrink-0 w-20 h-14 rounded overflow-hidden bg-muted">
                    <img
                      src={`https://img.youtube.com/vi/${item.videoId}/mqdefault.jpg`}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium line-clamp-2 mb-1 group-hover:text-primary transition-colors">
                      {item.title}
                    </h4>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>
                        {formatDistanceToNow(new Date(item.createdAt), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(item.url, "_blank");
                      }}
                      className="h-7 w-7 p-0"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(item.id);
                      }}
                      className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
