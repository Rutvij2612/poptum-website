import { useEffect, useState } from 'react';
import { useLanguage } from '@/lib/language-context';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Globe, TrendingUp, Package } from 'lucide-react';

interface StatItem {
  icon: React.ReactNode;
  value: number;
  suffix: string;
  label: string;
  color: string;
}

export default function StatsSection() {
  const { t } = useLanguage();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.2 }
    );

    const section = document.getElementById('global-stats');
    if (section) {
      observer.observe(section);
    }

    return () => {
      if (section) {
        observer.unobserve(section);
      }
    };
  }, []);

  const stats: StatItem[] = [
    {
      icon: <Users className="w-8 h-8" />,
      value: 2969,
      suffix: '+',
      label: t.stats?.consumers || 'Global Consumers',
      color: 'text-blue-600',
    },
    {
      icon: <Globe className="w-8 h-8" />,
      value: 30,
      suffix: '+',
      label: t.stats?.countries || 'Countries',
      color: 'text-green-600',
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      value: 30,
      suffix: '%',
      label: t.stats?.growth || 'Market Growth',
      color: 'text-orange-600',
    },
    {
      icon: <Package className="w-8 h-8" />,
      value: 25130,
      suffix: ' MT',
      label: t.stats?.packages || 'Packages Delivered',
      color: 'text-purple-600',
    },
  ];

  const Counter = ({ end, suffix, duration = 2000 }: { end: number; suffix: string; duration?: number }) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
      if (!isVisible) return;

      let startTime: number;
      let animationFrame: number;

      const animate = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);
        
        // Easing function
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        setCount(Math.floor(end * easeOutQuart));

        if (progress < 1) {
          animationFrame = requestAnimationFrame(animate);
        }
      };

      animationFrame = requestAnimationFrame(animate);

      return () => {
        if (animationFrame) {
          cancelAnimationFrame(animationFrame);
        }
      };
    }, [isVisible, end, duration]);

    return (
      <span>
        {count.toLocaleString()}
        {suffix}
      </span>
    );
  };

  return (
    <section
      id="global-stats"
      className="py-20 lg:py-28 bg-gradient-to-br from-background to-card"
      data-testid="stats-section"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 animate-fade-in-down">
          <h2 className="font-heading text-4xl lg:text-5xl font-bold text-foreground mb-4">
            {t.stats?.title || 'Global Impact'}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t.stats?.subtitle || 'Our reach and impact worldwide'}
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <Card
              key={index}
              className="animate-fade-in-up hover:shadow-lg transition-all duration-300 hover:scale-105"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardContent className="p-6 text-center">
                <div className={`${stat.color} mb-4 flex justify-center`}>
                  {stat.icon}
                </div>
                <div className="text-3xl lg:text-4xl font-bold text-foreground mb-2">
                  <Counter end={stat.value} suffix={stat.suffix} />
                </div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center animate-fade-in">
          <p className="text-muted-foreground max-w-3xl mx-auto">
            {t.stats?.footerText ||
              'Join thousands of health-conscious consumers worldwide who have made Poptum their snack of choice.'}
          </p>
        </div>
      </div>
    </section>
  );
}



