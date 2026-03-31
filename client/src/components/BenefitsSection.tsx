import {
  Dumbbell,
  ShieldCheck,
  Zap,
  Wheat,
  Leaf,
  Droplets,
  FlaskConical,
  Clock,
} from 'lucide-react';
import { useLanguage } from '@/lib/language-context';

const benefitIcons = {
  protein: Dumbbell,
  antioxidants: ShieldCheck,
  lowCalorie: Zap,
  glutenFree: Wheat,
  vegan: Leaf,
  oliveOil: Droplets,
  labTested: FlaskConical,
  shelfLife: Clock,
} as const;

type BenefitKey = keyof typeof benefitIcons;

export default function BenefitsSection() {
  const { t } = useLanguage();

  const benefitKeys: BenefitKey[] = [
    'protein',
    'antioxidants',
    'lowCalorie',
    'glutenFree',
    'vegan',
    'oliveOil',
    'labTested',
    'shelfLife',
  ];

  return (
    <section
      id="benefits"
      className="py-20 lg:py-28 bg-background"
      data-testid="benefits-section"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 animate-fade-in-down">
          <h2 className="font-heading text-4xl lg:text-5xl font-bold text-foreground mb-4">
            {t.benefits.title}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t.benefits.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6">
          {benefitKeys.map((key, index) => {
            const Icon = benefitIcons[key];
            const benefit = t.benefits[key] as { title: string; description: string };
            return (
              <div
                key={key}
                className="bg-card rounded-xl p-6 text-center transition-all duration-300 hover:shadow-lg hover:-translate-y-1 animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
                data-testid={`benefit-${key}`}
              >
                <div className="w-14 h-14 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-heading font-semibold text-foreground mb-1 text-sm lg:text-base">
                  {benefit.title}
                </h3>
                <p className="text-xs lg:text-sm text-muted-foreground">
                  {benefit.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
