import { useLanguage } from '@/lib/language-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SnackData {
  name: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber: number;
}

export default function NutritionSection() {
  const { t } = useLanguage();

  const snacks: SnackData[] = [
    {
      name: t.nutrition?.snacks?.makhana?.name || 'Makhana',
      calories: 350,
      protein: 14,
      fat: 0.5,
      carbs: 76,
      fiber: 14,
    },
    {
      name: t.nutrition?.snacks?.popcorn?.name || 'Popcorn',
      calories: 387,
      protein: 12,
      fat: 4.5,
      carbs: 78,
      fiber: 15,
    },
    {
      name: t.nutrition?.snacks?.chips?.name || 'Potato Chips',
      calories: 536,
      protein: 7,
      fat: 35,
      carbs: 53,
      fiber: 5,
    },
  ];

  const maxValues = {
    calories: Math.max(...snacks.map((s) => s.calories)),
    protein: Math.max(...snacks.map((s) => s.protein)),
    fat: Math.max(...snacks.map((s) => s.fat)),
    carbs: Math.max(...snacks.map((s) => s.carbs)),
    fiber: Math.max(...snacks.map((s) => s.fiber)),
  };

  const BarChart = ({ value, max, label }: { value: number; max: number; label: string }) => (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold">{value}g</span>
      </div>
      <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-1000 ease-out rounded-full"
          style={{ width: `${(value / max) * 100}%` }}
        />
      </div>
    </div>
  );

  return (
    <section
      id="nutrition"
      className="py-20 lg:py-28 bg-card"
      data-testid="nutrition-section"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 animate-fade-in-down">
          <h2 className="font-heading text-4xl lg:text-5xl font-bold text-foreground mb-4">
            {t.nutrition?.title || 'Nutrition & Comparison'}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t.nutrition?.subtitle || 'See how Makhana compares to popular snacks (per 100g)'}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {snacks.map((snack, index) => (
            <Card
              key={snack.name}
              className={`animate-fade-in-up transition-all duration-300 hover:shadow-lg ${
                index === 0 ? 'border-primary border-2' : ''
              }`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardHeader>
                <CardTitle className="text-2xl font-heading">
                  {snack.name}
                  {index === 0 && (
                    <span className="ml-2 text-sm bg-primary text-primary-foreground px-2 py-1 rounded">
                      Best Choice
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <BarChart
                  value={snack.calories}
                  max={maxValues.calories}
                  label={t.nutrition?.calories || 'Calories'}
                />
                <BarChart
                  value={snack.protein}
                  max={maxValues.protein}
                  label={t.nutrition?.protein || 'Protein'}
                />
                <BarChart
                  value={snack.fat}
                  max={maxValues.fat}
                  label={t.nutrition?.fat || 'Fat'}
                />
                <BarChart
                  value={snack.carbs}
                  max={maxValues.carbs}
                  label={t.nutrition?.carbs || 'Carbs'}
                />
                <BarChart
                  value={snack.fiber}
                  max={maxValues.fiber}
                  label={t.nutrition?.fiber || 'Fiber'}
                />

                <div className="pt-4 border-t">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">
                        {t.nutrition?.calories || 'Calories'}:
                      </span>
                      <span className="font-semibold ml-2">{snack.calories}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        {t.nutrition?.protein || 'Protein'}:
                      </span>
                      <span className="font-semibold ml-2">{snack.protein}g</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        {t.nutrition?.fat || 'Fat'}:
                      </span>
                      <span className="font-semibold ml-2">{snack.fat}g</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        {t.nutrition?.fiber || 'Fiber'}:
                      </span>
                      <span className="font-semibold ml-2">{snack.fiber}g</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center animate-fade-in">
          <p className="text-muted-foreground max-w-3xl mx-auto">
            {t.nutrition?.footerText ||
              'Makhana offers an excellent nutritional profile with high protein, low fat, and rich fiber content, making it an ideal healthy snack choice.'}
          </p>
        </div>
      </div>
    </section>
  );
}



