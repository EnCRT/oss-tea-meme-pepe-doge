const chai = require('chai');
const expect = chai.expect;

const { fetchMock } = testGlobals;
describe('body matching', () => {
	let fm;
	before(() => {
		fm = fetchMock.createInstance();
		fm.config.warnOnUnmatched = false;
	});

	afterEach(() => fm.restore());

	it('should not match if no body provided in request', async () => {
		fm.mock({ body: { foo: 'bar' } }, 200).catch();

		await fm.fetchHandler('http://a.com/', {
			method: 'POST',
		});
		expect(fm.calls(true).length).to.equal(0);
	});

	it('should match if no content type is specified', async () => {
		fm.mock({ body: { foo: 'bar' } }, 200).catch();

		await fm.fetchHandler('http://a.com/', {
			method: 'POST',
			body: JSON.stringify({ foo: 'bar' }),
		});
		expect(fm.calls(true).length).to.equal(1);
	});

	it('should match when using Request', async () => {
		fm.mock({ body: { foo: 'bar' } }, 200).catch();

		await fm.fetchHandler(
			new fm.config.Request('http://a.com/', {
				method: 'POST',
				body: JSON.stringify({ foo: 'bar' }),
			})
		);
		expect(fm.calls(true).length).to.equal(1);
	});

	it('should match if body sent matches expected body', async () => {
		fm.mock({ body: { foo: 'bar' } }, 200).catch();

		await fm.fetchHandler('http://a.com/', {
			method: 'POST',
			body: JSON.stringify({ foo: 'bar' }),
			headers: { 'Content-Type': 'application/json' },
		});
		expect(fm.calls(true).length).to.equal(1);
	});

	it('should not match if body sent doesn’t match expected body', async () => {
		fm.mock({ body: { foo: 'bar' } }, 200).catch();

		await fm.fetchHandler('http://a.com/', {
			method: 'POST',
			body: JSON.stringify({ foo: 'woah!!!' }),
			headers: { 'Content-Type': 'application/json' },
		});
		expect(fm.calls(true).length).to.equal(0);
	});

	it('should not match if body sent isn’t JSON', async () => {
		fm.mock({ body: { foo: 'bar' } }, 200).catch();

		await fm.fetchHandler('http://a.com/', {
			method: 'POST',
			body: new ArrayBuffer(8),
			headers: { 'Content-Type': 'application/json' },
		});
		expect(fm.calls(true).length).to.equal(0);
	});

	it('should ignore the order of the keys in the body', async () => {
		fm.mock(
			{
				body: {
					foo: 'bar',
					baz: 'qux',
				},
			},
			200
		).catch();

		await fm.fetchHandler('http://a.com/', {
			method: 'POST',
			body: JSON.stringify({
				baz: 'qux',
				foo: 'bar',
			}),
			headers: { 'Content-Type': 'application/json' },
		});
		expect(fm.calls(true).length).to.equal(1);
	});

	it('should ignore the body option matcher if request was GET', async () => {
		fm.mock(
			{
				body: {
					foo: 'bar',
					baz: 'qux',
				},
			},
			200
		).catch();

		await fm.fetchHandler('http://a.com/');
		expect(fm.calls(true).length).to.equal(1);
	});

	describe('partial body matching', () => {
		it('match when missing properties', async () => {
			fm.mock({ body: { ham: 'sandwich' }, matchPartialBody: true }, 200).catch(
				404
			);
			const res = await fm.fetchHandler('http://a.com', {
				method: 'POST',
				body: JSON.stringify({ ham: 'sandwich', egg: 'mayonaise' }),
			});
			expect(res.status).to.equal(200);
		});

		it('match when missing nested properties', async () => {
			fm.mock(
				{ body: { meal: { ham: 'sandwich' } }, matchPartialBody: true },
				200
			).catch(404);
			const res = await fm.fetchHandler('http://a.com', {
				method: 'POST',
				body: JSON.stringify({
					meal: { ham: 'sandwich', egg: 'mayonaise' },
				}),
			});
			expect(res.status).to.equal(200);
		});

		it('not match when properties at wrong indentation', async () => {
			fm.mock({ body: { ham: 'sandwich' }, matchPartialBody: true }, 200).catch(
				404
			);
			const res = await fm.fetchHandler('http://a.com', {
				method: 'POST',
				body: JSON.stringify({ meal: { ham: 'sandwich' } }),
			});
			expect(res.status).to.equal(404);
		});

		it('match when starting subset of array', async () => {
			fm.mock({ body: { ham: [1, 2] }, matchPartialBody: true }, 200).catch(
				404
			);
			const res = await fm.fetchHandler('http://a.com', {
				method: 'POST',
				body: JSON.stringify({ ham: [1, 2, 3] }),
			});
			expect(res.status).to.equal(200);
		});

		it('not match when not starting subset of array', async () => {
			fm.mock({ body: { ham: [1, 3] }, matchPartialBody: true }, 200).catch(
				404
			);
			const res = await fm.fetchHandler('http://a.com', {
				method: 'POST',
				body: JSON.stringify({ ham: [1, 2, 3] }),
			});
			expect(res.status).to.equal(404);
		});
	});
});
