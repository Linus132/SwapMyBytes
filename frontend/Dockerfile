# Build Stage
FROM node:22 AS smb-build

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

# Copy source files
COPY src ./src
# Copy public directory
COPY public ./public
# Copy index.html
COPY index.html .
# Copy vite config
COPY vite.config.js .
# Copy tsconfig
COPY tsconfig.json .

ENV VITE_BACKEND_LOCATION="127.0.0.1:5090"

RUN npm run build

RUN ls

# Production Stage
FROM nginx:alpine

# Copy custom nginx.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=smb-build /usr/src/app/build /usr/share/nginx/html

RUN ls /usr/share/nginx/html

EXPOSE ${PORT}

CMD ["nginx", "-g", "daemon off;"]
