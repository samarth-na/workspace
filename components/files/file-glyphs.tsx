"use client";

import type { ReactNode } from "react";

export type FileGlyphVariant =
  | "folder"
  | "pdf"
  | "sheet"
  | "slides"
  | "doc"
  | "code"
  | "text"
  | "archive"
  | "audio"
  | "video";

const FONT = "ui-sans-serif, system-ui, sans-serif";

function PageBase({
  children,
  className,
}: {
  children?: ReactNode;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M6.2 2.2h8.1l4.5 4.5V19a2.3 2.3 0 0 1-2.3 2.3H6.2A2.3 2.3 0 0 1 3.9 19V4.5a2.3 2.3 0 0 1 2.3-2.3Z"
        fill="#ffffff"
        stroke="#d8dce6"
        strokeWidth="1.1"
      />
      <path
        d="M14.3 2.2v4.5h4.5"
        fill="#f1f3f8"
        stroke="#d8dce6"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
      {children}
    </svg>
  );
}

function TextLines({
  y = 8.6,
  gap = 2.7,
  color = "#c3c9d6",
  width = 11,
}: {
  y?: number;
  gap?: number;
  color?: string;
  width?: number;
}) {
  return (
    <>
      {[0, 1, 2].map((i) => (
        <path
          key={i}
          d={`M6.6 ${y + i * gap}h${width}`}
          stroke={color}
          strokeWidth="1.3"
          strokeLinecap="round"
        />
      ))}
    </>
  );
}

function FolderGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M2.8 6.2a1.8 1.8 0 0 1 1.8-1.8h4.1a1.8 1.8 0 0 1 1.3.5l1.4 1.4h8a1.8 1.8 0 0 1 1.8 1.8V17.5a1.8 1.8 0 0 1-1.8 1.8H4.6a1.8 1.8 0 0 1-1.8-1.8V6.2Z"
        fill="#8d96f0"
      />
      <path
        d="M2.8 9.2h18.4a1.8 1.8 0 0 1 1.8 1.8v6.7a1.8 1.8 0 0 1-1.8 1.8H4.6a1.8 1.8 0 0 1-1.8-1.8V11a1.8 1.8 0 0 1 1.8-1.8Z"
        fill="#5b64d6"
      />
      <path d="M2.8 9.2h18.4v1.4H2.8V9.2Z" fill="#7a83e8" />
    </svg>
  );
}

function PdfGlyph({ className }: { className?: string }) {
  return (
    <PageBase className={className}>
      <TextLines y={8.4} width={10} />
      <rect
        x="6.4"
        y="13.6"
        width="11.2"
        height="6.4"
        rx="1.3"
        fill="#e05263"
      />
      <text
        x="12"
        y="18.5"
        textAnchor="middle"
        fontSize="3.6"
        fontWeight="700"
        fill="#ffffff"
        fontFamily={FONT}
      >
        PDF
      </text>
    </PageBase>
  );
}

function SheetGlyph({ className }: { className?: string }) {
  return (
    <PageBase className={className}>
      <rect x="6.4" y="7.8" width="11.2" height="2.6" rx="0.8" fill="#3f9d6f" />
      {[10.8, 13.4, 16].map((y) => (
        <path
          key={y}
          d={`M6.6 ${y}h10.8`}
          stroke="#c3c9d6"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
      ))}
      {[10, 13.4].map((x) => (
        <path
          key={x}
          d={`M${x} 12.6v5.6`}
          stroke="#e2e5ec"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
      ))}
    </PageBase>
  );
}

function SlidesGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      aria-hidden="true"
    >
      <rect x="4" y="4.6" width="16" height="14.8" rx="2.2" fill="#f08a3c" />
      <path
        d="M7.4 8.6h9.2"
        stroke="#ffffff"
        strokeOpacity="0.65"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <rect x="8" y="11.4" width="2.4" height="5" rx="0.6" fill="#ffffff" />
      <rect x="11.6" y="9.6" width="2.4" height="6.8" rx="0.6" fill="#ffffff" />
      <rect x="15.2" y="13" width="2.4" height="3.4" rx="0.6" fill="#ffffff" />
    </svg>
  );
}

function CodeGlyph({ className }: { className?: string }) {
  return (
    <PageBase className={className}>
      <path
        d="M9.4 11.4 6.8 14l2.6 2.6M14.6 11.4l2.6 2.6-2.6 2.6"
        stroke="#3b4560"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </PageBase>
  );
}

function TextGlyph({ className }: { className?: string }) {
  return (
    <PageBase className={className}>
      <TextLines />
    </PageBase>
  );
}

function DocGlyph({ className }: { className?: string }) {
  return (
    <PageBase className={className}>
      <TextLines color="#5b64d6" width={10} />
      <TextLines y={13.9} width={7.5} />
    </PageBase>
  );
}

function ArchiveGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4 7.5 12 3.5l8 4-8 4-8-4Z"
        fill="#e9ecf2"
        stroke="#c3c9d6"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
      <path
        d="M4 7.5v9l8 4 8-4v-9M12 11.5v9"
        fill="#d3d9e4"
        stroke="#c3c9d6"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function AudioGlyph({ className }: { className?: string }) {
  return (
    <PageBase className={className}>
      <circle cx="11.4" cy="16.2" r="1.9" fill="#6b76e0" />
      <path
        d="M13.3 16.2V8.6l4.4-1.2v7.6"
        stroke="#6b76e0"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="16.2" cy="15.2" r="1.9" fill="#6b76e0" />
    </PageBase>
  );
}

function VideoGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="3.6"
        y="5.6"
        width="16.8"
        height="12.8"
        rx="2.4"
        fill="#3b4560"
      />
      <rect x="5" y="3.8" width="1.6" height="3.4" rx="0.6" fill="#c3c9d6" />
      <rect x="17.4" y="3.8" width="1.6" height="3.4" rx="0.6" fill="#c3c9d6" />
      <rect x="5" y="16.8" width="1.6" height="3.4" rx="0.6" fill="#c3c9d6" />
      <rect
        x="17.4"
        y="16.8"
        width="1.6"
        height="3.4"
        rx="0.6"
        fill="#c3c9d6"
      />
      <path d="M10.2 9.8v4.4l4-2.2-4-2.2Z" fill="#ffffff" />
    </svg>
  );
}

function FileGlyph({
  variant,
  className,
}: {
  variant: FileGlyphVariant;
  className?: string;
}) {
  switch (variant) {
    case "folder":
      return <FolderGlyph className={className} />;
    case "pdf":
      return <PdfGlyph className={className} />;
    case "sheet":
      return <SheetGlyph className={className} />;
    case "slides":
      return <SlidesGlyph className={className} />;
    case "code":
      return <CodeGlyph className={className} />;
    case "text":
      return <TextGlyph className={className} />;
    case "doc":
      return <DocGlyph className={className} />;
    case "archive":
      return <ArchiveGlyph className={className} />;
    case "audio":
      return <AudioGlyph className={className} />;
    case "video":
      return <VideoGlyph className={className} />;
  }
}

export { FileGlyph };
