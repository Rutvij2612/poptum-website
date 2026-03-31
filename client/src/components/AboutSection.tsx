import { useLanguage } from '@/lib/language-context';
import biharFarmsImage from '@assets/generated_images/bihar_makhana_farms.png';

export default function AboutSection() {
  const { t } = useLanguage();

  return (
    <section
      id="about"
      className="py-20 lg:py-28 bg-card"
      data-testid="about-section"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 animate-fade-in-down">
          <h2 className="font-heading text-4xl lg:text-5xl font-bold text-foreground mb-4">
            {t.about.title}
          </h2>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center mb-16">
          <div className="space-y-8">
            <div>
              <h3 className="font-heading text-2xl font-semibold text-foreground mb-4">
                {t.about.vision}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {t.about.visionText}
              </p>
            </div>

            <div>
              <h3 className="font-heading text-2xl font-semibold text-foreground mb-4">
                {t.about.mission}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {t.about.missionText}
              </p>
            </div>

            <blockquote className="border-l-4 border-primary pl-6 py-2 italic text-foreground/80">
              {t.about.quote}
            </blockquote>
          </div>

          <div className="relative">
            <div className="aspect-video rounded-2xl overflow-hidden shadow-xl">
              <img
                src={biharFarmsImage}
                alt="Bihar Makhana Farms"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-6 -left-6 bg-primary text-primary-foreground px-6 py-4 rounded-xl shadow-lg">
              <p className="font-heading font-semibold">Bihar, India</p>
              <p className="text-sm opacity-90">{t.about.source}</p>
            </div>
          </div>
        </div>

        <div className="bg-background rounded-2xl p-8 lg:p-12">
          <h3 className="font-heading text-2xl font-semibold text-foreground mb-4 text-center">
            {t.about.source}
          </h3>
          <p className="text-muted-foreground leading-relaxed text-center max-w-3xl mx-auto">
            {t.about.sourceText}
          </p>
        </div>
      </div>
    </section>
  );
}
