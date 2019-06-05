var puppeteer = require('puppeteer');
const pti = require('puppeteer-to-istanbul');

describe('Testing get()', () => {
	beforeAll(async () => {
		await page.goto(PATH, { waitUntil: 'load' });
		page.on('console', (msg) => {
			console.log(msg.text() + '\n' + msg.location().url + ':' + msg.location().lineNumber);
		});
		page.evaluate(function() {
			window.fetchAndCache = async function fetchAndCache(URL, init) {
				var response = await fetch(URL, init);
				// Check if we received a valid response
				/*if (!response || response.status !== 200 || response.type !== 'basic') {
					return response;
				}*/

				// IMPORTANT: Clone the response. A response is a stream
				// and because we want the browser to consume the response
				// as well as the cache consuming the response, we need
				// to clone it so we have two streams.
				var responseToCache = response.clone();

				var cache = await caches.open('test-cache-v1');
				console.log('Caching repsponse to: ' + URL);
				await cache.put(URL, responseToCache);
				console.log('Response cached');
				return response;
			};
		});
		await page.coverage.startJSCoverage();
	});

	afterAll(async () => {
		const jsCoverage = await page.coverage.stopJSCoverage();
		pti.write(jsCoverage);
	});

	it('Simple caching check', async () => {
		var data = await page.evaluate(async () => {
			await fetchAndCache('https://jsonplaceholder.typicode.com/todos/1');
			responses = [];
			await betterFetch.get('https://jsonplaceholder.typicode.com/todos/1', { useCache: true }, function(
				response
			) {
				response.json().then(function(data) {
					responses.push(data);
				});
			});
			return responses;
		});
		expect(data.length).toBe(2);
		expect(data[0].title === data[1].title);
	});

	it('Simple get request', async () => {
		jest.setTimeout(30000);
		var data = await page.evaluate(async () => {
			var response = await betterFetch.get('https://jsonplaceholder.typicode.com/users/1');
			return response.json();
		});

		expect(data.name).toBe('Leanne Graham');
		expect(data.address.geo.lat).toBe('-37.3159');
	});

	it('Custom cache handler', async () => {
		var result = await page.evaluate(async () => {
			var customHandlerRan = false;
			var responses = [];
			await betterFetch.get(
				'https://jsonplaceholder.typicode.com/todos/1',
				{
					handleCachedResponse: function(response) {
						customHandlerRan = true;
						responses.push(response);
					},
					useCache: true
				},
				function(response) {
					responses.push(response);
				}
			);
			if (customHandlerRan) {
				return Promise.resolve([ await responses[0].json(), await responses[1].json() ]);
			} else {
				return false;
			}
		});

		if (!result) {
			throw Error("Custom cache handler didn't run!");
		}
		var data = result;

		expect(data.length).toBe(2);
		expect(data[0].title === data[1].title);
	});

	it('Simple error status test', async () => {
		var testPassed = await page.evaluate(async () => {
			var success = false;
			var data;
			try {
				data = await betterFetch.get('https://httpstat.us/400');
			} catch (error) {
				success = true;
			}
			if (data) {
				success = false;
			}
			return Promise.resolve(success);
		});
		if (!testPassed) {
			throw Error('No error generated or Improper error generated');
		}
	});
});
