"use client";

import { useState } from "react";

export default function Test() {
  const [input, setInput] = useState("");
  return (
    <div className="h-screen w-screen bg-black flex items-center justify-center flex-col gap-4">
      <div
        className="bg-white p-0 m-auto max-w-md overflow-y-auto max-h-20 text-black relative overflow-hidden text-xl flex flex-col justify-end"
        style={{ display: "flex", flexDirection: "column-reverse" }}
      >
        <div className="w-full">{input}</div>
      </div>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        className="w-full p-2 m-auto max-w-md text-black relative overflow-hidden text-xl border"
      />
    </div>
  );
}
