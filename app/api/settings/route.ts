import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma/client';
import { apiSuccess, apiError, API_ERROR_CODES } from '@/lib/server/api-response';
import { createLogger } from '@/lib/logger';
import { auth } from '@/lib/auth';

const log = createLogger('Settings API');
const GLOBAL_SETTINGS_ID = 'global';

/**
 * GET /api/settings
 * Returns the global system settings. Accessible to all authenticated users.
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return apiError(API_ERROR_CODES.INVALID_REQUEST, 401, 'Unauthorized');
    }

    const settings = await prisma.systemSettings.findUnique({
      where: { id: GLOBAL_SETTINGS_ID },
    });
    return apiSuccess({ settings: settings?.payload || null });
  } catch (error) {
    log.error('Failed to fetch system settings:', error);
    return apiError(API_ERROR_CODES.INTERNAL_ERROR, 500, 'Failed to fetch settings');
  }
}

/**
 * POST /api/settings
 * Updates global system settings. Restricted to ADMIN users.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || (session.user as any).role !== 'ADMIN') {
      return apiError(API_ERROR_CODES.INVALID_REQUEST, 403, 'Forbidden: Admin access required');
    }

    const body = await request.json();
    const { settings } = body;

    if (!settings) {
      return apiError(API_ERROR_CODES.MISSING_REQUIRED_FIELD, 400, 'Missing settings payload');
    }

    const updated = await prisma.systemSettings.upsert({
      where: { id: GLOBAL_SETTINGS_ID },
      update: { payload: settings },
      create: { id: GLOBAL_SETTINGS_ID, payload: settings },
    });

    return apiSuccess({ success: true, updatedAt: updated.updatedAt });
  } catch (error) {
    log.error('Failed to update system settings:', error);
    return apiError(API_ERROR_CODES.INTERNAL_ERROR, 500, 'Failed to save settings');
  }
}
