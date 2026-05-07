create table if not exists public.portal_message_templates (
  key text primary key,
  value text not null,
  description text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create or replace function public.set_portal_message_templates_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists portal_message_templates_set_updated_at on public.portal_message_templates;

create trigger portal_message_templates_set_updated_at
before update on public.portal_message_templates
for each row
execute function public.set_portal_message_templates_updated_at();

insert into public.portal_message_templates (key, value, description)
values
  (
    'website_chat_greeting_template',
    'Hi {{firstName}}, I can quickly walk you through Rupeezy''s partner program and see if it fits you. Can you tell me a bit about your current setup?',
    'Initial greeting shown in client website chat threads.'
  ),
  (
    'website_chat_greeting_template_hi',
    'Hi {{firstName}}, main Rupeezy ke partner program ke baare mein aapko short mein guide kar sakta hoon. Kya aap apne current partner setup ke baare mein batana chahenge?',
    'Initial greeting shown in Hindi/Hinglish client website chat threads.'
  ),
  (
    'whatsapp_follow_up_template',
    'Hi {{firstName}}, thanks for speaking with Rupeezy about the AP partner program. {{recommendedNextAction}}',
    'WhatsApp follow-up opener for hot and warm leads.'
  )
on conflict (key) do nothing;
