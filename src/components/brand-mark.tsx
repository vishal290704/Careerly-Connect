import Link from "next/link";

export function BrandMark() {
  return (
    <Link href="/" className="flex items-center gap-3" aria-label="Applyora home">
      <span className="relative grid h-9 w-9 place-items-center rounded-xl bg-teal text-white">
        <span className="absolute h-5 w-3 rounded-sm border-2 border-white/80 border-b-0" />
        <span className="absolute bottom-1.5 right-2 h-1.5 w-1.5 rounded-full bg-accent" />
      </span>
      <span className="text-[1.1rem] font-semibold tracking-[-0.03em]">Applyora</span>
    </Link>
  );
}
