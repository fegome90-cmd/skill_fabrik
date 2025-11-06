"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeEvent = writeEvent;
const promises_1 = require("node:fs/promises");
const node_path_1 = require("node:path");
async function writeEvent(e) {
    const dir = (0, node_path_1.resolve)(process.cwd(), 'obs/kpi');
    await (0, promises_1.mkdir)(dir, { recursive: true });
    await (0, promises_1.appendFile)((0, node_path_1.join)(dir, 'events.jsonl'), JSON.stringify({ ts: new Date().toISOString(), ...e }) + '\n');
}
