// Convertit une chaîne CSS en objet de style React.
export function S(css) {
  const out = {};
  css.split(";").forEach((rule) => {
    const i = rule.indexOf(":");
    if (i < 0) return;
    const key = rule.slice(0, i).trim();
    const value = rule.slice(i + 1).trim();
    if (!key || !value) return;
    out[key.replace(/-([a-z])/g, (m, c) => c.toUpperCase())] = value;
  });
  return out;
}
