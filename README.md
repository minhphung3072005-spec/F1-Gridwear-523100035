# F1 Fashion Store - F1 Gridwear

Website thuong mai dien tu ban thoi trang Formula 1, ho tro day du quy trinh tu xem san pham, gio hang, checkout den quan ly don hang, ton kho va dashboard quan tri.

## Chuc nang

### Khach hang

- Dang ky, dang nhap, refresh token va dang xuat.
- Xem, tim kiem, loc va sap xep san pham.
- Chon size, mau, xem ton kho theo SKU.
- Gio hang cho khach va dong bo gio sau dang nhap.
- Dia chi giao hang, coupon, checkout COD.
- Theo doi va huy don hop le.
- Danh gia san pham sau khi don da giao; review cho admin duyet.
- Danh sach yeu thich tren trinh duyet.

### Quan tri vien

- Dashboard doanh thu, don hang, khach hang, ton kho va top ban chay.
- CRUD san pham, anh, SKU, category, brand va coupon.
- Dieu chinh ton kho va xem lich su inventory transaction.
- Xu ly don theo state machine `PENDING -> CONFIRMED -> SHIPPING -> DELIVERED`.
- Quan ly thanh toan, khach hang va review.
- Responsive tren desktop va mobile.

## Cong nghe

| Thanh phan | Cong nghe |
|---|---|
| Frontend | React 19, TypeScript, Vite, React Router, TanStack Query, Zustand, Recharts |
| Backend | Node.js, Express 5, TypeScript, Zod |
| Database | MySQL 8, Prisma ORM 7 |
| Authentication | JWT access token, rotating HttpOnly refresh token, bcrypt |
| Testing | Node Test Runner, Supertest |

## Cau truc

```text
do_an_523100035/
|-- backend/
|   |-- prisma/          # schema, migrations, seed
|   |-- scripts/         # smoke test
|   `-- src/             # API theo module
|-- frontend/
|   |-- public/assets/
|   `-- src/             # customer website + admin UI
|-- docs/                # ERD, API, flow, test case, bao ve
|-- PHASE_1_SYSTEM_ANALYSIS.md
`-- README.md
```

## Yeu cau moi truong

- Node.js `>= 22.12`
- MySQL Server 8.x
- npm

## Cai dat

### 1. Database va backend

```powershell
cd backend
Copy-Item .env.example .env
npm install
npx prisma migrate dev
npm run prisma:seed
npm run dev
```

Sua `DATABASE_URL` trong `backend/.env` theo tai khoan MySQL cua may. Khong dua file `.env` len source control.

Backend mac dinh: `http://localhost:5000/api/v1`.

### 2. Frontend

Mo terminal khac:

```powershell
cd frontend
npm install
npm run dev -- --port 3000
```

Frontend: `http://localhost:3000`.

## Tai khoan demo

| Vai tro | Email | Mat khau |
|---|---|---|
| Admin | `admin@f1store.com` | `Admin@123` |
| Customer | `minhanh@example.com` | `Customer@123` |

Chi dung tai khoan tren trong development/demo.

## Lenh kiem tra

```powershell
cd backend
npm run typecheck
npm run build
npm test
npm audit --omit=dev

cd ../frontend
npm run typecheck
npm run build
npm audit --omit=dev
```

Ket qua ban giao: `55/55` test dat; frontend/backend build thanh cong; audit production dependency khong phat hien lo hong.

## Demo chinh

1. Customer xem Ferrari, chon Racing Red + M va them 2 san pham.
2. Checkout COD; stock giam va tao transaction `SALE`.
3. Admin xu ly don den `DELIVERED`; dashboard cap nhat doanh thu.
4. Customer gui review; admin duyet; review xuat hien tren chi tiet san pham.

Chi tiet: [docs/DEMO_AND_DEFENSE.md](docs/DEMO_AND_DEFENSE.md).

## Tai lieu

- [System analysis, Use Case va Sequence](PHASE_1_SYSTEM_ANALYSIS.md)
- [ERD](docs/ERD.md)
- [API design](docs/API_DESIGN.md)
- [Authentication](docs/AUTH_FLOW.md)
- [Order va inventory flow](docs/ORDER_INVENTORY_FLOW.md)
- [Seed plan](docs/SEED_PLAN.md)
- [Test cases](docs/TEST_CASES.md)
- [Noi dung thuyet trinh va bao ve](docs/DEMO_AND_DEFENSE.md)
- [Tom tat bao cao](docs/PROJECT_REPORT.md)

## Gioi han hien tai

- Thanh toan online VNPay/MoMo da co kieu du lieu mo rong nhung ban demo chi kich hoat COD.
- Anh san pham duoc quan ly bang URL; co the mo rong sang Cloudinary/S3.
- Wishlist hien luu tai trinh duyet; co the dong bo database o phien ban sau.
