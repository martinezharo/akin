import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import net from "node:net";

async function localConvexUrl() {
	try {
		const source = await readFile(new URL("../.env.local", import.meta.url), "utf8");
		const value = source.match(/^NEXT_PUBLIC_CONVEX_URL=(.+)$/m)?.[1]?.trim();
		if (!value) return null;
		const url = new URL(value);
		return url.hostname === "127.0.0.1" || url.hostname === "localhost" ? url : null;
	} catch {
		return null;
	}
}

function canConnect(url) {
	return new Promise((resolve) => {
		const socket = net.createConnection({
			host: url.hostname,
			port: Number(url.port || 80),
		});
		const finish = (connected) => {
			socket.destroy();
			resolve(connected);
		};
		socket.setTimeout(500, () => finish(false));
		socket.once("connect", () => finish(true));
		socket.once("error", () => finish(false));
	});
}

async function isResponsive(url) {
	try {
		const response = await fetch(new URL("/instance_name", url), {
			signal: AbortSignal.timeout(1_500),
		});
		return response.ok;
	} catch {
		return false;
	}
}

function run(command, args) {
	const child = spawn(command, args, { stdio: "inherit" });
	child.once("error", (error) => {
		console.error(`Could not start ${command}:`, error.message);
		process.exitCode = 1;
	});
	child.once("exit", (code, signal) => {
		if (signal) process.kill(process.pid, signal);
		else process.exitCode = code ?? 1;
	});
}

const convexUrl = await localConvexUrl();
if (convexUrl && (await canConnect(convexUrl))) {
	if (await isResponsive(convexUrl)) {
		console.log("Convex is already running; starting Next.js only.\n");
		run("pnpm", ["exec", "next", "dev"]);
	} else {
		console.error(`
Convex owns ${convexUrl.host}, but it is not responding.

This usually means an earlier dev process was suspended with Ctrl+Z.
Run "jobs" in that terminal, bring each stopped job back with "fg %N",
and close it with Ctrl+C. Then run "pnpm dev" again.
`);
		process.exitCode = 1;
	}
} else {
	run("pnpm", ["exec", "convex", "dev", "--start", "next dev"]);
}
