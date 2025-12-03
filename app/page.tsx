"use client";

import { useRouter } from "next/navigation";
import { SplashContainer, Prompt } from "../components/splash";

export default function Home() {
  const router = useRouter();

  return (
    <SplashContainer onClick={() => router.push("/game")}>
      <div className="relative z-10 flex flex-col items-center gap-16 max-w-2xl px-8 text-center">
        <div className="flex flex-col items-center gap-4">
          <h1
            className="font-display text-[10vw] leading-none tracking-tighter text-white"
            style={{ textShadow: "0 0 100px rgba(255,255,255,0.1)" }}
          >
            Project Elevenlabs
          </h1>
          <p className="text-neutral-500 text-sm tracking-widest">
            by the West Europe Team
          </p>
          <p className="text-neutral-400 text-base">
            Cody Adams and Jordan Legg
          </p>
        </div>

        <div className="flex flex-col gap-6">

        </div>

        <Prompt>Click anywhere to enter</Prompt>
      </div>
    </SplashContainer>
  );
}
