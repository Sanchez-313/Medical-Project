"use client";

import Image, { type ImageProps } from "next/image";
import { useEffect, useState } from "react";

const FALLBACK_IMAGE = "/images/medicine-placeholder.svg";

const PRODUCT_IMAGE_OVERRIDES: Array<{ matches: RegExp; src: string }> = [
  { matches: /truslen coffee plus/i, src: "/images/products/truslen-coffee-plus.jpg" },
  { matches: /terumo medisafe fine touch/i, src: "/images/products/terumo-medisafe-fine-touch-ii.jpg" },
];

function resolveImage(imageUrl: string | null | undefined, productName: string) {
  const override = PRODUCT_IMAGE_OVERRIDES.find(({ matches }) => matches.test(productName));
  if (override && (!imageUrl || imageUrl === FALLBACK_IMAGE)) return override.src;
  return imageUrl || FALLBACK_IMAGE;
}

type ProductImageProps = Omit<ImageProps, "src" | "alt" | "onError"> & {
  imageUrl?: string | null;
  alt: string;
};

/** Always renders a product image and falls back cleanly on empty/404 URLs. */
export default function ProductImage({ imageUrl, alt, ...props }: ProductImageProps) {
  const [src, setSrc] = useState(resolveImage(imageUrl, alt));

  useEffect(() => {
    setSrc(resolveImage(imageUrl, alt));
  }, [alt, imageUrl]);

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
