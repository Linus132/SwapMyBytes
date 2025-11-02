# Stage 1 - Build the app
FROM node:22 AS smb-build

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./
RUN npm install

# Copy tsconfig for compilation
COPY tsconfig.json ./
# Copy source files
COPY src ./src
# Compile TypeScript code to JavaScript
RUN npm run build

RUN ls

# Stage 2: Serve the app
FROM node:22 AS smb-serve

# Install dependencies for thumbnail creation (ffmpeg for audio, video and images, imagemagick and ghostscript for PDFs)
RUN apt-get update && apt-get install -y ffmpeg imagemagick ghostscript

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy only necessary files from the builder stage
COPY --from=smb-build /usr/src/app/package*.json ./
COPY --from=smb-build /usr/src/app/node_modules ./node_modules
COPY --from=smb-build /usr/src/app/dist ./dist
COPY --from=smb-build /usr/src/app/src/default-thumbnail.png ./dist

# Expose the port the app runs on
EXPOSE ${PORT}

# Define the command to run the app
CMD ["node", "dist/server.js"]
