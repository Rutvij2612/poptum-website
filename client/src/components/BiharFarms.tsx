import { useLanguage } from '@/lib/language-context';
import biharFarmsImage from '@assets/generated_images/bihar_makhana_farms.png';

export default function BiharFarms() {
  const { t } = useLanguage();

  return (
    <section
      id="bihar-farms"
      className="py-20 lg:py-28 bg-background"
      data-testid="bihar-farms-section"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 animate-fade-in-down">
          <h2 className="font-heading text-4xl lg:text-5xl font-bold text-foreground mb-4">
            {t.biharFarms?.title || 'Bihar Makhana Farms'}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t.biharFarms?.subtitle || 'Discover the source of our premium Makhana'}
          </p>
        </div>

        <div className="max-w-5xl mx-auto animate-fade-in-up">
          <div className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl bg-card">
            <img
              src={biharFarmsImage}
              alt="Bihar Makhana Farms"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="mt-6 text-center animate-fade-in">
            <h3 className="font-heading text-xl font-semibold text-foreground mb-2">
              {t.biharFarms?.farm1?.title || 'Makhana Harvesting'}
            </h3>
            <p className="text-muted-foreground">
              {t.biharFarms?.farm1?.description || 'Traditional harvesting methods in Bihar'}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}



