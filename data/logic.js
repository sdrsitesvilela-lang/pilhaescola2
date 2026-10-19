(function (root) {
  'use strict';
  function parseVoltage(value) {
    if (typeof value === 'number') return Number.isFinite(value) && value >= 0 && value <= 10 ? value : null;
    const raw = String(value == null ? '' : value).trim().replace(',', '.');
    if (!/^\d+(?:\.\d+)?$/.test(raw)) return null;
    const number = Number(raw);
    return Number.isFinite(number) && number >= 0 && number <= 10 ? number : null;
  }
  function parseQuantity(value) {
    const raw = String(value == null ? '' : value).trim();
    if (!/^\d+$/.test(raw)) return null;
    const n = Number(raw);
    return Number.isSafeInteger(n) && n >= 1 && n <= 100 ? n : null;
  }
  function calculate(entries) {
    if (!Array.isArray(entries)) throw new TypeError('Itens inválidos');
    let total = 0;
    let cells = 0;
    entries.forEach(({voltage, quantity}) => {
      const v = parseVoltage(voltage);
      const q = parseQuantity(quantity);
      if (v === null || q === null) throw new RangeError('Tensão ou quantidade inválida');
      total += v * q;
      cells += q;
    });
    return { total: Math.round(total * 10000) / 10000, cells };
  }
  const api = {parseVoltage, parseQuantity, calculate};
  root.PilhaMath = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
