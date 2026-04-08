import { useLanguage } from '@/lib/language-context';
import { Card, CardContent } from '@/components/ui/card';
import { Heart } from 'lucide-react';
import buddhaImage from '@assets/buddha.png';

export default function CulturalSection() {
  const { t } = useLanguage();

  return (
    <section
      id="cultural"
      className="py-20 lg:py-28 bg-card"
      data-testid="cultural-section"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12 animate-fade-in-down">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <Heart className="w-8 h-8 text-primary" />
            </div>
            <h2 className="font-heading text-4xl lg:text-5xl font-bold text-foreground mb-4">
              {t.cultural?.title || 'Cultural Connection'}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t.cultural?.subtitle || 'Makhana and the legacy of Bihar'}
            </p>
          </div>

          <Card className="overflow-hidden rounded-xl animate-fade-in-up">
            <CardContent className="p-0">
              <div className="relative aspect-video overflow-hidden rounded-xl">
                <img
                  src={buddhaImage}
                  alt="Lord Buddha and the legacy of Makhana in Bihar"
                  className="w-full h-full object-cover rounded-xl"
                />
              </div>
              <div className="p-8 lg:p-12">
                <div className="prose prose-lg max-w-none">
                  <div className="mb-6">
                  <div>
                    <h3 className="font-heading text-2xl font-semibold text-foreground mb-4">
                      {t.cultural?.buddhaTitle || 'Lord Buddha & Makhana'}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed mb-4">
                      {t.cultural?.buddhaDescription ||
                        'Bihar, the land where Makhana is cultivated, holds profound cultural and spiritual significance. It is the birthplace of Buddhism, where Lord Buddha attained enlightenment under the Bodhi tree. Just as Buddha\'s teachings have spread wisdom and peace across the globe, Makhana from this sacred land brings health and nourishment to people worldwide.'}
                    </p>
                    <p className="text-muted-foreground leading-relaxed mb-4">
                      {t.cultural?.connectionText ||
                        'This connection symbolizes more than geography—it represents a tradition of purity, mindfulness, and holistic well-being that has been cherished for centuries. Makhana, often used in religious ceremonies and fasting rituals, embodies the values of simplicity, health, and spiritual nourishment that are central to the cultural heritage of Bihar.'}
                    </p>
                  </div>
                </div>

                <div className="border-t pt-6 mt-6">
                  <blockquote className="border-l-4 border-primary pl-6 py-2 italic text-foreground/90 text-lg">
                    {t.cultural?.quote ||
                      '"Just as the lotus rises pure from muddy waters, Makhana emerges as a symbol of purity and health from the sacred ponds of Bihar."'}
                  </blockquote>
                </div>

                <div className="mt-8 p-6 bg-primary/5 rounded-lg">
                  <h4 className="font-heading font-semibold text-foreground mb-3">
                    {t.cultural?.traditionTitle || 'Traditional Significance'}
                  </h4>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {t.cultural?.traditionText ||
                      'Makhana has been a part of traditional Indian cuisine for over 2,000 years. It is particularly valued during religious observances, weddings, and festivals, where it symbolizes prosperity and purity. The preparation and consumption of Makhana connect modern consumers to an ancient tradition of mindful eating and cultural reverence.'}
                  </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}



