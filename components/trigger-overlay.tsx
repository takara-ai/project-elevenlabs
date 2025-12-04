"use client";

interface TriggerOverlayProps {
  isActive: boolean;
  label: string | null;
}

export function TriggerOverlay({ isActive, label }: TriggerOverlayProps) {
  if (!isActive) return null;

  return (
    <div className="absolute top-12 left-0 right-0 flex justify-center pointer-events-none z-50">
      <p className="text-white bg-black/50 p-4 text-5xl font-semibold text-center">
        {label || "Click to interact"}
      </p>
    </div>
  );
}

