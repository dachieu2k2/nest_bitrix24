export default () => ({
  redis: {
    port: parseInt(process.env.PORT + '', 10) || 3000,
    REDIS_HOST: '172.0.0.1',
    PORT: 6379,
    auth_pass: '1111',
    CACHE_TTL: 4 * 60 * 60,
  },
  rabbitMQ: {
    port: process.env.RABBIT_MQ_URL,
  },
});
