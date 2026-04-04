
alter table public.conversations
  add column scope_document_id uuid references public.documents(id) on delete set null,
  add column scope_topic_id    uuid references public.tags(id)      on delete set null;

comment on column public.conversations.scope_document_id is 'When set, the conversation is scoped to a single document.';
comment on column public.conversations.scope_topic_id    is 'When set, the conversation is scoped to a topic tag.';
