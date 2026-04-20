import prisma from '@/lib/prisma/client';
import path from 'path';
import type { NextRequest } from 'next/server';
import type { Scene, Stage } from '@/lib/types/stage';
import { createLogger } from '@/lib/logger';

const log = createLogger('ClassroomStorage');

export const CLASSROOMS_DIR = path.join(process.cwd(), 'data', 'classrooms');

/**
 * Build the public origin for the request (protocol + host)
 */
export function buildRequestOrigin(req: NextRequest): string {
  return req.headers.get('x-forwarded-host')
    ? `${req.headers.get('x-forwarded-proto') || 'http'}://${req.headers.get('x-forwarded-host')}`
    : req.nextUrl.origin;
}

/**
 * Data structure for a classroom stored in the database
 */
export interface PersistedClassroomData {
  id: string;
  name: string;
  userId: string;
  data: {
    stage: Stage;
    scenes: Scene[];
  };
  isShared: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Validate classroom ID format
 */
export function isValidClassroomId(id: string): boolean {
  return /^[a-zA-Z0-9_-]+$/.test(id);
}

/**
 * Retrieve a classroom from the database by ID
 */
export async function readClassroom(id: string): Promise<any | null> {
  try {
    const classroom = await prisma.classroom.findUnique({
      where: { id },
    });

    if (!classroom) return null;

    // Transform DB record back to the format expected by the frontend
    return {
      id: classroom.id,
      name: classroom.name,
      userId: classroom.userId,
      stage: (classroom.data as any).stage,
      scenes: (classroom.data as any).scenes,
      isShared: classroom.isShared,
      createdAt: classroom.createdAt.toISOString(),
      updatedAt: classroom.updatedAt.toISOString(),
    };
  } catch (error) {
    log.error(`Failed to read classroom [id=${id}] from DB:`, error);
    throw error;
  }
}

/**
 * Save a classroom to the database
 */
export async function persistClassroom(
  data: {
    id: string;
    stage: Stage;
    scenes: Scene[];
    userId?: string;
    isShared?: boolean;
  },
  baseUrl: string,
): Promise<{ id: string; url: string }> {
  try {
    // Fallback to a default user ID if auth is not yet implemented
    const userId = data.userId || 'default-user';
    const classroomName = data.stage.name || 'Untitled Classroom';

    const persisted = await prisma.classroom.upsert({
      where: { id: data.id },
      update: {
        name: classroomName,
        data: {
          stage: data.stage,
          scenes: data.scenes,
        },
        isShared: data.isShared ?? false,
      },
      create: {
        id: data.id,
        name: classroomName,
        userId: userId,
        data: {
          stage: data.stage,
          scenes: data.scenes,
        },
        isShared: data.isShared ?? false,
      },
    });

    return {
      id: persisted.id,
      url: `${baseUrl}/classroom/${persisted.id}`,
    };
  } catch (error) {
    log.error(`Failed to persist classroom [id=${data.id}] to DB:`, error);
    throw error;
  }
}

/**
 * List classrooms for a specific user or shared ones
 */
export async function listClassrooms(userId: string, includeShared = true) {
  try {
    return await prisma.classroom.findMany({
      where: {
        OR: [{ userId: userId }, ...(includeShared ? [{ isShared: true }] : [])],
      },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        name: true,
        userId: true,
        isShared: true,
        updatedAt: true,
        createdAt: true,
      },
    });
  } catch (error) {
    log.error(`Failed to list classrooms for user [userId=${userId}]:`, error);
    throw error;
  }
}
