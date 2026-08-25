import { create } from 'zustand';
import api from '../lib/axios';

const useWorkflowStore = create((set, get) => ({
  workflows: [],
  currentWorkflow: null,
  isLoading: false,
  error: null,

  fetchWorkflows: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.get('/workflows');
      set({ workflows: data.workflows || [], isLoading: false });
    } catch (err) {
      set({ error: err.response?.data?.message || 'Failed to load workflows', isLoading: false });
    }
  },

  setCurrentWorkflow: (workflow) => set({ currentWorkflow: workflow }),

  saveWorkflow: async (workflowData) => {
    set({ isLoading: true, error: null });
    try {
      const { currentWorkflow } = get();
      let response;
      if (currentWorkflow?.id || currentWorkflow?._id) {
        const id = currentWorkflow.id || currentWorkflow._id;
        response = await api.put(`/workflows/${id}`, workflowData);
      } else {
        response = await api.post('/workflows', workflowData);
      }
      set({ currentWorkflow: response.data.workflow, isLoading: false });
      return { success: true, workflow: response.data.workflow };
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to save workflow';
      set({ error: message, isLoading: false });
      return { success: false, message };
    }
  },

  generateWorkflow: async (prompt) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.post('/workflows/generate', { prompt });
      set({ currentWorkflow: data.workflow, isLoading: false });
      return { success: true, workflow: data.workflow };
    } catch (err) {
      const message = err.response?.data?.message || 'AI generation failed';
      set({ error: message, isLoading: false });
      return { success: false, message };
    }
  },

  clearCurrentWorkflow: () => set({ currentWorkflow: null }),
  clearError: () => set({ error: null }),
}));

export default useWorkflowStore;
