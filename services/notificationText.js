const CP1252_EXTRA_BYTES = new Map([
  ["€", 0x80], ["‚", 0x82], ["ƒ", 0x83], ["„", 0x84], ["…", 0x85],
  ["†", 0x86], ["‡", 0x87], ["ˆ", 0x88], ["‰", 0x89], ["Š", 0x8a],
  ["‹", 0x8b], ["Œ", 0x8c], ["Ž", 0x8e], ["‘", 0x91], ["’", 0x92],
  ["“", 0x93], ["”", 0x94], ["•", 0x95], ["–", 0x96], ["—", 0x97],
  ["˜", 0x98], ["™", 0x99], ["š", 0x9a], ["›", 0x9b], ["œ", 0x9c],
  ["ž", 0x9e], ["Ÿ", 0x9f],
]);

const decodeCp1252Run = (value) => {
  if (!/[\u00e0-\u00ff\u00c3\u00c2\u00e2\u00f0]|[\u0080-\u009f]|\u00ef\u00bf\u00bd/.test(value)) return value;
  const bytes = [];
  for (const character of value) {
    const codePoint = character.codePointAt(0);
    if (codePoint <= 0xff) bytes.push(codePoint);
    else if (CP1252_EXTRA_BYTES.has(character)) bytes.push(CP1252_EXTRA_BYTES.get(character));
    else return value;
  }
  const buffer = Buffer.from(bytes);
  const decoded = buffer.toString("utf8");
  return Buffer.from(decoded, "utf8").equals(buffer) ? decoded : value;
};

export const repairLegacyNotificationText = (value) => {
  if (typeof value !== "string") return "";
  let output = "";
  let run = "";
  const flush = () => {
    let decoded = run;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const next = decodeCp1252Run(decoded);
      if (next === decoded) break;
      decoded = next;
    }
    output += decoded;
    run = "";
  };
  for (const character of value) {
    const codePoint = character.codePointAt(0);
    if (codePoint <= 0xff || CP1252_EXTRA_BYTES.has(character)) run += character;
    else {
      flush();
      output += character;
    }
  }
  flush();
  return output;
};
