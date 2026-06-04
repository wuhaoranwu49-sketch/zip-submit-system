FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3000
RUN mkdir -p uploads
CMD ["node", "server.js"]
