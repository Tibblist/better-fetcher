var betterFetch = require('../src/better-fetch');
var caches = require('../src/mock-cache');
const fetchMock = require('fetch-mock');

const SIMPLE_URL = 'https://jsonplaceholder.typicode.com/todos/1';
const SIMPLE_OPTIONS = {};

describe('Testing get()', () => {
	beforeEach(() => {
		caches.init();
	});
	it('Simple caching check', (done) => {
		isDone = [ false, false ];
		betterFetch.get(SIMPLE_URL, { useCache: true }, function(response) {
			response.json().then(function(data) {
				if (!isDone[0]) {
					expect(data.title).toBe('Old lorem ipsum');
					expect(data.thing).toBeTruthy();
					isDone[0] = true;
				} else if (!isDone[1]) {
					expect(data.title).toBe('delectus aut autem');
					expect(data.thing).toBeUndefined();
					isDone[1] = true;
					if (checkIfDone(isDone)) done();
				}
			});
		});
	});

	it('Simple get request', () => {
		return betterFetch
			.get('https://jsonplaceholder.typicode.com/users/1', SIMPLE_OPTIONS)
			.then(function(response) {
				return response.json();
			})
			.then(function(data) {
				expect(data.name).toBe('Leanne Graham');
				expect(data.address.geo.lat).toBe('-37.3159');
			});
	});

	it('Custom cache handler', (done) => {
		var isDone = [ false, false ];
		betterFetch.get(
			SIMPLE_URL,
			{
				handleCachedResponse: function(response) {
					isDone[0] = true;
					response.json().then(function(data) {
						expect(data.title).toBe('Old lorem ipsum');
						expect(data.thing).toBeTruthy();
						if (checkIfDone(isDone)) done();
					});
				},
				useCache: true
			},
			function(response) {
				isDone[1] = true;
				response.json().then(function(data) {
					expect(data.title).toBe('delectus aut autem');
					expect(data.thing).toBeUndefined();
					if (checkIfDone(isDone)) done();
				});
			}
		);
	});

	it('Simple error status test', (done) => {
		betterFetch.get(
			'https://httpstat.us/400',
			{
				handleError: function(err) {
					expect(err).toBeTruthy();
					expect(err.statusText).toBe('Bad Request');
					expect(err.status).toBe(400);
					done();
				}
			},
			function(data) {
				expect(data).toBeUndefined();
			}
		);
	});
});

function checkIfDone(arr) {
	var done = true;
	for (var i = 0; i < arr.length; i++) {
		if (!arr[i]) {
			done = false;
			break;
		}
	}
	return done;
}
