# Huong dan chay du an F1 Gridwear

## 1. Khoi dong MySQL

1. Nhan `Windows + R`.
2. Nhap `services.msc` va nhan Enter.
3. Tim dich vu `MySQL80`.
4. Neu dich vu chua o trang thai `Running`, nhap chuot phai va chon `Start`.

Du an nay khong dung Apache/PHP, vi vay khong can bat XAMPP.

## 2. Chay backend

Mo cua so PowerShell thu nhat va chay:

```powershell
cd C:\do_an_523100035\backend
npm run dev
```

Cho den khi xuat hien thong bao `server_started` va cong `5000`. Giu nguyen cua so PowerShell nay.

## 3. Chay frontend

Mo cua so PowerShell thu hai va chay:

```powershell
cd C:\do_an_523100035\frontend
npm run dev -- --port 3000
```

Cho den khi xuat hien dia chi `http://localhost:3000/`. Giu nguyen cua so PowerShell nay.

## 4. Mo website

- Trang khach hang: http://localhost:3000
- Trang quan tri: http://localhost:3000/admin

## 5. Dung du an

Nhan `Ctrl+C` trong ca hai cua so PowerShell. Dong cua so Terminal cung se lam website dung hoat dong.

## Xu ly loi thuong gap

- Khong truy cap duoc `localhost:3000`: kiem tra Terminal frontend con dang chay hay khong.
- Website hien nhung khong tai du lieu: kiem tra Terminal backend va dich vu `MySQL80`.
- Bao cong `3000` hoac `5000` dang duoc su dung: mot ban cu cua du an dang chay; dung ban cu bang `Ctrl+C` truoc khi chay lai.
- Sau khi sua frontend, nhan `Ctrl+S`; Vite se tu tai lai trang.
- Sau khi sua backend, nhan `Ctrl+S`; che do `tsx watch` se tu khoi dong lai server.
