FROM node:20-alpine
WORKDIR /workspace
COPY packages ./packages
COPY services/product-service ./services/product-service
WORKDIR /workspace/services/product-service
RUN npm install
EXPOSE 4002
CMD ["npm", "start"]
