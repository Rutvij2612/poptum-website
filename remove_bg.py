import sys
from PIL import Image

def remove_bg(input_path, output_path, bg_color, threshold=30):
    img = Image.open(input_path).convert("RGBA")
    datas = img.getdata()
    
    new_data = []
    for item in datas:
        # Check if pixel is close to background color
        if abs(item[0] - bg_color[0]) < threshold and \
           abs(item[1] - bg_color[1]) < threshold and \
           abs(item[2] - bg_color[2]) < threshold:
            # Check if it's near the edge of the color (very naive anti-aliasing could be done here, but let's just make it transparent)
            new_data.append((255, 255, 255, 0))
        else:
            new_data.append(item)
            
    img.putdata(new_data)
    img.save(output_path, "PNG")
    print(f"Saved {output_path}")

# barbeque box background is roughly e5e5e5 (229, 229, 229)
remove_bg("c:\\Users\\RUTVIJ\\OneDrive\\Desktop\\POPTUM2\\PoptumCatalog2\\client\\public\\barbeque_box.png", 
          "c:\\Users\\RUTVIJ\\OneDrive\\Desktop\\POPTUM2\\PoptumCatalog2\\client\\public\\barbeque_box_transparent.png", 
          (229, 229, 229), threshold=20)

# clean makhana background is pure white (255, 255, 255)
remove_bg("C:\\Users\\RUTVIJ\\.gemini\\antigravity\\brain\\04e533a1-0a3b-46b3-b0d3-5942c272090a\\clean_makhana_1779537303161.png", 
          "c:\\Users\\RUTVIJ\\OneDrive\\Desktop\\POPTUM2\\PoptumCatalog2\\client\\public\\clean_makhana_transparent.png", 
          (255, 255, 255), threshold=30)
