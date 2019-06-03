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
		cacheFetch.get(
			SIMPLE_URL,
			function(data) {
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
			},
			SIMPLE_OPTIONS
		);
	});

	it('Simple get request', (done) => {
		cacheFetch.get(
			'https://jsonplaceholder.typicode.com/users/1',
			function(data) {
				expect(data.name).toBe('Leanne Graham');
				expect(data.address.geo.lat).toBe('-37.3159');
				done();
			},
			SIMPLE_OPTIONS
		);
	});

	it('Custom cache handler', (done) => {
		var isDone = [ false, false ];
		cacheFetch.get(
			SIMPLE_URL,
			function(data) {
				isDone[1] = true;
				expect(data.title).toBe('delectus aut autem');
				expect(data.thing).toBeUndefined();
				if (checkIfDone(isDone)) done();
			},
			{
				handleCachedData: function(data) {
					isDone[0] = true;
					expect(data.title).toBe('Old lorem ipsum');
					expect(data.thing).toBeTruthy();
					if (checkIfDone(isDone)) done();
				}
			}
		);
	});

	it('Simple error status test', (done) => {
		cacheFetch.get(
			'https://httpstat.us/400',
			function(data) {
                expect(data).toBeUndefined();
			},
			{
				handleError: function(err) {
                    expect(err).toBeTruthy();
                    expect(err.toString()).toBe("Error: Bad Request")
					done();
				}
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
