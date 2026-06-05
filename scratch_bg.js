const { Jimp } = require('jimp');
const fs = require('fs');

async function main() {
  const imagePath = 'c:\\Users\\RUTVIJ\\OneDrive\\Desktop\\POPTUM2\\PoptumCatalog2\\client\\public\\barbeque_box.png';
  if (!fs.existsSync(imagePath)) {
    console.error('File not found:', imagePath);
    return;
  }
  try {
    const image = await Jimp.read(imagePath);
    const colorInt = image.getPixelColor(0, 0);
    console.log(`Top left hex: ` + colorInt.toString(16));
    
    const h = image.bitmap.height;
    const colorInt2 = image.getPixelColor(0, Math.floor(h/2));
    console.log(`Mid left hex: ` + colorInt2.toString(16));
  } catch(e) {
    console.error(e);
  }
}
main();
