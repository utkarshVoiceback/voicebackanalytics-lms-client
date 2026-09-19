"use client";

import { useState, useMemo } from "react";

interface Module {
  moduleId: string;
  moduleName: string;
}

interface Batch {
  id: string;
  batchTitle: string;
  courseId: string;
}

interface Course {
  id: string;
  title: string;
}

interface HierarchicalInstructorSelectorProps {
  courses: Course[];
  batches: Batch[];
  courseModulesMap: Record<string, Module[]>;
  selectedCourses: string[];
  selectedBatches: string[];
  selectedModules: string[];
  onCoursesChange: (ids: string[]) => void;
  onBatchesChange: (ids: string[]) => void;
  onModulesChange: (ids: string[]) => void;
  disabled?: boolean;
}

export function HierarchicalInstructorSelector({
  courses,
  batches,
  courseModulesMap,
  selectedCourses,
  selectedBatches,
  selectedModules,
  onCoursesChange,
  onBatchesChange,
  onModulesChange,
  disabled = false,
}: HierarchicalInstructorSelectorProps) {
  const [expandedBatches, setExpandedBatches] = useState<Set<string>>(new Set());

  const toggleBatchExpanded = (batchId: string) => {
    const newExpanded = new Set(expandedBatches);
    if (newExpanded.has(batchId)) {
      newExpanded.delete(batchId);
    } else {
      newExpanded.add(batchId);
    }
    setExpandedBatches(newExpanded);
  };

  const toggleCourse = (courseId: string) => {
    if (disabled) return;

    if (selectedCourses.includes(courseId)) {
      // Removing course
      onCoursesChange(selectedCourses.filter((id) => id !== courseId));
      
      // Remove associated batches
      const courseBatches = batches.filter(b => b.courseId === courseId).map(b => b.id);
      const newBatches = selectedBatches.filter(bId => !courseBatches.includes(bId));
      onBatchesChange(newBatches);

      // Remove associated modules (only if they belong to this course)
      const courseModuleIds = (courseModulesMap[courseId] || []).map(m => m.moduleId);
      const newModules = selectedModules.filter(mId => !courseModuleIds.includes(mId));
      onModulesChange(newModules);
      
    } else {
      // Adding course
      onCoursesChange([...selectedCourses, courseId]);
    }
  };

  const toggleBatch = (batchId: string) => {
    if (disabled) return;
    
    if (selectedBatches.includes(batchId)) {
      // Removing batch
      const newBatches = selectedBatches.filter((id) => id !== batchId);
      onBatchesChange(newBatches);

      // Collapse the batch dropdown when deselecting
      const newExpanded = new Set(expandedBatches);
      newExpanded.delete(batchId);
      setExpandedBatches(newExpanded);

      // We should unselect modules belonging to this batch's course, 
      // UNLESS another batch from the SAME course is still selected.
      const batchObj = batches.find(b => b.id === batchId);
      if (batchObj) {
        const otherSelectedBatchesSameCourse = newBatches.filter(bId => {
          const b = batches.find(bb => bb.id === bId);
          return b && b.courseId === batchObj.courseId;
        });

        if (otherSelectedBatchesSameCourse.length === 0) {
          // No other batches from this course are selected, so remove its modules
          const courseModuleIds = (courseModulesMap[batchObj.courseId] || []).map(m => m.moduleId);
          const newModules = selectedModules.filter(mId => !courseModuleIds.includes(mId));
          onModulesChange(newModules);
        }
      }
    } else {
      // Adding batch
      onBatchesChange([...selectedBatches, batchId]);
      
      // Auto-expand the batch dropdown when selecting
      const newExpanded = new Set(expandedBatches);
      newExpanded.add(batchId);
      setExpandedBatches(newExpanded);
    }
  };

  const toggleModule = (moduleId: string) => {
    if (disabled) return;

    if (selectedModules.includes(moduleId)) {
      onModulesChange(selectedModules.filter((id) => id !== moduleId));
    } else {
      onModulesChange([...selectedModules, moduleId]);
    }
  };

  // Get batches for selected courses
  const batchesForCourses = useMemo(() => {
    const selectedCourseSet = new Set(selectedCourses);
    return batches.filter((b) => selectedCourseSet.has(b.courseId));
  }, [batches, selectedCourses]);

  // Get modules for each batch (creates a mapping of batchId -> modules)
  const modulesByBatch = useMemo(() => {
    const result: Record<string, Module[]> = {};
    const selectedBatchSet = new Set(selectedBatches);

    batchesForCourses.forEach((batch) => {
      if (selectedBatchSet.has(batch.id)) {
        const mods = courseModulesMap[batch.courseId] || [];
        result[batch.id] = mods;
      }
    });
    return result;
  }, [batchesForCourses, selectedBatches, courseModulesMap]);

  return (
    <div className="space-y-4">
      {/* Courses Section */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Assign Courses, Batches and Modules</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">Select the courses, batches and modules you want to assign to this instructor.</p>

        <div className="space-y-2 p-4 bg-slate-50 dark:bg-slate-800/30 rounded-lg border border-slate-200 dark:border-slate-700">
          {courses.map((course) => {
            const isCoursSelected = selectedCourses.includes(course.id);
            const courseBatches = batchesForCourses.filter((b) => b.courseId === course.id);

            return (
              <div key={course.id} className="space-y-2">
                {/* Course Header */}
                <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600">
                  <input
                    type="checkbox"
                    checked={isCoursSelected}
                    onChange={() => toggleCourse(course.id)}
                    disabled={disabled}
                    className="w-5 h-5 rounded cursor-pointer"
                  />
                  <span className={lex-1 font-medium text-sm }>
                    {course.title}
                  </span>
                  {isCoursSelected && (
                    <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
                      Selected
                    </span>
                  )}
                </div>

                {/* Batches for this Course */}
                {isCoursSelected && courseBatches.length > 0 && (
                  <div className="ml-4 space-y-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                      Select Batches
                    </label>

                    {courseBatches.map((batch) => {
                      const isBatchSelected = selectedBatches.includes(batch.id);
                      const isBatchExpanded = expandedBatches.has(batch.id);
                      const batchModules = isBatchSelected ? (modulesByBatch[batch.id] || []) : [];

                      return (
                        <div key={batch.id} className="space-y-2">
                          {/* Batch Header */}
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isBatchSelected}
                              onChange={() => toggleBatch(batch.id)}
                              disabled={disabled}
                              className="w-4 h-4 rounded cursor-pointer"
                            />
                            <button
                              type="button"
                              onClick={() => toggleBatchExpanded(batch.id)}
                              disabled={disabled}
                              className="flex-1 flex items-center gap-2 p-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700/50 rounded transition-colors text-left"
                            >
                              <svg
                                className={w-4 h-4 transition-transform }
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                              {batch.batchTitle}
                            </button>
                            {isBatchSelected && (
                              <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded whitespace-nowrap">
                                {batchModules.length} modules
                              </span>
                            )}
                          </div>

                          {/* Modules for this Batch */}
                          {isBatchSelected && isBatchExpanded && batchModules.length > 0 && (
                            <div className="ml-6 space-y-1 p-2 bg-white dark:bg-slate-700/30 rounded border border-slate-200 dark:border-slate-700/50">
                              {batchModules.map((module) => {
                                const isModuleSelected = selectedModules.includes(module.moduleId);
                                return (
                                  <button
                                    type="button"
                                    key={module.moduleId}
                                    onClick={() => toggleModule(module.moduleId)}
                                    disabled={disabled}
                                    className={w-full flex items-center gap-2 p-2 text-sm rounded transition-colors text-left }
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isModuleSelected}
                                      readOnly
                                      className="w-4 h-4 rounded cursor-pointer"
                                    />
                                    {module.moduleName}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary */}
      {(selectedCourses.length > 0 || selectedBatches.length > 0 || selectedModules.length > 0) && (
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-600/30 text-sm text-blue-700 dark:text-blue-300">
          <span className="font-medium">Selected:</span> {selectedCourses.length} course{selectedCourses.length !== 1 ? "s" : ""}, {selectedBatches.length} batch{selectedBatches.length !== 1 ? "es" : ""}, {selectedModules.length} module{selectedModules.length !== 1 ? "s" : ""}
        </div>
      )}
    </div>
  );
}
