"""현재 사이트(01052572449.m7114.kr)에서 받은 원본 사진 → public/images/*.webp (리사이즈·장비별 크롭)

  python -I scripts/prepare_images.py <원본 폴더>

원본 번호는 다운로드 순서(01~26). 19.png·22.png 는 '보유장비' 세로 이미지라 장비별로 잘라낸다.
"""
import os, sys
from PIL import Image

SRC = sys.argv[1]
OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'public', 'images')
os.makedirs(OUT, exist_ok=True)


def save(img, name, width):
    img = img.convert('RGB')
    if img.width > width:
        img = img.resize((width, round(img.height * width / img.width)), Image.LANCZOS)
    img.save(os.path.join(OUT, f'{name}.webp'), 'WEBP', quality=80, method=6)


# 차고지·작업 사진
for src, name, w in [('05.jpg', 'fleet-yard', 1600), ('03.jpg', 'fleet-line', 1400), ('04.jpg', 'fleet-trucks', 1400),
                     ('06.jpg', 'fleet-aerial', 1400), ('10.jpg', 'work-stage-night', 900), ('11.jpg', 'work-stage-truss', 900),
                     ('15.jpg', 'work-concert', 900), ('13.jpg', 'work-rooftop-lift', 900), ('14.jpg', 'work-rooftop-unit', 900)]:
    save(Image.open(os.path.join(SRC, src)), name, w)

# 보유장비 크롭: (원본, 이름, 화면좌표 x1,y1,x2,y2, 화면→원본 배율)
S19, S22 = 1000 / 443, 1000 / 642
CROPS = [
    ('19.png', 'eq-sky-3_5t', (12, 99, 218, 235), S19), ('19.png', 'eq-sky-5t', (226, 99, 432, 235), S19),
    ('19.png', 'eq-cargo-5t', (12, 310, 218, 464), S19), ('19.png', 'eq-tadano-13t', (226, 310, 432, 464), S19),
    ('19.png', 'eq-rough-16t', (12, 539, 218, 676), S19), ('19.png', 'eq-truck-16t', (226, 754, 432, 1041), S19),
    ('19.png', 'eq-kato-20t', (226, 1208, 432, 1495), S19), ('19.png', 'eq-crane-25t', (12, 1591, 218, 1911), S19),
    ('19.png', 'eq-kato-25t', (226, 1795, 432, 1911), S19),
    ('22.png', 'eq-tadano-70t', (16, 142, 316, 558), S22), ('22.png', 'eq-tadano-70t-site', (327, 654, 627, 1068), S22),
    ('22.png', 'eq-kato-80t', (327, 1320, 627, 1543), S22), ('22.png', 'eq-liebherr-100t', (16, 1650, 316, 1874), S22),
]
for src, name, box, s in CROPS:
    img = Image.open(os.path.join(SRC, src))
    save(img.crop(tuple(round(v * s) for v in box)), name, 800)

print('saved', len(os.listdir(OUT)), 'files ->', OUT)
