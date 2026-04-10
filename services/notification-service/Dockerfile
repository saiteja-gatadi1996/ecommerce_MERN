FROM node:20-alpine
WORKDIR /workspace
COPY packages ./packages
COPY services/notification-service ./services/notification-service
WORKDIR /workspace/services/notification-service
RUN npm install
EXPOSE 4005
CMD ["npm", "start"]
