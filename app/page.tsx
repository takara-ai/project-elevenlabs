"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
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
            West Europe Team Members
          </p>
          <p className="text-neutral-400 text-base">
            <Link
              href="https://www.linkedin.com/in/codyadam/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              Cody Adams
            </Link>
            {" and "}
            <Link
              href="https://www.linkedin.com/in/404missinglink/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              Jordan Legg
            </Link>
          </p>
        </div>

        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center justify-center gap-10">
            <Image
              src="/sponsors/elevenlabs.svg"
              alt="ElevenLabs"
              width={140}
              height={18}
              className="opacity-60 hover:opacity-100 transition-opacity"
            />
            <Image
              src="/sponsors/Anthropic_Symbol_0.svg"
              alt="Anthropic"
              width={40}
              height={28}
              className="opacity-60 hover:opacity-100 transition-opacity"
            />
            <div
              className="w-[80px] h-[28px] border border-dashed border-neutral-700 rounded flex items-center justify-center"
              title="Your logo here"
            >
              <span className="text-neutral-700 text-[10px] tracking-wider">TBD</span>
            </div>
          </div>
        </div>

        <Prompt>Click anywhere to enter</Prompt>
      </div>
    </SplashContainer>
  );
}
