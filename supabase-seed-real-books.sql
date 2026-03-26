do $$
begin
  if not exists (
    select 1
    from public.profiles
  ) then
    raise exception 'ჯერ შექმენი მინიმუმ 1 ავტორის ან გამომცემლის ანგარიში, მერე გაუშვი ეს seed SQL';
  end if;
end $$;

delete from public.books
where title in (
  'BOG სატესტო წიგნი',
  'ღრმა ფოკუსი',
  'ფინანსური სიმშვიდე',
  'მშვიდი გონების პრაქტიკა',
  'საკუთარი ტემპის პოვნა',
  'ქალაქი, წვიმა და ჩვენ',
  'შუაღამის წერილები',
  'გზაში მოსასმენი მოტივაცია',
  'დილის აუდიო რუტინა',
  'ფსიქოლოგია ხმაში',
  'ბიზნეს იდეები გზაში',
  'ზღვისპირა ამბავი',
  'კონფიდენციალური რომანი 18+'
);

with author_pool as (
  select
    id,
    row_number() over (order by created_at, id) as rn
  from public.profiles
),
fallback_author as (
  select id
  from author_pool
  order by rn
  limit 1
),
seed_books (
  title,
  author,
  genre,
  type,
  details,
  price,
  description,
  top_pick,
  age_restricted,
  uploader_slot,
  created_at
) as (
  values
    ('BOG სატესტო წიგნი', 'ტესტ ავტორი', 'ბიზნესი', 'ebook', 'PDF', 1.00, 'სპეციალურად BOG გადახდის სატესტოდ დამატებული პროდუქტი.', true, false, 1, now() - interval '1 hour'),
    ('ღრმა ფოკუსი', 'ნინო კობახიძე', 'ბიზნესი', 'ebook', 'PDF / EPUB', 18.90, 'პრაქტიკული წიგნი კონცენტრაციის, დროის მართვის და ღრმა მუშაობის ჩვევებზე.', true, false, 1, now() - interval '15 days'),
    ('ფინანსური სიმშვიდე', 'თამარ ბურდული', 'ბიზნესი', 'ebook', 'PDF / EPUB', 22.00, 'მარტივად ახსნილი პირადი ფინანსები, დაგეგმვა და ფულის მართვის ყოველდღიური წესები.', false, false, 2, now() - interval '12 days'),
    ('მშვიდი გონების პრაქტიკა', 'მარიამ ჯაფარიძე', 'ფსიქოლოგია', 'ebook', 'PDF / EPUB / MOBI', 21.50, 'სტრესის შემცირების, ემოციური ბალანსის და შინაგანი სიმშვიდის პრაქტიკული სახელმძღვანელო.', true, false, 3, now() - interval '10 days'),
    ('საკუთარი ტემპის პოვნა', 'ნინო კობახიძე', 'თვითგანვითარება', 'ebook', 'PDF / EPUB', 19.00, 'რბილი და მოტივაციური ტექსტი მათთვის, ვისაც სურს საკუთარი რიტმით წინსვლა.', false, false, 1, now() - interval '8 days'),
    ('ქალაქი, წვიმა და ჩვენ', 'ლიკა ბერიძე', 'რომანი', 'ebook', 'PDF / EPUB', 16.40, 'თანამედროვე ქართული რომანი სიყვარულზე, მონატრებაზე და პატარა ქალაქის დიდ სიჩუმეზე.', false, false, 2, now() - interval '6 days'),
    ('შუაღამის წერილები', 'ანა დვალიშვილი', 'რომანი', 'ebook', 'PDF / EPUB', 17.80, 'ემოციური ისტორია დაკარგულ ურთიერთობებზე და ახალ დასაწყისებზე.', true, false, 3, now() - interval '3 days'),
    ('გზაში მოსასმენი მოტივაცია', 'პოდკასტ სტუდიო', 'მოტივაცია', 'audio', '4სთ 20წთ', 17.00, 'მოკლე აუდიო თავები ყოველდღიური ენერგიის, მოტივაციის და პროდუქტიულობისთვის.', true, false, 1, now() - interval '11 days'),
    ('დილის აუდიო რუტინა', 'გიორგი თაბაგარი', 'მოტივაცია', 'audio', '2სთ 45წთ', 13.90, 'მოსასმენი აუდიო პროგრამა დილის ჩვევების, ფოკუსის და სიმშვიდისთვის.', false, false, 2, now() - interval '9 days'),
    ('ფსიქოლოგია ხმაში', 'მარიამ ჯაფარიძე', 'ფსიქოლოგია', 'audio', '3სთ 30წთ', 18.50, 'ფსიქოლოგიური აუდიოწიგნი თვითშეფასებაზე, საზღვრებზე და ემოციურ გამძლეობაზე.', false, false, 3, now() - interval '7 days'),
    ('ბიზნეს იდეები გზაში', 'ლევან მახარაშვილი', 'ბიზნესი', 'audio', '3სთ 55წთ', 20.00, 'სწრაფი მოსასმენი აუდიო სერია მცირე ბიზნესის იდეებზე და შესრულების ტაქტიკაზე.', false, false, 1, now() - interval '5 days'),
    ('ზღვისპირა ამბავი', 'ლიკა ბერიძე', 'რომანი', 'audio', '5სთ 10წთ', 24.00, 'სასიყვარულო აუდიორომანი დასვენებისთვის, მოგზაურობისთვის და მშვიდი საღამოებისთვის.', true, false, 2, now() - interval '2 days'),
    ('კონფიდენციალური რომანი 18+', 'დ. ქავთარაძე', 'რომანი', 'ebook', 'PDF / EPUB', 23.90, 'ზრდასრულ აუდიტორიაზე გათვლილი მხატვრული ტექსტი ურთიერთობების, დაძაბულობის და ინტიმური თემებით.', false, true, 3, now() - interval '1 day')
),
resolved_books as (
  select
    coalesce(slot_author.id, fallback_author.id) as uploader_id,
    seed_books.title,
    seed_books.author,
    seed_books.genre,
    seed_books.type,
    seed_books.details,
    seed_books.price,
    seed_books.description,
    seed_books.top_pick,
    seed_books.age_restricted,
    seed_books.created_at
  from seed_books
  left join author_pool slot_author
    on slot_author.rn = seed_books.uploader_slot
  cross join fallback_author
)
insert into public.books (
  uploader_id,
  title,
  author,
  genre,
  type,
  details,
  price,
  description,
  top_pick,
  age_restricted,
  file_path,
  cover_path,
  created_at,
  updated_at
)
select
  uploader_id,
  title,
  author,
  genre,
  type,
  details,
  price,
  description,
  top_pick,
  age_restricted,
  '',
  '',
  created_at,
  now()
from resolved_books;

select
  id,
  title,
  type,
  genre,
  price,
  created_at
from public.books
order by created_at desc;
