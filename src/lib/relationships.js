export function mapRelationshipStatus(rel, currentUserId) {
  if (!rel) return 'not_friends';
  if (rel.status === 'accepted') return 'friends';
  if (rel.status === 'pending') {
    return rel.requester_id === currentUserId ? 'pending_them' : 'pending_me';
  }
  return 'not_friends';
}

export function allowedVisibilities(currentUserId, profileUserId, status) {
  if (currentUserId === profileUserId) {
    return ['public', 'private', 'friends_only'];
  }
  if (status === 'friends') {
    return ['public', 'friends_only'];
  }
  return ['public'];
}
