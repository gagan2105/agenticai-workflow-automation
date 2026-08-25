// Simple mock/wrapper for BullMQ in-memory execution fallback
module.exports = {
  addJob: async (name, data) => {
    console.log(`[Queue Mock] Adding background job: ${name}`, data);
  },
};
