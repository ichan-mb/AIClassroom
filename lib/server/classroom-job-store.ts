import prisma from '@/lib/prisma/client';
import { createLogger } from '@/lib/logger';
import type {
  ClassroomGenerationProgress,
  ClassroomGenerationStep,
  GenerateClassroomInput,
  GenerateClassroomResult,
} from '@/lib/server/classroom-generation';

const log = createLogger('ClassroomJobStore');

export type ClassroomGenerationJobStatus = 'queued' | 'running' | 'succeeded' | 'failed';

export interface ClassroomGenerationJob {
  id: string;
  status: ClassroomGenerationJobStatus;
  step: ClassroomGenerationStep | 'queued' | 'failed' | 'completed';
  progress: number;
  message: string;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  completedAt?: string;
  inputSummary: {
    requirementPreview: string;
    hasPdf: boolean;
    pdfTextLength: number;
    pdfImageCount: number;
  };
  scenesGenerated: number;
  totalScenes?: number;
  result?: {
    classroomId: string;
    url: string;
    scenesCount: number;
  };
  error?: string;
}

/** Max age (ms) before a "running" job without an active runner is considered stale. */
const STALE_JOB_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

function buildInputSummary(input: GenerateClassroomInput): ClassroomGenerationJob['inputSummary'] {
  return {
    requirementPreview:
      input.requirement.length > 200 ? `${input.requirement.slice(0, 197)}...` : input.requirement,
    hasPdf: !!input.pdfContent,
    pdfTextLength: input.pdfContent?.text.length || 0,
    pdfImageCount: input.pdfContent?.images.length || 0,
  };
}

function mapDbToJob(dbJob: any): ClassroomGenerationJob {
  const payload = dbJob.payload as any;

  const job: ClassroomGenerationJob = {
    id: dbJob.id,
    status: dbJob.status as ClassroomGenerationJobStatus,
    step: dbJob.step as any,
    progress: dbJob.progress,
    message: dbJob.message || '',
    createdAt: dbJob.createdAt.toISOString(),
    updatedAt: dbJob.updatedAt.toISOString(),
    startedAt: dbJob.startedAt?.toISOString(),
    completedAt: dbJob.completedAt?.toISOString(),
    inputSummary: payload.inputSummary,
    scenesGenerated: payload.scenesGenerated || 0,
    totalScenes: payload.totalScenes,
    result: payload.result,
    error: payload.error,
  };

  // Check for staleness
  if (job.status === 'running') {
    const updatedAtTime = new Date(job.updatedAt).getTime();
    if (Date.now() - updatedAtTime > STALE_JOB_TIMEOUT_MS) {
      return {
        ...job,
        status: 'failed',
        step: 'failed',
        message: 'Job appears stale (no progress update for 30 minutes)',
        error: 'Stale job: process may have restarted during generation',
        completedAt: new Date().toISOString(),
      };
    }
  }

  return job;
}

export function isValidClassroomJobId(jobId: string): boolean {
  return /^[a-zA-Z0-9_-]+$/.test(jobId);
}

export async function createClassroomGenerationJob(
  jobId: string,
  input: GenerateClassroomInput,
  userId: string,
): Promise<ClassroomGenerationJob> {
  const inputSummary = buildInputSummary(input);

  const dbJob = await prisma.generationJob.create({
    data: {
      id: jobId,
      status: 'queued',
      step: 'queued',
      progress: 0,
      message: 'Classroom generation job queued',
      userId: userId,
      payload: {
        inputSummary,
        scenesGenerated: 0,
      },
    },
  });

  return mapDbToJob(dbJob);
}

export async function readClassroomGenerationJob(
  jobId: string,
): Promise<ClassroomGenerationJob | null> {
  try {
    const dbJob = await prisma.generationJob.findUnique({
      where: { id: jobId },
    });

    if (!dbJob) return null;
    return mapDbToJob(dbJob);
  } catch (error) {
    log.error(`Failed to read job ${jobId}:`, error);
    return null;
  }
}

export async function updateClassroomGenerationJob(
  jobId: string,
  patch: Partial<ClassroomGenerationJob>,
): Promise<ClassroomGenerationJob> {
  const existingDbJob = await prisma.generationJob.findUnique({
    where: { id: jobId },
  });

  if (!existingDbJob) {
    throw new Error(`Job not found: ${jobId}`);
  }

  const existingPayload = existingDbJob.payload as any;

  // Update fields
  const data: any = {};
  if (patch.status) data.status = patch.status;
  if (patch.step) data.step = patch.step;
  if (patch.progress !== undefined) data.progress = patch.progress;
  if (patch.message !== undefined) data.message = patch.message;
  if (patch.startedAt) data.startedAt = new Date(patch.startedAt);
  if (patch.completedAt) data.completedAt = new Date(patch.completedAt);

  // Payload updates
  const newPayload = { ...existingPayload };
  if (patch.scenesGenerated !== undefined) newPayload.scenesGenerated = patch.scenesGenerated;
  if (patch.totalScenes !== undefined) newPayload.totalScenes = patch.totalScenes;
  if (patch.result !== undefined) newPayload.result = patch.result;
  if (patch.error !== undefined) newPayload.error = patch.error;
  data.payload = newPayload;

  const updatedDbJob = await prisma.generationJob.update({
    where: { id: jobId },
    data,
  });

  return mapDbToJob(updatedDbJob);
}

export async function markClassroomGenerationJobRunning(
  jobId: string,
): Promise<ClassroomGenerationJob> {
  return updateClassroomGenerationJob(jobId, {
    status: 'running',
    message: 'Classroom generation started',
    startedAt: new Date().toISOString(),
  });
}

export async function updateClassroomGenerationJobProgress(
  jobId: string,
  progress: ClassroomGenerationProgress,
): Promise<ClassroomGenerationJob> {
  return updateClassroomGenerationJob(jobId, {
    status: 'running',
    step: progress.step,
    progress: progress.progress,
    message: progress.message,
    scenesGenerated: progress.scenesGenerated,
    totalScenes: progress.totalScenes,
  });
}

export async function markClassroomGenerationJobSucceeded(
  jobId: string,
  result: GenerateClassroomResult,
): Promise<ClassroomGenerationJob> {
  return updateClassroomGenerationJob(jobId, {
    status: 'succeeded',
    step: 'completed',
    progress: 100,
    message: 'Classroom generation completed',
    completedAt: new Date().toISOString(),
    scenesGenerated: result.scenesCount,
    result: {
      classroomId: result.id,
      url: result.url,
      scenesCount: result.scenesCount,
    },
  });
}

export async function markClassroomGenerationJobFailed(
  jobId: string,
  error: string,
): Promise<ClassroomGenerationJob> {
  return updateClassroomGenerationJob(jobId, {
    status: 'failed',
    step: 'failed',
    message: 'Classroom generation failed',
    completedAt: new Date().toISOString(),
    error,
  });
}
