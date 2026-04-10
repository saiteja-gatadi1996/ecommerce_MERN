FROM node:20-alpine
WORKDIR /workspace
COPY packages ./packages
COPY services/user-service ./services/user-service
WORKDIR /workspace/services/user-service
RUN npm install
EXPOSE 4001
CMD ["npm", "start"]
