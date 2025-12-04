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
          <p className="text-muted-foreground text-2xl mt-4">
            by{" "}
            <Link
              href="https://www.linkedin.com/in/codyadam/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white transition-colors px-1"
            >
              Cody Adams
            </Link>
            {" and "}
            <Link
              href="https://www.linkedin.com/in/404missinglink/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white transition-colors px-1"
            >
              Jordan Legg
            </Link>
          </p>
        </div>

        {/* <div className="flex flex-col items-center gap-4">
          <div className="flex items-center justify-center opacity-40 gap-10">
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
            <Image
              src="/sponsors/project-europe.jpg"
              alt="Project Europe"
              width={140}
              height={140}
              className="opacity-60 -m-6 hover:opacity-100 transition-opacity"
              title="Project Europe"
            />
          </div>
        </div> */}
        <Prompt>Click anywhere to enter</Prompt>
      </div>
    </SplashContainer>
  );
}
