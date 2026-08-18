import Image from "next/image";
import { cn } from "@/lib/utils";

export function Avatar({
  src,
  name,
  className,
}: {
  src: string | null | undefined;
  name: string;
  className?: string;
}) {
  if (src) {
    return (
      <Image
        src={src}
        alt={`${name}'s avatar`}
        width={64}
        height={64}
        className={cn("shrink-0 object-cover", className)}
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex shrink-0 items-center justify-center font-semibold",
        className,
      )}
    >
      {name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()}
    </span>
  );
}
