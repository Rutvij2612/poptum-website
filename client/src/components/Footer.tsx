import { useLanguage } from '@/lib/language-context';
import {
  SiInstagram,
  SiFacebook,
  SiLinkedin,
  SiX,
} from 'react-icons/si';

export default function Footer() {
  const { t, language, setLanguage } = useLanguage();

  const currentYear = new Date().getFullYear();

  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="bg-card border-t" data-testid="footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-3 gap-8">
          <div>
            <button
              onClick={() => scrollToSection('#home')}
              className="flex flex-col items-start mb-4 block"
            >
              <span 
                className="font-bold text-2xl text-foreground leading-none tracking-tight"
                style={{ 
                  fontFamily: 'Montserrat, sans-serif',
                  letterSpacing: '-0.02em',
                  fontWeight: 800
                }}
              >
                <span className="text-primary">POP</span>TUM
              </span>
              <span 
                className="text-[10px] sm:text-xs font-semibold mt-0.5 tracking-widest uppercase text-muted-foreground"
                style={{ fontFamily: 'Montserrat, sans-serif', letterSpacing: '0.15em' }}
              >
                POP . CRUNCH . REPEAT
              </span>
            </button>
            <p className="text-muted-foreground text-sm mb-4">
              {t.footer.tagline}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setLanguage('en')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  language === 'en'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover-elevate'
                }`}
                data-testid="footer-lang-en"
              >
                EN
              </button>
              <button
                onClick={() => setLanguage('de')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  language === 'de'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover-elevate'
                }`}
                data-testid="footer-lang-de"
              >
                DE
              </button>
            </div>
          </div>

          <div>
            <h4 className="font-heading font-semibold text-foreground mb-4">
              {t.footer.quickLinks}
            </h4>
            <nav className="space-y-2">
              {['about', 'flavours', 'process', 'benefits', 'contact'].map((item) => (
                <button
                  key={item}
                  onClick={() => scrollToSection(`#${item}`)}
                  className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
                  data-testid={`footer-link-${item}`}
                >
                  {t.nav[item as keyof typeof t.nav]}
                </button>
              ))}
            </nav>
          </div>

          <div>
            <h4 className="font-heading font-semibold text-foreground mb-4">
              {t.footer.followUs}
            </h4>
            <div className="flex gap-3">
              <a
                href="https://www.instagram.com/poptum.in?igsh=dWo4d2k1dHNqZnQ3"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-muted/80 transition-colors cursor-pointer"
                data-testid="social-instagram"
              >
                <SiInstagram className="w-5 h-5" />
              </a>
              <a
                href="https://www.facebook.com/share/1C1FwCBt7T/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-muted/80 transition-colors cursor-pointer"
                data-testid="social-facebook"
              >
                <SiFacebook className="w-5 h-5" />
              </a>
              <a
                href="https://linkedin.com/company/poptum"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-muted/80 transition-colors cursor-pointer"
                data-testid="social-linkedin"
              >
                <SiLinkedin className="w-5 h-5" />
              </a>
              <a
                href="https://x.com/Poptum_Makhana"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Twitter (X)"
                className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-muted/80 transition-colors cursor-pointer"
                data-testid="social-twitter"
              >
                <SiX className="w-5 h-5" />
              </a>
              
            </div>
          </div>
        </div>

        <div className="border-t mt-8 pt-8 text-center">
          <p className="text-sm text-muted-foreground">
            &copy; {currentYear} Poptum. {t.footer.rights}
          </p>
        </div>
      </div>
    </footer>
  );
}
