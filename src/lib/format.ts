const dateFormat = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const timeFormat = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
});

export const formatDate = (date: Date | string) =>
  dateFormat.format(new Date(date));

export const formatTime = (date: Date | string) =>
  timeFormat.format(new Date(date));

export const formatNumber = (n: number) => n.toLocaleString("en-US");
