document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('emi-form');
    // Removed unused logic that hides inputs

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        calculateFreedom();
    });
    // Toggle Logic
    const toggleBtns = document.querySelectorAll('.toggle-btn');
    toggleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update UI
            toggleBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Update State
            currentViewMode = btn.dataset.mode; // 'year' or 'month'

            // Refresh Labels (if results exist)
            if (lastResults) {
                updateTimelineLabels(lastResults.withPart, lastResults.withoutPart);
            }
        });
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

let currentViewMode = 'year';
let lastResults = null;

function calculateFreedom() {
    // 1. Get Inputs
    const principalInput = parseFloat(document.getElementById('principal').value);
    const emiInput = parseFloat(document.getElementById('current-emi').value);
    const rateInput = parseFloat(document.getElementById('interest-rate').value);
    const partPaymentInput = parseFloat(document.getElementById('part-payment').value) || 0;
    const onetimePaymentInput = parseFloat(document.getElementById('onetime-payment').value) || 0;

    // 2. Validate basic logic
    const monthlyRate = rateInput / 12 / 100;
    const initialInterest = principalInput * monthlyRate;

    if (emiInput <= initialInterest) {
        alert('Your current EMI is too low to cover the interest. The loan will never be paid off at this rate. Please increase your EMI.');
        return;
    }

    // 3. Calculate Scenario 1: With Part Payment
    const scenarioWithPart = calculateScenario(principalInput, emiInput, partPaymentInput, monthlyRate, onetimePaymentInput);

    // 4. Calculate Scenario 2: Without Part Payment (Reference)
    const scenarioWithoutPart = calculateScenario(principalInput, emiInput, 0, monthlyRate, 0);

    // 5. Display Results
    lastResults = { withPart: scenarioWithPart, withoutPart: scenarioWithoutPart }; // Cache for toggle
    displayResults(scenarioWithPart, scenarioWithoutPart, partPaymentInput, onetimePaymentInput);
}

function calculateScenario(principal, emi, partPayment, monthlyRate, oneTimePayment) {
    let balance = principal;
    let months = 0;
    let totalInterest = 0;
    const totalMonthlyPay = emi + partPayment;

    // Safety brake for infinite loops
    const MAX_MONTHS = 1200; // 100 years

    while (balance > 0 && months < MAX_MONTHS) {
        months++;

        let interest = balance * monthlyRate;

        // If it's the last month, payment might be less
        let payment = totalMonthlyPay;

        // Apply One-time payment in Month 1
        if (months === 1 && oneTimePayment > 0) {
            payment += oneTimePayment;
        }

        if (payment > (balance + interest)) {
            payment = balance + interest;
        }

        let principalComponent = payment - interest;

        totalInterest += interest;
        balance -= principalComponent;

        // Floating point correction
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

    // Timeline Elements
    const barSmart = document.getElementById('bar-smart');

    // Difference Dates
    const dateWithoutEl = document.getElementById('date-without-part');
    const durationWithoutEl = document.getElementById('duration-without-part');
    const dateWithEl = document.getElementById('date-with-part');
    const durationWithEl = document.getElementById('duration-with-part');

    // Calculate Dates
    const today = new Date();
    const dateOptions = { month: 'short', year: 'numeric' };

    const endDateWithInfo = new Date(today.getFullYear(), today.getMonth() + withPart.months, 1);
    const endDateWithoutInfo = new Date(today.getFullYear(), today.getMonth() + withoutPart.months, 1);

    // Populate Banner (Completion Focus)
    if (partPayment > 0 || oneTimePayment > 0) {
        let message = "By paying ";

        if (partPayment > 0) {
            message += `<span style="color:#fff; font-weight:800; border-bottom:2px solid rgba(255,255,255,0.5)">${formatMoney(partPayment)}</span> extra monthly`;
        }

        if (oneTimePayment > 0) {
            message += `<span style="color:#fff; font-weight:800; border-bottom:2px solid rgba(255,255,255,0.5)">${formatMoney(oneTimePayment)}</span> one-time`;
        }

        message += ", you close your loan in";
        bannerTitle.innerHTML = message;
    } else {
        bannerTitle.textContent = "At your current repayment rate, you close your loan in";
    }

    // Dynamic Labels
    let labelText = "With Monthly Part Payment"; // Default
    if (oneTimePayment > 0 && partPayment === 0) {
        labelText = "With One-time Payment";
    } else if (oneTimePayment > 0 && partPayment > 0) {
        // Technically impossible with current UI toggle, but robust fallback
        labelText = "With Part Payments";
    }

    // Update all dynamic labels
    const dynamicIds = ['label-timeline-part', 'label-grid-part', 'label-summary-part'];
    dynamicIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = labelText;
    });

    bannerValue.textContent = formatDuration(withPart.months);
    // Subtitle shows specific date for clarity (Year Details)
    bannerSubtitle.textContent = `by ${endDateWithInfo.toLocaleDateString('en-IN', dateOptions)}`;

    // Footer (Savings) stays the same
    const savedInterest = withoutPart.totalInterest - withPart.totalInterest;
    document.getElementById('interest-saved-amount').textContent = formatMoney(savedInterest > 0 ? savedInterest : 0);

    // Populate Difference Grid
    dateWithoutEl.textContent = endDateWithoutInfo.toLocaleDateString('en-IN', dateOptions);
    durationWithoutEl.textContent = formatDuration(withoutPart.months);

    dateWithEl.textContent = endDateWithInfo.toLocaleDateString('en-IN', dateOptions);
    durationWithEl.textContent = formatDuration(withPart.months);

    // Update Visual Timeline
    updateTimelineLabels(withPart, withoutPart); // Helper function for dynamic updates

    // Smart bar percentage based on time relative to standard
    let percentage = 100;
    if (withoutPart.months > 0) {
        percentage = (withPart.months / withoutPart.months) * 100;
    }

    // Animate width
    setTimeout(() => {
        barSmart.style.width = `${percentage}%`;
    }, 100);

    // Interest Table Population
    interestWithPartEl.textContent = formatMoney(withPart.totalInterest);
    interestWithoutPartEl.textContent = formatMoney(withoutPart.totalInterest);
    document.getElementById('interest-saved-summary').textContent = formatMoney(savedInterest > 0 ? savedInterest : 0);

    // Time Table Population
    document.getElementById('time-without-part').textContent = formatDuration(withoutPart.months);
    document.getElementById('time-with-part').textContent = formatDuration(withPart.months);

    // Time Saved Calculation
    const monthsSavedVal = withoutPart.months - withPart.months;
    document.getElementById('time-saved-summary').textContent = formatDuration(monthsSavedVal > 0 ? monthsSavedVal : 0);

    // Toggle Screens
    const resultSection = document.getElementById('result-section');
    resultSection.classList.remove('hidden');

    // Smooth scroll to results
    resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function formatDuration(totalMonths) {
    if (totalMonths < 12) {
        return `${totalMonths} Mo`;
    }
    const years = Math.floor(totalMonths / 12);
    const months = totalMonths % 12;
    if (months === 0) {
        return `${years} Yr`;
    }
    return `${years} Yr ${months} Mo`;
}

function formatMoney(amount) {
    return amount.toLocaleString('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    });
}

// Logic: Determine what to show on timeline labels based on view mode
function updateTimelineLabels(withPart, withoutPart) {
    const labelStandard = document.getElementById('bar-label-standard');
    const labelSmart = document.getElementById('bar-label-smart');

    // Recalculate dates because we need them for display
    const today = new Date();
    const endDateWithInfo = new Date(today.getFullYear(), today.getMonth() + withPart.months, 1);
    const endDateWithoutInfo = new Date(today.getFullYear(), today.getMonth() + withoutPart.months, 1);
    const dateOptions = { month: 'short', year: 'numeric' };

    if (currentViewMode === 'year') {
        // Show Finish Date (e.g. Nov 2040)
        if (labelStandard) labelStandard.textContent = endDateWithoutInfo.toLocaleDateString('en-IN', dateOptions);
        if (labelSmart) labelSmart.textContent = endDateWithInfo.toLocaleDateString('en-IN', dateOptions);
    } else {
        // Show Total Months (e.g. 172 Mo) -> Requested Fix
        if (labelStandard) labelStandard.textContent = `${withoutPart.months} Mo`;
        if (labelSmart) labelSmart.textContent = `${withPart.months} Mo`;
    }
}
