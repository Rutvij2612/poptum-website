import { useLanguage } from '@/lib/language-context';
import { Card, CardContent } from '@/components/ui/card';
import { Award } from 'lucide-react';
import pmMakhana from '@assets/generated_images/pm_makhana.jpeg';

export default function Recognition() {
  const { t } = useLanguage();

  return (
    <section
      id="recognition"
      className="py-20 lg:py-28 bg-gradient-to-br from-background via-card to-background"
      data-testid="recognition-section"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 animate-fade-in-down">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Award className="w-8 h-8 text-primary" />
          </div>
          <h2 className="font-heading text-4xl lg:text-5xl font-bold text-foreground mb-4">
            {t.recognition?.title || 'Prime Minister Recognition'}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t.recognition?.subtitle || 'Honored by national recognition'}
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
        <Card className="overflow-hidden rounded-xl animate-fade-in-up">            <CardContent className="p-0">
        <div className="relative aspect-video overflow-hidden rounded-xl">
  <img
    src={pmMakhana}
    alt="Prime Minister Narendra Modi gifting Makhana to the President of the Republic of Mauritius"
    className="w-full h-full object-cover rounded-xl"
  />
</div>

              <div className="p-6 lg:p-8">
                <div className="prose prose-sm max-w-none">
                  <p className="text-muted-foreground leading-relaxed">
                    {t.recognition?.description ||
                      'Makhana, a traditional superfood from Bihar, has received recognition at the highest level of government. This recognition celebrates the nutritional value, cultural heritage, and economic potential of this remarkable crop.'}
                  </p>
                  <blockquote className="border-l-4 border-primary pl-6 py-2 my-6 italic text-foreground">
                    {t.recognition?.quote ||
                      '"Makhana from Bihar represents not just a nutritious food, but a symbol of our rich agricultural heritage and the potential for healthy, sustainable snacking."'}
                  </blockquote>
                  <p className="text-sm text-muted-foreground mt-4">
                    {t.recognition?.caption || 'Prime Minister of India promoting Makhana as a healthy snack option'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}



