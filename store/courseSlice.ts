import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface Course {
  id: string;
  title: string;
  description: string;
  status: string;
  createdAt: string;
}

interface CourseState {
  courses: Course[];
  loading: boolean;
  error: string | null;
}

const initialState: CourseState = {
  courses: [],
  loading: false,
  error: null,
};

const courseSlice = createSlice({
  name: "course",
  initialState,
  reducers: {
    setCourses(state, action: PayloadAction<Course[]>) {
      state.courses = action.payload;
    },
    addCourse(state, action: PayloadAction<Course>) {
      state.courses.push(action.payload);
    },
    updateCourseStore(state, action: PayloadAction<Course>) {
      const index = state.courses.findIndex((c) => c.id === action.payload.id);
      if (index !== -1) {
        state.courses[index] = action.payload;
      }
    },
    deleteCourseStore(state, action: PayloadAction<string>) {
      state.courses = state.courses.filter((c) => c.id !== action.payload);
    },
    setCourseLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setCourseError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
  },
});

export const {
  setCourses,
  addCourse,
  updateCourseStore,
  deleteCourseStore,
  setCourseLoading,
  setCourseError,
} = courseSlice.actions;

export default courseSlice.reducer;
