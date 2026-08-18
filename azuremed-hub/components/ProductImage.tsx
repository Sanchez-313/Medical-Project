"use client";

import Image, { type ImageProps } from "next/image";
import { useEffect, useState } from "react";

const FALLBACK_IMAGE = "/images/medicine-placeholder.svg";

type ProductImageProps = Omit<ImageProps, "src" | "alt" | "onError"> & {
  imageUrl?: string | null;
  alt: string;
};

/** Always renders a product image and falls back cleanly on empty/404 URLs. */
export default function ProductImage({ imageUrl, alt, ...props }: ProductImageProps) {
  const [src, setSrc] = useState(imageUrl || FALLBACK_IMAGE);

  useEffect(() => {
    setSrc(imageUrl || FALLBACK_IMAGE);
  }, [imageUrl]);

  return (
    <Image
      {...props}
      src={src}
      alt={alt}
      onError={() => {
        if (src !== FALLBACK_IMAGE) setSrc(FALLBACK_IMAGE);
      }}
    />
  );
}
