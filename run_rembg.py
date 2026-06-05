from rembg import remove
from PIL import Image

input_path = r"C:\Users\RUTVIJ\.gemini\antigravity\brain\04e533a1-0a3b-46b3-b0d3-5942c272090a\clean_makhana_1779537303161.png"
output_path = r"c:\Users\RUTVIJ\OneDrive\Desktop\POPTUM2\PoptumCatalog2\client\public\clean_makhana_transparent.png"

input_image = Image.open(input_path)
output_image = remove(input_image)
output_image.save(output_path)
print("Saved without shadow!")
