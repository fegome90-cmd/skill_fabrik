type FastifyInstance = any;

type ConfirmModule = {
  seedChallenge: (challenge: any) => void;
};

type AppModule = {
  createApp: () => Promise<FastifyInstance> | FastifyInstance;
};

let appPromise: Promise<FastifyInstance> | null = null;

async function importConfirmModule(): Promise<ConfirmModule> {
  try {
    // @ts-ignore optional dependency built at runtime
    const mod = await import('../../../daemon/dist/confirm.js');
    return mod as ConfirmModule;
  } catch {
    return { seedChallenge: () => {} };
  }
}

async function ensureApp(): Promise<FastifyInstance> {
  if (!appPromise) {
    try {
      // @ts-ignore optional dependency built at runtime
      const { createApp } = (await import('../../../daemon/dist/app.js')) as AppModule;
      const app = await createApp();
      appPromise = Promise.resolve(app);
    } catch (error) {
      throw new Error('Inline execute requires packages/daemon/dist to be built before use.');
    }
  }
  return appPromise!;
}

export async function inlineExecute(payload: Record<string, unknown>) {
  const app = await ensureApp();
  return app.inject({
    method: 'POST',
    url: '/execute',
    payload,
  });
}

export async function inlineClose(): Promise<void> {
  if (!appPromise) return;
  const app = await appPromise;
  await app.close().catch(() => {});
  appPromise = null;
}

export async function seedInlineChallenge(challenge: any): Promise<void> {
  if (!challenge || typeof challenge !== 'object') return;
  const { seedChallenge } = await importConfirmModule();
  seedChallenge({
    id: String(challenge.id),
    nonce: String(challenge.nonce || challenge.challenge_nonce || ''),
    skill: String(challenge.skill || ''),
    cwd: String(challenge.cwd || '.'),
    plan: challenge.plan || challenge.write_plan || { files: [], summary: '' },
    createdAt: typeof challenge.createdAt === 'number' ? challenge.createdAt : Date.now(),
    ttlMs: typeof challenge.ttlMs === 'number' ? challenge.ttlMs : 120_000,
  });
}
