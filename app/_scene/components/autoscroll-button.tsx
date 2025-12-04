"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCameraStore } from "../store/camera";
import { cn } from "@/app/lib/utils";

export function AutoscrollButton() {
  const isControlled = useCameraStore((state) => state.isControlled);
  const setIsControlled = useCameraStore((state) => state.setIsControlled);

  if (!isControlled) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 pointer-events-none flex items-center justify-center z-50">
      <Button
        variant="outline"
        className={cn(
          "pointer-events-auto rounded-xl shadow-lg",
          "bg-background/95 backdrop-blur-sm",
          "hover:bg-background/90",
          "transition-opacity duration-300 cursor-pointer"
        )}
        onClick={() => setIsControlled(false)}
        aria-label="Return to autoscroll"
      >
        <ChevronDown className="size-6" />
        <span>Continue</span>
      </Button>
    </div>
  );
}
