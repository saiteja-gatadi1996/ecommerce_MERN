FROM node:20-alpine
WORKDIR /workspace
COPY packages ./packages
COPY services/order-service ./services/order-service
WORKDIR /workspace/services/order-service
RUN npm install
EXPOSE 4003
CMD ["npm", "start"]
