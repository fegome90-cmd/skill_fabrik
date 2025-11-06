"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.inlineExecute = inlineExecute;
exports.inlineClose = inlineClose;
exports.seedInlineChallenge = seedInlineChallenge;
let appPromise = null;
async function importConfirmModule() {
    try {
        // @ts-ignore optional dependency built at runtime
        const mod = await Promise.resolve().then(() => __importStar(require('../../../daemon/dist/confirm.js')));
        return mod;
    }
    catch {
        return { seedChallenge: () => { } };
    }
}
async function ensureApp() {
    if (!appPromise) {
        try {
            // @ts-ignore optional dependency built at runtime
            const { createApp } = (await Promise.resolve().then(() => __importStar(require('../../../daemon/dist/app.js'))));
            const app = await createApp();
            appPromise = Promise.resolve(app);
        }
        catch (error) {
            throw new Error('Inline execute requires packages/daemon/dist to be built before use.');
        }
    }
    return appPromise;
}
async function inlineExecute(payload) {
    const app = await ensureApp();
    return app.inject({
        method: 'POST',
        url: '/execute',
        payload,
    });
}
async function inlineClose() {
    if (!appPromise)
        return;
    const app = await appPromise;
    await app.close().catch(() => { });
    appPromise = null;
}
async function seedInlineChallenge(challenge) {
    if (!challenge || typeof challenge !== 'object')
        return;
    const { seedChallenge } = await importConfirmModule();
    seedChallenge({
        id: String(challenge.id),
        nonce: String(challenge.nonce || ''),
        skill: String(challenge.skill || ''),
        cwd: String(challenge.cwd || '.'),
        plan: challenge.plan || { files: [], summary: '' },
        createdAt: typeof challenge.createdAt === 'number' ? challenge.createdAt : Date.now(),
        ttlMs: typeof challenge.ttlMs === 'number' ? challenge.ttlMs : 120000,
    });
}
