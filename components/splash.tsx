"use client";

import { ReactNode } from "react";

export function SplashContainer({
    children,
    onClick,
}: {
    children: ReactNode;
    onClick?: () => void;
}) {
    return (
        <div
            className="absolute inset-0 z-50 flex h-full w-full items-center justify-center overflow-hidden bg-black cursor-pointer select-none"
            onClick={onClick}
        >
            {children}
            <CornerDecorations />
        </div>
    );
}

export function CornerDecorations() {
    return (
        <>
            <div className="absolute top-8 left-8 w-12 h-12 border-l border-t border-neutral-800" />
            <div className="absolute top-8 right-8 w-12 h-12 border-r border-t border-neutral-800" />
            <div className="absolute bottom-8 left-8 w-12 h-12 border-l border-b border-neutral-800" />
            <div className="absolute bottom-8 right-8 w-12 h-12 border-r border-b border-neutral-800" />
        </>
    );
}

export function Title({ size = "20vw" }: { size?: string }) {
    return (
        <h1
            className="font-display leading-none tracking-tighter text-white uppercase"
            style={{
                fontSize: size,
                textShadow: "0 0 100px rgba(255,255,255,0.1)",
            }}
        >
            Hanashi
        </h1>
    );
}

export function Prompt({ children }: { children: ReactNode }) {
    return (
        <p className="text-neutral-600 text-lg tracking-[0.3em] uppercase animate-pulse">
            {children}
        </p>
    );
}

