import { backendUrl } from "../config";

// ... existing code ...
const response = await axios.post(`${backendUrl}/contact`, formData, {
  headers: {
    "Content-Type": "application/json",
  },
});
// ... existing code ...
