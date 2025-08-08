# =========================================================
# Stage 1: Build Environment
# Use a specific Node.js version for consistency
# =========================================================
FROM node:18-alpine AS builder

WORKDIR /app

# --- OPTIMIZATION: Copy ONLY dependency files first ---
COPY package*.json ./

# --- FIX 1: Install ALL dependencies (including devDependencies) ---
# We need devDependencies like Vite and TypeScript to build the project.
# `npm ci` is used for faster, more reliable installs from package-lock.json.
RUN npm ci

# --- OPTIMIZATION: Copy the rest of the source code LAST ---
# By copying source code after installing dependencies, we ensure that
# changes to our code don't force a slow `npm ci` reinstall.
COPY . .

# --- Build the application ---
# This runs the "build" script from your package.json, which is likely "vite build".
RUN npm run build


# =========================================================
# Stage 2: Production Environment
# Use a lightweight Nginx server to serve the static files.
# =========================================================
FROM nginx:1.25-alpine

# --- FIX 2: Copy from the correct Vite output directory (`dist`) ---
# Vite builds to the `/app/dist` folder, not `/app/build`.
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy the custom Nginx configuration. This is needed for Single-Page Apps.
# This config ensures that refreshing the browser on a route like /about works.
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose the port Nginx listens on
EXPOSE 80

# Start Nginx in the foreground
CMD ["nginx", "-g", "daemon off;"]