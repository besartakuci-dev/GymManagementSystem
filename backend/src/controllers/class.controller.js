import { cancelClass, createClass, getClass, listClasses, updateClass } from '../services/class.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';

export const listClassesController = asyncHandler(async (req, res) => {
  const data = await listClasses();
  sendSuccess(res, data);
});

export const getClassController = asyncHandler(async (req, res) => {
  const gymClass = await getClass(req.validated.params.id);
  sendSuccess(res, { class: gymClass });
});

export const createClassController = asyncHandler(async (req, res) => {
  const gymClass = await createClass(req.user, req.validated.body);
  sendSuccess(res, { class: gymClass }, 'Class created successfully', 201);
});

export const updateClassController = asyncHandler(async (req, res) => {
  const gymClass = await updateClass(req.user, req.validated.params.id, req.validated.body);
  sendSuccess(res, { class: gymClass }, 'Class updated successfully');
});

export const cancelClassController = asyncHandler(async (req, res) => {
  const gymClass = await cancelClass(req.user, req.validated.params.id);
  sendSuccess(res, { class: gymClass }, 'Class cancelled successfully');
});
