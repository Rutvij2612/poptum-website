import AboutSection from '../AboutSection';
import { LanguageProvider } from '@/lib/language-context';

export default function AboutSectionExample() {
  return (
    <LanguageProvider>
      <AboutSection />
    </LanguageProvider>
  );
}
