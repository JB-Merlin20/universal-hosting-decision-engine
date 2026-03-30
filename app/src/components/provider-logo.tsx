"use client";

import { useState } from "react";
import Image from "next/image";

function getDomain(url: string): string {
  try {
    const hostname = new URL(url).hostname;
    return hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function nameToColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = ((hash % 360) + 360) % 360;
  return `hsl(${hue}, 55%, 45%)`;
}

function LetterAvatar({ name, size }: { name: string; size: number }) {
  return (
    <span
      className="inline-flex items-center justify-center rounded-md flex-shrink-0 text-white font-semibold"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.4,
        backgroundColor: nameToColor(name),
      }}
    >
      {name.charAt(0).toUpperCase()}
    </span>
  );
}

interface ProviderLogoProps {
  name: string;
  url: string;
  size?: number;
}

export function ProviderLogo({ name, url, size = 32 }: ProviderLogoProps) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const domain = getDomain(url);

  if (failed || !domain) {
    return <LetterAvatar name={name} size={size} />;
  }

  return (
    <span className="relative inline-flex flex-shrink-0" style={{ width: size, height: size }}>
      {!loaded && <LetterAvatar name={name} size={size} />}
      <Image
        src={`https://logo.clearbit.com/${domain}`}
        alt={`${name} logo`}
        width={size}
        height={size}
        className={`rounded-md object-contain ${loaded ? "" : "absolute inset-0 opacity-0"}`}
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
        unoptimized
      />
    </span>
  );
}
