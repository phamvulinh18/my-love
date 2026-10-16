# Love Universe 3D 🌌💖

Trải nghiệm không gian 3D tương tác lãng mạn **"You Are My Universe"** được xây dựng bằng **Three.js**, **WebGL**, **GLSL Shader** và **GSAP**.

![Love Universe Preview](C:/Users/kjhjh/.gemini/antigravity-ide/brain/41f5e852-a447-4973-89da-99f4f366a811/love_universe_entered_1792160987606.png)

## ✨ Điểm nổi bật & Tính năng kỹ thuật

1. **Dải Ngân Hà 3D Xoắn Ốc (Spiral Galaxy)**:
   - Hơn **45.000 hạt sao** được tạo bằng `THREE.BufferGeometry` và `THREE.Points`.
   - Phân bố theo 4 nhánh xoắn ốc toán học với gradient từ trắng ngọc trai (`#FFF5FB`), hồng neon (`#FF4FA3`) đến tím lavender (`#B69CFF`).
   - Custom GLSL vertex & fragment shader tạo các hạt tròn sáng mềm mại với hiệu ứng lấp lánh (twinkle) bất đồng bộ.

2. **Trái Tim Tinh Thể Phát Sáng (Crystal Ruby Heart)**:
   - Trái tim 3D với đường cong mượt mà bằng parametric Bezier curve extrusion và bevel đa tầng.
   - Chất liệu `MeshPhysicalMaterial` khúc xạ cao mô phỏng ngọc ruby / thủy tinh hồng trong suốt, phản chiếu ánh sáng môi trường.
   - Nhịp đập hai pha hữu cơ (lub-dub rhythm) và ánh sáng phát quang trung tâm (`PointLight`).
   - Hai vòng quỹ đạo bụi sao lấp lánh xoay quanh trái tim.
   - **Tương tác**: Khi click vào trái tim, kích hoạt hiệu ứng bung nở sóng xung kích (shockwave ring) và hàng trăm hạt ánh sáng văng ra.

3. **Vũ Trụ Đa Tầng & Tinh Vân (Nebula & Deep Starfield)**:
   - 22 cụm mây tinh vân hồng tím dạng khí vũ trụ tạo chiều sâu không gian.
   - 8.000 vì sao không gian sâu trên bán kính 120 đơn vị tạo hiệu ứng thị sai (parallax) khi di chuyển chuột.
   - Sao băng (Shooting stars / Meteors) bay ngang bầu trời theo chu kỳ ngẫu nhiên với vệt đuôi phát sáng.

4. **Hậu Kỳ Điện Ảnh (Post-Processing & Bloom)**:
   - Sử dụng `EffectComposer`, `RenderPass`, `UnrealBloomPass` và `OutputPass` với ToneMapping ACES Filmic.
   - Tinh chỉnh ngưỡng sáng để dải ngân hà và trái tim phát sáng dịu mắt, huyền ảo mà không bị cháy sáng hay mờ đục.

5. **Âm Thanh Không Gian (Procedural Web Audio API)**:
   - Hợp âm không gian ấm áp (celestial ambient pad) được tổng hợp bằng Web Audio API không cần tải file ngoài.
   - Âm thanh nhịp tim và tiếng chuông pha lê (sparkle chime) khi tương tác.

6. **Tương Tác & Responsive**:
   - Camera cinematic fly-in khi bắt đầu.
   - Nút **"Khám Phá Thiên Hà"** thu nhỏ giao diện và đưa camera vào góc nhìn cận cảnh.
   - Hỗ trợ chuột và cảm ứng xoay 360 độ (giới hạn góc nhìn bảo toàn bố cục).
   - Hiệu ứng tim bay và bụi sao xuất hiện tại tọa độ click/touch.

---

## 🚀 Cài Đặt & Khởi Chạy

### Yêu Cầu Môi Trường
- Node.js >= 18.0.0
- npm hoặc yarn/pnpm

### Các bước chạy:
```bash
# Cài đặt dependencies
npm install

# Khởi chạy dev server
npm run dev

# Mở trình duyệt tại:
# http://localhost:5173/
```

### Build cho Production:
```bash
npm run build
npm run preview
```

---

## 📁 Cấu Trúc Dự Án

```
mylove/
├── index.html                 # Cấu trúc trang, typography và overlay UI
├── package.json               # Cấu hình dự án (Three.js, GSAP, Vite)
├── README.md                  # Hướng dẫn chi tiết
└── src/
    ├── main.js                # Quản lý vòng lặp Three.js, Camera & Tương tác
    ├── style.css              # Màu sắc chủ đạo, glassmorphism, typography
    └── modules/
        ├── Galaxy.js          # Dải ngân hà xoắn ốc 45.000 hạt sao & GLSL Shader
        ├── Heart.js           # Trái tim 3D ruby, nhịp đập, quỹ đạo hạt & shockwave
        ├── SpaceNebula.js     # Tinh vân hồng tím và bụi vũ trụ trôi nổi
        ├── Starfield.js       # Bầu trời sao sâu & hiệu ứng sao băng định kỳ
        ├── PostProcessing.js  # UnrealBloomPass, EffectComposer & ToneMapping
        └── Sound.js           # Hệ thống âm thanh procedural Web Audio API
```
