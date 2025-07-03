export async function createSharedMenu({ user_id, name, menu_data, participant_ids, is_shared }) {
  try {
    const res = await fetch('/api/create-shared-menu', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id, name, menu_data, participant_ids, is_shared }),
    });
    const result = await res.json();
    if (!res.ok) {
      console.error('Erreur création menu partagé:', result?.error);
      return null;
    }
    return result;
  } catch (err) {
    console.error('Erreur création menu partagé:', err);
    return null;
  }
}
