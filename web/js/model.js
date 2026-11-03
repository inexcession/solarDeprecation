// Pure domain logic: CSV → ledger → summary. No DOM, no i18n.

export const COLUMNS = [
  'month', 'grid_imported_kwh', 'bill_jpy', 'solar_generated_kwh',
  'solar_exported_kwh', 'export_deposit_jpy', 'assumed_day_rate_jpy',
];

/** Parse history.csv strictly. Malformed data throws instead of silently becoming 0. */
export function parseHistory(text) {
  const [header, ...lines] = text.trim().split(/\r?\n/);
  if (header.trim() !== COLUMNS.join(',')) {
    throw new Error(`history.csv: expected header "${COLUMNS.join(',')}"`);
  }
  return lines
    .map((line, i) => [line.trim(), i + 2])
    .filter(([line]) => line)
    .map(([line, lineNo]) => {
      const [month, ...cells] = line.split(',').map((c) => c.trim());
      const nums = cells.map(Number);
      if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) throw new Error(`history.csv:${lineNo}: bad month "${month}"`);
      if (nums.length !== COLUMNS.length - 1 || nums.some((n) => !Number.isFinite(n) || n < 0)) {
        throw new Error(`history.csv:${lineNo}: expected ${COLUMNS.length - 1} non-negative numbers`);
      }
      const [gridImportedKwh, billJpy, solarGeneratedKwh, solarExportedKwh, exportDepositJpy, dayRateJpy] = nums;
      return { month, gridImportedKwh, billJpy, solarGeneratedKwh, solarExportedKwh, exportDepositJpy, dayRateJpy };
    })
    .sort((a, b) => a.month.localeCompare(b.month));
}

/** Plausibility checks. Returns [{ key, vars }]; the view translates them. */
export function rowWarnings(row, config) {
  const c = config.sanityChecks;
  const warnings = [];
  const maxGen = config.solarCapacityKw * c.maxMonthlyKwhPerKw;
  if (config.solarCapacityKw > 0 && row.solarGeneratedKwh > maxGen) {
    warnings.push({ key: 'warnGenCapacity', vars: { val: row.solarGeneratedKwh, max: maxGen, cap: config.solarCapacityKw } });
  }
  if (row.gridImportedKwh >= 50 && row.billJpy > 0) {
    const rate = row.billJpy / row.gridImportedKwh;
    if (rate > c.maxImpliedRate) warnings.push({ key: 'warnHighRate', vars: { rate } });
    if (rate < c.minImpliedRate) warnings.push({ key: 'warnLowRate', vars: { rate } });
  }
  if (row.solarGeneratedKwh > 0 && row.solarExportedKwh > row.solarGeneratedKwh) {
    warnings.push({ key: 'warnExportExceedsGen', vars: { exp: row.solarExportedKwh, gen: row.solarGeneratedKwh } });
  }
  if (row.dayRateJpy < c.minDayRate || row.dayRateJpy > c.maxDayRate) {
    warnings.push({ key: 'warnDayRateRange', vars: { rate: row.dayRateJpy } });
  }
  return warnings;
}

/** Derive per-month value and the running total. */
export function computeLedger(rows, config) {
  let cumulativeValue = 0;
  return rows.map((row) => {
    const selfConsumedKwh = Math.max(0, row.solarGeneratedKwh - row.solarExportedKwh);
    const savingsJpy = selfConsumedKwh * row.dayRateJpy;
    const totalValueJpy = savingsJpy + row.exportDepositJpy;
    cumulativeValue += totalValueJpy;
    return { ...row, selfConsumedKwh, savingsJpy, totalValueJpy, cumulativeValue, warnings: rowWarnings(row, config) };
  });
}

/** 'YYYY-MM' + n months → 'YYYY-MM'. */
export function addMonths(month, n) {
  const [y, m] = month.split('-').map(Number);
  const idx = y * 12 + (m - 1) + n;
  return `${Math.floor(idx / 12)}-${String((idx % 12) + 1).padStart(2, '0')}`;
}

/** Headline metrics. Run-rate and self-consumption use the trailing 12 months. */
export function summarize(ledger, config) {
  const netInvestment = config.systemCost - config.subsidyReceived;
  const last = ledger.at(-1);
  const cumulative = last ? last.cumulativeValue : 0;
  const remaining = Math.max(0, netInvestment - cumulative);
  const netProfit = Math.max(0, cumulative - netInvestment);
  const ttm = ledger.slice(-12);
  const sum = (key) => ttm.reduce((acc, r) => acc + r[key], 0);

  const avgMonthlyValue = ttm.length ? sum('totalValueJpy') / ttm.length : 0;
  const monthsRemaining = remaining > 0 && avgMonthlyValue > 0 ? Math.ceil(remaining / avgMonthlyValue) : 0;
  const generated = sum('solarGeneratedKwh');
  const selfConsumedKwh = sum('selfConsumedKwh');
  const selfConsumptionRate = generated > 0 ? (selfConsumedKwh / generated) * 100 : 0;

  return {
    hasData: ledger.length > 0,
    netInvestment,
    cumulative,
    remaining,
    paybackPercent: netInvestment > 0 ? Math.min(100, (cumulative / netInvestment) * 100) : 100,
    netProfit,
    roiPercent: netInvestment > 0 ? (netProfit / netInvestment) * 100 : 0,
    avgMonthlyValue,
    monthsRemaining,
    breakEvenMonth: last && monthsRemaining ? addMonths(last.month, monthsRemaining) : null,
    selfConsumedKwh,
    selfConsumptionRate,
    subsidyTargetMet: selfConsumptionRate >= config.selfConsumptionTargetPercent,
  };
}

/** The "Export Calculated CSV" payload. */
export function ledgerToCsv(ledger) {
  const header = 'month,grid_bill_jpy,grid_import_kwh,assumed_day_rate_jpy,solar_generated_kwh,self_consumed_kwh,'
    + 'self_consumption_savings_jpy,export_revenue_jpy,total_monthly_value_jpy,cumulative_value_jpy';
  const lines = ledger.map((r) => [
    r.month, r.billJpy, r.gridImportedKwh, r.dayRateJpy.toFixed(2), r.solarGeneratedKwh, r.selfConsumedKwh.toFixed(1),
    Math.round(r.savingsJpy), r.exportDepositJpy, Math.round(r.totalValueJpy), Math.round(r.cumulativeValue),
  ].join(','));
  return [header, ...lines].join('\n') + '\n';
}
