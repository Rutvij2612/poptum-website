import Footer from '../Footer';
import { LanguageProvider } from '@/lib/language-context';

export default function FooterExample() {
  return (
    <LanguageProvider>
      <Footer />
    </LanguageProvider>
  );
}
