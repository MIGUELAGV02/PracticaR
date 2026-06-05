const fmt = new Intl.NumberFormat('es-MX', {
	style: 'currency',
	currency: 'MXN',
	minimumFractionDigits: 2,
	maximumFractionDigits: 2,
});

const elements = {
	name: document.getElementById('name'),
	amount: document.getElementById('amount'),
	ivaRate: document.getElementById('ivaRate'),
	interestRate: document.getElementById('interestRate'),
	weeks: document.getElementById('weeks'),
	startDate: document.getElementById('startDate'),
	previewName: document.getElementById('previewName'),
	previewWeeks: document.getElementById('previewWeeks'),
	previewIva: document.getElementById('previewIva'),
	previewInterest: document.getElementById('previewInterest'),
	previewTotal: document.getElementById('previewTotal'),
	outAmount: document.getElementById('outAmount'),
	outIvaRate: document.getElementById('outIvaRate'),
	outIva: document.getElementById('outIva'),
	outInterestRate: document.getElementById('outInterestRate'),
	outInterest: document.getElementById('outInterest'),
	outTotal: document.getElementById('outTotal'),
	hint: document.getElementById('interestHint'),
	scheduleBody: document.getElementById('scheduleBody'),
	btnView1: document.getElementById('btnView1'),
	btnView2: document.getElementById('btnView2'),
	view1: document.getElementById('view1'),
	view2: document.getElementById('view2'),
	calculate: document.getElementById('calculate'),
	refreshSchedule: document.getElementById('refreshSchedule'),
	printSchedule: document.getElementById('printSchedule'),
	today: document.getElementById('today'),
};

const formatDate = (date) => {
	const options = { year: 'numeric', month: 'short', day: '2-digit' };
	return date.toLocaleDateString('es-MX', options);
};

const formatDay = (date) => {
	return date.toLocaleDateString('es-MX', { weekday: 'long' });
};

const toISODate = (date) => {
	const offset = date.getTimezoneOffset();
	const local = new Date(date.getTime() - offset * 60000);
	return local.toISOString().split('T')[0];
};

const getStartDate = () => {
	const value = elements.startDate.value;
	return value ? new Date(value + 'T00:00:00') : new Date();
};

const renderSchedule = (total, weeklyPayment, weeks, startDate) => {
	if (!weeks || total <= 0) {
		elements.scheduleBody.innerHTML = `
			<tr>
				<td colspan="5"><div class="empty-state">Haz un cálculo para ver aquí el plan de pagos.</div></td>
			</tr>
		`;
		return;
	}

	const rows = [];
	let balance = total;

	for (let index = 1; index <= weeks; index += 1) {
		const paymentDate = new Date(startDate);
		paymentDate.setDate(paymentDate.getDate() + ((index - 1) * 7));
		balance = Math.max(balance - weeklyPayment, 0);

		rows.push(`
			<tr>
				<td>${index}</td>
				<td>${formatDate(paymentDate)}</td>
				<td>${formatDay(paymentDate)}</td>
				<td>${fmt.format(weeklyPayment)}</td>
				<td>${fmt.format(balance)}</td>
			</tr>
		`);
	}

	elements.scheduleBody.innerHTML = rows.join('');
};

const calculate = () => {
	const name = elements.name.value.trim() || 'Sin nombre';
	const amount = Math.max(Number(elements.amount.value) || 0, 0);
	const ivaRate = Math.max(Number(elements.ivaRate.value) || 0, 0) / 100;
	const interestRate = Math.max(Number(elements.interestRate.value) || 0, 0) / 100;
	const weeks = Number(elements.weeks.value) || 0;
	const iva = amount * ivaRate;
	const interest = amount * interestRate;
	const total = amount + iva + interest;
	const weeklyPayment = weeks > 0 ? total / weeks : 0;
	const startDate = getStartDate();

	elements.previewName.textContent = name;
	elements.previewWeeks.textContent = `${weeks} semanas`;
	elements.previewIva.textContent = fmt.format(iva);
	elements.previewInterest.textContent = fmt.format(interest);
	elements.previewTotal.textContent = fmt.format(total);

	elements.outAmount.textContent = fmt.format(amount);
	elements.outIvaRate.textContent = `${(ivaRate * 100).toFixed(2).replace(/\.00$/, '')}%`;
	elements.outIva.textContent = fmt.format(iva);
	elements.outInterestRate.textContent = `${(interestRate * 100).toFixed(2).replace(/\.00$/, '')}%`;
	elements.outInterest.textContent = fmt.format(interest);
	elements.outTotal.textContent = fmt.format(total);

	elements.hint.textContent = `IVA aplicado: ${(ivaRate * 100).toFixed(2).replace(/\.00$/, '')}%. Interés aplicado: ${(interestRate * 100).toFixed(2).replace(/\.00$/, '')}%. Las semanas solo cambian la cantidad de pagos.`;

	renderSchedule(total, weeklyPayment, weeks, startDate);
};

const setView = (viewNumber) => {
	const isView1 = viewNumber === 1;
	elements.view1.classList.toggle('active', isView1);
	elements.view2.classList.toggle('active', !isView1);
	elements.btnView1.classList.toggle('active', isView1);
	elements.btnView2.classList.toggle('active', !isView1);
};

const printSchedule = () => {
	setView(2);
	window.requestAnimationFrame(() => {
		window.print();
	});
};

elements.btnView1.addEventListener('click', () => setView(1));
elements.btnView2.addEventListener('click', () => setView(2));
elements.calculate.addEventListener('click', calculate);
elements.refreshSchedule.addEventListener('click', calculate);
elements.printSchedule.addEventListener('click', printSchedule);
elements.today.addEventListener('click', () => {
	elements.startDate.value = toISODate(new Date());
	calculate();
});

['input', 'change'].forEach((eventName) => {
	elements.name.addEventListener(eventName, calculate);
	elements.amount.addEventListener(eventName, calculate);
	elements.ivaRate.addEventListener(eventName, calculate);
	elements.interestRate.addEventListener(eventName, calculate);
	elements.weeks.addEventListener(eventName, calculate);
	elements.startDate.addEventListener(eventName, calculate);
});

elements.startDate.value = toISODate(new Date());
calculate();