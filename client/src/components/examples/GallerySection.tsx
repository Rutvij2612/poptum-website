import GallerySection from '../GallerySection';
import { LanguageProvider } from '@/lib/language-context';

export default function GallerySectionExample() {
  return (
    <LanguageProvider>
      <GallerySection />
    </LanguageProvider>
  );
}
