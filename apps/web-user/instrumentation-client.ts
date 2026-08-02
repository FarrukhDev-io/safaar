declare global {
  interface Performance {
    __safaarMeasureGuard?: boolean;
  }
}

const isNegativeTimeStampError = (error: unknown) =>
  error instanceof TypeError && error.message.includes('negative time stamp');

const clampHighResTime = (value: string | DOMHighResTimeStamp | undefined) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return value;
  return Math.max(0, value);
};

const normalizeMeasureOptions = (
  options: PerformanceMeasureOptions,
): PerformanceMeasureOptions => {
  const normalized: PerformanceMeasureOptions = {
    ...options,
    duration:
      typeof options.duration === 'number' && Number.isFinite(options.duration)
        ? Math.max(0, options.duration)
        : options.duration,
    end: clampHighResTime(options.end),
    start: clampHighResTime(options.start),
  };

  if (
    typeof normalized.start === 'number' &&
    typeof normalized.end === 'number' &&
    normalized.end < normalized.start
  ) {
    normalized.end = normalized.start;
  }

  return normalized;
};

(() => {
  if (
    typeof window === 'undefined' ||
    typeof window.performance?.measure !== 'function' ||
    window.performance.__safaarMeasureGuard
  ) {
    return;
  }

  const perf = window.performance;
  const measure = perf.measure.bind(perf);

  const guardedMeasure: Performance['measure'] = (
    measureName,
    startOrMeasureOptions,
    endMark,
  ) => {
    try {
      return measure(measureName, startOrMeasureOptions, endMark);
    } catch (error) {
      if (!isNegativeTimeStampError(error)) {
        throw error;
      }

      if (!startOrMeasureOptions || typeof startOrMeasureOptions !== 'object') {
        throw error;
      }

      const normalized = normalizeMeasureOptions(startOrMeasureOptions);

      try {
        return measure(measureName, normalized);
      } catch (retryError) {
        if (!isNegativeTimeStampError(retryError)) {
          throw retryError;
        }

        return measure(measureName, {
          detail: normalized.detail,
          end: 0,
          start: 0,
        });
      }
    }
  };

  perf.measure = guardedMeasure;
  Object.defineProperty(perf, '__safaarMeasureGuard', {
    configurable: true,
    value: true,
  });
})();

export {};
