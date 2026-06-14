import { useLanguage } from '@/lib/language-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Globe2, Clock, MapPin, ExternalLink } from 'lucide-react';

const stores = [
  {
    id: 1,
    name: "Spice Village | Indian & International Supermarkt",
    address: "Tempelhofer Damm 206, 12099 Berlin, Germany",
    link: "https://share.google/AOLFP2tpoOPCryEsv",
    initials: "SV"
  },
  {
    id: 2,
    name: "Indian & Srilankan Grocery Store (Asia Super Shop)",
    address: "Lindenstraße 17, 10969 Berlin, Germany",
    link: "https://share.google/tYHEQNkxnASe116vh",
    initials: "AS"
  },
  {
    id: 3,
    name: "VIP SPÄTI",
    address: "Pannierstraße 53A, 12047 Berlin, Germany",
    link: "https://share.google/5GwHdhaew7tBZGy9C",
    initials: "VS"
  },
  {
    id: 4,
    name: "Balkh Market",
    address: "Herzbergstraße 128-139 (Halle 6A, Room 611), 10365 Berlin, Germany",
    link: "https://share.google/ErRBa8YumE1LF1k2R",
    initials: "BM"
  },
  {
    id: 5,
    name: "Punjab Asiashop",
    address: "Bahnhofstraße 29, 86150 Augsburg, Germany",
    link: "https://share.google/T4FEoZ4r4U0sXsaJD",
    initials: "PA"
  }
];

export default function PresenceSection() {
  const { t, language } = useLanguage();

  return (
    <section
      id="presence"
      className="py-20 lg:py-28 bg-card"
      data-testid="presence-section"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 animate-fade-in-down">
          <h2 className="font-heading text-4xl lg:text-5xl font-bold text-foreground mb-4">
            {language === 'de' ? 'Unsere Präsenz' : 'Our Presence'}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {language === 'de' ? 'Finden Sie unsere Produkte bei ausgewählten Einzelhandelspartnern vor Ort' : 'Find our products at selected retail partners near you'}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-6">
          {stores.map((store) => (
            <a
              key={store.id}
              href={store.link}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col h-full bg-white rounded-xl border border-border/80 p-6 shadow-sm hover:shadow-md hover:border-primary/40 hover:-translate-y-1 transition-all duration-300"
            >
              <div className="flex flex-col h-full justify-between items-center text-center">
                <div className="flex flex-col items-center w-full">
                  {/* Branded Logo/Initials Placeholder */}
                  <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xl mb-4 group-hover:bg-primary/20 group-hover:scale-105 transition-all duration-300 shadow-inner">
                    {store.initials}
                  </div>
                  
                  {/* Store Name */}
                  <h4 className="font-semibold text-foreground text-sm tracking-tight mb-2 group-hover:text-primary transition-colors duration-200 line-clamp-2 min-h-[40px] flex items-center justify-center w-full">
                    {store.name}
                  </h4>
                  
                  {/* Address */}
                  <p className="text-xs text-muted-foreground flex items-start gap-1 w-full justify-center text-center leading-relaxed">
                    <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 text-muted-foreground/60" />
                    <span className="line-clamp-3 overflow-hidden text-ellipsis">
                      {store.address}
                    </span>
                  </p>
                </div>
                
                {/* Visit Store Action indicator */}
                <div className="mt-5 pt-3 border-t border-muted w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-primary/80 group-hover:text-primary transition-colors duration-200">
                  <span>{language === 'de' ? 'Geschäft besuchen' : 'Visit Store'}</span>
                  <ExternalLink className="w-3 h-3 text-primary/80 group-hover:text-primary transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}



