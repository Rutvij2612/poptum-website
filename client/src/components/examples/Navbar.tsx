import Navbar from '../Navbar';
import { LanguageProvider } from '@/lib/language-context';

export default function NavbarExample() {
  return (
    <LanguageProvider>
      <div className="min-h-[200px] bg-muted">
        <Navbar />
        <div className="pt-20 px-4">
          <p className="text-muted-foreground">Scroll to see navbar background change</p>
        </div>
      </div>
    </LanguageProvider>
  );
}
