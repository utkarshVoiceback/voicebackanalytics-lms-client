"use client";

import { useEffect, useState, use, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, API_BASE_URL } from "@/lib/api";
import { useAppDispatch } from "@/store";
import { setCurrentModule, updateModuleInList } from "@/store/moduleSlice";

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
  batchId: string;
  title: string;
  description: string | null;
  sequenceOrder: number;
  isSequential: boolean;
  status: string;
  contents: ModuleContent[];
  questions?: QuestionData[];
  batch?: { id: string; batchTitle: string };
}

export default function ModuleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { id } = use(params);

  const [module, setModule] = useState<ModuleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit state
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editSequence, setEditSequence] = useState(1);
  const [editIsSequential, setEditIsSequential] = useState(true);
  const [editStatus, setEditStatus] = useState("ACTIVE");
  const [saveLoading, setSaveLoading] = useState(false);

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
    }
  }, [id]);

  const fetchModule = async () => {
    setLoading(true);
    const res = await apiFetch(`/modules/${id}`);
    if (res.success && res.data) {
      setModule(prev => ({ ...prev, ...res.data }));
      dispatch(setCurrentModule(res.data));
      setEditTitle(res.data.title);
      setEditDescription(res.data.description || "");
      setEditSequence(res.data.sequenceOrder);
      setEditIsSequential(res.data.isSequential);
      setEditStatus(res.data.status);
    } else {
      setError(res.message || "Module not found");
    }
    setLoading(false);
  };

  const fetchQuestions = async () => {
    const res = await apiFetch(`/modules/${id}/questions`);
    if (res.success && res.data) {
      setModule(prev => (prev ? { ...prev, questions: res.data } : null));
    }
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setSaveLoading(true);
    const res = await apiFetch(`/modules/${id}`, {
      method: "PUT",
      body: JSON.stringify({
        title: editTitle,
        description: editDescription,
        sequenceOrder: editSequence,
        isSequential: editIsSequential,
        status: editStatus,
      }),
    });
    if (res.success && res.data) {
      setModule(res.data);
      dispatch(updateModuleInList(res.data));
      setEditing(false);
    }
    setSaveLoading(false);
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

        // Use XMLHttpRequest for progress tracking
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
    const correctCount = options.filter(o => o.isCorrect).length;
    if (correctCount !== 1) {
      setQuestionError("Exactly 1 option must be marked as correct.");
      return;
    }

    setAddQuestionLoading(true);
    const res = await apiFetch(`/modules/${id}/questions`, {
      method: "POST",
      body: JSON.stringify({
        questionText,
        marks,
        sequenceOrder,
        options
      }),
    });
    if (res.success) {
      setShowAddQuestion(false);
      setQuestionText("");
      setMarks(10);
      setSequenceOrder(module?.questions ? module.questions.length + 1 : 1);
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

  const handleOptionChange = (index: number, field: string, value: any) => {
    const newOptions = [...options];
    if (field === 'isCorrect' && value === true) {
      newOptions.forEach(opt => opt.isCorrect = false);
    }
    newOptions[index] = { ...newOptions[index], [field]: value };
    setOptions(newOptions);
  };

  const getContentIcon = (type: string) => {
    switch (type) {
      case "VIDEO":
        return (
          <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
          </svg>
        );
      case "PDF":
        return (
          <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
          </svg>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !module) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950 px-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Module Not Found</h1>
          <p className="text-slate-500 dark:text-slate-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => router.push("/admin/modules")}
          className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors mb-6"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          Back to Modules
        </button>

        {/* Module Header */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 mb-6">
          {!editing ? (
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-500/20 dark:to-purple-500/20 border border-blue-200 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 font-bold">
                      {module.sequenceOrder}
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{module.title}</h1>
                    <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                      module.status === "ACTIVE"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30"
                        : "bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/30"
                    }`}>
                      {module.status}
                    </span>
                  </div>
                  {module.description && <p className="text-slate-500 dark:text-slate-400 mt-1">{module.description}</p>}
                  <div className="flex items-center gap-4 mt-3">
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      Batch: <strong className="text-slate-600 dark:text-slate-300">{module.batch?.batchTitle}</strong>
                    </span>
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      Sequential: <strong className={module.isSequential ? "text-amber-600 dark:text-amber-400" : "text-slate-600 dark:text-slate-300"}>{module.isSequential ? "ON" : "OFF"}</strong>
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                  </svg>
                  Edit
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5">Title</label>
                <input type="text" required value={editTitle} onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-4 py-2.5 text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5">Description</label>
                <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={2}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-4 py-2.5 text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors resize-none" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5">Sequence</label>
                  <input type="number" min={1} required value={editSequence} onChange={(e) => setEditSequence(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-4 py-2.5 text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5">Sequential</label>
                  <button type="button" onClick={() => setEditIsSequential(!editIsSequential)}
                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors mt-1.5 ${editIsSequential ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-700"}`}>
                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${editIsSequential ? "translate-x-6" : "translate-x-1"}`} />
                  </button>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5">Status</label>
                  <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-4 py-2.5 text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors">
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button type="submit" disabled={saveLoading}
                  className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50 transition-colors">
                  {saveLoading ? "Saving..." : "Save Changes"}
                </button>
                <button type="button" onClick={() => setEditing(false)}
                  className="rounded-lg border border-slate-300 dark:border-slate-700 px-5 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Module Contents */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Module Content</h2>
            <button
              onClick={() => setShowAddContent(!showAddContent)}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Add Content
            </button>
          </div>

          {/* Add Content Form */}
          {showAddContent && (
            <div className="mb-6 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-5">
              <form onSubmit={handleAddContent} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5">Content Type</label>
                    <select value={contentType} onChange={(e) => setContentType(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-4 py-2.5 text-slate-900 dark:text-white outline-none focus:border-blue-500 transition-colors">
                      <option value="TEXT">Text</option>
                      <option value="VIDEO">Video</option>
                      <option value="PDF">PDF</option>
                      {/* <option value="PPT">PPT</option> */}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5">Estimated Minutes</label>
                    <input type="number" min={1} value={estimatedMinutes} onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-4 py-2.5 text-slate-900 dark:text-white outline-none focus:border-blue-500 transition-colors" />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5">Title</label>
                    <input type="text" value={contentTitle} onChange={(e) => setContentTitle(e.target.value)} required
                      placeholder="Content Title"
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-4 py-2.5 text-slate-900 dark:text-white outline-none focus:border-blue-500 transition-colors" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5">Description (Optional)</label>
                    <textarea value={contentDescription} onChange={(e) => setContentDescription(e.target.value)} rows={2}
                      placeholder="Brief description..."
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-4 py-2.5 text-slate-900 dark:text-white outline-none focus:border-blue-500 transition-colors resize-none" />
                  </div>
                </div>

                {contentType !== "TEXT" && (
                  <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5">Upload File</label>
                      <input 
                        type="file"
                        multiple
                        onChange={(e) => {
                          if (e.target.files) {
                            setUploadFiles(Array.from(e.target.files));
                          }
                        }}
                        accept={
                          contentType === "VIDEO" ? "video/mp4,video/webm,video/quicktime" : 
                          contentType === "PDF" ? "application/pdf" : 
                          ".ppt,.pptx,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                        }
                        className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-4 py-2.5 text-slate-900 dark:text-white outline-none focus:border-blue-500 transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500" 
                      />
                      
                      {uploadFiles.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {uploadFiles.map((f, i) => (
                            <div key={i} className="flex justify-between items-center bg-slate-200 dark:bg-slate-700 p-2 rounded text-sm">
                              <span className="truncate mr-4">{f.name}</span>
                              <button type="button" onClick={() => setUploadFiles(prev => prev.filter((_, idx) => idx !== i))} className="text-red-600 dark:text-red-400 hover:text-red-500 dark:hover:text-red-300 flex-shrink-0">Remove</button>
                            </div>
                          ))}
                        </div>
                      )}

                      {uploadProgress > 0 && uploadProgress < 100 && (
                      <div className="mt-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
                        <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                      </div>
                    )}
                  </div>
                )}

                {contentType === "TEXT" && (
                  <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5">Text Content</label>
                    <textarea value={textContent} onChange={(e) => setTextContent(e.target.value)} rows={5}
                      placeholder="Enter module text content..."
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-4 py-2.5 text-slate-900 dark:text-white outline-none focus:border-blue-500 transition-colors resize-none" />
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <button type="submit" disabled={addContentLoading}
                    className="flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50 transition-colors">
                    {addContentLoading ? "Adding..." : "Add Content"}
                  </button>
                  <button type="button" onClick={() => setShowAddContent(false)}
                    className="rounded-lg border border-slate-300 dark:border-slate-700 px-5 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Content List */}
          {module.contents && module.contents.length > 0 ? (
            <div className="space-y-3">
              {module.contents.map((content, index) => (
                <div key={content.id} className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-lg p-4">
                  <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700">
                    {getContentIcon(content.contentType)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-900 dark:text-white">{content.title || `${content.contentType} Content`}</span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 border border-slate-300 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600">
                        {content.contentType}
                      </span>
                      <span className="text-xs text-slate-400 dark:text-slate-500">•</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">{content.estimatedMinutes} min</span>
                    </div>

                    {content.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{content.description}</p>
                    )}

                    {content.fileName && (
                      <div className="flex items-center gap-2 mt-2 bg-slate-100/80 dark:bg-slate-800/80 p-2 rounded-md border border-slate-300 dark:border-slate-700 w-fit">
                        <svg className="w-4 h-4 text-slate-500 dark:text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                        </svg>
                        <span className="text-xs text-slate-600 dark:text-slate-300 font-medium truncate max-w-[200px]">{content.originalFileName}</span>
                        {content.fileSize && (
                          <span className="text-xs text-slate-400 dark:text-slate-500 ml-2">({(content.fileSize / (1024 * 1024)).toFixed(2)} MB)</span>
                        )}
                      </div>
                    )}

                    {content.contentUrl && content.contentType === "TEXT" && (
                      <a href={content.contentUrl} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 truncate block mt-0.5">
                        {content.contentUrl}
                      </a>
                    )}
                    {content.textContent && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {content.textContent.substring(0, 150)}...
                      </p>
                    )}
                  </div>
                  <button
                    onClick={async () => {
                      if (confirm("Are you sure you want to remove this content?")) {
                        const res = await apiFetch(`/modules/${id}/content/${content.id}`, { method: "DELETE" });
                        if (res.success) fetchModule();
                        else alert(res.message || "Failed to remove content");
                      }
                    }}
                    className="p-2 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-400/10 rounded-lg transition-colors"
                    title="Remove Content"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-slate-400 dark:text-slate-500">No content added yet. Click "Add Content" to begin.</p>
            </div>
          )}
        </div>

        {/* MCQ Assessment Section */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 mt-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">MCQ Assessment</h2>
            <button
              onClick={() => setShowAddQuestion(!showAddQuestion)}
              className="flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-500 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Add Question
            </button>
          </div>

          {/* Add Question Form */}
          {showAddQuestion && (
            <div className="mb-6 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-5">
              <form onSubmit={handleAddQuestion} className="space-y-4">
                {questionError && (
                  <div className="mb-4 flex items-start gap-3 rounded-lg bg-red-50 border border-red-200 dark:bg-red-500/10 dark:border-red-500/30 px-4 py-3 text-sm text-red-700 dark:text-red-300">
                    <span>{questionError}</span>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5">Question Text <span className="text-red-600 dark:text-red-400">*</span></label>
                  <textarea required value={questionText} onChange={(e) => setQuestionText(e.target.value)} rows={3}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-4 py-2.5 text-slate-900 dark:text-white outline-none focus:border-amber-500 transition-colors resize-none" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5">Marks <span className="text-red-600 dark:text-red-400">*</span></label>
                    <input type="number" min={1} required value={marks} onChange={(e) => setMarks(Number(e.target.value))}
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-4 py-2.5 text-slate-900 dark:text-white outline-none focus:border-amber-500 transition-colors" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5">Sequence Order <span className="text-red-600 dark:text-red-400">*</span></label>
                    <input type="number" min={1} required value={sequenceOrder} onChange={(e) => setSequenceOrder(Number(e.target.value))}
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-4 py-2.5 text-slate-900 dark:text-white outline-none focus:border-amber-500 transition-colors" />
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">Options (Exactly 4, Select 1 Correct)</label>
                  {options.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <input 
                        type="radio" 
                        name="correctOption" 
                        checked={opt.isCorrect}
                        onChange={(e) => handleOptionChange(idx, 'isCorrect', e.target.checked)}
                        className="w-5 h-5 text-amber-500 bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 focus:ring-amber-500 cursor-pointer"
                      />
                      <input 
                        type="text" 
                        required 
                        value={opt.optionText} 
                        onChange={(e) => handleOptionChange(idx, 'optionText', e.target.value)}
                        placeholder={`Option ${idx + 1}`}
                        className={`flex-1 rounded-lg border px-4 py-2 text-slate-900 dark:text-white outline-none transition-colors ${opt.isCorrect ? 'bg-amber-50 border-amber-300 dark:bg-amber-950/20 dark:border-amber-500/50 focus:border-amber-500' : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 focus:border-amber-500'}`}
                      />
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-3 pt-4">
                  <button type="submit" disabled={addQuestionLoading}
                    className="flex items-center gap-2 rounded-lg bg-amber-600 px-5 py-2 text-sm font-semibold text-white hover:bg-amber-500 disabled:opacity-50 transition-colors">
                    {addQuestionLoading ? "Adding..." : "Add Question"}
                  </button>
                  <button type="button" onClick={() => setShowAddQuestion(false)}
                    className="rounded-lg border border-slate-300 dark:border-slate-700 px-5 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Question List */}
          {module.questions && module.questions.length > 0 ? (
            <div className="space-y-4">
              {module.questions.map((q) => (
                <div key={q.id} className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-lg p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm font-bold text-slate-600 dark:text-slate-300">
                        {q.sequenceOrder}
                      </div>
                      <div>
                        <h4 className="text-slate-900 dark:text-white font-medium">{q.questionText}</h4>
                        <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">{q.marks} Marks</span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pl-11">
                    {q.options.map((opt) => (
                      <div key={opt.id} className={`flex items-center gap-2 p-2 rounded border ${opt.isCorrect ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/30' : 'bg-slate-100/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50'}`}>
                        <div className={`w-3 h-3 rounded-full flex-shrink-0 ${opt.isCorrect ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
                        <span className={`text-sm ${opt.isCorrect ? 'text-emerald-700 dark:text-emerald-300 font-medium' : 'text-slate-500 dark:text-slate-400'}`}>{opt.optionText}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-slate-400 dark:text-slate-500">No questions added yet. Click "Add Question" to build the MCQ.</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
