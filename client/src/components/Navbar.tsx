import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/lib/language-context';
import { motion } from 'framer-motion';
import { useLocation } from "wouter";
import { getAuth, logout } from "@/lib/auth";
const navItems = [
  { key: 'home', href: '#home' },
  { key: 'about', href: '#about' },
  { key: 'flavours', href: '#flavours' },
  { key: 'process', href: '#process' },
  { key: 'benefits', href: '#benefits' },
  { key: 'presence', href: '#presence' },
  // Gallery nav item temporarily removed
  // { key: 'gallery', href: '#gallery' },
  { key: 'contact', href: '#contact' },
] as const;

const tickerMessages = [
  "COMING SOON IN INDIA 🇮🇳",
  "COMING SOON IN UNITED KINGDOM 🇬🇧",
  "COMING SOON IN INDIA 🇮🇳",
  "COMING SOON IN UNITED KINGDOM 🇬🇧",
  "COMING SOON IN INDIA 🇮🇳",
  "COMING SOON IN UNITED KINGDOM 🇬🇧",
  "COMING SOON IN INDIA 🇮🇳",
  "COMING SOON IN UNITED KINGDOM 🇬🇧",
];

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { language, setLanguage, t } = useLanguage();
  const [location, setLocation] = useLocation();
  const [authState, setAuthState] = useState(() => getAuth());
  const { token, role, username } = authState;
  const [firstName, setFirstName] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    setAuthState(getAuth());
  }, [location]);

  useEffect(() => {
    if (!token) {
      setFirstName(null);
      return;
    }
    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok && data.success && data.user?.firstName) {
          setFirstName(data.user.firstName);
        } else {
          setFirstName(username || 'User');
        }
      } catch (e) {
        console.error("Failed to fetch profile in navbar", e);
        setFirstName(username || 'User');
      }
    };
    fetchProfile();
  }, [token, username]);

  const displayName = firstName || username || 'User';

  useEffect(() => {
    if (!dropdownOpen) return;
    const handleClose = () => setDropdownOpen(false);
    window.addEventListener("click", handleClose);
    return () => window.removeEventListener("click", handleClose);
  }, [dropdownOpen]);

  const handleLogout = () => {
    logout();
    setAuthState({ token: null, role: null, username: null, country: null });
    setLocation("/");
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  const scrollToSection = (href: string) => {
    if (location !== "/") {
      setLocation("/" + href);
      return;
    }
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
                {item.key === 'presence'
                  ? (language === 'de' ? 'Präsenz' : 'Presence')
                  : t.nav[item.key as keyof typeof t.nav]}
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

            {token ? (
              <div className="relative hidden md:block ml-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-1 font-semibold text-sm hover:bg-accent/60"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDropdownOpen(!dropdownOpen);
                  }}
                  data-testid="navbar-user-dropdown-trigger"
                >
                  <span>{displayName}</span>
                  <span className="text-xs transition-transform duration-200" style={{ display: 'inline-block', transform: dropdownOpen ? 'rotate(180deg)' : 'none' }}>▼</span>
                </Button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white border border-border py-1 z-50 animate-fade-in" data-testid="navbar-user-dropdown-menu">
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        setLocation(role === "admin" ? "/admin" : "/dashboard");
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-foreground hover:bg-accent transition-colors font-medium"
                    >
                      {role === "admin" ? t.admin.dashboard : t.admin.userDashboard}
                    </button>
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        handleLogout();
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors font-medium border-t"
                    >
                      {t.admin.logout}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden md:flex items-center ml-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setLocation("/login")}
                >
                  {t.auth.login}
                </Button>
              </div>
            )}

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
            className="flex items-center gap-8 py-2 text-[11px] sm:text-xs md:text-sm font-semibold tracking-[0.25em] uppercase whitespace-nowrap"
            animate={{ x: ['0%', '-50%'] }}
            transition={{
              duration: 20,
              ease: 'linear',
              repeat: Infinity,
              repeatType: 'loop',
            }}
          >
            {tickerMessages.map((text: string, index: number) => (
              <span key={`${text}-${index}`} className="text-[#DE3B3B] font-bold opacity-100">
                {text}
              </span>
            ))}
            {tickerMessages.map((text: string, index: number) => (
              <span key={`${text}-${index}-duplicate`} className="text-[#DE3B3B] font-bold opacity-100">
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
                {item.key === 'presence'
                  ? (language === 'de' ? 'Präsenz' : 'Presence')
                  : t.nav[item.key as keyof typeof t.nav]}
              </button>
            ))}
             {token ? (
              <>
                <div className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider ${isScrolled ? 'text-gray-500' : 'text-gray-400'}`}>
                  {displayName}
                </div>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setLocation(role === "admin" ? "/admin" : "/dashboard");
                  }}
                  className={`block w-full text-left px-4 py-3 text-base font-medium rounded-md hover-elevate ${
                    isScrolled ? 'text-black' : 'text-white'
                  }`}
                >
                  {role === "admin" ? t.admin.dashboard : t.admin.userDashboard}
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className={`block w-full text-left px-4 py-3 text-base font-medium rounded-md hover-elevate ${
                    isScrolled ? 'text-red-600' : 'text-red-400'
                  }`}
                >
                  {t.admin.logout}
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setLocation("/login");
                }}
                className={`block w-full text-left px-4 py-3 text-base font-medium rounded-md hover-elevate ${
                  isScrolled ? 'text-black' : 'text-white'
                }`}
              >
                {t.auth.login}
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
