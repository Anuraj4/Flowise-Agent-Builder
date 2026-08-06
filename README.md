<<<<<<< HEAD
# Flowise-Agent-Builder
=======
# 🚀 Flowise AI Agent Builder & Local Workspace

An enterprise-ready, containerized local environment for **[Flowise AI](https://flowiseai.com/)** — an open-source visual platform for building AI agents, LLM orchestration workflows, custom tools, and multi-user chatflows.

---

## 🌟 Key Features

- 🐳 **Full Docker Integration**: One-command containerized deployment powered by Docker Compose.
- ⚡ **One-Click PowerShell Launcher**: Executable `run.ps1` script for instant startup, health checks, and auto-opening the browser interface.
- 🔐 **User Login & Session Isolation**: Multi-user login system with SQLite data persistence (`flowise_data`).
- 🛠️ **Custom Tools Support**: Built-in support and code examples for creating custom JavaScript tools (e.g. Weather fetcher).
- 🐍 **REST API Examples**: Ready-to-use Python client for querying Flowise Chatflow endpoints programmatically.

---

## 📁 Workspace Directory Structure

```text
flowise-workspace/
├── api-examples/
│   └── query_flowise.py       # Python script template for querying Flowise Chatflow REST API
├── custom-tools/
│   └── weatherTool.js         # Custom JavaScript tool node example for Flowise Canvas
├── .env                       # Environment configuration (Port, Auth Credentials, Keys)
├── .gitignore                 # Excludes heavy node_modules & runtime database files
├── Dockerfile                 # Custom Docker image build definition
├── docker-compose.yml         # Container service orchestration configuration
├── package.json               # Local Node package manifest
├── README.md                  # Project documentation
└── run.ps1                    # One-Click PowerShell launch & browser auto-opener
```

---

## 🚀 Quick Start Guide

### 1. One-Click Launch (Windows PowerShell)

Simply right-click [`run.ps1`](run.ps1) and choose **Run with PowerShell**, or run in terminal:

```powershell
.\run.ps1
```

`run.ps1` will automatically:
1. Confirm Docker Desktop is running.
2. Launch the Flowise container in background (`docker compose up -d`).
3. Poll `http://localhost:3000` until Flowise is fully initialized.
4. Open Flowise UI automatically in your web browser!

---

### 2. Standard Docker Compose Launch

If using standard Docker CLI:

```bash
# Start container
docker compose up -d

# Stop container
docker compose down

# Stream container logs
docker logs -f flowise-workspace
```

---

## 🔑 User Registration & Authentication Gateway

Flowise is configured with a dedicated **Authentication Proxy Gateway**:

- **Default URL**: [http://localhost:3000](http://localhost:3000)
- **First Landing Page**: **Registration Page** (`http://localhost:3000/register`)
- **Login Toggle**: A prominent "Login Here" button allows existing users to log in at `http://localhost:3000/login`.
- **Registration Toggle**: The Login page features a "Register Here" button to easily switch back.
- **Persistence**: User account data is securely stored in a persistent SQLite database (`gateway_data`).
- **Session Management**: Authenticated users are automatically redirected to the interactive Flowise AI canvas.


---

## 🛠️ Custom Tools Integration

You can extend your AI agents with custom JavaScript code. See [`custom-tools/weatherTool.js`](custom-tools/weatherTool.js) for an example.

To use custom tools in Flowise:
1. Open Flowise UI at `http://localhost:3000`.
2. Go to **Tools** -> **Add New Tool**.
3. Copy and paste your custom JavaScript function.
4. Connect the Tool node to your Agent Canvas workflow.

---

## 🐍 REST API Endpoint Querying

Once you construct and save a Chatflow in Flowise:
1. Click the **`</> API Endpoint`** button inside Flowise.
2. Copy your unique `Chatflow ID`.
3. Open [`api-examples/query_flowise.py`](api-examples/query_flowise.py) and update `FLOWISE_URL`:

```python
FLOWISE_URL = "http://localhost:3000/api/v1/prediction/<YOUR_CHATFLOW_ID>"
```

4. Execute the Python script:
```bash
python api-examples/query_flowise.py
```

---

## 📜 License & Acknowledgments

- Powered by [FlowiseAI](https://github.com/FlowiseAI/Flowise).
- Built with Docker, Node.js, and Python.
>>>>>>> 24b096b (feat: complete Flowise agent builder docker setup, auth, custom tools, and run script)
