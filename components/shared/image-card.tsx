import { cn } from '@/lib/utils';
import type { GalleryImage } from '@/lib/types';

interface ImageCardProps {
    image: GalleryImage;
    onClick?: () => void;
    aspectRatio?: 'square' | 'portrait' | 'landscape' | 'auto';
}

export function ImageCard({
    image,
    onClick,
    aspectRatio = 'landscape',
}: ImageCardProps) {
    const fileName = image.url.split('/').pop() || image.title;
    const displayName =
        fileName.length > 42 ? `${fileName.slice(0, 39)}...` : fileName;
    const details = image.dimensions
        ? `${image.dimensions.width} x ${image.dimensions.height}`
        : image.tags?.[0] || 'image';

    const aspectClasses = {
        square: 'aspect-square',
        portrait: 'aspect-[3/4]',
        landscape: 'aspect-[16/10]',
        auto: '',
    };

    return (
        <button
            type="button"
            onClick={onClick}
            className="group w-full text-left"
        >
            <div
                className={cn(
                    'relative w-full overflow-hidden rounded-sm   bg-background transition-all duration-200  ',
                    aspectClasses[aspectRatio]
                )}
            >
                <img
                    src={image.url}
                    alt={image.title}
                    className="h-full w-full bg-background object-contain p-1 transition-transform duration-300 ease-out group-hover:scale-[1.02]"
                />
            </div>

            <div className="px-1 pb-1 pt-2 text-center">
                <p className="line-clamp-2 break-all text-[12px] font-medium text-foreground/95">
                    {displayName}
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {details}
                </p>
            </div>
        </button>
    );
}
