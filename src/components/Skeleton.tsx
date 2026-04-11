import { twMerge } from "tailwind-merge";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={twMerge(
        "animate-pulse bg-gray-200/60 rounded-md",
        className
      )}
    />
  );
}

export function RecipeCardSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="w-full aspect-[4/5] rounded-xl" />
      <div className="space-y-2">
        <div className="flex justify-between items-start gap-4">
          <Skeleton className="h-6 flex-1 max-w-[80%]" />
          <Skeleton className="h-3 w-16 mt-2 shrink-0" />
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
  );
}
