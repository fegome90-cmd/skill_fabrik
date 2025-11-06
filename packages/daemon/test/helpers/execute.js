import { createApp } from '../../dist/app.js';

let appPromise = null;

async function getApp() {
  if (!appPromise) {
    appPromise = createApp();
  }
  return appPromise;
}

export async function execute(skillId, needs, options = {}) {
  const app = await getApp();
  const response = await app.inject({
    method: 'POST',
    url: '/execute',
    payload: {
      skill_id: skillId,
      args: {},
      dry_run: false,
      needs,
      ...options,
    },
  });
  const body = response.json();
  return { status: response.statusCode, body };
}

export async function closeApp() {
  if (!appPromise) return;
  const app = await appPromise;
  appPromise = null;
  await app.close();
}
