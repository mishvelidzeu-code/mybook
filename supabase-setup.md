# Supabase Setup

1. შექმენი ახალი პროექტი Supabase-ში.
2. გახსენი `Project Settings -> API`.
3. დააკოპირე `Project URL` და `anon public key`.
4. ჩასვი მნიშვნელობები [assets/js/config.js](C:\Users\ASUS\Desktop\საიტი ქართული ელექტრონული წიგნების\assets\js\config.js)-ში:

```js
SUPABASE_URL: "https://your-project.supabase.co",
SUPABASE_ANON_KEY: "your-anon-key"
```

5. Supabase SQL Editor-ში გაუშვი [supabase-setup.sql](C:\Users\ASUS\Desktop\საიტი ქართული ელექტრონული წიგნების\supabase-setup.sql).
6. `Authentication -> Providers -> Email`-ში ჩართე Email auth.
7. თუ გინდა რეგისტრაციაზე ელფოსტის დადასტურება, დატოვე `Confirm email` ჩართული.
8. თუ გინდა რეგისტრაციისთანავე ავტორი შევიდეს სისტემაში, გამორთე `Confirm email`.

## რა ჩაირთვება ამის შემდეგ

- ავტორის რეგისტრაცია და login Supabase Auth-ით
- `profiles`, `books`, `sales` ცხრილები
- `books` და `covers` storage bucket-ები
- წიგნების ატვირთვა პირდაპირ Supabase Storage-ში
- ყდის რეალური სურათის გამოჩენა storefront-ში
- `ჩემი წიგნები` და წიგნის სრული რედაქტირება panel-იდან
- buyer checkout ჩანაწერის შენახვა `sales` ცხრილში

## მნიშვნელოვანი შენიშვნა

თუ `SUPABASE_URL` და `SUPABASE_ANON_KEY` შევსებულია, საიტი ავტომატურად გადავა Supabase რეჟიმზე.
თუ ცარიელია, დარჩება არსებულ demo რეჟიმში.
