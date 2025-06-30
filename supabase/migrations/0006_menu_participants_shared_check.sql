create function ensure_menu_shared()
returns trigger
language plpgsql
as $$
begin
  if not exists (
    select 1 from weekly_menus wm where wm.id = new.menu_id and wm.is_shared
  ) then
    raise exception 'menu % is not shared', new.menu_id;
  end if;
  return new;
end;
$$;

create trigger check_menu_is_shared
before insert on menu_participants
for each row execute function ensure_menu_shared();
