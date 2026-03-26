# BOG Payment Setup

ეს პროექტი ახლა იყენებს `api/book-order.js`, `api/book-callback.js` და `api/book-order-status.js` serverless endpoint-ებს.

მნიშვნელოვანი:

- მხოლოდ GitHub Pages საკმარისი არ არის, რადგან `api/` ფოლდერი სერვერზე უნდა გაეშვას.
- ყველაზე მარტივი გზაა ამ repo-ს Vercel-ზე მიბმა.
- frontend კვლავ იგივე HTML/CSS/JS-ია, მაგრამ checkout ახლა backend-ზე გადის.

## 1. Deploy

დაამატე repo Vercel-ში ან სხვა Node/serverless პლატფორმაზე.

## 2. Environment Variables

აუცილებელი env-ები:

- `SITE_URL`
- `SUPABASE_URL`
- `SUPABASE_SECRET_KEY`
- `BOG_CLIENT_ID`
- `BOG_CLIENT_SECRET`

რეკომენდებული:

- `BOG_CALLBACK_TOKEN`
- `ADMIN_NOTIFICATION_EMAIL`
- `SUPABASE_BOOKS_BUCKET=books`
- `BOOK_DOWNLOAD_EXPIRES_SECONDS=172800`

ელფოსტისთვის ერთ-ერთი ვარიანტი:

### Gmail

- `GMAIL_USER`
- `GMAIL_PASS`

### SMTP

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM_EMAIL`
- `SMTP_SECURE=true|false`

## 3. Supabase SQL

ყველაზე მარტივად გაუშვი ერთი ფაილი:

- `supabase-complete-setup.sql`

თუ გინდა ეტაპებად, მაშინ:

1. `supabase-setup.sql`
2. `supabase-bog-setup.sql`

## 4. BOG Callback / Redirect

`SITE_URL` უნდა იყოს production დომენი, მაგალითად:

`https://your-domain.com`

სისტემა თვითონ ააწყობს:

- `${SITE_URL}/api/book-callback`
- `${SITE_URL}/success.html?order_id=...`
- `${SITE_URL}/payment-fail.html?order_id=...`

## 5. როგორ მუშაობს flow

1. მომხმარებელი checkout ფორმას ავსებს.
2. `api/book-order.js` ქმნის `pending` გაყიდვას `sales` ცხრილში.
3. იგივე endpoint იღებს BOG access token-ს და ქმნის order-ს.
4. მომხმარებელი გადადის BOG checkout-ზე.
5. BOG წარმატებისას ურტყამს `api/book-callback.js`-ს.
6. callback ცვლის შეკვეთას `paid` ან `delivered` სტატუსზე.
7. თუ წიგნის ფაილი არსებობს, buyer-ს ეგზავნება signed download link ელფოსტაზე.
8. success გვერდი `api/book-order-status.js`-ით ამოწმებს მიმდინარე სტატუსს.
