import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/lib/language-context';
import { motion } from 'framer-motion';

const navItems = [
  { key: 'home', href: '#home' },
  { key: 'about', href: '#about' },
  { key: 'flavours', href: '#flavours' },
  { key: 'process', href: '#process' },
  { key: 'benefits', href: '#benefits' },
  // Gallery nav item temporarily removed
  // { key: 'gallery', href: '#gallery' },
  { key: 'contact', href: '#contact' },
] as const;

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { language, setLanguage, t } = useLanguage();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-md shadow-md text-foreground'
          : 'bg-white/90 backdrop-blur-md shadow-sm text-foreground'
      }`}
      data-testid="navbar"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          <button
            onClick={() => scrollToSection('#home')}
            className="flex items-center group"
            data-testid="logo-button"
          >
            <img 
              src="/poptum_logo.png" 
              alt="Poptum Logo" 
              className="h-10 sm:h-12 w-auto object-contain group-hover:scale-105 transition-transform duration-200"
            />
          </button>

          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <button
                key={item.key}
                onClick={() => scrollToSection(item.href)}
                className={`px-3 py-2 text-sm font-semibold tracking-wide transition-colors hover-elevate rounded-full ${
                  isScrolled
                    ? 'text-foreground hover:bg-accent/60'
                    : 'text-foreground hover:bg-accent/60'
                }`}

                data-testid={`nav-${item.key}`}
              >
                {t.nav[item.key as keyof typeof t.nav]}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center border rounded-md overflow-hidden">
              <button
                onClick={() => setLanguage('en')}
                className={`px-3 py-1.5 text-sm font-semibold transition-colors ${
                  language === 'en'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-transparent text-muted-foreground hover-elevate'
                }`}
                data-testid="lang-en"
              >
                EN
              </button>
              <button
                onClick={() => setLanguage('de')}
                className={`px-3 py-1.5 text-sm font-semibold transition-colors ${
                  language === 'de'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-transparent text-muted-foreground hover-elevate'
                }`}
                data-testid="lang-de"
              >
                DE
              </button>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="mobile-menu-toggle"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Warning ticker */}
      <div className="w-full border-t border-border bg-black text-white">
        <div className="max-w-7xl mx-auto overflow-hidden">
          <motion.div
            className="flex items-center gap-16 py-2 text-[11px] sm:text-xs md:text-sm font-semibold tracking-[0.25em] uppercase whitespace-nowrap"
            animate={{ x: ['0%', '-50%'] }}
            transition={{
              duration: 14,
              ease: 'linear',
              repeat: Infinity,
              repeatType: 'loop',
            }}
          >
            {t.hero.tickerMessages.map((text: string) => (
              <span key={text} className="opacity-90">
                {text}
              </span>
            ))}
            {t.hero.tickerMessages.map((text: string) => (
              <span key={`${text}-duplicate`} className="opacity-90">
                {text}
              </span>
            ))}
          </motion.div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden bg-background/95 backdrop-blur-md border-t">
          <div className="px-4 py-4 space-y-2">
            {navItems.map((item) => (
              <button
                key={item.key}
                onClick={() => scrollToSection(item.href)}
                className={`block w-full text-left px-4 py-3 text-base font-medium rounded-md hover-elevate ${
                  isScrolled ? 'text-black' : 'text-white'
                }`}


                data-testid={`mobile-nav-${item.key}`}
              >
                {t.nav[item.key as keyof typeof t.nav]}
              </button>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
