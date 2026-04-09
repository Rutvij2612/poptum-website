import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface FlavourCardProps {
  name: string;
  description: string;
  image: string;
  buttonText: string;
  onViewDetails: () => void;
  animationDelay?: number;
  priceLabel?: string;
  onAddToCart?: () => void;
  isInCart?: boolean;
}

export default function FlavourCard({
  name,
  description,
  image,
  buttonText,
  onViewDetails,
  animationDelay = 0,
}: FlavourCardProps) {
  const slug = name.toLowerCase().replace(/\s+/g, '-');

  return (
    <Card
      className="group overflow-visible transition-all duration-300 hover:shadow-xl hover:-translate-y-1 animate-fade-in-up"
      style={{ animationDelay: `${animationDelay}s` }}
      data-testid={`flavour-card-${slug}`}
    >
      <div className="aspect-square overflow-hidden rounded-t-lg">
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      <CardContent className="p-6 text-center space-y-4">
        <div>
          <h3 className="font-heading text-xl font-semibold text-foreground mb-1">
            {name}
          </h3>
          <p className="text-muted-foreground text-sm mb-1 line-clamp-2">
            {description}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            onClick={onViewDetails}
            variant="outline"
            className="flex-1"
            data-testid={`button-view-${slug}`}
          >
            {buttonText}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
