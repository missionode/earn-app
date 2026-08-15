(function exposeEarnUpiId(global) {
    const UPI_ID_PATTERN =
        /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,255}@[a-zA-Z0-9][a-zA-Z0-9.-]{1,63}$/;

    // Google Pay currently issues UPIs through these four PSP handles.
    const GOOGLE_PAY_HANDLES = Object.freeze([
        'okaxis',
        'okhdfcbank',
        'okicici',
        'oksbi',
    ]);

    function normalize(value) {
        const trimmedValue = String(value || '').trim();
        const separatorIndex = trimmedValue.lastIndexOf('@');
        if (separatorIndex < 0) return trimmedValue;

        return trimmedValue.slice(0, separatorIndex) + '@' +
            trimmedValue.slice(separatorIndex + 1).toLowerCase();
    }

    function validate(value) {
        return UPI_ID_PATTERN.test(normalize(value)) ? '' :
            'Invalid UPI ID format.';
    }

    global.EarnUpiId = Object.freeze({
        GOOGLE_PAY_HANDLES,
        normalize,
        validate,
    });
})(typeof window === 'undefined' ? globalThis : window);
