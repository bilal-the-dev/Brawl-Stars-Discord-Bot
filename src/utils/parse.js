exports.flagEmojiToCountryCode = (flag) => {
  return [...flag]
    .map((c) => String.fromCharCode(c.codePointAt(0) - 127397))
    .join("");
};
