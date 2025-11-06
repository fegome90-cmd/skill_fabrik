"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.endpoint = void 0;
exports.post = post;
const node_fetch_1 = __importDefault(require("node-fetch"));
const endpoint = () => process.env.SF_ENDPOINT || 'http://127.0.0.1:7727';
exports.endpoint = endpoint;
async function post(path, body) {
    const res = await (0, node_fetch_1.default)(`${(0, exports.endpoint)()}${path}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
    });
    const text = await res.text();
    let json;
    try {
        json = JSON.parse(text);
    }
    catch {
        json = { raw: text };
    }
    return { ok: res.ok, status: res.status, json };
}
