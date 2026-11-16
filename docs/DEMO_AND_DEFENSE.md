# Kich ban demo va noi dung bao ve

## Kich ban demo 8-10 phut

### 1. Gioi thieu

De tai: **Xay dung website ban thoi trang Formula 1 - F1 Fashion Store**.

Hai nhom nguoi dung: customer mua hang va admin van hanh cua hang.

### 2. Customer flow

1. Mo homepage va gioi thieu giao dien responsive.
2. Vao catalog, tim Ferrari, loc category/brand.
3. Mo san pham Ferrari, chon Racing Red + M; chi ra stock 10.
4. Them 2 san pham vao cart.
5. Dang nhap `minhanh@example.com / Customer@123`.
6. Chon dia chi, ap dung `RACE10`, checkout COD.
7. Mo chi tiet don va theo doi trang thai.

### 3. Admin flow

1. Dang nhap `admin@f1store.com / Admin@123`.
2. Mo Orders, tim don vua tao.
3. Chuyen `PENDING -> CONFIRMED -> SHIPPING -> DELIVERED`.
4. Mo Inventory, tim SKU Ferrari Red/M; xem transaction `SALE -2`, stock `10 -> 8`.
5. Mo Dashboard, chi ra revenue va order distribution cap nhat.
6. Gioi thieu CRUD san pham, anh, SKU, category, brand, coupon.

### 4. Review flow

1. Customer mo don `DELIVERED` va gui rating 1-5 sao.
2. Admin vao Reviews, duyet review.
3. Review xuat hien tren trang chi tiet san pham.

## Bo cuc slide goi y

1. Ten de tai va thong tin sinh vien.
2. Bai toan, muc tieu va doi tuong su dung.
3. Chuc nang customer/admin.
4. Use Case diagram.
5. Kien truc React - Express - Prisma - MySQL.
6. ERD va cac bang quan trong.
7. Order/inventory transaction flow.
8. Hinh anh giao dien va demo truc tiep.
9. Kiem thu, bao mat va ket qua.
10. Han che, huong phat trien va ket luan.

## Diem ky thuat nen nhan manh

- Stock nam tren `ProductVariant`, khong nam tren Product.
- Checkout dung database transaction va atomic update de stock khong am.
- Idempotency key ngan double order/double stock deduction.
- Order state machine ngan nhay sai trang thai.
- Huy don hoan stock va coupon dung mot lan.
- JWT access token ngan han; refresh token HttpOnly co rotation va reuse detection.
- Backend luon kiem tra role; an menu frontend khong duoc xem la bao mat.
- Review chi duoc tao tu order item da `DELIVERED`.

## Cau hoi phan bien va tra loi ngan

**Tai sao stock dat o variant?**  
Vi size/mau co ton kho rieng. Product chi tong hop de hien thi.

**Lam sao tranh hai nguoi mua cung san pham cuoi?**  
Checkout cap nhat stock co dieu kien trong transaction; chi thanh cong khi stock van du.

**Tai sao can idempotency key?**  
Nguoi dung co the bam lai hoac mang retry. Key bao dam mot yeu cau chi tao mot order.

**Frontend an trang admin da du bao mat chua?**  
Chua. Moi API admin deu xac thuc JWT va authorize role o backend.

**Tai sao khong xoa cung product/order?**  
Soft delete bao toan lich su giao dich va du lieu bao cao.

**Doanh thu tinh the nao?**  
Chi cong order `DELIVERED`, loai payment `REFUNDED`, loc theo `deliveredAt`.

**Review co the gia mao khong?**  
API doi chieu user, order item va trang thai `DELIVERED`; moi user/product chi review mot lan.

**Han che hien tai?**  
Demo chi ho tro COD, anh dung URL va wishlist cuc bo. Kien truc da chuan bi de mo rong payment provider, object storage va wishlist server.

## Phuong an khi demo gap loi

- Kiem tra MySQL service dang chay.
- Kiem tra backend `/api/v1/health`.
- Chay backend port 5000, frontend port 3000.
- Khong seed lai ngay truoc hoi dong neu da tao san order demo; seed se reset du lieu.
- Chuan bi san mot order `PENDING` va mot order `DELIVERED` de demo nhanh.
