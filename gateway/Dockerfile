FROM node:20-alpine
WORKDIR /app
COPY gateway/package*.json ./
RUN npm install
COPY gateway .
EXPOSE 8080
CMD ["npm", "start"]
