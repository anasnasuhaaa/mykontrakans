import Image from "next/image";
import { cn } from "@/lib/utils";

export function BrandLogo({
  className,
  imageClassName,
  alt = "Logo MyKontrakans",
}: {
  className?: string;
  imageClassName?: string;
  alt?: string;
}) {
  const imageClasses = cn("size-full object-contain", imageClassName);

  return (
    <span className={cn("relative block shrink-0", className)}>
      <Image
        src="/main-logo.png"
        alt={alt}
        width={1254}
        height={1254}
        loading="eager"
        className={cn(imageClasses, "dark:hidden")}
      />
      <Image
        src="/dark-logo.png"
        alt={alt}
        width={1254}
        height={1254}
        loading="eager"
        className={cn(imageClasses, "hidden dark:block")}
      />
    </span>
  );
}
