from PIL import Image

# Flashlight (4th frame, on)
img1 = Image.open('frontend/assets/cops_and_robbers/sprites/flashlight_anim.png')
# Crop: (left, upper, right, lower)
frame1 = img1.crop((256 * 3, 0, 1024, 746))
frame1.save('frontend/assets/cops_and_robbers/sprites/L4_flashlight.png')

# Handcuffs (1st frame, closed)
img2 = Image.open('frontend/assets/cops_and_robbers/sprites/handcuffs_anim.png')
frame2 = img2.crop((0, 0, 256, 753))
frame2.save('frontend/assets/cops_and_robbers/sprites/L2_handcuffs.png')
