import { initializeApp, cert, getApps, App } from 'firebase-admin/app';
import { getMessaging, Messaging } from 'firebase-admin/messaging';
import fs from 'fs';
import path from 'path';

/**
 * Server-only Firebase Admin SDK initialization.
 * Singleton pattern prevents re-initialization during Next.js dev hot-reloads.
 */
function initFirebaseAdmin(): App {
  const existingApps = getApps();
  if (existingApps.length > 0) {
    return existingApps[0];
  }

  const projectId = process.env.FIREBASE_PROJECT_ID || 'lms-sma-al-furqon';
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (privateKey) {
    privateKey = privateKey.replace(/\\n/g, '\n');
  }

  // Fallback: check if service_key.json exists in root directory
  if ((!clientEmail || !privateKey) && typeof window === 'undefined') {
    try {
      const keyPath = path.join(process.cwd(), 'service_key.json');
      if (fs.existsSync(keyPath)) {
        const fileData = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
        return initializeApp({
          credential: cert(fileData),
          projectId: fileData.project_id || projectId,
        });
      }
    } catch {
      // Ignore reading error if file is unavailable
    }
  }

  if (clientEmail && privateKey) {
    return initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
      projectId,
    });
  }

  return initializeApp({
    projectId,
  });
}

export const adminApp: App = initFirebaseAdmin();
export const adminMessaging: Messaging = getMessaging(adminApp);
