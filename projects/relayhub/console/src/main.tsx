import { bootstrapDefaultConsoleBrowserDeploymentRuntime } from "./app/consoleBrowserDeploymentRuntime";
import { renderConsoleApp } from "./renderConsoleApp";
import "./styles.css";

bootstrapDefaultConsoleBrowserDeploymentRuntime();
renderConsoleApp(import.meta.env.BASE_URL);
