# DalaranSiege

Full-stack starter workspace with a Spring Boot backend and Angular frontend.

## Structure

```text
D:\dalaranS
├── backend
│   ├── pom.xml
│   └── src
└── frontend
    ├── package.json
    └── src
```

## Run in VS Code

Open the folder:

```powershell
cd D:\dalaranS
code .
```

Use `Terminal > Run Task... > dev: run backend and frontend`.

## Run manually

Backend:

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

Frontend:

```powershell
cd ..\frontend
npm start
```

Open `http://localhost:4201`.

The backend runs on `http://localhost:8081`.
