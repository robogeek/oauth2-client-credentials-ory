
import { startServer } from "./app.js";

const app = await startServer({
    port: process.env.PORT
        ? Number.parseInt(process.env.PORT)
        : 9000
});
