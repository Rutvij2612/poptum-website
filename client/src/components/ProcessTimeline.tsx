import { Leaf, Flame, SprayCan, Package, Plane } from 'lucide-react';
import { useLanguage } from '@/lib/language-context';

const processSteps = [
  { key: 'step1', icon: Leaf },
  { key: 'step2', icon: Flame },
  { key: 'step3', icon: SprayCan },
  { key: 'step4', icon: Package },
  { key: 'step5', icon: Plane },
] as const;

export default function ProcessTimeline() {
  const { t } = useLanguage();

  return (
    <section
      id="process"
      className="py-20 lg:py-28 bg-card"
      data-testid="process-section"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 animate-fade-in-down">
          <h2 className="font-heading text-4xl lg:text-5xl font-bold text-foreground mb-4">
            {t.process.title}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t.process.subtitle}
          </p>
        </div>

        <div className="hidden lg:block">
          <div className="relative flex justify-between items-start">
            <div className="absolute top-12 left-[10%] right-[10%] h-0.5 bg-border" />
            <div className="absolute top-12 left-[10%] right-[10%] h-0.5 bg-primary" style={{ width: '80%' }}>
              <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary to-primary/30" />
            </div>

            {processSteps.map((step, index) => {
              const Icon = step.icon;
              const stepData = t.process[step.key as keyof typeof t.process] as { title: string; description: string };
              return (
                <div 
                key={step.key}
                className="flex flex-col items-center text-center w-1/5 relative z-10 animate-fade-in-up"
     style={{ animationDelay: `${index * 0.15}s` }}>

  <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center mb-3 shadow-lg">
    <Icon className="w-10 h-10 text-primary-foreground" />
  </div>

  <span className="text-xs font-bold text-primary mb-1">
    {String(index + 1).padStart(2, '0')}
  </span>

  <h3 className="font-heading font-semibold text-foreground mb-2">
    {stepData.title}
  </h3>

  <p className="text-sm text-muted-foreground max-w-[150px]">
    {stepData.description}
  </p>
                  
                </div>
              );
            })}
          </div>
        </div>

        <div className="lg:hidden space-y-8">
          {processSteps.map((step, index) => {
            const Icon = step.icon;
            const stepData = t.process[step.key as keyof typeof t.process] as { title: string; description: string };
            return (
              <div key={step.key} className="flex gap-4 items-start">
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center shadow-lg">
                    <Icon className="w-7 h-7 text-primary-foreground" />
                  </div>
                  {index < processSteps.length - 1 && (
                    <div className="w-0.5 h-16 bg-border mt-2" />
                  )}
                </div>
                <div className="flex-1 pt-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-primary">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <h3 className="font-heading font-semibold text-foreground">
                      {stepData.title}
                    </h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {stepData.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
