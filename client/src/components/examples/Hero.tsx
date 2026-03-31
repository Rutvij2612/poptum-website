import Hero from '../Hero';
import { LanguageProvider } from '@/lib/language-context';

export default function HeroExample() {
  return (
    <LanguageProvider>
      <Hero />
    </LanguageProvider>
  );
}
