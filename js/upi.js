(function(global) {
    const MAX_UPI_URI_LENGTH = 2048;
    const MAX_TRANSACTION_NOTE_LENGTH = 80;

    const normalizeAmount = (value) => {
        const amountText = String(value).trim();
        if (!/^\d+(\.\d{1,2})?$/.test(amountText)) {
            throw new Error('The UPI amount must have at most two decimal places.');
        }

        const amount = Number.parseFloat(amountText);
        if (!Number.isFinite(amount) || amount <= 0) {
            throw new Error('The UPI amount must be greater than zero.');
        }
        return amount.toFixed(2);
    };

    const parseUpiPaymentUri = (rawUri) => {
        if (typeof rawUri !== 'string' || rawUri.length > MAX_UPI_URI_LENGTH) {
            throw new Error('The scanned UPI QR code is invalid or too large.');
        }

        let url;
        try {
            url = new URL(rawUri);
        } catch (error) {
            throw new Error('The scanned QR code is not a valid UPI payment link.');
        }

        if (url.protocol.toLowerCase() !== 'upi:' ||
            url.hostname.toLowerCase() !== 'pay') {
            throw new Error('The scanned QR code is not a UPI payment request.');
        }

        const payeeVpa = (url.searchParams.get('pa') || '').trim();
        const payeeName = (url.searchParams.get('pn') || '').trim();
        if (!payeeVpa || !payeeVpa.includes('@')) {
            throw new Error('The UPI QR code does not contain a valid payee VPA.');
        }
        if (!payeeName) {
            throw new Error('The UPI QR code does not contain a payee name.');
        }

        return {
            rawUri,
            url,
            payeeVpa,
            payeeName,
            signed: url.searchParams.has('sign'),
        };
    };

    const buildUpiPaymentUri = (rawUri, options) => {
        const parsed = parseUpiPaymentUri(rawUri);
        const requestedAmount = normalizeAmount(options.amount);
        const parameters = parsed.url.searchParams;
        const qrAmountValue = parameters.get('am');
        const qrAmount = qrAmountValue ? normalizeAmount(qrAmountValue) : null;

        if (qrAmount && qrAmount !== requestedAmount) {
            throw new Error(
                `This QR requests ₹${qrAmount}, but you entered ` +
                `₹${requestedAmount}. Use the QR amount and scan again.`,
            );
        }

        const currency = (parameters.get('cu') || 'INR').toUpperCase();
        if (currency !== 'INR') {
            throw new Error('Earn currently supports only INR UPI payments.');
        }

        if (parsed.signed) {
            if (!qrAmount) {
                throw new Error(
                    'This signed QR does not include an amount and cannot be ' +
                    'safely modified by Earn.',
                );
            }
            return {
                uri: parsed.rawUri,
                amount: qrAmount || requestedAmount,
                payeeVpa: parsed.payeeVpa,
                payeeName: parsed.payeeName,
                merchantCategoryCode: parameters.get('mc') || '',
                transactionReference: parameters.get('tr') || '',
                signed: true,
            };
        }

        parameters.set('am', qrAmount || requestedAmount);
        parameters.set('cu', currency);

        const existingNote = parameters.get('tn');
        const note = existingNote || String(options.description || '').trim();
        if (note) {
            parameters.set('tn', note.slice(0, MAX_TRANSACTION_NOTE_LENGTH));
        }

        return {
            uri: parsed.url.toString(),
            amount: qrAmount || requestedAmount,
            payeeVpa: parsed.payeeVpa,
            payeeName: parsed.payeeName,
            merchantCategoryCode: parameters.get('mc'),
            transactionReference: parameters.get('tr'),
            signed: false,
        };
    };

    global.EarnUpi = {
        buildUpiPaymentUri,
        parseUpiPaymentUri,
    };
})(typeof window === 'undefined' ? globalThis : window);
