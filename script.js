
let currentViewMode = 'year'; // 'year' or 'month'
let lastResults = null; // Store results for toggling

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('emi-form');
    const welcomeState = document.getElementById('welcome-state');
    const resultSection = document.getElementById('result-section');

    // Toggle Logic
    const toggleBtns = document.querySelectorAll('.toggle-btn');
    toggleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update UI
            toggleBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Update State
            currentViewMode = btn.dataset.mode;

            // Re-render labels if we have results
            if (lastResults) {
                updateTimelineLabels(lastResults.withPart, lastResults.withoutPart);
                updateSummaryTime(lastResults.withPart, lastResults.withoutPart);
            }
        });
    });

    form.addEventListener('submit', (e) => {
        // ... (lines 28-39 unchanged) ...
        e.preventDefault();
        if (welcomeState) welcomeState.style.display = 'none';
        resultSection.classList.remove('hidden');
        calculateFreedom();
        resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    // Payment Mode Logic
    const monthlyContainer = document.getElementById('monthly-container');
    const onetimeContainer = document.getElementById('onetime-container');
    const partPaymentInput = document.getElementById('part-payment');
    const onetimePaymentInput = document.getElementById('onetime-payment');
    const paymentRadios = document.querySelectorAll('input[name="paymentType"]');

    paymentRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.value === 'monthly') {
                monthlyContainer.style.display = 'block';
                onetimeContainer.style.display = 'none';
                onetimePaymentInput.value = ''; // Reset inactive
            } else {
                monthlyContainer.style.display = 'none';
                onetimeContainer.style.display = 'block';
                partPaymentInput.value = ''; // Reset inactive
            }
        });
    });
});

function calculateFreedom() {
    // 1. Get Inputs
    const principalInput = parseFloat(document.getElementById('principal').value);
    const emiInput = parseFloat(document.getElementById('current-emi').value);
    const rateInput = parseFloat(document.getElementById('interest-rate').value);

    // Determine which mode is active
    const paymentMode = document.querySelector('input[name="paymentType"]:checked').value;

    console.log('--- Debug Start ---');
    console.log('Payment Mode:', paymentMode);

    let partPaymentInput = 0;
    let onetimePaymentInput = 0;

    if (paymentMode === 'monthly') {
        partPaymentInput = parseFloat(document.getElementById('part-payment').value) || 0;
    } else {
        onetimePaymentInput = parseFloat(document.getElementById('onetime-payment').value) || 0;
    }

    console.log('Part Payment Value:', partPaymentInput);
    console.log('One time Payment Value:', onetimePaymentInput);
    console.log('--- Debug End ---');

    // 2. Validate basic logic
    const monthlyRate = rateInput / 12 / 100;
    const initialInterest = principalInput * monthlyRate;

    if (emiInput <= initialInterest) {
        alert('Your current EMI is too low to cover the interest. The loan will never be paid off at this rate. Please increase your EMI.');
        return;
    }

    // 3. Calculate Scenarios
    const scenarioWithPart = calculateScenario(principalInput, emiInput, partPaymentInput, monthlyRate, onetimePaymentInput);
    const scenarioWithoutPart = calculateScenario(principalInput, emiInput, 0, monthlyRate, 0);

    // Save for toggle
    lastResults = { withPart: scenarioWithPart, withoutPart: scenarioWithoutPart };

    // 4. Display Results
    displayResults(scenarioWithPart, scenarioWithoutPart, partPaymentInput, onetimePaymentInput);
}

function calculateScenario(principal, emi, partPayment, monthlyRate, oneTimePayment) {
    let balance = principal;
    let months = 0;
    let totalInterest = 0;
    const totalMonthlyPay = emi + partPayment;

    // Safety break
    const MAX_MONTHS = 1200;

    while (balance > 0 && months < MAX_MONTHS) {
        months++;

        let interest = balance * monthlyRate;
        let payment = totalMonthlyPay;

        if (months === 1 && oneTimePayment > 0) payment += oneTimePayment;
        if (payment > (balance + interest)) payment = balance + interest;

        let principalComponent = payment - interest;
        totalInterest += interest;
        balance -= principalComponent;
        if (balance < 0.1) balance = 0;
    }

    return {
        months: months,
        totalInterest: totalInterest
    };
}

function displayResults(withPart, withoutPart, partPayment, oneTimePayment) {
    // Banner Elements
    const bannerTitle = document.getElementById('banner-title');
    const bannerValue = document.getElementById('banner-value');
    const bannerSubtitle = document.getElementById('banner-subtitle');

    const interestWithPartEl = document.getElementById('interest-with-part');
    const interestWithoutPartEl = document.getElementById('interest-without-part');
    const chartBarSmart = document.getElementById('bar-smart');

    // Difference Dates
    const dateWithoutEl = document.getElementById('date-without-part');
    const durationWithoutEl = document.getElementById('duration-without-part');
    const dateWithEl = document.getElementById('date-with-part');
    const durationWithEl = document.getElementById('duration-with-part');

    const today = new Date();
    const dateOptions = { month: 'short', year: 'numeric' };

    const endDateWithInfo = new Date(today.getFullYear(), today.getMonth() + withPart.months, 1);
    const endDateWithoutInfo = new Date(today.getFullYear(), today.getMonth() + withoutPart.months, 1);

    // Populate Banner
    if (partPayment > 0 || oneTimePayment > 0) {
        let message = "By paying ";
        if (partPayment > 0) message += `<span style="color:#fff; font-weight:800; border-bottom:2px solid rgba(255,255,255,0.5)">${formatMoney(partPayment)}</span> extra monthly`;
        if (oneTimePayment > 0) message += `<span style="color:#fff; font-weight:800; border-bottom:2px solid rgba(255,255,255,0.5)">${formatMoney(oneTimePayment)}</span> one-time`;
        message += ", you close your loan in";
        bannerTitle.innerHTML = message;
    } else {
        bannerTitle.textContent = "At your current repayment rate, you close your loan in";
    }

    // Dynamic Labels
    let labelText = "With Monthly Part Payment";
    if (oneTimePayment > 0 && partPayment === 0) labelText = "With One-time Payment";
    else if (oneTimePayment > 0 && partPayment > 0) labelText = "With Part Payments";

    const dynamicIds = ['label-grid-part', 'label-summary-part', 'label-timeline-part'];
    dynamicIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = labelText;
    });

    bannerValue.textContent = formatDuration(withPart.months);
    bannerSubtitle.textContent = `by ${endDateWithInfo.toLocaleDateString('en-IN', dateOptions)}`;

    const savedInterest = withoutPart.totalInterest - withPart.totalInterest;
    document.getElementById('interest-saved-amount').textContent = formatMoney(savedInterest > 0 ? savedInterest : 0);

    // Populate Difference Grid
    dateWithoutEl.textContent = endDateWithoutInfo.toLocaleDateString('en-IN', dateOptions);
    durationWithoutEl.textContent = formatDuration(withoutPart.months);

    dateWithEl.textContent = endDateWithInfo.toLocaleDateString('en-IN', dateOptions);
    durationWithEl.textContent = formatDuration(withPart.months);

    // Render Timeline Bar Width
    // Determine scale based on max months
    const maxMonths = withoutPart.months;
    const percentage = (withPart.months / maxMonths) * 100;

    // Animate width
    setTimeout(() => {
        chartBarSmart.style.width = `${percentage}%`;
    }, 100);

    // Render Labels
    updateTimelineLabels(withPart, withoutPart);
    // Interest Table Population
    interestWithPartEl.textContent = formatMoney(withPart.totalInterest);
    interestWithoutPartEl.textContent = formatMoney(withoutPart.totalInterest);
    document.getElementById('interest-saved-summary').textContent = formatMoney(savedInterest > 0 ? savedInterest : 0);

    // Initial Time Update
    updateSummaryTime(withPart, withoutPart);

    // Initial Timeline Update
    // Draw bar width first
    setTimeout(() => {
        chartBarSmart.style.width = `${((withPart.months / withoutPart.months) * 100)}%`;
    }, 100);

    updateTimelineLabels(withPart, withoutPart);
}

function updateSummaryTime(withPart, withoutPart) {
    const timeWithoutEl = document.getElementById('time-without-part');
    const timeWithEl = document.getElementById('time-with-part');
    const timeSavedEl = document.getElementById('time-saved-summary');

    const savedMonths = withoutPart.months - withPart.months;
    const finalSaved = savedMonths > 0 ? savedMonths : 0;

    if (currentViewMode === 'year') {
        // Year Mode: X Yr Y Mo
        timeWithoutEl.textContent = formatDuration(withoutPart.months);
        timeWithEl.textContent = formatDuration(withPart.months);
        timeSavedEl.textContent = formatDuration(finalSaved);
    } else {
        // Month Mode: X Months
        timeWithoutEl.textContent = `${withoutPart.months} Months`;
        timeWithEl.textContent = `${withPart.months} Months`;
        timeSavedEl.textContent = `${finalSaved} Months`;
    }
}

function updateTimelineLabels(withPart, withoutPart) {
    // ... (rest of logic) ...
    const today = new Date();
    const dateOptions = { month: 'short', year: 'numeric' };

    const endDateWithInfo = new Date(today.getFullYear(), today.getMonth() + withPart.months, 1);
    const endDateWithoutInfo = new Date(today.getFullYear(), today.getMonth() + withoutPart.months, 1);

    // Selectors (Single Label per Bar)
    const labelStd = document.getElementById('bar-label-standard');
    const labelSmart = document.getElementById('bar-label-smart');

    if (currentViewMode === 'year') {
        // YEAR MODE: Show Date
        labelStd.textContent = endDateWithoutInfo.toLocaleDateString('en-IN', dateOptions);
        labelSmart.textContent = endDateWithInfo.toLocaleDateString('en-IN', dateOptions);
    } else {
        // MONTH MODE: Show Duration
        labelStd.textContent = `${withoutPart.months} Mo`;
        labelSmart.textContent = `${withPart.months} Mo`;
    }
}

function formatDuration(totalMonths) {
    if (totalMonths < 12) return `${totalMonths} Mo`;
    const years = Math.floor(totalMonths / 12);
    const months = totalMonths % 12;
    if (months === 0) return `${years} Yr`;
    return `${years} Yr ${months} Mo`;
}

function formatMoney(amount) {
    return amount.toLocaleString('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    });
}
