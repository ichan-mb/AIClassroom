import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma/client';
import { apiSuccess, apiError, API_ERROR_CODES } from '@/lib/server/api-response';
import { createLogger } from '@/lib/logger';
import { auth } from '@/lib/auth';
import bcrypt from 'bcryptjs';

const log = createLogger('AdminUsersAPI');

/**
 * GET /api/admin/users
 * Lists all users. Restricted to ADMIN.
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session || (session.user as any).role !== 'ADMIN') {
      return apiError(API_ERROR_CODES.INVALID_REQUEST, 403, 'Forbidden: Admin access required');
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { classrooms: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return apiSuccess({ users });
  } catch (error) {
    log.error('Failed to list users:', error);
    return apiError(API_ERROR_CODES.INTERNAL_ERROR, 500, 'Failed to list users');
  }
}

/**
 * POST /api/admin/users
 * Creates a new user or updates an existing one. Restricted to ADMIN.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || (session.user as any).role !== 'ADMIN') {
      return apiError(API_ERROR_CODES.INVALID_REQUEST, 403, 'Forbidden: Admin access required');
    }

    const body = await request.json();
    const { email, name, password, role, id } = body;

    if (!email) {
      return apiError(API_ERROR_CODES.MISSING_REQUIRED_FIELD, 400, 'Email is required');
    }

    // Hash password if provided
    const hashedPassword = password ? await bcrypt.hash(password, 10) : undefined;

    if (id) {
      // Update existing user
      const updatedUser = await prisma.user.update({
        where: { id },
        data: {
          email,
          name,
          role,
          ...(hashedPassword ? { password: hashedPassword } : {}),
        },
      });
      return apiSuccess({ user: updatedUser });
    } else {
      // Create new user
      if (!password) {
        return apiError(API_ERROR_CODES.MISSING_REQUIRED_FIELD, 400, 'Password is required for new users');
      }

      const newUser = await prisma.user.create({
        data: {
          email,
          name,
          role: role || 'USER',
          password: hashedPassword!,
        },
      });
      return apiSuccess({ user: newUser });
    }
  } catch (error) {
    log.error('Failed to manage user:', error);
    if ((error as any).code === 'P2002') {
      return apiError(API_ERROR_CODES.INVALID_REQUEST, 400, 'Email already exists');
    }
    return apiError(API_ERROR_CODES.INTERNAL_ERROR, 500, 'Failed to manage user');
  }
}

/**
 * DELETE /api/admin/users
 * Deletes a user. Restricted to ADMIN.
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
      return apiError(API_ERROR_CODES.MISSING_REQUIRED_FIELD, 400, 'User ID is required');
    }

    // Prevent deleting self
    if (id === (session.user as any).id) {
      return apiError(API_ERROR_CODES.INVALID_REQUEST, 400, 'Cannot delete your own admin account');
    }

    await prisma.user.delete({ where: { id } });
    return apiSuccess({ success: true });
  } catch (error) {
    log.error('Failed to delete user:', error);
    return apiError(API_ERROR_CODES.INTERNAL_ERROR, 500, 'Failed to delete user');
  }
}
