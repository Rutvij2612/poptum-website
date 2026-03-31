const fs = require('fs');
const file = 'client/src/components/FlavoursSection.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/type CartItem = \{[\s\S]*?\}\;\n\n/m, '');
content = content.replace(/  const \[cartFlavour[\s\S]*?\}, \[cartItems\]\);\n\n/m, '');
content = content.replace(/  const flavourPrices[\s\S]*?  \};\n\n  const formatPrice[\s\S]*?format\(price\);\n\n/m, '');
content = content.replace(/      price: flavourPrices\[key\],\n/g, '');
content = content.replace(/  const openCartModal = \([\s\S]*?  const handlePlaceOrder = async \(\) => \{[\s\S]*?  \};\n\n  return \(/m, '  return (');
content = content.replace(/                priceLabel=\{formatPrice\(data\.price\)\}\n                buttonText=\{t\.flavours\.viewDetails\}\n                onViewDetails=\{\(\) => setSelectedFlavour\(key\)\}\n                onAddToCart=\{\(\) => openCartModal\(key\)\}\n                isInCart=\{cartItems\.some\(item => item\.key === key\)\}/g, '                buttonText={t.flavours.viewDetails}\n                onViewDetails={() => setSelectedFlavour(key)}');
content = content.replace(/        \{\/\* Add to Cart modal \*\/\}[\s\S]*?(?=    <\/section>)/m, '');

fs.writeFileSync(file, content);
