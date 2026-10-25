import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const pythonExe = path.join(root, "services", "api", ".venv", "Scripts", "python.exe");

const children = [];

function run(name, command, args, cwd, useShell = false) {
  const child = spawn(command, args, { cwd, stdio: "inherit", shell: useShell });
  children.push(child);
  child.on("exit", (code) => {
    console.log(`[${name}] exited with code ${code}`);
    children.forEach((c) => c !== child && !c.killed && c.kill());
  });
  return child;
}

run("api", pythonExe, ["-m", "uvicorn", "app.main:app", "--port", "8001", "--app-dir", "services/api"], root);
run("web", "npm run dev -w @cadre-plus/web", [], root, true);

process.on("SIGINT", () => {
  children.forEach((c) => c.kill());
  process.exit(0);
});
