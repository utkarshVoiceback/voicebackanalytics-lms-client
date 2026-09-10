"use client";

import { useEffect, useState, use, FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiFetch, API_BASE_URL } from "@/lib/api";
import { useAppDispatch } from "@/store";
import { setCurrentModule, updateModuleInList } from "@/store/moduleSlice";
import { DependencySelector } from "../components/DependencySelector";

interface ModuleContent {
  id: string;
  contentType: string;
  title: string | null;
  description: string | null;
  contentUrl: string | null;
  textContent: string | null;
  fileName: string | null;
  originalFileName: string | null;
  fileSize: number | null;
  mimeType: string | null;
  estimatedMinutes: number;
}

interface OptionData {
  id: string;
  optionText: string;
  isCorrect: boolean;
}

interface QuestionData {
  id: string;
  questionText: string;
  marks: number;
  sequenceOrder: number;
  options: OptionData[];
}

interface ModuleData {
  id: string;
  title: string;
  description: string | null;
  status: string;
  contents: ModuleContent[];
  questions?: QuestionData[];
}

interface CourseModuleData {
  courseModuleId: string;
  sequenceOrder: number;
  isSequential: boolean;
  dependencies: { courseModuleId: string; moduleId: string; moduleName: string }[];
}

export default function ModuleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { id } = use(params);
  const searchParams = useSearchParams();
  
  const courseId = searchParams.get("courseId");
  const courseModuleId = searchParams.get("courseModuleId");

  const [module, setModule] = useState<ModuleData | null>(null);
  const [courseModule, setCourseModule] = useState<CourseModuleData | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit state (Global Module)
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStatus, setEditStatus] = useState("ACTIVE");
  const [editCourseIds, setEditCourseIds] = useState<string[]>([]);
  const [courses, setCourses] = useState<{ id: string; title: string }[]>([]);
  const [courseLoading, setCourseLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  // Edit state (Course-specific Module)
  const [editingCourseModule, setEditingCourseModule] = useState(false);
  const [editSequence, setEditSequence] = useState(1);
  const [editIsSequential, setEditIsSequential] = useState(true);
  const [editHasDependency, setEditHasDependency] = useState(false);
  const [editDependencyIds, setEditDependencyIds] = useState<string[]>([]);
  const [saveCourseModuleLoading, setSaveCourseModuleLoading] = useState(false);

  // Add content state
  const [showAddContent, setShowAddContent] = useState(false);
  const [contentType, setContentType] = useState("TEXT");
  const [contentTitle, setContentTitle] = useState("");
  const [contentDescription, setContentDescription] = useState("");
  const [contentUrl, setContentUrl] = useState("");
  const [textContent, setTextContent] = useState("");
  const [estimatedMinutes, setEstimatedMinutes] = useState(10);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [addContentLoading, setAddContentLoading] = useState(false);

  // Add question state
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [questionText, setQuestionText] = useState("");
  const [marks, setMarks] = useState(10);
  const [sequenceOrder, setSequenceOrder] = useState(1);
  const [options, setOptions] = useState([
    { optionText: "", isCorrect: true },
    { optionText: "", isCorrect: false },
    { optionText: "", isCorrect: false },
    { optionText: "", isCorrect: false },
  ]);
  const [addQuestionLoading, setAddQuestionLoading] = useState(false);
  const [questionError, setQuestionError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchModule();
      fetchQuestions();
      if (courseId && courseModuleId) {
        fetchCourseModule();
      }
    }
  }, [id, courseId, courseModuleId]);

  const fetchCourses = async () => {
    setCourseLoading(true);
    const res = await apiFetch("/courses");
    if (res.success && res.data) {
      setCourses(res.data);

      // Fetch current courses for this module
      const cmRes = await apiFetch(`/modules/${id}?courses=true`);
      if (cmRes.success && Array.isArray(cmRes.data?.courseIds)) {
        setEditCourseIds(cmRes.data.courseIds);
      } else {
        // Default: start with empty array, user can select courses
        setEditCourseIds([]);
      }
    }
    setCourseLoading(false);
  };

  const fetchModule = async () => {
    setLoading(true);
    const res = await apiFetch(`/modules/${id}`);
    if (res.success && res.data) {
      setModule(prev => ({ ...prev, ...res.data }));
      dispatch(setCurrentModule(res.data));
      setEditTitle(res.data.title);
      setEditDescription(res.data.description || "");
      setEditStatus(res.data.status);
    } else {
      setError(res.message || "Module not found");
    }
    setLoading(false);
  };

  const fetchCourseModule = async () => {
    const res = await apiFetch(`/courses/${courseId}/modules`);
    if (res.success && res.data) {
      const cm = res.data.find((m: any) => m.courseModuleId === courseModuleId);
      if (cm) {
        setCourseModule(cm);
        setEditSequence(cm.sequenceOrder);
        setEditIsSequential(cm.isSequential);
        setEditHasDependency(cm.dependencies.length > 0);
        setEditDependencyIds(cm.dependencies.map((d: any) => d.courseModuleId));
      }
    }
  };

  const fetchQuestions = async () => {
    const res = await apiFetch(`/modules/${id}/questions`);
    if (res.success && res.data) {
      setModule(prev => (prev ? { ...prev, questions: res.data } : null));
    }
  };

  const handleSaveModule = async (e: FormEvent) => {
    e.preventDefault();
    setSaveLoading(true);
    const res = await apiFetch(`/modules/${id}`, {
      method: "PUT",
      body: JSON.stringify({
        title: editTitle,
        description: editDescription,
        status: editStatus,
      }),
    });
    if (res.success && res.data) {
      setModule(res.data);
      dispatch(updateModuleInList(res.data));

      // Also update the courses associated with this module
      if (editCourseIds.length > 0) {
        const courseRes = await apiFetch(`/modules/${id}/courses`, {
          method: "PUT",
          body: JSON.stringify({ courseIds: editCourseIds }),
        });
        if (!courseRes.success) {
          alert(courseRes.message || "Failed to update module courses");
        }
      }

      setEditing(false);
    }
    setSaveLoading(false);
  };

  const handleSaveCourseModule = async (e: FormEvent) => {
    e.preventDefault();
    setSaveCourseModuleLoading(true);
    
    const depsRes = await apiFetch(`/courses/${courseId}/modules/${courseModuleId}/dependencies`, {
      method: "PUT",
      body: JSON.stringify({ dependencyCourseModuleIds: editHasDependency ? editDependencyIds : [] })
    });
    
    if (depsRes.success) {
      setEditingCourseModule(false);
      fetchCourseModule();
    } else {
      alert(depsRes.message || "Failed to update course-specific settings");
    }
    setSaveCourseModuleLoading(false);
  };

  const handleAddContent = async (e: FormEvent) => {
    e.preventDefault();
    setAddContentLoading(true);
    setUploadProgress(0);
    setError(null);

    try {
      if (contentType === "TEXT") {
        const res = await apiFetch(`/modules/${id}/content`, {
          method: "POST",
          body: JSON.stringify({
            contentType,
            contentUrl: null,
            textContent,
            estimatedMinutes,
          }),
        });
        if (res.success) {
          resetAddContentForm();
          fetchModule();
        } else {
          setError(res.message || "Failed to add text content");
        }
      } else {
        if (uploadFiles.length === 0) {
          setError("Please select a file to upload.");
          setAddContentLoading(false);
          return;
        }

        const formData = new FormData();
        uploadFiles.forEach(file => formData.append("files", file));
        formData.append("contentType", contentType);
        formData.append("title", contentTitle);
        formData.append("description", contentDescription);
        formData.append("estimatedMinutes", estimatedMinutes.toString());

        const token = localStorage.getItem("lms_auth_token");

        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("POST", `${API_BASE_URL}/modules/${id}/content/upload`);
          if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);

          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              setUploadProgress(Math.round((event.loaded * 100) / event.total));
            }
          };

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              const res = JSON.parse(xhr.responseText);
              if (res.success) {
                resetAddContentForm();
                fetchModule();
                resolve();
              } else {
                reject(new Error(res.message || "Upload failed"));
              }
            } else {
              reject(new Error(`Upload failed with status ${xhr.status}`));
            }
          };

          xhr.onerror = () => reject(new Error("Network error during upload"));
          xhr.send(formData);
        });
      }
    } catch (err: any) {
      setError(err.message || "Failed to add content");
    } finally {
      setAddContentLoading(false);
    }
  };

  const resetAddContentForm = () => {
    setShowAddContent(false);
    setContentType("TEXT");
    setContentTitle("");
    setContentDescription("");
    setContentUrl("");
    setTextContent("");
    setEstimatedMinutes(10);
    setUploadFiles([]);
    setUploadProgress(0);
  };

  const handleAddQuestion = async (e: FormEvent) => {
    e.preventDefault();
    setQuestionError(null);

    const hasCorrectOption = options.some(opt => opt.isCorrect);
    if (!hasCorrectOption) {
      setQuestionError("Please select at least one correct option.");
      return;
    }

    if (options.some(opt => !opt.optionText.trim())) {
      setQuestionError("All options must have text.");
      return;
    }

    setAddQuestionLoading(true);
    const res = await apiFetch(`/modules/${id}/questions`, {
      method: "POST",
      body: JSON.stringify({
        questionText,
        marks,
        sequenceOrder,
        options,
      }),
    });

    if (res.success) {
      setShowAddQuestion(false);
      setQuestionText("");
      setMarks(10);
      setSequenceOrder(sequenceOrder + 1);
      setOptions([
        { optionText: "", isCorrect: true },
        { optionText: "", isCorrect: false },
        { optionText: "", isCorrect: false },
        { optionText: "", isCorrect: false },
      ]);
      fetchQuestions();
    } else {
      setQuestionError(res.message || "Failed to add question");
    }
    setAddQuestionLoading(false);
  };

  const handleDeleteContent = async (contentId: string) => {
    if (!confirm("Are you sure you want to delete this content?")) return;
    const res = await apiFetch(`/modules/${id}/content/${contentId}`, { method: "DELETE" });
    if (res.success) {
      fetchModule();
    } else {
      alert(res.message || "Failed to delete content");
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm("Are you sure you want to delete this question?")) return;
    const res = await apiFetch(`/modules/${id}/questions/${questionId}`, { method: "DELETE" });
    if (res.success) {
      fetchQuestions();
    } else {
      alert(res.message || "Failed to delete question");
    }
  };

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case "VIDEO": return <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" /></svg>;
      case "AUDIO": return <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m5.231 13.481L15 17.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Zm3.75 11.625a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" /></svg>;
      case "PDF": return <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>;
      default: return <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" /></svg>;
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950"><div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" /></div>;

  if (error || !module) return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950 px-4">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Module Not Found</h1>
        <p className="text-slate-500 dark:text-slate-400">{error}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => router.push(courseId ? `/admin/modules?courseId=${courseId}` : "/admin/courses")}
          className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors mb-6"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          Back to Modules
        </button>

        {/* Global Module Header */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 mb-6 shadow-sm">
          {!editing ? (
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Global Master</span>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{module.title}</h1>
                    <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${module.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30" : "bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/30"}`}>
                      {module.status}
                    </span>
                  </div>
                  {module.description && <p className="text-slate-500 dark:text-slate-400 mt-1">{module.description}</p>}
                </div>
                <button onClick={() => { setEditing(true); fetchCourses(); }} className="flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></svg>
                  Edit Master
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSaveModule} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5">Title</label>
                <input type="text" required value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-4 py-2.5 text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5">Description</label>
                <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={2} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-4 py-2.5 text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5">Status</label>
                <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-4 py-2.5 text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors">
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5">Select Courses</label>
                <div className="space-y-2 border border-slate-300 dark:border-slate-700 rounded-lg p-3 bg-slate-100 dark:bg-slate-800 max-h-64 overflow-y-auto">
                  {courseLoading ? (
                    <p className="text-slate-500 dark:text-slate-400 text-sm py-4 text-center">Loading courses...</p>
                  ) : courses.length === 0 ? (
                    <p className="text-slate-500 dark:text-slate-400 text-sm py-4 text-center">No courses available</p>
                  ) : (
                    courses.map((course) => {
                      const isSelected = editCourseIds.includes(course.id);
                      return (
                        <button
                          key={course.id}
                          type="button"
                          onClick={() => {
                            setEditCourseIds(
                              isSelected
                                ? editCourseIds.filter((id) => id !== course.id)
                                : [...editCourseIds, course.id]
                            );
                          }}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm transition-all ${
                            isSelected
                              ? "bg-blue-100 dark:bg-blue-500/20 border border-blue-300 dark:border-blue-500/30"
                              : "bg-white dark:bg-slate-700/50 border border-transparent hover:bg-slate-50 dark:hover:bg-slate-700"
                          }`}
                        >
                          <span
                            className={`shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                              isSelected
                                ? "bg-blue-600 border-blue-600"
                                : "border-slate-300 dark:border-slate-600"
                            }`}
                          >
                            {isSelected && (
                              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                              </svg>
                            )}
                          </span>
                          <span className={`text-sm font-medium ${isSelected ? "text-blue-900 dark:text-blue-100" : "text-slate-700 dark:text-slate-300"}`}>
                            {course.title}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button type="submit" disabled={saveLoading} className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-500 transition-colors disabled:opacity-50">{saveLoading ? "Saving..." : "Save Master"}</button>
                <button type="button" onClick={() => setEditing(false)} className="rounded-lg border border-slate-300 dark:border-slate-700 px-5 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">Cancel</button>
              </div>
            </form>
          )}
        </div>

        {/* Course-Specific Module Configuration */}
        {/* {courseModule && (
          <div className="bg-indigo-50 dark:bg-indigo-500/5 border border-indigo-200 dark:border-indigo-500/20 rounded-2xl p-6 mb-8">
            {!editingCourseModule ? (
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-3">Course Configuration</h2>
                    <div className="flex items-center gap-6">
                      <div>
                        <span className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Sequence Order</span>
                        <span className="font-semibold text-slate-900 dark:text-white">{courseModule.sequenceOrder}</span>
                      </div>
                      <div>
                        <span className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Dependencies</span>
                        {courseModule.dependencies.length > 0 ? (
                          <div className="flex gap-2">
                            {courseModule.dependencies.map(d => (
                              <span key={d.courseModuleId} className="inline-flex rounded bg-indigo-100 dark:bg-indigo-500/20 px-2 py-0.5 text-xs font-medium text-indigo-700 dark:text-indigo-300">
                                {d.moduleName}
                              </span>
                            ))}
                          </div>
                        ) : <span className="text-sm text-slate-500">None</span>}
                      </div>
                    </div>
                  </div>
                  <button onClick={() => setEditingCourseModule(true)} className="flex items-center gap-2 rounded-lg border border-indigo-200 dark:border-indigo-500/30 px-3 py-1.5 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/10 transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></svg>
                    Edit Deps
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSaveCourseModule} className="space-y-5">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-3">Edit Course Dependencies</h2>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">Prerequisite Dependencies</label>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Learners must complete selected modules before this one.</p>
                  </div>
                  <button type="button" onClick={() => { setEditHasDependency(!editHasDependency); if (editHasDependency) setEditDependencyIds([]); }} className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${editHasDependency ? "bg-indigo-600" : "bg-slate-300 dark:bg-slate-700"}`}>
                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${editHasDependency ? "translate-x-6" : "translate-x-1"}`} />
                  </button>
                </div>

                {editHasDependency && courseId && (
                  <DependencySelector
                    courseId={courseId}
                    selectedIds={editDependencyIds}
                    onChange={setEditDependencyIds}
                    excludeCourseModuleId={courseModuleId || undefined}
                  />
                )}

                <div className="flex items-center gap-3 pt-2">
                  <button type="submit" disabled={saveCourseModuleLoading} className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors disabled:opacity-50">{saveCourseModuleLoading ? "Saving..." : "Save Course Config"}</button>
                  <button type="button" onClick={() => setEditingCourseModule(false)} className="rounded-lg border border-indigo-200 dark:border-indigo-700 px-5 py-2 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/20 transition-colors">Cancel</button>
                </div>
              </form>
            )}
          </div>
        )} */}

        <div className="grid grid-cols-1 gap-6 mb-8">
          {/* Content Section */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Content Items</h2>
              {!showAddContent && (
                <button onClick={() => setShowAddContent(true)} className="flex items-center gap-2 rounded-lg bg-slate-100 dark:bg-slate-800 px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                  Add
                </button>
              )}
            </div>

            {showAddContent && (
              <div className="mb-8 p-5 border border-blue-100 dark:border-blue-900/30 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl">
                <form onSubmit={handleAddContent} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Type</label>
                      <select value={contentType} onChange={(e) => setContentType(e.target.value)} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                        <option value="VIDEO">Video</option>
                        <option value="AUDIO">Audio</option>
                        <option value="PDF">PDF</option>
                        <option value="TEXT">Text/HTML</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Est. Minutes</label>
                      <input type="number" min={1} required value={estimatedMinutes} onChange={(e) => setEstimatedMinutes(Number(e.target.value))} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Title</label>
                    <input type="text" required value={contentTitle} onChange={(e) => setContentTitle(e.target.value)} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="Content title" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Description (optional)</label>
                    <textarea value={contentDescription} onChange={(e) => setContentDescription(e.target.value)} rows={2} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none" placeholder="Brief description" />
                  </div>

                  {contentType === "TEXT" ? (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Text Content</label>
                      <textarea required value={textContent} onChange={(e) => setTextContent(e.target.value)} rows={5} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono" placeholder="<p>Enter HTML or plain text here</p>" />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Upload File</label>
                      <div className="mt-1 flex justify-center rounded-lg border border-dashed border-slate-300 dark:border-slate-700 px-6 py-6 bg-white dark:bg-slate-800">
                        <div className="text-center">
                          <svg className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M1.5 6a2.25 2.25 0 0 1 2.25-2.25h16.5A2.25 2.25 0 0 1 22.5 6v12a2.25 2.25 0 0 1-2.25 2.25H3.75A2.25 2.25 0 0 1 1.5 18V6ZM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0 0 21 18v-1.94l-2.69-2.689a1.5 1.5 0 0 0-2.12 0l-.88.879.97.97a.75.75 0 1 1-1.06 1.06l-5.16-5.159a1.5 1.5 0 0 0-2.12 0L3 16.061Zm10.125-7.81a1.125 1.125 0 1 1 2.25 0 1.125 1.125 0 0 1-2.25 0Z" clipRule="evenodd" /></svg>
                          <div className="mt-4 flex text-sm leading-6 text-slate-600 dark:text-slate-400">
                            <label className="relative cursor-pointer rounded-md bg-white dark:bg-slate-800 font-semibold text-blue-600 dark:text-blue-400 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-600 focus-within:ring-offset-2 hover:text-blue-500">
                              <span>Upload a file</span>
                              <input type="file" className="sr-only" onChange={(e) => { if (e.target.files) { setUploadFiles(Array.from(e.target.files)); } }} />
                            </label>
                            <p className="pl-1">or drag and drop</p>
                          </div>
                          {uploadFiles.length > 0 && <p className="text-xs leading-5 text-slate-500 mt-2 font-medium">{uploadFiles[0].name}</p>}
                        </div>
                      </div>
                      
                      {uploadProgress > 0 && uploadProgress < 100 && (
                        <div className="mt-4">
                          <div className="flex justify-between text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                            <span>Uploading...</span>
                            <span>{uploadProgress}%</span>
                          </div>
                          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
                            <div className="bg-blue-600 h-1.5 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="pt-2 flex items-center gap-3">
                    <button type="submit" disabled={addContentLoading} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50 transition-colors">
                      {addContentLoading ? "Uploading..." : "Save Content"}
                    </button>
                    <button type="button" onClick={resetAddContentForm} disabled={addContentLoading} className="rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {module.contents.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                <p className="text-sm text-slate-500 dark:text-slate-400">No content items added yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {module.contents.map((content) => (
                  <div key={content.id} className="flex items-start gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:border-slate-300 dark:hover:border-slate-600 transition-colors group">
                    <div className="flex-shrink-0 mt-1">
                      {getContentTypeIcon(content.contentType)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-sm font-semibold text-slate-900 dark:text-white truncate pr-4">{content.title || "Untitled"}</h4>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleDeleteContent(content.id)} className="text-slate-400 hover:text-red-500 transition-colors" title="Delete Content">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
                          </button>
                        </div>
                      </div>
                      {content.description && <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 truncate">{content.description}</p>}
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 dark:text-slate-500">
                        <span className="flex items-center gap-1"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>{content.estimatedMinutes} min</span>
                        {content.fileName && <span className="flex items-center gap-1"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>{content.originalFileName || content.fileName}</span>}
                        {content.fileSize && <span className="flex items-center gap-1"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25-4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" /></svg>{Math.round(content.fileSize / 1024 / 1024 * 100) / 100} MB</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Assessment Section */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Assessment Questions</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Quiz at the end of the module</p>
              </div>
              {!showAddQuestion && (
                <button onClick={() => setShowAddQuestion(true)} className="flex items-center gap-2 rounded-lg bg-slate-100 dark:bg-slate-800 px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                  Add Question
                </button>
              )}
            </div>

            {showAddQuestion && (
              <div className="mb-8 p-6 border border-purple-100 dark:border-purple-900/30 bg-purple-50/50 dark:bg-purple-900/10 rounded-xl">
                <form onSubmit={handleAddQuestion} className="space-y-5">
                  {questionError && <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">{questionError}</div>}
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Question Text <span className="text-red-500">*</span></label>
                    <textarea required value={questionText} onChange={(e) => setQuestionText(e.target.value)} rows={3} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 resize-none" placeholder="Enter the question here..." />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Marks <span className="text-red-500">*</span></label>
                      <input type="number" min={1} required value={marks} onChange={(e) => setMarks(Number(e.target.value))} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Sequence Order <span className="text-red-500">*</span></label>
                      <input type="number" min={1} required value={sequenceOrder} onChange={(e) => setSequenceOrder(Number(e.target.value))} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Options <span className="text-red-500">*</span></label>
                    <div className="space-y-3">
                      {options.map((option, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                          <input type="radio" name="correctOption" checked={option.isCorrect} onChange={() => {
                            const newOptions = [...options];
                            newOptions.forEach((o, i) => o.isCorrect = i === idx);
                            setOptions(newOptions);
                          }} className="w-4 h-4 text-purple-600 border-slate-300 focus:ring-purple-600" />
                          <input type="text" required value={option.optionText} onChange={(e) => {
                            const newOptions = [...options];
                            newOptions[idx].optionText = e.target.value;
                            setOptions(newOptions);
                          }} className="flex-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500" placeholder={`Option ${idx + 1}`} />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 flex items-center gap-3">
                    <button type="submit" disabled={addQuestionLoading} className="rounded-lg bg-purple-600 px-5 py-2 text-sm font-semibold text-white hover:bg-purple-500 disabled:opacity-50 transition-colors">
                      {addQuestionLoading ? "Adding..." : "Save Question"}
                    </button>
                    <button type="button" onClick={() => setShowAddQuestion(false)} disabled={addQuestionLoading} className="rounded-lg border border-slate-300 dark:border-slate-700 px-5 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {!module.questions || module.questions.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                <p className="text-sm text-slate-500 dark:text-slate-400">No questions added yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {module.questions.map((question, idx) => (
                  <div key={question.id} className="p-5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 group relative">
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleDeleteQuestion(question.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md transition-colors" title="Delete Question">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
                      </button>
                    </div>
                    <div className="flex items-start gap-3 mb-4 pr-8">
                      <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 text-xs font-bold">{idx + 1}</span>
                      <div>
                        <h4 className="text-sm font-semibold text-slate-900 dark:text-white leading-relaxed">{question.questionText}</h4>
                        <span className="inline-block mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">{question.marks} {question.marks === 1 ? 'Mark' : 'Marks'}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-9">
                      {question.options.map((opt) => (
                        <div key={opt.id} className={`flex items-center gap-2 p-2.5 rounded-lg border text-sm ${opt.isCorrect ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-500/30 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-200' : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>
                          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${opt.isCorrect ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
                          <span className="truncate">{opt.optionText}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
