/**
 * HTTP cache-control middleware for read-only GET endpoints.
 * Sets Cache-Control: private, max-age=<seconds> so browsers and proxies can skip redundant requests.
 * Express's default ETag handling layers on top — conditional GETs return 304 automatically.
 *
 * Usage: router.get('/', cacheControl(300), handler)
 */
module.exports = (maxAgeSeconds) => (req, res, next) => {
  res.set('Cache-Control', `private, max-age=${maxAgeSeconds}`);
  next();
};
