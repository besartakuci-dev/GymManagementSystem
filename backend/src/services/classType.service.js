import {
  createClassType,
  deactivateClassType,
  findAllClassTypes,
  findClassTypeById,
  updateClassType,
} from '../models/class.model.js';
import { ApiError } from '../utils/ApiError.js';

async function requireClassType(classTypeId) {
  const classType = await findClassTypeById(classTypeId);
  if (!classType) throw new ApiError(404, 'Class type not found', 'CLASS_TYPE_NOT_FOUND');
  return classType;
}

export async function listClassTypes() {
  return findAllClassTypes();
}

export async function getClassType(classTypeId) {
  return requireClassType(classTypeId);
}

export async function addClassType(payload) {
  const classTypeId = await createClassType(payload);
  return findClassTypeById(classTypeId);
}

export async function editClassType(classTypeId, payload) {
  await requireClassType(classTypeId);
  await updateClassType(classTypeId, payload);
  return findClassTypeById(classTypeId);
}

export async function removeClassType(classTypeId) {
  await requireClassType(classTypeId);
  await deactivateClassType(classTypeId);
  return findClassTypeById(classTypeId);
}
