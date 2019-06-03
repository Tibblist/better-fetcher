var exports = (module.exports = {});

var cacheMap = new Map();
var mockNetworkCall = new Map();

exports.match = function(key) {
	return new Promise(function(resolve, reject) {
		//console.log(cacheMap);
		if ((value = cacheMap.get(key))) {
			console.log('Cache hit');
			cacheMap.set(key, mockNetworkCall.get(key));
			resolve(value);
		} else if ((value = mockNetworkCall.get(key))) {
			//console.log('Precache hit');
			cacheMap.set(key, value);
			reject();
		} else {
			reject();
		}
	});
};
console.log("network callback")

//Mock not implemented yet, just copies normal match
exports.matchAll = function(key) {
	return new Promise(function(resolve, reject) {
		if ((value = cacheMap.get(key))) {
			resolve(value);
		} else if ((value = mockNetworkCall.get(key))) {
			cacheMap.set(key, value);
			reject();
		} else {
			reject();
		}
	});
};

exports.init = function() {
	mockNetworkCall.clear();
	cacheMap.clear();
	mockNetworkCall.set('https://jsonplaceholder.typicode.com/todos/1', {
		userId: 1,
		id: 1,
		title: 'delectus aut autem',
		completed: false,
		ok: true,
		json: function() {
			return {
				userId: 1,
				id: 1,
				title: 'delectus aut autem',
				completed: false,
				ok: true
			};
		}
	});
	cacheMap.set('https://jsonplaceholder.typicode.com/todos/1', {
		ok: true,
		json: function() {
			return {
				userId: 1,
				id: 1,
				title: 'Old lorem ipsum',
				completed: false,
				thing: true,
			};
		}
	});
};
