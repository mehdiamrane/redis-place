export const formatUserId = (userId: string) => {
  const parts = userId.split("_");
  return parts.length > 2 ? `${parts[2].substring(0, 6)}...` : userId;
};

export const formatTimestamp = (timestamp: number) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString();
};

export const formatDate = (timestamp: number | null) => {
  if (!timestamp) return "Never";
  return new Date(timestamp).toLocaleString();
};

export const getTimeSince = (timestamp: number | null) => {
  if (!timestamp) return "Never";
  const now = Date.now();
  const diffMs = now - timestamp;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  return "Recently";
};
