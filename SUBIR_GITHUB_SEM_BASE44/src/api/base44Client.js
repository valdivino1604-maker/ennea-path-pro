import {
  createParticipant,
  createResult,
  filterParticipants,
  filterResults,
  updateParticipant,
  updateResult
} from "@/lib/localStore";

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
      update: async (id, patch) => updateParticipant(id, patch)
    },
    TestResult: {
      create: async (data) => createResult(data),
      filter: async (filter = {}, sort, limit) => filterResults(filter, sort, limit),
      update: async (id, patch) => updateResult(id, patch)
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
