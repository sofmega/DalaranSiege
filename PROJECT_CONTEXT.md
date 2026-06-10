# Project Context

This file is the quick reference for future work on this repo. Update it when the project structure, ports, run commands, or major tooling choices change.

## Project

Name: DalaranSiege

Repository: https://github.com/sofmega/DalaranSiege.git

Local path: `D:\dalaranS`

## Structure

```text
D:\dalaranS
├── backend
│   ├── pom.xml
│   ├── mvnw.cmd
│   └── src
├── frontend
│   ├── package.json
│   ├── proxy.conf.json
│   └── src
└── README.md
```

## Backend

Framework: Spring Boot

Java: 21

Build tool: Maven Wrapper

Backend path: `D:\dalaranS\backend`

Main class: `com.dalaran.dalarans.DalaranSApplication`

API controller: `backend/src/main/java/com/dalaran/dalarans/ApiController.java`

Port: `8081`

Example endpoint: `GET http://localhost:8081/api/hello`

Run:

```powershell
cd D:\dalaranS\backend
.\mvnw.cmd spring-boot:run
```

Test:

```powershell
cd D:\dalaranS\backend
.\mvnw.cmd test
```

## Frontend

Framework: Angular

Angular CLI: 21.2.14

Node used during setup: 22.15.0

Frontend path: `D:\dalaranS\frontend`

Port: `4201`

The Angular dev server proxies `/api` to `http://localhost:8081` through `frontend/proxy.conf.json`.

Run:

```powershell
cd D:\dalaranS\frontend
npm start
```

Build:

```powershell
cd D:\dalaranS\frontend
npm run build
```

## IDE Notes

Open `D:\dalaranS` in IntelliJ to see both `backend` and `frontend`.

If IntelliJ does not detect the backend automatically, import `D:\dalaranS\backend\pom.xml` as a Maven project.

Spring Boot does not require a special IDE. IntelliJ IDEA is fine.

## VS Code Tasks

Root VS Code tasks are in `.vscode/tasks.json`.

Available tasks:

- `backend: run Spring Boot`
- `frontend: run Angular`
- `dev: run backend and frontend`

## Git

Main branch: `main`

Remote: `origin`

Ignored local output includes:

- `logs/`
- Maven `target/`
- Angular build output through frontend `.gitignore`
- IntelliJ `.idea/`

## Maintenance Rule

When changing ports, folder names, run commands, framework versions, or repository setup, update this file in the same commit.
