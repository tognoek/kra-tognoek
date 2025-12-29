const sensitiveWords = [
  "đm", "dm", "đmm", "dmm", "đcm", "dcm", "vcl", "vkl", "vl", "vcc", "vclm", 
  "đéo", "deo", "đé0", "cl", "ccl", "cđm", "cdm", "đỉ", "di", "con đỉ", "đĩ", 
  "vãi", "vcl", "đù", "dou", "mẹ mày", "me may", "cha mày", "cha may", "tổ sư",

  "admin ngu", "admin oc cho", "admin như l", "óc chó", "oc cho", "ngu l", 
  "ngu vcl", "thằng chó", "thang cho", "con lợn", "đồ hâm", "thằng khùng",

  "phản động", "phan dong", "biểu tình", "bieu tinh", "chính trị", "chính quyền", 
  "tuyên truyền", "đảng", "nhà nước", "cộng sản", "ba que", "khát nước",

  "hack", "hacked", "hacker", "ddos", "leak", "leak code", "cheating", 
  "buff điểm", "buff diem", "tool auto", "inject", "sql injection", "exploits",

  "mua bán", "casino", "cờ bạc", "co bac", "đánh bài", "danh bai", "số đề", 
  "so de", "lô đề", "lo de", "nhà cái", "nha cai", "tặng code", "nhận quà miễn phí",

  "đ.m", "đ_m", "d.m", "v.c.l", "v_c_l", "d_m_m", "v-l", "v|l"
];

export const containsSensitiveWords = (text: string): boolean => {
  if (!text) return false;

  const lowercaseText = text.toLowerCase();

  const isDirectMatch = sensitiveWords.some(word => 
    lowercaseText.includes(word.toLowerCase())
  );
  if (isDirectMatch) return true;

  const normalizedText = lowercaseText
    .replace(/[^a-z0-9àáạảãâầấnậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/g, "");

  return sensitiveWords.some(word => {
    const cleanWord = word.toLowerCase().replace(/\s+/g, "");
    return normalizedText.includes(cleanWord);
  });
};