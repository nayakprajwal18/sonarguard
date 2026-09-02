"""Create a test sonar image"""
import numpy as np
from PIL import Image, ImageDraw

# Create a 512x512 grayscale sonar-like image
width, height = 512, 512
img_array = np.random.randint(20, 50, (height, width), dtype=np.uint8)

# Add some circular blips to simulate sonar targets
img = Image.fromarray(img_array, mode='L')
draw = ImageDraw.Draw(img)

# Draw some circles (sonar targets)
targets = [
    (150, 150, 80, "Ghost Gear"),
    (300, 250, 120, "Shipwreck"),
    (400, 150, 100, "Debris"),
]

for x, y, size, label in targets:
    # Draw a bright circle
    coords = [(x-size, y-size), (x+size, y+size)]
    draw.ellipse(coords, fill=200)

# Save the image
img.save("c:/Users/Admin/Desktop/SIH/sonarguard-backend/test_sonar.png")
print("Test sonar image created successfully!")
