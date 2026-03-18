# Voleena Codebase Analysis + Minimal Learning Project

## 1) Codebase Scan: Structure, Technologies, Architecture

## 1.1 Project Structure (Monorepo Style)

This repository is organized as a full-stack monorepo with separate frontend and backend applications:

- `client/`: React + Vite frontend.
- `server/`: Node.js + Express backend.
- `database/`: SQL schema and migration scripts.
- `docs/` and root `*.md` files: implementation notes, audits, and runbooks.
- `postman/`: API collections and test assets.
- `docker-compose.yml`: local containerized stack (MySQL + backend + frontend).

What this means:

- The frontend and backend are independently deployable.
- They communicate through HTTP APIs (`/api/v1/...`).
- The backend owns business logic + persistence.
- The frontend owns UI, navigation, and client-side auth/session handling.

## 1.2 Core Technologies Used

### Frontend

- React 18
- React Router
- Vite
- Axios/fetch
- Tailwind CSS
- React Toastify
- Stripe client SDK and Google Maps client integration

### Backend

- Node.js (CommonJS modules)
- Express
- Sequelize ORM + MySQL (`mysql2`)
- JWT authentication
- Security middleware: `helmet`, `cors`, `express-rate-limit`, input sanitization, audit logging
- Utility integrations: Stripe, Cloudinary, email (Resend/Nodemailer), Twilio

### Testing + Tooling

- Jest + Supertest for backend integration/route tests
- ESLint
- Docker and Docker Compose

## 1.3 Architecture Patterns Observed

### Pattern A: Layered Backend

Typical flow:

1. Route layer (`server/routes/*`) defines endpoints and middleware chain.
2. Controller layer (`server/controllers/*`) handles request/response + orchestration.
3. Service layer (`server/services/*`) handles business rules and transactional logic.
4. Model layer (`server/models/*`) defines data schema and relations via Sequelize.

Why this pattern is strong:

- Easier testing.
- Easier change isolation.
- Reusable business logic.

### Pattern B: Centralized App Bootstrap

`server/index.js` builds middleware stack, mounts routes, defines error handlers, and exports app creation/start functions.

Why this matters:

- Production startup and test startup can use the same app factory.
- Avoids bootstrapping side effects during tests.

### Pattern C: API Versioning + Backward Compatibility

- Primary APIs live under `/api/v1/*`.
- Legacy aliases are maintained with deprecation middleware.

Why this matters:

- Stable clients while evolving APIs.

### Pattern D: Role-Based Access Control (RBAC)

- Auth middleware decodes JWT and attaches user context.
- Role middleware gates route access by role (`Admin`, `Customer`, etc.).
- Frontend also protects route visibility using role checks.

Why this matters:

- Defense in depth (both UI and API checks).

### Pattern E: Frontend State + Service Abstraction

- `AuthContext` manages login/logout/session state.
- API wrapper module handles base URL + auth header + 401 behavior.

Why this matters:

- Reusable network layer.
- Cleaner page components.

## 1.4 Practical Request Flow in This Project

Example flow (protected action):

1. Frontend page calls service function.
2. API wrapper injects JWT token.
3. Express route executes auth + validation middleware.
4. Controller validates intent and delegates business logic.
5. Service/model performs DB operations.
6. Response returns JSON to frontend.
7. UI updates local state/context.

---

## 2) Minimal Learning Project (Same Core Patterns, Minimal Features)

Goal: build a tiny "Task Board" app that keeps the **same architecture style** as Voleena but with minimal scope.

### Learning features

- Register/Login with JWT
- Protected task endpoints (`/api/v1/tasks`)
- Role-aware backend middleware (`User` + `Admin`)
- Frontend protected routes with `AuthContext`
- Sequelize models with relationships

### Why this sample is useful

It preserves the important engineering shape of the original system:

- Monorepo (`client/` + `server/`)
- Versioned API routes
- Middleware-driven security pipeline
- Route -> Controller -> Service -> Model flow
- React Context + Router + API wrapper on frontend

---

## 3) Step-by-Step Build Guide (What, Why, How)

## Step 1: Create the project folders

What:

Create a new folder with frontend and backend apps.

Why:

This mirrors the real repository shape and keeps concerns separate.

How:

```powershell
mkdir mini-voleena-learning
cd mini-voleena-learning
mkdir server
mkdir client
```

## Step 2: Initialize backend and install dependencies

What:

Initialize npm in `server/` and install minimal libraries.

Why:

- `express`: API server
- `sequelize` + `sqlite3`: ORM + simple local DB for learning
- `jsonwebtoken` + `bcryptjs`: auth
- `cors`, `helmet`, `morgan`: security + logging
- `dotenv`: environment config

How:

```powershell
cd server
npm init -y
npm install express sequelize sqlite3 jsonwebtoken bcryptjs cors helmet morgan dotenv
npm install -D nodemon
```

Then edit `server/package.json` scripts:

```json
{
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js"
  }
}
```

## Step 3: Backend file structure

What:

Create a minimal layered backend.

How:

```text
server/
  src/
    index.js
    app.js
    config/
      database.js
    models/
      index.js
    middleware/
      auth.js
    controllers/
      authController.js
      taskController.js
    services/
      taskService.js
    routes/
      authRoutes.js
      taskRoutes.js
```

## Step 4: Add backend code

### File: `server/src/config/database.js`

```js
const { Sequelize } = require("sequelize");

const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: process.env.DB_FILE || "./dev.sqlite",
  logging: false,
});

module.exports = sequelize;
```

Line-by-line explanation:

1. Imports `Sequelize` constructor.
2. Creates one shared DB connection instance.
3. Chooses SQLite dialect for zero-setup local learning.
4. Sets DB file path from env var (or default file).
5. Disables SQL logging to keep terminal clean.
6. Closes config object.
7. Exports the connection for app-wide reuse.

### File: `server/src/models/index.js`

```js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const User = sequelize.define("User", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  passwordHash: { type: DataTypes.STRING, allowNull: false },
  role: {
    type: DataTypes.ENUM("User", "Admin"),
    allowNull: false,
    defaultValue: "User",
  },
});

const Task = sequelize.define("Task", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  title: { type: DataTypes.STRING, allowNull: false },
  done: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
});

User.hasMany(Task, { foreignKey: "userId", as: "tasks" });
Task.belongsTo(User, { foreignKey: "userId", as: "user" });

module.exports = { sequelize, User, Task };
```

Line-by-line explanation:

1. Imports Sequelize data types.
2. Imports shared database instance.
3. Blank line for readability.
4. Defines `User` model.
5. Defines numeric primary key.
6. Stores user display name.
7. Stores unique login email.
8. Stores hashed password only.
9. Stores role for authorization checks.
10. Ends `User` model definition.
11. Blank line.
12. Defines `Task` model.
13. Task primary key.
14. Task title text.
15. Completion status boolean.
16. Ends `Task` model definition.
17. Blank line.
18. One-to-many relation: one user has many tasks.
19. Reverse relation: each task belongs to one user.
20. Blank line.
21. Exports models and sequelize for other layers.

### File: `server/src/middleware/auth.js`

```js
const jwt = require("jsonwebtoken");

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token)
    return res.status(401).json({ success: false, error: "Missing token" });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    return next();
  } catch {
    return res.status(401).json({ success: false, error: "Invalid token" });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user)
      return res.status(401).json({ success: false, error: "Unauthorized" });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: "Forbidden" });
    }
    return next();
  };
}

module.exports = { requireAuth, requireRole };
```

Line-by-line explanation:

1. Imports JWT library.
2. Blank line.
3. Declares auth middleware.
4. Reads authorization header safely.
5. Extracts token from `Bearer <token>` format.
6. Blank line.
7. Rejects request if no token provided.
8. Blank line.
9. Starts try block for token verification.
10. Decodes token and stores user payload in request context.
11. Continues to next middleware/controller.
12. Handles invalid/expired token.
13. Returns unauthorized on token errors.
14. Ends try/catch.
15. Ends middleware function.
16. Blank line.
17. Declares role middleware factory.
18. Returns actual middleware function.
19. Fails if auth middleware did not run.
20. Rejects if user role is not allowed.
21. Sends forbidden response.
22. Closes role check block.
23. Allows request if role is valid.
24. Ends returned middleware.
25. Ends factory.
26. Blank line.
27. Exports middleware helpers.

### File: `server/src/controllers/authController.js`

```js
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { User } = require("../models");

function buildToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    {
      expiresIn: "30m",
    },
  );
}

exports.register = async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ success: false, error: "Missing fields" });

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    email: email.toLowerCase(),
    passwordHash,
    role: "User",
  });
  return res
    .status(201)
    .json({ success: true, data: { id: user.id, email: user.email } });
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({
    where: { email: String(email).toLowerCase() },
  });
  if (!user)
    return res
      .status(401)
      .json({ success: false, error: "Invalid credentials" });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok)
    return res
      .status(401)
      .json({ success: false, error: "Invalid credentials" });

  const token = buildToken(user);
  return res.json({
    success: true,
    token,
    user: { id: user.id, name: user.name, role: user.role },
  });
};
```

Line-by-line explanation:

1. Imports password hashing library.
2. Imports JWT library.
3. Imports `User` model.
4. Blank line.
5. Declares token helper.
6. Signs token with user identity and role.
7. Sets token expiry to 30 minutes.
8. Closes token options.
9. Ends helper function.
10. Blank line.
11. Declares register controller.
12. Reads required fields from request body.
13. Validates required input quickly.
14. Blank line.
15. Hashes password before saving.
16. Creates user record with normalized lowercase email.
17. Returns created response without exposing password hash.
18. Ends register controller.
19. Blank line.
20. Declares login controller.
21. Reads login payload.
22. Finds user by normalized email.
23. Rejects when email not found.
24. Blank line.
25. Verifies plaintext password against hash.
26. Rejects when password mismatch.
27. Blank line.
28. Builds JWT for authenticated user.
29. Returns token and safe user fields.
30. Ends login controller.

### File: `server/src/services/taskService.js`

```js
const { Task } = require("../models");

exports.listForUser = (userId) =>
  Task.findAll({ where: { userId }, order: [["id", "DESC"]] });
exports.createForUser = (userId, title) => Task.create({ userId, title });
exports.toggleDone = async (id, userId) => {
  const task = await Task.findOne({ where: { id, userId } });
  if (!task) return null;
  task.done = !task.done;
  await task.save();
  return task;
};
```

Line-by-line explanation:

1. Imports task model only (service layer should stay focused).
2. Blank line.
3. Exports function to list user tasks newest first.
4. Exports function to create one task for one user.
5. Exports function to toggle completion state.
6. Reads task scoped to current user ownership.
7. Returns `null` when task does not exist or is not owned.
8. Flips boolean value.
9. Persists change.
10. Returns updated task to controller.
11. Ends function.

### File: `server/src/controllers/taskController.js`

```js
const taskService = require("../services/taskService");

exports.list = async (req, res) => {
  const tasks = await taskService.listForUser(req.user.id);
  return res.json({ success: true, data: tasks });
};

exports.create = async (req, res) => {
  const { title } = req.body;
  if (!title)
    return res.status(400).json({ success: false, error: "Title required" });
  const task = await taskService.createForUser(req.user.id, title);
  return res.status(201).json({ success: true, data: task });
};

exports.toggle = async (req, res) => {
  const task = await taskService.toggleDone(Number(req.params.id), req.user.id);
  if (!task)
    return res.status(404).json({ success: false, error: "Task not found" });
  return res.json({ success: true, data: task });
};
```

Line-by-line explanation:

1. Imports service layer.
2. Blank line.
3. Declares list controller.
4. Calls service using authenticated user id.
5. Returns standardized success payload.
6. Ends list.
7. Blank line.
8. Declares create controller.
9. Reads title from request body.
10. Validates title presence.
11. Creates task for current user.
12. Returns created response.
13. Ends create.
14. Blank line.
15. Declares toggle controller.
16. Converts route param to number and toggles task.
17. Returns not found when ownership/id mismatch.
18. Returns updated task.
19. Ends toggle.

### File: `server/src/routes/authRoutes.js`

```js
const router = require("express").Router();
const authController = require("../controllers/authController");

router.post("/register", authController.register);
router.post("/login", authController.login);

module.exports = router;
```

Line-by-line explanation:

1. Creates Express router.
2. Imports auth controllers.
3. Blank line.
4. Maps register endpoint.
5. Maps login endpoint.
6. Blank line.
7. Exports router.

### File: `server/src/routes/taskRoutes.js`

```js
const router = require("express").Router();
const taskController = require("../controllers/taskController");
const { requireAuth } = require("../middleware/auth");

router.use(requireAuth);
router.get("/", taskController.list);
router.post("/", taskController.create);
router.patch("/:id/toggle", taskController.toggle);

module.exports = router;
```

Line-by-line explanation:

1. Creates Express router.
2. Imports task controllers.
3. Imports auth middleware.
4. Blank line.
5. Applies auth middleware to all task routes.
6. GET route for list.
7. POST route for create.
8. PATCH route for status toggle.
9. Blank line.
10. Exports router.

### File: `server/src/app.js`

```js
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const authRoutes = require("./routes/authRoutes");
const taskRoutes = require("./routes/taskRoutes");

function createApp() {
  const app = express();
  app.use(helmet());
  app.use(
    cors({ origin: process.env.FRONTEND_URL || "http://localhost:5173" }),
  );
  app.use(express.json());
  app.use(morgan("dev"));

  app.get("/health", (_req, res) => res.json({ status: "ok" }));
  app.use("/api/v1/auth", authRoutes);
  app.use("/api/v1/tasks", taskRoutes);

  app.use((req, res) =>
    res.status(404).json({ success: false, error: "Route not found" }),
  );
  app.use((err, _req, res, _next) =>
    res.status(500).json({ success: false, error: err.message }),
  );

  return app;
}

module.exports = { createApp };
```

Line-by-line explanation:

1. Imports Express.
2. Imports CORS middleware.
3. Imports Helmet security headers.
4. Imports request logger.
5. Blank line.
6. Imports auth router.
7. Imports task router.
8. Blank line.
9. Declares app factory function.
10. Creates Express app instance.
11. Enables baseline security headers.
12. Enables CORS for frontend origin.
13. Enables JSON body parsing.
14. Enables dev request logs.
15. Blank line.
16. Adds health endpoint.
17. Mounts versioned auth routes.
18. Mounts versioned task routes.
19. Blank line.
20. Adds catch-all 404 handler.
21. Adds global error handler.
22. Blank line.
23. Returns configured app instance.
24. Ends function.
25. Blank line.
26. Exports app factory.

### File: `server/src/index.js`

```js
require("dotenv").config();
const { createApp } = require("./app");
const { sequelize } = require("./models");

const PORT = process.env.PORT || 3001;

async function startServer() {
  await sequelize.authenticate();
  await sequelize.sync();
  const app = createApp();
  app.listen(PORT, () => console.log(`API running on ${PORT}`));
}

if (require.main === module) {
  startServer().catch((err) => {
    console.error("Startup failed", err);
    process.exit(1);
  });
}

module.exports = { startServer, createApp };
```

Line-by-line explanation:

1. Loads environment variables.
2. Imports app factory.
3. Imports sequelize connection.
4. Blank line.
5. Sets port with fallback.
6. Blank line.
7. Declares async bootstrap function.
8. Verifies DB connection works.
9. Syncs schema for local learning.
10. Builds app from factory.
11. Starts HTTP server and logs port.
12. Ends bootstrap.
13. Blank line.
14. Runs server only when this file is executed directly.
15. Calls bootstrap and handles startup errors.
16. Logs startup error.
17. Exits process with failure code.
18. Ends catch callback.
19. Ends main-module block.
20. Blank line.
21. Exports bootstrap + app factory (test-friendly).

## Step 5: Backend environment file

Create `server/.env`:

```env
PORT=3001
FRONTEND_URL=http://localhost:5173
JWT_SECRET=replace_with_a_long_secret_32_chars_minimum
DB_FILE=./dev.sqlite
```

What/Why/How:

1. `PORT`: where API listens.
2. `FRONTEND_URL`: CORS allowlist origin.
3. `JWT_SECRET`: used to sign/verify tokens.
4. `DB_FILE`: local SQLite database file.

## Step 6: Initialize frontend and install dependencies

What:

Create React + Vite app and install required packages.

How:

```powershell
cd ..\client
npm create vite@latest . -- --template react
npm install
npm install axios react-router-dom
```

Why:

- Vite gives fast dev setup.
- Router handles page-level navigation.
- Axios wraps HTTP calls and interceptors cleanly.

## Step 7: Frontend file structure

```text
client/
  src/
    main.jsx
    App.jsx
    services/
      backendApi.js
    contexts/
      AuthContext.jsx
    components/
      ProtectedRoute.jsx
    pages/
      Login.jsx
      Tasks.jsx
```

## Step 8: Add frontend code

### File: `client/src/services/backendApi.js`

```js
import axios from "axios";

const backendApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3001",
  timeout: 10000,
});

backendApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default backendApi;
```

Line-by-line explanation:

1. Imports Axios.
2. Blank line.
3. Creates reusable HTTP client.
4. Sets API base URL from env with fallback.
5. Sets request timeout.
6. Ends config object.
7. Blank line.
8. Adds request interceptor.
9. Reads token from browser storage.
10. Adds Bearer header when token exists.
11. Returns request config.
12. Ends interceptor.
13. Blank line.
14. Exports configured client.

### File: `client/src/contexts/AuthContext.jsx`

```jsx
import { createContext, useContext, useState } from "react";
import backendApi from "../services/backendApi";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() =>
    JSON.parse(localStorage.getItem("user") || "null"),
  );

  const login = async (email, password) => {
    const { data } = await backendApi.post("/api/v1/auth/login", {
      email,
      password,
    });
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
```

Line-by-line explanation:

1. Imports React hooks/context helpers.
2. Imports API client.
3. Blank line.
4. Creates auth context object.
5. Blank line.
6. Declares provider component.
7. Hydrates user state from localStorage on first render.
8. Blank line.
9. Declares login function.
10. Calls backend login endpoint.
11. Persists token in localStorage.
12. Persists user profile in localStorage.
13. Updates React state.
14. Ends login.
15. Blank line.
16. Declares logout function.
17. Clears token from storage.
18. Clears user from storage.
19. Updates React state to signed-out.
20. Ends logout.
21. Blank line.
22. Provides auth state/actions to the app tree.
23. Ends provider function.
24. Blank line.
25. Declares custom hook for consuming auth context.
26. Reads context value.
27. Throws explicit error if hook used outside provider.
28. Returns context value.
29. Ends hook.

### File: `client/src/components/ProtectedRoute.jsx`

```jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}
```

Line-by-line explanation:

1. Imports redirect component.
2. Imports auth context hook.
3. Blank line.
4. Declares reusable protected-route wrapper.
5. Reads auth status.
6. Redirects to login if unauthenticated.
7. Renders protected child component otherwise.
8. Ends component.

### File: `client/src/pages/Login.jsx`

```jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate("/tasks");
    } catch {
      setError("Login failed");
    }
  };

  return (
    <form
      onSubmit={onSubmit}
      style={{ maxWidth: 320, margin: "4rem auto", display: "grid", gap: 8 }}
    >
      <h2>Login</h2>
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      <input
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        type="password"
      />
      {error && <p style={{ color: "crimson" }}>{error}</p>}
      <button type="submit">Sign In</button>
    </form>
  );
}
```

Line-by-line explanation:

1. Imports state hook.
2. Imports navigation hook.
3. Imports auth hook.
4. Blank line.
5. Declares login page component.
6. Email input state.
7. Password input state.
8. Error message state.
9. Gets login action from context.
10. Gets navigation helper.
11. Blank line.
12. Declares submit handler.
13. Prevents default page reload submit behavior.
14. Starts try block.
15. Calls login with form values.
16. Navigates to protected tasks page on success.
17. Handles auth/network failure.
18. Sets human-readable error message.
19. Ends try/catch.
20. Ends submit handler.
21. Blank line.
22. Starts JSX return.
23. Renders form and wires submit handler.
24. Renders title.
25. Renders email input and state binding.
26. Renders password input and state binding.
27. Conditionally renders error text.
28. Renders submit button.
29. Closes form.
30. Ends return.
31. Ends component.

### File: `client/src/pages/Tasks.jsx`

```jsx
import { useEffect, useState } from "react";
import backendApi from "../services/backendApi";
import { useAuth } from "../contexts/AuthContext";

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const { logout } = useAuth();

  const load = async () => {
    const { data } = await backendApi.get("/api/v1/tasks");
    setTasks(data.data);
  };

  useEffect(() => {
    load();
  }, []);

  const createTask = async () => {
    if (!title.trim()) return;
    await backendApi.post("/api/v1/tasks", { title });
    setTitle("");
    load();
  };

  return (
    <main style={{ maxWidth: 500, margin: "2rem auto" }}>
      <h2>My Tasks</h2>
      <button onClick={logout}>Logout</button>
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="New task"
        />
        <button onClick={createTask}>Add</button>
      </div>
      <ul>
        {tasks.map((t) => (
          <li key={t.id}>
            {t.title} {t.done ? "✅" : "⬜"}
          </li>
        ))}
      </ul>
    </main>
  );
}
```

Line-by-line explanation:

1. Imports effect/state hooks.
2. Imports API client.
3. Imports auth hook.
4. Blank line.
5. Declares tasks page component.
6. State for loaded tasks.
7. State for new task input.
8. Reads logout action.
9. Blank line.
10. Declares reusable loader function.
11. Fetches tasks from protected API.
12. Stores task list in state.
13. Ends loader.
14. Blank line.
15. Runs once on initial page load.
16. Calls load function.
17. Ends effect.
18. Blank line.
19. Declares create function.
20. Prevents blank task creation.
21. Calls create endpoint.
22. Clears input.
23. Reloads list.
24. Ends create.
25. Blank line.
26. Starts JSX return.
27. Main layout container.
28. Page heading.
29. Logout button.
30. Input/button row.
31. Controlled input binding.
32. Add button.
33. Starts list.
34. Maps tasks to list items.
35. Renders one row with title + status icon.
36. Ends map callback.
37. Ends list.
38. Ends main.
39. Ends return.
40. Ends component.

### File: `client/src/App.jsx`

```jsx
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Tasks from "./pages/Tasks";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/tasks"
            element={
              <ProtectedRoute>
                <Tasks />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/tasks" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
```

Line-by-line explanation:

1. Imports router primitives.
2. Imports auth provider.
3. Imports route guard component.
4. Imports login page.
5. Imports tasks page.
6. Blank line.
7. Declares root app component.
8. Starts return block.
9. Enables browser routing.
10. Wraps app with auth context.
11. Declares route container.
12. Public login route.
13. Protected tasks route.
14. Fallback route redirect.
15. Closes route container.
16. Closes provider.
17. Closes router.
18. Ends return.
19. Ends component.

### File: `client/src/main.jsx`

```jsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

Line-by-line explanation:

1. Imports React.
2. Imports React DOM root API.
3. Imports root application component.
4. Blank line.
5. Creates React root at HTML element `root`.
6. Enables StrictMode checks in development.
7. Renders `App` component.
8. Closes StrictMode wrapper.
9. Ends render call.

## Step 9: Frontend environment file

Create `client/.env`:

```env
VITE_API_URL=http://localhost:3001
```

Why:

- Keeps frontend API endpoint configurable per environment.

## Step 10: Run both apps

Backend terminal:

```powershell
cd server
npm run dev
```

Frontend terminal:

```powershell
cd client
npm run dev
```

Then open the frontend URL printed by Vite (usually `http://localhost:5173`).

## Step 11: Test the flow

1. Register a new user (you can add a quick register form or use Postman for `/api/v1/auth/register`).
2. Login using `/login` page.
3. Create tasks.
4. Refresh page and confirm session is still active.

What this proves:

- JWT issuance and usage.
- Protected routes in frontend and backend.
- DB persistence through Sequelize.

---

## 4) Mapping: Original Voleena vs Minimal Sample

- Voleena `server/index.js` app bootstrap -> sample `server/src/app.js` + `server/src/index.js`
- Voleena versioned routes (`/api/v1`) -> same in sample
- Voleena auth middleware + role checks -> same pattern in sample
- Voleena model association strategy -> same pattern (`User` has many `Task`)
- Voleena frontend `AuthContext` and protected routing -> same approach in sample
- Voleena frontend API wrapper with token injection -> same in sample

---

## 5) Next Learning Extensions (After Base Works)

1. Add refresh token endpoint and token rotation.
2. Add request validation middleware with `express-validator`.
3. Add centralized error classes and typed error responses.
4. Add tests with Jest + Supertest using app factory exports.
5. Replace SQLite with MySQL to fully match production style.

This sequence mirrors how a small educational project can grow toward your real production architecture.
