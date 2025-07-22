const redis = require("redis");

class RedisClient {
    constructor() {
        this.client = redis.createClient({
            socket: { host: '127.0.0.1', port: 6379 }
        });
        this.connect();
    }

    async connect() {
        try {
            await this.client.connect();
            console.log("Redis connected");
        } catch (error) {
            console.error("Redis connection failed:", error);
        }
    }

    async get(key) {
        try {
            return await this.client.get(key);
        } catch (error) {
            console.error(`Error fetching key ${key} from Redis:`, error);
            return null;
        }
    }

    async setEx(key, ttl, value) {
        try {
            await this.client.setEx(key, ttl, value);
        } catch (error) {
            console.error(`Error setting key ${key} in Redis:`, error);
        }
    }

    async delete(key) {
        try {
            await this.client.del(key);
        } catch (error) {
            console.error(`Error deleting key ${key} from Redis:`, error);
        }
    }
}

// ใช้ Singleton เพื่อให้ Redis Client มีเพียงอินสแตนซ์เดียวในระบบ
module.exports = new RedisClient();
