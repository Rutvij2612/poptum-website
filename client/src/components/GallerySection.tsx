import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useLanguage } from '@/lib/language-context';
import barbequeImage from '@assets/generated_images/barbeque.jpeg';
import himalayanImage from '@assets/generated_images/salt_n_pepper.jpeg';
import periPeriImage from '@assets/generated_images/peri_peri.jpeg';
import creamOnionImage from '@assets/generated_images/cream_n_onion.jpeg';

const galleryImages = [
  { src: creamOnionImage, alt: 'Cream & Onion Makhana', span: '' },
  { src: barbequeImage, alt: 'Barbeque Makhana', span: '' },
  { src: periPeriImage, alt: 'Peri Peri Makhana', span: '' },
  { src: himalayanImage, alt: 'Salt & Pepper Makhana', span: '' },
];

export default function GallerySection() {
  const { t } = useLanguage();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  return (
    <section
      id="gallery"
      className="py-20 lg:py-28 bg-card"
      data-testid="gallery-section"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="font-heading text-4xl lg:text-5xl font-bold text-foreground mb-4">
            {t.gallery.title}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t.gallery.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">          {galleryImages.map((image, index) => (
            <button
            key={index}
            onClick={() => setSelectedImage(image.src)}
            className="group relative overflow-hidden rounded-xl"
            data-testid={`gallery-image-${index}`}
          >
            <img
              src={image.src}
              alt={image.alt}
              className="w-full h-auto transition-transform duration-500 group-hover:scale-105"
            />
          
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-end">
              <p className="text-white text-sm font-medium p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                {image.alt}
              </p>
            </div>
          </button>
          ))}
        </div>

        <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
          <DialogContent className="max-w-4xl p-0 overflow-hidden">
            {selectedImage && (
              <img
                src={selectedImage}
                alt="Gallery preview"
                className="w-full h-auto"
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
}
