export function queueRecord(data, record) {
  if (record.published) return "published";
  if (data.pending.some((r) => r.id === record.id)) return "pending";
  data.pending.push({ ...record });
  return "queued";
}
