import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/lib/language-context';

interface FlavourData {
  name: string;
  fullDescription: string;
  ingredients: string;
  tasteProfile: string;
  servingIdeas: string;
  image: string;
}

interface FlavourModalProps {
  isOpen: boolean;
  onClose: () => void;
  flavour: FlavourData | null;
}

const nutritionData = {
  calcium: '60-70mg',
  magnesium: '30-40mg',
  fat: '1-3g',
  protein: '12-15g',
  potassium: '30-40mg',
  iron: '5-10mg',
  carbs: '7-9g',
  fiber: '5-6g',
};

export default function FlavourModal({ isOpen, onClose, flavour }: FlavourModalProps) {
  const { t } = useLanguage();

  if (!flavour) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" data-testid="flavour-modal">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl">{flavour.name}</DialogTitle>
          <DialogDescription className="sr-only">
            Details about {flavour.name} flavour including ingredients, nutrition, and serving ideas
          </DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-5 gap-6 mt-4">
          <div className="md:col-span-2">
            <div className="aspect-square rounded-xl overflow-hidden">
              <img
                src={flavour.image}
                alt={flavour.name}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <div className="md:col-span-3 space-y-6">
            <div>
              <p className="text-muted-foreground leading-relaxed">
                {flavour.fullDescription}
              </p>
            </div>

            <div>
              <h4 className="font-heading font-semibold text-foreground mb-2">
                {t.flavours.ingredients}
              </h4>
              <p className="text-sm text-muted-foreground">
                {flavour.ingredients}
              </p>
            </div>

            <div>
              <h4 className="font-heading font-semibold text-foreground mb-2">
                {t.flavours.tasteProfile}
              </h4>
              <Badge variant="secondary" className="text-sm">
                {flavour.tasteProfile}
              </Badge>
            </div>

            <div>
              <h4 className="font-heading font-semibold text-foreground mb-2">
                {t.flavours.servingIdeas}
              </h4>
              <p className="text-sm text-muted-foreground">
                {flavour.servingIdeas}
              </p>
            </div>

            <div>
              <h4 className="font-heading font-semibold text-foreground mb-3">
                {t.flavours.nutrition}
              </h4>
              <div className="grid grid-cols-4 gap-2">
                {Object.entries(nutritionData).map(([key, value]) => (
                  <div
                    key={key}
                    className="bg-muted rounded-lg p-3 text-center"
                  >
                    <p className="text-xs text-muted-foreground capitalize">
                      {t.nutrition[key as keyof typeof t.nutrition] as unknown as string}
                    </p>
                    <p className="font-semibold text-foreground text-sm">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
