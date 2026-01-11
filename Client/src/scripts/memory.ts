export const formatMemory = (memory: number) => {
  if (memory === null || memory === undefined) {
    return "0 KB";
  }
  if (memory < 1024) {
    return memory + " KB";
  }
  const mbValue = memory / 1024;
  const formattedMB = Math.floor(mbValue * 10) / 10;

  if (formattedMB > 99) {
    return Math.floor(formattedMB) + " MB";
  }

  return formattedMB + " MB";
};