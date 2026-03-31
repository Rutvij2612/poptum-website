import ContactSection from '../ContactSection';
import { LanguageProvider } from '@/lib/language-context';
import { Toaster } from '@/components/ui/toaster';

export default function ContactSectionExample() {
  return (
    <LanguageProvider>
      <ContactSection />
      <Toaster />
    </LanguageProvider>
  );
}
