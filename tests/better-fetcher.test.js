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

	it('Simple caching check', async () => {
		var data = await page.evaluate(async () => {
			await fetchAndCache('https://jsonplaceholder.typicode.com/todos/1');
			responses = [];
			await betterFetcher.get('https://jsonplaceholder.typicode.com/todos/1', { useCache: true }, function(
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

	it("Default timeout test", async ()=> {
		jest.setTimeout(10000);
		var result = await page.evaluate(async () => {
			var success = false;
			var data = undefined;
			try {
				data = await betterFetcher.get("https://httpstat.us/200?sleep=5300");
			} catch(e) {
				success = true;
			}
			if (data) {
				success = false;
			}
			return Promise.resolve(success);
		});

		expect(result).toBeTruthy();
	})

	it("Custom timeout test", async () => {
		jest.setTimeout(10000);
		var result = await page.evaluate(async () => {
			var success = true;
			var data = undefined;
			try {
				data = await betterFetcher.get("https://httpstat.us/200?sleep=5300", { timeout: 8000 });
			} catch(e) {
				console.log(e);
				success = false;
			}
			if (!data) {
				success = false;
			}
			return Promise.resolve(success);
		});

		expect(result).toBeTruthy();
	})

	it("Set default time test", async () => {
		jest.setTimeout(10000);
		var result = await page.evaluate(async () => {
			var success = true;
			var data = undefined;
			betterFetcher.setDefaultTimeout(8000);
			try {
				data = await betterFetcher.get("https://httpstat.us/200?sleep=5300");
			} catch(e) {
				console.log(e);
				success = false;
			}
			if (!data) {
				success = false;
			}
			betterFetcher.setDefaultTimeout(5000);
			return Promise.resolve(success);
		});

		expect(result).toBeTruthy();
	});

	it("Test setting default headers", async () => {
		var result = await page.evaluate(async () => {
			betterFetcher.setDefaultHeaders({testHeader1: "foo"}, "GET");
			var headers = betterFetcher.getDefaultHeaders("GET");
			if (headers.testHeader1 == "foo") {
				return Promise.resolve(true);
			} else {
				return Promise.resolve(false);
			}
		});

		expect(result).toBeTruthy();
	})

	it('Simple get request', async () => {
		jest.setTimeout(30000);
		var data = await page.evaluate(async () => {
			var response = await betterFetcher.get('https://jsonplaceholder.typicode.com/users/1');
			return response.json();
		});

		expect(data.name).toBe('Leanne Graham');
		expect(data.address.geo.lat).toBe('-37.3159');
	});

	it('Custom cache handler', async () => {
		var result = await page.evaluate(async () => {
			var customHandlerRan = false;
			var responses = [];
			await betterFetcher.get(
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
				data = await betterFetcher.get('https://httpstat.us/400');
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

describe('Testing post', () => {
	beforeAll(async () => {
		await page.goto(PATH, { waitUntil: 'load' });
		page.on('console', (msg) => {
			console.log(msg.text() + '\n' + msg.location().url + ':' + msg.location().lineNumber);
		});
	});

	afterAll(async () => {
		const jsCoverage = await page.coverage.stopJSCoverage();
		pti.write(jsCoverage);
	});

	it('Simple POST test', async () => {
		var result = await page.evaluate(async () => {
			var postResponse = await betterFetcher.post('https://jsonplaceholder.typicode.com/posts', {
				name: 'George',
				address: '123 test lane'
			});
			return await postResponse.json();
		});
		expect(!isNaN(result.id)).toBeTruthy();
		expect(result.name).toBe('George');
	});

	it('Simple error status test', async () => {
		var testPassed = await page.evaluate(async () => {
			var success = false;
			var data;
			try {
				data = await betterFetcher.post('https://httpstat.us/400');
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

describe('Testing put', () => {
	it('Simple put test', async () => {
		var result = await page.evaluate(async () => {
			var putResponse = await betterFetcher.put('https://jsonplaceholder.typicode.com/posts/1', {
				id: 1,
				title: 'foo',
				body: 'bar',
				userId: 1
			});
			return await putResponse.json();
		});
		expect(!isNaN(result.id)).toBeTruthy();
		expect(result.body).toBe('bar');
	});

	it('Simple error status test', async () => {
		var testPassed = await page.evaluate(async () => {
			var success = false;
			var data;
			try {
				data = await betterFetcher.put('https://httpstat.us/400');
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

describe('Testing delete', () => {
	it("Simple delete test", async () => {
		var result = await page.evaluate(async () => {
			var response = betterFetcher.delete('https://jsonplaceholder.typicode.com/posts/1');
			return Promise.resolve(response);
		})
		//console.log(result);
	})
});