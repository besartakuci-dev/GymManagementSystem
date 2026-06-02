import {
  addClassType,
  editClassType,
  getClassType,
  listClassTypes,
  removeClassType,
} from '../services/classType.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';

export const listClassTypesController = asyncHandler(async (req, res) => {
  const classTypes = await listClassTypes();
  sendSuccess(res, { classTypes });
});

export const getClassTypeController = asyncHandler(async (req, res) => {
  const classType = await getClassType(req.validated.params.id);
  sendSuccess(res, { classType });
});

export const createClassTypeController = asyncHandler(async (req, res) => {
  const classType = await addClassType(req.validated.body);
  sendSuccess(res, { classType }, 'Class type created successfully', 201);
});

export const updateClassTypeController = asyncHandler(async (req, res) => {
  const classType = await editClassType(req.validated.params.id, req.validated.body);
  sendSuccess(res, { classType }, 'Class type updated successfully');
});

export const deleteClassTypeController = asyncHandler(async (req, res) => {
  const classType = await removeClassType(req.validated.params.id);
  sendSuccess(res, { classType }, 'Class type deactivated successfully');
});
