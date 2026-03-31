import FlavourCard from '../FlavourCard';
import barbequeImage from '@assets/generated_images/barbeque_flavour_makhana.png';

export default function FlavourCardExample() {
  return (
    <div className="max-w-xs p-4">
      <FlavourCard
        name="Barbeque"
        description="Smoky, spicy, and irresistibly crunchy — bringing the grill to your snack time!"
        image={barbequeImage}
        buttonText="View Details"
        onViewDetails={() => console.log('View details clicked')}
      />
    </div>
  );
}
