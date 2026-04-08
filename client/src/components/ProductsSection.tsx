import { useLanguage } from '@/lib/language-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Sparkles } from 'lucide-react';

interface Product {
  name: string;
  description: string;
  image?: string;
  icon: React.ReactNode;
}

export default function ProductsSection() {
  const { t } = useLanguage();

  const byproducts: Product[] = [
    {
      name: t.products?.kheer?.name || 'Makhana Kheer',
      description: t.products?.kheer?.description || 'Traditional Indian dessert made with Makhana',
      icon: <Sparkles className="w-8 h-8" />,
    },
    {
      name: t.products?.chocolate?.name || 'Makhana Chocolate Bars',
      description: t.products?.chocolate?.description || 'Delicious chocolate-coated Makhana bars',
      icon: <Package className="w-8 h-8" />,
    },
    {
      name: t.products?.chevdo?.name || 'Makhana Chevdo',
      description: t.products?.chevdo?.description || 'Savory mix with Makhana and spices',
      icon: <Sparkles className="w-8 h-8" />,
    },
    {
      name: t.products?.roasted?.name || 'Roasted Makhana',
      description: t.products?.roasted?.description || 'Pure roasted Makhana - simple and nutritious',
      icon: <Package className="w-8 h-8" />,
    },
  ];

  return (
    <section
      id="products"
      className="py-20 lg:py-28 bg-background"
      data-testid="products-section"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 animate-fade-in-down">
          <h2 className="font-heading text-4xl lg:text-5xl font-bold text-foreground mb-4">
            {t.products?.title || 'Poptum Value-Added Products'}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t.products?.subtitle || 'Discover the diverse range of Makhana-based products'}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {byproducts.map((product, index) => (
            <Card
              key={product.name}
              className="animate-fade-in-up hover:shadow-lg transition-all duration-300 hover:scale-105 group"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardHeader>
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  {product.icon}
                </div>
                <CardTitle className="text-xl font-heading">
                  {product.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {product.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center animate-fade-in">
          <p className="text-muted-foreground max-w-3xl mx-auto">
            {t.products?.footerText ||
              'From traditional recipes to modern innovations, explore how Makhana can be enjoyed in various forms and preparations.'}
          </p>
        </div>
      </div>
    </section>
  );
}



