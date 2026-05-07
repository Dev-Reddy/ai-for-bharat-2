alter table public.leads
  add column if not exists country_iso text,
  add column if not exists country_code text,
  add column if not exists mobile_number_raw text,
  add column if not exists phone_e164 text;

update public.leads
set
  country_iso = coalesce(country_iso, 'IN'),
  country_code = coalesce(country_code, '+91'),
  mobile_number_raw = coalesce(
    mobile_number_raw,
    right(regexp_replace(phone, '\D', '', 'g'), 10)
  ),
  phone_e164 = coalesce(
    phone_e164,
    case
      when phone like '+%' then phone
      else '+91' || right(regexp_replace(phone, '\D', '', 'g'), 10)
    end
  );

update public.leads
set phone = phone_e164
where phone_e164 is not null;

alter table public.leads
  alter column country_iso set not null,
  alter column country_code set not null,
  alter column mobile_number_raw set not null,
  alter column phone_e164 set not null;
