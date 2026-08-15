(function exposeEarnDailyCounter(global) {
    const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

    // Earn came into existence on 11 May 2025. From that day onward,
    // Earn generates one additional prosperity value for every calendar day.
    const EARN_FOUNDING_DATE = Object.freeze({year: 2025, month: 4, day: 11});

    const toDayNumber = (date) => Date.UTC(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
    ) / MILLISECONDS_PER_DAY;

    const foundingDayNumber = Date.UTC(
        EARN_FOUNDING_DATE.year,
        EARN_FOUNDING_DATE.month,
        EARN_FOUNDING_DATE.day,
    ) / MILLISECONDS_PER_DAY;

    const getValue = (date = new Date()) => Math.max(
        0,
        Math.floor(toDayNumber(date) - foundingDayNumber),
    );

    global.EarnDailyCounter = Object.freeze({
        EARN_FOUNDING_DATE,
        getValue,
    });
})(typeof window === 'undefined' ? globalThis : window);
