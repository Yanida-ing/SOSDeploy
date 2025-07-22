FROM node:18.17.1-alpine

WORKDIR /app

# ติดตั้ง dependency ที่จำเป็นสำหรับ native module (ถ้ามี)
RUN apk add --no-cache python3 make g++ pcsc-lite-dev pixman-dev cairo-dev pango-dev jpeg-dev giflib-dev

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .

EXPOSE 8081

CMD ["node", "server.js"]
