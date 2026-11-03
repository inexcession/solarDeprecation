// Translation lookup with {placeholder} interpolation, plus number formatting.

export function translator(strings, lang) {
  const dict = strings[lang] ?? strings.en;
  return (key, vars = {}) =>
    (dict[key] ?? strings.en[key] ?? key).replace(/\{(\w+)\}/g, (m, name) => (name in vars ? vars[name] : m));
}

export function applyStaticTranslations(t, lang) {
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll('[data-lang]').forEach((btn) => btn.classList.toggle('active', btn.dataset.lang === lang));
}

export function formatters(currency, lang) {
  const locale = lang === 'ja' ? 'ja-JP' : 'en-US';
  const number = (v, decimals = 0) =>
    Number(v).toLocaleString(locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  return {
    number,
    currency: (v) => `${currency}${number(Math.round(v))}`,
    rate: (v) => `${currency}${number(v, 2)}/kWh`,
    kwh: (v) => `${number(v)} kWh`,
    percent: (v) => `${number(v, 1)}%`,
    month: (ym) => {
      const [y, m] = ym.split('-').map(Number);
      return new Date(y, m - 1).toLocaleDateString(locale, { year: 'numeric', month: 'short' });
    },
  };
}
