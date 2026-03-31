import BenefitsSection from '../BenefitsSection';
import { LanguageProvider } from '@/lib/language-context';

export default function BenefitsSectionExample() {
  return (
    <LanguageProvider>
      <BenefitsSection />
    </LanguageProvider>
  );
}
