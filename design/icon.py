import math, glob, os
from PIL import Image, ImageDraw, ImageFilter
BG=(13,11,9); BRASS=(201,160,72); BRASS_D=(150,112,40); HL=(236,205,130)
def shoe(size, scale=0.62, bg=True, alpha=False):
    S=size*4
    im=Image.new("RGBA",(S,S),BG+(255,) if bg else (0,0,0,0))
    d=ImageDraw.Draw(im)
    cx,cy=S/2,S/2+S*0.02; R=S*scale/2
    # outline like the hoof template: rounder toe, flatter heels
    pts=[]
    for i in range(240):
        a=math.pi*2*i/240
        x=math.sin(a); y=-math.cos(a)
        k=1.0 if y<0 else 1-0.18*y**3
        pts.append((cx+x*R*0.97*k, cy+y*R*(1.0 if y<0 else 0.86)))
    d.polygon(pts, fill=BRASS)
    # rim highlight band
    inner=[(cx+(p[0]-cx)*0.80,cy+(p[1]-cy)*0.80) for p in pts]
    d.polygon(inner, fill=BRASS_D)
    pocket=[(cx+(p[0]-cx)*0.76,cy+(p[1]-cy)*0.76) for p in pts]
    d.polygon(pocket, fill=BRASS)
    # toe kerfs
    for k in range(-2,3):
        a=k*0.22
        x0,y0=cx+math.sin(a)*R*0.78,cy-math.cos(a)*R*0.78
        x1,y1=cx+math.sin(a)*R*1.0,cy-math.cos(a)*R*1.0
        d.line([(x0,y0),(x1,y1)],fill=BG+(255,) if bg else (0,0,0,0),width=int(S*0.012))
    # frog V with teeth
    ty=cy-R*0.05; by=cy+R*1.1; hw=R*0.30
    v=[(cx,ty)]
    n=4
    for i in range(1,n+1):
        f=i/(n+1)*0.75; x=cx+hw*f*1.0; y=ty+(by-ty)*f
        v+= [(x,y),(x+R*0.09,y-R*0.02),(x+R*0.02,y+R*0.06)]
    v.append((cx+hw*1.25,by))
    v.append((cx-hw*1.25,by))
    for i in range(n,0,-1):
        f=i/(n+1)*0.75; x=cx-hw*f; y=ty+(by-ty)*f
        v+= [(x-R*0.02,y+R*0.06),(x-R*0.09,y-R*0.02),(x,y)]
    d.polygon(v, fill=BG+(255,) if bg else (0,0,0,0))
    # holes
    for (hx,hy) in [(-0.42,-0.42),(0.42,-0.42),(-0.55,-0.1),(0.55,-0.1),(-0.5,0.25),(0.5,0.25),(-0.18,-0.55),(0.18,-0.55)]:
        r=R*0.055; d.ellipse([cx+hx*R-r,cy+hy*R-r,cx+hx*R+r,cy+hy*R+r],fill=BG+(255,) if bg else (0,0,0,0))
    im=im.resize((size,size),Image.LANCZOS)
    if not alpha: im=im.convert("RGB")
    return im
os.makedirs("design/out",exist_ok=True)
shoe(1024).save("design/out/icon-1024.png")
# iOS
shoe(1024).save("ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png")
# Android legacy + round
for dpi,s in {"mdpi":48,"hdpi":72,"xhdpi":96,"xxhdpi":144,"xxxhdpi":192}.items():
    shoe(s,0.70).save(f"android/app/src/main/res/mipmap-{dpi}/ic_launcher.png")
    r=shoe(s,0.66,alpha=True); m=Image.new("L",(s,s),0); ImageDraw.Draw(m).ellipse([0,0,s-1,s-1],fill=255); r.putalpha(m); r.save(f"android/app/src/main/res/mipmap-{dpi}/ic_launcher_round.png")
    fs=int(s*108/48); shoe(fs,0.44,bg=False,alpha=True).save(f"android/app/src/main/res/mipmap-{dpi}/ic_launcher_foreground.png")
# splashes
for f in glob.glob("android/app/src/main/res/drawable*/splash.png")+glob.glob("ios/App/App/Assets.xcassets/Splash.imageset/*.png"):
    w,h=Image.open(f).size; sp=Image.new("RGB",(w,h),BG); ic=shoe(int(min(w,h)*0.32),0.9,bg=False,alpha=True); sp.paste(ic,((w-ic.width)//2,(h-ic.height)//2),ic); sp.save(f)
print("icons done")
