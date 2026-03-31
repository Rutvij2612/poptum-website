import FlavoursSection from '../FlavoursSection';
import { LanguageProvider } from '@/lib/language-context';

export default function FlavoursSectionExample() {
  return (
    <LanguageProvider>
      <FlavoursSection />
    </LanguageProvider>
  );
}
