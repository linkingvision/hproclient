export const formatISOToSlash = (dateStr: string): string => {
  const date = new Date(dateStr);

  const pad = (n: number): string => String(n).padStart(2, '0');

  return `${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(date.getDate())} ` +
         `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export const formatISOWithOffset = (date = new Date()): string => {
  const pad = (n: number): string => String(n).padStart(2, '0');

  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hour = pad(date.getHours());
  const minute = pad(date.getMinutes());
  const second = pad(date.getSeconds());

  // 当前时区偏移（分钟 → 小时）
  const offset = -date.getTimezoneOffset();
  const sign = offset >= 0 ? '+' : '-';
  const offsetHour = pad(Math.floor(Math.abs(offset) / 60));
  const offsetMinute = pad(Math.abs(offset) % 60);

  return `${year}-${month}-${day}T${hour}:${minute}:${second}${sign}${offsetHour}:${offsetMinute}`;
}