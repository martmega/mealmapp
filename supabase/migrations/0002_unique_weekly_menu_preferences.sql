ALTER TABLE weekly_menu_preferences
  ADD CONSTRAINT weekly_menu_preferences_menu_id_key UNIQUE (menu_id);
