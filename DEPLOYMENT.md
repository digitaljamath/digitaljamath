# Deployment Guide (Linode / Production)

This guide explains how to deploy DigitalJamath to a generic Linux server (like Linode, DigitalOcean, or AWS EC2) and configure your custom domain.

## 1. Initial Server Setup
*Assumes you have a fresh Ubuntu 22.04 LTS server.*

1.  **SSH into your server:**
    ```bash
    ssh root@<your-server-ip>
    ```

2.  **Install Git and Docker:**
    ```bash
    sudo apt update
    sudo apt install -y git docker.io docker-compose
    ```

## 2. Clone & Setup Project
1.  **Clone the repository:**
    ```bash
    git clone https://github.com/azzaxp/digitaljamath.git
    cd digitaljamath
    ```

2.  **Run the Installer:**
    ```bash
    ./setup.sh
    ```
    *   Select **Option 2 (Production)**.
    *   The script will verify Docker is present and create a `.env` file for you if missing.

## 3. Configuration (The Critical Part)
**Before** the installation completes (or immediately after), you must edit the `.env` file to set your domain.

1.  **Edit `.env`:**
    ```bash
    nano .env
    ```

2.  **Update these specific variables:**
    *   `DOMAIN_NAME`: Set this to your actual domain (e.g., `digitaljamath.com`).
    *   `ALLOWED_HOSTS`: Set this to your domain (e.g., `digitaljamath.com`).
    *   `BREVO_SMTP_KEY`: Add your email keys here.

    *Example .env:*
    ```env
    DOMAIN_NAME=digitaljamath.com
    ALLOWED_HOSTS=digitaljamath.com,www.digitaljamath.com
    DEBUG=False
    ...
    ```

3.  **Apply Domain Changes:**
    If you edited the `.env` *after* running the setup script, you need to re-run the tenant creation or update it manually. The easiest way is to restart the containers:
    ```bash
    docker-compose down
    docker-compose up -d --build
    ```

## 4. DNS Configuration (Cloudflare/Linode)
Go to your DNS provider (e.g., Cloudflare) and add an **A Record**:
*   **Name**: `@` (Root)
*   **Content**: `<Your Linode IP Address>`

*   **Name**: `*` (Wildcard - *Crucial for Multi-Tenancy*)
*   **Content**: `<Your Linode IP Address>`
    *(This allows subdomains like `jamablr.digitaljamath.com` to reach your server.)*

## 5. Verify
Visit `http://digitaljamath.com`. You should see the landing page.
