from PIL import Image

def make_transparent(img):
    img = img.convert("RGBA")
    data = img.getdata()
    bg_color = data[0]
    
    new_data = []
    for item in data:
        dist = sum(abs(item[i] - bg_color[i]) for i in range(3))
        if dist < 30:
            new_data.append((255, 255, 255, 0))
        else:
            new_data.append(item)
    
    img.putdata(new_data)
    return img

def get_opaque_bbox(img, threshold=50):
    w, h = img.size
    min_x, max_x = w, 0
    min_y, max_y = h, 0
    found = False
    for y in range(h):
        for x in range(w):
            r, g, b, a = img.getpixel((x, y))
            if a > threshold:
                found = True
                if x < min_x: min_x = x
                if x > max_x: max_x = x
                if y < min_y: min_y = y
                if y > max_y: max_y = y
    if not found:
        return None
    return (min_x, min_y, max_x + 1, max_y + 1)

def build_wild_anim():
    png_path = "/Users/taymtayar/.gemini/antigravity-ide/brain/e7c7a1dd-1b41-4984-a7ae-b68b8bcfeedc/media__1785342448242.png"
    jpg_path = "/Users/taymtayar/.gemini/antigravity-ide/brain/e7c7a1dd-1b41-4984-a7ae-b68b8bcfeedc/media__1785342451608.jpg"
    
    img_png = make_transparent(Image.open(png_path))
    w_png, h_png = img_png.size
    
    split_x = int(w_png * 0.35)
    png_raw1 = img_png.crop((0, 0, split_x, h_png))
    png_raw2 = img_png.crop((split_x, 0, w_png, h_png))
    
    img_jpg = make_transparent(Image.open(jpg_path))
    jpg_raw1 = img_jpg
    
    # Swapped order: Closed, Fully Open, Half Open
    ordered_raws = [png_raw1, png_raw2, jpg_raw1]
    
    # Get cropped sprites
    sprites = []
    max_w, max_h = 0, 0
    for raw in ordered_raws:
        bbox = get_opaque_bbox(raw, 50)
        sprite = raw.crop(bbox) if bbox else raw
        sprites.append(sprite)
        if sprite.width > max_w: max_w = sprite.width
        if sprite.height > max_h: max_h = sprite.height
        
    # Set cell size with padding
    cell_size = max(max_w, max_h) + 20
    
    new_img = Image.new("RGBA", (cell_size * 3, cell_size))
    
    for i, sprite in enumerate(sprites):
        paste_x = (i * cell_size) + (cell_size - sprite.width) // 2
        paste_y = (cell_size - sprite.height) // 2
        new_img.paste(sprite, (paste_x, paste_y))
        
    out_path = "assets/cops_and_robbers/sprites/wild_anim.png"
    new_img.save(out_path)
    print(f"Saved {out_path} with cell size {cell_size}, total size {new_img.size}")

if __name__ == "__main__":
    build_wild_anim()
