# cache-fetch

cache-fetch is a library designed to make it easier to use a service worker with fetch and implement a cache-first then network strategy. Essentially it provides the means to both immediately use cache available data for requests and then swap that data out on the fly once the network request returns with data the is more up to date.

# Features:

  - Implements an axios like get() function.

# Documentation:
## get(url, options, callback):
The get function is designed to be similar to axios.get() except that it doesn't return a promise and instead uses a third parameter as a callback function.
### url:
The url destination to be fetched from. This will also be used as the key to check the cache for a cached response.
### options:
**matchAll**: Set this to be true in order for the callback to be called with the results of cache.matchAll instead of cache.match.
**rawData**: Set this to be true for the raw response to be returned instead of response.json(). Useful if you are trying to get image or other data that isn't json.
### callback:
This function is called with returned data from either the cache or the network. It may be called multiple times, once when cache data is found and another when the network request comes back with up to date data. Do not rely on it being called multiple times since there may not be any available cached data to return and/or the netowrk may return data identical to what is in the cache. In either case the callback function would only be called once.

# FAQ:
**Q**: I am getting an error when doing get().then()?

**A**: This is because this implementation of fetch doesn't use a promise since it needs to be able to run the callback function multiple times if/when newer data comes in.
