import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma/client';
import { apiSuccess, apiError, API_ERROR_CODES } from '@/lib/server/api-response';
import { createLogger } from '@/lib/logger';
import { auth } from '@/lib/auth';

const log = createLogger('AdminClassroomsAPI');

/**
 * GET /api/admin/classrooms
 * Lists all classrooms across the entire system. Restricted to ADMIN.
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session || (session.user as any).role !== 'ADMIN') {
      return apiError(API_ERROR_CODES.INVALID_REQUEST, 403, 'Forbidden: Admin access required');
    }

    const classrooms = await prisma.classroom.findMany({
      select: {
        id: true,
        name: true,
        userId: true,
        isShared: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return apiSuccess({ classrooms });
  } catch (error) {
    log.error('Failed to list all classrooms for admin:', error);
    return apiError(API_ERROR_CODES.INTERNAL_ERROR, 500, 'Failed to list classrooms');
  }
}

/**
 * PATCH /api/admin/classrooms
 * Updates a classroom's metadata (e.g., shared status). Restricted to ADMIN.
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || (session.user as any).role !== 'ADMIN') {
      return apiError(API_ERROR_CODES.INVALID_REQUEST, 403, 'Forbidden: Admin access required');
    }

    const body = await request.json();
    const { id, isShared } = body;

    if (!id) {
      return apiError(API_ERROR_CODES.MISSING_REQUIRED_FIELD, 400, 'Classroom ID is required');
    }

    const updatedClassroom = await prisma.classroom.update({
      where: { id },
      data: {
        ...(isShared !== undefined ? { isShared } : {}),
      },
    });

    return apiSuccess({ classroom: updatedClassroom });
  } catch (error) {
    log.error('Failed to update classroom metadata:', error);
    return apiError(API_ERROR_CODES.INTERNAL_ERROR, 500, 'Failed to update classroom');
  }
}

/**
 * DELETE /api/admin/classrooms?id=...
 * Deletes any classroom in the system. Restricted to ADMIN.
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || (session.user as any).role !== 'ADMIN') {
      return apiError(API_ERROR_CODES.INVALID_REQUEST, 403, 'Forbidden: Admin access required');
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return apiError(API_ERROR_CODES.MISSING_REQUIRED_FIELD, 400, 'Classroom ID is required');
    }

    await prisma.classroom.delete({
      where: { id },
    });

    return apiSuccess({ success: true });
  } catch (error) {
    log.error('Failed to delete classroom as admin:', error);
    return apiError(API_ERROR_CODES.INTERNAL_ERROR, 500, 'Failed to delete classroom');
  }
}
