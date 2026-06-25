import {
  createParticipant,
  createResult,
  deleteParticipant,
  deleteResult,
  deletePerformanceReview,
  filterParticipants,
  filterResults,
  filterPerformanceReviews,
  getPerformanceReview,
  updateParticipant,
  updateResult,
  upsertPerformanceReview
} from "@/lib/cloudStore";

const disabledMessage = "Base44 foi desativado neste site.";
const unavailable = async () => {
  throw new Error(disabledMessage);
};

export const base44 = {
  auth: {
    me: unavailable,
    loginViaEmailPassword: unavailable,
    loginWithProvider: unavailable,
    resetPasswordRequest: unavailable,
    resetPassword: unavailable,
    redirectToLogin: () => {
      window.location.href = "/register";
    },
    logout: () => {
      window.localStorage.removeItem("base44_access_token");
    }
  },
  entities: {
    TestParticipant: {
      create: async (data) => createParticipant(data),
      filter: async (filter = {}, sort, limit) => filterParticipants(filter, sort, limit),
      update: async (id, patch) => updateParticipant(id, patch),
      delete: async (id) => deleteParticipant(id)
    },
    TestResult: {
      create: async (data) => createResult(data),
      filter: async (filter = {}, sort, limit) => filterResults(filter, sort, limit),
      update: async (id, patch) => updateResult(id, patch),
      delete: async (id) => deleteResult(id)
    },
    PerformanceReview: {
      create: async (data) => upsertPerformanceReview(data),
      filter: async (filter = {}, sort, limit) => filterPerformanceReviews(filter, sort, limit),
      get: async (id) => getPerformanceReview(id),
      update: async (id, patch) => upsertPerformanceReview({ ...patch, result_id: patch.result_id || id }),
      delete: async (id) => deletePerformanceReview(id)
    }
  },
  integrations: {
    Core: {
      InvokeLLM: unavailable
    }
  },
  functions: {
    invoke: unavailable
  }
};
