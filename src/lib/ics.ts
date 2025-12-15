// Generate ICS calendar file content
export const generateICSContent = ({
  title,
  description,
  location,
  startDate,
  endDate,
}: {
  title: string;
  description: string;
  location: string;
  startDate: Date;
  endDate: Date;
}): string => {
  const formatDate = (date: Date): string => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const escapeText = (text: string): string => {
    return text.replace(/[,;\\]/g, '\\$&').replace(/\n/g, '\\n');
  };

  const uid = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}@agenticsva.org`;

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Agentics VA//Events//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${formatDate(new Date())}`,
    `DTSTART:${formatDate(startDate)}`,
    `DTEND:${formatDate(endDate)}`,
    `SUMMARY:${escapeText(title)}`,
    `DESCRIPTION:${escapeText(description)}`,
    `LOCATION:${escapeText(location)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
};

export const downloadICS = ({
  title,
  description,
  location,
  startDate,
  endDate,
}: {
  title: string;
  description: string;
  location: string;
  startDate: Date;
  endDate: Date;
}): void => {
  const content = generateICSContent({ title, description, location, startDate, endDate });
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `${title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
