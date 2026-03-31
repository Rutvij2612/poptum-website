import { useState } from 'react';
import FlavourModal from '../FlavourModal';
import { Button } from '@/components/ui/button';
import { LanguageProvider } from '@/lib/language-context';
import barbequeImage from '@assets/generated_images/barbeque_flavour_makhana.png';

export default function FlavourModalExample() {
  const [isOpen, setIsOpen] = useState(false);

  const flavour = {
    name: 'Barbeque',
    fullDescription: 'Dive into the smoky, spicy, and irresistibly crunchy world of Poptum Barbeque Makhanas. Each puff bursts with bold barbeque flavour and a hint of tangy sweetness that will have you reaching for more.',
    ingredients: 'Makhana (Fox Nuts), Olive Oil, BBQ Seasoning (Paprika, Garlic, Onion, Brown Sugar, Smoked Salt, Black Pepper, Cumin)',
    tasteProfile: 'Smoky, tangy, slightly sweet with a peppery finish',
    servingIdeas: 'Perfect as a movie night snack, party appetizer, or healthy alternative to chips.',
    image: barbequeImage,
  };

  return (
    <LanguageProvider>
      <div className="p-4">
        <Button onClick={() => setIsOpen(true)}>Open Flavour Modal</Button>
        <FlavourModal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          flavour={flavour}
        />
      </div>
    </LanguageProvider>
  );
}
