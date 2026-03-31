import { useLanguage } from '@/lib/language-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Globe2, Clock } from 'lucide-react';

export default function PresenceSection() {
  const { t } = useLanguage();

  return (
    <section
      id="presence"
      className="py-20 lg:py-28 bg-card"
      data-testid="presence-section"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 animate-fade-in-down">
          <h2 className="font-heading text-4xl lg:text-5xl font-bold text-foreground mb-4">
            {t.presence?.title || 'Our Presence & Partners'}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t.presence?.subtitle || 'Global reach and trusted partnerships'}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Our Presence */}
          <Card className="animate-fade-in-up">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Globe2 className="w-6 h-6 text-primary" />
                <CardTitle>{t.presence?.presenceTitle || 'Our Presence'}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-6 bg-muted/50 rounded-lg border border-dashed border-muted-foreground/20">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground mb-2">
                    <Clock className="w-5 h-5" />
                    <span className="font-medium">Coming Soon</span>
                  </div>
                  <p className="text-sm text-center text-muted-foreground">
                    {t.presence?.presencePlaceholder ||
                      'We are expanding our global presence. Stay tuned for updates on our international locations and distribution networks.'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Official Partners */}
          <Card className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Building2 className="w-6 h-6 text-primary" />
                <CardTitle>{t.presence?.partnersTitle || 'Official Partners'}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-6 bg-muted/50 rounded-lg border border-dashed border-muted-foreground/20">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground mb-2">
                    <Clock className="w-5 h-5" />
                    <span className="font-medium">Coming Soon</span>
                  </div>
                  <p className="text-sm text-center text-muted-foreground">
                    {t.presence?.partnersPlaceholder ||
                      'We are building strategic partnerships with leading retailers and distributors worldwide. Partner information will be announced soon.'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional placeholder cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {[1, 2, 3].map((item) => (
            <Card
              key={item}
              className="animate-fade-in-up hover:shadow-md transition-shadow"
              style={{ animationDelay: `${0.2 + item * 0.1}s` }}
            >
              <CardContent className="p-8">
                <div className="aspect-square bg-muted/30 rounded-lg flex items-center justify-center border-2 border-dashed border-muted-foreground/20">
                  <div className="text-center">
                    <Clock className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm font-medium text-muted-foreground">
                      {t.presence?.comingSoon || 'Coming Soon'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}



